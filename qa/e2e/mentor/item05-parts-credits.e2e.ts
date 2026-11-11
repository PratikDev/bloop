// Every Then vs Now part that shows is one that plays (audio level from the app's own tap), the
// unfinished parts are hidden. The credits list (data that plays, and the testing-only sources) is checked on every
// page that shows it by item05b-credits.e2e.ts.
import { expect, test } from "@playwright/test";
import { AUDIBLE, heard } from "../lib/app";
import { openAt, shot } from "./lib";

test("every visible Then vs Now part plays at a valid city; no hidden part shows", async ({ page }) => {
  await openAt(page, "/then-now?city=Dhaka&part=heat");
  const tabs = page.getByRole("tablist").first().getByRole("tab");
  await expect(tabs).toHaveText(["Heat", "Monsoon rain", "Water underground"]);
  await expect(page.locator("main")).not.toContainText(/October/u);
  await shot(page, "item05", "then-now-tabs");
  for (const name of ["Heat", "Monsoon rain", "Water underground"]) {
    await tabs.filter({ hasText: name }).click();
    const sound = page.getByRole("button", { name: "Turn sound on" }).first();
    if (await sound.isVisible().catch(() => false)) await sound.click();
    await page.getByRole("button", { name: "Play this part" }).click();
    const level = await heard(page, 6000);
    expect([name, level > AUDIBLE]).toEqual([name, true]);
    await page.getByRole("button", { name: "Stop", exact: true }).first().click();
  }
});

test("a URL naming a hidden part opens a sounded part instead", async ({ page }) => {
  await openAt(page, "/then-now?part=fires");
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Heat");
  await expect(page.getByRole("button", { name: "Play this part" })).toBeVisible();
});
