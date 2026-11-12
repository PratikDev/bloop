// The listener test's steps after the core tasks, shared by the suites that run it end to end. With ART's listen-test
// flag on: two emotion ratings (one clip heard, one seen), then ear vs eye (two items; left out on a dry day, when it
// has no clear answer). With the flag off neither appears. Either way the run ends with Finish showing.
import { expect, type Page } from "@playwright/test";

/** Answers whichever extras this build shows after the core tasks, with fixed answers; returns once Finish shows. */
export async function answerExtras(page: Page) {
  const em = page.getByTestId("lt-emotion");
  const ee = page.getByTestId("lt-ear-eye");
  const finish = page.getByRole("button", { name: "Finish" });
  await expect(em.or(finish)).toBeVisible({ timeout: 30_000 });
  if (await em.isVisible()) {
    for (let k = 0; k < 2; k++) {
      await expect(em).toBeVisible();
      await em.getByRole("button", { name: /Play the clip|Show the clip/u }).click();
      await em.getByRole("group", { name: "How did it feel?" }).getByRole("button", { name: "4" }).click();
      await em.getByRole("group", { name: /How connected/u }).getByRole("button", { name: "3" }).click();
      await em.getByRole("button", { name: "Next" }).click();
    }
    await expect(ee.or(finish)).toBeVisible({ timeout: 30_000 });
  }
  if (await ee.isVisible()) {
    const first = await ee.getAttribute("data-sense");
    await ee.locator("[data-option]").first().click();
    await expect(ee).not.toHaveAttribute("data-sense", first!);
    await ee.locator("[data-option]").first().click();
  }
  await expect(finish).toBeVisible();
}
