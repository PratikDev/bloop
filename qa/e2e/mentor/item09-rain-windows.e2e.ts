// GPCP and GPCC compare the same two decades, and the Monsoon part says why GPCC stops where it does.
import { expect, test } from "@playwright/test";
import type { DhakaThenNowDemo, GpccContextFile } from "../../../src/types/data-contract";
import { openAt, sheet, shipped, shot } from "./lib";

const demo = shipped<DhakaThenNowDemo>("demo/dhaka_then_now.json");
const gpcc = shipped<GpccContextFile>("context/gpcc_bd.json");
const label = (w: [number, number]) => `${w[0]}–${w[1]}`;

test("Monsoon names the shared windows and why GPCC stops", async ({ page }) => {
  const [a, b] = [label(demo.rain.gpcc.A.window), label(demo.rain.gpcc.B.window)];
  expect(demo.rain.gpcp.B.window).toEqual(demo.rain.gpcc.B.window);
  await openAt(page, "/then-now?part=monsoon");
  const note = page.getByTestId("rain-window-note");
  await expect(note).toBeVisible();
  await expect(note).toContainText(`${a} with ${b}`);
  await expect(note).toContainText(`ends in ${gpcc.last_month_text}`);
  // The headline names one window pair for both sources.
  await expect(page.locator("main")).toContainText(`(${a} vs ${b}); rain gauges (GPCC)`);
  await expect(page.locator("main")).toContainText(`(GPCC) ${demo.rain.caption.split("(GPCC) ")[1]}`);
  await note.scrollIntoViewIfNeeded();
  await shot(page, "item09", "monsoon");

  await page.getByRole("button", { name: "Details" }).first().click();
  const details = sheet(page);
  await expect(details).toContainText("Why these years");
  await expect(details).toContainText(demo.rain.gpcc_end_note);
  await expect(details).toContainText(demo.rain.gpcp_newer.label);
  await shot(page, "item09", "details", details);
});

test("Bangla: the note is translated with the same years", async ({ page }) => {
  await openAt(page, "/then-now?part=monsoon");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  const note = page.getByTestId("rain-window-note");
  await expect(note).toContainText("GPCC");
  await expect(note).not.toContainText("because");
});
