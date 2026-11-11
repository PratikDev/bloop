// B3/B6 in a real browser: the explorer opens with B, the caret is the needle (5 steps = 5 points, the value
// line follows, the sound plays), width 20 wraps, R reviews, an official record works the same, and axe finds
// no serious violation (including aria-braille-equivalent).
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { navTo, officialBrailleButton, open } from "./lib/app";
import { BRAILLE_NAMES, chooseBrailleOption, openBrailleSettings } from "./lib/braille";
import { openPlayerMore } from "./features/common";
import { BLANK, ROW_SEPARATOR, band, dotsOf, encodeValue } from "../src/a11y/brailleShape";
import { positionOn, type ShapeScale } from "../src/a11y/brailleSource";

const AXE = readFileSync(join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");
const CONTINUES = "\u28FF";

/** Past Start and the intro (lib/app.ts), on Listen's map with focus on it. */
async function start(page: Page) {
  await open(page);
  await page.locator("#sound-map").focus();
}

const lonOf = (line: string) => Number(/(\d+(?:\.\d+)?)([EW])/u.exec(line.split(" ").slice(3).join(" "))?.[1] ?? NaN);

test("B opens the explorer; the caret is the needle", async ({ page }) => {
  await start(page);
  await page.keyboard.press("b");
  const shape = page.getByTestId("braille-shape");
  const value = page.getByTestId("braille-value");
  await expect(shape).toBeFocused();
  await expect(shape).toHaveValue(/^Scale /u);
  const before = await value.inputValue();
  expect(before).toMatch(/^SST /u);

  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await expect(value).not.toHaveValue(before);
  const after = await value.inputValue();
  // Path mode: one point = 5 degrees of longitude, so 5 steps move the needle 25 degrees east.
  const moved = lonOf(after) - lonOf(before);
  expect(Math.abs(moved - 25)).toBeLessThanOrEqual(2.5);
  // The map's own label (the text alternative) follows the same needle.
  await expect(page.locator("#sound-map")).toHaveAttribute("aria-label", new RegExp(`${lonOf(after).toFixed(1)}`, "u"));
  // The sound plays at the new point (output level from the analyser, read after the move).
  await expect.poll(async () => Number(await page.locator("#braille-explorer").getAttribute("data-level"))).toBeGreaterThan(0);
});

test("width 20 wraps with the continuation marker; R reviews in words", async ({ page }) => {
  await start(page);
  await page.keyboard.press("b");
  await chooseBrailleOption(page, BRAILLE_NAMES.en.width, "20");
  const text = await page.getByTestId("braille-shape").inputValue();
  const lines = text.split("\n").slice(1);
  expect(lines.length).toBeGreaterThan(2);
  for (const l of lines) expect([...l].length).toBeLessThanOrEqual(20);
  expect(lines[0].endsWith(CONTINUES)).toBe(true);

  await page.getByTestId("braille-shape").focus();
  await page.keyboard.press("r");
  await expect(page.getByTestId("braille-value")).toHaveValue(/^Sea surface temperature .* at /u);
  await page.keyboard.press("r");
  await expect(page.getByTestId("braille-value")).toHaveValue(/^SST /u);
});

test("an official record: B on the record opens its explorer", async ({ page }) => {
  await start(page);
  await navTo(page, "Official records");
  const open = await officialBrailleButton(page, "Braille explorer");
  await expect(open).toBeEnabled({ timeout: 60_000 });
  await open.click();
  const value = page.getByTestId("braille-value");
  await expect(value).toHaveValue(/\d/u);
  const before = await value.inputValue();
  await page.getByTestId("braille-shape").focus();
  await page.keyboard.press("ArrowRight");
  await expect(value).not.toHaveValue(before);
});

test("axe: no serious violations with the explorer open", async ({ page }) => {
  await start(page);
  await page.keyboard.press("b");
  await expect(page.getByTestId("braille-shape")).toBeFocused();
  await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe;
    // A chosen option (a ChoiceGroup or RadioChoiceGroup) is ink on a gliding pill drawn behind it as its own layer, which axe can't
    // see (it measures the ink against the group's dark background, 1.05:1). Those are measured below instead.
    return axe.run({ exclude: [['[data-slot="toggle-group-item"][aria-pressed="true"]'], ['[role="radio"][aria-checked="true"]']] }, { resultTypes: ["violations"] });
  });
  // The chosen options' real contrast: their text colour against the pill's colour (WCAG 2 relative luminance).
  // The explorer's settings are radio groups (in the Display settings fold, opened here so they are measured).
  await openBrailleSettings(page);
  const chosen = await page.locator('[data-slot="toggle-group-item"][aria-pressed="true"], [role="radio"][aria-checked="true"]').evaluateAll((items) => {
    const lum = (rgb: string) => {
      const [r, g, b] = (rgb.match(/[\d.]+/gu) ?? []).slice(0, 3).map((v) => Number(v) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    return items.map((item) => {
      const pill = item.querySelector("span[aria-hidden='true']");
      const [fg, bg] = [lum(getComputedStyle(item).color), lum(pill ? getComputedStyle(pill).backgroundColor : "rgb(0,0,0)")];
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
  });
  expect(chosen.length).toBeGreaterThan(0);
  for (const ratio of chosen) expect(ratio).toBeGreaterThanOrEqual(4.5);
  const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  console.log(JSON.stringify(result.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, at: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })), null, 1));
  expect(result.violations.filter((v) => v.id === "aria-braille-equivalent")).toEqual([]);
  expect(serious).toEqual([]);
});

