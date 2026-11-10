// Shared by the browser checks (health-records.e2e.ts, features.e2e.ts): open the app past the start overlay, and measure
// what it plays. The level comes from an analyser tapped in front of every AudioContext's destination by an init script
// (the app is not changed).
import type { Page } from "@playwright/test";

export const AUDIBLE = 1e-4; // RMS of the summed output: above the noise floor of an idle graph (0)
export const SETTLE_MS = 300;
const SAMPLES = 6;

/** Taps every AudioContext's destination with an analyser; window.__bloopLevel() → max RMS across them. */
const TAP = `(() => {
  const connect = AudioNode.prototype.connect;
  const taps = new WeakMap();
  window.__bloopTaps = [];
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (typeof AudioDestinationNode !== "undefined" && dest instanceof AudioDestinationNode) {
      let a = taps.get(dest.context);
      if (!a) { a = dest.context.createAnalyser(); a.fftSize = 2048; taps.set(dest.context, a); window.__bloopTaps.push(a); }
      connect.call(this, a);
    }
    return connect.call(this, dest, ...rest);
  };
  window.__bloopLevel = () => {
    let m = 0;
    for (const a of window.__bloopTaps) {
      const b = new Float32Array(a.fftSize); a.getFloatTimeDomainData(b);
      let s = 0; for (const x of b) s += x * x; m = Math.max(m, Math.sqrt(s / b.length));
    }
    return m;
  };
})();`;

/** Hides every WebGL canvas (the 3D scenes and the globe) as soon as it gets its context: "works with the 3D hidden". */
const HIDE_3D = `(() => {
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    if (/webgl/i.test(String(kind))) this.style.setProperty("display", "none", "important");
    return get.call(this, kind, ...rest);
  };
})();`;

/** The loudest output over a short window (max of a few samples). */
export async function level(page: Page): Promise<number> {
  let m = 0;
  for (let i = 0; i < SAMPLES; i++) {
    m = Math.max(m, await page.evaluate(() => (window as unknown as { __bloopLevel?: () => number }).__bloopLevel?.() ?? 0));
    await page.waitForTimeout(50);
  }
  return m;
}

/** Waits up to `ms` for the output to rise above AUDIBLE; → the level reached. */
export async function heard(page: Page, ms = 4000): Promise<number> {
  const end = Date.now() + ms;
  let m = 0;
  while (Date.now() < end) {
    m = Math.max(m, await level(page));
    if (m > AUDIBLE) break;
  }
  return m;
}

/** Opens the app past the start overlay and the intro, with the audio tap (and, when asked, the 3D hidden). */
export async function start(page: Page, opts: { hide3d?: boolean } = {}) {
  await page.addInitScript(TAP);
  if (opts.hide3d) await page.addInitScript(HIDE_3D);
  await open(page);
}

/** Start listening and Skip intro, stopping the moment the journey into Listen is on screen. */
export async function startToJourney(page: Page, overlay: string) {
  await page.addInitScript(TAP);
  await page.goto("/");
  await page.getByRole("button", { name: "Start listening" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.locator(overlay).waitFor({ state: "attached", timeout: 10_000 });
}

/** Loads the app again on a page that already has the init scripts (a fresh start after a failed check). */
export async function open(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start listening" }).click();
  // The intro can appear a moment after Start: wait for it (it plays its own sound and takes the keys), then skip it.
  const skip = page.getByRole("button", { name: "Skip intro" });
  if (await skip.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await skip.click();
  await skip.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
}

/** An official record's strip on the Official page: its name is its code, then its title. */
export const officialStrip = (page: Page, title: string) =>
  page.getByRole("button", { name: new RegExp(`^C\\d+, ${title.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "u") });

/** The header's pages (main's router): a click on the dial's link, as a user moves between pages (the app's state stays). */
export type PageName = "Listen" | "Then vs Now" | "How we know" | "Official records" | "Turntable";

export async function navTo(page: Page, name: PageName) {
  // Official records isn't in the header: it is one link away from How we know.
  if (name === "Official records") {
    await navTo(page, "How we know");
    await page.getByRole("main").locator("summary", { hasText: "Credits" }).click();
    await page.getByRole("main").getByRole("link", { name: "All official records" }).click();
    await page.waitForURL(/official/u);
    return;
  }
  await page.getByRole("banner").getByRole("link", { name: new RegExp(`${name}$`, "u") }).first().click();
  await page.waitForURL(/./u);
}
