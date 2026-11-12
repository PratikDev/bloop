// Why do focused controls on /turntable lose their outline? Focus a control, list the CSS rules that set outline on it.
import { chromium } from "@playwright/test";
const BASE = process.env.BLOOP_URL ?? "http://localhost:3217";
const PREFS = JSON.stringify({ lang: "en", started: true, captions: true, builtInVoice: true, soundWords: true, describe: false });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
const c = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await c.addInitScript((p) => localStorage.setItem("jukebox.prefs.v1", p), PREFS);
const page = await c.newPage();
for (const route of ["/listen", "/turntable"]) {
  await page.goto(BASE + route); await page.waitForSelector("main"); await page.waitForTimeout(route === "/turntable" ? 15000 : 3000);
  await page.getByRole("button", { name: "Settings" }).focus();
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list; try { list = sheet.cssRules; } catch { continue; }
      const walk = (rs) => { for (const r of rs) { if (r.cssRules && !r.selectorText) walk(r.cssRules); else if (r.selectorText && /outline/.test(r.cssText)) { try { if (el.matches(r.selectorText.replace(/::?(before|after|placeholder|-webkit-[a-z-]+|-moz-[a-z-]+)/g, ""))) rules.push(r.cssText.slice(0, 160)); } catch {} } } };
      walk(list);
    }
    return { name: el.getAttribute("aria-label") ?? el.textContent, focusVisible: el.matches(":focus-visible"), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, htmlAttrs: [...document.documentElement.attributes].map((a) => `${a.name}=${a.value.slice(0, 40)}`), rules };
  });
  console.log(route, JSON.stringify(info, null, 1));
  await page.screenshot({ path: `ring-${route.slice(1)}.png`, clip: { x: 1050, y: 0, width: 230, height: 60 } });
}
await browser.close();
