// Earth Orchestra (docs/statement/ART.md): the Official grid grouped by Earth system, the category earcon (and none
// when muted), the Instrument style setting, the legend card (axe clean), the category word leading Describe, and the
// pitch-identity check across every family. Build with NEXT_PUBLIC_ART_ORCHESTRA=1 NEXT_PUBLIC_ART_DIAL=1.
import { expect, test, type Page } from "@playwright/test";
import { getCategory, UNCLASSIFIED } from "../../src/lib/audio/orchestra/table";
import type { OfficialIndex } from "../../src/types/data-contract";
import { navTo, settingsButton, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle, shipped } from "../mentor/lib";

const records = shipped<OfficialIndex>("official/index.json").records;

async function official(page: Page) {
  await start(page, { hide3d: true });
  await navTo(page, "Official records");
  await expect(page.getByTestId("record-grid")).toBeVisible({ timeout: 30_000 });
}

test("the Official records are grouped by Earth system, each group named", async ({ page }) => {
  await official(page);
  const groups = page.getByTestId("record-grid").locator("section[data-category]");
  const names = await groups.evaluateAll((els) => els.map((e) => e.getAttribute("data-category")));
  const expected = [...new Set(records.map((r) => getCategory(r.record) ?? "unplaced"))];
  expect(new Set(names)).toEqual(new Set(expected));
  for (const r of records) {
    const group = getCategory(r.record) ?? "unplaced";
    await expect(page.locator(`section[data-category="${group}"]`).getByRole("button", { name: r.title, exact: true })).toBeVisible();
  }
  expect(UNCLASSIFIED.map((u) => u.id)).toContain("patterns_eic");
  await expect(page.locator('section[data-category="ocean"] h3')).toHaveText("Ocean");
});

test("picking a record plays its category earcon; muted, it doesn't", async ({ page }) => {
  await official(page);
  const picker = page.getByTestId("record-picker");
  await page.getByRole("button", { name: records.find((r) => r.record === "forest_4950")!.title, exact: true }).click();
  await expect(picker).toHaveAttribute("data-earcons", "1");
  // Mute all (the dock's Mixer), then pick another: no earcon.
  await page.getByRole("button", { name: /^Mixer/u }).click();
  await page.getByRole("button", { name: "Mute all" }).click();
  await page.keyboard.press("Escape");
  await settle(page, 300);
  await page.getByRole("button", { name: records.find((r) => r.record === "lights_5313")!.title, exact: true }).click();
  await settle(page, 500);
  await expect(picker).toHaveAttribute("data-earcons", "1");
});

test("Settings has Instrument style (Earth Orchestra / Plain tones)", async ({ page }) => {
  await start(page, { hide3d: true });
  await settingsButton(page).click();
  const style = page.getByRole("group", { name: "Instrument style" });
  await expect(style.getByRole("button", { name: "Earth Orchestra" })).toHaveAttribute("aria-pressed", "true");
  await style.getByRole("button", { name: "Plain tones" }).click();
  await expect(style.getByRole("button", { name: "Plain tones" })).toHaveAttribute("aria-pressed", "true");
});

test("the legend card: every system, instrument and a demo; axe clean", async ({ page }) => {
  await start(page, { hide3d: true });
  await navTo(page, "How we know");
  await page.getByRole("button", { name: /See every family: Earth Orchestra/u }).click();
  const legend = page.getByTestId("orchestra-legend");
  await expect(legend.locator("tbody tr")).toHaveCount(6);
  for (const name of ["Ocean", "Air and weather", "Land and life", "Fire and smoke", "Ice and water storage", "People and carbon"]) {
    await expect(legend.getByRole("button", { name: `Play ${name} on the reference note` })).toBeVisible();
  }
  await legend.getByRole("button", { name: "Play Ocean on the reference note" }).click();
  await expect(legend).toContainText("Interpretation, not measurement");
  expect(await axeSerious(page, '[data-testid="orchestra-legend"]')).toEqual([]);
});

// The Description panel leads each record with its system; D (spoken) keeps the record's title first, the a11y
// contract e2e/a11y/descriptions checks.
test("Describe leads with the category word", async ({ page }) => {
  await start(page, { hide3d: true });
  await page.goto("/listen");
  await settle(page, 1500);
  await logLiveRegion(page);
  await page.locator("#sound-map").focus();
  await page.keyboard.press("d");
  await expect.poll(async () => (await liveLog(page)).join(" | "), { timeout: 10_000 }).toMatch(/(?:^| \| )Ocean surface temperature, /u);
  await page.keyboard.press("p");
  await page.getByRole("tab", { name: "Description" }).click();
  const first = page.getByTestId("description-panel").locator("section p").first();
  await expect(first).toHaveText(/^Ocean\. Ocean surface temperature, /u, { timeout: 10_000 });
});

test("pitch identity: every Earth Orchestra family keeps the data voice within 1 cent", async ({ page }) => {
  test.setTimeout(180_000);
  await start(page, { hide3d: true });
  await navTo(page, "How we know");
  await page.getByRole("button", { name: /How the check works: Data voice check/u }).click();
  const check = page.getByTestId("category-check");
  await check.getByRole("button", { name: "Check every Earth Orchestra family" }).click();
  await expect(check).toHaveAttribute("data-pass", /./u, { timeout: 150_000 });
  console.log(await check.getAttribute("data-detail"));
  await expect(check).toHaveAttribute("data-pass", "true");
  expect(Number(await check.getAttribute("data-cents"))).toBeLessThanOrEqual(1);
});
