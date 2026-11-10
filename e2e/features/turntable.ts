// Feature checks on the Turntable page: the globe, its needle, search, tour, view, the four 3D scenes, its drawers.
import { expect, type Page } from "@playwright/test";
import { navTo } from "../lib/app";
import { dock, name, openMore, openPlayerMore, openScene, tab, turntable, type Feature } from "./common";

export const TURNTABLE: Feature[] = [
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
    control: (page) => page.getByRole("button", { name: /Close-up view|Jukebox view/u }),
    async run(page) {
      const { app } = await turntable(page);
      const view = page.getByRole("button", { name: /Close-up view|Jukebox view/u });
      // The key lives in More: open it to read the state, then close it again.
      const now = async () => {
        await openMore(page);
        const state = `${await name(view)} pressed=${await view.getAttribute("aria-pressed")}`;
        await page.keyboard.press("Escape");
        await expect(view).toBeHidden();
        return state;
      };
      const before = await now();
      await app.focus(); await page.keyboard.press("v");
      await expect.poll(now, { timeout: 20_000 }).not.toBe(before);
      return { evidence: `V: "${before}" → "${await now()}"` };
    } },
  ...([["scene-ghost", "Ghost Earths"], ["scene-delta", "Delta + aquifer"], ["scene-terrain", "Sound terrain"], ["scene-tunnel", "Dhaka time tunnel"]] as const)
    .map(([id, sleeve]): Feature => ({ id, group: "visuals", name: `Scene: ${sleeve}`, where: "Turntable · Records · scene sleeve", keyboard: false,
      what: `Opens the ${sleeve} 3D scene; Esc returns to the turntable`,
      control: (page) => page.getByRole("button", { name: `Open the ${sleeve} scene` }),
      run: (page) => openScene(page, sleeve) })),
  { id: "records-drawer", group: "jukebox", name: "Records drawer (sleeves)", where: "Turntable · Records", keyboard: false,
    what: "Lists the records and scenes to put on the turntable", control: (page) => page.getByRole("button", { name: "Records", exact: true }),
    async run(page) {
      await turntable(page);
      await openMore(page);
      await page.getByRole("button", { name: "Records", exact: true }).click();
      const n = await page.getByRole("button", { name: /^Play the .* record$/u }).count();
      if (n < 2) throw new Error(`${n} record sleeves`);
      return { evidence: `${n} record sleeves` };
    } },
  { id: "settings", group: "jukebox", name: "Turntable settings", where: "Turntable · More · Settings", keyboard: false,
    what: "Turntable quality, motion and display settings", control: (page) => page.getByRole("dialog").getByRole("button", { name: "Settings", exact: true }),
    async run(page) {
      await turntable(page);
      await openMore(page);
      await page.getByRole("dialog").getByRole("button", { name: "Settings", exact: true }).click();
      const drawer = page.getByRole("dialog", { name: "Settings" });         // a side sheet
      await expect(drawer).toBeVisible();
      return { evidence: `Settings opens the "${(await drawer.innerText()).split("\n")[0]}" drawer` };
    } },
  { id: "turntable-sources", group: "truth", name: "Sources and checks on the Turntable (Month by month)", where: "Turntable · More · Sources and checks", keyboard: false,
    what: "The Truth, Mapping, Provenance and History panels",
    control: (page) => page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: "More", exact: true }),
    async run(page) {
      await turntable(page);
      await openMore(page);
      await page.getByRole("button", { name: "Sources and checks", exact: true }).click();
      await tab(page, "Month by month").click();
      const p = page.getByRole("tabpanel", { name: "Month by month" });
      await expect(p).toBeVisible({ timeout: 30_000 });
      await expect(p).toContainText(/Chattogram|Dhaka/u, { timeout: 30_000 });
      return { evidence: (await p.innerText()).replace(/\s+/gu, " ").slice(0, 120) };
    } },
  { id: "credits", group: "jukebox", name: "Credits", where: "Turntable · More · Credits", keyboard: false,
    what: "Names every NASA visualization and dataset used", control: (page) => page.getByRole("group", { name: "Turntable controls" }).getByRole("button", { name: "More", exact: true }),
    async run(page) {
      await turntable(page);
      await openMore(page);
      await page.getByRole("button", { name: "Credits", exact: true }).click();
      await expect(page.getByText(/SVS/u).first()).toBeVisible();
      return { evidence: "Credits opens with the SVS credits" };
    } },
  { id: "history-panel", group: "data", name: "History: a place's Month by month record", where: "Then vs Now · More · Month by month", keyboard: false,
    what: "A place's monthly heat, rain or water record, a decade at a time (main's Month by month)",
    control: (page) => dock(page).getByRole("button", { name: "More", exact: true }),
    async run(page) {
      await navTo(page, "Then vs Now");
      await openPlayerMore(page);
      await page.getByRole("button", { name: "Month by month" }).click();
      const p = page.getByRole("main");
      await expect(p).toBeVisible({ timeout: 30_000 });
      await expect(p).toContainText(/Chattogram|Dhaka/u, { timeout: 30_000 });
      return { evidence: (await p.innerText()).replace(/\s+/gu, " ").slice(0, 120) };
    } },
  { id: "turntable-pointer-zoom", group: "visuals", name: "The pointer stays on the globe at every zoom", where: "Turntable · + / − and browser zoom", keyboard: true,
    what: "The tonearm, stylus and swatch stay drawn, in front of the camera and on screen, the stylus on the swatch, zooming in to the closest and back out, and at 200% browser zoom",
    async run(page) {
      await turntable(page);
      await page.goto(`${new URL(page.url()).pathname}?debug=1`);
      // The reload starts without sound, and with no record playing the arm rests beside the globe: start it as a user would.
      const start = page.getByRole("button", { name: /Start listening/u }).first();
      if (await start.isVisible({ timeout: 5_000 }).catch(() => false)) await start.click();
      await page.getByRole("button", { name: /Skip intro/u }).click({ timeout: 5_000 }).catch(() => undefined);
      await page.waitForFunction(() => "__turntable" in window, null, { timeout: 60_000 });
      await expect(page.getByText("Press any key to skip")).toBeHidden({ timeout: 30_000 });
      const app = page.getByRole("application", { name: /Turntable Earth/u });
      const steps: string[] = [];
      const check = async (step: string) => {
        await page.waitForTimeout(900); // the zoom eases in about 0.2 s; the arm follows on the next frames
        const p = await pointerState(page);
        const bad = (["arm", "swatch"] as const).flatMap((part) => (["visible", "inFront", "onScreen"] as const).filter((k) => !p[part][k]).map((k) => `${part} not ${k}`));
        // The stylus tip stands on the swatch: the needle meets the point it reads.
        const apart = Math.hypot(p.arm.x - p.swatch.x, p.arm.y - p.swatch.y);
        if (apart > 3) bad.push(`stylus ${apart.toFixed(1)} px off the swatch`);
        if (bad.length) throw new Error(`${step}: ${bad.join(", ")} (distance ${p.distance.toFixed(2)})`);
        steps.push(`${step} ${p.distance.toFixed(2)}`);
      };
      await check("start");
      await app.focus();
      for (let i = 1; i <= 10; i++) { await page.keyboard.press("+"); await check(`+${i}`); }
      for (let i = 1; i <= 12; i++) { await page.keyboard.press("-"); await check(`−${i}`); }
      // Browser zoom at 200%: half the CSS pixels at twice the device pixels (the DPR change only where the browser allows it).
      const size = page.viewportSize() ?? { width: 1280, height: 800 };
      const cdp = page.context().browser()?.browserType().name() === "chromium" ? await page.context().newCDPSession(page) : null;
      const zoomTo = async (factor: number) => {
        const width = Math.round(size.width / factor), height = Math.round(size.height / factor);
        await cdp?.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: factor, mobile: false });
        await page.setViewportSize({ width, height });
      };
      await zoomTo(2); await check("browser 200%");
      await app.focus();
      for (let i = 1; i <= 10; i++) await page.keyboard.press("+");
      await check("browser 200%, closest");
      await zoomTo(1); await check("browser 100%, closest");
      for (let i = 1; i <= 12; i++) await page.keyboard.press("-");
      await check("browser 100%, zoomed out");
      await cdp?.send("Emulation.clearDeviceMetricsOverride");
      return { evidence: `pointer drawn at ${steps.length} steps: ${steps.filter((_, i) => i % 6 === 0).join(" · ")}` };
    } },
];

interface PointerPart { visible: boolean; inFront: boolean; onScreen: boolean; x: number; y: number }
interface TurntableDebug { pointer(): { arm: PointerPart; swatch: PointerPart } | null; distance(): number }

/** The pointer as the scene draws it now, from the Turntable's debug hook (src/components/Turntable/debug.ts). */
async function pointerState(page: Page) {
  const p = await page.evaluate(() => {
    const tt = (window as unknown as { __turntable?: TurntableDebug }).__turntable;
    const pointer = tt?.pointer();
    return pointer && tt ? { ...pointer, distance: tt.distance() } : null;
  });
  if (!p) throw new Error("the Turntable's debug hook has no pointer");
  return p;
}
