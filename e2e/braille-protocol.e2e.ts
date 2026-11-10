// BRAILLE_TEST_PROTOCOL.md, browser side (checks a–g), in Chromium and Firefox. This is not a screen-reader
// viewer test: it checks what the page exposes (roles, names, braille labels, focus, live region) and what the
// explorer does with real key presses. It also saves each record's value and shape lines to
// data_raw/_tmp/braille-lines-<browser>.json, which pipeline/a11y/louis_check.py translates with NVDA's liblouis.
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { navTo, officialStrip, open } from "./lib/app";

const CONTINUES = "⣿";
const OFFICIAL = [
  { record: "aerosols_5669", title: "Aerosols by type (model, 19 Aug 2025)" },
  { record: "air_5533", title: "Air (model, Jul–Sep 2024)" },
  { record: "lightning_5011", title: "Lightning from the ISS (observation, 2017–23)" },
];

/** Past Start and the intro (lib/app.ts), on Listen's map with focus on it. */
async function start(page: Page) {
  await open(page);
  await page.locator("#sound-map").focus();
}

/** Role, accessible name and the braille attributes of one element, as the browser exposes them. */
async function exposed(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  const snapshot = await loc.ariaSnapshot();
  const attrs = await loc.evaluate((el) => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role"),
    label: el.getAttribute("aria-label"),
    roledescription: el.getAttribute("aria-roledescription"),
    braillelabel: el.getAttribute("aria-braillelabel"),
    brailleroledescription: el.getAttribute("aria-brailleroledescription"),
    readonly: el.getAttribute("aria-readonly") ?? (el as HTMLInputElement).readOnly ?? null,
  }));
  return { snapshot: snapshot.split("\n")[0], ...attrs };
}

const lines = async (page: Page) => ({
  value: await page.getByTestId("braille-value").inputValue(),
  shape: await page.getByTestId("braille-shape").inputValue(),
});

async function chooseVoiceAndMode(page: Page, voice: string, mode: string) {
  const voices = page.getByRole("group", { name: "Voice" });
  if (await voices.count()) await voices.getByRole("button", { name: voice, exact: true }).click();
  await page.getByRole("group", { name: "Shape shows" }).getByRole("button", { name: mode, exact: true }).click();
}

