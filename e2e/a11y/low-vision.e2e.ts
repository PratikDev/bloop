// Accessibility core, step 8 (docs/accessibility/CORE_PLAN.md; spec Part 4): low-vision mode. The Alt+L preset, the
// Context Lens (value, scale, overview, labelled bands; follows keyboard moves; Z and [ ]; a corner or docked in the
// page), every re-colour scheme with its legend and "re-coloured" label, band labels that match the decoded values,
// thick coastlines and city labels, reflow at 320 px, WCAG 1.4.12 text spacing, theme contrast (text, focus ring,
// needle), 44 px targets, point of regard (text size and zoom), calm view and reduced motion, forced colours, no
// hover-only content, panels in the page instead of pop-ups, the preset in Track 0, the settings panel (axe), speaking
// on dwell. Runs on a build with NEXT_PUBLIC_A11Y_LOW_VISION=1 (steps 1–7 on). Item 10 of the plan checks Part 4 here.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { cellIndex, readUint16LE } from "../../src/lib/data/grid";
import { sstGrid } from "../../src/lib/describe/facts";
import { contrast } from "../../src/lib/low-vision/contrast";
import { LV_DEFAULTS, LV_PRESET, LV_STORAGE_KEY, SCHEMES, type LowVision } from "../../src/lib/low-vision/settings";
import type { SstMetadata } from "../../src/types/data-contract";
import { start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logLiveRegion, settle } from "../mentor/lib";

const ROOT = path.resolve(__dirname, "../..");
const map = (page: Page) => page.locator("#sound-map");
const lens = (page: Page) => page.getByTestId("context-lens");
const html = (page: Page, attr: string) => page.evaluate((a) => document.documentElement.getAttribute(a), attr);

function sstValue(lat: number, lon: number): number | null {
  const meta = JSON.parse(readFileSync(path.join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
  const b = readFileSync(path.join(ROOT, "public/data/latest/sst.bin"));
  const codes = readUint16LE(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), meta.grid);
  return sstGrid({ meta, codes }).value(cellIndex(meta.grid, lat, lon));
}

/** Opens Listen with these low-vision settings already saved (as a return visit would). */
async function withSettings(page: Page, lv: Partial<LowVision>, opts: { hide3d?: boolean } = {}) {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [LV_STORAGE_KEY, JSON.stringify({ ...LV_DEFAULTS, ...lv })] as const);
  await start(page, opts);
  await page.goto("/listen");
  await settle(page, 1500);
}

const PRESET: Partial<LowVision> = { ...LV_PRESET, on: true };

for (const hide3d of [false, true]) {
  test.describe(`low vision, 3D ${hide3d ? "hidden" : "shown"}`, () => {
    test("Alt+L turns the preset on (said once), and it is remembered", async ({ page }) => {
      await start(page, { hide3d });
      await page.goto("/listen");
      await settle(page, 1200);
      await logLiveRegion(page);
      await page.keyboard.press("Alt+KeyL");
      await expect.poll(() => html(page, "data-lv-theme")).toBe("hcDark");
      expect(await html(page, "data-lv-calm")).toBe("");
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lv-text-scale").trim())).toBe("1.5");
      await expect.poll(async () => (await liveLog(page)).filter((l) => l.startsWith("Low-vision mode on")).length).toBe(1);
      await expect(lens(page)).toBeVisible();
      await expect(page.getByTestId("lv-legend")).toBeVisible();
      await page.reload();
      await settle(page, 1500);
      expect(await html(page, "data-lv-theme")).toBe("hcDark");
      await expect(page.getByRole("button", { name: "Low vision" })).toHaveAttribute("aria-pressed", "true");
    });

    test("the Context Lens shows the value, a scale with the needle's band and the overview, and follows keyboard moves", async ({ page }) => {
      await withSettings(page, PRESET, { hide3d });
      await expect(lens(page)).toBeVisible();
      for (const id of ["lens-view", "lens-overview", "lens-value", "lens-place", "lens-scale"]) await expect(page.getByTestId(id)).toBeVisible();
      await expect(page.getByTestId("lens-scale").locator("[data-here]")).toHaveCount(1);
      await map(page).focus();
      const before = await page.getByTestId("lens-place").textContent();
      const box0 = await lens(page).boundingBox();
      for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowLeft");
      await settle(page, 400);
      const box1 = await lens(page).boundingBox();
      expect(box1!.x).not.toBe(box0!.x);
      await expect.poll(() => page.getByTestId("lens-place").textContent()).not.toBe(before);
      // The lens says the same number as the readout beside the map (or, on land, that there is no data).
      const readout = (await page.locator('[data-slot="readout"] p').first().textContent()) ?? "";
      const figure = /[−-]?\d+(?:\.\d+)?/u.exec(readout)?.[0];
      await expect(page.getByTestId("lens-value")).toContainText(figure ?? "No data");
      await page.keyboard.press("BracketRight");
      await expect.poll(async () => (await lens(page).boundingBox())!.width).toBeGreaterThan(box1!.width);
      await page.keyboard.press("z");
      await expect(lens(page)).toHaveCount(0);
      await page.keyboard.press("z");
      await expect(lens(page)).toBeVisible();
    });
  });
}

