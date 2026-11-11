// The fire trio: the "Fires and fire weather" record (chord + Geiger clicks + NASA's picture), its stated
// silences, the archive replay (forecast meets outcome), the pilot table, its transcript, and the fire-weather layer
// on Listen. Runs on a build with NEXT_PUBLIC_DATA_FIRE_WEATHER=1 and NEXT_PUBLIC_DATA_WILDFIRES=1. Every expected value
// comes from the shipped files through the app's own functions; the sound is read from window.__bloopData.
import { expect, test, type Page } from "@playwright/test";
import { gunzipSync } from "node:zlib";
import { violations } from "../../../src/a11y/brailleText";
import { classAt, type ClassGrid } from "../../../src/lib/earth/class-grid";
import { chordHz, classesRule, classState, FIRE_WEATHER_VOICE } from "../../../src/lib/earth/classes";
import { dailyDays, dayCount, seriesOf, chtSeasonCases } from "../../../src/lib/earth/firms";
import { geigerRate } from "../../../src/lib/earth/geiger";
import { pilotRows, pilotSummary } from "../../../src/lib/earth/pilot";
import { activeRegions } from "../../../src/lib/earth/regions";
import type { DataSoundState } from "../../../src/lib/earth/sound/out";
import type { FirmsContextFile, FwiArchiveIndex, FwiClassMetadata } from "../../../src/types/data-contract";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, readBin, readJson } from "./lib";

const meta = readJson<FwiClassMetadata>("latest/fwi_class.json");
const grid: ClassGrid<FwiClassMetadata> = { meta, codes: new Uint8Array(readBin("latest/fwi_class.bin")) };
const firms = readJson<FirmsContextFile>("context/firms.json");
const daily = firms.daily!;
const archive = readJson<FwiArchiveIndex>("context/fwi_archive_index.json");
const rule = classesRule(FIRE_WEATHER_VOICE);
const sound = (page: Page) => page.evaluate(() => (window as unknown as { __bloopData?: DataSoundState }).__bloopData ?? null);
const TITLE = "Fires and fire weather";
const [BW, BS, BE, BN] = daily.boxes.Bangladesh;
const BD = { lat: (BS + BN) / 2, lon: (BW + BE) / 2 };

async function openRecord(page: Page) {
  await fresh(page, "/listen");
  await navTo(page, "Official records");
  await chooseRecord(page, TITLE);
  const record = page.getByTestId("record-fires_fwi");
  await expect(record).toBeVisible({ timeout: 30_000 });
  return record;
}

