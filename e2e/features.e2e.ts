// Feature inventory, checked in the running app (docs/FEATURES_WORKING.md is built from these results by
// `python -m health.features` in pipeline/). One test per feature, in Chromium and Firefox; run once as is and once with
// every WebGL canvas hidden (FEATURES_HIDE_3D=1) for the "works with the 3D hidden" column. Each check drives the control
// the way a user would (by keyboard where the feature has a key) and asserts what the user would get: a sound above the
// noise floor, a value or place in the accessible name, a pressed or selected state, a dialog. A check that throws is
// BROKEN with its error; one that returns a limit is PARTIAL.
// Results: data_raw/_tmp/features/<browser>-<3d|no3d>/<feature id>.json
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AUDIBLE, heard, level, start } from "./lib/app";

type Group = "data" | "sound" | "visuals" | "jukebox" | "a11y" | "truth" | "forms";
interface Outcome { evidence: string; limit?: string }
interface Feature {
  id: string; group: Group; name: string; where: string; what: string;
  /** Driven by the keyboard in this check. */
  keyboard: boolean;
  /** The control whose accessible name a screen reader announces. */
  control?: (page: Page) => Locator;
  run(page: Page): Promise<Outcome>;
}

const HIDE_3D = process.env.FEATURES_HIDE_3D === "1";
const OUT = join(process.cwd(), "data_raw", "_tmp", "features");

const map = (page: Page) => page.getByRole("application").first();
const name = async (l: Locator) => (await l.evaluate((e) => e.getAttribute("aria-label") ?? e.textContent ?? "")).trim();
const live = async (page: Page) => (await page.locator('[role="status"], [role="alert"], [aria-live="polite"], [aria-live="assertive"]').allTextContents()).join(" ");
const tab = (page: Page, n: string) => page.getByRole("tab", { name: n, exact: true });
const pressed = (l: Locator) => expect(l).toHaveAttribute("aria-pressed", "true");
const onMap = async (page: Page) => { await map(page).focus(); };

/** The accessible name a screen reader announces for the feature's control. A modal drawer the check opened hides the
 *  rest of the page from the accessibility tree, so the control can't be found until it is closed (Esc closes the top
 *  dialog); a short timeout either way, so a missing name is reported as missing rather than hanging the test. */
async function controlName(page: Page, control: (page: Page) => Locator): Promise<string | null> {
  const read = () => control(page).first().evaluate((e) => (e.getAttribute("aria-label") ?? e.textContent ?? "").trim(), undefined, { timeout: 3000 });
  const got = await read().catch(() => "");
  if (got) return got;
  if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
  return (await read().catch(() => "")) || null;
}

async function sounds(page: Page, what: string): Promise<Outcome> {
  const l = await heard(page);
  if (l <= AUDIBLE) throw new Error(`${what}: silent (max level ${l.toExponential(1)})`);
  return { evidence: `${what}: output level ${l.toExponential(1)}` };
}

async function stops(page: Page, what: string): Promise<Outcome> {
  await page.waitForTimeout(800);
  const l = await level(page);
  if (l > AUDIBLE) throw new Error(`${what}: still sounding (level ${l.toExponential(1)})`);
  return { evidence: `${what}: output level ${l.toExponential(1)} after the key` };
}

async function turntable(page: Page) {
  await tab(page, "Turntable").click();
  const app = page.getByRole("application", { name: /Turntable Earth/u });
  await expect(app).toBeVisible({ timeout: 30_000 });
  // The turntable's opening (black until the Earth is ready, then a ~4 s glide) is skipped by any key, which would
  // swallow the first key a check presses: wait for it to finish (its overlay says "Press any key to skip").
  await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
  const details = page.getByRole("button", { name: "Details of the value under the needle" });
  await expect(details).toContainText(/\S/u, { timeout: 30_000 });
  return { app, details };
}