// One test per scheme: each starts in a fresh browser context (a saved sound choice would skip the start screen).
for (const scheme of SCHEMES.filter((s) => s !== "original")) {
  test(`re-colour scheme ${scheme}: a matching legend and the re-coloured label; NASA's colours one press away`, async ({ page }) => {
    await withSettings(page, { scheme, bands: 5 });
    const legend = page.getByTestId("lv-legend");
    await expect(legend).toBeVisible();
    await expect(legend.locator("li")).toHaveCount(5 + 1); // five bands and "no data" (ocean)
    await expect(page.getByTestId("lv-recoloured")).toContainText("Re-coloured by Bloop from decoded values");
    await page.getByRole("button", { name: "Show NASA's original colours" }).click();
    await expect(legend).toHaveCount(0);
  });
}

test("band labels on the map sit on cells whose decoded value is in the band they name", async ({ page }) => {
  await withSettings(page, { scheme: "luminance", bands: 7 });
  const layer = page.getByTestId("lv-map-layer");
  await expect.poll(async () => JSON.parse((await layer.getAttribute("data-labels")) ?? "[]").length).toBeGreaterThan(3);
  const labels = JSON.parse((await layer.getAttribute("data-labels"))!) as { lat: number; lon: number; text: string }[];
  for (const l of labels) {
    const [lo, hi] = l.text.split(" to ").map((s) => Number(s.replace("−", "-")));
    const v = sstValue(l.lat, l.lon)!;
    expect(v).toBeGreaterThanOrEqual(lo);
    expect(v).toBeLessThan(hi);
  }
});

test("reflow at 320 px (400% zoom): one column, no horizontal scroll, the value still beside the map", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await withSettings(page, PRESET);
  // Can the page be scrolled sideways at all? (Hidden overflow doesn't count: nothing can be reached by scrolling.)
  const scrolledX = await page.evaluate(() => {
    window.scrollTo(10_000, window.scrollY);
    const x = window.scrollX;
    window.scrollTo(0, window.scrollY);
    return x;
  });
  expect(scrolledX).toBe(0);
  await expect(map(page)).toBeVisible();
  await page.locator('[data-slot="readout"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-slot="readout"]')).toBeInViewport();
});

