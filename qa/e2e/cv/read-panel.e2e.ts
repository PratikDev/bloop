// "What the jukebox read from this frame" (CV/ML build, piece A) in a real browser, on a build with NEXT_PUBLIC_CV_READ=1:
// the panel opens from its heading's button (keyboard reachable, axe clean), reads the box chosen (numbers equal the
// browser function on the shipped grid), its short line is braille-safe; pattern-only records show no numbers; every
// flagged axis shows its warning in English and Bangla, and no axis shows cents without a source.
import { expect, test, type Page } from "@playwright/test";
import { violations } from "../../../src/a11y/brailleText";
import { ERROR_BUDGET } from "../../../src/lib/cv/error-budget";
import { open } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { settle } from "../mentor/lib";

const panel = (page: Page) => page.getByTestId("jukebox-read");
const openPanel = async (page: Page) => {
  const button = panel(page).getByRole("button", { name: "What the jukebox read from this frame" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
};

test("Listen: the panel reads the chosen box, with its budget, status, short line and How we got this; axe clean", async ({ page }) => {
  await open(page);
  await page.goto("/listen");
  await settle(page, 1500);
  await openPanel(page);
  await panel(page).getByRole("button", { name: "Bay of Bengal", exact: true }).click();
  const p = panel(page);
  await expect(p.getByText("Median")).toBeVisible();
  await expect(p.getByText("10th to 90th percentile")).toBeVisible();
  await expect(p.getByText("verified", { exact: true })).toBeVisible();
  await expect(p.getByTestId("read-budget")).toContainText("cents of pitch");
  const short = (await p.getByTestId("read-short").textContent()) ?? "";
  expect(short).toMatch(/^(Read: )?SST med \d+\.\dC P10-90 [\d.]+-[\d.]+ err [\d.]+C$/u);
  expect(violations(short, 40)).toEqual([]);
  await expect(p.locator("[data-how-we-got-this]").first()).toBeVisible();
  expect(await axeSerious(page, '[data-testid="jukebox-read"]')).toEqual([]);
});

for (const lang of ["en", "bn"] as const) {
  test(`every flagged axis shows its warning (${lang}); no cents without a source`, async ({ page }) => {
    await open(page);
    await page.goto("/listen");
    await settle(page, 1500);
    if (lang === "bn") await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
    const title = lang === "bn" ? "এই ফ্রেম থেকে জুকবক্স যা পড়ল" : "What the jukebox read from this frame";
    await panel(page).getByRole("button", { name: title }).click();
    await panel(page).locator("summary").click();
    const warn = lang === "bn" ? "ত্রুটির মধ্যে" : "within our error";
    const unknown = lang === "bn" ? "ত্রুটি জানা নেই" : "Error not known";
    for (const axis of ERROR_BUDGET.axes) {
      const row = page.locator(`[data-axis="${axis.id}"]`);
      if (axis.flag) {
        await expect(row).toHaveAttribute("data-flag", "");
        await expect(row.locator("[data-note]")).toContainText(warn);
      }
      if (axis.error_source === null) {
        await expect(row.locator("[data-cents]")).toHaveText("");
        await expect(row).toContainText(unknown);
      }
      if (axis.dynamic) {
        // Sound terrain's zoom: cents from today's span; flagged rows carry the warning.
        await expect(row.locator("[data-cents]")).not.toHaveText("");
        if ((await row.getAttribute("data-flag")) !== null) await expect(row.locator("[data-note]")).toContainText(warn);
      }
    }
  });
}

test("Official records: 3912 reads its step; a pattern-only record shows no numbers and says why", async ({ page }) => {
  await open(page);
  await page.goto("/official");
  await settle(page, 1500);
  await page.getByRole("button", { name: /^Currents & SST/u }).click();
  await openPanel(page);
  await panel(page).getByRole("button", { name: "Gulf Stream", exact: true }).click();
  await expect(panel(page).getByText("Median")).toBeVisible({ timeout: 30_000 });
  await expect(panel(page).getByTestId("read-short")).toContainText("med ");
  await page.getByRole("button", { name: /^Near-surface wind speed/u }).click();
  await openPanel(page);
  await expect(panel(page).getByTestId("read-pattern")).toHaveText("Pattern only: no values read.", { timeout: 30_000 });
  await expect(panel(page).getByText("Median")).toHaveCount(0);
  await expect(panel(page).getByTestId("read-short")).toHaveText(/pattern only$/u);
});
