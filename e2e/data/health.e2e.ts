// P1, Data health (DATA): How we know links the Data health page; its table has one row per record of meta/health.json
// with the file's times and check counts; every How we got this has "Is this data fresh?" from the same file. Runs on
// a build with NEXT_PUBLIC_DATA_HEALTH=1. Expected values come from the shipped file through the app's own functions.
import { expect, test } from "@playwright/test";
import { healthOf, healthRows, type HealthFile } from "../../src/lib/earth/health";
import { formatInteger } from "../../src/lib/i18n";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, OFFICIAL_SECTION, readJson } from "./lib";

const file = readJson<HealthFile>("meta/health.json");

test.describe("Data health", () => {
  test("How we know links the page; one row per record, the file's numbers, keyboard-reachable, axe clean", async ({ page }) => {
    await fresh(page, "/how");
    const card = page.getByTestId("data-health-card");
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole("link", { name: "Open Data health" }).click();
    await expect(page).toHaveURL(/\/data-health$/u);
    const table = page.getByTestId("health-table");
    await expect(table).toBeVisible({ timeout: 30_000 });
    const rows = healthRows(file);
    await expect(table.locator("tbody tr")).toHaveCount(rows.length);
    await expect(table.locator("caption")).toContainText(`${formatInteger(rows.length, "en")} records`);
    // Every row starts with its record's name (a row header) and shows its check counts.
    for (const r of rows.slice(0, 8)) {
      const row = table.locator("tbody tr").filter({ has: page.locator(`[data-health-row="${r.id}"]`) });
      await expect(row.locator("th")).toHaveText(r.title);
      await expect(row.locator("td").last()).toHaveText(`${r.passed} / ${r.failed}`);
    }
    // The table is one Tab stop and scrolls with the keys.
    await table.focus();
    await expect(table).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect.poll(() => table.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    const text = await table.innerText();
    expect(/[A-Za-z]:\\|data_raw|\/home\//u.test(text)).toBe(false);
    await expectAxeClean(page);
  });

  test("Listen's How we got this says whether the frame is fresh, from the health run", async ({ page }) => {
    await fresh(page, "/listen");
    await page.getByRole("button", { name: /^How we got this: ocean temperature/u }).first().click();
    const dialog = page.getByTestId("how-we-got-this");
    const facts = dialog.getByTestId("fresh-facts").first();
    await expect(facts).toBeVisible({ timeout: 15_000 });
    const id = (await facts.getAttribute("data-health-id")) ?? "";
    const h = healthOf(file, id);
    expect(h).not.toBeNull();
    await expect(facts.locator('[data-fresh="lag"]')).toHaveText(`${h?.lagDays?.toFixed(1)} d behind the source`);
    await expect(facts.locator('[data-fresh="checks"]')).toContainText(`${h?.passed} passed, ${h?.failed} failed`);
    await expectAxeClean(page, '[data-testid="how-we-got-this"]');
  });

  test("an Official record's How we got this has its own health row", async ({ page }) => {
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    await chooseRecord(page, "Near-surface temperature (EIC, model)");
    const section = page.locator(OFFICIAL_SECTION);
    await section.getByRole("button", { name: /^How we got this: Near-surface temperature/u }).first().click();
    const facts = page.getByTestId("how-we-got-this").getByTestId("fresh-facts").first();
    await expect(facts).toHaveAttribute("data-health-id", "eic_5147", { timeout: 15_000 });
    const h = healthOf(file, "eic_5147");
    await expect(facts.locator('[data-fresh="checks"]')).toContainText(`${h?.passed} passed, ${h?.failed} failed`);
  });
});