test("value line: no selection on focus, caret at 0, Home/End/arrows move it, typing changes nothing", async ({ page }) => {
  await start(page);
  await page.keyboard.press("b");
  await page.keyboard.press("Shift+Tab");
  const value = page.getByTestId("braille-value");
  await expect(value).toBeFocused();
  await expect(value).toHaveAttribute("aria-readonly", "true");
  const caret = () => value.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]);
  await expect.poll(caret).toEqual([0, 0]);
  const text = await value.inputValue();
  expect([...text].length).toBeLessThanOrEqual(40);
  await page.keyboard.press("End");
  await expect.poll(caret).toEqual([text.length, text.length]);
  await page.keyboard.press("Home");
  await expect.poll(caret).toEqual([0, 0]);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect.poll(caret).toEqual([2, 2]);
  for (const k of ["x", "Backspace", "Delete", "Enter", "Space"]) await page.keyboard.press(k);
  await page.keyboard.insertText("typed");
  await expect(value).toHaveValue(text);
});

test("বাংলা mode: the braille lines are written for the Bengali table (no Latin, no colon, decimals as দশমিক)", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "বাংলা" }).click();
  await page.locator("#sound-map").focus();
  await page.keyboard.press("b");
  const value = page.getByTestId("braille-value");
  await expect(value).toHaveValue(/^সমুদ্রপৃষ্ঠের তাপমাত্রা /u);
  const line = await value.inputValue();
  expect(line).not.toMatch(/[A-Za-z:]/u);
  expect(line).not.toMatch(/[0-9]\.[0-9]/u);
  expect(line).not.toMatch(/[০-৯়]/u); // Western digits (bn.tbl's number sign) and composed য়
  expect(line).toMatch(/ দশমিক /u);
  await expect(value).toHaveAttribute("lang", "bn");
  const heading = (await page.getByTestId("braille-shape").inputValue()).split("\n")[0];
  expect(heading).toMatch(/^স্কেল /u);
  expect(heading).not.toMatch(/[A-Za-z:]/u);
});

// ---- Braille correctness (Pratik, 2026-11-11): the cells come from the same numbers the readout shows. ----
// For each point the value line's number equals the readout's, the cell under the caret is the band the readout's
// value falls in on the record's shared scale (no data: the blank cell, never the lowest band), one arrow moves the
// needle exactly one point, and routing to a cell puts the needle on that cell's point.

/** Moves the needle with Go to (the player's More), then puts focus back on the shape line (its caret follows the needle). */
async function goTo(page: Page, lat: number, lon: number) {
  // More may still be open from the last move: a second click on it would close it again.
  const more = page.getByRole("region", { name: "Player" }).getByRole("button", { name: "More", exact: true });
  if ((await more.getAttribute("aria-expanded")) !== "true") await openPlayerMore(page);
  await page.getByRole("button", { name: "Go to a latitude and longitude" }).click();
  await page.getByRole("textbox", { name: /Latitude/u }).fill(String(lat));
  await page.getByRole("textbox", { name: /Longitude/u }).fill(String(lon));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("textbox", { name: /Latitude/u })).toBeHidden();
  // Close More again, so it doesn't sit over the explorer's settings.
  if ((await more.getAttribute("aria-expanded")) === "true") await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await page.waitForTimeout(400);
  await page.getByTestId("braille-shape").focus();
  await page.waitForTimeout(150);
}

