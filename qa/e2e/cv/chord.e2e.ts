// The value chord (CV/ML build, piece B5) in a real browser, on a build with NEXT_PUBLIC_CV_READ=1 and
// NEXT_PUBLIC_CV_CHORD=1. Which named box is bimodal or unimodal today is computed here from the shipped SST grid with
// the app's own functions (never typed): with the toggle on, a bimodal box plays 2 tones and a unimodal box 1 (the
// output is audible); a pattern-only record plays none and says why; Both and the proof-in-unison duet say "chord off".
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { violations } from "../../../src/a11y/brailleText";
import { findModes } from "../../../src/lib/audio/layers/chord/modes";
import { NAMED_BOXES } from "../../../src/lib/cv/boxes";
import { boxStats } from "../../../src/lib/cv/box-stats";
import { ERROR_BUDGET } from "../../../src/lib/cv/error-budget";
import { sstSource } from "../../../src/lib/cv/read-source";
import { readUint16LE } from "../../../src/lib/data/grid";
import type { SstMetadata } from "../../../src/types/data-contract";
import { AUDIBLE, heard, navTo, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { settle } from "../mentor/lib";

const ROOT = path.join(__dirname, "..", "..", "..");
const meta = JSON.parse(readFileSync(path.join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
const bin = readFileSync(path.join(ROOT, "public/data/latest/sst.bin"));
const sst = sstSource({ meta, codes: readUint16LE(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), meta.grid) }, "SST");
const sigma = ERROR_BUDGET.axes.find((a) => a.records.includes("ocean"))?.error_in_axis_units ?? NaN;
const groups = (id: string) => findModes(boxStats(sst.grid, NAMED_BOXES.find((b) => b.id === id)!.bounds, sst.axis).values, sigma).length;
const bimodal = NAMED_BOXES.find((b) => groups(b.id) === 2);
const unimodal = NAMED_BOXES.find((b) => groups(b.id) === 1);

const panel = (page: Page) => page.getByTestId("jukebox-read");
async function openWithChord(page: Page, to: "Listen" | "Official records" = "Listen") {
  await start(page, { hide3d: true });
  // A click through the header keeps the started audio (a reload would need a new gesture).
  await navTo(page, to);
  await settle(page, 1500);
  // Listen opens on Both (two data voices, no chord): the Ocean track plays one.
  if (to === "Listen") {
    await page.locator("#sound-map").focus();
    await page.keyboard.press("1");
  }
  await panel(page).getByRole("button", { name: "What the jukebox read from this frame" }).click();
}
const chordOn = (page: Page) => panel(page).getByRole("button", { name: "Chord: spread of values" }).click();
const pick = (page: Page, name: string) => panel(page).getByRole("button", { name, exact: true }).click();

test("a bimodal box plays 2 tones, a unimodal box 1; audible; the text and braille line follow", async ({ page }) => {
  expect(bimodal, "a named box with two groups in today's SST").toBeDefined();
  expect(unimodal).toBeDefined();
  await openWithChord(page);
  await chordOn(page);
  await pick(page, bimodal!.name);
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "2");
  expect(await heard(page)).toBeGreaterThan(AUDIBLE);
  await expect(panel(page).getByTestId("chord-text")).toContainText("Two groups:");
  const short = (await panel(page).getByTestId("chord-short").textContent()) ?? "";
  expect(short).toMatch(/^Chord 2 grp /u);
  expect(violations(short, 40)).toEqual([]);
  await pick(page, unimodal!.name);
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "1");
  await expect(panel(page).getByTestId("chord-text")).toContainText("One group around");
  expect(await axeSerious(page, '[data-testid="jukebox-read"]')).toEqual([]);
});

test("Both and the proof-in-unison duet: chord off, and the page says so", async ({ page }) => {
  await openWithChord(page);
  await chordOn(page);
  await pick(page, bimodal!.name);
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "2");
  await page.locator("#sound-map").focus();
  await page.keyboard.press("3");
  await expect(panel(page).getByTestId("chord-text")).toHaveAttribute("data-block", "both");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "0");
  await page.keyboard.press("1");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "2");
  await page.locator("#sound-map").focus();
  await page.keyboard.press("u");
  await expect(panel(page).getByTestId("chord-text")).toHaveAttribute("data-block", "duet", { timeout: 10_000 });
  await expect(panel(page).getByTestId("chord-text")).toContainText("proof-in-unison duet");
});

test("a pattern-only record plays no chord and shows why", async ({ page }) => {
  await openWithChord(page, "Official records");
  await page.getByRole("button", { name: /^Near-surface wind speed/u }).click();
  await panel(page).getByRole("button", { name: "What the jukebox read from this frame" }).click();
  await chordOn(page);
  await expect(panel(page).getByTestId("chord-text")).toHaveAttribute("data-block", "pattern-only", { timeout: 30_000 });
  await expect(panel(page).getByTestId("chord-text")).toHaveText("Chord off: this record is pattern only, so no values were read.");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "0");
});
