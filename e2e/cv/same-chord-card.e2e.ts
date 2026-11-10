// The "Same chord, whatever the colours" card (CV/ML build, piece C) on a build with NEXT_PUBLIC_CV_CARD=1: its numbers
// equal the T2 output file (public/data/meta/colormap_invariance.json), its figure loads with alt text, "View as table"
// and "How we got this" work, the limit is stated, axe finds nothing serious; Bangla shows Bangla digits.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { formatFixed } from "../../src/lib/i18n";
import type { InvarianceCase } from "../../src/lib/cv/same-chord";
import { navTo, open } from "../lib/app";
import { axeSerious } from "../lib/axe";

const file = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "public/data/meta/colormap_invariance.json"), "utf8")) as { cases: InvarianceCase[] };
const median = Math.max(...file.cases.map((c) => c.clean.median_spread_C));
const mode = Math.max(...file.cases.flatMap((c) => c.clean.mode_spread_C ?? []));
const sigma = file.cases[0].sigma_C;
const card = (page: Page) => page.locator("article", { has: page.getByTestId("same-chord-card") });

test("the card's numbers are the T2 file's; figure, table, How we got this; axe clean", async ({ page }) => {
  await open(page);
  await navTo(page, "How we know");
  const c = card(page);
  await expect(c.getByTestId("card-numbers")).toHaveText(
    `Median moved at most ${formatFixed(median, "en", 2)} °C, a group's value at most ${formatFixed(mode, "en", 2)} °C, between colour maps; our error is ${formatFixed(sigma, "en", 2)} °C.`,
    { timeout: 20_000 },
  );
  await expect(c).toContainText("Tested on synthetic renders of NASA MUR data");
  const img = c.locator("img");
  await expect(img).toHaveJSProperty("complete", true);
  expect(await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await c.getByRole("button", { name: /View as table/u }).click();
  await expect(c.getByRole("table")).toContainText("viridis");
  await c.getByRole("button", { name: /^How we got this/u }).click();
  await expect(page.getByTestId("how-we-got-this")).toContainText("hue histograms");
  await page.keyboard.press("Escape");
  expect(await axeSerious(page, "main")).toEqual([]);
});

test("in Bangla, the card's numbers use Bangla digits", async ({ page }) => {
  await open(page);
  await navTo(page, "How we know");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await expect(card(page).getByTestId("card-numbers")).toContainText(formatFixed(median, "bn", 2));
});
