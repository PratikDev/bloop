import { describe, expect, test } from "bun:test";
import type { SweepPoint } from "@/lib/audio/types";
import { bindT, LANGS, type Lang } from "@/lib/i18n";
import { sweepTracks, type SweepRun } from "./sweep";
import { timelapseTracks } from "./timelapse";
import { vttFiles, type TrackText } from "./tracks";
import { chain, cueAt, cueData, cuesStarting, parseVtt, toVtt, vttTimestamp } from "./vtt";

const text = (lang: Lang = "en"): TrackText => ({
  t: bindT(lang),
  lang,
  places: { name: (at) => (at.lon > 91 ? "Chattogram, Bangladesh" : "Bay of Bengal"), region: (at) => (at.lat > 22 ? "Chattogram" : "Bay of Bengal") },
});

const pt = (lat: number, lon: number, valueC: number | null, mmPerHour: number | null = 0, phase: SweepPoint["phase"] = "dry"): SweepPoint => ({ lat, lon, valueC, mmPerHour, phase });

describe("WebVTT", () => {
  test("timestamps carry hours, minutes, seconds and milliseconds", () => {
    expect(vttTimestamp(0)).toBe("00:00:00.000");
    expect(vttTimestamp(83.5)).toBe("00:01:23.500");
    expect(vttTimestamp(3600 + 61.0004)).toBe("01:01:01.000");
  });

  test("a file round-trips: header, NOTE, cues, escaped markup", () => {
    const cues = [
      { start: 0, end: 1.5, text: "[tones begin: a < b & c > d]" },
      { start: 1.5, end: 3, text: '{"place":"Dhaka","unit":"°C","value":null}' },
    ];
    const file = toVtt(cues, "a note");
    expect(file.startsWith("WEBVTT\n\nNOTE a note\n\n1\n00:00:00.000 --> 00:00:01.500\n")).toBe(true);
    expect(file).toContain("&lt; b &amp; c &gt;");
    expect(parseVtt(file)).toEqual(cues);
  });

  test("the cue showing, the cues passed, a metadata cue's data", () => {
    const cues = chain([{ start: 0, text: "a" }, { start: 2, text: "b" }], 5);
    expect(cues.map((c) => c.end)).toEqual([2, 5]);
    expect(cueAt(cues, 1.9)?.text).toBe("a");
    expect(cueAt(cues, 2)?.text).toBe("b");
    expect(cueAt(cues, 5)).toBeNull();
    expect(cuesStarting(cues, -1, 0).map((c) => c.text)).toEqual(["a"]);
    expect(cuesStarting(cues, 0, 2).map((c) => c.text)).toEqual(["b"]);
    expect(cueData({ start: 0, end: 1, text: "not json" })).toBeNull();
  });
});

const sweep: SweepRun = {
  // Ring 1: warm, then land (a tick), then the coolest; ring 2: the warmest and the heaviest rain.
  points: [pt(22, 91, 28.4), pt(22, 92, null), pt(21, 90, 27.1, 2, "liquid"), pt(20, 89, 30.2, 6.5, "liquid"), pt(19, 92, 29)],
  ring: [0, 0, 0, 1, 1],
  ringDeg: [5, 10],
  center: { lat: 22.36, lon: 91.78 },
  stepSec: 0.08,
  track: "both",
};

describe("the sweep's tracks", () => {
  test("one metadata cue per point, at the time both engines schedule it, with the point's value", () => {
    const { metadata } = sweepTracks(sweep, text());
    expect(metadata).toHaveLength(5);
    expect(metadata[3].start).toBeCloseTo(0.24, 6);
    const d = cueData(metadata[3])!;
    expect(d).toMatchObject({ lat: 20, lon: 89, value: 30.2, unit: "°C", place: "Bay of Bengal", time: null });
    expect(cueData(metadata[1])!.note).toBe("land or no ocean data");
  });

  test("a chapter per ring, and captions for the begin, the extremes, the first tick and the end, in time order", () => {
    const { chapters, captions } = sweepTracks(sweep, text());
    expect(chapters.map((c) => c.text)).toEqual(["Ring 1 of 2: 5 degrees out from Chattogram, Bangladesh", "Ring 2 of 2: 10 degrees out from Chattogram, Bangladesh"]);
    expect(captions.map((c) => c.text)).toEqual([
      "[tones begin: the sweep moves outward from Chattogram, Bangladesh]",
      "[soft tick, then silence: no ocean data, Chattogram, Bangladesh]",
      "[lowest tone: the coolest water in the sweep, 27.1 degrees Celsius, Bay of Bengal]",
      "[highest tone: the warmest water in the sweep, 30.2 degrees Celsius, Bay of Bengal]",
      "[densest drops: the heaviest rain in the sweep, 6.5 millimetres an hour, Bay of Bengal]",
      "[tones stop: the sweep is finished]",
    ]);
    for (let i = 1; i < captions.length; i++) expect(captions[i].start).toBeGreaterThanOrEqual(captions[i - 1].start);
  });

  test("the Rain track leaves the ocean's captions out and gives rain values", () => {
    const { metadata, captions } = sweepTracks({ ...sweep, track: "rain" }, text());
    expect(captions.some((c) => c.text.includes("tone:"))).toBe(false);
    expect(cueData(metadata[3])).toMatchObject({ value: 6.5, unit: "mm/h" });
  });

  test("Bangla tracks use Bangla digits from the slots", () => {
    const { captions } = sweepTracks(sweep, text("bn"));
    expect(captions.find((c) => c.text.includes("৩০.২"))).toBeDefined();
  });
});

describe("the time-lapse's tracks", () => {
  const frames = [pt(21, 90, null, 0, "dry"), pt(21, 90, null, 1.2, "liquid"), pt(22.5, 91.5, null, 14, "liquid"), pt(22.5, 91.5, null, null, "nodata"), pt(22.5, 91.5, null, 0, "dry")];
  const times = ["2026-11-08T00:00:00Z", "2026-11-08T00:30:00Z", "2026-11-08T01:00:00Z", "2026-11-08T01:30:00Z", "2026-11-08T02:00:00Z"];
  const run = { frames, times, stepSec: 0.5 };

  test("metadata carries each frame's own time; chapters follow the region", () => {
    const { metadata, chapters } = timelapseTracks(run, text());
    expect(cueData(metadata[2])).toMatchObject({ time: times[2], value: 14, unit: "mm/h" });
    expect(cueData(metadata[3])!.value).toBeNull();
    expect(chapters).toHaveLength(2);
    expect(chapters[1].start).toBe(1);
    expect(chapters[1].text.startsWith("Chattogram, from ")).toBe(true);
  });

  test("captions: begin, drops begin, the peak with its time, the no-data tick, drops stop, end", () => {
    const { captions } = timelapseTracks(run, text());
    const words = captions.map((c) => c.text.split(":")[0]);
    expect(words).toEqual(["[the time-lapse begins", "[drops begin", "[densest drops", "[soft tick, then silence", "[drops stop", "[drops stop"]);
    expect(captions[2].text).toContain("14 millimetres an hour");
  });

  test("vttFiles writes three files whose cues parse back to the tracks", () => {
    for (const lang of LANGS) {
      const x = text(lang);
      const tracks = timelapseTracks(run, x);
      const files = vttFiles(x, "timelapse", tracks);
      expect(parseVtt(files.captions).map((c) => c.text)).toEqual(tracks.captions.map((c) => c.text));
      expect(parseVtt(files.metadata).map(cueData)).toEqual(tracks.metadata.map(cueData));
      expect(files.chapters.startsWith("WEBVTT\n\nNOTE ")).toBe(true);
    }
  });
});
