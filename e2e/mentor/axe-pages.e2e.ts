// After all mentor items: axe-core on every page a visitor can open, with no serious or critical violation. The pages
// are the header's (each after Start), Home on a first visit (before sound is chosen) and the hidden /listen-test.
import { expect, test } from "@playwright/test";
import { axeSerious } from "../lib/axe";
import { tapAudio } from "../lib/app";
import { openAt, settle } from "./lib";

const STARTED = ["/", "/listen", "/then-now", "/then-now?view=monthly", "/how", "/official", "/turntable", "/listen-test"];

test("axe: no serious violation on any page", async ({ page }) => {
  test.setTimeout(600_000);
  const found: Record<string, unknown[]> = {};
  for (const url of STARTED) {
    await openAt(page, url);
    if (url === "/turntable") await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
    const bad = await axeSerious(page);
    if (bad.length) found[url] = bad;
  }
  expect(found).toEqual({});
});

test("axe: no serious violation on Home at a first visit", async ({ page }) => {
  await tapAudio(page);
  await page.goto("/");
  await settle(page, 1000);
  await expect(page.getByRole("button", { name: "Start listening" })).toBeVisible();
  expect(await axeSerious(page)).toEqual([]);
});
