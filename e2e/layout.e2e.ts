// Nothing is printed over anything else: on every page at every viewport, no two text elements overlap and nothing
// scrolls sideways. Chromium only. Overlays on the map and the 3D view (data-overlay) sit on purpose, so they don't count.
import { expect, test, type Page } from "@playwright/test";
import { start } from "./lib/app";

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];

// Official follows How we know, which links to it (it isn't in the header).
const PATHS = ["/", "/listen", "/then-now", "/how", "/official", "/turntable"];

const SETTLE_MS = 1500;
const MAX_OVERLAP_PX = 2;

interface Finding {
  overlaps: string[];
  documentWidth: number;
  mainWidth: number;
  mainClientWidth: number;
  viewportWidth: number;
}

/** Runs in the page. A page scrolls inside main, so main's text is compared in full, wherever it has scrolled to. */
function findOverlaps(maxOverlap: number): Finding {
  interface Rect { left: number; top: number; right: number; bottom: number }
  interface Item { el: Element; text: string; inMain: boolean; rect: Rect; shown: Rect }

  const main = document.querySelector("main");
  const intersect = (a: Rect, b: Rect): Rect => ({
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  });
  const isEmpty = (r: Rect) => r.right - r.left <= 0 || r.bottom - r.top <= 0;
  const viewport: Rect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

  /** The element's box, cut by every clipping ancestor below main (a side-scrolling list, a truncated row). */
  const clipped = (el: Element): Rect => {
    let box: Rect = el.getBoundingClientRect();
    for (let a = el.parentElement; a && a !== main && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX !== "visible" || s.overflowY !== "visible") box = intersect(box, a.getBoundingClientRect());
    }
    return box;
  };

  const items: Item[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    if (el.closest('[aria-hidden="true"], [data-overlay]')) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim();
    if (!text) continue;
    // False for display: none, hidden and transparent text, and for what's inside a closed <details>.
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const inMain = main?.contains(el) ?? false;
    const rect = clipped(el);
    const shown = intersect(rect, inMain && main ? intersect(viewport, main.getBoundingClientRect()) : viewport);
    if (isEmpty(inMain ? rect : shown)) continue;
    items.push({ el, text, inMain, rect, shown });
  }

  const overlaps: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // Inside main, the whole page counts; against the header or dock, only what is on screen there.
      const both = a.inMain === b.inMain;
      const area = intersect(both ? a.rect : a.shown, both ? b.rect : b.shown);
      if (area.right - area.left > maxOverlap && area.bottom - area.top > maxOverlap) overlaps.push(`"${a.text.slice(0, 50)}" × "${b.text.slice(0, 50)}"`);
    }
  }
  return {
    overlaps,
    documentWidth: document.documentElement.scrollWidth,
    mainWidth: main?.scrollWidth ?? 0,
    mainClientWidth: main?.clientWidth ?? 0,
    viewportWidth: window.innerWidth,
  };
}

/** A click on the header's link, as a user moves between pages (phones show shorter labels, so by address). */
async function go(page: Page, path: string) {
  if (path === "/official") {
    await page.getByRole("main").locator("summary", { hasText: "Credits" }).click();
    await page.getByRole("main").getByRole("link", { name: "All official records" }).click();
  }
  else await page.getByRole("banner").locator(`a[href="${path}"]`).first().click();
  await page.waitForTimeout(SETTLE_MS);
}

for (const viewport of VIEWPORTS) {
  test(`no text overlaps at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    await start(page);
    const problems: string[] = [];
    for (const path of PATHS) {
      await go(page, path);
      const found = await page.evaluate(findOverlaps, MAX_OVERLAP_PX);
      for (const o of found.overlaps) problems.push(`${path}: ${o}`);
      if (found.documentWidth > found.viewportWidth) problems.push(`${path}: the page scrolls sideways (${found.documentWidth} > ${found.viewportWidth})`);
      if (found.mainWidth > found.mainClientWidth) problems.push(`${path}: main scrolls sideways (${found.mainWidth} > ${found.mainClientWidth})`);
    }
    expect(problems, `at ${viewport.width}×${viewport.height}`).toEqual([]);
  });
}
