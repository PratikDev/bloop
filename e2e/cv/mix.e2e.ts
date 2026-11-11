// The mix pass (CV/ML build, piece D; docs/audio/MIX.md), on a build with the CV flags on. Records what the app sends to
// the speakers in each mode (a recorder taps every AudioContext's destination; the app is not changed) and measures it:
// true peak (must stay under the stated ceiling: no clipping), integrated loudness (BS.1770; must stay within the stated
// tolerance of docs/audio/mix_results.json), the mono fold-down, and the small-speaker check (200 Hz high-pass: Ocean
// stays a tone, Rain stays noise). Also renders the melody and the chord at their engine levels to measure the gap.
// UPDATE_MIX=1 (Chromium) rewrites mix_results.json from this run.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { CHORD_DB, chordPeak, melodyPeak, PARTIALS } from "../../src/lib/audio/layers/chord/voice";
import { filter, highpass, integratedLoudness, spectralFlatness, truePeakDb } from "../../src/lib/cv/loudness";
import { AUDIBLE, heard, navTo, start } from "../lib/app";
import { settle } from "../mentor/lib";

const RESULTS = path.join(__dirname, "..", "..", "docs", "audio", "mix_results.json");
/** The loudness target, the true-peak ceiling and the drift tolerance (docs/audio/MIX.md says why). */
export const TARGET_LUFS = -18;
export const CEILING_DBTP = -1;
export const TOLERANCE_LU = 3;
const SECONDS = Number(process.env.MIX_SECONDS ?? 10);
const SMALL_SPEAKER_HZ = 200;

const REC = `(() => {
  const connect = AudioNode.prototype.connect;
  const seen = new WeakMap();
  window.__cvChunks = []; window.__cvOn = false; window.__cvFs = 0;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (typeof AudioDestinationNode !== "undefined" && dest instanceof AudioDestinationNode && !seen.has(dest.context)) {
      const sp = dest.context.createScriptProcessor(4096, 2, 2);
      sp.onaudioprocess = (e) => { if (window.__cvOn) window.__cvChunks.push([e.inputBuffer.getChannelData(0).slice(), e.inputBuffer.getChannelData(1).slice()]); };
      connect.call(sp, dest);
      seen.set(dest.context, sp);
      window.__cvFs = dest.context.sampleRate;
    }
    if (typeof AudioDestinationNode !== "undefined" && dest instanceof AudioDestinationNode) connect.call(this, seen.get(dest.context));
    return connect.call(this, dest, ...rest);
  };
})();`;

interface Capture {
  fs: number;
  L: Float32Array;
  R: Float32Array;
}

