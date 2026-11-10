// Integration wire 1: the Science to Art dial drives the CV value chord (src/lib/art/chord-hook.ts). On a build with the
// CV and ART flags on: with the user's own chord toggle OFF, the dial at Blend and Music sounds the chord on a bimodal box
// (2 tones, each at the ocean rule's pitch of its group within 1 cent), Measure lets it go, Both keeps it off, and the
// "not available in this version" line is gone. Which named box is bimodal is computed here from today's SST grid (never typed).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { continuousRule, mapContinuous } from "../../src/lib/audio/mapping";
import { findModes } from "../../src/lib/audio/layers/chord/modes";
import { NAMED_BOXES } from "../../src/lib/cv/boxes";
import { boxStats } from "../../src/lib/cv/box-stats";
import { ERROR_BUDGET } from "../../src/lib/cv/error-budget";
import { sstSource } from "../../src/lib/cv/read-source";
import { readUint16LE } from "../../src/lib/data/grid";
import type { SstMetadata } from "../../src/types/data-contract";
import { navTo, settingsButton, start } from "../lib/app";
import { settle } from "../mentor/lib";

const ROOT = path.join(__dirname, "..", "..");
const meta = JSON.parse(readFileSync(path.join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
const bin = readFileSync(path.join(ROOT, "public/data/latest/sst.bin"));
const sst = sstSource({ meta, codes: readUint16LE(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), meta.grid) }, "SST");
const sigma = ERROR_BUDGET.axes.find((a) => a.records.includes("ocean"))?.error_in_axis_units ?? NaN;
const modesOf = (id: string) => findModes(boxStats(sst.grid, NAMED_BOXES.find((b) => b.id === id)!.bounds, sst.axis).values, sigma);
const bimodal = NAMED_BOXES.find((b) => modesOf(b.id).length === 2);
const cents = (a: number, b: number) => Math.abs(1200 * Math.log2(a / b));

const panel = (page: Page) => page.getByTestId("jukebox-read");
const dial = (page: Page) => page.getByTestId("art-dial").first();
const stop = (page: Page, name: "Measure" | "Blend" | "Music") =>
  dial(page).getByRole("group", { name: "Science to Art" }).getByRole("button", { name }).click();

async function listenOcean(page: Page, track: "1" | "3" = "1") {
  await start(page, { hide3d: true });
  // Through the header: a reload would need a new gesture before any sound plays.
  await navTo(page, "Listen");
  await settle(page, 1500);
  await page.locator("#sound-map").focus();
  await page.keyboard.press(track); // 1 = Ocean (one data voice), 3 = Both
  await panel(page).getByRole("button", { name: "What the jukebox read from this frame" }).click();
  await panel(page).getByRole("button", { name: bimodal!.name, exact: true }).click();
}

test("the dial at Blend and Music sounds the real value chord; Measure lets it go", async ({ page }) => {
  expect(bimodal, "a named box with two groups in today's SST").toBeDefined();
  await listenOcean(page);
  await settingsButton(page).click();
  await stop(page, "Measure");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "0");
  await stop(page, "Blend");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "2");
  await expect(dial(page).getByTestId("dial-lines")).not.toContainText("not available in this version");
  const rule = continuousRule("ocean");
  const want = modesOf(bimodal!.id).map((m) => mapContinuous(m.value, rule) ?? NaN);
  const got = ((await panel(page).getAttribute("data-chord-hz")) ?? "").split(" ").map(Number);
  expect(got.length).toBe(2);
  got.sort((a, b) => a - b).forEach((hz, i) => expect(cents(hz, want.sort((a, b) => a - b)[i])).toBeLessThanOrEqual(1));
  await stop(page, "Music");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "2");
  await stop(page, "Measure");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "0");
});

test("in Both mode the dial keeps the chord off and says why", async ({ page }) => {
  await listenOcean(page, "3");
  await settingsButton(page).click();
  await stop(page, "Blend");
  await expect(dial(page).getByTestId("dial-lines")).toContainText("Value chord: off with two data voices (Both).");
  await expect(panel(page)).toHaveAttribute("data-chord-voices", "0");
});
