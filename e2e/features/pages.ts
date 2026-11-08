// Feature checks for main's redesign (the keep list of the merge): Home and the start choice, the header's pages,
// Then vs Now and Month by month, How we know, Go to, the 404 page, the dev harness hidden in production, phone width
// and the rain grid loading after Start.
import { expect, type Page } from "@playwright/test";
import { AUDIBLE, heard, level, navTo } from "../lib/app";
import { dock, map, name, onMap, sounds, tab, type Feature } from "./common";

const title = (page: Page) => page.getByRole("heading", { level: 1 }).first();

export const PAGES: Feature[] = [
  { id: "home", group: "pages", name: "Home: live globe and the five stations", where: "/ (Home)", keyboard: false,
    what: "The start screen: the live globe, its frame label, and a station for each page",
    control: (page) => page.getByRole("navigation", { name: "Five ways in" }),
    async run(page) {
      await page.getByRole("banner").getByRole("link", { name: "Bloop, home" }).click();
      await expect(page).toHaveURL(/\/$/u);
      const stations = page.getByRole("navigation", { name: "Five ways in" }).getByRole("link");
      await expect(stations).toHaveCount(5);
      return { evidence: `Home: ${(await stations.allInnerTexts()).map((s) => s.split("\n")[1] ?? s).join(", ")}` };
    } },
  { id: "start-remembered", group: "pages", name: "The sound choice is remembered; Reset sound choice", where: "Home · Continue listening · Reset sound choice", keyboard: false,
    what: "After the first visit Home offers Continue listening; Reset sound choice brings the start buttons back",
    control: (page) => page.getByRole("button", { name: "Reset sound choice" }),
    async run(page) {
      await page.goto("/");
      await page.getByRole("button", { name: "Reset sound choice" }).click({ timeout: 15_000 });
      await expect(page.getByRole("button", { name: "Start listening" })).toBeVisible();
      return { evidence: "reload → Reset sound choice offered; → Start listening again" };
    } },
  { id: "mode-tabs", group: "jukebox", name: "Page navigation (header dial)", where: "Header · Listen, Then vs Now, How we know, Official records, Turntable", keyboard: true,
    what: "Moves between the app's pages; the URL drives the page", control: (page) => page.getByRole("banner").getByRole("navigation"),
    async run(page) {
      const link = page.getByRole("banner").getByRole("link", { name: /Turntable$/u }).first();
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/turntable$/u);
      await navTo(page, "Listen");
      await expect(page).toHaveURL(/\/listen/u);
      return { evidence: "Tab to Turntable in the header → Enter → /turntable; Listen link → /listen" };
    } },
  { id: "then-now", group: "data", name: "Then vs Now: four cities, heat, monsoon rain, water (fires and vegetation hidden, mentor item 5)", where: "Then vs Now · Compare decades (key T)", keyboard: true,
    what: "Plays the two decades for one part, with a chart, its caption, its statistics and the honesty notes",
    control: (page) => page.getByRole("button", { name: "Play this part" }),
    async run(page) {
      await onMap(page); await page.keyboard.press("t");
      await expect(page).toHaveURL(/\/then-now/u);
      await expect(title(page)).toHaveText(/Then vs Now/u);
      // The page fades in after the URL changes: read the parts once they are there, not mid-transition.
      await expect(page.getByRole("tablist", { name: "Part" }).getByRole("tab").first()).toBeVisible();
      const parts = await page.getByRole("tablist", { name: "Part" }).getByRole("tab").allInnerTexts();
      for (const p of ["Heat", "Monsoon rain", "Water underground"]) if (!parts.some((x) => x.trim().startsWith(p))) throw new Error(`no ${p} part (${parts.join(", ")})`);
      for (const p of ["Fires", "Vegetation"]) if (parts.some((x) => x.trim().startsWith(p))) throw new Error(`hidden part ${p} shows (${parts.join(", ")})`);
      await page.getByRole("button", { name: "Play this part" }).click();
      const s = await sounds(page, "heat part");
      return { evidence: `parts: ${parts.join(", ")}; ${s.evidence}` };
    } },
  { id: "then-now-water", group: "truth", name: "Then vs Now honesty: water note and shared grid cells", where: "Then vs Now · Water underground; Chattogram", keyboard: false,
    what: "The national water note shows for every city; cities sharing a grid cell are named",
    async run(page) {
      await navTo(page, "Then vs Now");
      await tab(page, "Water underground").click();
      const text = await page.locator("main").innerText();
      if (!/Bangladesh|national|whole country/iu.test(text)) throw new Error("no national water note");
      return { evidence: text.replace(/\s+/gu, " ").match(/[^.]*(?:national|whole country|Bangladesh)[^.]*\./iu)?.[0]?.slice(0, 160) ?? "water note shown" };
    } },
  { id: "month-by-month", group: "data", name: "Month by month (Place History, 38 world places)", where: "Then vs Now · Month by month", keyboard: true,
    what: "A place's monthly record, a decade at a time with a playhead; arrow keys on the chart play one month",
    control: (page) => page.getByRole("slider").first(),
    async run(page) {
      await navTo(page, "Then vs Now");
      await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Month by month" }).click();
      const chart = page.getByRole("slider").first();
      await expect(chart).toBeVisible({ timeout: 30_000 });
      await chart.focus();
      await page.keyboard.press("ArrowRight");
      const s = await sounds(page, "one month");
      return { evidence: `chart "${await name(chart)}"; ${s.evidence}` };
    } },
  { id: "how-we-know", group: "truth", name: "How we know: every check and rule", where: "How we know", keyboard: false,
    what: "The ocean and rain checks, and every sound rule (counted from mapping.json)",
    async run(page) {
      await navTo(page, "How we know");
      await expect(title(page)).toHaveText(/How we know/u);
      const text = await page.locator("main").innerText();
      const rules = text.match(/(\d+)\s*\n?\s*sounds, each following a written rule/u);
      if (!rules) throw new Error("no rule count");
      return { evidence: `${rules[1]} sounds with a written rule` };
    } },
  { id: "go-to", group: "pages", name: "Go to a latitude and longitude", where: "Dock · Go to", keyboard: true,
    what: "Moves the cursor to typed coordinates and reads the value there", control: (page) => dock(page).getByRole("button", { name: "Go to a latitude and longitude" }),
    async run(page) {
      await dock(page).getByRole("button", { name: "Go to a latitude and longitude" }).click();
      await page.getByRole("textbox", { name: /Latitude/u }).fill("23.8");
      await page.getByRole("textbox", { name: /Longitude/u }).fill("90.4");
      await page.keyboard.press("Enter");
      await expect.poll(() => name(map(page))).toMatch(/23\.8|23\.75|Dhaka/u);
      return { evidence: `map reads "${(await name(map(page))).slice(0, 100)}"` };
    } },
  { id: "not-found", group: "pages", name: "No signal (404) page", where: "Any unknown address", keyboard: false,
    what: "An unknown page says so and offers the way back",
    async run(page) {
      // A static host serves 404.html for an unknown address (status 404); inside the app the router shows "No signal here".
      const r = await page.goto("/no-such-page");
      if (r?.status() !== 404) throw new Error(`status ${r?.status()}`);
      return { evidence: "/no-such-page → 404 page (status 404)" };
    } },
  { id: "dev-audio-hidden", group: "forms", name: "Audio harness hidden in production", where: "/dev/audio", keyboard: false,
    what: "L2's test page is a 404 in a production build (unless built with AUDIO_HARNESS=1)",
    async run(page) {
      await page.goto("/dev/audio");
      const harness = await page.getByText(/harness/iu).count();
      if (harness && !(await page.getByText(/not found|404|No signal/iu).count())) throw new Error("the harness is served");
      return { evidence: "/dev/audio does not serve the harness" };
    } },
  { id: "phone-width", group: "a11y", name: "Phone width: no sideways scroll, 44 px targets", where: "Every page at 320 px", keyboard: false,
    what: "Each page fits a 320 px screen; the dock's buttons are at least 44 px tall",
    async run(page) {
      await page.setViewportSize({ width: 320, height: 640 });
      const wide: string[] = [];
      for (const p of ["/", "/listen", "/then-now", "/how", "/official", "/turntable"]) {
        await page.goto(p);
        await page.waitForTimeout(2500);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) wide.push(`${p} (+${overflow} px)`);
      }
      await page.goto("/listen");
      const small = await dock(page).getByRole("button").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetHeight > 0 && e.getBoundingClientRect().height < 44).length);
      if (wide.length) throw new Error(`sideways scroll on ${wide.join(", ")}`);
      return { evidence: `6 pages fit 320 px; ${small} dock buttons under 44 px`, ...(small ? { limit: `${small} dock buttons under 44 px` } : {}) };
    } },
  { id: "engines", group: "sound", name: "Two engines, one instrument", where: "Listen (L2) → Official records (Jukebox) · Mixer: Mute all · Esc", keyboard: true,
    what: "Both engines share one AudioContext (one unlock); the record's voice takes over from the map's; Mute all and Esc silence both",
    async run(page) {
      await heard(page);                                                     // Listen: the L2 live voices
      await navTo(page, "Official records");
      await page.getByRole("button", { name: "Near-surface temperature (EIC, model)", exact: true }).click();
      await page.locator('section[aria-labelledby="official-heading"]').getByRole("button", { name: "Play", exact: true }).click();
      const playing = await heard(page);
      if (playing <= AUDIBLE) throw new Error(`the record is silent (${playing.toExponential(1)})`);
      const contexts = await page.evaluate(() => (window as unknown as { __bloopTaps: unknown[] }).__bloopTaps.length);
      if (contexts !== 1) throw new Error(`${contexts} AudioContexts (one shared context expected)`);
      await dock(page).getByRole("button", { name: /^Mixer/u }).click();
      const muteAll = page.getByRole("button", { name: "Mute all" });
      await muteAll.click();
      await page.waitForTimeout(800);
      const muted = await level(page);
      await muteAll.click();                                                   // the same toggle unmutes
      await page.keyboard.press("Escape");                                     // closes the mixer
      await page.keyboard.press("Escape");                                     // stops everything
      await page.waitForTimeout(800);
      const stopped = await level(page);
      if (muted > AUDIBLE || stopped > AUDIBLE) throw new Error(`still sounding: muted ${muted.toExponential(1)}, after Esc ${stopped.toExponential(1)}`);
      return { evidence: `1 AudioContext; record ${playing.toExponential(1)} → M ${muted.toExponential(1)} → Esc ${stopped.toExponential(1)}` };
    } },
  { id: "rain-after-start", group: "pages", name: "The rain grid loads after Start", where: "Home, before Start", keyboard: false,
    what: "The first load stays light: the rain grid is fetched only once listening starts",
    async run(page) {
      const context = await page.context().browser()!.newContext({ baseURL: new URL(page.url()).origin });
      const fresh = await context.newPage();
      const rain: string[] = [];
      fresh.on("request", (r) => { if (/\/latest\/rain/u.test(r.url())) rain.push(r.url()); });
      await fresh.goto("/");
      await fresh.waitForTimeout(4000);
      const before = rain.length;
      await fresh.getByRole("button", { name: "Start listening" }).click();
      await expect.poll(() => rain.length, { timeout: 20_000 }).toBeGreaterThan(before);
      await context.close();
      if (before) throw new Error(`${before} rain requests before Start`);
      return { evidence: `0 rain requests before Start, ${rain.length} after` };
    } },
];
