// Record health, app side (run by `npm run health`, which writes the plan first: pipeline/health/__main__.py).
// For every playable official and related record, in Chromium and Firefox: open it; the needle starts on a value;
// play; drop the needle at three points with values and log the audio output level (an analyser tapped in front of
// the AudioContext destination by an init script; the app is not changed) and the value line; the provenance card
// shows the manifest's period, credit, licence and checks; a pattern-only record shows no number; no console errors.
// Also the live layer (SST, rain): the value line changes as the needle moves and the level is above zero.
// Results: data_raw/_tmp/health/app-<browser>/<record>.json, one test per record (read back into docs/HEALTH.md).
import { expect, test, type Page } from "@playwright/test";
import { AUDIBLE, heard, level, open, SETTLE_MS, start } from "./lib/app";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface PlanPoint { lat: number; lon: number; fx: number; fy: number }
interface PlanRecord {
  record: string; title: string; tab: "official" | "related"; period: string; credit: string; licence_start: string;
  pattern_only: boolean; checks: string[]; options: Record<string, { start_has_value: boolean; sparse?: boolean; points: PlanPoint[] }>;
}
interface AppResult { ok: boolean; plays: boolean; note: string; start: string; texts: string[]; levels: number[]; errors: string[] }

const DIR = join(process.cwd(), "data_raw", "_tmp", "health");
const PLAN = join(DIR, "plan.json");
const NO_VALUE = "No value here";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/'/gu, "\\x27");

/** The needle's place on a braille value line ("… 21.5N 89.8E …"). */
const place = (s: string) => /\d+(?:\.\d+)?[NS] \d+(?:\.\d+)?[EW]/u.exec(s)?.[0] ?? s;

/** The reading after "place: " (the place itself carries coordinates), without the layer's status statement in
 *  brackets (e.g. "(pattern only: ρ 0.05 vs IMERG …)": the check's statistic, not a value). */
const valuePart = (s: string) => s.split(": ").slice(1).join(": ").split(" (")[0];

async function checkRecord(page: Page, p: PlanRecord, errors: string[]): Promise<AppResult> {
  const before = errors.length;
  const notes: string[] = [];
  const name = p.tab === "official" ? new RegExp(`^${esc(p.title)}$`, "u") : new RegExp(`^${esc(p.title)}( \\(.*\\))?$`, "u");
  await page.getByRole("button", { name }).first().click();
  const section = page.locator('section[aria-labelledby="official-heading"]');
  const play = section.getByRole("button", { name: "Play", exact: true });
  await expect(play).toBeEnabled({ timeout: 60_000 });
  const reading = section.locator('p[aria-live="off"]').first();
  await expect(reading).toBeVisible({ timeout: 15_000 });
  const startText = await reading.innerText();
  if (startText.includes(NO_VALUE)) notes.push("starts on no value");
  await play.click();
  const canvas = section.locator("canvas[role=img]").first();
  const points = Object.values(p.options)[0]?.points ?? [];
  const texts: string[] = [];
  const levels: number[] = [];
  for (const pt of points) {
    // In view before every click: a box measured off-screen sent a click to the top bar's mode tabs (forest_4950).
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) break;
    await page.mouse.click(box.x + pt.fx * box.width, box.y + Math.min(0.999, pt.fy) * box.height);
    await page.waitForTimeout(SETTLE_MS);
    texts.push(await reading.innerText());
    levels.push(await heard(page, 1500));
  }
  await section.getByRole("button", { name: "Pause", exact: true }).click();
  if (texts.some((x) => x.includes(NO_VALUE))) notes.push(Object.values(p.options)[0]?.sparse
    ? "a dropped needle read no value (data: no cell has a value at every step, so the needle falls on no value as it plays)"
    : "a dropped needle read no value");
  if (!levels.some((l) => l > AUDIBLE)) notes.push(`silent (max level ${Math.max(0, ...levels).toExponential(1)})`);
  const card = section.locator('section[aria-labelledby="official-provenance"]');
  await expect(card).toBeVisible({ timeout: 15_000 });
  const prov = await card.innerText();
  for (const [what, s] of [["period", p.period], ["credit", p.credit], ["licence", p.licence_start]] as const) {
    if (s && !prov.includes(s)) notes.push(`${what} not shown as in the manifest`);
  }
  const missing = p.checks.filter((c) => !prov.includes(c));
  if (missing.length) notes.push(`${missing.length} check titles missing`);
  if (p.pattern_only && [startText, ...texts].some((x) => /\d/u.test(valuePart(x)))) notes.push("pattern-only record shows a number");
  const errs = errors.slice(before);
  if (errs.length) notes.push(`${errs.length} console errors: ${errs[0].slice(0, 120)}`);
  const plays = !startText.includes(NO_VALUE) && levels.some((l) => l > AUDIBLE);
  return { ok: notes.length === 0, plays, note: notes.join("; ") || `levels ${levels.map((l) => l.toExponential(1)).join(", ")}`,
    start: startText, texts, levels, errors: errs };
}

