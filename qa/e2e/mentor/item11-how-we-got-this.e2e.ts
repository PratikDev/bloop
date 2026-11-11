// Mentor item 11: "explain how you are getting this result and provide proper evidence". Every value on every page sits
// in a group with a working "How we got this" button; its panel's fields are the files' (compared with the builders run
// on the shipped data); it is a real button opening a titled dialog that gives focus back; axe finds nothing serious.
import { expect, test, type Page } from "@playwright/test";
import { axeSerious } from "../lib/axe";
import { VALUE_VIEWS, content, track, unexplainedValues } from "../lib/values";
import { bindT, formatInteger } from "../../../src/lib/i18n";
import { longLine, partStats } from "../../../src/lib/then-now-stats";
import type { RainMetadata, SstMetadata } from "../../../src/types/data-contract";
import type { ThenNowStatsFile } from "../../../src/types/then-now-stats";
import { openAt, settle, shipped, shot } from "./lib";

const sst = shipped<SstMetadata>("latest/sst.json");
const rain = shipped<RainMetadata>("latest/rain.json");
const stats = shipped<ThenNowStatsFile>("thenvsnow/stats.json");
const panel = (page: Page) => page.getByTestId("how-we-got-this");
const field = (page: Page, name: string) => panel(page).locator(`[data-field="${name}"]`);
const visibleButtons = (page: Page) => page.locator("[data-how-we-got-this]:visible");
test("no value is shown without a working How we got this in its group", async ({ page }) => {
  test.setTimeout(900_000);
  const found: Record<string, unknown[]> = {};
  for (const v of VALUE_VIEWS) {
    await openAt(page, v.url);
    if (v.then) {
      await v.then(page);
      await settle(page, 400);
    }
    const bad = await unexplainedValues(content(page));
    if (bad.length) found[v.name] = bad;
    await page.keyboard.press("Escape");
  }
  expect(found).toEqual({});
});

test("every How we got this button opens its panel by keyboard and gives focus back", async ({ page }) => {
  test.setTimeout(300_000);
  for (const url of ["/listen", "/then-now?city=Dhaka&part=monsoon", "/how", "/official"]) {
    await openAt(page, url);
    const count = await visibleButtons(page).count();
    expect([url, count > 0]).toEqual([url, true]);
    for (let i = 0; i < count; i++) {
      const b = visibleButtons(page).nth(i);
      const name = (await b.getAttribute("aria-label")) ?? "";
      expect(name).toMatch(/^How we got this: ./u);
      expect(await b.evaluate((el) => el.tagName)).toBe("BUTTON");
      await b.focus();
      await page.keyboard.press("Enter");
      await expect(panel(page)).toBeVisible();
      await expect(panel(page).getByRole("heading", { level: 2 })).toHaveText(name);
      await page.keyboard.press("Escape");
      await expect(panel(page)).toBeHidden();
      await expect(b).toBeFocused();
    }
  }
});

test("the panel's fields are the files': Listen and Then vs Now", async ({ page }) => {
  await openAt(page, "/listen");
  await track("Ocean")(page);
  await page.locator('[data-slot="readout"] [data-how-we-got-this]').first().click();
  await expect(field(page, "dataset")).toHaveText(sst.source_dataset);
  await expect(field(page, "n")).toContainText(String(sst.verified.n_points));
  await expect(field(page, "status")).toHaveText("verified");
  await expect(field(page, "validation")).toContainText("live_sst");
  await shot(page, "item11", "listen-panel", panel(page));
  await page.keyboard.press("Escape");

  await openAt(page, "/listen");
  await track("Rain")(page);
  await page.locator('[data-slot="readout"] [data-how-we-got-this]').first().click();
  await expect(field(page, "dataset")).toHaveText(rain.source_dataset);
  await expect(field(page, "n")).toContainText(String(rain.verified.n_points));
  await page.keyboard.press("Escape");

  const en = bindT("en");
  for (const part of ["heat", "monsoon", "water"] as const) {
    await openAt(page, `/then-now?city=Rajshahi&part=${part}`);
    await page.getByRole("button", { name: `How we got this: Rajshahi ${en(`thenNow.part.${part}`)}` }).first().click();
    await expect(field(page, "uncertainty")).toHaveText(longLine(en, "en", partStats(stats, "Rajshahi", part)));
    await expect(field(page, "status")).toContainText("read from the data file itself");
    if (part === "heat") await expect(field(page, "n")).toHaveText(`${formatInteger(stats.cities.Rajshahi.heat.A.n, "en")} years and ${formatInteger(stats.cities.Rajshahi.heat.B.n, "en")} years`);
    if (part === "monsoon") await shot(page, "item11", "then-now-panel", panel(page));
    await page.keyboard.press("Escape");
  }
});

test("Official records: the panel is the record's; a pattern-only record says no number is shown", async ({ page }) => {
  await openAt(page, "/official");
  await visibleButtons(page).first().click();
  await expect(field(page, "validation").first()).toContainText("VALIDATION_TABLE.md");
  await shot(page, "item11", "official-panel", panel(page));
  await page.keyboard.press("Escape");
  await page.getByText(/^EIC patterns/u).first().click();
  await settle(page);
  await visibleButtons(page).first().click();
  await expect(panel(page)).toContainText("No number is shown:");
  await expect(field(page, "status").first()).toHaveText("pattern only");
});

test("Bangla: the panel is in Bangla with Bangla digits", async ({ page }) => {
  await openAt(page, "/listen");
  await track("Ocean")(page);
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await page.locator('[data-slot="readout"] [data-how-we-got-this]').first().click();
  await expect(panel(page).getByRole("heading", { level: 2 })).toContainText("কীভাবে পেলাম");
  await expect(field(page, "n")).toHaveText(`${formatInteger(sst.verified.n_points, "bn")}টি বিন্দু`);
});

test("axe: an open panel has no serious violations", async ({ page }) => {
  for (const url of ["/listen", "/then-now?city=Dhaka&part=heat", "/official"]) {
    await openAt(page, url);
    await visibleButtons(page).first().click();
    await expect(panel(page)).toBeVisible();
    expect([url, await axeSerious(page, '[data-testid="how-we-got-this"]')]).toEqual([url, []]);
    await page.keyboard.press("Escape");
  }
});
