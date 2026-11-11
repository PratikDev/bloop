// The braille explorer's settings, shared by the braille checks: they sit in the "Display settings" fold, each a
// labelled radio group (src/components/BrailleExplorer). English and Bangla names, as the app shows them.
import type { Page } from "@playwright/test";

export const BRAILLE_NAMES = {
  en: { settings: "Display settings", data: "Data", shape: "Shape", width: "Braille display width (cells)", ocean: "Ocean temperature", rain: "Rain" },
  bn: { settings: "প্রদর্শনের সেটিংস", data: "তথ্য", shape: "আকার", width: "ব্রেইল ডিসপ্লের প্রস্থ (সেল)", ocean: "সমুদ্রের তাপমাত্রা", rain: "বৃষ্টি" },
} as const;

export type BrailleNames = (typeof BRAILLE_NAMES)[keyof typeof BRAILLE_NAMES];

/** Opens the Display settings fold, if it is closed. */
export async function openBrailleSettings(page: Page, names: BrailleNames = BRAILLE_NAMES.en) {
  const fold = page.getByRole("button", { name: names.settings, exact: true });
  if ((await fold.getAttribute("aria-expanded")) !== "true") await fold.click();
}

/** Chooses `option` in the settings' radio group `group`; false if the group isn't offered (one voice, one shape). */
export async function chooseBrailleOption(page: Page, group: string, option: string, names: BrailleNames = BRAILLE_NAMES.en): Promise<boolean> {
  await openBrailleSettings(page, names);
  const radios = page.getByRole("radiogroup", { name: group, exact: true });
  if (!(await radios.count())) return false;
  await radios.getByRole("radio", { name: option, exact: true }).click();
  return true;
}