async function checkLive(page: Page, errors: string[]): Promise<Record<string, AppResult>> {
  const out: Record<string, AppResult> = {};
  for (const [id, voice] of [["sst", "SST"], ["rain", "Rain"]] as const) {
    const before = errors.length;
    await page.locator("#sound-map").focus();
    await page.keyboard.press("b");
    const voices = page.getByRole("group", { name: "Voice" });
    if (await voices.count()) await voices.getByRole("button", { name: voice, exact: true }).click();
    // Rain's shape line opens "Through time" (arrows step the 48 frames at one point); "Along the latitude" moves the needle.
    const shapes = page.getByRole("group", { name: "Shape shows" });
    if (await shapes.count()) await shapes.getByRole("button", { name: "Along the latitude", exact: true }).click();
    const value = page.getByTestId("braille-value");
    await expect(value).toHaveValue(/\S/u);
    const first = await value.inputValue();
    await page.getByTestId("braille-shape").focus();
    const texts = [first];
    const levels: number[] = [];
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 5; k++) await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(SETTLE_MS);
      texts.push(await value.inputValue());
      levels.push(await level(page));
    }
    await page.getByRole("button", { name: "Close braille explorer" }).click().catch(() => page.keyboard.press("Escape"));
    const notes: string[] = [];
    if (new Set(texts.map(place)).size < 2) notes.push("the needle did not move with the arrows (same place on the value line)");
    if (!levels.some((l) => l > AUDIBLE)) notes.push("silent");
    const errs = errors.slice(before);
    if (errs.length) notes.push(`${errs.length} console errors: ${errs[0].slice(0, 120)}`);
    out[id] = { ok: notes.length === 0, plays: levels.some((l) => l > AUDIBLE), note: notes.join("; ") || `levels ${levels.map((l) => l.toExponential(1)).join(", ")}`,
      start: first, texts, levels, errors: errs };
  }
  out.sequence = out.rain;
  return out;
}

const plan = existsSync(PLAN) ? (JSON.parse(readFileSync(PLAN, "utf8")) as Record<string, PlanRecord>) : {};
const PER_TEST_MS = 120_000;

/** One test per record (and one for the live layer), each with its own time limit. The app is started once per worker
 *  and reused (starting it is most of a check's cost: ~15 s of CPU, and the machine is CPU-bound); a check that fails
 *  or times out marks the page for a fresh start, so one record that hangs never takes the records after it down. */
interface Shared { page: Page; errors: string[]; started: boolean; fresh: boolean }
const it = test.extend<object, { app: Shared }>({
  app: [async ({ browser }, use, info) => {
    const u = info.project.use;
    const page = await browser.newPage({ baseURL: u.baseURL, viewport: u.viewport, userAgent: u.userAgent,
      deviceScaleFactor: u.deviceScaleFactor, isMobile: u.isMobile, hasTouch: u.hasTouch });
    const app: Shared = { page, errors: [], started: false, fresh: true };
    page.on("console", (m) => { if (m.type() === "error") app.errors.push(m.text()); });
    page.on("pageerror", (e) => app.errors.push(e.message));
    await use(app);
    await page.close();
  }, { scope: "worker" }],
});

async function run(app: Shared, browserName: string, ids: string[], check: (errors: string[]) => Promise<Record<string, AppResult>>) {
  it.setTimeout(PER_TEST_MS);
  const dir = join(DIR, `app-${browserName}`);
  mkdirSync(dir, { recursive: true });
  const before = app.errors.length;
  const fail = (e: Error): AppResult => ({ ok: false, plays: false, note: `could not check: ${e.message.split("\n")[0].replace(/\u001b\[[0-9;]*m/gu, "").slice(0, 160)}`,
    start: "", texts: [], levels: [], errors: app.errors.slice(before, before + 3) });
  let out: Record<string, AppResult>;
  const reopen = app.fresh;
  app.fresh = false;
  try {
    if (!app.started) { await start(app.page); app.started = true; }
    else if (reopen) await open(app.page);
    out = await check(app.errors);
  } catch (e) { out = Object.fromEntries(ids.map((id) => [id, fail(e as Error)])); }
  for (const [id, r] of Object.entries(out)) writeFileSync(join(dir, `${id}.json`), JSON.stringify(r, null, 1), "utf8");
  const failed = Object.entries(out).filter(([, r]) => !r.ok).map(([id, r]) => `${id}: ${r.note}`);
  expect(failed, failed.join("\n")).toEqual([]);
}

// A test that failed or timed out leaves the shared page in an unknown state: the next one starts the app afresh.
it.afterEach(async ({ app }, info) => { if (info.status !== info.expectedStatus) app.fresh = true; });

it("live layer: SST and rain move with the needle and sound", async ({ app, browserName }) => {
  it.skip(!existsSync(PLAN), "run `npm run health` (it writes the plan first)");
  await run(app, browserName, ["sst", "rain", "sequence"], (errors) => checkLive(app.page, errors));
});

for (const [id, p] of Object.entries(plan)) {
  it(`record ${id} opens, starts on a value, plays at three points, labels as its manifest`, async ({ app, browserName }) => {
    await run(app, browserName, [id], async (errors) => {
      await app.page.getByRole("tab", { name: "Official" }).click();
      return { [id]: await checkRecord(app.page, p, errors) };
    });
  });
}
