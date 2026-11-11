// The language never changes by itself, and <html lang>
// is the saved language from the first moment the body exists (the inline head script), on every route, after reloads.
import { expect, test, type Page } from "@playwright/test";
import { openAt, shot } from "./lib";

const ROUTES = ["/", "/listen", "/then-now", "/then-now?view=monthly", "/how", "/official", "/turntable", "/team"];
const BANGLA = /[ঀ-৿]/u;

/** Records <html lang> at the moment <body> is created (before anything is painted), on every load of the page. */
async function recordFirstPaintLang(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __langAtBody?: string };
    new MutationObserver((_, obs) => {
      if (document.body) {
        w.__langAtBody = document.documentElement.lang;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
}
const langAtBody = (page: Page) => page.evaluate(() => (window as unknown as { __langAtBody?: string }).__langAtBody);

for (const lang of ["bn", "en"] as const) {
  test(`${lang}: every route, reloaded, has lang=${lang} at first paint and stays ${lang}`, async ({ page }) => {
    await recordFirstPaintLang(page);
    await openAt(page, "/listen");
    const button = page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first();
    if (lang === "bn") await button.click();
    for (const route of ROUTES) {
      await page.goto(route);
      expect([route, await langAtBody(page)]).toEqual([route, lang]);
      await page.reload();
      expect([route, "reload", await langAtBody(page)]).toEqual([route, "reload", lang]);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      // The page links (the language button always shows the other language, so it is left out).
      const nav = (await page.getByRole("banner").getByRole("navigation").first().innerText()) ?? "";
      expect([route, BANGLA.test(nav)]).toEqual([route, lang === "bn"]);
    }
    if (lang === "bn") {
      await page.goto("/then-now");
      await shot(page, "item03", "bn-then-now");
    }
  });
}

test.describe("a fresh visitor whose browser says Bangla", () => {
  test.use({ locale: "bn-BD" });
  test("stays English until they choose Bangla (locale03)", async ({ page }) => {
    for (const route of ["/", "/then-now", "/how"]) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first()).toBeVisible();
    }
  });
});
