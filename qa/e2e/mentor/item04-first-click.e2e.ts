// Every control works on the first click. The sweep clicks every control on
// every page once, lists each control it found with what it did, and fails on any control that did nothing unless it is
// an expected no-op (lib/first-click.ts). Runs in Chromium and Firefox (desktop). Also: the header link
// Tabbed to just after a page change takes the first Enter (the flaky Turntable link), an Esc that closes a Turntable
// dialog stays on the Turntable, and every "How we got this" button opens its panel on the first click.
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { navTo, start, tapAudio } from "../lib/app";
import { clickOnce, describeRow, drift, installSweep, listControls, type Row } from "../lib/first-click";
import { VALUE_VIEWS } from "../lib/values";
import { settle, shot } from "./lib";

interface SweepPage {
  url: string;
  /** A first visit every time (storage cleared on each load): Home before sound is chosen. */
  firstVisit?: boolean;
  /** The Turntable: its keyboard-reachable controls (the globe is a canvas). */
  tabbable?: boolean;
}
const SWEEP: SweepPage[] = [
  { url: "/", firstVisit: true },
  { url: "/" },
  { url: "/listen" },
  { url: "/then-now" },
  { url: "/then-now?part=monsoon" },
  { url: "/then-now?part=water" },
  { url: "/then-now?view=monthly" },
  { url: "/how" },
  { url: "/official" },
  { url: "/turntable", tabbable: true },
  { url: "/team" },
];
const OUT = join(process.cwd(), "data_raw", "_tmp", "first-click");
/** Requests cut short by something other than the app: a click that navigates away aborts the page's pending loads
 *  (Chromium net::ERR_ABORTED; Firefox NS_BINDING_ABORTED, status 2152398850), and Windows aborts requests, even to
 *  localhost, when the machine's network changes (Wi-Fi, VPN). */
const NOT_ERRORS = ["net::ERR_ABORTED", "status=2152398850", "net::ERR_NETWORK_CHANGED"];
// Each test opens its own app: they can run side by side (--workers).
test.describe.configure({ mode: "parallel" });
const turntableApp = (page: Page) => page.getByRole("application", { name: /Turntable Earth/u });
/** The open overlays (a list kept in the page while closed, like the search's, doesn't count). */
const overlays = (page: Page) => page.locator('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]').filter({ visible: true });

/** The Turntable is ready once its opening is over ("Press any key to skip") and the needle reads a value. */
async function turntableReady(page: Page) {
  await expect(turntableApp(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Details of the value under the needle" })).toContainText(/\S/u, { timeout: 30_000 });
}

/** Loads the page fresh, past the gate if a control brought it back, with sound on (Tap to start sound, item 2). */
async function ready(page: Page, p: SweepPage) {
  await page.goto(p.url);
  await settle(page, 400); // hydrated: the gate and the prompt below show only once the saved choice is read
  if (p.firstVisit) return;
  const startBtn = page.getByRole("button", { name: "Start listening" });
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    const skip = page.getByRole("button", { name: "Skip intro" });
    if (await skip.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await skip.click();
    await page.goto(p.url);
    await settle(page, 400);
  }
  if (p.tabbable) await turntableReady(page);
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 1500 }).then(() => true, () => false)) {
    await tap.click();
    await expect(tap).toBeHidden();
  }
  await settle(page, 800);
}

function save(info: TestInfo, name: string, data: object) {
  const dir = join(OUT, info.project.name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 1), "utf8");
}

