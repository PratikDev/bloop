// Accessibility core, step 6 (docs/accessibility/CORE_PLAN.md): Compare two dates (exact values and difference said,
// two tones beating), the sonar (N: pings, then the exact value where it arrives) and the expedition log (on screen,
// wrapped to the braille width, saved as .txt). Runs on a build with NEXT_PUBLIC_A11Y_EXPEDITION=1 (steps 1–5 on), 3D
// shown and hidden. Expected values come from the shipped files through the app's own functions.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { gunzipSync } from "node:zlib";
import { compareAt, defaultMonths } from "../../../src/lib/compare";
import type { GlobalLayer } from "../../../src/lib/data/global";
import { readUint16LE } from "../../../src/lib/data/grid";
import { sstGrid } from "../../../src/lib/describe/facts";
import { formatFixed, formatMonth } from "../../../src/lib/i18n";
import { sonarTarget } from "../../../src/lib/sonar";
import type { GlobalLayerFile, SstMetadata } from "../../../src/types/data-contract";
import { AUDIBLE, heard, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const map = (page: Page) => page.locator("#sound-map");
const DHAKA = { lat: 23.7, lon: 90.4 };

function heatLayer(): GlobalLayer {
  const dir = path.join(ROOT, "public/data/global");
  const meta = JSON.parse(readFileSync(path.join(dir, "heat.json"), "utf8")) as GlobalLayerFile;
  const raw = gunzipSync(readFileSync(path.join(dir, meta.file)));
  const values = new Int16Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  const rowOf = new Int32Array(meta.grid.lat.length * meta.grid.lon.length).fill(-1);
  meta.cells.forEach((id, row) => (rowOf[id] = row));
  const m0 = Number(meta.month_start.slice(0, 4)) * 12 + Number(meta.month_start.slice(5)) - 1;
  const months = Array.from({ length: meta.n_months }, (_, k) => `${Math.floor((m0 + k) / 12)}-${String(((m0 + k) % 12) + 1).padStart(2, "0")}`);
  return { meta, months, values, rowOf };
}

function sstTarget(at: { lat: number; lon: number }) {
  const meta = JSON.parse(readFileSync(path.join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
  const b = readFileSync(path.join(ROOT, "public/data/latest/sst.bin"));
  const codes = readUint16LE(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), meta.grid);
  return sonarTarget(sstGrid({ meta, codes }), at)!;
}

async function fresh(page: Page, hide3d: boolean) {
  await start(page, { hide3d });
  await page.goto("/listen");
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await settle(page, 1500);
  await logLiveRegion(page);
}

/** Go to (the dock's coordinates form): puts the needle at an exact place. */
async function goTo(page: Page, at: { lat: number; lon: number }) {
  await page.getByRole("button", { name: "Go to a latitude and longitude" }).click();
  await page.getByLabel("Latitude", { exact: true }).fill(String(at.lat));
  await page.getByLabel("Longitude", { exact: true }).fill(String(at.lon));
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await settle(page, 600);
}

const saidSince = async (page: Page, from: number) => (await liveLog(page)).slice(from).join(" ");

for (const hide3d of [false, true]) {
  test.describe(`expedition, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("Compare two dates at Dhaka: the file's two values and their difference are said, and two tones beat; axe clean", async ({ page }) => {
      await fresh(page, hide3d);
      await goTo(page, DHAKA);
      const layer = heatLayer();
      const { a, b } = defaultMonths(layer);
      const r = compareAt(layer, "heat", DHAKA, a, b);
      await page.getByRole("button", { name: "Compare two dates at the needle" }).click();
      const menu = page.getByTestId("compare-menu");
      await expect(menu.getByRole("button", { name: "Compare", exact: true })).toBeVisible({ timeout: 15_000 });
      expect(await axeSerious(page, '[data-testid="compare-menu"]')).toEqual([]);
      const from = (await liveLog(page)).length;
      await menu.getByRole("button", { name: "Compare", exact: true }).click();
      const said = new RegExp(
        `${formatMonth(a, "en")}: ${formatFixed(r.a.value!, "en", 2)} degrees Celsius\\. ${formatMonth(b, "en")}: ${formatFixed(r.b.value!, "en", 2)} degrees Celsius\\. The second is ${formatFixed(Math.abs(r.diff!), "en", 2)} degrees Celsius (higher|lower)\\.`,
        "u",
      );
      await expect.poll(() => saidSince(page, from), { timeout: 10_000 }).toMatch(said);
      expect(await heard(page, 8000)).toBeGreaterThan(AUDIBLE);
    });

    test("the sonar: N pings toward the warmest spot near here; arriving says the file's value; N again stops it", async ({ page }) => {
      await fresh(page, hide3d);
      const target = sstTarget({ lat: 21.5, lon: 89.8 });
      await map(page).focus();
      const from = (await liveLog(page)).length;
      await page.keyboard.press("n");
      await expect.poll(() => saidSince(page, from)).toContain("Sonar: finding the warmest spot near here.");
      expect(await heard(page, 4000)).toBeGreaterThan(AUDIBLE);
      const arriveFrom = (await liveLog(page)).length;
      await goTo(page, { lat: Number(target.lat.toFixed(2)), lon: Number(target.lon.toFixed(2)) });
      await expect
        .poll(() => saidSince(page, arriveFrom), { timeout: 10_000 })
        .toMatch(new RegExp(`Found the warmest spot near here: ${formatFixed(target.value, "en", 1)} °C, `, "u"));
      // Away from the target again (started on the target, the sonar finds it at once), N starts it and N stops it.
      await goTo(page, { lat: 21.5, lon: 89.8 });
      await map(page).focus();
      const again = (await liveLog(page)).length;
      await page.keyboard.press("n");
      await page.keyboard.press("n");
      await expect.poll(() => saidSince(page, again)).toContain("Sonar off.");
    });

    test("the expedition log: what Enter, Compare and the sonar said, its sources, wrapped to the braille width, saved as .txt", async ({ page }) => {
      await fresh(page, hide3d);
      await goTo(page, DHAKA);
      await map(page).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: "Compare two dates at the needle" }).click();
      await page.getByTestId("compare-menu").getByRole("button", { name: "Compare", exact: true }).click();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Expedition log: what this session found" }).click();
      const text = page.getByTestId("log-text");
      await expect(text).toContainText("Bloop expedition log");
      await expect(text).toContainText("Land temperature, against its normal");
      await expect(text).toContainText("Sources:");
      await expect(text).toContainText("GISTEMP");
      for (const line of ((await text.textContent()) ?? "").split("\n")) expect(line.length).toBeLessThanOrEqual(40);
      expect(await axeSerious(page, '[data-testid="log-menu"]')).toEqual([]);
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save as text (.txt)" }).click()]);
      expect(download.suggestedFilename()).toMatch(/^bloop-expedition-log-\d{4}-\d\d-\d\d\.txt$/u);
      const saved = readFileSync((await download.path())!, "utf8");
      expect(saved).toBe((await text.textContent()) ?? "");
    });
  });
}
