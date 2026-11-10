// What do the live regions say as a visitor moves between pages by the header links?
import { chromium } from "@playwright/test";
const PREFS = JSON.stringify({ lang: "en", started: true, captions: true, builtInVoice: true, soundWords: true, describe: false });
const browser = await chromium.launch();
for (const [name, base] of [["home-fix", "http://localhost:3217"], ["final-pass", "http://localhost:3218"]]) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await c.addInitScript((p) => { localStorage.setItem("jukebox.prefs.v1", p); localStorage.setItem("jukebox.hint.map.v1", "1"); }, PREFS);
  const page = await c.newPage();
  await page.goto(base + "/listen"); await page.waitForSelector("main"); await page.waitForTimeout(2500);
  const read = () => page.evaluate(() => ({
    nextAnnouncer: document.querySelector("next-route-announcer")?.shadowRoot?.textContent ?? [...document.querySelectorAll('[role="alert"]')].map((a) => a.textContent).join(" | "),
    live: document.querySelector('[data-testid="live-region"]')?.textContent,
    title: document.title,
    focus: (document.activeElement?.tagName ?? "") + ":" + (document.activeElement?.textContent ?? "").trim().slice(0, 40),
  }));
  const out = [["start /listen", await read()]];
  for (const link of ["Then vs Now", "How we know", "Turntable", "Listen"]) {
    await page.getByRole("banner").getByRole("link", { name: new RegExp(`^${link}`) }).first().click();
    await page.waitForTimeout(link === "Turntable" ? 6000 : 2500);
    out.push([`-> ${link}`, await read()]);
  }
  console.log(`\n# ${name}`);
  for (const [k, v] of out) console.log(k.padEnd(16), JSON.stringify(v));
  await c.close();
}
await browser.close();
