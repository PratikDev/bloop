// Accessibility core, step 2 (docs/accessibility/CORE_PLAN.md): the map widget's keys (+/−, J then 1–9, ".",
// PageUp/PageDown, D, Shift+D), help while focused, and the Hide 3D views setting. Runs on a build with
// NEXT_PUBLIC_A11Y_MAP_KEYS=1, with the 3D drawn and with it hidden by the e2e init script (every task must work either
// way). The held frame's value is checked against the shipped grid, decoded with the app's own functions.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { gunzipSync } from "node:zlib";
import { cellIndex } from "../../src/lib/data/grid";
import { decodeSequenceCode } from "../../src/lib/data/sequence";
import { bindT } from "../../src/lib/i18n";
import { rainText } from "../../src/lib/reading";
import type { SequenceIndex } from "../../src/types/data-contract";
import { MAP_READING, settingsButton, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle, shipped } from "../mentor/lib";

const t = bindT("en");
const map = (page: Page) => page.locator("#sound-map");

async function fresh(page: Page, hide3d: boolean, url = "/listen") {
  await start(page, { hide3d });
  await page.goto(url);
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  // Its "Sound on" comes once the audio has woken (later in Firefox): let it pass, so it never replaces a key's message.
  await settle(page, 1500);
  await logLiveRegion(page);
}

/** Presses keys on the map and returns the status region's messages that followed (settled after the debounce). */
async function press(page: Page, ...keys: string[]) {
  const before = (await liveLog(page)).length;
  for (const k of keys) await page.keyboard.press(k);
  await page.waitForTimeout(900);
  return (await liveLog(page)).slice(before).map((m) => m.trim()).filter(Boolean);
}

/** The value the app should show at (lat, lon) in the newest rain frame of the shipped time-lapse. */
function heldRainText(lat: number, lon: number): string {
  const index = shipped<SequenceIndex>("sequence/index.json");
  const ref = index.frames[index.frames.length - 1];
  const codes = gunzipSync(readFileSync(path.resolve(__dirname, "../../public/data/sequence", ref.grid)));
  const v = decodeSequenceCode(codes[cellIndex({ width: index.grid.width, height: index.grid.height }, lat, lon)]);
  return rainText(t, { track: "rain", ...v }, true);
}