/** Puts the needle on the nearest point of the shape line (Go to leaves it between points): one cell each way. */
async function snap(page: Page) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(250);
}

/** A routing key: the caret jumps to `offset` (as a display or a click puts it), then the field hears it. */
async function route(page: Page, offset: number) {
  await page.getByTestId("braille-shape").evaluate((el, o) => {
    const field = el as HTMLTextAreaElement;
    field.setSelectionRange(o, o);
    // React's select event listens for key-up (and selectionchange, which a script's caret move doesn't send everywhere).
    field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  }, offset);
  await page.waitForTimeout(300);
}

interface Seen {
  text: string;
  caret: number;
  scale: string;
  index: number;
  point: string;
  value: string;
  map: string;
}
const seen = (page: Page): Promise<Seen> =>
  page.evaluate(() => {
    const ta = document.querySelector<HTMLTextAreaElement>('[data-testid="braille-shape"]');
    const ex = document.getElementById("braille-explorer");
    return {
      text: ta?.value ?? "",
      caret: ta?.selectionStart ?? -1,
      scale: ex?.dataset.scale ?? "",
      index: Number(ex?.dataset.index ?? NaN),
      point: ex?.dataset.point ?? "",
      value: document.querySelector<HTMLInputElement>('[data-testid="braille-value"]')?.value ?? "",
      map: document.getElementById("sound-map")?.getAttribute("aria-label") ?? "",
    };
  });

const scaleOf = (s: string): ShapeScale => {
  const [min, max, kind] = s.split(",");
  return { min: Number(min), max: Number(max), scale: kind === "log" ? "log" : "linear", unit: "" };
};
/** The readout's number for a voice, from the map's name ("Both. 29.8 °C; Dry at …"); null for no data, 0 for dry. */
const readoutValue = (map: string, voice: "ocean" | "rain"): number | null => {
  if (voice === "ocean") return /No ocean data/u.test(map) ? null : Number(/(-?\d+(?:\.\d+)?) °C/u.exec(map)?.[1] ?? NaN);
  const rain = /(\d+(?:\.\d+)?) mm\/h/u.exec(map);
  return rain ? Number(rain[1]) : /Dry/u.test(map) ? 0 : null;
};
/** The value line's number ("SST 29.8C …", "Rain 1.2mmh …", "… no data", "Rain dry"). */
const lineValue = (line: string): number | null => {
  if (/ no data/u.test(line)) return null;
  if (/^Rain dry/u.test(line)) return 0;
  return Number(/^(?:SST|Rain) (-?\d+(?:\.\d+)?)/u.exec(line)?.[1] ?? NaN);
};
/** The caret offset of the k-th data cell (the heading, markers, row separators and breaks don't count). */
const dataOffset = (text: string, k: number): number => {
  let n = -1;
  for (let o = text.indexOf("\n") + 1; o < text.length; o++) {
    const ch = text[o];
    if (ch === "\n" || ch === " " || ch === CONTINUES || ch === ROW_SEPARATOR) continue;
    if (++n === k) return o;
  }
  return -1;
};
const placeOf = (map: string) => {
  const m = /at (\d+(?:\.\d+)?)° ([NS]), (\d+(?:\.\d+)?)° ([EW])/u.exec(map);
  return m ? `${m[2] === "S" ? -Number(m[1]) : Number(m[1])},${m[4] === "W" ? -Number(m[3]) : Number(m[3])}` : "";
};
const samePlace = (a: string, b: string) => {
  const [x, y] = a.split(",").map(Number);
  const [p, q] = b.split(",").map(Number);
  return Math.abs(x - p) < 0.051 && Math.abs(((y - q + 540) % 360) - 180) < 0.051;
};

// Ocean, land (no data), the antimeridian from both sides, the warm pool and the cold Southern Ocean (both ends of
// the ocean scale), at two widths and in both shapes: 6 points × 2 shapes × 2 widths = 24 checks, plus rain below.
const POINTS: [string, number, number][] = [
  ["Bay of Bengal", 15, 88],
  ["Dhaka (land)", 23.8, 90.4],
  ["antimeridian east", 0, 179.9],
  ["antimeridian west", 0, -179.9],
  ["warm pool", 5, 140],
  ["Southern Ocean", -58, -150],
];

