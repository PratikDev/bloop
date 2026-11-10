// Check 5, the audio chain's pitch accuracy (CV/ML build, piece D; docs/audio/MIX.md). In headless Chromium, an
// OfflineAudioContext renders 100 notes across each voice's full input range, built as the engine builds them: the live
// SST and 3912 voices (the ocean rule: a sine gliding with setTargetAtTime over its 30 ms glide), one official voice
// (eic5147: the Jukebox tone voice, the same glide) and the chord (a fresh pad oscillator per tone, its PeriodicWave).
// The expected pitch of each note is mapVoice() on its value. Samples go to data_raw/_tmp/cv/check5/; the numbers come
// from pipeline/stats/check5_audio.py (numpy/scipy, interpolated FFT on the steady part).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { continuousRule, mapVoice } from "../../src/lib/audio/mapping-maths";
import { voiceSpec } from "../../src/lib/audio/mapping";
import { PARTIALS } from "../../src/lib/audio/layers/chord/voice";

const OUT = path.join(__dirname, "..", "..", "data_raw", "_tmp", "cv", "check5");
const NOTES = 100;
const NOTE_SEC = 0.4;
const FS = 48000;
const manifest3912 = { min: 0, max: 0 };

/** 100 values over [min, max], visited in a fixed scrambled order (large jumps between notes, the hard case). */
function values(min: number, max: number): number[] {
  const v = Array.from({ length: NOTES }, (_, i) => min + ((max - min) * i) / (NOTES - 1));
  return v.map((_, i) => v[(i * 37) % NOTES]);
}

test.skip(({ browserName }) => browserName !== "chromium", "rendered once, in Chromium (the spec's headless Chromium)");

test("render 100 notes per voice for Check 5", async ({ page }) => {
  const manifest = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "public/data/official/currents_3912/manifest.json"), "utf8")) as { layers: { id: string; value_range: [number, number] }[] };
  const layer = manifest.layers.find((l) => l.id === "sst");
  if (!layer) throw new Error("3912 has no sst layer");
  [manifest3912.min, manifest3912.max] = layer.value_range;
  const ocean = continuousRule("ocean").input;
  const eic = continuousRule("eic5147").input;
  const glide = (id: string) => (voiceSpec(id).sound.glideMs ?? 30) / 1000;
  const voices = [
    { id: "sst", rule: "ocean", kind: "sine", glide: glide("ocean"), vals: values(ocean.min, ocean.max) },
    { id: "ocean3912", rule: "ocean", kind: "sine", glide: glide("ocean"), vals: values(manifest3912.min, manifest3912.max) },
    { id: "eic5147", rule: "eic5147", kind: "sine", glide: glide("eic5147"), vals: values(eic.min, eic.max) },
    { id: "chord", rule: "ocean", kind: "pad", glide: 0, vals: values(ocean.min, ocean.max) },
  ].map((v) => ({ ...v, hz: v.vals.map((x) => mapVoice(v.rule, x) as number) }));
  await page.goto("about:blank");
  mkdirSync(OUT, { recursive: true });
  const meta: Record<string, unknown> = { fs: FS, note_sec: NOTE_SEC, voices: {} };
  for (const v of voices) {
    const b64 = await page.evaluate(
      async ({ v, FS, NOTE_SEC, PARTIALS }) => {
        const ctx = new OfflineAudioContext(1, Math.ceil(FS * NOTE_SEC * v.hz.length), FS);
        if (v.kind === "sine") {
          const osc = new OscillatorNode(ctx, { type: "sine", frequency: v.hz[0] });
          const g = new GainNode(ctx, { gain: 0.25 });
          osc.connect(g).connect(ctx.destination);
          v.hz.forEach((hz, i) => osc.frequency.setTargetAtTime(hz, i * NOTE_SEC, Math.max(v.glide, 0.001) / 3));
          osc.start(0);
        } else {
          const wave = new PeriodicWave(ctx, { real: new Float32Array(PARTIALS.length), imag: Float32Array.from(PARTIALS), disableNormalization: true });
          v.hz.forEach((hz, i) => {
            const osc = new OscillatorNode(ctx, { frequency: hz, periodicWave: wave });
            const g = new GainNode(ctx, { gain: 0.1 });
            osc.connect(g).connect(ctx.destination);
            osc.start(i * NOTE_SEC);
            osc.stop((i + 1) * NOTE_SEC);
          });
        }
        const data = (await ctx.startRendering()).getChannelData(0);
        const bytes = new Uint8Array(data.buffer);
        let s = "";
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(s);
      },
      { v, FS, NOTE_SEC, PARTIALS },
    );
    writeFileSync(path.join(OUT, `${v.id}.f32`), Buffer.from(b64, "base64"));
    (meta.voices as Record<string, unknown>)[v.id] = { rule: v.rule, kind: v.kind, glide_sec: v.glide, values: v.vals, hz: v.hz };
  }
  writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta));
});
