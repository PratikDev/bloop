// P5, NASA's method: in NASA mode the pitch follows the distance from the centre (and the time the angle); in Bloop mode
// the pitch follows the value by the Ocean rule (and the time the distance); the two play the same points of one frame.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import type { SstField } from "@/lib/data/latest";
import { readData } from "@/lib/i18n/data-sentences";
import type { SstMetadata } from "@/types/data-contract";
import { bloopNotes, instrumentFor, nasaNotes, radarPoints, RADAR_VOICE, turnSeconds, type MethodManifest } from "./radar";

const meta = readData<SstMetadata>("latest/sst.json");
const buf = readFileSync("public/data/latest/sst.bin");
const sst: SstField = { meta, codes: new Uint16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) };
const manifest = readData<MethodManifest>("official/sonification_13786/manifest.json");
const speed = manifest.analysis?.angular_speed_deg_s ?? 0;
/** A centre in the Bay of Bengal's reach: the first FIRMS box's centre would do; Dhaka's position from the night-lights file. */
const dhaka = readData<{ cities: Record<string, { lat: number; lon: number }> }>("context/nightlights.json").cities.Dhaka;
const points = radarPoints(sst, dhaka);

describe("NASA mode vs Bloop mode on one frame", () => {
  test("the method's speed is the movie's own (the manifest's analysis)", () => {
    expect(speed).not.toBe(0);
    expect(turnSeconds(speed)).toBeCloseTo(360 / Math.abs(speed), 9);
  });
  test("there are ocean points, and land is left out", () => {
    expect(points.length).toBeGreaterThan(10);
    for (const p of points) expect(Number.isFinite(p.valueC)).toBe(true);
  });
  test("NASA mode: pitch follows distance (the radarDistance rule), the same at every angle; instrument by colour class", () => {
    const rule = continuousRule(RADAR_VOICE);
    const notes = nasaNotes(points, speed, meta.value_range);
    expect(notes.length).toBe(points.length);
    for (const n of notes) {
      expect(n.hz).toBeCloseTo(mapContinuous(n.point.km, rule) ?? -1, 9);
      expect(n.instrument).toBe(instrumentFor(n.point.valueC, meta.value_range));
    }
    const byKm = [...notes].sort((a, b) => a.point.km - b.point.km);
    for (let i = 1; i < byKm.length; i++) expect(byKm[i].hz).toBeGreaterThanOrEqual(byKm[i - 1].hz);
    for (let i = 1; i < notes.length; i++) expect(notes[i].timeSec).toBeGreaterThanOrEqual(notes[i - 1].timeSec);
  });
  test("Bloop mode: pitch follows the value by the Ocean rule; time follows distance", () => {
    const ocean = continuousRule("ocean");
    const notes = bloopNotes(points, speed);
    expect(notes.length).toBe(points.length);
    for (const n of notes) {
      expect(n.hz).toBeCloseTo(mapContinuous(n.point.valueC, ocean) ?? -1, 9);
      expect(n.timeSec).toBeCloseTo((n.point.km / continuousRule(RADAR_VOICE).input.max) * turnSeconds(speed), 9);
    }
  });
});
