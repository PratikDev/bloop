import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { readUint16LE, readUint8 } from "@/lib/data/grid";
import { NAMED_BOXES } from "@/lib/cv/boxes";
import { boxStats } from "@/lib/cv/boxes";
import { latestRainSource, officialSource, sequenceRainSource, sstSource, type ReadSource } from "@/lib/cv/read-source";
import type { OfficialManifest, RainMetadata, SequenceIndex, SstMetadata } from "@/types/data-contract";

const pub = (rel: string) => new URL(`../../public/data/${rel}`, import.meta.url);
const json = <T,>(rel: string): T => JSON.parse(readFileSync(pub(rel), "utf8")) as T;
const buf = (rel: string) => {
  const b = readFileSync(pub(rel));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const gz = (rel: string) => {
  const b = gunzipSync(readFileSync(pub(rel)));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

const records: Record<string, ReadSource[]> = {};
const sstMeta = json<SstMetadata>("latest/sst.json");
records.live_sst_5101 = [sstSource({ meta: sstMeta, codes: readUint16LE(buf("latest/sst.bin"), sstMeta.grid) }, "SST")];
const rainMeta = json<RainMetadata>("latest/rain.json");
records.rain_latest_4285 = [
  latestRainSource({ meta: rainMeta, codes: readUint16LE(buf("latest/rain.bin"), rainMeta.grid), phases: readUint8(buf(`latest/${rainMeta.grid.phase_file}`), rainMeta.grid) }, "Rain"),
];
const seq = json<SequenceIndex>("sequence/index.json");
const size = { width: seq.grid.width, height: seq.grid.height };
records.rain_sequence_4285 = seq.frames.map((f) => sequenceRainSource(size, readUint8(gz(`sequence/${f.grid}`), size), f.time_utc, "Rain"));
const m = json<OfficialManifest>("official/currents_3912/manifest.json");
const layer = m.layers.find((l) => l.id === "sst");
if (!layer) throw new Error("3912 has no sst layer");
const cell = layer.grid.width * layer.grid.height;
const steps = layer.chunks.flatMap((c) => {
  const codes = new Uint16Array(gz(`official/currents_3912/${c.file}`));
  return Array.from({ length: c.t1 - c.t0 }, (_, i) => codes.subarray(i * cell, (i + 1) * cell));
});
records.currents_3912_sst = steps.map((_, t) => officialSource("currents_3912", { layer, steps }, t, "ocean"));

const out = Object.fromEntries(
  Object.entries(records).map(([id, frames]) => [
    id,
    {
      axis: frames[0].axis,
      frames: frames.map((s) => ({
        t: s.timeUtc,
        boxes: Object.fromEntries(
          NAMED_BOXES.map((b) => {
            const { n, nodataPct, p10, p50, p90, hist } = boxStats(s.grid, b.bounds, s.axis);
            return [b.id, { n, nodata_pct: nodataPct, p10, p50, p90, hist }];
          }),
        ),
      })),
    },
  ]),
);
process.stdout.write(JSON.stringify(out));
