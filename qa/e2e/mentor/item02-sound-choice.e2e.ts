// The first-visit dialog shows once, the sound choice is remembered,
// a return visit with "sound" gets a non-blocking "Tap to start sound" (never autoplay), "silent" gets nothing, Reset
// brings the dialog back, and blocked storage only means the dialog shows (no errors).
import { expect, test, type Page } from "@playwright/test";
import { shot } from "./lib";

const gate = (page: Page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Start listening" }) });
const tap = (page: Page) => page.getByRole("button", { name: "Tap to start sound" });

async function skipIntro(page: Page) {
  const skip = page.getByRole("button", { name: "Skip intro" });
  if (await skip.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await skip.click();
}

test("first visit → Start listening → reload: no dialog, the choice kept, a tap starts sound", async ({ page }) => {
  await page.goto("/listen");
  await expect(gate(page)).toBeVisible();
  await shot(page, "item02", "first-visit");
  await page.getByRole("button", { name: "Start listening" }).click();
  await skipIntro(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(gate(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip intro" })).toHaveCount(0);
  await expect(tap(page)).toBeVisible();
  await shot(page, "item02", "after-reload-sound");
  await tap(page).click();
  await expect(tap(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause sound" }).first()).toBeVisible();
});

test("first visit → Explore without sound → reload: no dialog, no prompt", async ({ page }) => {
  await page.goto("/listen");
  await page.getByRole("button", { name: "Explore without sound" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(gate(page)).toHaveCount(0);
  await expect(tap(page)).toHaveCount(0);
});

test("Reset sound choice brings the dialog back", async ({ page }) => {
  await page.goto("/listen");
  await page.getByRole("button", { name: "Start listening" }).click();
  await skipIntro(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Reset sound choice" }).click();
  await page.goto("/listen");
  await expect(gate(page)).toBeVisible();
  await page.reload();
  await expect(gate(page)).toBeVisible();
});

test("blocked storage: no errors, the dialog shows", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/listen");
  await expect(gate(page)).toBeVisible();
  await page.getByRole("button", { name: "Start listening" }).click();
  await skipIntro(page);
  await page.reload();
  await expect(gate(page)).toBeVisible();
  expect(errors).toEqual([]);
});
