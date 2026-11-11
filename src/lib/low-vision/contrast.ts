// PURE: WCAG contrast (relative luminance and contrast ratio, WCAG 2.2 §1.4.3 / 1.4.6 / 1.4.11). Used by the theme
// tests (text at least 7:1 in the high-contrast themes; focus and the needle at least 3:1) and by the custom theme's
// warning when the user's two colours are too close.

import { hexToRgb } from "@/lib/css-tokens";

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG's enhanced (AAA) text contrast, the high-contrast themes' floor. */
export const TEXT_AAA = 7;
/** WCAG's non-text contrast (focus indicator, the needle). */
export const NON_TEXT = 3;