for (const hide3d of [false, true]) {
  test.describe(`map keys, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    // NVDA log run (10 Nov 2026): a name that changed with each step was read as well as the status region's message.
    test("the map's name holds still while it has focus, so the status region says each step once; off the map it follows", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      await expect(map(page)).toHaveAttribute("aria-label", /21\.5° N, 89\.8° E/u);
      const arrived = await map(page).getAttribute("aria-label");
      const said = await press(page, "ArrowRight", "ArrowRight");
      await expect(map(page)).toHaveAttribute(MAP_READING, /21\.5° N, 91\.8° E/u);
      expect(await map(page).getAttribute("aria-label")).toBe(arrived);
      expect(said.join(" ")).toContain("21.5° N, 91.8° E");
      // Off the map and back: the name is where the needle is now.
      await page.keyboard.press("Shift+Tab");
      await expect(map(page)).not.toBeFocused();
      await expect(map(page)).toHaveAttribute("aria-label", /21\.5° N, 91\.8° E/u);
      await map(page).focus();
      await expect(map(page)).toHaveAttribute("aria-label", /21\.5° N, 91\.8° E/u);
    });

    test("+ and − change the step; the arrows then move by it; the new size is said", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      expect(await press(page, "+")).toContain("Step 2 degrees.");
      await press(page, "ArrowRight");
      await expect(map(page)).toHaveAttribute(MAP_READING, /21\.5° N, 91\.8° E/u);
      expect(await press(page, "-", "-")).toContain("Step 0.5 degrees.");
      await press(page, "ArrowUp");
      await expect(map(page)).toHaveAttribute(MAP_READING, /22\.0° N, 91\.8° E/u);
    });

    test("J then numbers jump region by region (numpad layout), leading with the region; '.' walks back", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      expect((await press(page, "j")).join(" ")).toContain("Regions: press 1 to 9");
      const east = await press(page, "6");
      expect(east.at(-1)).toMatch(/^Region 6, east\. .*0\.0° N, 120\.0° E$/u);
      const india = await press(page, "7");
      expect(india.at(-1)).toMatch(/^Region 7, north-west\. .*20\.0° N, 80\.0° E$/u);
      // Out of region mode, 1–3 are the tracks again.
      expect((await press(page, "ArrowLeft", "1")).join(" ")).toContain("Now hearing: Ocean");
      // Back: before the arrow, then the first jump, then where it started.
      await press(page, ".");
      await expect(map(page)).toHaveAttribute(MAP_READING, /20\.0° N, 80\.0° E/u);
      await press(page, ".", ".");
      await expect(map(page)).toHaveAttribute(MAP_READING, /21\.5° N, 89\.8° E/u);
      expect(await press(page, ".")).toContain("No earlier place to go back to.");
    });

    test("PageDown holds the newest rain frame at the needle, with the value from the shipped grid; PageUp returns", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      await page.keyboard.press("PageDown");
      await expect(page.getByText("Time-lapse frame 48 of 48")).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(900);
      const said = (await liveLog(page)).map((m) => m.trim()).filter(Boolean);
      expect(said.at(-1)).toContain("Rain frame 48 of 48");
      expect(said.at(-1)).toContain(heldRainText(21.5, 89.8));
      await expect(map(page)).toHaveAttribute(MAP_READING, new RegExp(heldRainText(21.5, 89.8).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
      expect((await press(page, "PageDown")).at(-1)).toContain("Rain frame 47 of 48");
      await press(page, "PageUp");
      expect((await press(page, "PageUp")).at(-1)).toMatch(/^Latest frames\./u);
      await expect(page.getByText(/Time-lapse frame/u)).toHaveCount(0);
      expect(await press(page, "PageUp")).toContain("Already the latest frames.");
    });

    test("D says the value here once; Shift+D turns Describe mode on", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      // D may first load the place names (step 3's description): wait for what it says.
      const before = (await liveLog(page)).length;
      await page.keyboard.press("d");
      await expect.poll(async () => (await liveLog(page)).slice(before).join(" "), { timeout: 10_000 }).toMatch(/degrees/u);
      const here = (await liveLog(page)).slice(before);
      // The value here (step 2), or with layered descriptions on (step 3) the description of this place.
      expect(here.join(" ")).toMatch(/21\.5 degrees north, 89\.8 degrees east|^Ocean surface temperature, .*: \d+\.\d degrees Celsius\./u);
      expect(await press(page, "Shift+D")).toContain("Describe on.");
    });

    test("help while focused: the hint shows only while the map has focus; H lists the new keys", async ({ page }) => {
      await fresh(page, hide3d);
      const hint = page.getByText("H: all keys. Esc: stop.");
      await map(page).blur();
      await expect(hint).toBeHidden();
      await map(page).focus();
      await expect(hint).toBeVisible();
      await page.keyboard.press("h");
      const help = page.getByRole("dialog");
      for (const row of ["J, then 1 – 9", "Page Up / Page Down", "Shift+D", "+ / −"]) await expect(help.getByText(row, { exact: true }).first()).toBeVisible();
      await expect(help.getByText("Numpad plus and minus belong to JAWS", { exact: false })).toBeVisible();
      expect(await axeSerious(page, '[role="dialog"]')).toEqual([]);
    });

    test("keys never fire while typing in a field", async ({ page }) => {
      await fresh(page, hide3d);
      await page.getByRole("button", { name: /Go to/u }).first().click();
      const field = page.getByRole("textbox").first();
      await field.focus();
      await page.keyboard.type("j.+");
      await expect(field).toHaveValue("j.+");
    });
  });
}

test("Hide 3D views: the setting hides the Turntable's 3D drawing and the Home globe; the needle still speaks", async ({ page }) => {
  await fresh(page, false);
  await settingsButton(page).click();
  const toggle = page.getByRole("button", { name: "Hide 3D views" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await axeSerious(page, '[data-slot="popover-content"]')).toEqual([]);
  await settingsButton(page).click();

  await page.goto("/turntable");
  await settle(page, 1500);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.isVisible()) await tap.click();
  await settle(page, 1500); // its "Sound on" first (see fresh)
  await logLiveRegion(page);
  await expect(page.getByTestId("hidden-3d-note")).toBeVisible();
  const canvases = page.locator('[role="application"] canvas');
  await expect.poll(async () => canvases.evaluateAll((els) => els.every((c) => getComputedStyle(c).visibility === "hidden"))).toBe(true);
  await page.getByRole("application", { name: /Turntable/u }).focus();
  const said = await press(page, "Enter");
  expect(said.join(" ")).toMatch(/degrees (north|south)/u);

  await page.goto("/");
  await settle(page, 1000);
  await expect(page.locator('img[src*="sst"]').first()).toBeVisible();

  // Remembered after a reload; off again brings the 3D back.
  await page.reload();
  await settle(page, 800);
  await settingsButton(page).click();
  await expect(page.getByRole("button", { name: "Hide 3D views" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Hide 3D views" }).click();
  await page.goto("/turntable");
  await settle(page, 1500);
  await expect(page.getByTestId("hidden-3d-note")).toHaveCount(0);
});
