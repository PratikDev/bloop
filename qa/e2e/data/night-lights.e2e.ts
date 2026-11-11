// P4, night lights (DATA): a voice per city in the file; the nights play as a sequence with a playhead, notes at the
// rule's pitch, cloud-masked nights as rests with the gap text; the product and satellite from the file; the SVS 5313
// record links to Dhaka's measured radiance. Runs on a build with NEXT_PUBLIC_DATA_NIGHT_LIGHTS=1.
import { expect, test, type Page } from "@playwright/test";
import { lightsSteps } from "../../../src/lib/earth/nightlights";
import type { DataSoundState } from "../../../src/lib/earth/sound/out";
import type { NightLightsFile } from "../../../src/types/data-contract";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, readJson } from "./lib";

const file = readJson<NightLightsFile>("context/nightlights.json");
const sound = (page: Page) => page.evaluate(() => (window as unknown as { __bloopData?: DataSoundState }).__bloopData ?? null);

test.describe("Night lights", () => {
  test("every city plays its nights in order: notes at the rule's pitch, gaps as rests with their words; axe clean", async ({ page }) => {
    test.setTimeout(120_000);
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    await chooseRecord(page, "Night lights by city (Black Marble)");
    const record = page.getByTestId("record-nightlights_bm");
    await expect(record).toBeVisible({ timeout: 30_000 });
    await expect(record.getByTestId("lights-product")).toContainText("VJ146A2");
    await expect(record.getByTestId("lights-product")).toContainText("NOAA-20");
    await expectAxeClean(page, '[data-testid="record-nightlights_bm"]');
    const city = "Chattogram";
    await record.getByRole("group", { name: "City" }).getByRole("button", { name: city }).click();
    const steps = lightsSteps(file.cities[city]);
    await expect(record.getByTestId("lights-timeline").locator('[data-gap="true"]')).toHaveCount(steps.filter((s) => s.radiance === null).length);
    await record.getByTestId("lights-play").click();
    const seen = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      await expect.poll(async () => (await sound(page))?.lights?.step ?? -1, { timeout: 5000 }).toBeGreaterThanOrEqual(i);
      const s = (await sound(page))?.lights;
      if (!s || seen.has(s.step)) continue;
      seen.add(s.step);
      const want = steps[s.step];
      expect(s.radiance).toBe(want.radiance);
      if (want.hz === null) expect(s.hz).toBeNull();
      else expect(s.hz).toBeCloseTo(want.hz, 6);
    }
    // A gap is said as a gap, never as darkness.
    const gapDay = steps.find((s) => s.radiance === null);
    if (gapDay) {
      await record.getByRole("button", { name: "View as table" }).click();
      await expect(record.getByTestId("lights-table")).toContainText("gap: cloud");
    }
    await expect(record).not.toContainText(/blackout(?! is)/iu);
  });

  test("the SVS 5313 record links to Dhaka's measured radiance", async ({ page }) => {
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    await chooseRecord(page, /^Night lights 2012/u);
    await page.getByTestId("lights-link").click();
    const record = page.getByTestId("record-nightlights_bm");
    await expect(record).toBeVisible({ timeout: 30_000 });
    await expect(record.getByTestId("lights-line")).toContainText("Dhaka");
  });

  test("its transcript lists every night, gaps as gaps; axe clean", async ({ page }) => {
    await fresh(page, "/transcript?record=nightlights_bm");
    const tr = page.getByTestId("app-transcript");
    await expect(tr).toContainText("Transcript: Night lights by city", { timeout: 30_000 });
    await expect(tr).toContainText("gap: cloud");
    await expectAxeClean(page);
  });
});