test("WCAG 1.4.12 text spacing: the header, readout and settings keep all their text", async ({ page }) => {
  await withSettings(page, { spacing: "wide" });
  await page.getByRole("button", { name: "Low-vision settings" }).click();
  const clipped = await page.evaluate(() => {
    const roots = [document.querySelector("header"), document.querySelector('[data-slot="readout"]'), document.querySelector('[data-testid="lv-settings"]')];
    const out: string[] = [];
    for (const root of roots) {
      for (const el of root?.querySelectorAll<HTMLElement>("button, p, label, h1, h2, legend, span") ?? []) {
        const s = getComputedStyle(el);
        // Visually hidden text (for screen readers) is clipped on purpose.
        if (s.position === "absolute" && el.clientWidth <= 1) continue;
        if (s.webkitLineClamp !== "none" && s.webkitLineClamp !== "") continue;
        if ((s.overflow === "hidden" || s.overflowX === "hidden") && el.scrollWidth > el.clientWidth + 1 && el.textContent?.trim()) out.push(el.textContent.trim().slice(0, 40));
      }
    }
    return out;
  });
  expect(clipped).toEqual([]);
});

for (const theme of ["hcDark", "hcLight"] as const) {
  test(`high-contrast theme ${theme}: page text at least 7:1; focus ring at least 3 px and 3:1; the needle's outlines 3:1`, async ({ page }) => {
    const p = page;
    await withSettings(p, { theme });
    const [fg, bg] = await p.evaluate(() => {
      const hex = (c: string) => `#${(c.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
      const h = document.querySelector("h1") ?? document.body;
      return [hex(getComputedStyle(h).color), hex(getComputedStyle(document.body).backgroundColor)];
    });
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(7);
    // The low-vision buttons keep the header one row high: nothing of the page slides under it.
    const [headerBottom, titleTop] = await p.evaluate(() => [document.querySelector("header")!.getBoundingClientRect().bottom, document.querySelector("#listen-title")!.getBoundingClientRect().top]);
    expect(titleTop).toBeGreaterThanOrEqual(headerBottom - 1);
    // The focus ring and the needle's ring are --shapla; the page is --night; the needle's outlines are --ink.
    // Resolved where the page uses them (a probe in <body>), as computed colours.
    const v = await p.evaluate(() => {
      const hex = (c: string) => `#${(c.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
      const probe = document.createElement("div");
      probe.style.cssText = "color: var(--shapla); background-color: var(--night); border: 1px solid var(--ink)";
      document.body.append(probe);
      const s = getComputedStyle(probe);
      const out = { shapla: hex(s.color), night: hex(s.backgroundColor), ink: hex(s.borderTopColor) };
      probe.remove();
      return out;
    });
    expect(contrast(v.shapla, v.night)).toBeGreaterThanOrEqual(3);
    expect(contrast(v.shapla, v.ink)).toBeGreaterThanOrEqual(3);
    // Keyboard focus (so :focus-visible applies): Tab twice from the page's start; the ring is there at once.
    await p.keyboard.press("Tab");
    await p.keyboard.press("Tab");
    const ring = await p.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { width: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    expect(ring.width).toBeGreaterThanOrEqual(3);
    expect(ring.style).toBe("solid");
  });
}

test("extra-large controls: every visible button and link on Listen is at least 44 px", async ({ page }) => {
  await withSettings(page, { controls: "xl" });
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("header button, header a[href], main button, [aria-label] > div button")]
      .filter((el) => el.offsetParent !== null && !el.closest("[inert]"))
      .map((el) => ({ name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "", r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 43.5 || r.height < 43.5))
      .map(({ name, r }) => `${name}: ${Math.round(r.width)}×${Math.round(r.height)}`),
  );
  expect(small).toEqual([]);
});

test("point of regard: after the largest text size, the needle's map is still on screen", async ({ page }) => {
  await withSettings(page, { lens: false });
  await map(page).focus();
  await page.getByRole("button", { name: "Low-vision settings" }).click();
  await page.getByRole("button", { name: "300%", exact: true }).click();
  await settle(page, 600);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lv-text-scale").trim())).toBe("3");
  await expect(map(page)).toBeInViewport({ ratio: 0.1 });
});

test("point of regard: zooming in (the viewport shrinks to 400%) keeps the needle's map on screen", async ({ page }) => {
  await withSettings(page, PRESET);
  await map(page).focus();
  await page.setViewportSize({ width: 320, height: 640 });
  await settle(page, 600);
  await expect(map(page)).toBeInViewport({ ratio: 0.1 });
});

