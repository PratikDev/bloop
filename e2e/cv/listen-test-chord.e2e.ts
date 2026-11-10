// The two chord tasks in /listen-test (CV/ML build, piece E), on a build with NEXT_PUBLIC_CV_LISTEN_TEST=1: a fixture run
// through the whole test (consent, intro, every task) with fixed answers; the exported file holds both chord tasks, the
// variety answer is the one computed here from the shipped SST grid, the groups answer is the chord's own count for one
// of today's boxes, and each chord task's sound is audible.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { cvTasks } from "../../src/lib/listen-test/chord";
import { readUint16LE } from "../../src/lib/data/grid";
import type { SstMetadata } from "../../src/types/data-contract";
import { AUDIBLE, heard } from "../lib/app";
import { openAt } from "../mentor/lib";

const ROOT = path.join(__dirname, "..", "..");
const meta = JSON.parse(readFileSync(path.join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
const bin = readFileSync(path.join(ROOT, "public/data/latest/sst.bin"));
const sst = { meta, codes: readUint16LE(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), meta.grid) };
const variety = cvTasks({ sst, cvPick: 0 })[0];
const groupAnswers = new Set<string | undefined>([0, 1].map((p) => cvTasks({ sst, cvPick: p as 0 | 1 })[1]?.correct));

const button = (page: Page, name: string) => page.locator("main").getByRole("button", { name, exact: true });

test("a fixture run: both chord tasks, answers from the data, audible", async ({ page }) => {
  test.setTimeout(240_000);
  await openAt(page, "/listen-test");
  await button(page, "I understand. Continue").click();
  await button(page, "Yes").click();
  await button(page, "Play the reference tone").click();
  await button(page, "Start the tasks").click();
  const total = Number(/of (\d+)/u.exec((await page.locator("main h2").textContent()) ?? "")?.[1]);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await expect(page.locator("main h2")).toHaveText(`Task ${i + 1} of ${total}`);
    const chord = (await page.locator("#lt-question").textContent())?.match(/variety|one group or two/u);
    await button(page, "Play the sound").click();
    if (chord) expect(await heard(page, 8000)).toBeGreaterThan(AUDIBLE);
    await page.locator("main [data-option]").first().click();
  }
  await button(page, "Finish").click();
  const download = page.waitForEvent("download");
  await button(page, "Export results").click();
  const saved = JSON.parse(readFileSync(await (await download).path(), "utf8")) as { results: { task: string; correct_answer: string }[] };
  const row = (id: string) => saved.results.find((r) => r.task === id);
  expect(row("chordVariety")?.correct_answer).toBe(variety?.correct);
  expect(groupAnswers.has(row("chordGroups")?.correct_answer)).toBe(true);
  // The run itself (sounds played once, quick answers) is far under the protocol's 8 minutes.
  expect(Date.now() - t0).toBeLessThan(8 * 60_000);
});
