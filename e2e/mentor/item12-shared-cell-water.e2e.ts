// Mentor item 12: the water note says Bangladesh-wide (mascon size from grace.json) for every city, on screen at
// 1280×720 without scrolling, in both Then vs Now views; and a fixture with two places in one cell shows the shared-cell
// note in Compare decades, Month by month, and the captions.
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { CitiesThenNowFile, GraceContextFile } from "../../src/types/data-contract";
import { captionLog, logCaptions, openAt, shipped, shot } from "./lib";

const grace = shipped<GraceContextFile>("context/grace.json");
const CITIES = ["Dhaka", "Chattogram", "Rajshahi", "Sylhet"] as const;
const WATER = `Underground water (GRACE) is Bangladesh-wide (mascon about ${grace.mascon_deg}°), not city-specific: the same for every city.`;

/** On screen without scrolling: inside the viewport and above the sound bar. */
async function aboveSoundBar(page: Page, note: Locator) {
  const box = await note.boundingBox();
  const bar = await page.getByRole("button", { name: /Turn sound on|Pause sound|Play sound/u }).first().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(bar ? bar.y : 720);
}

test.use({ viewport: { width: 1280, height: 720 } });

test("water: Bangladesh-wide for every city in both views, visible without scrolling", async ({ page }) => {
  for (const city of CITIES) {
    await openAt(page, `/then-now?city=${city}&part=water`);
    const note = page.getByTestId("water-note");
    await expect(note).toHaveText(WATER);
    await aboveSoundBar(page, note);
    if (city === "Dhaka") await shot(page, "item12", "compare-water");

    await openAt(page, `/then-now?view=monthly&place=${city}&record=water`);
    await expect(page.getByTestId("water-note")).toHaveText(WATER);
    await aboveSoundBar(page, page.getByTestId("water-note"));
    if (city === "Dhaka") await shot(page, "item12", "monthly-water");
  }
});

test("fixture: two places in one cell get the note in every view and in the captions", async ({ page }) => {
  // Rajshahi made to share a heat cell with Sylhet, as the reference city (same_record_as null).
  await page.route("**/data/demo/cities_then_now.json", async (route) => {
    const res = await route.fetch();
    const file = (await res.json()) as CitiesThenNowFile;
    for (const c of file.cities) if (c.name === "Rajshahi") Object.assign(c.heat, { same_record_as: null, shares_cell_with: ["Sylhet"] });
    await route.fulfill({ response: res, json: file });
  });
  await page.route("**/data/context/gistemp_bd.json", async (route) => {
    const res = await route.fetch();
    const file = (await res.json()) as { cells: Record<string, { lat: number; lon: number }> };
    Object.assign(file.cells.Rajshahi, { lat: file.cells.Sylhet.lat, lon: file.cells.Sylhet.lon });
    await route.fulfill({ response: res, json: file });
  });

  await openAt(page, "/then-now?city=Rajshahi&part=heat");
  const compare = page.getByTestId("shared-cell-note");
  await expect(compare).toContainText("same grid cell as Sylhet");
  await aboveSoundBar(page, compare);

  // Captions: the note is shown when the part starts.
  await logCaptions(page);
  const sound = page.getByRole("button", { name: "Turn sound on" }).first();
  if (await sound.isVisible().catch(() => false)) await sound.click();
  await page.getByRole("button", { name: "Play this part" }).click();
  await expect.poll(async () => (await captionLog(page)).join(" | ")).toContain("same grid cell as Sylhet");
  await page.getByRole("button", { name: "Stop", exact: true }).first().click();

  await openAt(page, "/then-now?view=monthly&place=Rajshahi&record=heat");
  await expect(page.getByTestId("shared-cell-note")).toContainText("Sylhet");
});

test("Bangla: the water note is Bangla, with the mascon size", async ({ page }) => {
  await openAt(page, "/then-now?city=Sylhet&part=water");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await expect(page.getByTestId("water-note")).toContainText("সারা বাংলাদেশের");
  await expect(page.getByTestId("water-note")).toContainText("ম্যাসকন প্রায়");
});
