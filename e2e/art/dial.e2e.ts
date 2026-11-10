// The Science to Art dial (docs/statement/ART.md): three stops with their lines, announced in the status region; the
// CI pitch-identity test for live SST, IMERG rain and SVS 3912 at art off, 0, 0.5 and 1 (OfflineAudioContext); the
// dial on an Official record and its check; Both mode keeps the chord and drone off; Mute all and Esc stop everything.
// Build with NEXT_PUBLIC_ART_ORCHESTRA=1 NEXT_PUBLIC_ART_DIAL=1.
import { expect, test, type Page } from "@playwright/test";
import { AUDIBLE, heard, level, navTo, settingsButton, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const dialIn = (page: Page) => page.getByTestId("art-dial").first();

async function chooseStop(page: Page, stop: "Measure" | "Blend" | "Music") {
  await dialIn(page).getByRole("group", { name: "Science to Art" }).getByRole("button", { name: stop }).click();
}

test("three stops, each with its lines; the stop is announced", async ({ page }) => {
  await start(page, { hide3d: true });
  await page.goto("/listen");
  await settle(page, 1200);
  await logLiveRegion(page);
  await page.locator("#sound-map").focus();
  await page.keyboard.press("1"); // Ocean only: one data voice, so the chord and drone may join
  await settingsButton(page).click();
  await chooseStop(page, "Music");
  const lines = dialIn(page).getByTestId("dial-lines");
  await expect(lines).toContainText("Data voice: unchanged at every position.");
  await expect(lines).toContainText("What changes: timbre, a soft bed, the value chord, a drone on Sa, light reverb, swara and meend glides.");
  await expect(lines).toContainText("Interpretation, not measurement");
  await expect.poll(async () => (await liveLog(page)).join(" | ")).toContain("Dial: Music, data unchanged");
  await chooseStop(page, "Measure");
  await expect(lines).toContainText("What changes: faint gridline ticks.");
  await chooseStop(page, "Blend");
  await expect(lines).toContainText("What changes: timbre, a soft bed, the value chord.");
  expect(await axeSerious(page, '[data-testid="art-dial"]')).toEqual([]);
});

test("Both mode: the chord is off, and no drone at Music", async ({ page }) => {
  await start(page, { hide3d: true });
  await page.goto("/listen");
  await settle(page, 1200);
  await page.locator("#sound-map").focus();
  await page.keyboard.press("3"); // Both
  await settingsButton(page).click();
  await chooseStop(page, "Music");
  const dial = dialIn(page);
  await expect(dial).toHaveAttribute("data-layers", "timbre bed reverb meend");
  await expect(dial.getByTestId("dial-lines")).toContainText("Value chord: off with two data voices (Both).");
});

for (const record of ["ocean", "rain", "currents_3912"] as const) {
  test(`CI pitch identity: ${record} at art off, 0, 0.5 and 1 (and 1 in a monsoon month)`, async ({ page }) => {
    test.setTimeout(150_000);
    await start(page, { hide3d: true });
    await navTo(page, "How we know");
    await page.getByRole("button", { name: /How the check works: Data voice check/u }).click();
    const check = page.locator(`[data-record="${record}"]`).getByTestId("dial-check");
    await check.getByRole("button").first().click();
    await expect(check).toHaveAttribute("data-pass", "true", { timeout: 120_000 });
    expect(Number(await check.getAttribute("data-cents"))).toBeLessThanOrEqual(1);
    console.log(`PITCH-IDENTITY ${record} ${await check.getAttribute("data-detail")}`); // the report's table
    await expect(check.getByTestId("dial-check-line")).toContainText(record === "rain" ? "Same drops at 5 positions" : "Same data voice at 5 positions");
  });
}

test("an Official record has the dial and its own check", async ({ page }) => {
  test.setTimeout(150_000);
  await start(page, { hide3d: true });
  await navTo(page, "Official records");
  await page.getByRole("button", { name: "Currents & SST (model, 2007–08)", exact: true }).click();
  const dial = dialIn(page);
  await expect(dial).toBeVisible({ timeout: 30_000 });
  const check = dial.getByTestId("dial-check");
  await expect(check.getByRole("button")).toBeEnabled({ timeout: 60_000 });
  await check.getByRole("button").click();
  await expect(check).toHaveAttribute("data-pass", "true", { timeout: 120_000 });
});

test("Mute all and Esc stop everything at Music", async ({ page }) => {
  await start(page, { hide3d: true });
  await page.goto("/listen");
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await settingsButton(page).click();
  await chooseStop(page, "Music");
  await page.keyboard.press("Escape"); // closes the popover
  await page.locator("#sound-map").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await heard(page, 6000)).toBeGreaterThan(AUDIBLE);
  await page.keyboard.press("m");
  await settle(page, 500);
  expect(await level(page)).toBeLessThan(AUDIBLE);
  await page.keyboard.press("m");
  await page.keyboard.press("Escape");
  await settle(page, 600);
  expect(await level(page)).toBeLessThan(AUDIBLE);
});
