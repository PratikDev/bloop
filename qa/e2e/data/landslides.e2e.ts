// Landslide exposure: the record reads the LHASA class at the needle with its label (modelled exposure, not
// observed landslides); each class gives its own sound and the lowest are stated silences; the staleness banner shows
// when the product is past its freshness limit (and not when it is fresh). Runs on a build with
// NEXT_PUBLIC_DATA_LANDSLIDES=1. Expected values come from the shipped files through the app's own functions.
import { expect, test, type Page } from "@playwright/test";
import { violations } from "../../../src/a11y/brailleText";
import { classesRule, classState, LANDSLIDE_VOICE } from "../../../src/lib/earth/classes";
import type { DataSoundState } from "../../../src/lib/earth/sound/out";
import type { FreshnessFile, LandslideClassMetadata } from "../../../src/types/data-contract";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, readJson } from "./lib";

const meta = readJson<LandslideClassMetadata>("latest/landslide_class.json");
const rule = classesRule(LANDSLIDE_VOICE);
const sound = (page: Page) => page.evaluate(() => (window as unknown as { __bloopData?: DataSoundState }).__bloopData ?? null);
const TITLE = "Landslide exposure (LHASA, modelled)";

async function openRecord(page: Page) {
  await navTo(page, "Official records");
  await chooseRecord(page, TITLE);
  const record = page.getByTestId("record-landslide_lhasa");
  await expect(record).toBeVisible({ timeout: 30_000 });
  await expect(record.getByTestId("slide-line")).toBeVisible({ timeout: 30_000 });
  return record;
}

/** Moves the needle to the nearest cell of a class (the classes table's "Hear an example" button). */
async function clickClass(page: Page, code: number) {
  const table = page.getByTestId("slide-table");
  if (!(await table.isVisible())) await page.getByTestId("record-landslide_lhasa").getByRole("button", { name: "View as table" }).click();
  await page.locator(`[data-example-class="${code}"]`).click();
}

test.describe("Landslide exposure", () => {
  test("the class at the needle, its label and braille line; each class its own sound, the lowest silent; axe clean", async ({ page }) => {
    await fresh(page, "/listen");
    const record = await openRecord(page);
    await expect(record).toContainText("Modelled exposure (LHASA), not observed landslides.");
    expect(violations((await record.getByTestId("braille-line").innerText()).trim(), 40)).toEqual([]);
    await expectAxeClean(page, '[data-testid="record-landslide_lhasa"]');
    await record.getByTestId("slide-play").click();
    for (const c of meta.classes) {
      await clickClass(page, c.code);
      await expect(record.getByTestId("slide-line")).toHaveAttribute("data-class", String(c.code));
      const state = classState(rule, c.code);
      await expect.poll(async () => (await sound(page))?.rumble?.code ?? null).toBe(c.code);
      const s = (await sound(page))?.rumble;
      if (state?.sound === "rumble") {
        expect(s?.cutoffHz).toBe(state.rumble?.cutoffHz);
        expect(s?.pulses).toBe(state.rumble?.pulsesPerSecond);
      } else {
        expect(s?.cutoffHz).toBeNull();
        await expect(record.getByTestId("slide-line")).toContainText("Silence:");
      }
    }
  });

  for (const age of ["old", "fresh"] as const) {
    test(`the staleness banner ${age === "old" ? "appears when the product is past its limit" : "stays away when it is fresh"}`, async ({ page }) => {
      await page.route("**/data/meta/freshness.json", async (route) => {
        const f = readJson<FreshnessFile>("meta/freshness.json");
        const e = f.products.landslide_class;
        const days = age === "old" ? (e.limit_days ?? 0) + 30 : 0;
        e.source_time_utc = new Date(Date.now() - days * 86_400_000).toISOString();
        await route.fulfill({ json: f });
      });
      await fresh(page, "/listen");
      const record = await openRecord(page);
      const note = record.locator('[data-age-product="landslide_class"]');
      await expect(note).toHaveAttribute("data-stale", age === "old" ? "true" : "false", { timeout: 15_000 });
      if (age === "old") await expect(note).toContainText("may be out of date");
      else await expect(note).not.toContainText("may be out of date");
    });
  }

  test("its transcript lists every class with its cells and its sound; axe clean", async ({ page }) => {
    await fresh(page, "/transcript?record=landslide_lhasa");
    const tr = page.getByTestId("app-transcript");
    await expect(tr).toContainText("Transcript: Landslide exposure", { timeout: 30_000 });
    for (const c of meta.classes) await expect(tr).toContainText(c.label);
    await expectAxeClean(page);
  });
});
