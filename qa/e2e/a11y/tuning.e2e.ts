// Accessibility core, step 5 (docs/accessibility/CORE_PLAN.md): Track 0 "Tuning" opens after the intro on a first
// visit, with focus on it; each step says its words (status region) and then plays its anchor; it can be skipped and is
// remembered; Help plays it again. Shift+P says the record's provenance line. Runs on a build with
// NEXT_PUBLIC_A11Y_TUNING=1 (and steps 1–4 on), 3D shown and hidden.
import { expect, test, type Page } from "@playwright/test";
import { AUDIBLE, heard, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const panel = (page: Page) => page.getByTestId("tuning");
const map = (page: Page) => page.locator("#sound-map");

/** A first visit: Start listening, the intro skipped, on Listen. */
async function firstVisit(page: Page, hide3d: boolean) {
  await page.addInitScript(() => {
    const w = window as unknown as { __liveLog: string[] };
    w.__liveLog = [];
    new MutationObserver(() => {
      const el = document.querySelector('[data-testid="live-region"]');
      if (el && el.textContent !== w.__liveLog.at(-1)) w.__liveLog.push(el.textContent ?? "");
    }).observe(document, { childList: true, characterData: true, subtree: true });
  });
  await start(page, { hide3d, keepTuning: true });
  await page.waitForURL(/listen|\/$/u);
  if (!/listen/u.test(page.url())) await page.goto("/listen");
  await settle(page, 800);
}

for (const hide3d of [false, true]) {
  test.describe(`Track 0, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("opens after the intro with focus on it; each step is said, then its anchor sounds; axe clean", async ({ page }) => {
      await firstVisit(page, hide3d);
      await expect(panel(page)).toBeVisible();
      await expect(panel(page).getByRole("heading", { name: "Track 0: Tuning" })).toBeFocused();
      await expect(panel(page)).toContainText("Step 1 of 12");
      expect(await axeSerious(page, '[data-testid="tuning"]')).toEqual([]);
      await panel(page).getByRole("button", { name: "Next" }).click();
      await expect(page.getByTestId("tuning-text")).toContainText("The reference tone: 15 degrees Celsius");
      await expect.poll(async () => (await liveLog(page)).join(" ")).toContain("The reference tone: 15 degrees Celsius");
      expect(await heard(page, 6000)).toBeGreaterThan(AUDIBLE);
      await panel(page).getByRole("button", { name: "Next" }).click();
      await expect(page.getByTestId("tuning-text")).toContainText("lowest anchor: 0 degrees Celsius");
      expect(await heard(page, 6000)).toBeGreaterThan(AUDIBLE);
    });

    test("every step can be walked to the end; Start exploring closes it and it stays closed after a reload", async ({ page }) => {
      await firstVisit(page, hide3d);
      for (let i = 1; i < 12; i++) await panel(page).getByRole("button", { name: "Next" }).click();
      await expect(page.getByTestId("tuning-text")).toContainText("Tuning done.");
      await panel(page).getByRole("button", { name: "Start exploring" }).click();
      await expect(panel(page)).toHaveCount(0);
      await page.reload();
      await settle(page, 1500);
      await expect(panel(page)).toHaveCount(0);
    });

    test("Skip is remembered; Help plays it again", async ({ page }) => {
      await firstVisit(page, hide3d);
      await panel(page).getByRole("button", { name: "Skip tuning" }).click();
      await expect(panel(page)).toHaveCount(0);
      await page.reload();
      await settle(page, 1500);
      await expect(panel(page)).toHaveCount(0);
      await page.getByRole("banner").getByRole("button", { name: /Help|Keys/u }).first().click();
      await page.getByRole("button", { name: "Play Track 0 (Tuning) again" }).click();
      await expect(panel(page)).toBeVisible();
      await expect(panel(page)).toContainText("Step 1 of 12");
    });

    test("Shift+P on the map says the record's provenance line", async ({ page }) => {
      await firstVisit(page, hide3d);
      await panel(page).getByRole("button", { name: "Skip tuning" }).click();
      await logLiveRegion(page);
      await map(page).focus();
      await page.keyboard.press("Shift+P");
      await expect
        .poll(async () => (await liveLog(page)).join(" "))
        .toMatch(/MUR SST v4\.1 \(NASA\/JPL PO\.DAAC\): a NASA observation\. Cells 0\.35 degrees across, about 39 kilometres at the equator\./u);
    });
  });
}
