// NASA's own method: SVS 13786 is a playable method record; NASA mode's pitch follows distance and Bloop
// mode's follows the value, on the same points of one frame; the toggle switches modes; the caption and the credits
// (SYSTEM Sounds, the SVS page, "not NASA's code") show. Runs on a build with NEXT_PUBLIC_DATA_RADAR=1.
import { expect, test, type Page } from "@playwright/test";
import { bloopNotes, nasaNotes, radarPoints, type MethodManifest } from "../../../src/lib/earth/radar";
import type { DataSoundState } from "../../../src/lib/earth/sound/out";
import type { SstField } from "../../../src/lib/data/latest";
import type { SstMetadata } from "../../../src/types/data-contract";
import { navTo } from "../lib/app";
import { chooseRecord, expectAxeClean, fresh, readBin, readJson } from "./lib";

const meta = readJson<SstMetadata>("latest/sst.json");
const buf = readBin("latest/sst.bin");
const sst: SstField = { meta, codes: new Uint16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) };
const manifest = readJson<MethodManifest>("official/sonification_13786/manifest.json");
const speed = manifest.analysis!.angular_speed_deg_s;
const sound = (page: Page) => page.evaluate(() => (window as unknown as { __bloopData?: DataSoundState }).__bloopData ?? null);

test("NASA mode vs Bloop mode: distance → pitch vs value → pitch on one frame; toggle, caption, credits; axe clean", async ({ page }) => {
  await fresh(page, "/listen");
  await navTo(page, "Official records");
  await chooseRecord(page, manifest.app_title);
  const record = page.getByTestId("record-sonification_13786");
  await expect(record).toBeVisible({ timeout: 30_000 });
  await expect(record.getByTestId("radar-caption")).toHaveText("NASA's version: where things are. Bloop's version: what the values are.");
  await expect(record.getByTestId("radar-credit")).toContainText("SYSTEM Sounds (M. Russo, A. Santaguida)");
  await expect(record.getByTestId("radar-credit")).toContainText("not NASA's code");
  await expect(record.getByRole("link", { name: /svs\.gsfc\.nasa\.gov\/13786/u })).toBeVisible();
  await expectAxeClean(page, '[data-testid="record-sonification_13786"]');
  const [lat, lon] = ((await record.getByTestId("radar-plot").getAttribute("data-centre")) ?? "").split(",").map(Number);
  const points = radarPoints(sst, { lat, lon });
  for (const mode of ["nasa", "bloop"] as const) {
    await record.getByRole("group", { name: "Mode" }).getByRole("button", { name: mode === "nasa" ? "NASA mode" : "Bloop mode" }).click();
    await expect(record.getByTestId("radar-rule")).toHaveAttribute("data-mode", mode);
    await record.getByTestId("radar-play").click();
    const notes = mode === "nasa" ? nasaNotes(points, speed, meta.value_range) : bloopNotes(points, speed);
    await expect.poll(async () => (await sound(page))?.radar?.mode ?? null).toBe(mode);
    const r = (await sound(page))!.radar!;
    expect(r.notes).toBe(notes.length);
    expect(r.firstHz).toBeCloseTo(notes[0].hz, 6);
    expect(r.lastHz).toBeCloseTo(notes[notes.length - 1].hz, 6);
    await record.getByTestId("radar-play").click();
  }
});

test("its transcript names both rules and the credit; axe clean", async ({ page }) => {
  await fresh(page, "/transcript?record=sonification_13786");
  const tr = page.getByTestId("app-transcript");
  await expect(tr).toContainText("NASA mode", { timeout: 30_000 });
  await expect(tr).toContainText("Bloop mode");
  await expect(tr).toContainText("SYSTEM Sounds");
  await expectAxeClean(page);
});
