// Wherever ocean and rain play together, the app says how far apart their frames are. The expected gap
// is computed here from the two shipped manifests, and again from a fixture with a newer rain frame.
import { expect, test, type Page } from "@playwright/test";
import { liveLog, logLiveRegion, openAt, shipped, shot } from "./lib";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The same rule the app states: hours under a day, whole days from a day up. */
function expectedApart(oceanIso: string, rainIso: string): string {
  const abs = Math.abs(Date.parse(rainIso) - Date.parse(oceanIso));
  const [n, unit] = abs < DAY ? [Math.round(abs / HOUR), "hour"] : [Math.round(abs / DAY), "day"];
  return `(${n} ${unit}${n === 1 ? "" : "s"} apart)`;
}

async function chooseBoth(page: Page) {
  // Both is the default track: go to Ocean and back, as a listener switching to Both would.
  await page.getByRole("button", { name: "Ocean", exact: true }).first().click();
  await page.getByRole("button", { name: "Both", exact: true }).first().click();
}

const sst = shipped<{ frame_time_utc: string }>("latest/sst.json").frame_time_utc;
const rain = shipped<{ frame_time_utc: string }>("latest/rain.json").frame_time_utc;

test("Both shows the gap between the two manifest times: header, readout, status, braille", async ({ page }) => {
  await openAt(page, "/listen");
  await logLiveRegion(page);
  await chooseBoth(page);
  const gap = page.getByTestId("frame-gap").filter({ visible: true }).first();
  await expect(gap).toBeVisible();
  await expect(gap).toContainText(expectedApart(sst, rain));
  await expect(gap).toHaveAttribute("data-gap-ms", String(Date.parse(rain) - Date.parse(sst)));
  // The page header (above the map) and the readout panel both carry it.
  await expect(page.locator("#listen-title").locator("..").getByTestId("frame-gap").filter({ visible: true })).toHaveCount(1);
  await expect(page.locator('aside [data-testid="frame-gap"]').filter({ visible: true })).toHaveCount(1);
  // Screen-reader status when Both starts.
  await expect.poll(async () => (await liveLog(page)).join(" | ")).toMatch(/Now hearing: Both\. Frames ((rain|ocean) \d+(d|h) newer|same hour)/u);
  await shot(page, "item01", "both-listen");

  // Braille explorer value line: the short form.
  await page.getByRole("application").first().focus();
  await page.keyboard.press("b");
  await expect(page.locator("body")).toContainText(/(rain|ocean) \d+(d|h) newer/u);
  await shot(page, "item01", "both-braille");
});

test("Ocean alone shows no gap", async ({ page }) => {
  await openAt(page, "/listen");
  await page.getByRole("button", { name: "Ocean", exact: true }).first().click();
  await expect(page.getByTestId("frame-gap")).toHaveCount(0);
});

test("a newer rain frame (fixture) updates the gap", async ({ page }) => {
  const newer = new Date(Date.parse(sst) + 7 * HOUR).toISOString().replace(".000Z", "Z");
  await page.route("**/data/latest/rain.json", async (route) => {
    const res = await route.fetch();
    const json = (await res.json()) as Record<string, unknown>;
    await route.fulfill({ response: res, json: { ...json, frame_time_utc: newer } });
  });
  await openAt(page, "/listen");
  await chooseBoth(page);
  await expect(page.getByTestId("frame-gap").filter({ visible: true }).first()).toContainText(expectedApart(sst, newer));
  await expect(page.getByTestId("frame-gap").filter({ visible: true }).first()).toContainText("(7 hours apart)");
});
