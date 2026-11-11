// Layered descriptions. D says the description of the
// needle once (at the chosen detail, through the speech mode); the Inspector's Description tab shows the same words;
// Detailed adds "What this means" in its own fold; Bangla has its own templates; a held rain frame is described as that
// frame. Runs on a build with NEXT_PUBLIC_A11Y_DESCRIBE=1 (and steps 1–2 on), 3D shown and hidden. The value is the
// map label's, which health-records.e2e.ts already checks against the shipped grids.
import { expect, test, type Page } from "@playwright/test";
import { MAP_READING, settingsButton, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const map = (page: Page) => page.locator("#sound-map");

async function fresh(page: Page, hide3d: boolean) {
  await start(page, { hide3d });
  await page.goto("/listen");
  await settle(page, 800);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await settle(page, 1500); // "Sound on" first, so it never replaces a key's message
  await logLiveRegion(page);
}

async function detail(page: Page, option: "Brief" | "Standard" | "Detailed") {
  await settingsButton(page).click();
  await page.getByRole("group", { name: "Detail" }).getByRole("button", { name: option, exact: true }).click();
  await settingsButton(page).click();
}

/** Presses D on the map and returns what the status region said (the gazetteer may take a moment the first time). */
async function describeHere(page: Page) {
  await map(page).focus();
  const before = (await liveLog(page)).length;
  await page.keyboard.press("d");
  await expect.poll(async () => (await liveLog(page)).slice(before).join(" "), { timeout: 10_000 }).toMatch(/Ocean surface temperature|সমুদ্রপৃষ্ঠের তাপমাত্রা|Rain and snow/u);
  await page.waitForTimeout(600);
  return (await liveLog(page)).slice(before).map((m) => m.trim()).filter(Boolean).at(-1) ?? "";
}

for (const hide3d of [false, true]) {
  test.describe(`descriptions, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("D says the standard description once: what, when, here (the readout's value), around, the whole map; both records", async ({ page }) => {
      await fresh(page, hide3d);
      const said = await describeHere(page);
      // The map carries the reading ("…29.8 °C; Dry…"): the same value, said in words.
      const ocean = (await map(page).getAttribute(MAP_READING))?.match(/([−-]?\d+\.\d) °C/u)?.[1];
      expect(ocean).toBeTruthy();
      expect(said).toMatch(/^Ocean surface temperature, \d+ Nov \d{4}, \d\d:\d\d UTC\./u);
      expect(said).toContain(`: ${ocean} degrees Celsius.`);
      expect(said).toMatch(/Around here, the water (is warmer to the|is warmest right here|is about the same)/u);
      expect(said).toMatch(/Across the map, the coldest is .* degrees, near .*\. The warmest is .* degrees, near /u);
      expect(said).toMatch(/Rain and snow, \d+ Nov \d{4}, \d\d:\d\d UTC\./u);
      expect(said).not.toContain("What this means");
    });

    test("detail: Brief leaves out the patterns; Detailed adds What this means, after the data", async ({ page }) => {
      await fresh(page, hide3d);
      await detail(page, "Brief");
      const brief = await describeHere(page);
      expect(brief).not.toContain("Around here");
      expect(brief).toContain("Across the map");
      await detail(page, "Detailed");
      const detailed = await describeHere(page);
      expect(detailed).toContain("Around here");
      expect(detailed).toMatch(/What this means: Warm sea water/u);
      expect(detailed.indexOf("What this means")).toBeGreaterThan(detailed.indexOf("Across the map"));
    });

    test("the Description tab shows the same words; Detailed puts What this means in its own fold; axe clean", async ({ page }) => {
      await fresh(page, hide3d);
      await detail(page, "Detailed");
      const said = await describeHere(page);
      await page.keyboard.press("p");
      await page.getByRole("tab", { name: "Description" }).click();
      const panel = page.getByTestId("description-panel");
      await expect(panel).toContainText("Ocean surface temperature", { timeout: 10_000 });
      const firstSentence = said.split(". ")[0];
      await expect(panel).toContainText(firstSentence);
      const fold = panel.locator("details").filter({ hasText: "What this means" }).first();
      await expect(fold).toBeVisible();
      await expect(fold).not.toHaveAttribute("open", "");
      expect(await axeSerious(page, '[data-testid="description-panel"]')).toEqual([]);
    });

    test("a rain frame held with PageDown is described as that frame", async ({ page }) => {
      await fresh(page, hide3d);
      await map(page).focus();
      await page.keyboard.press("PageDown");
      await expect(page.getByText("Time-lapse frame 48 of 48")).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(900);
      const said = await describeHere(page);
      expect(said).toMatch(/^Rain and snow, 6 Nov 2026, 02:30 UTC\./u);
      expect(said).not.toContain("Ocean surface temperature");
    });

    test("Bangla: its own templates", async ({ page }) => {
      await fresh(page, hide3d);
      await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
      const said = await describeHere(page);
      expect(said).toMatch(/^সমুদ্রপৃষ্ঠের তাপমাত্রা, /u);
      expect(said).toContain("ডিগ্রি সেলসিয়াস");
      expect(said).toContain("বৃষ্টি ও তুষার");
    });
  });
}
