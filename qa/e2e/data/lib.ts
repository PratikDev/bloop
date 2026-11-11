// Shared by the DATA checks (qa/e2e/data/*.e2e.ts): open a page past the start overlay (and its "Tap to start sound"),
// read a shipped file the way the app does, and run axe on a part of the page.
import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { turntable } from "../features/common";
import { start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { settle } from "../mentor/lib";

export const ROOT = path.resolve(__dirname, "..", "..", "..");

export const readJson = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, "public/data", rel), "utf8")) as T;
export const readBin = (rel: string): Buffer => readFileSync(path.join(ROOT, "public/data", rel));

/** Opens the app (3D shown or hidden) and goes to `url`, starting the sound if the page asks for a tap. */
export async function fresh(page: Page, url: string, hide3d = true) {
  await start(page, { hide3d });
  await page.goto(url);
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 2000 }).then(() => true, () => false)) await tap.click({ timeout: 5000 }).catch(() => undefined);
  await settle(page, 600);
}

/** No serious or critical axe finding (in `include`, or the whole page). */
export async function expectAxeClean(page: Page, include?: string) {
  expect(await axeSerious(page, include)).toEqual([]);
}

/** Picks an Official record by its title (the "Records" choice group's buttons). */
export async function chooseRecord(page: Page, title: string | RegExp) {
  const option = page.getByRole("group", { name: "Records" }).getByRole("button", { name: title }).first();
  await expect(option).toBeVisible({ timeout: 30_000 });
  await option.click();
}

/** The Official records section (the record's player, its provenance and the shelves). */
export const OFFICIAL_SECTION = 'section[aria-labelledby="official-heading"]';

/** Opens a Turntable scene and stays in it (qa/e2e/features/common.ts's openScene leaves it again). */
export async function openSceneOnly(page: Page, sleeve: string) {
  // Already on the Turntable (e.g. /turntable?debug=1): stay, so the URL keeps its debug flag.
  if (!new URL(page.url()).pathname.startsWith("/turntable")) await turntable(page);
  else {
    await expect(page.getByRole("application", { name: /Turntable Earth/u })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
  }
  await page.getByRole("button", { name: "Records", exact: true }).click();
  const open = page.getByRole("button", { name: `Open the ${sleeve} scene` });
  await open.click();
  await expect(open).toBeHidden({ timeout: 30_000 });
}

/** The open scene's debug read (?debug=1): src/components/Scenes/debug.ts. */
export const sceneRead = (page: Page) =>
  page.evaluate(() => (window as unknown as { __scene?: { id: string; read(): Record<string, unknown> } }).__scene?.read() ?? null);
