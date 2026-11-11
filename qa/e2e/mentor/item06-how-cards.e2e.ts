// Every How we know card carries its evidence on its face (a plot with alt text and a table, or a
// table), numbers that match VALIDATION_TABLE.md (via the shipped sst.json / rain.json), and plain explanation text.
// Nothing says "Not built yet" or "Coming in October" any more.
import { expect, test } from "@playwright/test";
import { openAt, shipped, shot } from "./lib";

const sst = shipped<{ verified: { value: number; p90_abs_error_C: number; n_points: number } }>("latest/sst.json").verified;
const rain = shipped<{ verified: { approx_percent: number; n_points: number } }>("latest/rain.json").verified;

test("each card: evidence, numbers, explanation; tables open from the keyboard", async ({ page }) => {
  await openAt(page, "/how");
  const cards = page.locator("article");
  await expect(cards).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const card = cards.nth(i);
    await expect(card.getByTestId("evidence")).toBeVisible();
    await expect(card.getByTestId("card-numbers")).not.toBeEmpty();
    await expect(card.getByTestId("card-explain")).not.toBeEmpty();
    const plot = card.getByTestId("evidence-plot");
    if (await plot.count()) {
      await expect(plot).toHaveAttribute("aria-label", /.{20,}/u);
      const toggle = card.getByRole("button", { name: "View as table" });
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(card.getByTestId("evidence-table")).toBeVisible();
      await expect(card.getByRole("button", { name: "Hide table" })).toHaveAttribute("aria-expanded", "true");
    } else {
      await expect(card.getByTestId("evidence-table")).toBeVisible();
    }
    expect(await card.getByTestId("evidence-table").locator("tbody tr").count()).toBeGreaterThan(0);
  }
  // Numbers from VALIDATION_TABLE.md (the same values as the shipped `verified` blocks).
  await expect(cards.nth(0).getByTestId("card-numbers")).toContainText(`Median error ${sst.value.toFixed(2)} °C`);
  await expect(cards.nth(0).getByTestId("card-numbers")).toContainText(`within ${sst.p90_abs_error_C.toFixed(2)} °C; n = ${sst.n_points}`);
  await expect(cards.nth(1).getByTestId("card-numbers")).toContainText(`~${rain.approx_percent}%`);
  await expect(cards.nth(1).getByTestId("card-numbers")).toContainText(`n = ${rain.n_points}`);
  const hide = page.getByRole("button", { name: "Hide table" });
  while ((await hide.count()) > 0) await hide.first().click();
  await page.locator("#how-title").scrollIntoViewIfNeeded();
  await shot(page, "item06", "how-page");
});

test("no 'Not built yet' or 'Coming in October' on How we know or in Keys", async ({ page }) => {
  await openAt(page, "/how");
  await expect(page.locator("body")).not.toContainText(/Not built yet|coming in October/iu);
  await expect(page.getByRole("button", { name: "Not built yet" })).toHaveCount(0);
  await page.getByRole("button", { name: "Keys and accessibility" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).not.toContainText(/Not built yet|coming in October/iu);
});
