// Accessibility core, step 7 (docs/accessibility/CORE_PLAN.md): timed text tracks (WebVTT) for the sweep and the storm
// time-lapse, their cues driving the sound captions and the "now playing" line; a transcript page per record (Listen's
// ocean and rain, every Official record) linked from the record, its liner notes and How we know; the tactile disc's
// alt text (sidecar .txt, STL header). Runs on a build with NEXT_PUBLIC_A11Y_TIMED_TEXT=1 (steps 1–6 on), 3D shown and
// hidden. Expected values come from the shipped files through the app's own functions.
import { expect, test, type Download, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { gunzipSync } from "node:zlib";
import type { OfficialGrid } from "../../src/lib/data/official";
import { formatSignificant } from "../../src/lib/i18n";
import { gridExtremes } from "../../src/lib/transcript";
import { cueData, parseVtt } from "../../src/lib/timed-text/vtt";
import type { OfficialManifest } from "../../src/types/data-contract";
import { AUDIBLE, heard, navTo, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { captionLog, logCaptions, settle } from "../mentor/lib";

const ROOT = path.resolve(__dirname, "../..");
const OFFICIAL = "air_5533";

async function fresh(page: Page, hide3d: boolean, url = "/listen") {
  await start(page, { hide3d });
  await page.goto(url);
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await settle(page, 1200);
}

const text = async (d: Download) => readFileSync((await d.path())!, "utf8");

function officialGrid(record: string): { manifest: OfficialManifest; grid: OfficialGrid } {
  const dir = path.join(ROOT, "public/data/official", record);
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")) as OfficialManifest;
  const layer = manifest.layers.find((l) => l.id === manifest.play[0].map)!;
  const cell = layer.grid.width * layer.grid.height;
  const steps: Uint16Array[] = [];
  for (const chunk of layer.chunks) {
    const raw = gunzipSync(readFileSync(path.join(dir, chunk.file)));
    const codes = new Uint16Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    for (let i = 0; i < chunk.t1 - chunk.t0; i++) steps.push(codes.subarray(i * cell, (i + 1) * cell));
  }
  return { manifest, grid: { layer, steps } };
}

for (const hide3d of [false, true]) {
  test.describe(`timed text, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("the sweep's captions cues show as sound captions in order, with a now-playing line, and it is heard", async ({ page }) => {
      await fresh(page, hide3d);
      await logCaptions(page);
      await page.getByRole("button", { name: "Play sweep" }).first().click();
      await expect(page.getByTestId("sound-caption")).toContainText("Now playing:", { timeout: 10_000 });
      expect(await heard(page, 3000)).toBeGreaterThan(AUDIBLE);
      await expect.poll(async () => (await captionLog(page)).join("\n"), { timeout: 40_000 }).toContain("[tones stop: the sweep is finished]");
      const caps = (await captionLog(page)).filter((c) => c.startsWith("["));
      expect(caps[0]).toMatch(/^\[tones begin: the sweep moves outward from /u);
      expect(caps.some((c) => c.startsWith("[highest tone: the warmest water in the sweep, "))).toBe(true);
      await expect(page.getByTestId("sound-caption").filter({ hasText: "Now playing:" })).toHaveCount(0);
    });

    test("the ocean transcript tells the same story; its moments are the captions file's cues; axe clean", async ({ page }) => {
      await fresh(page, hide3d, "/transcript?record=ocean");
      await expect(page.getByRole("heading", { level: 1, name: "Transcript: Ocean temperature" })).toBeVisible();
      for (const id of ["mapping", "covers", "pattern", "moments", "trust", "svs", "files"]) await expect(page.getByTestId(`transcript-${id}`)).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("transcript-moments")).toContainText("[highest tone:");
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download the captions (.vtt)" }).click()]);
      expect(download.suggestedFilename()).toBe("bloop-sweep-captions.vtt");
      const file = await text(download);
      expect(file.startsWith("WEBVTT\n\nNOTE Bloop sweep, captions track.")).toBe(true);
      const cues = parseVtt(file);
      const listed = await page.getByTestId("transcript-moments").locator("li").allTextContents();
      expect(listed.map((l) => l.replace(/^\S+\s/u, ""))).toEqual(cues.map((c) => c.text));
      expect(await axeSerious(page, "main")).toEqual([]);
    });

    test("the rain transcript's metadata track gives every half-hourly frame its time, place, value and unit", async ({ page }) => {
      await fresh(page, hide3d, "/transcript?record=rain");
      await expect(page.getByTestId("transcript-files")).toBeVisible({ timeout: 30_000 });
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download the metadata (.vtt)" }).click()]);
      const cues = parseVtt(await text(download));
      const index = JSON.parse(readFileSync(path.join(ROOT, "public/data/sequence/index.json"), "utf8")) as { frames: { time_utc: string }[] };
      expect(cues).toHaveLength(index.frames.length);
      cues.forEach((c, i) => {
        const d = cueData(c)!;
        expect(d.time).toBe(index.frames[i].time_utc);
        expect(d.unit).toBe("mm/h");
        expect(d.place.length).toBeGreaterThan(0);
        expect(c.start).toBeCloseTo(i * 0.5, 6);
      });
      await expect(page.getByTestId("transcript-moments")).toContainText("[the time-lapse begins:");
    });

    test("an Official record's transcript: NASA's description, the highest value from the decoded grid, liner notes; linked from the record", async ({ page }) => {
      const { manifest, grid } = officialGrid(OFFICIAL);
      const ext = gridExtremes(grid)!;
      await fresh(page, hide3d, `/transcript?record=${OFFICIAL}`);
      await expect(page.getByRole("heading", { level: 1, name: `Transcript: ${manifest.app_title}` })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("transcript-svs")).toContainText(manifest.description.slice(0, 80));
      await expect(page.getByTestId("transcript-moments")).toContainText(`${formatSignificant(ext.max.value, "en", 3)} ${grid.layer.unit}`, { timeout: 30_000 });
      await expect(page.getByTestId("transcript-trust")).toContainText(manifest.credit_line.slice(0, 40));
      expect(await axeSerious(page, "main")).toEqual([]);
      await page.goto("/official");
      await settle(page, 1500);
      const link = page.getByRole("link", { name: /^Transcript: /u }).first();
      await expect(link).toBeVisible({ timeout: 30_000 });
      await link.click();
      await expect(page).toHaveURL(/\/transcript\?record=/u);
    });

    test("How we know links the ocean and rain transcripts; the Description tab links the needle's record", async ({ page }) => {
      await fresh(page, hide3d);
      await navTo(page, "How we know");
      await expect(page.getByRole("link", { name: "Transcript: Ocean temperature" })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole("link", { name: "Transcript: Rain and snow" })).toBeVisible();
      await page.getByRole("link", { name: "Transcript: Ocean temperature" }).click();
      await expect(page.getByTestId("transcript-mapping")).toBeVisible();
    });
  });
}

test("the tactile disc saves its alt text beside it, and carries it in the STL header", async ({ page }) => {
  await fresh(page, false, "/turntable");
  await page.getByRole("button", { name: "Records", exact: true }).click();
  await page.getByRole("button", { name: "Open the Dhaka time tunnel scene" }).click();
  const [txt] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save its description (.txt)" }).click()]);
  expect(txt.suggestedFilename()).toMatch(/^tactile-record_dhaka-apr-may-heat_.*\.txt$/u);
  const side = await text(txt);
  expect(side).toMatch(/^Alt text\nTactile disc, 120 millimetres across: .*\n\nExtended description\nOne raised ring runs once around the disc/u);
  expect(side).toMatch(/\nHighest, Dhaka: \d{4}, /u);
  const [stl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export tactile record (STL)" }).click()]);
  const header = readFileSync((await stl.path())!).subarray(0, 80).toString("latin1");
  expect(header.startsWith("Bloop: Tactile disc, 120 millimetres across:")).toBe(true);
});
