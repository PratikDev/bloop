// The NVDA log method (the same safe procedure as braille
// Part B): a portable NVDA 2026.3 with a fresh, throw-away config (synth "silence", speech logged at input/output
// level), and Chromium and Firefox driven with real OS keystrokes (qa/nvda/scripts/keys.ps1). From nvda.log it checks:
//   A. Track 0 is spoken, can be skipped, and is remembered (not spoken again after a reload);
//   B. with the 3D hidden, each map step's status-region text is spoken exactly once (My screen reader mode);
//   C. D speaks the description, once.
// Page setup (opening a page, saving a setting, putting focus on a control) goes through Playwright; every key a user
// would press goes through the OS. Run with the site served on BLOOP_URL and nothing else using the keyboard:
//   node --experimental-strip-types qa/nvda/run.ts   (Node, not Bun: Bun cannot launch a headed browser on Windows)
// It never touches NVDA's own config (D:\Jukebox\tools\nvda\userConfig): its config lives in data_raw/_tmp.
import { chromium, firefox, type Browser, type Page } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const URL = process.env.BLOOP_URL ?? "http://localhost:3210";
const NVDA = "D:\\Jukebox\\tools\\nvda\\nvda.exe";
const RUN = path.join(ROOT, "data_raw/_tmp/nvda-run3");
const CONFIG = path.join(RUN, "config");
const LOG = path.join(RUN, "nvda.log");
const KEYS = path.join(ROOT, "qa/nvda/scripts/keys.ps1");
// Keys go only to the test browser (keys.ps1 checks the foreground window before each one and stops the run if it can't).
const BROWSERS = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "D:\\Jukebox\\tools\\ms-playwright";
const FIREFOX_PREFS = { "media.autoplay.default": 0, "media.autoplay.blocking_policy": 0 };
const PREFS_KEY = "jukebox.prefs.v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) => s.replace(/\s+/gu, " ").trim();

/** NVDA's config for this run only: silent synth, no welcome dialog, no update check, nothing saved. */
function writeConfig() {
  rmSync(RUN, { recursive: true, force: true });
  mkdirSync(CONFIG, { recursive: true });
  writeFileSync(
    path.join(CONFIG, "nvda.ini"),
    [
      "schemaVersion = 25",
      "[general]",
      "\tshowWelcomeDialogAtStartup = False",
      "\tsaveConfigurationOnExit = False",
      "[update]",
      "\tautoCheck = False",
      "\tstartupNotification = False",
      "\tallowUsageStats = False",
      "\taskedAllowUsageStats = True",
      "[speech]",
      "\tsynth = silence",
      "",
    ].join("\r\n"),
  );
}

/** The page keys go to: brought to the front before each key (Windows lets Playwright do it when keys.ps1 can't). */
let front: Page | null = null;

async function press(...keys: string[]) {
  await front?.bringToFront();
  execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", KEYS, "-Keys", keys.join(","), "-Owner", BROWSERS], { stdio: "inherit" });
}

let offset = 0;
/** Everything NVDA said since the last mark, one string per utterance. */
function spokenSinceMark(): string[] {
  const text = existsSync(LOG) ? readFileSync(LOG, "utf8") : "";
  const fresh = text.slice(offset);
  offset = text.length;
  const out: string[] = [];
  for (const line of fresh.split(/\r?\n/u)) {
    if (!line.startsWith("Speaking [")) continue;
    const parts = [...line.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/gu)].map((m) => m[1] ?? m[2]).filter((p) => !/^[a-z]{2}(_[A-Z]{2})?$/u.test(p));
    if (parts.length) out.push(norm(parts.join(" ")));
  }
  return out;
}
const mark = () => void spokenSinceMark();

async function logLiveRegion(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __liveLog: string[] };
    w.__liveLog = [];
    const el = document.querySelector('[data-testid="live-region"]');
    if (el) new MutationObserver(() => el.textContent?.trim() && w.__liveLog.push(el.textContent.trim())).observe(el, { childList: true, characterData: true, subtree: true });
  });
}
const liveLog = (page: Page) => page.evaluate(() => (window as unknown as { __liveLog?: string[] }).__liveLog ?? []);

/** How many utterances say `text` (NVDA may split a long message; joined utterances are searched too). */
function timesSpoken(spoken: string[], text: string): number {
  const t = norm(text);
  const whole = spoken.filter((u) => u.includes(t)).length;
  return whole || (norm(spoken.join(" ")).includes(t) ? 1 : 0);
}

/** A step's coordinates ("21.5° N, 90.8° E"), the part every wording of its reading shares (status region, map label). */
const placeOf = (text: string) => text.match(/\d+\.\d° [NS], \d+\.\d° [EW]/u)?.[0] ?? text;

