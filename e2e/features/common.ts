// Shared by the feature checks (e2e/features.e2e.ts): the Feature shape, and the helpers each check uses to drive the
// app the way a user would and read what the user would get.
import { expect, type Locator, type Page } from "@playwright/test";
import { AUDIBLE, heard, level, MAP_READING, navTo } from "../lib/app";

export type Group = "data" | "sound" | "visuals" | "jukebox" | "a11y" | "truth" | "forms" | "pages";
export interface Outcome { evidence: string; limit?: string }
export interface Feature {
  id: string; group: Group; name: string; where: string; what: string;
  /** Driven by the keyboard in this check. */
  keyboard: boolean;
  /** The control whose accessible name a screen reader announces. */
  control?: (page: Page) => Locator;
  run(page: Page): Promise<Outcome>;
}

export const map = (page: Page) => page.getByRole("application").first();
export const name = async (l: Locator) => (await l.evaluate((e) => e.getAttribute("aria-label") ?? e.textContent ?? "")).trim();
/** The sound map's live reading (its name holds still while it has focus). */
export const reading = async (page: Page) => ((await map(page).getAttribute(MAP_READING)) ?? "").trim();
export const live = async (page: Page) =>
  (await page.locator('[role="status"], [role="alert"], [aria-live="polite"], [aria-live="assertive"]').allTextContents()).join(" ");
export const tab = (page: Page, n: string) => page.getByRole("tab", { name: n, exact: true });
export const pressed = (l: Locator) => expect(l).toHaveAttribute("aria-pressed", "true");
export const onMap = async (page: Page) => { await map(page).focus(); };
/** The dock (main's sound bar, on every page after Start but Home and the Turntable). */
export const dock = (page: Page) => page.getByRole("region", { name: "Sound" });

/** The accessible name a screen reader announces for the feature's control. A modal drawer the check opened hides the
 *  rest of the page from the accessibility tree, so the control can't be found until it is closed (Esc closes the top
 *  dialog); a short timeout either way, so a missing name is reported as missing rather than hanging the test. */
export async function controlName(page: Page, control: (page: Page) => Locator): Promise<string | null> {
  const read = () => control(page).first().evaluate((e) => (e.getAttribute("aria-label") ?? e.textContent ?? "").trim(), undefined, { timeout: 3000 });
  const got = await read().catch(() => "");
  if (got) return got;
  if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
  return (await read().catch(() => "")) || null;
}

export async function sounds(page: Page, what: string): Promise<Outcome> {
  const l = await heard(page);
  if (l <= AUDIBLE) throw new Error(`${what}: silent (max level ${l.toExponential(1)})`);
  return { evidence: `${what}: output level ${l.toExponential(1)}` };
}

export async function stops(page: Page, what: string): Promise<Outcome> {
  await page.waitForTimeout(800);
  const l = await level(page);
  if (l > AUDIBLE) throw new Error(`${what}: still sounding (level ${l.toExponential(1)})`);
  return { evidence: `${what}: output level ${l.toExponential(1)} after the key` };
}

/** Listen's Inspector ("About this sound", the dock) on one of its tabs: Checks, What you hear, Where it's from. */
export async function inspector(page: Page, tabName: "Checks" | "What you hear" | "Where it's from"): Promise<Locator> {
  await dock(page).getByRole("button", { name: "About this sound" }).click();
  await tab(page, tabName).click();
  const panel = page.getByRole("tabpanel", { name: tabName });
  await expect(panel).toBeVisible();
  return panel;
}

export async function turntable(page: Page) {
  await navTo(page, "Turntable");
  const app = page.getByRole("application", { name: /Turntable Earth/u });
  await expect(app).toBeVisible({ timeout: 30_000 });
  // The turntable's opening (black until the Earth is ready, then a ~4 s glide) is skipped by any key, which would
  // swallow the first key a check presses: wait for it to finish (its overlay says "Press any key to skip").
  await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
  const details = page.getByRole("button", { name: "Details of the value under the needle" });
  await expect(details).toContainText(/\S/u, { timeout: 30_000 });
  return { app, details };
}

export async function openScene(page: Page, sleeve: string): Promise<Outcome> {
  await turntable(page);
  await page.getByRole("button", { name: "Records", exact: true }).click();
  const open = page.getByRole("button", { name: `Open the ${sleeve} scene` });
  await open.click();
  await expect(open).toBeHidden({ timeout: 30_000 });
  // Most scenes play on opening (after their data loads); Ghost Earths waits for Enter ("play both windows"). Space
  // would pause a scene that had just started, so it is not used here.
  let l = await heard(page, 8000);
  if (l <= AUDIBLE) { await page.keyboard.press("Enter"); l = await heard(page, 8000); }
  // Esc closes the innermost thing first (a panel, then the scene), so it may take more than one press.
  const back = page.getByRole("application", { name: /Turntable Earth/u });
  for (let i = 0; i < 3 && !(await back.isVisible()); i++) {
    await page.keyboard.press("Escape");
    await back.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
  }
  await expect(back).toBeVisible({ timeout: 15_000 });
  return { evidence: `opened from the records drawer, Esc back to the turntable; level ${l.toExponential(1)}`,
    ...(l > AUDIBLE ? {} : { limit: "opened and closed, but no sound on opening or after Enter" }) };
}
