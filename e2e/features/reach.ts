// Reachability inventory (phase 8): every record and every feature on Pratik's list can still be reached on final-pass.
// A merge once dropped the storm time-lapse without any test noticing; these checks open each thing the way a user would
// and fail if it is gone. Features already covered by a deeper check elsewhere (Help, Bangla, the 404, Go to, Braille,
// Sweep, the tour, the Mixer, Sources and checks) are not repeated here.
import { expect, type Page } from "@playwright/test";
import { navTo } from "../lib/app";
import { choosePart, dock, openMore, openPlayerMore, openRecords, openScene, turntable, type Feature } from "./common";

const OFFICIAL = 'section[aria-labelledby="official-heading"]';

/** Records that act rather than stay on (the legend plays once, the sweep runs once): the crown keeps the voice's code. */
const ONE_SHOT = new Set(["A0", "D3"]);

/** Plays a record by typing its code in the Records sheet; → the code, once the crown names it (or, for a one-shot
 *  record, once the sheet has closed without saying the code is unknown). */
async function playCode(page: Page, code: string, { stop = true }: { stop?: boolean } = {}): Promise<string> {
  await openRecords(page);
  const sheet = page.getByRole("dialog", { name: "Records" });
  await sheet.getByRole("textbox", { name: "Record code" }).fill(code);
  await sheet.getByRole("button", { name: "Play", exact: true }).click();
  await expect(sheet).toBeHidden({ timeout: 15_000 });
  if (ONE_SHOT.has(code)) {
    await page.keyboard.press("Escape");
    return code;
  }
  // The crown names the current record on every page with a cabinet (even where it folds away on short screens).
  const crown = page.locator("[data-cabinet-crown]").first();
  await expect(crown).toContainText(code, { timeout: 30_000 });
  if (stop) await page.keyboard.press("Escape"); // stop whatever the record started, so the next one starts clean
  return code;
}

/** Every record code: A0–A3, B1–B5, one C per official record (from the open index), D1–D3. */
async function allCodes(page: Page): Promise<string[]> {
  const index = (await (await page.request.get("/data/official/index.json")).json()) as { records: unknown[] };
  const c = index.records.map((_, i) => `C${i + 1}`);
  return ["A0", "A1", "A2", "A3", "B1", "B2", "B3", "B4", "B5", ...c, "D1", "D2", "D3"];
}

const SCENES = ["Ghost Earths", "Delta + aquifer", "Sound terrain", "Dhaka time tunnel"];

