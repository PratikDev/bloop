// UI review capture: every page at four sizes, plus eight states, against a production build on :3301.
// Writes 50%-scale JPEGs and contact sheets to docs/review/ and the measurements to docs/review/metrics.json.
// Run (Node 22.6+ strips the types): node scripts/review/capture.ts   (serve out/ on 3301 first; see docs/review/REVIEW.md)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { navTo, start } from "../../e2e/lib/app.ts";
import type { Report, Result } from "./capture-types.ts";
import { measure, type Settings } from "./measure.ts";
import { contactSheet, type Tile } from "./sheet.ts";


const BASE = process.env.REVIEW_URL ?? "http://localhost:3301";
const PAGES = ["/", "/listen", "/then-now", "/how", "/official", "/turntable", "/nope"];
const SIZES = [{ width: 1920, height: 1080 }, { width: 1536, height: 730 }, { width: 1280, height: 720 }, { width: 390, height: 844 }];
const STATE_SIZE = { width: 1440, height: 900 };
const OUT = join(process.cwd(), "docs/review");
const SHOTS = join(OUT, "shots");
const SETTLE_MS = 3500; // WebGL pages (software rendering) need a few seconds to draw
const SETTINGS: Settings = { maxOverlapPx: 2, minTextPx: 14, contrast: 4.5, coral: [255, 107, 74], cellPx: 10, latin: false };
const AXE = join(process.cwd(), "node_modules/axe-core/axe.min.js");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface AxeViolation { id: string; impact: string | null; nodes: { target: string[] }[] }
type AxeWindow = Window & { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: AxeViolation[] }> } };

const slug = (s: string) => (s === "/" ? "home" : s.replace(/[^a-z0-9]+/giu, "-").replace(/^-|-$/gu, ""));

/** Console errors and uncaught exceptions since the last call. */
function watchErrors(page: Page): () => string[] {
  let seen: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") seen.push(m.text()); });
  page.on("pageerror", (e) => seen.push(String(e)));
  return () => { const out = seen; seen = []; return out; };
}

