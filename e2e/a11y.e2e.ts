// Automated accessibility (phase 8, docs/BLOOP_FINAL_PASS.md §10): axe-core on every page and with the player sheet open.
// No violation of impact "serious" or "critical". axe-core is a dev dependency; it is injected, the app is not changed.
import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { start } from "./lib/app";
import { openPlayerMore } from "./features/common";

const AXE = join(process.cwd(), "node_modules/axe-core/axe.min.js");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface Violation {
  id: string;
  impact: string | null;
  nodes: { target: string[]; failureSummary?: string }[];
}

/** The serious and critical violations on the page as it is now. */
async function serious(page: Page): Promise<string[]> {
  if (!(await page.evaluate(() => "axe" in window))) await page.addScriptTag({ path: AXE });
  const found = await page.evaluate(async (tags) => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: Violation[] }> } }).axe;
    const r = await axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target, failureSummary: n.failureSummary })) }));
  }, TAGS);
  return found
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

/** In-app navigation by address, so the app's state (sound, language) stays as a user's would. */
async function go(page: Page, path: string) {
  await page.evaluate((p) => {
    history.pushState({}, "", p);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await page.waitForTimeout(2500);
}

const PAGES = (process.env.A11Y_PAGES ?? "/,/listen,/then-now,/how,/official,/nope,/turntable").split(",");

for (const path of PAGES) {
  test(`axe: no serious or critical violations on ${path}`, async ({ page }) => {
    test.setTimeout(120_000);
    await start(page);
    if (path !== "/listen") await go(page, path);
    expect(await serious(page), path).toEqual([]);
  });
}

test("axe: no serious or critical violations with the player sheet open", async ({ page }) => {
  test.setTimeout(120_000);
  await start(page);
  await openPlayerMore(page);
  await page.getByRole("button", { name: "Now playing" }).first().click();
  await expect(page.getByRole("dialog", { name: "Now playing" })).toBeVisible();
  expect(await serious(page)).toEqual([]);
});