test.describe("Fires and fire weather", () => {
  test("the record shows the class and the count at the needle, its labels, ages and braille line; axe clean", async ({ page }) => {
    const record = await openRecord(page);
    const code = classAt(grid, BD.lat, BD.lon);
    await expect(record.getByTestId("fwi-line")).toHaveAttribute("data-fwi-code", String(code));
    await expect(record.getByTestId("fwi-line")).toContainText(meta.classes.find((c) => c.code === code)!.label);
    const last = dailyDays(daily).at(-1)!;
    const c = dayCount(seriesOf(daily, "Bangladesh", daily.sources[0])!, last)!;
    await expect(record.getByTestId("firms-line")).toHaveAttribute("data-count", String(c.count));
    await expect(record.getByTestId("firms-line")).toContainText(c.count === 0 ? "Silence: no detections in this box" : `${c.count} hotspots`);
    await expect(record).toContainText("experimental 1-day forecast");
    await expect(record).toContainText("A hotspot is a pixel containing one or more fires, not one fire.");
    await expect(record).toContainText("five-day fire radiative power window");
    await expect(record).toContainText("NOAA-21");
    const line = (await record.getByTestId("braille-line").innerText()).trim();
    expect(violations(line, 40)).toEqual([]);
    await expect(record.getByTestId("fire-map")).toHaveAttribute("aria-label", /NASA's map of active fires \(SVS 5113\)/u);
    await expect(record.locator("[data-age-product]")).toHaveCount(3);
    await expectAxeClean(page, '[data-testid="record-fires_fwi"]');
  });

  test("each class plays its own chord state; very low and zero detections are stated silences; FRP only brightens", async ({ page }) => {
    const record = await openRecord(page);
    await record.getByTestId("fire-play").click();
    // Bangladesh: very low → silence; its latest day's count → the Geiger rate.
    await expect.poll(async () => (await sound(page))?.chord?.hz ?? null).toEqual(chordHz(rule, classState(rule, classAt(grid, BD.lat, BD.lon))));
    // A most-active region (found by the code): its class's own chord.
    const regions = activeRegions(meta.grid, grid.codes);
    await record.locator('[data-region="0"]').click();
    const top = classAt(grid, regions[0].lat, regions[0].lon);
    await expect.poll(async () => (await sound(page))?.chord?.code ?? null).toBe(top);
    expect((await sound(page))?.chord?.hz).toEqual(chordHz(rule, classState(rule, top)));
    // Punjab, NOAA-20, a day with hotspots: the rate is the rule's; a zero day is silence with its words.
    await record.getByRole("group", { name: "FIRMS box" }).getByRole("button", { name: "Punjab" }).click();
    await record.getByRole("group", { name: "Sensor" }).getByRole("button", { name: "NOAA-20" }).click();
    const series = seriesOf(daily, "Punjab", "VIIRS_NOAA20_NRT")!;
    const busy = series.days[series.counts.indexOf(Math.max(...series.counts))];
    const zero = series.days[series.counts.indexOf(0)];
    for (const [day, count] of [[busy, Math.max(...series.counts)], [zero, 0]] as const) {
      await record.getByTestId("day-picker").click();
      await page.getByRole("option", { name: new RegExp(`^${Number(day.slice(8))} `, "u") }).first().click();
      await expect(record.getByTestId("firms-line")).toHaveAttribute("data-count", String(count));
      await expect.poll(async () => (await sound(page))?.geiger?.rate ?? null).toBeCloseTo(geigerRate(count), 6);
    }
    await expect(record.getByTestId("firms-line")).toContainText("Silence: no detections in this box");
    await expect(record).toContainText("Clicks: stated silence");
    await record.getByTestId("fire-play").click();
  });

  test("forecast meets outcome: the replay plays the archive's days in order; the pilot table and rho come from the files", async ({ page }) => {
    const record = await openRecord(page);
    await record.getByTestId("fire-replay").click();
    const n = archive.days.length;
    const step = record.getByTestId("replay-step");
    await expect(step).toContainText(`Day 1 of ${n}`, { timeout: 15_000 });
    for (let i = 0; i < n; i++) {
      const d = archive.days[i];
      await expect(step).toContainText(`Day ${i + 1} of ${n}`, { timeout: 8000 });
      const codes = new Uint8Array(gunzipSync(readBin(d.file)));
      const code = classAt({ meta, codes }, BD.lat, BD.lon);
      await expect.poll(async () => (await sound(page))?.chord?.code ?? null).toBe(code);
    }
    // The replay loaded the archive, so the pilot table is already there (else its button loads it).
    const show = record.getByRole("button", { name: "Show the pilot table" });
    if (await show.isVisible()) await show.click();
    const days = archive.days.map((d) => ({ date: d.date, codes: new Uint8Array(gunzipSync(readBin(d.file))) }));
    const rows = pilotRows(daily, meta.grid, days);
    await expect(record.getByTestId("pilot-table").locator("tbody tr")).toHaveCount(rows.length);
    const summary = pilotSummary(rows, daily.sources);
    for (const s of summary) await expect(record.locator(`[data-testid="pilot-rho"] li[data-n="${s.n}"]`).first()).toBeVisible();
    await expect(record.getByTestId("pilot")).toContainText("pilot check, experimental forecast");
    if (summary.every((s) => s.claim === "none")) await expect(record.getByTestId("pilot-rho")).toContainText("no skill is claimed");
  });

  test("off-season: Bangladesh's zero day is said, and the Hill Tracts fire-season example plays its clicks", async ({ page }) => {
    const record = await openRecord(page);
    const season = record.getByTestId("fire-season");
    await expect(season).toContainText("Off-season: no detections in Bangladesh");
    const first = chtSeasonCases(firms)[0];
    await season.getByRole("button", { name: new RegExp(`Fire season example: .* ${first.year} \\(${first.sensor}`, "u") }).click();
    await expect(record.getByTestId("season-step")).toBeVisible();
    await expect.poll(async () => (await sound(page))?.geiger?.rate ?? -1).toBeGreaterThan(0);
  });

  test("its transcript page tells the same story; axe clean", async ({ page }) => {
    await fresh(page, "/transcript?record=fires_fwi");
    const tr = page.getByTestId("app-transcript");
    await expect(tr).toBeVisible({ timeout: 30_000 });
    await expect(tr).toContainText("Transcript: Fires and fire weather");
    await expect(tr).toContainText("Forecast meets outcome: pilot check, experimental forecast");
    await expectAxeClean(page);
  });

  test("Listen: the fire-weather layer plays the class at the needle and says what it is", async ({ page }) => {
    await fresh(page, "/listen");
    await page.locator("[data-dock]").getByRole("button", { name: /^Mixer/u }).click();
    const layer = page.getByTestId("fire-layer");
    await layer.getByRole("button", { name: "Play tomorrow's fire weather at the needle" }).click();
    const reading = layer.getByTestId("fire-layer-reading");
    await expect(reading).toBeVisible({ timeout: 15_000 });
    const code = Number(await reading.getAttribute("data-fwi-code"));
    await expect(reading).toContainText(meta.classes.find((c) => c.code === code)!.label === "no calculation" ? "no forecast" : meta.classes.find((c) => c.code === code)!.label);
    await expect(layer).toContainText("never a measured fire");
    await expectAxeClean(page, '[data-testid="fire-layer"]');
  });
});
