// The jukebox journey from Home into Listen: it never gets in the way of the sound, and it is gone in about a second.
import { expect, test } from "@playwright/test";
import { AUDIBLE, heard, start } from "./lib/app";

const OVERLAY = "[data-jukebox-journey]";
const AFTER_MS = 1500;

test("Start listening reaches Listen with sound and no overlay", async ({ page }) => {
  await start(page);
  await expect(page).toHaveURL(/\/listen/u);
  await page.waitForTimeout(AFTER_MS);
  await expect(page.locator(OVERLAY)).toHaveCount(0);
  expect(await heard(page)).toBeGreaterThan(AUDIBLE);
});

test("Esc in the middle of the journey ends it and keeps the sound", async ({ page }) => {
  await start(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(AFTER_MS);
  await expect(page.locator(OVERLAY)).toHaveCount(0);
  expect(await heard(page)).toBeGreaterThan(AUDIBLE);
});

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the journey is a plain cut: the jukebox never moves", async ({ page }) => {
    await page.addInitScript(() => {
      const seen = { art: 0 };
      (window as unknown as { __art: typeof seen }).__art = seen;
      new MutationObserver(() => {
        if (document.querySelector("[data-jukebox-journey] [data-jukebox-art]")) seen.art++;
      }).observe(document, { childList: true, subtree: true });
    });
    await start(page);
    await page.waitForTimeout(AFTER_MS);
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __art: { art: number } }).__art.art)).toBe(0);
  });
});