test("protocol a–g, browser side; lines saved for liblouis", async ({ page, browserName }) => {
  const out: Record<string, unknown> = { browser: browserName, date: new Date().toISOString() };
  await start(page);

  // a) the map, and (below) the shape and value lines and a record card, as exposed.
  out.map = await exposed(page, "#sound-map");

  // b) B → focus on the shape line.
  await page.keyboard.press("b");
  await expect(page.getByTestId("braille-shape")).toBeFocused();
  out.shapeLine = await exposed(page, "[data-testid=braille-shape]");
  out.valueLine = await exposed(page, "[data-testid=braille-value]");

  // c) Shift+Tab → the value line (a field: it stays).
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("braille-value")).toBeFocused();
  out.c = { valueLineFocused: true, value: await page.getByTestId("braille-value").inputValue() };

  // Live records: SST along the latitude, rain through time, SST in the 3x3 grid.
  const live: Record<string, unknown> = {};
  for (const [name, voice, mode] of [["SST along the latitude", "SST", "Along the latitude"], ["Rain through time", "Rain", "Through time"],
    ["SST 3 by 3", "SST", "3 by 3 around the needle"]] as const) {
    await chooseVoiceAndMode(page, voice, mode);
    await expect(page.getByTestId("braille-shape")).toHaveValue(/^(Scale|Relative)/u);
    live[name] = await lines(page);
  }
  out.live = live;

  // d) an arrow moves the needle: the value line changes.
  await chooseVoiceAndMode(page, "SST", "Along the latitude");
  await page.getByTestId("braille-shape").focus();
  const before = await page.getByTestId("braille-value").inputValue();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("braille-value")).not.toHaveValue(before);
  out.d = { before, after: await page.getByTestId("braille-value").inputValue() };

  // e) R reads in words and returns.
  await page.keyboard.press("r");
  const review = await page.getByTestId("braille-value").inputValue();
  expect(review).toMatch(/ at /u);
  await page.keyboard.press("r");
  await expect(page.getByTestId("braille-value")).toHaveValue(/^SST /u);
  out.e = { review };

  // f) width 20 and 40 wrap, each full line ending in the continuation cell.
  const f: Record<string, unknown> = {};
  for (const w of [20, 40]) {
    await page.getByRole("group", { name: "Display width (cells)" }).getByRole("button", { name: String(w), exact: true }).click();
    const shapeLines = (await page.getByTestId("braille-shape").inputValue()).split("\n").slice(1);
    for (const l of shapeLines) expect([...l].length).toBeLessThanOrEqual(w);
    for (const l of shapeLines.slice(0, -1)) expect(l.endsWith(CONTINUES)).toBe(true);
    expect(shapeLines.at(-1)?.endsWith(CONTINUES)).toBe(false);
    f[String(w)] = { lines: shapeLines.length, lengths: shapeLines.map((l) => [...l].length) };
  }
  out.f = f;

  // g) Space on the map: "Sound paused" through the live region (a flash message on a display).
  await page.keyboard.press("Escape");
  await page.locator("#sound-map").focus();
  await page.keyboard.press(" ");
  await expect(page.getByTestId("live-region")).toHaveText(/^Sound paused/u);
  out.g = { liveRegion: (await page.getByTestId("live-region").textContent())?.trim() };

  // Official records: a record card (check a), then its explorer's lines.
  await navTo(page, "Official records");
  const official: Record<string, unknown> = {};
  for (const [i, o] of OFFICIAL.entries()) {
    const card = officialStrip(page, o.title);
    await card.click();
    if (i === 0) out.recordCard = await exposed(page, `[aria-braillelabel][aria-pressed="true"]`);
    const open = page.getByRole("button", { name: "Braille explorer" }).last();
    await expect(open).toBeEnabled({ timeout: 60_000 });
    await open.click();
    await expect(page.getByTestId("braille-value")).toHaveValue(/\S/u);
    official[o.record] = await lines(page);
    await page.getByRole("button", { name: "Close braille explorer" }).click();
  }
  out.official = official;

  const dir = join(process.cwd(), "data_raw", "_tmp");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `braille-lines-${browserName}.json`), JSON.stringify(out, null, 1), "utf8");
});

test("বাংলা mode: the same records' lines saved for the Bengali-table liblouis check", async ({ page, browserName }) => {
  const out: Record<string, unknown> = { browser: browserName, lang: "bn", date: new Date().toISOString() };
  await start(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "বাংলা" }).click();
  await page.keyboard.press("Escape");
  await page.locator("#sound-map").focus();
  await page.keyboard.press("b");
  await expect(page.getByTestId("braille-shape")).toBeFocused();
  const live: Record<string, unknown> = {};
  for (const [name, voice, mode] of [["SST along the latitude", "SST", "Along the latitude"], ["Rain through time", "Rain", "Through time"],
    ["SST 3 by 3", "SST", "3 by 3 around the needle"]] as const) {
    await chooseVoiceAndMode(page, voice, mode);
    await expect(page.getByTestId("braille-shape")).toHaveValue(/^(স্কেল|আপেক্ষিক)/u);
    live[name] = await lines(page);
  }
  out.live = live;
  await page.keyboard.press("Escape");
  await navTo(page, "Official records");
  const official: Record<string, unknown> = {};
  for (const o of OFFICIAL) {
    await officialStrip(page, o.title).first().click();
    const open = page.getByRole("button", { name: /Braille explorer/u }).last();
    await expect(open).toBeEnabled({ timeout: 60_000 });
    await open.click();
    await expect(page.getByTestId("braille-value")).toHaveValue(/\S/u);
    official[o.record] = await lines(page);
    await page.getByRole("button", { name: /Close braille explorer/u }).click();
  }
  out.official = official;
  out.map = { snapshot: (await page.locator("body").ariaSnapshot()).split("\n")[0] };
  const dir = join(process.cwd(), "data_raw", "_tmp");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `braille-lines-${browserName}-bn.json`), JSON.stringify(out, null, 1), "utf8");
});
