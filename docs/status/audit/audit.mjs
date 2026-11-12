// Audit pass 1: axe + layout metrics + screenshots for every route, viewport and state.
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BLOOP_URL ?? "http://localhost:3217";
const OUT = path.resolve(process.argv[2] ?? "audit-out");
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ["/", "/listen", "/then-now", "/how", "/official", "/turntable", "/no-such-page"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "phone", width: 390, height: 844 },
  { name: "small", width: 320, height: 568 },
  { name: "zoom200", width: 640, height: 360 }, // 1280x720 at 200 %
  { name: "zoom400", width: 320, height: 256 }, // 1280x1024 at 400 % (WCAG 1.4.10)
];
const ONLY_VP = process.env.VP ? process.env.VP.split(",") : null;
const ONLY_ROUTE = process.env.ROUTE ? process.env.ROUTE.split(",") : null;
const STATES = (process.env.STATES ?? "started,first,bn").split(",");

const PREFS = (extra) => JSON.stringify({ lang: "en", describe: false, captions: true, builtInVoice: true, soundWords: true, started: true, ...extra });

function metrics() {
  const main = document.querySelector("main");
  const vw = window.innerWidth, vh = window.innerHeight;
  const vis = (el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 50);
  const targets = [];
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="tab"], [role="slider"], [role="switch"], [role="menuitem"], [tabindex]:not([tabindex="-1"])')) {
    if (!vis(el) || el.closest("[inert]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    targets.push({ name: name(el), tag: el.tagName.toLowerCase(), role: el.getAttribute("role"), w: Math.round(r.width), h: Math.round(r.height) });
  }
  const smallText = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").trim();
    if (!text || !vis(el)) continue;
    if (el.closest(".sr-only")) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 14) {
      const key = `${fs}|${text.slice(0, 30)}`;
      if (!seen.has(key)) { seen.add(key); smallText.push({ px: fs, text: text.slice(0, 40), hidden: !!el.closest('[aria-hidden="true"]') }); }
    }
  }
  const mr = main?.getBoundingClientRect();
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].filter((h) => vis(h) && !h.closest("[inert]")).map((h) => `${h.tagName.toLowerCase()}:${(h.textContent ?? "").trim().slice(0, 40)}`);
  const landmarks = [...document.querySelectorAll("header,nav,main,footer,aside,section[aria-label],section[aria-labelledby],[role=region],[role=dialog],[role=application],[role=search],form[aria-label]")]
    .filter(vis)
    .map((l) => `${l.tagName.toLowerCase()}${l.getAttribute("role") ? `[${l.getAttribute("role")}]` : ""}:${l.getAttribute("aria-label") ?? (l.getAttribute("aria-labelledby") ? "#" + l.getAttribute("aria-labelledby") : "")}`);
  return {
    lang: document.documentElement.lang,
    title: document.title,
    docScrollW: document.documentElement.scrollWidth,
    vw, vh,
    main: mr ? { top: Math.round(mr.top), h: Math.round(mr.height), scrollH: main.scrollHeight, scrollW: main.scrollWidth, clientW: main.clientWidth } : null,
    mainShare: mr ? +(mr.height / vh).toFixed(2) : null,
    targetsUnder24: targets.filter((t) => t.w < 24 || t.h < 24),
    targetsUnder44: targets.filter((t) => (t.w < 44 || t.h < 44) && !(t.w < 24 || t.h < 24)),
    targetCount: targets.length,
    smallText,
    headings,
    landmarks,
    liveRegions: [...document.querySelectorAll("[aria-live],[role=status],[role=alert],[role=log]")].map((l) => `${l.tagName.toLowerCase()}[${l.getAttribute("aria-live") ?? l.getAttribute("role")}] ${l.className.toString().slice(0, 30)}`),
    canvases: [...document.querySelectorAll("canvas")].filter(vis).map((c) => ({ role: c.getAttribute("role"), label: c.getAttribute("aria-label"), hidden: !!c.closest('[aria-hidden="true"]'), tabindex: c.getAttribute("tabindex") })),
  };
}

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
const results = [];
for (const vp of VIEWPORTS) {
  if (ONLY_VP && !ONLY_VP.includes(vp.name)) continue;
  for (const state of STATES) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.name.startsWith("zoom") ? 2 : 1, hasTouch: vp.name === "phone" || vp.name === "small", isMobile: vp.name === "phone" || vp.name === "small" });
    if (state !== "first") await context.addInitScript((prefs) => localStorage.setItem("jukebox.prefs.v1", prefs), PREFS(state === "bn" ? { lang: "bn" } : {}));
    for (const route of ROUTES) {
      if (ONLY_ROUTE && !ONLY_ROUTE.includes(route)) continue;
      if (state === "bn" && vp.name !== "desktop" && vp.name !== "small") continue;
      if (state === "first" && !["/", "/listen"].includes(route)) continue;
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
      page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
      const id = `${vp.name}-${state}-${route === "/" ? "home" : route.slice(1)}`;
      try {
        await page.goto(BASE + route, { waitUntil: "load" });
        await page.waitForSelector("main", { timeout: 20000 });
        await page.waitForTimeout(route === "/turntable" ? 6000 : 3000);
        await page.screenshot({ path: path.join(OUT, `${id}.png`) });
        await page.addScriptTag({ path: AXE });
        const axe = await page.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }, resultTypes: ["violations", "incomplete"] });
          const brief = (list) => list.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(" ").slice(0, 120), html: n.html.slice(0, 160), msg: (n.any[0]?.message ?? n.all[0]?.message ?? n.none[0]?.message ?? "").slice(0, 200) })) }));
          return { violations: brief(r.violations), incomplete: brief(r.incomplete.filter((i) => i.id === "color-contrast")) };
        });
        const m = await page.evaluate(metrics);
        results.push({ id, route, vp: vp.name, state, axe, metrics: m, errors });
        console.log(`${id}: axe ${axe.violations.map((v) => `${v.id}(${v.n})`).join(",") || "clean"} | overflowX ${m.docScrollW > m.vw ? m.docScrollW - m.vw : 0} | mainShare ${m.mainShare} | <24: ${m.targetsUnder24.length} | <44: ${m.targetsUnder44.length} | smallText ${m.smallText.length} | errors ${errors.length}`);
      } catch (e) {
        results.push({ id, route, vp: vp.name, state, error: String(e).slice(0, 300), errors });
        console.log(`${id}: FAILED ${String(e).slice(0, 200)}`);
      }
      await page.close();
    }
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
