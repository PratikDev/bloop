// ART's other pieces in the browser (docs/statement/ART.md): the letter to the future (Listen; numbers from the
// engine's reading, the saved .txt), Your lifetime (notes, playhead, wording, the deep link, MIDI), data vs artistic
// choice, the tour naming every dataset, Water's journey (steps, deterministic WAV) and the listener test's new tasks.
// Build with every NEXT_PUBLIC_ART_* flag on.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { lifetimeSong, type LifetimeFile } from "../../../src/lib/art/lifetime/song";
import { TEST_VERSION } from "../../../src/lib/listen-test/results";
import { AUDIBLE, heard, navTo, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { answerExtras } from "../lib/listen-test";
import { settle } from "../mentor/lib";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const lifetime = JSON.parse(readFileSync(path.join(ROOT, "public/data/thenvsnow/lifetime.json"), "utf8")) as LifetimeFile;

async function listen(page: Page) {
  await start(page, { hide3d: true });
  await page.goto("/listen");
  await settle(page, 1200);
}

test("the letter: built from the reading under the needle, saved as braille-width text", async ({ page }) => {
  await listen(page);
  await page.getByRole("button", { name: "Leave a letter" }).click();
  const card = page.getByTestId("letter-card");
  await expect(card).toBeVisible();
  const text = await card.getByTestId("letter-text").innerText();
  const reading = await page.locator("#sound-map").getAttribute("data-reading");
  const value = /(-?\d+(?:\.\d+)?) ?°C/u.exec(reading ?? "")?.[1];
  if (value) expect(text).toContain(value);
  expect(text).toMatch(/read and checked by Bloop|no measurement/u);
  const [download] = await Promise.all([page.waitForEvent("download"), card.getByRole("button", { name: "Save the letter" }).click()]);
  const saved = readFileSync((await download.path())!, "utf8");
  expect(saved.split("\n").every((l) => l.length <= 40)).toBe(true);
  expect(saved).toContain("A letter to the future");
  expect(await axeSerious(page, '[data-testid="letter-card"]')).toEqual([]);
});

test("Your lifetime: one note a year, a moving playhead, honest wording, a link that reproduces it", async ({ page }) => {
  await start(page, { hide3d: true });
  await page.goto("/then-now?born=1998&city=dhaka");
  const life = page.getByTestId("lifetime");
  await expect(life).toBeVisible({ timeout: 20_000 });
  const expected = lifetimeSong(lifetime, "Dhaka", 1998).reduce((n, p) => n + p.notes.length, 0);
  await expect(life).toHaveAttribute("data-notes", String(expected));
  const lines = life.getByTestId("lifetime-lines");
  await expect(lines).toContainText("Since 1998 in Dhaka:");
  await expect(life.getByTestId("lifetime-link")).toHaveAttribute("href", "/then-now?born=1998&city=dhaka");
  await life.getByRole("button", { name: "Play your lifetime" }).click();
  expect(await heard(page, 5000)).toBeGreaterThan(AUDIBLE);
  await expect(life.getByTestId("playhead").first()).toBeVisible({ timeout: 5000 });
  const y1 = Number(await life.getByTestId("playhead").first().getAttribute("data-year"));
  await page.waitForTimeout(1200);
  const y2 = Number(await life.getByTestId("playhead").first().getAttribute("data-year"));
  expect(y2).toBeGreaterThan(y1);
  await life.getByRole("button", { name: "Stop" }).click();
  const [midi] = await Promise.all([page.waitForEvent("download"), life.getByRole("button", { name: "Download as MIDI" }).click()]);
  expect(readFileSync((await midi.path())!).subarray(0, 4).toString("latin1")).toBe("MThd");
  // Too few years: the range only, never a trend.
  await page.goto("/then-now?born=2020&city=dhaka");
  await expect(page.getByTestId("lifetime-lines")).toContainText("too few years for a clear test");
  expect(await axeSerious(page, '[data-testid="lifetime"]')).toEqual([]);
});

test("data vs artistic choice on the rules and on an Official record", async ({ page }) => {
  await start(page, { hide3d: true });
  await navTo(page, "Official records");
  const dc = page.getByTestId("data-choice").first();
  await expect(dc).toBeVisible({ timeout: 30_000 });
  await expect(dc.locator('[data-list="data"]')).toContainText("silence means no data");
  await expect(dc.locator('[data-list="choice"]')).toContainText("the range");
});

test("the tour names the dataset on every step", async ({ page }) => {
  test.setTimeout(150_000);
  await start(page, { hide3d: true });
  await page.goto("/listen?tour=1");
  const line = page.getByTestId("tour-dataset");
  for (const step of ["hum", "sweep", "storm"]) await expect(line).toHaveAttribute("data-step", step, { timeout: 60_000 });
  await expect(line).toContainText("Data:");
});

// With the landslide record on, Water's journey has its landslide-exposure step too (integration wire).
const JOURNEY_STEPS = process.env.NEXT_PUBLIC_DATA_LANDSLIDES === "1" ? 6 : 5;

test("Water's journey: every step named, played in order, and one deterministic WAV", async ({ page }) => {
  test.setTimeout(150_000);
  await listen(page);
  await page.getByRole("button", { name: "Water's journey" }).click();
  const j = page.getByTestId("journey");
  await expect(j.locator("ol li")).toHaveCount(JOURNEY_STEPS, { timeout: 30_000 });
  await expect(j.locator("ol li").first()).toContainText("pattern only");
  await j.getByRole("button", { name: "Play the suite" }).click();
  await expect(j).toHaveAttribute("data-step", "lightning", { timeout: 10_000 });
  await expect(j).toHaveAttribute("data-step", "river", { timeout: 20_000 });
  await j.getByRole("button", { name: "Stop" }).click();
  const fp: string[] = [];
  for (let i = 0; i < 2; i++) {
    await Promise.all([page.waitForEvent("download"), j.getByRole("button", { name: /Play as one piece/u }).click()]);
    await expect(j.getByTestId("journey-wav")).toBeVisible({ timeout: 90_000 });
    fp.push((await j.getByTestId("journey-wav").getAttribute("data-fingerprint"))!);
  }
  expect(fp[0]).toBe(fp[1]);
  expect(await axeSerious(page, '[data-testid="journey"]')).toEqual([]);
});

test("the listener test: emotion ratings and ear vs eye after the tasks, exported with the current testVersion", async ({ page }) => {
  test.setTimeout(150_000);
  await start(page, { hide3d: true });
  await page.goto("/listen-test");
  await page.getByRole("button", { name: /I understand/u }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByRole("button", { name: "Start the tasks" }).click();
  // The core tasks (five, or four on a day with no rain): any answer.
  while (!(await page.getByTestId("lt-emotion").isVisible().catch(() => false))) {
    await page.locator("[data-option]").first().click();
    await settle(page, 200);
  }
  // Emotion ratings, then ear vs eye (left out only on a dry day: no clear answer).
  await answerExtras(page);
  await page.getByRole("button", { name: "Finish" }).click();
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Export/u }).click()]);
  const json = JSON.parse(readFileSync((await file.path())!, "utf8"));
  expect(json.testVersion).toBe(TEST_VERSION);
  expect(json.extras.emotion.map((r: { condition: string }) => r.condition).sort()).toEqual(["sound", "visual"]);
});
