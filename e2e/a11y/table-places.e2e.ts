// Accessibility core, step 4 (docs/accessibility/CORE_PLAN.md): "View as table" (the values around the needle, from
// the grid the sound plays, one arrow-step apart) and Places (offline search; continent → country → division). Runs on
// a build with NEXT_PUBLIC_A11Y_TABLE_PLACES=1 (and steps 1–3 on), 3D shown and hidden. The table's middle cell must
// equal the map's own reading, which health-records.e2e.ts checks against the shipped grids.
import { expect, test, type Page } from "@playwright/test";
import { MAP_READING, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const map = (page: Page) => page.locator("#sound-map");
const placesButton = (page: Page) => page.getByRole("button", { name: "Find a place or browse continents, countries and divisions" });

async function fresh(page: Page, hide3d: boolean) {
  await start(page, { hide3d });
  await page.goto("/listen");
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await settle(page, 1500); // "Sound on" first, so it never replaces a later message
  await logLiveRegion(page);
}

async function openTable(page: Page) {
  await map(page).focus();
  await page.keyboard.press("p");
  await page.getByRole("tab", { name: "Table" }).click();
  return page.getByTestId("value-table");
}

/** The map's ocean reading ("29.8 °C"), as the table writes it ("29.8"). */
async function mapOcean(page: Page) {
  return (await map(page).getAttribute(MAP_READING))?.match(/([−-]?\d+\.\d) °C/u)?.[1];
}

for (const hide3d of [false, true]) {
  test.describe(`table and places, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("the table: caption, headers one step apart, the middle cell is the needle and equals the map's value; axe clean", async ({ page }) => {
      await fresh(page, hide3d);
      const table = await openTable(page);
      const ocean = table.getByRole("table").first();
      await expect(ocean.locator("caption")).toContainText("Ocean temperature around the needle, in degrees Celsius");
      await expect(ocean.getByRole("columnheader")).toHaveText(["Latitude by longitude", "87.8° E", "88.8° E", "89.8° E", "90.8° E", "91.8° E"]);
      await expect(ocean.getByRole("rowheader")).toHaveText(["23.5° N", "22.5° N", "21.5° N", "20.5° N", "19.5° N"]);
      const middle = ocean.getByRole("row").nth(3).getByRole("cell").nth(2);
      await expect(middle).toHaveText(`${await mapOcean(page)}, needle`);
      await expect(table.getByRole("table")).toHaveCount(2); // Both: ocean, then rain
      expect(await axeSerious(page, '[data-testid="value-table"]')).toEqual([]);
    });

    test("the table follows the needle and the step (+), and a held rain frame shows that frame only", async ({ page }) => {
      await fresh(page, hide3d);
      const table = await openTable(page);
      await map(page).focus();
      await page.keyboard.press("+");
      await page.keyboard.press("ArrowRight");
      await expect(table.getByRole("table").first().getByRole("columnheader").nth(3)).toHaveText("91.8° E");
      await expect(table.getByRole("table").first().getByRole("columnheader").nth(4)).toHaveText("93.8° E");
      await expect(table.getByRole("table").first().getByRole("row").nth(3).getByRole("cell").nth(2)).toHaveText(`${await mapOcean(page)}, needle`);
      await page.keyboard.press("PageDown");
      await expect(table.getByRole("table")).toHaveCount(1, { timeout: 30_000 });
      await expect(table.locator("caption")).toContainText("Rain and snow around the needle, in millimetres an hour, 6 Nov 2026, 02:30 UTC");
    });

    test("Places: search finds Chattogram; choosing it moves the needle, says its name, and '.' comes back", async ({ page }) => {
      await fresh(page, hide3d);
      await placesButton(page).click();
      const menu = page.getByTestId("places-menu");
      await menu.getByRole("searchbox", { name: "Search places" }).fill("Chatto");
      const before = (await liveLog(page)).length;
      await menu.getByRole("button", { name: /^Chattogram/u }).first().click();
      await expect(map(page)).toBeFocused();
      await expect(map(page)).toHaveAttribute(MAP_READING, /22\.3° N, 91\.8° E/u);
      await expect.poll(async () => (await liveLog(page)).slice(before).join(" ")).toMatch(/Chattogram\. .*22\.3° N, 91\.8° E/u);
      await page.keyboard.press(".");
      await expect(map(page)).toHaveAttribute(MAP_READING, /21\.5° N, 89\.8° E/u);
    });

    test("Places: Asia → Bangladesh → Dhaka division moves the needle into Bangladesh; axe clean with the tree open", async ({ page }) => {
      await fresh(page, hide3d);
      await placesButton(page).click();
      const menu = page.getByTestId("places-menu");
      await menu.getByText("Asia", { exact: true }).click();
      await menu.getByText("Bangladesh", { exact: true }).click();
      expect(await axeSerious(page, '[data-testid="places-menu"]')).toEqual([]);
      await menu.getByRole("button", { name: "Dhaka", exact: true }).click();
      const label = (await map(page).getAttribute(MAP_READING)) ?? "";
      const [, lat, lon] = label.match(/(\d+\.\d)° N, (\d+\.\d)° E/u) ?? [];
      expect(Number(lat)).toBeGreaterThan(23);
      expect(Number(lat)).toBeLessThan(25);
      expect(Number(lon)).toBeGreaterThan(89.5);
      expect(Number(lon)).toBeLessThan(91);
    });

    test("Places in Bangla: a Bangla search and Bangla names in the tree", async ({ page }) => {
      await fresh(page, hide3d);
      await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
      await page.getByRole("button", { name: "জায়গা খুঁজুন, বা মহাদেশ, দেশ ও বিভাগ থেকে বেছে নিন" }).click();
      const menu = page.getByTestId("places-menu");
      await menu.getByRole("searchbox").fill("ঢাকা");
      await expect(menu.getByRole("button", { name: /^ঢাকা/u }).first()).toBeVisible();
      await menu.getByText("এশিয়া", { exact: true }).click();
      await expect(menu.getByText("বাংলাদেশ", { exact: true })).toBeVisible();
    });
  });
}