async function openScene(page: Page, sleeve: string): Promise<Outcome> {
  await turntable(page);
  await page.getByRole("button", { name: "Records", exact: true }).click();
  const open = page.getByRole("button", { name: `Open the ${sleeve} scene` });
  await open.click();
  await expect(open).toBeHidden({ timeout: 30_000 });
  // Most scenes play on opening (after their data loads); Ghost Earths waits for Enter ("play both windows"). Space
  // would pause a scene that had just started, so it is not used here.
  let l = await heard(page, 8000);
  if (l <= AUDIBLE) { await page.keyboard.press("Enter"); l = await heard(page, 8000); }
  // Esc closes the innermost thing first (a panel, then the scene), so it may take more than one press.
  const back = page.getByRole("application", { name: /Turntable Earth/u });
  for (let i = 0; i < 3 && !(await back.isVisible()); i++) {
    await page.keyboard.press("Escape");
    await back.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
  }
  await expect(back).toBeVisible({ timeout: 15_000 });
  return { evidence: `opened from the records drawer, Esc back to the turntable; level ${l.toExponential(1)}`,
    ...(l > AUDIBLE ? {} : { limit: "opened and closed, but no sound on opening or after Enter" }) };
}

const FEATURES: Feature[] = [
  // ---- data and records ----
  { id: "live-ocean", group: "data", name: "Live ocean temperature (SVS 5101)", where: "Explore · sound map · key 1", keyboard: true,
    what: "Plays and reads the latest SST frame under the cursor", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("1");
      const a = await name(map(page));
      for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowRight");
      await expect.poll(() => name(map(page))).not.toBe(a);
      const b = await name(map(page));
      if (!/°C/u.test(b)) throw new Error(`no temperature in "${b}"`);
      return { evidence: `"${a}" → "${b}"` };
    } },
  { id: "live-rain", group: "data", name: "Live rain (SVS 4285) and its 48-frame sequence", where: "Explore · sound map · key 2", keyboard: true,
    what: "Plays and reads the latest IMERG rain frame under the cursor", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("2");
      await expect.poll(() => name(map(page))).toMatch(/Rain|Dry|mm\/h/u);
      return { evidence: `map reads "${await name(map(page))}"` };
    } },
  { id: "official-shelf", group: "data", name: "Official records shelf (NASA Challenge resources as data)", where: "Official tab · Records group", keyboard: false,
    what: "Lists every official record, each one SVS visualization read back into values",
    control: (page) => page.getByRole("group", { name: "Records" }),
    async run(page) {
      await tab(page, "Official").click();
      const records = page.getByRole("group", { name: "Records" }).getByRole("button");
      await expect(records.first()).toBeVisible({ timeout: 30_000 });     // the record list loads after the tab opens
      const n = await records.count();
      if (n < 15) throw new Error(`${n} records listed`);
      return { evidence: `${n} records listed` };
    } },
  { id: "official-play", group: "data", name: "Play an official record", where: "Official tab · a record · Play", keyboard: false,
    what: "Plays the record's one voice and reads the value under the needle",
    control: (page) => page.locator('section[aria-labelledby="official-heading"]').getByRole("button", { name: "Play", exact: true }),
    async run(page) {
      await tab(page, "Official").click();
      await page.getByRole("button", { name: "Near-surface temperature (EIC, model)", exact: true }).click();
      const section = page.locator('section[aria-labelledby="official-heading"]');
      await section.getByRole("button", { name: "Play", exact: true }).click();
      const s = await sounds(page, "EIC near-surface temperature");
      const reading = await section.locator('p[aria-live="off"]').first().innerText();
      if (!/°C/u.test(reading)) throw new Error(`no temperature in "${reading}"`);
      return { evidence: `${s.evidence}; reads "${reading.slice(0, 80)}"` };
    } },
  { id: "freshness-badges", group: "data", name: "Freshness and source badges", where: "Explore · under each voice", keyboard: false,
    what: "Says how old each frame is, and when it is older than its freshness limit",
    async run(page) {
      const t = await page.locator("main").innerText();
      const m = t.match(/Latest available: [^\n]+|Recorded \([^)]+\)[^\n]*/gu) ?? [];
      if (!m.length) throw new Error("no freshness wording");
      return { evidence: m.slice(0, 3).join(" | ") };
    } },
  { id: "then-now", group: "data", name: "Then vs Now (Dhaka: heat, monsoon rain, water underground)", where: "Then vs Now tab · Play this part", keyboard: true,
    what: "Plays 1981–1990 against 2016–2025 for one part, with a chart and its caption",
    control: (page) => page.getByRole("button", { name: "Play this part" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("t");
      await expect(page.getByRole("heading", { name: /then vs now/iu })).toBeVisible();
      await page.getByRole("button", { name: "Play this part" }).click();
      return sounds(page, "Heat part");
    } },
  { id: "history-panel", group: "data", name: "History panel", where: "About this sound · History", keyboard: false,
    what: "Long-term record behind the sound (GRACE, GISTEMP, GPCP)",
    control: (page) => tab(page, "History"),
    async run(page) {
      await tab(page, "History").click();
      const p = page.getByRole("tabpanel", { name: "History" });
      await expect(p).toBeVisible();
      return { evidence: (await p.innerText()).replace(/\s+/gu, " ").slice(0, 120) };
    } },
  // ---- sound and mapping ----
  { id: "sweep", group: "sound", name: "Sweep from Chattogram", where: "Explore · key S or Play sweep", keyboard: true,
    what: "Plays the values outward from Chattogram", control: (page) => page.getByRole("button", { name: "Play sweep" }),
    async run(page) { await onMap(page); await page.keyboard.press("s"); return sounds(page, "sweep"); } },
  { id: "timelapse", group: "sound", name: "Storm time-lapse", where: "Bottom bar · Play storm time-lapse", keyboard: false,
    what: "Plays the 48 half-hour rain frames in order", control: (page) => page.getByRole("button", { name: "Play storm time-lapse" }),
    async run(page) { await page.getByRole("button", { name: "Play storm time-lapse" }).click(); return sounds(page, "time-lapse"); } },
  { id: "voices", group: "sound", name: "Choose the voice: ocean, rain or both", where: "Top bar · What you hear · keys 1 2 3", keyboard: true,
    what: "Switches which data voice plays", control: (page) => page.getByRole("group", { name: "What you hear" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("1");
      await pressed(page.getByRole("group", { name: "What you hear" }).getByRole("button", { name: "Ocean" }));
      await page.keyboard.press("3");
      await pressed(page.getByRole("group", { name: "What you hear" }).getByRole("button", { name: "Both" }));
      return { evidence: "1 → Ocean pressed; 3 → Both pressed" };
    } },
  { id: "mixer", group: "sound", name: "Mixer (volume, mute, solo per voice)", where: "Bottom bar · Mixer", keyboard: false,
    what: "Sets each voice's volume, mutes or solos it", control: (page) => page.getByRole("slider", { name: "Ocean volume" }),
    async run(page) {
      const mute = page.getByRole("button", { name: "Mute Ocean" });
      if (!(await mute.isVisible())) return { evidence: "mixer is in the bottom sheet at this width", limit: "not visible at this window width" };
      await mute.click(); await pressed(mute);
      return { evidence: "Mute Ocean → pressed" };
    } },
  { id: "legend", group: "sound", name: "Hear the legend (reference sounds)", where: "Explore · key L", keyboard: true,
    what: "Plays reference tones for known values",
    async run(page) { await onMap(page); await page.keyboard.press("l"); return sounds(page, "legend"); } },
  { id: "unison", group: "sound", name: "Proof in unison", where: "Truth panel · Hear the nearest checked point · key U", keyboard: true,
    what: "Plays the frame's tone and NASA's file tone together: beats mean they disagree",
    control: (page) => page.getByRole("button", { name: /Hear the nearest checked point/u }),
    async run(page) { await onMap(page); await page.keyboard.press("u"); return sounds(page, "unison"); } },
  { id: "motif", group: "sound", name: "Jukebox motif", where: "Top bar · Play the Jukebox motif", keyboard: false,
    what: "Plays the app's short signature", control: (page) => page.getByRole("button", { name: "Play the Jukebox motif" }),
    async run(page) { await page.getByRole("button", { name: "Play the Jukebox motif" }).click(); return sounds(page, "motif"); } },
  { id: "pause", group: "sound", name: "Pause and resume", where: "Explore · Space · Pause sound", keyboard: true,
    what: "Pauses the live sound", control: (page) => page.getByRole("contentinfo").getByRole("button", { name: /sound/u }).first(),
    async run(page) {
      await sounds(page, "live sound before pausing");
      await onMap(page); await page.keyboard.press("Space");
      return stops(page, "Space");
    } },
  { id: "mute", group: "sound", name: "Mute everything", where: "Explore · key M", keyboard: true, what: "Mutes or unmutes all sound",
    async run(page) { await sounds(page, "before muting"); await onMap(page); await page.keyboard.press("m"); return stops(page, "M"); } },
  { id: "esc", group: "sound", name: "Esc stops all sound", where: "Anywhere · Esc", keyboard: true, what: "Stops all sound and closes panels",
    async run(page) { await sounds(page, "before Esc"); await onMap(page); await page.keyboard.press("Escape"); return stops(page, "Esc"); } },
  { id: "mapping-panel", group: "sound", name: "Mapping panel", where: "About this sound · Mapping", keyboard: false,
    what: "States each data-to-sound rule (range, scale, what higher means)", control: (page) => tab(page, "Mapping"),
    async run(page) {
      await tab(page, "Mapping").click();
      const t = await page.getByRole("tabpanel", { name: "Mapping" }).innerText();
      if (!/Hz|semitone|pitch/iu.test(t)) throw new Error("no rule wording");
      return { evidence: t.replace(/\s+/gu, " ").slice(0, 120) };
    } },
  // ---- 3D and visuals ----
  { id: "turntable", group: "visuals", name: "Turntable Earth (3D globe, needle reads the point beneath it)", where: "Turntable tab", keyboard: false,
    what: "A globe on a turntable; the needle's value, place and frame time in its details",
    control: (page) => page.getByRole("application", { name: /Turntable Earth/u }),
    async run(page) {
      const { details } = await turntable(page);
      const d = await details.innerText();
      // A value, or the honest "No … data here" where the needle rests on land or a gap.
      if (!/°C|mm\/h|Dry|No .* data here/u.test(d)) throw new Error(`details read "${d}"`);
      return { evidence: `details: ${d.replace(/\s+/gu, " ").slice(0, 100)}` };
    } },
  { id: "turntable-keys", group: "visuals", name: "Move the needle by keyboard", where: "Turntable · Up / Down / Left / Right", keyboard: true,
    what: "Moves the needle 1° (Shift: 10°) and reads the new point",
    async run(page) {
      const { app, details } = await turntable(page);
      const a = await details.innerText();
      await app.focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press("Shift+ArrowUp");
      await expect.poll(() => details.innerText(), { timeout: 15_000 }).not.toBe(a);
      return { evidence: `Shift+Up ×3: "${a.split("\n")[0]}" → "${(await details.innerText()).split("\n")[0]}"` };
    } },
  { id: "turntable-search", group: "visuals", name: "Search places", where: "Turntable · Search places (/ or G)", keyboard: true,
    what: "Flies the needle to a named place",
    control: (page) => page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: "Search places" }),
    async run(page) {
      const { details } = await turntable(page);
      await page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: "Search places" }).click();
      const box = page.getByRole("combobox", { name: "Search places" });      // hidden until search is opened
      await box.fill("Dhaka"); await page.waitForTimeout(500); await page.keyboard.press("Enter");
      await expect(details).toContainText(/Dhaka/u, { timeout: 30_000 });
      return { evidence: `details: ${(await details.innerText()).replace(/\s+/gu, " ").slice(0, 100)}` };
    } },
  { id: "turntable-tour", group: "visuals", name: "Tour", where: "Turntable · T or Tour", keyboard: true,
    what: "Visits bookmarked places in turn", control: (page) => page.getByRole("button", { name: "Tour", exact: true }),
    async run(page) {
      const { app, details } = await turntable(page);
      const a = await details.innerText();
      await app.focus(); await page.keyboard.press("t");
      await expect.poll(() => details.innerText(), { timeout: 30_000 }).not.toBe(a);
      await page.keyboard.press("Escape");
      return { evidence: `T: "${a.split("\n")[0]}" → "${(await details.innerText()).split("\n")[0]}"` };
    } },
  { id: "turntable-view", group: "visuals", name: "Close-up view", where: "Turntable · V or Close-up view", keyboard: true,
    what: "Switches between the jukebox view and a close-up of the globe",
    control: (page) => page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: /Close-up view|Jukebox view/u }),
    async run(page) {
      const { app } = await turntable(page);
      const view = page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: /Close-up view|Jukebox view/u });
      const before = `${await name(view)} pressed=${await view.getAttribute("aria-pressed")}`;
      const now = async () => `${await name(view)} pressed=${await view.getAttribute("aria-pressed")}`;
      await app.focus(); await page.keyboard.press("v");
      await expect.poll(now, { timeout: 20_000 }).not.toBe(before);
      return { evidence: `V: "${before}" → "${await name(view)} pressed=${await view.getAttribute("aria-pressed")}"` };
    } },
  ...([["scene-ghost", "Ghost Earths"], ["scene-delta", "Delta + aquifer"], ["scene-terrain", "Sound terrain"], ["scene-tunnel", "Dhaka time tunnel"]] as const)
    .map(([id, sleeve]): Feature => ({ id, group: "visuals", name: `Scene: ${sleeve}`, where: "Turntable · Records · scene sleeve", keyboard: false,
      what: `Opens the ${sleeve} 3D scene; Esc returns to the turntable`,
      control: (page) => page.getByRole("button", { name: `Open the ${sleeve} scene` }),
      run: (page) => openScene(page, sleeve) })),
  // ---- jukebox / turntable UI ----
  { id: "mode-tabs", group: "jukebox", name: "Mode tabs", where: "Top bar · Mode (Explore, Story, Then vs Now, Turntable, Official)", keyboard: true,
    what: "Switches the app's mode; arrows move between tabs", control: (page) => page.getByRole("tablist", { name: "Mode" }),
    async run(page) {
      await tab(page, "Explore").focus(); await page.keyboard.press("ArrowRight");
      await expect(tab(page, "Story")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(tab(page, "Story")).toHaveAttribute("aria-selected", "true");
      return { evidence: "Explore → ArrowRight → Story focused → Enter selects it" };
    } },
  { id: "story", group: "jukebox", name: "Story (guided six-part tour)", where: "Story tab", keyboard: false,
    what: "Plays ocean hum, sweep, time-lapse, satellite whisper and how we know, in order",
    control: (page) => page.getByRole("region", { name: "Story" }),
    async run(page) {
      await tab(page, "Story").click();
      const items = await page.getByRole("region", { name: "Story" }).getByRole("listitem").count();
      const s = await sounds(page, "story");
      return { evidence: `${items} parts listed; ${s.evidence}` };
    } },
  { id: "records-drawer", group: "jukebox", name: "Records drawer (sleeves)", where: "Turntable · Records", keyboard: false,
    what: "Lists the records and scenes to put on the turntable", control: (page) => page.getByRole("button", { name: "Records", exact: true }),
    async run(page) {
      await turntable(page);
      await page.getByRole("button", { name: "Records", exact: true }).click();
      const n = await page.getByRole("button", { name: /^Play the .* record$/u }).count();
      if (n < 2) throw new Error(`${n} record sleeves`);
      return { evidence: `${n} record sleeves` };
    } },
  { id: "settings", group: "jukebox", name: "Turntable settings", where: "Turntable · Settings", keyboard: false,
    what: "Turntable quality, motion and display settings", control: (page) => page.getByRole("button", { name: "Settings", exact: true }),
    async run(page) {
      await turntable(page);
      const b = page.getByRole("button", { name: "Settings", exact: true });
      await b.click();
      const drawer = page.getByRole("dialog");                               // a side sheet
      await expect(drawer).toBeVisible();
      return { evidence: `Settings opens the "${(await drawer.innerText()).split("\n")[0]}" drawer` };
    } },
  { id: "credits", group: "jukebox", name: "Credits", where: "Turntable · Credits; Explore footer", keyboard: false,
    what: "Names every NASA visualization and dataset used", control: (page) => page.getByRole("button", { name: "Credits", exact: true }),
    async run(page) {
      await turntable(page);
      await page.getByRole("button", { name: "Credits", exact: true }).click();
      await expect(page.getByText(/SVS/u).first()).toBeVisible();
      return { evidence: "Credits opens with the SVS credits" };
    } },
  // ---- accessibility ----
  { id: "help", group: "a11y", name: "Keys and help", where: "Anywhere · H or Help", keyboard: true,
    what: "Lists every key", control: (page) => page.getByRole("banner").getByRole("button", { name: "Help" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("h");
      await expect(page.getByRole("dialog", { name: "Keys and help" })).toBeVisible();
      return { evidence: "H → the Keys and help dialog" };
    } },
  { id: "enter-speaks", group: "a11y", name: "Speak the value (live region)", where: "Explore · Enter", keyboard: true,
    what: "Announces the value and place through the page's live region", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("Enter");
      await expect.poll(() => live(page)).toMatch(/°C|mm\/h|Dry/u);
      return { evidence: `live region: "${(await live(page)).replace(/\s+/gu, " ").slice(0, 100)}"` };
    } },
  { id: "describe", group: "a11y", name: "Describe mode", where: "Top bar · Describe · key D", keyboard: true,
    what: "Turns spoken descriptions on or off", control: (page) => page.getByRole("button", { name: "Describe" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("d");
      await pressed(page.getByRole("button", { name: "Describe" }));
      return { evidence: "D → Describe pressed" };
    } },
  { id: "captions", group: "a11y", name: "Captions", where: "Explore · key C", keyboard: true, what: "Shows sound captions as text",
    async run(page) {
      const a = await live(page);
      await onMap(page); await page.keyboard.press("c");
      await expect.poll(() => live(page)).not.toBe(a);
      return { evidence: `live region after C: "${(await live(page)).replace(/\s+/gu, " ").slice(0, 100)}"` };
    } },
  { id: "braille", group: "a11y", name: "Braille data explorer", where: "Explore · key B or Braille explorer", keyboard: true,
    what: "Feel the data as braille cells; the caret is the needle", control: (page) => page.getByRole("button", { name: "Braille explorer" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("b");
      await expect(page.getByTestId("braille-value")).toHaveValue(/\S/u);
      const shape = page.getByTestId("braille-shape");
      await shape.focus(); const v0 = await page.getByTestId("braille-value").inputValue();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => page.getByTestId("braille-value").inputValue()).not.toBe(v0);
      return { evidence: `value line "${v0}" → "${await page.getByTestId("braille-value").inputValue()}" after one arrow` };
    } },
  { id: "bangla", group: "a11y", name: "Bangla interface", where: "Top bar · Language · বাংলা", keyboard: false,
    what: "Switches to Bangla where it is translated (the braille lines today)", control: (page) => page.getByRole("group", { name: "Language" }),
    async run(page) {
      await page.getByRole("button", { name: "বাংলা" }).click();
      await onMap(page); await page.keyboard.press("b");
      const v = page.getByTestId("braille-value");
      await expect(v).toHaveValue(/[ঀ-৿]/u);
      return { evidence: `braille value line in বাংলা mode: "${(await v.inputValue()).slice(0, 60)}"`,
        limit: "interface text stays English until a person translates it (src/lib/i18n/bn.ts is empty on purpose)" };
    } },
  // ---- truth and provenance ----
  { id: "truth-panel", group: "truth", name: "Truth panel", where: "About this sound · Truth", keyboard: false,
    what: "How each live value was checked against NASA's source data, with the error", control: (page) => tab(page, "Truth"),
    async run(page) {
      const t = await page.getByRole("tabpanel", { name: "Truth" }).innerText();
      const m = t.match(/Checked against NASA MUR SST[^\n]*/u);
      if (!m) throw new Error("no MUR check sentence");
      return { evidence: m[0] };
    } },
  { id: "provenance-key", group: "truth", name: "Where this value comes from", where: "Explore · key P · About this sound · Provenance", keyboard: true,
    what: "Opens the provenance of the value under the cursor", control: (page) => tab(page, "Provenance"),
    async run(page) {
      await onMap(page); await page.keyboard.press("p");
      await expect(tab(page, "Provenance")).toHaveAttribute("aria-selected", "true");
      const t = await page.getByRole("tabpanel", { name: "Provenance" }).innerText();
      return { evidence: `P → Provenance: ${t.replace(/\s+/gu, " ").slice(0, 100)}` };
    } },
  { id: "record-provenance", group: "truth", name: "Record provenance card", where: "Official tab · Where this comes from", keyboard: false,
    what: "SVS links, period, frame times, map position check, credits, licence and every check",
    control: (page) => page.getByRole("region", { name: "Where this comes from" }),
    async run(page) {
      await tab(page, "Official").click();
      const r = page.getByRole("region", { name: "Where this comes from" });
      const t = await r.innerText();
      for (const w of ["Credits", "Licence", "Checks", "SVS"]) if (!t.includes(w)) throw new Error(`no ${w}`);
      return { evidence: "credits, licence, checks and SVS links shown" };
    } },
  // ---- deliverable forms ----
  { id: "open-data", group: "forms", name: "Open data files", where: "/data/… (static JSON and grids)", keyboard: false,
    what: "Every record's manifest, validation and freshness as plain files",
    async run(page) {
      const urls = ["/data/meta/freshness.json", "/data/official/index.json", "/data/related/index.json", "/data/meta/health.json"];
      const codes = await Promise.all(urls.map(async (u) => (await page.request.get(u)).status()));
      const bad = urls.filter((_, i) => codes[i] !== 200);
      if (bad.length) throw new Error(`not served: ${bad.join(", ")}`);
      return { evidence: `${urls.join(", ")}: 200`, limit: "static files, no query API" };
    } },
];

for (const f of FEATURES) {
  test(`feature ${f.id}`, async ({ page, browserName }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const dir = join(OUT, `${browserName}-${HIDE_3D ? "no3d" : "3d"}`);
    mkdirSync(dir, { recursive: true });
    const base = { id: f.id, group: f.group, name: f.name, where: f.where, what: f.what, keyboard: f.keyboard, has_control: Boolean(f.control), browser: browserName,
      hide3d: HIDE_3D, checked_utc: new Date().toISOString(), test: `e2e/features.e2e.ts › feature ${f.id}` };
    let status = "WORKING", evidence = "", limit: string | undefined, srName: string | null = null;
    try {
      await start(page, { hide3d: HIDE_3D });
      const o = await f.run(page);
      evidence = o.evidence; limit = o.limit;
      if (limit) status = "PARTIAL";
      if (f.control) srName = await controlName(page, f.control);
    } catch (e) {
      status = "BROKEN"; evidence = (e as Error).message.split("\n")[0].replace(/\u001b\[[0-9;]*m/gu, "").slice(0, 200);
    }
    if (errors.length && status === "WORKING") { status = "PARTIAL"; limit = `page error: ${errors[0].slice(0, 120)}`; }
    writeFileSync(join(dir, `${f.id}.json`), JSON.stringify({ ...base, status, evidence, limit, sr_name: srName, errors }, null, 1), "utf8");
    // With the 3D shown, a broken feature fails the suite. The 3D-hidden pass is a measurement for the "works with the
    // 3D hidden" column (no hide-3D mode exists yet, so the globe's features are expected to stop): recorded, not failed.
    if (!HIDE_3D) expect(status, evidence).not.toBe("BROKEN");
  });
}
