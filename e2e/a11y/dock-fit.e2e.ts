// The sound dock fits the common laptop widths (1280 and 1366 px): every Listen action is on screen and whole, in one
// row, both while "Turn sound on" shows (the widest state) and while the sound plays; and from 1536 px the actions
// show their longer labels beside the icons.
import { expect, test, type Page } from "@playwright/test";
import { open } from "../lib/app";
import { settle } from "../mentor/lib";

/** Every visible button in the dock: whole and on screen; and how many rows the actions take. */
async function dockFit(page: Page) {
  return page.evaluate(() => {
    const dock = document.querySelector("[data-dock]")!;
    const buttons = [...dock.querySelectorAll<HTMLElement>("button")].filter((b) => b.offsetParent !== null);
    const off = buttons
      .map((b) => ({ name: b.getAttribute("aria-label") ?? b.textContent ?? "", r: b.getBoundingClientRect(), clipped: b.scrollWidth > b.clientWidth + 1 }))
      .filter(({ r, clipped }) => r.left < 0 || r.right > window.innerWidth || r.width < 24 || clipped)
      .map(({ name, r }) => `${name}: ${Math.round(r.left)}..${Math.round(r.right)}`);
    const tops = new Set(buttons.filter((b) => b.closest("[data-dock] > div > div:last-child")).map((b) => Math.round(b.getBoundingClientRect().top / 10)));
    return { off, count: buttons.length, rows: tops.size, scrollX: document.documentElement.scrollWidth - window.innerWidth };
  });
}

for (const width of [1280, 1366]) {
  test(`${width} px: every dock action is whole and on screen, in one row, before and after Turn sound on`, async ({ page }) => {
    await page.setViewportSize({ width, height: 768 });
    await open(page);
    await page.goto("/listen");
    await settle(page, 1500);
    for (const state of ["before", "playing"] as const) {
      if (state === "playing") {
        const on = page.getByRole("button", { name: /Turn sound on|Tap to start sound/u }).first();
        if (await on.isVisible()) await on.click();
        await settle(page, 800);
      }
      const fit = await dockFit(page);
      expect({ state, off: fit.off }).toEqual({ state, off: [] });
      expect(fit.count).toBeGreaterThanOrEqual(10);
      expect(fit.rows).toBe(1);
      expect(fit.scrollX).toBeLessThanOrEqual(0);
    }
  });
}

test("1600 px: the actions show their longer labels beside the icons", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await open(page);
  await page.goto("/listen");
  await settle(page, 1500);
  // The rendered text (innerText leaves out the hidden short word).
  const braille = page.locator("[data-dock]").getByRole("button", { name: "Braille explorer" });
  expect(await braille.evaluate((el) => (el as HTMLElement).innerText.trim())).toBe("Braille explorer");
  expect((await dockFit(page)).off).toEqual([]);
});