test("calm view and reduced motion: no animation keeps running", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await withSettings(page, { calm: true });
  await settle(page, 1200);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length);
  expect(running).toBe(0);
  await expect(page.locator("[data-decorative]").first()).toBeHidden();
});

test("forced colours (Windows contrast themes): the 3D views fall back, the map works by keyboard", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await start(page);
  await page.goto("/listen");
  await settle(page, 1500);
  await logLiveRegion(page);
  await map(page).focus();
  await page.keyboard.press("ArrowUp");
  await expect.poll(async () => (await liveLog(page)).join(" ")).toMatch(/° N|degrees/u);
  await page.goto("/turntable");
  await settle(page, 1500);
  await expect(page.getByTestId("hidden-3d-note").first()).toBeVisible();
});

test("no information in tooltips: nothing on Listen or in the settings carries a title attribute", async ({ page }) => {
  await withSettings(page, PRESET);
  await page.getByRole("button", { name: "Low-vision settings" }).click();
  const titled = await page.evaluate(() => [...document.querySelectorAll("main [title], header [title], [data-testid='context-lens'] [title]")].map((e) => e.outerHTML.slice(0, 80)));
  expect(titled).toEqual([]);
});

test("the settings panel: inline (not a dialog), axe clean, a custom theme warns below 7:1, Atkinson applies", async ({ page }) => {
  await withSettings(page, {});
  await page.getByRole("button", { name: "Low-vision settings" }).click();
  const panel = page.getByTestId("lv-settings");
  await expect(panel).toBeVisible();
  expect(await page.getByRole("dialog").count()).toBe(0);
  expect(await axeSerious(page, '[data-testid="lv-settings"]')).toEqual([]);
  await panel.getByRole("button", { name: "My own colours", exact: true }).click();
  await panel.getByLabel("Text colour").fill("#777777");
  await panel.getByLabel("Background colour").fill("#555555");
  await expect(panel).toContainText("below 7 to 1");
  await panel.getByRole("button", { name: "Atkinson Hyperlegible", exact: true }).click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Atkinson/u);
  await panel.getByRole("button", { name: "Reset low-vision settings" }).click();
  await expect.poll(() => html(page, "data-lv-theme")).toBeNull();
});

test("resting the pointer on the map says the value there", async ({ page }) => {
  await withSettings(page, { speakDwell: true });
  await logLiveRegion(page);
  const box = (await map(page).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.4);
  await page.mouse.move(box.x + box.width * 0.72 + 1, box.y + box.height * 0.4);
  await expect.poll(async () => (await liveLog(page)).join(" "), { timeout: 5000 }).toMatch(/degrees|no ocean|land/iu);
});

test("the lens labels its bands with their ranges, on cells whose decoded value is in that band", async ({ page }) => {
  await withSettings(page, { ...PRESET, scheme: "luminance", bands: 5 });
  await map(page).focus();
  await page.keyboard.press("ArrowUp");
  const view = page.getByTestId("lens-view");
  await expect.poll(async () => JSON.parse((await view.getAttribute("data-labels")) ?? "[]").length).toBeGreaterThan(0);
  const labels = JSON.parse((await view.getAttribute("data-labels"))!) as { lat: number; lon: number; text: string }[];
  for (const l of labels) {
    const [lo, hi] = l.text.split(" to ").map((x) => Number(x.replace("−", "-")));
    const v = sstValue(l.lat, l.lon)!;
    expect(v).toBeGreaterThanOrEqual(lo);
    if (hi !== undefined) expect(v).toBeLessThan(hi);
  }
});

