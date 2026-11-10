// E: the two chord tasks, built from today's shipped SST grid. The variety task's answer is the box with the wider
// P10–P90 spread; the groups task's answer is the chord's own group count, for the one-group or the two-group box; both
// are registered in the one task list, and the groups task's tones sit at the ocean rule's pitch.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mapVoice } from "@/lib/audio/mapping-maths";
import { readUint16LE } from "@/lib/data/grid";
import type { SstMetadata } from "@/types/data-contract";
import { buildTasks, TASK_IDS } from "../tasks";
import { cvTasks, CV_TASK_IDS } from ".";
import { boxViews } from "./views";

const root = new URL("../../../../public/data/latest/", import.meta.url);
const meta = JSON.parse(readFileSync(new URL("sst.json", root), "utf8")) as SstMetadata;
const bin = readFileSync(new URL("sst.bin", root));
const sst = { meta, codes: readUint16LE(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), meta.grid) };
const spread = (id: string) => {
  const v = boxViews(sst).find((x) => x.box.id === id);
  return (v?.stats.p90 ?? 0) - (v?.stats.p10 ?? 0);
};

describe("chord tasks", () => {
  test("registered in the one task list", () => {
    expect(TASK_IDS).toEqual(expect.arrayContaining([...CV_TASK_IDS]));
    const ids = buildTasks({ pairs: [], places: [], rainAt: () => ({ mmPerHour: null, phase: "nodata" }), heat: { place: "x", A: { window: [0, 0], years: [], values: [], mean: 0, spread: 0, n_years: 0 }, B: { window: [0, 0], years: [], values: [], mean: 0, spread: 0, n_years: 0 } }, sst, cvPick: 0 }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining([...CV_TASK_IDS]));
  });

  test("variety: the answer is the wider spread", () => {
    const [variety] = cvTasks({ sst, cvPick: 0 });
    expect(variety?.id).toBe("chordVariety");
    if (!variety) return;
    const wider = spread(variety.params.a) > spread(variety.params.b) ? "first" : "second";
    expect(variety.correct).toBe(wider);
  });

  test("groups: one-group and two-group boxes, answers from the chord's own groups, tones at the ocean rule", () => {
    for (const pick of [0, 1] as const) {
      const groups = cvTasks({ sst, cvPick: pick })[1];
      expect(groups?.id).toBe("chordGroups");
      if (!groups || groups.sound.kind !== "chord") continue;
      const n = boxViews(sst).find((v) => v.box.id === groups.params.box)?.groups.length;
      expect(groups.correct).toBe(n === 2 ? "two" : "one");
      for (const tone of groups.sound.tones) expect(tone.hz).toBeCloseTo(mapVoice("ocean", tone.value) ?? Number.NaN, 9);
    }
  });

  test("no SST: no chord tasks", () => {
    expect(cvTasks({ sst: null })).toEqual([]);
  });
});
