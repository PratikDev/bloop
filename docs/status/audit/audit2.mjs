// Audit pass 2: keyboard walks, overlays, sound-on flow, forced colours, reduced motion, text spacing.
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BLOOP_URL ?? "http://localhost:3217";
const OUT = path.resolve(process.argv[2] ?? "audit-out2");
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const want = (k) => !ONLY || ONLY.includes(k);
const PREFS = JSON.stringify({ lang: "en", describe: false, captions: true, builtInVoice: true, soundWords: true, started: true });
const report = {};
const log = (k, v) => { report[k] = v; console.log(`\n## ${k}\n${typeof v === "string" ? v : JSON.stringify(v, null, 1)}`); };

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });

async function ctx(opts = {}, started = true) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts });
  if (started) await c.addInitScript((p) => { localStorage.setItem("jukebox.prefs.v1", p); localStorage.setItem("jukebox.hint.map.v1", "1"); }, PREFS);
  return c;
}

async function axe(page, scope) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ path: AXE });
  return page.evaluate(async (scope) => {
    const r = await window.axe.run(scope ? document.querySelector(scope) ?? document : document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(" ").slice(0, 100), html: n.html.slice(0, 140), msg: (n.any[0]?.message ?? n.all[0]?.message ?? n.none[0]?.message ?? "").slice(0, 180) })) }));
  }, scope);
}

function focusInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return { name: "(body)" };
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 45);
  return {
    name,
    tag: el.tagName.toLowerCase() + (el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""),
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    covered: top ? !(el.contains(top) || top.contains(el)) : true,
    coveredBy: top && !(el.contains(top) || top.contains(el)) ? (top.tagName.toLowerCase() + "." + String(top.className).slice(0, 40)) : undefined,
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
    ring: s.boxShadow === "none" ? "" : s.boxShadow.slice(0, 60),
    focusVisible: el.matches(":focus-visible"),
  };
}

async function tabWalk(page, max = 45) {
  const steps = [];
  const seen = new Set();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
    const f = await page.evaluate(focusInfo);
    const key = `${f.tag}|${f.name}|${f.rect}`;
    if (seen.has(key)) { steps.push({ loop: true }); break; }
    seen.add(key);
    steps.push(f);
  }
  return steps;
}
const brief = (steps) => steps.map((f, i) => f.loop ? "(wraps)" : !f.tag ? `${String(i + 1).padStart(2)} (body / browser chrome)` : `${String(i + 1).padStart(2)} ${f.tag.padEnd(18)} ${JSON.stringify(f.name).padEnd(48)} ${f.rect?.join(",") ?? ""} ${f.inView ? "" : "OFFSCREEN "}${f.covered ? `COVERED by ${f.coveredBy} ` : ""}${f.outline?.startsWith("none") || f.outline?.includes(" 0px") ? "NO-OUTLINE " : ""}${f.focusVisible ? "" : "not:focus-visible"}`).join("\n");

// A. keyboard walks
if (want("tab")) {
  for (const route of ["/", "/listen", "/then-now", "/how", "/official"]) {
    const c = await ctx();
    const page = await c.newPage();
    await page.goto(BASE + route); await page.waitForSelector("main"); await page.waitForTimeout(3000);
    const steps = await tabWalk(page, route === "/official" ? 60 : 45);
    log(`tab ${route}`, brief(steps));
    await c.close();
  }
}

