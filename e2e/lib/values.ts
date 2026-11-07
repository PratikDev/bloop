// Mentor item 11: every value the app shows (a number with a unit, a percent, a confidence interval) must sit in a
// group ([data-provenance-group]) that holds a working "How we got this" button ([data-how-we-got-this]). Dates, times,
// years, record IDs and counts of controls carry no unit, so they are not values here. The caption bar is skipped: it is
// the live transcript of what is being spoken (the reading the page's readout group already explains).
import type { Locator, Page } from "@playwright/test";

/** A number (Western or Bangla digits) followed by a unit, or a CI. */
export const VALUE_SOURCE = String.raw`[0-9০-৯][0-9০-৯.,]*\s?(?:°\s?C|°|%|mm\/day|mm\/h|mm|cm\/yr|cm|km|ppm|ppb|µg|m\/s|kg|W\/m|DU|mol\b|days?\b|hours?\b|মিমি|সেমি|ডিগ্রি|দিন|ঘণ্টা)|\bCI\b`;

export interface Unexplained {
  text: string;
  where: string;
}

/** The visible values under `root` that are not in a group with a "How we got this" button. The panel itself, the
 * credits list and hidden elements are skipped. */
export async function unexplainedValues(root: Locator): Promise<Unexplained[]> {
  return root.evaluateAll((roots, source) => {
    const re = new RegExp(source, "u");
    const out: { text: string; where: string }[] = [];
    const skip = '[data-testid="how-we-got-this"], [data-testid="data-credits"], [data-testid="caption-bar"], script, style';
    for (const r of roots) {
      const walk = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const text = (n.textContent ?? "").trim();
        const el = n.parentElement;
        if (!text || !el || !re.test(text) || el.closest(skip)) continue;
        if (!el.checkVisibility({ opacityProperty: false, visibilityProperty: true })) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const group = el.closest("[data-provenance-group]");
        const button = group?.querySelector("[data-how-we-got-this]");
        if (!button || !(button as HTMLElement).checkVisibility()) out.push({ text: text.slice(0, 80), where: el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ")[0]}` : "") });
      }
    }
    return out;
  }, VALUE_SOURCE);
}

/** The page's own content: <main>, and any open dialog or sheet. */
export const content = (page: Page) => page.locator('main, [role="dialog"]');