interface Check {
  browser: string;
  id: string;
  pass: boolean;
  detail: string;
  spoken: string[];
}

async function runBrowser(name: "chromium" | "firefox", checks: Check[]) {
  const browser: Browser =
    name === "chromium"
      ? await chromium.launch({ headless: false, args: ["--force-renderer-accessibility", "--autoplay-policy=no-user-gesture-required", "--start-maximized"] })
      : await firefox.launch({ headless: false, firefoxUserPrefs: FIREFOX_PREFS });
  const context = await browser.newContext({ viewport: null, baseURL: URL });
  const page = await context.newPage();
  front = page;
  const add = (id: string, pass: boolean, detail: string, spoken: string[]) => checks.push({ browser: name, id, pass, detail, spoken });
  try {
    await page.goto("/");
    await page.bringToFront();
    await sleep(3000);

    // A. Track 0: spoken after the intro on a first visit, skipped, remembered.
    await page.getByRole("button", { name: "Start listening" }).focus();
    await sleep(800);
    mark();
    await press("Enter");
    const skipIntro = page.getByRole("button", { name: "Skip intro" });
    if (await skipIntro.waitFor({ state: "visible", timeout: 6000 }).then(() => true, () => false)) {
      await skipIntro.focus();
      await sleep(500);
      await press("Enter");
    }
    await page.getByTestId("tuning").waitFor({ timeout: 15000 });
    await sleep(3000);
    const a1 = spokenSinceMark();
    add("A1 Track 0 is spoken when it opens", a1.some((u) => u.includes("Track 0")), "an utterance names Track 0", a1);
    await page.getByRole("button", { name: "Skip tuning" }).focus();
    await sleep(600);
    mark();
    await press("Enter");
    await sleep(1500);
    await press("F5");
    await sleep(6000);
    const a2 = spokenSinceMark();
    const panelGone = (await page.getByTestId("tuning").count()) === 0;
    add("A2 Skip is remembered after a reload", panelGone && !a2.some((u) => u.includes("Track 0")), `panel shown: ${!panelGone}`, a2);

    // B. 3D hidden (a saved setting), My screen reader mode: each map step spoken once.
    await page.evaluate((key) => {
      const p = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(key, JSON.stringify({ ...p, hide3d: true, speechMode: "screenReader" }));
    }, PREFS_KEY);
    await page.goto("/listen");
    await sleep(4000);
    const tap = page.getByRole("button", { name: "Tap to start sound" });
    if (await tap.isVisible().catch(() => false)) {
      await tap.focus();
      await press("Enter");
      await sleep(1500);
    }
    await page.locator("#sound-map").focus();
    await sleep(2500);
    await logLiveRegion(page);
    mark();
    for (let i = 0; i < 3; i++) {
      await press("Right");
      await sleep(2000);
    }
    const b = spokenSinceMark();
    const said = await liveLog(page);
    // Once in any wording: the status region's text, and nothing else naming the same place (such as the map's label).
    const counts = said.map((s) => timesSpoken(b, s));
    const places = said.map((s) => b.filter((u) => u.includes(placeOf(s))).length);
    add("B Each map step is spoken exactly once, 3D hidden", said.length >= 3 && counts.every((c) => c === 1) && places.every((c) => c === 1), `status texts ${said.length}; times spoken ${JSON.stringify(counts)}; utterances naming the place ${JSON.stringify(places)}`, b);

    // C. D speaks the description (once).
    await logLiveRegion(page);
    mark();
    await press("d");
    await sleep(4000);
    const c = spokenSinceMark();
    const desc = (await liveLog(page)).at(-1) ?? "";
    add("C D speaks the description once", desc.length > 40 && timesSpoken(c, desc.slice(0, 60)) === 1, `description: ${desc.slice(0, 80)}`, c);
  } finally {
    await browser.close();
  }
}

async function main() {
  writeConfig();
  const nvda = spawn(NVDA, ["-c", CONFIG, `--log-file=${LOG}`, "--log-level=12"], { detached: true, stdio: "ignore" });
  nvda.unref();
  await sleep(10000);
  const checks: Check[] = [];
  try {
    for (const b of ["chromium", "firefox"] as const) await runBrowser(b, checks);
  } finally {
    // Quit NVDA (its own config was never used, so nothing needs restoring).
    try {
      execFileSync(NVDA, ["-q"]);
    } catch {
      // already gone
    }
  }
  writeFileSync(path.join(RUN, "results.json"), JSON.stringify(checks, null, 1));
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.browser}  ${c.id}  (${c.detail})`);
  process.exit(checks.every((c) => c.pass) ? 0 : 1);
}

void main();
