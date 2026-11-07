// Mentor item 10: each Then vs Now part shows its 95% range and a one-line result, and the wording shown matches the
// significance outcome in stats.json (read here from the shipped file).
import { expect, test } from "@playwright/test";
import type { ThenNowStatsFile } from "../../src/types/then-now-stats";
import { openAt, sheet, shipped, shot } from "./lib";

const stats = shipped<ThenNowStatsFile>("thenvsnow/stats.json");
const CITIES = Object.keys(stats.cities) as (keyof ThenNowStatsFile["cities"])[];

/** The outcome straight from the file: heat's difference, rain's two sources, water's trend. */
function outcome(city: (typeof CITIES)[number], part: "heat" | "monsoon" | "water"): "clear" | "unclear" | "mixed" {
  const c = stats.cities[city];
  const flags = part === "heat" ? [c.heat.clear] : part === "monsoon" ? [c.rain.gpcp.clear, c.rain.gpcc.clear] : [stats.water.Bangladesh.trend.clear];
  return flags.every(Boolean) ? "clear" : flags.some(Boolean) ? "mixed" : "unclear";
}

for (const city of CITIES) {
  test(`${city}: every part's wording follows stats.json`, async ({ page }) => {
    for (const part of ["heat", "monsoon", "water"] as const) {
      await openAt(page, `/then-now?city=${city}&part=${part}`);
      const line = page.getByTestId("stat-line");
      await expect(line).toBeVisible();
      const want = outcome(city, part);
      await expect(line).toHaveAttribute("data-verdict", want);
      await expect(line).toContainText("95% CI");
      if (want === "clear") await expect(line).toContainText("A clear change: larger than year-to-year variation.");
      else await expect(line).toContainText("Not a clear change: year-to-year variation is larger.");
      if (want === "unclear" && part === "monsoon") await expect(line).toContainText("No wetter in these records:");
      await line.scrollIntoViewIfNeeded();
      if (city === "Dhaka") await shot(page, "item10", part);
    }
  });
}

test("Details shows the tests, the range and the method", async ({ page }) => {
  await openAt(page, "/then-now?part=monsoon");
  await page.getByRole("button", { name: "Details" }).first().click();
  const details = sheet(page).getByTestId("stats-details");
  await expect(details).toContainText("Uncertainty and significance");
  await expect(details).toContainText("Welch's t-test p = ");
  await expect(details).toContainText("Mann–Whitney U p = ");
  await expect(details).toContainText("Annual totals");
  await details.scrollIntoViewIfNeeded();
  await shot(page, "item10", "monsoon-details", sheet(page));
});

test("Bangla: the line is Bangla with the same outcome", async ({ page }) => {
  await openAt(page, "/then-now?part=monsoon");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  const line = page.getByTestId("stat-line");
  await expect(line).toHaveAttribute("data-verdict", outcome("Dhaka", "monsoon"));
  await expect(line).toContainText("৯৫% CI");
  await expect(line).not.toContainText("No wetter");
});
