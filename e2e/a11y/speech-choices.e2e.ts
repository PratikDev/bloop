// Accessibility core, step 1 (docs/accessibility/CORE_PLAN.md): the speech mode decides where Bloop's spoken lines go
// (the screen reader's status region, Bloop's own voice, or neither, never two at once); "each step" decides whether a
// needle step sends text, sound or both; the choices are remembered. Runs on a build with NEXT_PUBLIC_A11Y_SPEECH=1.
// Bloop's voice is recorded by a stand-in speechSynthesis (headless browsers may have no voices installed).
import { expect, test, type Page } from "@playwright/test";
import { AUDIBLE, heard, level } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { liveLog, logCaptions, captionLog, logLiveRegion, openAt, settle } from "../mentor/lib";

const VOICE_STUB = `(() => {
  window.__spoken = [];
  class Utterance { constructor(text) { this.text = text; this.lang = ""; this.voice = null; } }
  window.SpeechSynthesisUtterance = Utterance;
  const voice = { lang: "en-US", name: "Test voice", localService: true, default: true, voiceURI: "test" };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    getVoices: () => [voice], cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {},
    speaking: false, pending: false,
    speak(u) { window.__spoken.push(u.text); setTimeout(() => { u.onstart && u.onstart(); u.onend && u.onend(); }, 30); },
  } });
})();`;

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.slice());
const map = (page: Page) => page.getByRole("application").first();
const settingsButton = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Settings" });

/** Picks one option in the Settings popover and closes it with its own button (Esc would also stop the sound). */
async function choose(page: Page, group: string, option: string) {
  await settingsButton(page).click();
  await page.getByRole("group", { name: group }).getByRole("button", { name: option, exact: true }).click();
  await expect(page.getByRole("group", { name: group }).getByRole("button", { name: option, exact: true })).toHaveAttribute("aria-pressed", "true");
  await settingsButton(page).click();
}

async function fresh(page: Page) {
  await page.addInitScript(VOICE_STUB);
  await openAt(page, "/listen");
  // A reload after Start keeps the choice but needs one tap for sound (mentor item 2): tap it, as a listener does.
  const tap = page.getByRole("button", { name: "Tap to start sound" });
  if (await tap.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false)) await tap.click();
  await logLiveRegion(page);
  await logCaptions(page);
}

/** Runs `act` and returns what the status region and Bloop's voice got from it. */
async function during(page: Page, act: () => Promise<void>) {
  const live0 = (await liveLog(page)).length;
  const said0 = (await spoken(page)).length;
  await act();
  await page.waitForTimeout(1200);
  return { live: (await liveLog(page)).slice(live0).filter((m) => m.trim()), said: (await spoken(page)).slice(said0) };
}

test("Settings offer Speech, Detail and Each step; the status region is role=status from the first paint", async ({ page }) => {
  await fresh(page);
  await expect(page.getByTestId("live-region")).toHaveAttribute("role", "status");
  await settingsButton(page).click();
  for (const [group, options] of [["Speech", ["My screen reader", "Bloop's voice", "Off"]], ["Detail", ["Brief", "Standard", "Detailed"]], ["Each step", ["Text and sound", "Text only", "Sound only"]]] as const) {
    for (const o of options) await expect(page.getByRole("group", { name: group }).getByRole("button", { name: o, exact: true })).toBeVisible();
  }
  expect(await axeSerious(page, '[data-testid="access-settings"]')).toEqual([]);
  // The default: the screen reader, standard detail, text and sound.
  for (const [group, o] of [["Speech", "My screen reader"], ["Detail", "Standard"], ["Each step", "Text and sound"]] as const)
    await expect(page.getByRole("group", { name: group }).getByRole("button", { name: o, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("speech mode: Enter's value goes to exactly one place (status region, Bloop's voice, or only the caption)", async ({ page }) => {
  await fresh(page);
  await map(page).focus();
  await settle(page, 800);
  const reader = await during(page, () => page.keyboard.press("Enter"));
  expect(reader.said).toEqual([]);
  expect(reader.live.length).toBeGreaterThan(0);

  await choose(page, "Speech", "Bloop's voice");
  await map(page).focus();
  const voice = await during(page, () => page.keyboard.press("Enter"));
  expect(voice.said.length).toBe(1);
  expect(voice.live).toEqual([]);

  await choose(page, "Speech", "Off");
  await map(page).focus();
  const caps0 = (await captionLog(page)).length;
  const off = await during(page, () => page.keyboard.press("Enter"));
  expect(off.said).toEqual([]);
  expect(off.live).toEqual([]);
  expect((await captionLog(page)).slice(caps0).join(" ")).toMatch(/\S/u);
});

test("each step: text only announces and stays silent; sound only sounds and stays quiet", async ({ page }) => {
  await fresh(page);
  await choose(page, "Each step", "Text only");
  await map(page).focus();
  const text = await during(page, () => page.keyboard.press("ArrowRight"));
  expect(text.live.length).toBeGreaterThan(0);
  expect(await level(page)).toBeLessThanOrEqual(AUDIBLE);

  await choose(page, "Each step", "Sound only");
  await map(page).focus();
  const sound = await during(page, () => page.keyboard.press("ArrowRight"));
  expect(sound.live).toEqual([]);
  expect(await heard(page, 3000)).toBeGreaterThan(AUDIBLE);
});

test("the choices are remembered after a reload", async ({ page }) => {
  await fresh(page);
  await choose(page, "Speech", "Bloop's voice");
  await choose(page, "Detail", "Detailed");
  await choose(page, "Each step", "Sound only");
  await page.reload();
  await settle(page, 800);
  await settingsButton(page).click();
  for (const [group, o] of [["Speech", "Bloop's voice"], ["Detail", "Detailed"], ["Each step", "Sound only"]] as const)
    await expect(page.getByRole("group", { name: group }).getByRole("button", { name: o, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("Bangla: the choices are in Bangla", async ({ page }) => {
  await fresh(page);
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await page.getByRole("banner").getByRole("button", { name: "সেটিংস" }).click();
  for (const name of ["কথা", "বিস্তারিত", "প্রতিটি ধাপে"]) await expect(page.getByRole("group", { name })).toBeVisible();
  await expect(page.getByRole("group", { name: "কথা" }).getByRole("button", { name: "আমার স্ক্রিন রিডার" })).toBeVisible();
});
