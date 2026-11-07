// Shared by the mentor-fix specs (docs/MENTOR_FIXES.md): open the app past the gate, read the shipped data the page
// shows (so a test compares against the files, never a typed number), and save the before/after screenshots.
import type { Locator, Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import * as path from "node:path";
import { start } from "../lib/app";

const ROOT = path.resolve(__dirname, "../..");

/** A shipped data file (public/data/<rel>), as the app fetches it. */
export const shipped = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, "public/data", rel), "utf8")) as T;

const started = new WeakSet<Page>();

/** Opens the app past the start gate and the intro (first call per page: the gate shows only on a first visit), with
 * the audio tap and the 3D hidden, then goes to `url`. */
export async function openAt(page: Page, url: string) {
  if (!started.has(page)) {
    await start(page, { hide3d: true });
    started.add(page);
  }
  await page.goto(url);
  await settle(page);
}

export async function settle(page: Page, ms = 600) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(ms);
}

export const sheet = (page: Page) => page.getByRole("dialog").last();

/** MENTOR_SHOTS=after|before saves docs/mentor-fixes/<item>-<name>-<when>.png (≤ 1280 px wide); otherwise nothing. */
export async function shot(page: Page, item: string, name: string, target?: Locator) {
  const when = process.env.MENTOR_SHOTS;
  if (!when) return;
  const dir = path.join(ROOT, "docs/mentor-fixes");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${item}-${name}-${when}.png`);
  if (target) await target.screenshot({ path: file, timeout: 8000 }).catch(() => page.screenshot({ path: file }));
  else await page.screenshot({ path: file });
}
