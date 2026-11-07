// Mentor item 8: "…and do a quick listener test." The hidden page runs consent, the 18+ question, the intro and the
// tasks; Playwright answers with fixture choices and the exported file must match them, with each correct answer the one
// computed from the shipped data (in Node here, from the same files). Nothing is linked, indexed or uploaded.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { AUDIBLE, heard } from "../lib/app";
import { buildTasks } from "../../src/lib/listen-test/tasks";
import type { ResultsFile } from "../../src/lib/listen-test/results";
import type { CitiesThenNowFile, GlobalPlacesFile, SstPairsFile } from "../../src/types/data-contract";
import { openAt, shipped, shot } from "./lib";

const dhaka = shipped<CitiesThenNowFile>("demo/cities_then_now.json").cities.find((c) => c.name === "Dhaka");
// The tasks whose answers don't depend on the live rain grid, computed here from the shipped files.
const expected = Object.fromEntries(
  buildTasks({
    pairs: shipped<SstPairsFile>("truth/sst_pairs.json").pairs,
    places: shipped<GlobalPlacesFile>("global/places.json").places,
    rainAt: () => ({ mmPerHour: null, phase: "nodata" }),
    heat: { place: "Dhaka", A: dhaka?.heat.A ?? { window: [0, 0], years: [], values: [], mean: 0, spread: 0, n_years: 0 }, B: dhaka?.heat.B ?? { window: [0, 0], years: [], values: [], mean: 0, spread: 0, n_years: 0 } },
  }).map((t) => [t.id, t.correct]),
);

const button = (page: Page, name: string) => page.locator("main").getByRole("button", { name, exact: true });

test("hidden: no link to it, noindex, not a station", async ({ page, request }) => {
  const html = await (await request.get("/listen-test")).text();
  expect(html).toMatch(/<meta name="robots" content="noindex, ?nofollow"/u);
  for (const url of ["/", "/listen", "/how", "/team"]) {
    await openAt(page, url);
    expect([url, await page.locator('a[href*="listen-test"]').count()]).toEqual([url, 0]);
  }
});

test("under 18: the test ends politely; stopping keeps nothing", async ({ page }) => {
  await openAt(page, "/listen-test");
  await button(page, "I understand. Continue").click();
  await button(page, "No").click();
  await expect(page.locator("main")).toContainText("This test is only for adults, so it ends here.");
  await openAt(page, "/listen-test");
  await button(page, "I understand. Continue").click();
  await button(page, "Yes").click();
  await button(page, "Stop the test").click();
  await expect(page.locator("main")).toContainText("Nothing was saved.");
});

test("a full run with fixture answers: the exported file matches them and the data's answers", async ({ page }) => {
  test.setTimeout(180_000);
  await openAt(page, "/listen-test");
  await shot(page, "item08", "consent");
  await button(page, "I understand. Continue").click();
  await button(page, "Yes").click();
  await button(page, "Play the reference tone").click();
  expect(await heard(page, 6000)).toBeGreaterThan(AUDIBLE);
  await button(page, "Start the tasks").click();

  const chosen: { task: string; answer: string }[] = [];
  const total = Number(/of (\d+)/u.exec((await page.locator("main h2").textContent()) ?? "")?.[1]);
  expect(total).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < total; i++) {
    await expect(page.locator("main h2")).toHaveText(`Task ${i + 1} of ${total}`);
    await button(page, "Play the sound").click();
    expect(await heard(page, 8000)).toBeGreaterThan(AUDIBLE);
    if (i === 0) await shot(page, "item08", "task");
    // Fixture answers: the last option on even tasks, the first on odd ones.
    const options = page.locator("main [data-option]");
    const pick = options.nth(i % 2 === 0 ? (await options.count()) - 1 : 0);
    chosen.push({ task: String(i), answer: (await pick.getAttribute("data-option")) ?? "" });
    await pick.click();
  }
  await page.locator("main textarea").fill("  fixture comment  ");
  await button(page, "Finish").click();
  const download = page.waitForEvent("download");
  await button(page, "Export results").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^listen-test-\d{8}-\d{4}\.json$/u);
  const saved = JSON.parse(readFileSync(await file.path(), "utf8")) as ResultsFile;

  expect(Object.keys(saved).sort()).toEqual(["comment", "formative", "kind", "lang", "results", "version"]);
  expect([saved.kind, saved.formative, saved.lang, saved.comment]).toEqual(["bloop-listen-test", true, "en", "fixture comment"]);
  expect(saved.results.map((r) => r.answer)).toEqual(chosen.map((c) => c.answer));
  for (const r of saved.results) {
    expect(r.correct).toBe(r.answer === r.correct_answer);
    expect(r.ms).toBeGreaterThan(0);
    if (r.task in expected) expect([r.task, r.correct_answer]).toEqual([r.task, expected[r.task]]);
  }
  expect(saved.results.map((r) => r.task)).toEqual(expect.arrayContaining(["ocean", "unison", "both", "heat"]));
});

test("Bangla: consent and the age question in Bangla", async ({ page }) => {
  await openAt(page, "/listen-test");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await expect(page.locator("main")).toContainText("নামহীন শোনার পরীক্ষা");
  await button(page, "বুঝেছি। চালিয়ে যান").click();
  await expect(page.locator("main h2")).toHaveText("আপনার বয়স কি ১৮ বা তার বেশি?");
});