async function capture(page: Page): Promise<Capture> {
  await page.evaluate(() => {
    const w = window as unknown as { __cvChunks: unknown[]; __cvOn: boolean };
    w.__cvChunks = [];
    w.__cvOn = true;
  });
  await page.waitForTimeout(SECONDS * 1000);
  const { fs, L, R } = await page.evaluate(() => {
    const w = window as unknown as { __cvChunks: [Float32Array, Float32Array][]; __cvOn: boolean; __cvFs: number };
    w.__cvOn = false;
    const b64 = (k: 0 | 1) => {
      const n = w.__cvChunks.reduce((s, c) => s + c[k].length, 0);
      const all = new Float32Array(n);
      let o = 0;
      for (const c of w.__cvChunks) all.set(c[k], (o += c[k].length) - c[k].length);
      const bytes = new Uint8Array(all.buffer);
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    return { fs: w.__cvFs, L: b64(0), R: b64(1) };
  });
  const f32 = (s: string) => {
    const b = Buffer.from(s, "base64");
    return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };
  return { fs, L: f32(L), R: f32(R) };
}

/** Mean flatness over a few windows from the middle of the capture (after a high-pass when asked). */
function flatness(c: Capture, hp?: number): number {
  const mono = Float64Array.from(c.L, (v, i) => (v + c.R[i]) / 2);
  const x = hp ? filter(mono, highpass(c.fs, hp)) : mono;
  const n = 2048;
  const starts = [0.3, 0.45, 0.6, 0.75].map((f) => Math.floor(f * (x.length - n)));
  return starts.reduce((s, a) => s + spectralFlatness(x.subarray(a, a + n), n), 0) / starts.length;
}

function measure(c: Capture) {
  const mono = Float32Array.from(c.L, (v, i) => (v + c.R[i]) / 2);
  return {
    lufs: integratedLoudness([c.L, c.R], c.fs),
    lufs_mono: integratedLoudness([mono, mono], c.fs),
    true_peak_dbtp: truePeakDb([c.L, c.R]),
    flatness: flatness(c),
    flatness_hp200: flatness(c, SMALL_SPEAKER_HZ),
  };
}

const MODES: { id: string; go: (page: Page) => Promise<void> }[] = [
  { id: "turntable", go: async (p) => navTo(p, "Turntable") },
  { id: "listen-ocean", go: async (p) => (await navTo(p, "Listen"), await mapKey(p, "1")) },
  // Rain at the start cursor may be dry (silence, not zero): the storm time-lapse plays the rain sequence.
  { id: "listen-rain", go: async (p) => (await navTo(p, "Listen"), await mapKey(p, "2"), await p.getByRole("button", { name: "Play storm time-lapse" }).click()) },
  { id: "listen-both", go: async (p) => (await navTo(p, "Listen"), await mapKey(p, "3")) },
  {
    id: "listen-ocean-chord",
    go: async (p) => {
      await navTo(p, "Listen");
      await mapKey(p, "1");
      const panel = p.getByTestId("jukebox-read");
      await panel.getByRole("button", { name: "What the jukebox read from this frame" }).click();
      await panel.getByRole("button", { name: "Chord: spread of values" }).click();
      await panel.getByRole("button", { name: "Gulf Stream", exact: true }).click();
    },
  },
  { id: "duet", go: async (p) => (await navTo(p, "Listen"), await mapKey(p, "1"), await mapKey(p, "u")) },
  { id: "then-vs-now", go: async (p) => (await navTo(p, "Then vs Now"), await p.getByRole("button", { name: "Play this part" }).click()) },
];

async function mapKey(page: Page, key: string) {
  await page.locator("#sound-map").focus();
  await page.keyboard.press(key);
}

test.describe.configure({ timeout: 180_000 });

/** Each mode in a fresh app (no state carried over from another mode's Esc). */
async function fresh(page: Page) {
  await page.addInitScript(REC);
  await start(page, { hide3d: true });
}

type Row = ReturnType<typeof measure>;
const reference = (): { modes: Record<string, Row> } | null => (existsSync(RESULTS) ? (JSON.parse(readFileSync(RESULTS, "utf8")) as { modes: Record<string, Row> }) : null);

function save(update: (doc: Record<string, unknown> & { modes: Record<string, Row> }) => void) {
  const doc = { generated_by: "e2e/cv/mix.e2e.ts", browser: "chromium", seconds: SECONDS, target_lufs: TARGET_LUFS, ceiling_dbtp: CEILING_DBTP, tolerance_lu: TOLERANCE_LU, chord_db_design: CHORD_DB, ...(reference() ?? {}), modes: reference()?.modes ?? {} };
  update(doc);
  writeFileSync(RESULTS, `${JSON.stringify(doc, null, 1)}\n`);
}

for (const m of MODES) {
  test(`${m.id}: under the true-peak ceiling, loudness within tolerance, mono fold-down holds`, async ({ page, browserName }) => {
    await fresh(page);
    await m.go(page);
    await settle(page, 1500);
    // A page that waits for a key: Space (the map, the Turntable) starts its sound.
    // (The storm time-lapse first loads its 48 frames: it is given longer, and Space would pause it.)
    if (m.id === "listen-rain") await heard(page, 20_000);
    else if ((await heard(page, 3000)) <= AUDIBLE) await page.keyboard.press(" ");
    const r = measure(await capture(page));
    console.log(m.id, JSON.stringify(r));
    if (process.env.UPDATE_MIX === "1" && browserName === "chromium") save((d) => (d.modes[m.id] = r));
    expect(Number.isFinite(r.lufs)).toBe(true); // heard
    expect(r.true_peak_dbtp).toBeLessThan(CEILING_DBTP);
    expect(Math.abs(r.lufs_mono - r.lufs)).toBeLessThanOrEqual(TOLERANCE_LU);
    const want = reference()?.modes[m.id]?.lufs;
    if (want !== undefined && want !== null && Number.isFinite(want)) expect(Math.abs(r.lufs - want)).toBeLessThanOrEqual(TOLERANCE_LU);
  });
}

test("small speakers: after a 200 Hz high-pass Ocean is still a tone and Rain still noise", () => {
  const ref = reference();
  test.skip(!ref?.modes["listen-ocean"] || !ref.modes["listen-rain"], "needs the recorded modes");
  expect(ref!.modes["listen-rain"].flatness_hp200).toBeGreaterThan(5 * ref!.modes["listen-ocean"].flatness_hp200);
});

test("the chord sits 6 to 10 dB under the melody (rendered at the engine's levels)", async ({ page, browserName }) => {
  await page.goto("about:blank");
  const db = await page.evaluate(
    async ({ hzM, gM, gC, PARTIALS }) => {
      const render = async (pad: boolean, gain: number) => {
        const ctx = new OfflineAudioContext(1, 48000, 48000);
        const osc = pad
          ? new OscillatorNode(ctx, { frequency: hzM, periodicWave: new PeriodicWave(ctx, { real: new Float32Array(PARTIALS.length), imag: Float32Array.from(PARTIALS), disableNormalization: true }) })
          : new OscillatorNode(ctx, { type: "sine", frequency: hzM });
        osc.connect(new GainNode(ctx, { gain })).connect(ctx.destination);
        osc.start();
        const d = (await ctx.startRendering()).getChannelData(0);
        return Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
      };
      return 20 * Math.log10((await render(true, gC)) / (await render(false, gM)));
    },
    { hzM: 440, gM: melodyPeak(), gC: chordPeak(), PARTIALS },
  );
  if (process.env.UPDATE_MIX === "1" && browserName === "chromium") save((d) => (d.chord_vs_melody_rms_db = db));
  expect(db).toBeLessThan(-6);
  expect(db).toBeGreaterThan(-10);
});
