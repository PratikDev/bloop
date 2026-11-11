// B3/B6 in a real browser: the explorer opens with B, the caret is the needle (5 steps = 5 points, the value
// line follows, the sound plays), width 20 wraps, R reviews, an official record works the same, and axe finds
// no serious violation (including aria-braille-equivalent).
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAP_READING, navTo, open } from "./lib/app";

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
  // The map's reading follows the same needle.
  await expect(page.locator("#sound-map")).toHaveAttribute(MAP_READING, new RegExp(`${lonOf(after).toFixed(1)}`, "u"));
  // The sound plays at the new point (output level from the analyser, read after the move).
  await expect.poll(async () => Number(await page.locator("#braille-explorer").getAttribute("data-level"))).toBeGreaterThan(0);
});

test("width 20 wraps with the continuation marker; R reviews in words", async ({ page }) => {
  await start(page);
  await page.keyboard.press("b");
  await page.getByRole("group", { name: "Display width (cells)" }).getByRole("button", { name: "20", exact: true }).click();
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
  const open = page.getByRole("button", { name: "Braille explorer" }).last();
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
    // A chosen option (main's ChoiceGroup) is ink on a gliding pill drawn behind it as its own layer, which axe can't
    // see (it measures the ink against the group's dark background, 1.05:1). Those are measured below instead.
    return axe.run({ exclude: [['[data-slot="toggle-group-item"][aria-pressed="true"]']] }, { resultTypes: ["violations"] });
  });
  // The chosen options' real contrast: their text colour against the pill's colour (WCAG 2 relative luminance).
  const chosen = await page.locator('[data-slot="toggle-group-item"][aria-pressed="true"]').evaluateAll((items) => {
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

// Plan item 11: the same checks on Then vs Now. The shape line is the selected part's series for the selected city
// on the shared scale, the caret is the year, moving it plays that year, R gives the value with the change and its
// 95% interval; width 20 wraps; axe finds nothing serious; the Bengali table's lines have no Latin.
async function thenNow(page: Page, part?: string) {
  await start(page);
  await navTo(page, "Then vs Now");
  // The page settles after arriving (it renders once more); a click before that is lost with the first render.
  await page.waitForTimeout(1500);
  if (part) await page.getByRole("tab", { name: part }).click();
  const open = page.getByRole("button", { name: "Braille explorer" }).last();
  await expect(open).toBeEnabled({ timeout: 60_000 });
  await open.click();
  await expect(page.getByTestId("braille-shape")).toBeFocused();
}

test("Then vs Now: the caret is the year; moving it changes the year and plays it; the city is named", async ({ page }) => {
  await thenNow(page);
  const value = page.getByTestId("braille-value");
  await expect(page.getByTestId("braille-shape")).toHaveValue(/^Scale /u);
  await expect(value).toHaveValue(/^Heat .*Dhaka/u);
  // The point's year is the line's last four-digit number (the window label "2016-2025" comes before it).
  const year = (s: string) => Number([...s.matchAll(/\b(?:19|20)\d{2}\b/gu)].at(-1)?.[0]);
  const before = await value.inputValue();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowLeft");
  await expect(value).not.toHaveValue(before);
  expect(year(before) - year(await value.inputValue())).toBe(3);
  // One more step on its own: that year's tone plays (the level is sampled once, just after the move; quick repeated
  // steps restart the tone, so the check takes a single one).
  await page.waitForTimeout(600);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => Number(await page.locator("#braille-explorer").getAttribute("data-level"))).toBeGreaterThan(0);
});

test("Then vs Now: R reviews the value with the change between the decades and its 95% interval; width 20 wraps", async ({ page }) => {
  await thenNow(page);
  await page.getByTestId("braille-shape").focus();
  await page.keyboard.press("r");
  await expect(page.getByTestId("braille-value")).toHaveValue(/95% CI .* to /u);
  await page.getByRole("group", { name: "Display width (cells)" }).getByRole("button", { name: "20", exact: true }).click();
  const lines = (await page.getByTestId("braille-shape").inputValue()).split("\n").slice(1);
  expect(lines.length).toBeGreaterThan(1);
  for (const l of lines) expect([...l].length).toBeLessThanOrEqual(20);
});

test("Then vs Now: water reads GRACE's months, Bangladesh-wide; rain reads its own years", async ({ page }) => {
  await thenNow(page, "Water underground");
  await expect(page.getByTestId("braille-value")).toHaveValue(/Bangladesh/u);
  await expect(page.getByTestId("braille-value")).toHaveValue(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b/u);
});

test("Then vs Now: axe finds no serious violation with the explorer open", async ({ page }) => {
  await thenNow(page);
  await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string }[] }> } }).axe;
    return axe.run({ include: [["#braille-explorer"]] }, { resultTypes: ["violations"] });
  });
  expect(result.violations.filter((v) => v.impact === "serious" || v.impact === "critical" || v.id === "aria-braille-equivalent")).toEqual([]);
});

test("Then vs Now, বাংলা mode: the lines are written for the Bengali table", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "বাংলা" }).click();
  await page.getByRole("banner").getByRole("link", { name: /আগে বনাম এখন|Then vs Now/u }).first().click();
  await page.waitForURL(/then-now/u);
  await page.waitForTimeout(1500);
  const open = page.getByRole("button", { name: /ব্রেইল|Braille/u }).last();
  await expect(open).toBeEnabled({ timeout: 60_000 });
  await open.click();
  const line = await page.getByTestId("braille-value").inputValue();
  expect(line).not.toMatch(/[A-Za-z:]/u);
  expect(line).not.toMatch(/[০-৯়]/u);
  expect(line).toMatch(/ঢাকা/u);
});