export const REACH: Feature[] = [
  { id: "reach-records", group: "jukebox", name: "Every record reachable by its code", where: "Records · Record code", keyboard: true,
    what: "A0–A3, B1–B5, every C code and D1–D3 each open, and the crown names them",
    control: (page) => dock(page).getByRole("button", { name: "Records", exact: true }),
    async run(page) {
      const codes = await allCodes(page);
      const missing: string[] = [];
      for (const code of codes) await playCode(page, code).catch(() => missing.push(code));
      if (missing.length) throw new Error(`not reachable: ${missing.join(", ")}`);
      return { evidence: `${codes.length} records: ${codes.join(" ")}` };
    } },
  { id: "reach-listen", group: "pages", name: "Listen's controls reachable", where: "Listen · the player and its More", keyboard: false,
    what: "West to east, South to north, Go to, Braille, Mixer, Sources and checks and the player sheet are all there",
    async run(page) {
      await navTo(page, "Listen");
      await expect(dock(page).getByRole("slider", { name: "West to east" })).toBeVisible();
      await openPlayerMore(page);
      for (const n of ["Go to a latitude and longitude", "Sources and checks", "Now playing"]) await expect(page.getByRole("button", { name: n }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /^Mixer/u }).first()).toBeVisible();
      await expect(page.getByRole("slider", { name: "South to north" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Braille explorer/u }).first()).toBeVisible();
      await page.getByRole("button", { name: "Now playing" }).first().click();
      await expect(page.getByRole("dialog", { name: "Now playing" })).toBeVisible();
      return { evidence: "sliders, Go to, Braille, Mixer, Sources and checks; the Now playing sheet opens" };
    } },
  { id: "reach-timelapse-view", group: "visuals", name: "Storm time-lapse with its Globe / Flat map choice", where: "Records · D2", keyboard: false,
    what: "The time-lapse opens on Listen and its view switches between the globe and the flat map",
    async run(page) {
      await playCode(page, "D2", { stop: false }); // Esc would end the time-lapse and take its view choice with it
      const view = page.getByRole("group", { name: "Storm view" });
      await expect(view).toBeVisible({ timeout: 30_000 });
      const flat = view.getByRole("button", { name: "Flat map" });
      await flat.click();
      await expect(flat).toHaveAttribute("aria-pressed", "true");
      await view.getByRole("button", { name: "Globe" }).click();
      return { evidence: "Storm view: Globe and Flat map both selectable" };
    } },
  { id: "reach-then-now", group: "pages", name: "Then vs Now: every part, both views, Details", where: "Then vs Now", keyboard: false,
    what: "Each part opens (Play, or the visible reason it has no sound), Details opens, Month by month opens and comes back",
    async run(page) {
      await navTo(page, "Then vs Now");
      const done: string[] = [];
      for (const part of ["Heat", "Monsoon rain", "Water underground", "Fires", "Vegetation"]) {
        await choosePart(page, part);
        const play = page.getByRole("button", { name: "Play this part" });
        const reason = page.getByText("No sound for this record yet");
        await expect(play.or(reason).first()).toBeVisible({ timeout: 20_000 });
        await page.getByRole("button", { name: /^(Details|Sources)/u }).first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        done.push(part);
      }
      await openPlayerMore(page);
      await page.getByRole("button", { name: "Month by month" }).click();
      await expect(page).toHaveURL(/view=monthly/u);
      await page.getByRole("button", { name: "Compare decades" }).click();
      await expect(page.getByRole("combobox", { name: "Part" })).toBeVisible();
      return { evidence: `parts ${done.join(", ")}, each with Details; Month by month and back` };
    } },
  { id: "reach-how", group: "truth", name: "How we know: every check link and Credits", where: "How we know", keyboard: false,
    what: "Each of the four checks opens its full wording; Credits opens with its links",
    async run(page) {
      await navTo(page, "How we know");
      const opened: string[] = [];
      for (const n of ["Read the ocean check", "Read the rain check", "See every rule", "Read the preview"]) {
        await page.getByRole("button", { name: n }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeHidden();
        opened.push(n);
      }
      await page.getByRole("main").getByRole("button", { name: "Credits", exact: true }).click();
      const credits = page.getByRole("dialog", { name: "Credits" });
      await expect(credits.locator('a[href="/official"]')).toBeVisible();
      return { evidence: `${opened.join(", ")}; Credits with the Official records link` };
    } },
  { id: "reach-official", group: "data", name: "Official records: every record opens", where: "Official records", keyboard: false,
    what: "Each record in the list opens with its map, reading and Play",
    async run(page) {
      await navTo(page, "Official records");
      const list = page.getByRole("group", { name: "Records" }).getByRole("button");
      await expect(list.first()).toBeVisible({ timeout: 30_000 });
      const n = await list.count();
      const failed: string[] = [];
      for (let i = 0; i < n; i++) {
        const strip = list.nth(i);
        const label = ((await strip.getAttribute("aria-label")) ?? (await strip.innerText())).split(",")[0].trim();
        await strip.click();
        // A record with its own player names its key for what it plays ("Play at the needle", "Play the nights").
        const ok = await expect(page.locator(OFFICIAL).getByRole("button", { name: /^Play/u }).first()).toBeEnabled({ timeout: 30_000 }).then(() => true, () => false);
        if (!ok) failed.push(label);
      }
      if (failed.length) throw new Error(`not playable: ${failed.join(", ")}`);
      return { evidence: `${n} records open with Play enabled` };
    } },
  { id: "reach-turntable", group: "visuals", name: "Turntable: search, Where am I and every More item", where: "Turntable", keyboard: false,
    what: "Search and Where am I are on the bar; More lists all its items",
    async run(page) {
      await turntable(page);
      const bar = page.getByRole("group", { name: "Turntable controls" });
      await expect(bar.getByRole("button", { name: /Search/u }).first()).toBeVisible();
      await bar.getByRole("button", { name: "Where am I?" }).click();
      await openMore(page);
      const items = ["Move the needle", "Bookmarks", "Layers and sound", "Keys and help", "Sources and checks", "Records", "Turning and speed", "Credits", "Settings"];
      const missing: string[] = [];
      for (const n of items) if (!(await page.getByRole("button", { name: n, exact: true }).count())) missing.push(n);
      if (!(await page.getByRole("button", { name: /^(Close-up view|Turntable view)/u }).count())) missing.push("Close-up view");
      if (!(await page.getByRole("button", { name: /Tour/u }).count())) missing.push("Tour");
      if (missing.length) throw new Error(`missing from More: ${missing.join(", ")}`);
      return { evidence: `Search, Where am I; More: ${items.join(", ")}, the view and the tour` };
    } },
  ...SCENES.map((sleeve): Feature => ({
    id: `reach-scene-${sleeve.toLowerCase().replace(/[^a-z]+/gu, "-")}`, group: "visuals", name: `Turntable scene: ${sleeve}`, where: "Turntable · More · Records", keyboard: false,
    what: "The scene opens from the records drawer and Esc comes back to the turntable",
    run: (page) => openScene(page, sleeve),
  })),
  { id: "reach-settings", group: "a11y", name: "Settings: Reduce motion, Comfortable text, Sound words", where: "Header · Settings", keyboard: false,
    what: "Each setting toggles on and back off",
    control: (page) => page.getByRole("banner").getByRole("button", { name: "Settings", exact: true }),
    async run(page) {
      const names = ["Reduce motion", "Comfortable text", "Sound words"];
      const toggle = (n: string) => page.getByRole("button", { name: n, exact: true });
      // The menu may close after a choice: open it again whenever the toggle isn't on screen.
      const press = async (n: string) => {
        if (!(await toggle(n).isVisible())) await page.getByRole("banner").getByRole("button", { name: "Settings", exact: true }).click();
        await toggle(n).click();
      };
      for (const n of names) {
        await page.getByRole("banner").getByRole("button", { name: "Settings", exact: true }).click();
        const before = (await toggle(n).getAttribute("aria-pressed")) ?? "false";
        await press(n);
        if (!(await toggle(n).isVisible())) await page.getByRole("banner").getByRole("button", { name: "Settings", exact: true }).click();
        await expect(toggle(n)).not.toHaveAttribute("aria-pressed", before);
        await press(n);
        await page.keyboard.press("Escape");
      }
      return { evidence: `${names.join(", ")}: each toggles` };
    } },
];
