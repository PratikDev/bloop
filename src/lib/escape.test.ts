import { describe, expect, test } from "bun:test";
import { OVERLAY_SELECTOR, consumeEscape, escClosesOverlay, pushEscapeHandler, type Closest } from "./escape";

/** A stand-in element: inside the overlays whose roles it lists. */
const inside = (...roles: string[]): Closest => ({
  closest: (selectors: string) => (roles.some((r) => selectors.includes(`[role="${r}"]`)) ? {} : null),
});

describe("escClosesOverlay (mentor item 4: Esc in a Turntable dialog stayed on the page)", () => {
  test("an Esc inside a dialog, sheet, popover, menu or list closes only that", () => {
    for (const role of ["dialog", "alertdialog", "menu", "listbox"]) expect(escClosesOverlay(inside(role))).toBe(true);
  });

  test("an Esc on the page (or with no target) is the page's Esc", () => {
    expect(escClosesOverlay(inside())).toBe(false);
    expect(escClosesOverlay(inside("region", "application"))).toBe(false);
    expect(escClosesOverlay(null)).toBe(false);
  });

  test("the selector names exactly the overlay roles", () => {
    expect(OVERLAY_SELECTOR.match(/role="([a-z]+)"/gu)).toEqual(['role="dialog"', 'role="alertdialog"', 'role="menu"', 'role="listbox"']);
  });
});

describe("consumeEscape", () => {
  test("the newest handler that claims the Esc wins; released handlers are gone", () => {
    const seen: string[] = [];
    const offA = pushEscapeHandler(() => (seen.push("a"), true));
    const offB = pushEscapeHandler(() => (seen.push("b"), false));
    expect(consumeEscape()).toBe(true);
    expect(seen).toEqual(["b", "a"]);
    offA();
    offB();
    expect(consumeEscape()).toBe(false);
  });
});