// B. mixer popover + slider focus; settings; help
if (want("help")) {
  const c = await ctx();
  const page = await c.newPage();
  await page.goto(BASE + "/listen"); await page.waitForSelector("main"); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Help", exact: true }).click(); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "help-open.png") });
  log("help focus on open", await page.evaluate(focusInfo));
  log("axe help", await axe(page));
  log("help walk", brief(await tabWalk(page, 12)));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  log("after help Esc focus", await page.evaluate(focusInfo));
  await c.close();
}
if (want("overlays")) {
  const c = await ctx();
  const page = await c.newPage();
  await page.goto(BASE + "/listen"); await page.waitForSelector("main"); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /Mixer/ }).click(); await page.waitForTimeout(500);
  const mix = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); await page.waitForTimeout(80); mix.push(await page.evaluate(focusInfo)); }
  log("mixer focus walk", brief(mix));
  await page.screenshot({ path: path.join(OUT, "mixer-open.png") });
  // focus the first slider explicitly
  const slider = page.getByRole("slider").first();
  await slider.focus(); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(150);
  log("slider focus", await page.evaluate(() => { const el = document.activeElement; const thumb = el.closest('[data-slot="slider-thumb"]'); const s = thumb ? getComputedStyle(thumb) : null; return { activeTag: el.tagName, type: el.getAttribute("type"), valuetext: el.getAttribute("aria-valuetext"), valuenow: el.getAttribute("aria-valuenow") ?? el.value, label: el.getAttribute("aria-label"), thumbOutline: s && `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, thumbShadow: s?.boxShadow, thumbSize: thumb && [thumb.offsetWidth, thumb.offsetHeight], inputOutline: getComputedStyle(el).outline, inputRect: (({ width, height }) => [width, height])(el.getBoundingClientRect()) }; }));
  await page.screenshot({ path: path.join(OUT, "mixer-slider-focus.png") });
  log("axe mixer", await axe(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  log("after mixer Esc focus", await page.evaluate(focusInfo));

  await page.getByRole("button", { name: "Settings" }).click().catch(async () => { await page.locator("header button").nth(1).click(); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "settings-open.png") });
  log("axe settings", await axe(page));
  log("settings content", await page.evaluate(() => [...document.querySelectorAll('[data-slot="popover-content"] button, [data-slot="popover-content"] p')].map((e) => `${e.tagName} pressed=${e.getAttribute("aria-pressed")} :: ${e.textContent.trim().slice(0, 80)}`)));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);

  await page.getByRole("button", { name: "Help", exact: true }).click(); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "help-open.png") });
  log("help focus on open", await page.evaluate(focusInfo));
  log("axe help", await axe(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  log("after help Esc focus", await page.evaluate(focusInfo));
  await c.close();
}

// E. first visit with sound: Start -> opening -> map; keys
if (want("flow")) {
  const c = await ctx({}, false);
  const page = await c.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(BASE + "/"); await page.waitForSelector("main"); await page.waitForTimeout(2500);
  log("home initial focus", await page.evaluate(focusInfo));
  await page.getByRole("button", { name: "Start listening" }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, "opening.png") });
  log("opening focus", await page.evaluate(focusInfo));
  log("axe opening", await axe(page));
  log("opening a11y tree", await page.evaluate(() => ({ inert: [...document.querySelectorAll("[inert]")].length, live: document.querySelector('[data-testid="live-region"]')?.textContent, url: location.pathname })));
  const skip = page.getByRole("button", { name: "Skip intro" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, "listen-after-intro.png") });
  log("after intro: url+focus", { url: await page.evaluate(() => location.pathname), focus: await page.evaluate(focusInfo), live: await page.evaluate(() => document.querySelector('[data-testid="live-region"]')?.textContent) });
  // move the cursor
  const map = page.locator("#sound-map");
  await map.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(900);
  log("after arrows", await page.evaluate(() => ({ live: document.querySelector('[data-testid="live-region"]')?.textContent, mapLabel: document.getElementById("sound-map")?.getAttribute("aria-label"), desc: document.getElementById(document.getElementById("sound-map")?.getAttribute("aria-describedby"))?.textContent })));
  await page.screenshot({ path: path.join(OUT, "listen-sound-on.png") });
  log("axe listen sound on", await axe(page));
  await page.keyboard.press("b"); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, "listen-braille.png"), fullPage: false });
  log("braille open focus", await page.evaluate(focusInfo));
  log("axe braille", await axe(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await map.focus();
  await page.keyboard.press("p"); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "listen-inspector.png") });
  log("inspector focus", await page.evaluate(focusInfo));
  log("axe inspector", await axe(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  log("after inspector Esc focus", await page.evaluate(focusInfo));
  // tour
  await page.getByRole("button", { name: /tour/i }).first().click().catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, "listen-tour.png") });
  log("tour state", await page.evaluate(() => ({ url: location.pathname + location.search, live: document.querySelector('[data-testid="live-region"]')?.textContent, focus: document.activeElement?.tagName + "#" + document.activeElement?.id })));
  log("axe tour", await axe(page));
  log("flow errors", errors);
  await c.close();
}

// F. forced colours
if (want("forced")) {
  for (const scheme of ["dark", "light"]) {
    const c = await ctx({ forcedColors: "active", colorScheme: scheme });
    for (const route of ["/", "/listen", "/then-now", "/how"]) {
      const page = await c.newPage();
      await page.goto(BASE + route); await page.waitForSelector("main"); await page.waitForTimeout(3000);
      if (route === "/listen") { await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); }
      await page.screenshot({ path: path.join(OUT, `forced-${scheme}-${route === "/" ? "home" : route.slice(1)}.png`) });
      await page.close();
    }
    await c.close();
  }
}

// G. reduced motion
if (want("motion")) {
  for (const rm of ["reduce", "no-preference"]) {
    const c = await ctx({ reducedMotion: rm });
    const page = await c.newPage();
    await page.goto(BASE + "/"); await page.waitForSelector("main"); await page.waitForTimeout(3500);
    const home = await page.evaluate(() => ({ attr: document.documentElement.dataset.reduceMotion, running: document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.animationName ?? a.transitionProperty ?? "waapi") + ":" + (a.effect?.getComputedTiming().iterations ?? "")).slice(0, 12) }));
    // does the globe keep moving? compare two canvas snapshots 1.5 s apart
    const snap = () => page.evaluate(() => { const cv = document.querySelector("main canvas"); return cv ? cv.toDataURL().length + ":" + cv.toDataURL().slice(-64) : null; });
    const a = await snap(); await page.waitForTimeout(1500); const b = await snap();
    await page.goto(BASE + "/listen"); await page.waitForSelector("main"); await page.waitForTimeout(3000);
    const listen = await page.evaluate(() => ({ running: document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.animationName ?? a.transitionProperty ?? "waapi") + ":" + (a.effect?.getComputedTiming().iterations ?? "")).slice(0, 12) }));
    log(`motion ${rm}`, { home, globeMoves: a !== b, listen });
    await c.close();
  }
}

// H. text spacing (WCAG 1.4.12)
if (want("spacing")) {
  const c = await ctx();
  for (const route of ["/", "/listen", "/then-now", "/how", "/official"]) {
    const page = await c.newPage();
    await page.goto(BASE + route); await page.waitForSelector("main"); await page.waitForTimeout(2500);
    await page.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }" });
    await page.waitForTimeout(600);
    const clipped = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || el.closest('[aria-hidden="true"], .sr-only')) continue;
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").trim();
        if (!text) continue;
        const s = getComputedStyle(el);
        const clips = (s.overflow !== "visible" || s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none");
        if (clips && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) out.push(`${el.tagName.toLowerCase()} "${text.slice(0, 50)}" ${el.scrollWidth}>${el.clientWidth} / ${el.scrollHeight}>${el.clientHeight}`);
      }
      return { clipped: out.slice(0, 12), overflowX: document.documentElement.scrollWidth - innerWidth };
    });
    await page.screenshot({ path: path.join(OUT, `spacing-${route === "/" ? "home" : route.slice(1)}.png`) });
    log(`text spacing ${route}`, clipped);
    await page.close();
  }
  await c.close();
}

// I. turntable, long wait
if (want("turntable")) {
  const c = await ctx();
  const page = await c.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160)); });
  await page.goto(BASE + "/turntable"); await page.waitForSelector("main");
  await page.waitForTimeout(45000);
  await page.screenshot({ path: path.join(OUT, "turntable-45s.png") });
  log("turntable state", await page.evaluate(() => ({ text: document.querySelector("main")?.innerText.slice(0, 500), canvases: [...document.querySelectorAll("canvas")].map((c) => [c.getAttribute("role"), c.getAttribute("aria-label")?.slice(0, 120), c.width, c.height]) })));
  log("axe turntable", await axe(page));
  log("tab /turntable", brief(await tabWalk(page, 30)));
  await page.screenshot({ path: path.join(OUT, "turntable-tab.png") });
  // More popover
  await page.getByRole("button", { name: /More/ }).click().catch(() => {}); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "turntable-more.png") });
  log("axe turntable more", await axe(page));
  log("turntable errors", errors.slice(0, 10));
  await c.close();
}

// J. phone flows
if (want("phone")) {
  const c = await ctx({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await c.newPage();
  await page.goto(BASE + "/listen"); await page.waitForSelector("main"); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /About this sound|Open About|About/ }).first().tap().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "phone-inspector.png") });
  log("axe phone inspector", await axe(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Mixer/ }).tap().catch(() => {}); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "phone-mixer.png") });
  await page.keyboard.press("Escape");
  await page.goto(BASE + "/then-now?view=monthly"); await page.waitForSelector("main"); await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, "phone-monthly.png"), fullPage: false });
  log("axe phone monthly", await axe(page));
  await c.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