async function axeSerious(page: Page): Promise<string[]> {
  if (!(await page.evaluate(() => "axe" in window))) await page.addScriptTag({ path: AXE });
  const found = await page.evaluate(async (tags) => {
    const r = await (window as unknown as AxeWindow).axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }));
  }, TAGS);
  return found.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.join(" | ")}`);
}

/** In-app navigation by address, so sound and language stay as a user's would. */
async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);
  await page.waitForTimeout(SETTLE_MS);
}

async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity), null, { timeout: 8000 }).catch(() => undefined);
}

/** Screenshot + measurements of the page as it is now. */
async function record(page: Page, drain: () => string[], file: string, latin = false): Promise<Result> {
  await settled(page);
  await page.screenshot({ path: file, type: "jpeg", quality: 72 });
  const measured = await page.evaluate(measure, { ...SETTINGS, latin });
  return { ...measured, axe: await axeSerious(page), consoleErrors: drain() };
}

async function fresh(browser: Awaited<ReturnType<typeof chromium.launch>>, viewport: { width: number; height: number }, extra: Parameters<typeof browser.newContext>[0] = {}): Promise<{ ctx: BrowserContext; page: Page; drain: () => string[] }> {
  const ctx = await browser.newContext({ baseURL: BASE, viewport, deviceScaleFactor: 0.5, ...extra });
  const page = await ctx.newPage();
  const drain = watchErrors(page);
  return { ctx, page, drain };
}

async function pagesAtSizes(browser: Awaited<ReturnType<typeof chromium.launch>>, report: Report): Promise<void> {
  for (const size of SIZES) {
    const key = `${size.width}x${size.height}`;
    const { ctx, page, drain } = await fresh(browser, size);
    await start(page);
    drain();
    for (const path of PAGES) {
      await go(page, path);
      (report.pages[path] ??= {})[key] = await record(page, drain, join(SHOTS, `${slug(path)}-${key}.jpg`));
      console.log(`captured ${path} @ ${key}`);
    }
    await ctx.close();
  }
}

/** Each state runs in its own context (language, motion and colour settings must not leak between them). */
async function states(browser: Awaited<ReturnType<typeof chromium.launch>>, report: Report): Promise<Tile[]> {
  const tiles: Tile[] = [];
  const add = async (name: string, page: Page, drain: () => string[], latin = false) => {
    const file = join(SHOTS, `state-${slug(name)}.jpg`);
    report.states[name] = await record(page, drain, file, latin);
    tiles.push({ label: name, file });
    console.log(`captured state ${name}`);
  };
  const bangla = async (page: Page) => { await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).click(); await page.waitForTimeout(800); };
  const dock = (page: Page) => page.getByRole("region", { name: "Player" });
  const more = async (page: Page) => { await dock(page).getByRole("button", { name: "More", exact: true }).click(); };

  { // Bangla mode on Home and Listen
    const { ctx, page, drain } = await fresh(browser, STATE_SIZE);
    await start(page); await bangla(page); drain();
    await go(page, "/"); await add("Bangla: Home", page, drain, true);
    await go(page, "/listen"); await add("Bangla: Listen", page, drain, true);
    await ctx.close();
  }
  { // The player sheet, the Braille explorer and the Mixer (all on Listen)
    const { ctx, page, drain } = await fresh(browser, STATE_SIZE);
    await start(page); drain();
    await more(page);
    await page.getByRole("button", { name: "Now playing" }).first().click();
    await page.getByRole("dialog", { name: "Now playing" }).waitFor();
    await page.waitForTimeout(1200);
    await add("Player sheet", page, drain);
    await page.keyboard.press("Escape"); await page.waitForTimeout(600);

    await page.getByRole("application").first().focus();
    await page.keyboard.press("b");
    await page.getByTestId("braille-value").waitFor({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(1000);
    await add("Braille explorer", page, drain);
    await page.keyboard.press("Escape"); await page.waitForTimeout(600);

    if (!(await dock(page).getByRole("button", { name: /^Mixer/u }).isVisible())) await more(page);
    await page.getByRole("button", { name: /^Mixer/u }).first().click();
    await page.getByRole("button", { name: "Mute Ocean" }).waitFor({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    await add("Mixer", page, drain);
    await ctx.close();
  }
  { // The Turntable after a click on its globe
    const { ctx, page, drain } = await fresh(browser, STATE_SIZE);
    await start(page);
    await navTo(page, "Turntable"); await page.waitForTimeout(SETTLE_MS); drain();
    const box = await page.getByRole("application").first().boundingBox();
    if (box) await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45);
    await page.waitForTimeout(SETTLE_MS);
    await add("Turntable: after a click", page, drain);
    await ctx.close();
  }
  { // Reduced motion on Home
    const { ctx, page, drain } = await fresh(browser, STATE_SIZE, { reducedMotion: "reduce" });
    await start(page); await go(page, "/"); drain();
    await add("Reduced motion: Home", page, drain);
    await ctx.close();
  }
  { // Forced colours on Listen
    const { ctx, page, drain } = await fresh(browser, STATE_SIZE, { forcedColors: "active" });
    await start(page); await go(page, "/listen"); drain();
    await add("Forced colours: Listen", page, drain);
    await ctx.close();
  }
  return tiles;
}

async function main(): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  const report: Report = { generated: new Date().toISOString(), commit, pages: {}, states: {} };
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    await pagesAtSizes(browser, report);
    const stateTiles = await states(browser, report);
    writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 1));
    for (const path of PAGES) {
      const tiles = SIZES.map((s) => ({ label: `${path}  ${s.width}×${s.height}`, file: join(SHOTS, `${slug(path)}-${s.width}x${s.height}.jpg`) }));
      await contactSheet(browser, tiles, join(OUT, `sheet-${slug(path)}.jpg`), "height:400px");
    }
    await contactSheet(browser, stateTiles, join(OUT, "sheet-states.jpg"), "width:540px");
  } finally {
    await browser.close();
  }
}

await main();