test("the lens sits where the user puts it: a corner of the screen, or docked in the page under the map", async ({ page }) => {
  await withSettings(page, { ...PRESET, lensPlace: "topLeft" });
  const box = (await lens(page).boundingBox())!;
  expect(box.x).toBeLessThanOrEqual(12);
  expect(box.y).toBeLessThanOrEqual(12);
  await page.getByRole("button", { name: "Low-vision settings" }).click();
  await page.getByTestId("lv-settings").getByRole("button", { name: "In the page, under the map", exact: true }).click();
  await expect(lens(page)).toHaveAttribute("data-place", "docked");
  await expect(page.locator("#lv-lens-dock [data-testid='context-lens']")).toBeVisible();
  expect(await lens(page).evaluate((el) => getComputedStyle(el).position)).not.toBe("fixed");
});

test("thick coastlines and city labels: Dhaka, Chattogram and the needle's place are written on the map", async ({ page }) => {
  await withSettings(page, PRESET);
  const layer = page.getByTestId("lv-map-layer");
  await expect(layer).toHaveAttribute("data-coast", "3");
  await expect.poll(async () => JSON.parse((await layer.getAttribute("data-cities")) ?? "[]") as string[]).toEqual(expect.arrayContaining(["Dhaka", "Chattogram"]));
  const cities = JSON.parse((await layer.getAttribute("data-cities"))!) as string[];
  const place = ((await page.getByTestId("lens-place").textContent()) ?? "").split(",")[0];
  expect(cities).toContain(place);
});

test("Track 0 offers the low-vision preset", async ({ page }) => {
  // As tuning.e2e.ts: Start lands on Listen with Track 0 open (a reload would end it).
  await start(page, { keepTuning: true });
  await page.waitForURL(/listen|\/$/u);
  if (!/listen/u.test(page.url())) await page.goto("/listen");
  await settle(page, 800);
  const tuning = page.getByTestId("tuning");
  await expect(tuning).toBeVisible();
  await tuning.getByRole("button", { name: "Low-vision mode" }).click();
  await expect.poll(() => html(page, "data-lv-theme")).toBe("hcDark");
  await expect(tuning.getByRole("button", { name: "Low-vision mode" })).toHaveAttribute("aria-pressed", "true");
});

test("no pop-ups in low-vision mode: How we got this, About this sound and Help open in the page; Escape closes them", async ({ page }) => {
  await withSettings(page, PRESET);
  const how = page.locator("[data-how-we-got-this]:visible").first();
  await how.click();
  await expect(how).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("how-we-got-this")).toBeVisible();
  expect(await page.getByRole("dialog").count()).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("how-we-got-this")).toHaveCount(0);
  await expect(how).toBeFocused();

  await page.getByRole("button", { name: "About this sound" }).click();
  await expect(page.getByTestId("inspector-inline")).toBeVisible();
  expect(await page.getByRole("dialog").count()).toBe(0);
  await page.getByTestId("inspector-inline").getByRole("button", { name: "Close" }).click();
  await expect(page.getByTestId("inspector-inline")).toHaveCount(0);

  await map(page).focus();
  await page.keyboard.press("h");
  await expect(page.getByTestId("help-inline")).toBeVisible();
  await expect(page.getByTestId("help-inline").getByRole("heading", { name: "Keys and help" })).toBeFocused();
  expect(await page.getByRole("dialog").count()).toBe(0);
  expect(await axeSerious(page, '[data-testid="help-inline"]')).toEqual([]);
});

test("with no low-vision settings the layout is unchanged: Listen fits one screen, the dock is one row, nothing under the header", async ({ page }) => {
  await start(page);
  await page.goto("/listen");
  await settle(page, 1500);
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollHeight - window.innerHeight,
    headerBottom: document.querySelector("header")!.getBoundingClientRect().bottom,
    titleTop: document.querySelector("#listen-title")!.getBoundingClientRect().top,
    dock: document.querySelector("[data-dock]")!.getBoundingClientRect().height,
  }));
  expect(m.scroll).toBeLessThanOrEqual(0);
  expect(m.titleTop).toBeGreaterThanOrEqual(m.headerBottom - 1);
  expect(m.dock).toBeLessThan(96); // one row is about 70 px; a second row of actions would add about 45
});