for (const p of SWEEP) {
  test(`first click: every control on ${p.url}${p.firstVisit ? " (first visit)" : ""}`, async ({ page }, info) => {
    test.setTimeout(1_500_000);
    const tabbable = Boolean(p.tabbable);
    // A click that throws or crashes the page is no response either: every page error and console error is kept.
    const errors: string[] = [];
    let last = "(loading)";
    page.on("pageerror", (e) => errors.push(`after ${last}: ${e.message.slice(0, 300)}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !NOT_ERRORS.some((n) => m.text().includes(n))) errors.push(`after ${last}: console: ${m.text().slice(0, 300)}`);
    });
    if (p.firstVisit) {
      await tapAudio(page);
      await page.addInitScript(() => localStorage.clear());
    } else await start(page);
    await installSweep(page);
    await ready(page, p);
    if (p.firstVisit) await shot(page, "item04", "home-first-visit");
    const home = page.url();
    const controls = await listControls(page, tabbable);
    const keys = controls.map((c) => c.key).join("\n");
    const still = await drift(page);
    const rows: Row[] = [];
    for (const c of controls) {
      last = `${c.i} "${c.name}"`;
      rows.push(await clickOnce(page, c, still, { tabbable }));
      // Back to the page as listed: close what opened (an Esc inside an overlay stays on the page, item 4), English
      // again if the language button was the control, and a fresh load if the click moved or changed the page.
      for (let k = 0; k < 3 && (await overlays(page).count()); k++) await page.keyboard.press("Escape");
      if (!tabbable) await page.keyboard.press("Escape"); // stops any sound (Esc on the Turntable leaves it, by design)
      const en = page.getByRole("banner").getByRole("button", { name: "EN", exact: true });
      if (await en.isVisible().catch(() => false)) await en.click();
      const moved = page.url() !== home || (await listControls(page, tabbable).catch(() => [])).map((x) => x.key).join("\n") !== keys;
      if (moved) await ready(page, p);
    }
    const counts = Object.fromEntries(["responded", "expected no-op", "disabled", "not clicked (leaves the app)", "no response"].map((o) => [o, rows.filter((r) => r.outcome === o).length]));
    const report = { url: p.url, firstVisit: Boolean(p.firstVisit), errors, project: info.project.name, found: controls.length, counts, drifting: [...still], rows };
    save(info, `${p.url.replace(/[^a-z0-9]+/giu, "_")}${p.firstVisit ? "first_visit" : ""}`, report);
    await info.attach("controls.json", { body: JSON.stringify(report, null, 1), contentType: "application/json" });
    console.log(`${info.project.name} ${p.url}: ${controls.length} controls ${JSON.stringify(counts)}${still.size ? ` (changes by itself: ${[...still].join(", ")})` : ""}\n${rows.map(describeRow).join("\n")}`);
    expect(controls.length, "controls found").toBeGreaterThan(0);
    expect(rows.filter((r) => r.outcome === "no response").map(describeRow)).toEqual([]);
    expect(errors, "page errors").toEqual([]);
  });
}

test("a header link Tabbed to right after a page change takes the first Enter (the flaky Turntable link)", async ({ page }) => {
  test.setTimeout(240_000);
  await start(page); // Start moves Home → Listen; the new page's heading wants focus for up to a second after
  for (const [from, to, path] of [["Listen", "Turntable", /\/turntable$/u], ["Then vs Now", "How we know", /\/how$/u], ["Official records", "Team", /\/team$/u]] as const) {
    if (from !== "Listen") await navTo(page, from);
    const link = page.getByRole("banner").getByRole("link", { name: new RegExp(`${to}$`, "u") }).first();
    await link.focus();
    await page.keyboard.press("Enter");
    if (to === "Turntable") {
      await page.waitForTimeout(1500);
      await shot(page, "item04", "header-enter-turntable");
    }
    await expect(page).toHaveURL(path);
    // The link that moved the page still hands focus to the new page's heading.
    await expect(page.locator("[data-page-title]").first()).toBeFocused();
  }
});

test("Esc that closes a Turntable dialog stays on the Turntable; Esc on the Turntable itself leaves", async ({ page }) => {
  test.setTimeout(180_000);
  await start(page);
  await navTo(page, "Turntable");
  await turntableReady(page);
  // The Turntable's own buttons (the header has a Settings button too).
  const tt = page.locator("section").filter({ has: turntableApp(page) }).last();
  for (const name of ["Credits", "Records", "Settings"]) {
    await tt.getByRole("button", { name, exact: true }).click();
    await expect(overlays(page).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overlays(page)).toHaveCount(0);
    if (name === "Credits") {
      await page.waitForTimeout(1500);
      await shot(page, "item04", "turntable-esc-credits");
    }
    await expect(page).toHaveURL(/\/turntable$/u);
    await expect(turntableApp(page)).toBeVisible();
  }
  await turntableApp(page).focus();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/listen/u);
});

test("the Turntable's needle card opens on the first click and holds still, so its buttons work on the first click", async ({ page }) => {
  test.setTimeout(180_000);
  await start(page);
  await navTo(page, "Turntable");
  await turntableReady(page);
  // Hover opens the card as the pointer arrives; the click must leave it open (it toggled it shut before the fix).
  const chip = page.getByRole("button", { name: "Details of the value under the needle" });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await page.waitForTimeout(600);
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  // The needle drifts across the screen and its place line changes as the globe turns; the open card follows neither
  // (it moved ~20 px/s, and its Pin and Close buttons shifted with its width, before the fix).
  // Sampled from here: timers inside the page crawl while the globe renders (an in-page loop took a minute).
  const box = page.locator("[data-provenance-group][data-side]");
  const positions = new Set<string>();
  for (let i = 0; i < 8; i++) {
    positions.add(await box.evaluate((el) => {
      const r = el.querySelector('button[aria-label="Close details"]')!.getBoundingClientRect();
      return `${(el as HTMLElement).style.transform} ${Math.round(r.x)},${Math.round(r.y)}`;
    }));
    await page.waitForTimeout(200);
  }
  expect([...positions]).toHaveLength(1);
  await page.getByRole("button", { name: "Keep details open" }).click({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "Let details close" })).toBeVisible();
  const how = page.locator("[data-provenance-group][data-side] [data-how-we-got-this]");
  await how.click({ timeout: 5000 });
  await expect(page.getByTestId("how-we-got-this")).toBeVisible();
});

test("every How we got this button opens its panel on the first click", async ({ page }, info) => {
  test.setTimeout(1_200_000);
  const panel = page.getByTestId("how-we-got-this");
  await start(page);
  const seen: string[] = [];
  for (const v of VALUE_VIEWS) {
    await page.goto(v.url);
    if (v.url === "/turntable") {
      // Its button is in the needle's details card: open it as a listener does, and pin it (it closes itself).
      await turntableReady(page);
      await page.getByRole("button", { name: "Details of the value under the needle" }).click();
      await page.getByRole("button", { name: "Keep details open" }).click();
    }
    await settle(page, 400);
    if (v.then) await v.then(page);
    // A view that opens a sheet: its buttons (the page's behind a modal sheet can't be reached by anyone).
    const sheet = (await page.getByRole("dialog").count()) > 0;
    const scope = () => (sheet ? page.getByRole("dialog").last() : page.locator("body"));
    const all = () => scope().locator("[data-how-we-got-this]:visible");
    // Inside an inert (closed) container a button can't be reached: not a first click to test.
    const reachable = await all().evaluateAll((els) => els.flatMap((e, i) => (e.closest("[inert]") ? [] : [i])));
    for (const i of reachable) {
      if (sheet && v.then && !(await page.getByRole("dialog").count())) await v.then(page);
      const b = all().nth(i);
      const name = (await b.getAttribute("aria-label")) ?? "";
      await b.click({ timeout: 5000 });
      await expect(panel, `${v.name}: ${name}`).toBeVisible({ timeout: 3000 });
      await expect(panel.getByRole("heading", { level: 2 })).toHaveText(name);
      seen.push(`${v.name}: ${name}`);
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
  }
  save(info, "how-we-got-this", { buttons: seen.length, seen });
  console.log(`${info.project.name}: ${seen.length} How we got this buttons opened on the first click`);
  expect(seen.length).toBeGreaterThan(VALUE_VIEWS.length);
});
