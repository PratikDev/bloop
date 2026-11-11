// Feature checks on the Listen page (the live map), its dock, the Inspector and the header's settings.
import { expect } from "@playwright/test";
import { dock, inspector, live, map, onMap, reading, pressed, sounds, stops, type Feature } from "./common";
import { settingsButton } from "../lib/app";

const mixerButton = (page: Parameters<Feature["run"]>[0]) => dock(page).getByRole("button", { name: /^Mixer/u });
const settings = (page: Parameters<Feature["run"]>[0]) => settingsButton(page);

export const LISTEN: Feature[] = [
  // ---- data ----
  { id: "live-ocean", group: "data", name: "Live ocean temperature (SVS 5101)", where: "Listen · sound map · key 1", keyboard: true,
    what: "Plays and reads the latest SST frame under the cursor", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("1");
      const a = await reading(page);
      for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowRight");
      await expect.poll(() => reading(page)).not.toBe(a);
      const b = await reading(page);
      if (!/°C/u.test(b)) throw new Error(`no temperature in "${b}"`);
      return { evidence: `"${a}" → "${b}"` };
    } },
  { id: "live-rain", group: "data", name: "Live rain (SVS 4285) and its 48-frame sequence", where: "Listen · sound map · key 2", keyboard: true,
    what: "Plays and reads the latest IMERG rain frame under the cursor", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("2");
      await expect.poll(() => reading(page)).toMatch(/Rain|Dry|mm\/h/u);
      return { evidence: `map reads "${await reading(page)}"` };
    } },
  { id: "freshness-badges", group: "data", name: "Freshness and source badges", where: "Listen · frame label beside the map", keyboard: false,
    what: "Says how old each frame is, and when it is older than its freshness limit",
    async run(page) {
      const t = await page.locator("main").innerText();
      const m = t.match(/Latest available: [^\n]+|Recorded \([^)]+\)[^\n]*/gu) ?? [];
      if (!m.length) throw new Error("no freshness wording");
      return { evidence: m.slice(0, 3).join(" | ") };
    } },
  // ---- sound ----
  { id: "sweep", group: "sound", name: "Sweep from Chattogram", where: "Listen · key S or the dock's Sweep", keyboard: true,
    what: "Plays the values outward from Chattogram", control: (page) => dock(page).getByRole("button", { name: "Play sweep" }),
    async run(page) { await onMap(page); await page.keyboard.press("s"); return sounds(page, "sweep"); } },
  { id: "timelapse", group: "sound", name: "Storm time-lapse", where: "Dock · Storm (Play storm time-lapse)", keyboard: false,
    what: "Plays the 48 half-hour rain frames in order, with its loading percentage", control: (page) => dock(page).getByRole("button", { name: /storm time-lapse/u }),
    async run(page) { await dock(page).getByRole("button", { name: /storm time-lapse/u }).click(); return sounds(page, "time-lapse"); } },
  { id: "voices", group: "sound", name: "Choose the voice: ocean, rain or both", where: "Listen · What you hear · keys 1 2 3", keyboard: true,
    what: "Switches which data voice plays", control: (page) => page.getByRole("group", { name: "What you hear" }).first(),
    async run(page) {
      const group = page.getByRole("group", { name: "What you hear" }).first();
      await onMap(page); await page.keyboard.press("1");
      await pressed(group.getByRole("button", { name: "Ocean" }));
      await page.keyboard.press("3");
      await pressed(group.getByRole("button", { name: "Both" }));
      return { evidence: "1 → Ocean pressed; 3 → Both pressed" };
    } },
  { id: "mixer", group: "sound", name: "Mixer (volume, mute, solo per voice)", where: "Dock · Mixer", keyboard: false,
    what: "Sets each voice's volume, mutes or solos it", control: mixerButton,
    async run(page) {
      await mixerButton(page).click();
      const mute = page.getByRole("button", { name: "Mute Ocean" });
      await mute.click(); await pressed(mute);
      return { evidence: "Mixer → Mute Ocean → pressed" };
    } },
  { id: "legend", group: "sound", name: "Hear the legend (reference sounds)", where: "Listen · key L", keyboard: true,
    what: "Plays reference tones for known values",
    async run(page) { await onMap(page); await page.keyboard.press("l"); return sounds(page, "legend"); } },
  { id: "unison", group: "sound", name: "Proof in unison", where: "Listen · key U · Inspector · Checks · Hear the nearest checked point", keyboard: true,
    what: "Plays the frame's tone and NASA's file tone together: beats mean they disagree (on the Jukebox engine)",
    async run(page) { await onMap(page); await page.keyboard.press("u"); return sounds(page, "unison"); } },
  { id: "motif", group: "sound", name: "Motif", where: "Header · Play the Bloop motif", keyboard: false,
    what: "Plays the app's short signature", control: (page) => page.getByRole("button", { name: "Play the Bloop motif" }),
    async run(page) { await page.getByRole("button", { name: "Play the Bloop motif" }).click(); return sounds(page, "motif"); } },
  { id: "pause", group: "sound", name: "Pause and resume", where: "Listen · Space · the dock's sound button", keyboard: true,
    what: "Pauses the live sound", control: (page) => dock(page).getByRole("button", { name: /sound/u }).first(),
    async run(page) {
      await sounds(page, "live sound before pausing");
      await onMap(page); await page.keyboard.press("Space");
      return stops(page, "Space");
    } },
  { id: "mute", group: "sound", name: "Mute everything (both engines)", where: "Listen · key M", keyboard: true, what: "Mutes or unmutes all sound",
    async run(page) { await sounds(page, "before muting"); await onMap(page); await page.keyboard.press("m"); return stops(page, "M"); } },
  { id: "esc", group: "sound", name: "Esc stops all sound (both engines)", where: "Anywhere · Esc", keyboard: true, what: "Stops all sound and closes panels",
    async run(page) { await sounds(page, "before Esc"); await onMap(page); await page.keyboard.press("Escape"); return stops(page, "Esc"); } },
  { id: "mapping-panel", group: "sound", name: "Mapping panel (What you hear)", where: "Dock · About this sound · What you hear", keyboard: false,
    what: "States each data-to-sound rule (range, scale, what higher means)", control: (page) => dock(page).getByRole("button", { name: "About this sound" }),
    async run(page) {
      const t = await (await inspector(page, "What you hear")).innerText();
      if (!/Hz|semitone|pitch/iu.test(t)) throw new Error("no rule wording");
      return { evidence: t.replace(/\s+/gu, " ").slice(0, 120) };
    } },
  // ---- the tour ----
  { id: "story", group: "jukebox", name: "The tour (Story)", where: "Dock · Take the tour", keyboard: false,
    what: "Plays ocean hum, sweep, time-lapse, satellite whisper and how we know, in order, in under 90 s",
    control: (page) => page.getByRole("region", { name: "The tour" }),
    async run(page) {
      await dock(page).getByRole("button", { name: "Take the tour" }).click();
      const region = page.getByRole("region", { name: "The tour" });
      await expect(region).toBeVisible();
      const items = await region.getByRole("listitem").count();
      const s = await sounds(page, "tour");
      return { evidence: `${items} parts listed; ${s.evidence}` };
    } },
  // ---- accessibility ----
  { id: "help", group: "a11y", name: "Keys and help", where: "Anywhere · H or Help", keyboard: true,
    what: "Lists every key (map, turntable, scenes)", control: (page) => page.getByRole("banner").getByRole("button", { name: "Help" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("h");
      const dialog = page.getByRole("dialog", { name: "Keys and help" });
      await expect(dialog).toBeVisible();
      const tables = await dialog.getByRole("table").count();
      return { evidence: `H → the Keys and help dialog, ${tables} key tables` };
    } },
  { id: "enter-speaks", group: "a11y", name: "Speak the value (live region)", where: "Listen · Enter", keyboard: true,
    what: "Announces the value and place through the page's live region", control: map,
    async run(page) {
      await onMap(page); await page.keyboard.press("Enter");
      await expect.poll(() => live(page)).toMatch(/°C|mm\/h|Dry/u);
      return { evidence: `live region: "${(await live(page)).replace(/\s+/gu, " ").slice(0, 100)}"` };
    } },
  { id: "describe", group: "a11y", name: "Describe mode", where: "Header · Settings · Describe · Shift+D", keyboard: true,
    what: "Turns spoken descriptions on or off", control: (page) => settings(page),
    async run(page) {
      // Shift+D: Describe mode (plain D went to "describe here"; Shift+D toggled it before too).
      await onMap(page); await page.keyboard.press("Shift+D");
      await settings(page).click();
      await pressed(page.getByRole("button", { name: "Describe" }));
      return { evidence: "Shift+D → Settings shows Describe pressed" };
    } },
  { id: "captions", group: "a11y", name: "Captions", where: "Listen · key C", keyboard: true, what: "Shows sound captions as text",
    async run(page) {
      const a = await live(page);
      await onMap(page); await page.keyboard.press("c");
      await expect.poll(() => live(page)).not.toBe(a);
      return { evidence: `live region after C: "${(await live(page)).replace(/\s+/gu, " ").slice(0, 100)}"` };
    } },
  { id: "braille", group: "a11y", name: "Braille data explorer", where: "Listen · key B or the dock's Braille explorer", keyboard: true,
    what: "Feel the data as braille cells; the caret is the needle", control: (page) => dock(page).getByRole("button", { name: "Braille explorer" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("b");
      await expect(page.getByTestId("braille-value")).toHaveValue(/\S/u);
      const shape = page.getByTestId("braille-shape");
      await shape.focus(); const v0 = await page.getByTestId("braille-value").inputValue();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => page.getByTestId("braille-value").inputValue()).not.toBe(v0);
      return { evidence: `value line "${v0}" → "${await page.getByTestId("braille-value").inputValue()}" after one arrow` };
    } },
  { id: "bangla", group: "a11y", name: "Bangla interface", where: "Header · বাংলা", keyboard: false,
    what: "Switches the interface to Bangla (Samonwita's translation), and the braille lines",
    control: (page) => page.getByRole("banner").getByRole("button", { name: "বাংলা" }),
    async run(page) {
      await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).click();
      await expect(page.locator("html")).toHaveAttribute("lang", "bn");
      const title = await page.getByRole("heading", { level: 1 }).first().innerText();
      if (!/[ঀ-৿]/u.test(title)) throw new Error(`page title not in Bangla: "${title}"`);
      await onMap(page); await page.keyboard.press("b");
      const v = page.getByTestId("braille-value");
      await expect(v).toHaveValue(/[ঀ-৿]/u);
      return { evidence: `title "${title}"; braille value line "${(await v.inputValue()).slice(0, 50)}"`,
        limit: "the Official records, Turntable, scenes, braille and badge strings show in English until translated (docs/i18n/TO_TRANSLATE.md)" };
    } },
  // ---- truth ----
  { id: "truth-panel", group: "truth", name: "Truth panel (Checks)", where: "Dock · About this sound · Checks", keyboard: false,
    what: "How each live value was checked against NASA's source data, with the error, unison, three-way and anomaly checks, and the GLOBE teaser",
    async run(page) {
      const panel = await inspector(page, "Checks");
      await expect(panel.getByText(/Citizen observers vs satellite/u)).toBeVisible({ timeout: 15_000 }); // the teaser loads its own file
      const t = await panel.innerText();
      const m = t.match(/MUR[^\n]*/u);
      if (!m) throw new Error("no MUR check sentence");
      return { evidence: `${m[0].slice(0, 120)}; GLOBE teaser shown` };
    } },
  { id: "provenance-key", group: "truth", name: "Where this value comes from", where: "Listen · key P · About this sound · Where it's from", keyboard: true,
    what: "Opens the provenance of the value under the cursor",
    async run(page) {
      await onMap(page); await page.keyboard.press("p");
      const panel = page.getByRole("tabpanel", { name: "Where it's from" });
      await expect(panel).toBeVisible();
      return { evidence: `P → Where it's from: ${(await panel.innerText()).replace(/\s+/gu, " ").slice(0, 100)}` };
    } },
];
