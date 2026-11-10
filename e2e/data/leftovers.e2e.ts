// P1, the leftovers (DATA): the live provenance cards read the live_*/validation.json files (their key numbers equal
// docs/official/VALIDATION_TABLE.md's), "Not playable" lists the pipeline's hidden records with its reasons, and the
// Sound terrain shows NASA's SVS 5176 picture while the anomaly plays. Runs on a build with NEXT_PUBLIC_DATA_LEFTOVERS=1.
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { hiddenRecords } from "../../src/lib/earth/hidden";
import type { OfficialIndex } from "../../src/types/data-contract";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, OFFICIAL_SECTION, openSceneOnly, readJson, ROOT, sceneRead } from "./lib";

/** VALIDATION_TABLE.md's "Key numbers" cells for a record. */
const tableNumbers = (record: string) =>
  readFileSync(path.join(ROOT, "docs/official/VALIDATION_TABLE.md"), "utf8")
    .split("\n")
    .filter((l) => l.startsWith(`| ${record} |`))
    .map((l) => l.split(" | ")[4]);

const ALT = "NASA's map of ocean temperature against normal";

test.describe("the leftovers", () => {
  test("Listen's How we got this shows the live frame's acceptance check, equal to the validation table", async ({ page }) => {
    await fresh(page, "/listen");
    await page.getByRole("button", { name: /^How we got this: ocean temperature/u }).first().click();
    const check = page.getByTestId("how-we-got-this").getByTestId("live-check").first();
    await expect(check).toBeVisible({ timeout: 15_000 });
    const record = (await check.getAttribute("data-live-check")) ?? "";
    const shown = await check.locator("[data-key-numbers]").evaluateAll((els) => els.map((e) => e.getAttribute("data-key-numbers") ?? ""));
    expect(shown).toEqual(tableNumbers(record));
    for (const n of shown) await expect(check).toContainText(n);
  });

  test("Official records lists the hidden related records as Not playable, with the pipeline's reasons", async ({ page }) => {
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    const list = page.locator(OFFICIAL_SECTION).getByTestId("not-playable");
    await expect(list).toBeVisible({ timeout: 30_000 });
    const hidden = hiddenRecords(readJson<OfficialIndex>("related/index.json"));
    await expect(list.locator("li")).toHaveCount(hidden.length);
    for (const h of hidden) await expect(list.locator(`li[data-record="${h.record}"]`)).toContainText(h.reason);
    // They stay unplayable: no record button for them on any shelf.
    for (const h of hidden) await expect(page.getByRole("button", { name: h.title, exact: true })).toHaveCount(0);
    await expectAxeClean(page, '[data-testid="not-playable"]');
  });

  test("P6: Perpetual Ocean 2's How we got this credits SVS 5479, the flat maps its checks used", async ({ page }) => {
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    await chooseRecord(page, /^Perpetual Ocean 2/u);
    await page.locator(OFFICIAL_SECTION).getByRole("button", { name: /^How we got this: Perpetual Ocean 2/u }).first().click();
    const c = page.getByTestId("how-we-got-this").getByTestId("checked-with");
    await expect(c.locator('li[data-svs="5479"]')).toBeVisible({ timeout: 15_000 });
    await expect(c).toContainText("GLORYS12");
  });

  test("Sound terrain: N puts the SVS 5176 picture on the terrain, with its alt text, frame date and legend", async ({ page }) => {
    test.setTimeout(150_000);
    await fresh(page, "/turntable?debug=1", false);
    await openSceneOnly(page, "Sound terrain");
    await expect.poll(async () => (await sceneRead(page)) !== null, { timeout: 30_000 }).toBe(true);
    await page.keyboard.press("n");
    await expect.poll(async () => (await sceneRead(page))?.picture ?? null).toBe("sst_anom");
    await expect(page.locator(`[aria-label^="${ALT}"]`).first()).toBeAttached();
    await expect(page.getByText("Ocean temperature vs normal (the 5176 picture)").first()).toBeVisible();
    await expect(page.getByText(/Picture and anomaly: the SVS 5176 frame of/u).first()).toBeVisible();
    await page.keyboard.press("n");
    await expect.poll(async () => (await sceneRead(page))?.picture ?? null).toBe("sst");
  });
});