test("braille cells match the readout: value, band, no data, one step, routing", async ({ page }) => {
  test.setTimeout(300_000);
  await start(page);
  await page.keyboard.press("b");
  await expect(page.getByTestId("braille-shape")).toBeFocused();
  const problems: string[] = [];
  let checked = 0;
  for (const width of ["14", "40"]) {
    await chooseBrailleOption(page, BRAILLE_NAMES.en.width, width);
    for (const shapeName of ["Along the latitude", "3 by 3 around the needle"]) {
      await chooseBrailleOption(page, BRAILLE_NAMES.en.shape, shapeName);
      const bands = shapeName === "Along the latitude" ? "line" : "grid";
      for (const [name, lat, lon] of POINTS) {
        await goTo(page, lat, lon);
        await snap(page);
        const s = await seen(page);
        const at = `${name}, width ${width}, ${bands}`;
        const readout = readoutValue(s.map, "ocean");
        const value = lineValue(s.value);
        if (readout !== value) problems.push(`${at}: value line ${value} vs readout ${readout}`);
        const cell = s.text[s.caret];
        const t = positionOn(scaleOf(s.scale), readout);
        const expected = encodeValue(t, bands);
        if (cell !== expected) problems.push(`${at}: cell ${dotsOf(cell ?? BLANK).join("")} vs band ${t === null ? "blank" : band(t, bands)} (${dotsOf(expected).join("")})`);
        if (readout === null && cell !== BLANK) problems.push(`${at}: no data is not the blank cell`);
        if (!samePlace(s.point, placeOf(s.map))) problems.push(`${at}: needle ${placeOf(s.map)} is not on the caret's point ${s.point}`);
        checked++;
      }
      // One arrow = one point: along the latitude the next point on the line; in 3 × 3 the next cell east.
      await goTo(page, 15, 88);
      await snap(page);
      const before = await seen(page);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(250);
      const after = await seen(page);
      const [, lonBefore] = before.point.split(",").map(Number);
      const [latAfter, lonAfter] = after.point.split(",").map(Number);
      if (bands === "line" && after.index !== before.index + 1) problems.push(`width ${width}, line: one arrow moved ${after.index - before.index} points`);
      // In 3 × 3 the cells are a fixed grid around the needle's area: one arrow is one cell east, on the same row.
      const cell = Math.abs(lonAfter - lonBefore);
      if (bands === "grid" && (latAfter !== Number(before.point.split(",")[0]) || !(lonAfter > lonBefore) || cell > 10)) problems.push(`width ${width}, grid: one arrow went from ${before.point} to ${after.point}`);
      if (!samePlace(after.point, placeOf(after.map))) problems.push(`width ${width}, ${bands}: after an arrow the needle is not on the caret's point`);
      // Routing (a display's routing key, or a click) to cell n = the needle on cell n's point (along the latitude,
      // cell n is point n).
      if (bands === "line") {
        const k = 3;
        await route(page, dataOffset(after.text, k));
        const routed = await seen(page);
        if (routed.index !== k) problems.push(`width ${width}, line: routing to cell ${k} put the needle on point ${routed.index}`);
        if (!samePlace(routed.point, placeOf(routed.map))) problems.push(`width ${width}, line: after routing the needle is not on the cell's point`);
      }
    }
  }
  // Rain, along the latitude: wet, dry and no-data cells keep their bands.
  await chooseBrailleOption(page, BRAILLE_NAMES.en.data, BRAILLE_NAMES.en.rain);
  await chooseBrailleOption(page, BRAILLE_NAMES.en.shape, "Along the latitude");
  for (const [name, lat, lon] of [["Bay of Bengal", 15, 88], ["Pacific ITCZ", 7, -140], ["Sahara (dry)", 23, 10]] as const) {
    await goTo(page, lat, lon);
    await snap(page);
    const s = await seen(page);
    const readout = readoutValue(s.map, "rain");
    const value = lineValue(s.value);
    if (readout !== value) problems.push(`rain ${name}: value line ${value} vs readout ${readout}`);
    const expected = encodeValue(positionOn(scaleOf(s.scale), readout), "line");
    if (s.text[s.caret] !== expected) problems.push(`rain ${name}: cell ${dotsOf(s.text[s.caret] ?? BLANK).join("")} vs ${dotsOf(expected).join("")}`);
    checked++;
  }
  console.log(`braille consistency: ${checked} points checked`);
  expect(problems).toEqual([]);
  expect(checked).toBeGreaterThanOrEqual(12);
});
