// The first-click sweep (mentor item 4, promoted from the audit's data_raw/_tmp/mentor-audit/mentor.audit.ts): every
// control on a page, clicked once on a settled page, must respond. A response is anything
// the user would get: a new URL or language, an overlay, a disclosure or a pressed/selected/checked state, the control's
// own state or name, the page's text or live region, focus moved elsewhere, a download, or sound rising from silence.
// Signals that change by themselves on a page (a turning globe's readout) are measured first and not counted there. The
// only controls allowed to do nothing are the expected no-ops: an already-selected tab, city or view; Stop with nothing
// playing; a link to the page already shown; the hidden "Skip to content" link.
import type { Page } from "@playwright/test";
import { AUDIBLE, heard } from "./app";

const MARK = "data-first-click";
const RESPONSE_MS = 1200;
const POLL_MS = 100;

export type NoOpReason = "already selected" | "link to this page" | "skip link" | "stop with nothing playing";

export interface Control {
  /** Position among the page's swept controls, in document order. */
  i: number;
  /** tag|role|name|href#occurrence: finds the same control again after a reload. */
  key: string;
  tag: string;
  role: string | null;
  name: string;
  href: string | null;
  disabled: boolean;
  /** Leaves the app (another site, a new tab) or saves a file by its own link: listed, not clicked. */
  leaves: boolean;
  /** Why it may do nothing, as the page stands (null: it must respond). */
  noOp: NoOpReason | null;
}

export type Outcome = "responded" | "expected no-op" | "no response" | "disabled" | "not clicked (leaves the app)";
export interface Row extends Control {
  outcome: Outcome;
  signals: string[];
  error?: string;
}

interface Snapshot {
  url: string;
  lang: string;
  overlays: number;
  openDetails: number;
  expanded: number;
  pressed: number;
  selected: number;
  checked: number;
  control: string | null;
  text: number;
  live: string;
  focus: string;
}
export type Signal = keyof Snapshot;
const SIGNALS: Signal[] = ["url", "lang", "overlays", "openDetails", "expanded", "pressed", "selected", "checked", "control", "text", "live", "focus"];

/** In the page: window.__sweep lists the controls (`tabbable`: only those Tab reaches), marks one, and snapshots. */
const SWEEP_SCRIPT = `(() => {
  const CONTROLS = 'button, [role="tab"], a[href], summary, [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"]';
  const OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
  const MARK = ${JSON.stringify(MARK)};
  const shown = (tabbable) => [...document.querySelectorAll(CONTROLS)].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || el.closest("[inert], [aria-hidden='true']") || el.closest(OVERLAY)) return false;
    if (!el.checkVisibility({ visibilityProperty: true })) return false;
    return !tabbable || el.tabIndex >= 0;
  });
  const list = (tabbable) => {
    const seen = new Map();
    return shown(tabbable).map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role");
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim().replace(/\\s+/gu, " ").slice(0, 90);
      const href = el.getAttribute("href");
      const base = [tag, role || "", name, href || ""].join("|");
      const n = seen.get(base) || 0;
      seen.set(base, n + 1);
      const disabled = Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true";
      const external = Boolean(href && /^[a-z]+:/iu.test(href) && !href.startsWith(location.origin));
      const leaves = external || el.getAttribute("target") === "_blank" || el.hasAttribute("download");
      const selected = ["aria-pressed", "aria-selected", "aria-checked"].some((a) => el.getAttribute(a) === "true")
        || (el.hasAttribute("aria-current") && el.getAttribute("aria-current") !== "false");
      let here = false;
      if (href && !href.startsWith("#") && !external) {
        const u = new URL(href, location.href);
        here = u.pathname === location.pathname && (!u.search || u.search === location.search);
      }
      const noOp = href === "#content" ? "skip link" : selected ? "already selected" : here ? "link to this page"
        : /^Stop\\b/u.test(name) ? "stop with nothing playing" : null;
      return { i, key: base + "#" + n, tag, role, name, href, disabled, leaves, noOp };
    });
  };
  const mark = (key, tabbable) => {
    document.querySelectorAll("[" + MARK + "]").forEach((e) => e.removeAttribute(MARK));
    const i = list(tabbable).findIndex((c) => c.key === key);
    if (i >= 0) shown(tabbable)[i].setAttribute(MARK, "");
    return i >= 0;
  };
  const snapshot = () => {
    const count = (s) => document.querySelectorAll(s).length;
    const el = document.querySelector("[" + MARK + "]");
    const txt = document.body.innerText;
    let h = 0;
    for (let k = 0; k < txt.length; k++) h = (h * 31 + txt.charCodeAt(k)) | 0;
    const active = document.activeElement;
    return {
      url: location.href,
      lang: document.documentElement.lang,
      overlays: [...document.querySelectorAll(OVERLAY)].filter((e) => e.checkVisibility()).length,
      openDetails: count("details[open]"),
      expanded: count('[aria-expanded="true"]'),
      pressed: count('[aria-pressed="true"]'),
      selected: count('[aria-selected="true"]'),
      checked: count('[aria-checked="true"], [data-checked]'),
      control: el ? ["aria-pressed", "aria-selected", "aria-expanded", "aria-checked", "data-state", "aria-label"].map((a) => el.getAttribute(a)).join("|") + "|" + (el.textContent || "").trim() : null,
      text: h,
      live: [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')].map((e) => e.textContent || "").join("¦"),
      // Focus on the clicked control (a click focuses it) or on nothing is not a move.
      focus: !active || active === document.body || active === el ? "" : active.outerHTML.slice(0, 120),
    };
  };
  window.__sweep = { list, mark, snapshot };
})();`;

interface SweepApi {
  list(tabbable: boolean): Control[];
  mark(key: string, tabbable: boolean): boolean;
  snapshot(): Snapshot;
}
type SweepWindow = Window & { __sweep?: SweepApi; __bloopLevel?: () => number };

/** Installs the in-page helper on this page and every page it loads next. */
export async function installSweep(page: Page) {
  await page.addInitScript(SWEEP_SCRIPT);
  await page.evaluate(SWEEP_SCRIPT);
}

export const listControls = (page: Page, tabbable: boolean) =>
  page.evaluate((tb) => (window as SweepWindow).__sweep?.list(tb) ?? [], tabbable);
const snapshot = (page: Page) => page.evaluate(() => (window as SweepWindow).__sweep!.snapshot());
const levelNow = (page: Page) => page.evaluate(() => (window as SweepWindow).__bloopLevel?.() ?? 0);
const changed = (a: Snapshot, b: Snapshot, ignore: ReadonlySet<Signal>) => SIGNALS.filter((k) => !ignore.has(k) && a[k] !== b[k]);

/** The signals that change on this page by themselves (over `ms`): they can't show a response here. */
export async function drift(page: Page, ms = 2400): Promise<Set<Signal>> {
  const out = new Set<Signal>();
  const first = await snapshot(page);
  for (let t = 0; t < ms; t += 400) {
    await page.waitForTimeout(400);
    for (const k of changed(first, await snapshot(page), out)) out.add(k);
  }
  return out;
}

/** Clicks one control once, on the page it was listed on, and reports what the user got. */
export async function clickOnce(page: Page, c: Control, ignore: ReadonlySet<Signal>, opts: { tabbable: boolean }): Promise<Row> {
  if (c.disabled) return { ...c, outcome: "disabled", signals: [] };
  if (c.leaves) return { ...c, outcome: "not clicked (leaves the app)", signals: [] };
  // The no-op reason as the page stands now (an earlier control may have selected this tab). A control renamed by a
  // state change (a How we got this button names the track) is the one at the same place, with the same tag and role.
  const list = await listControls(page, opts.tabbable);
  const same = (x: Control | undefined) => x && x.tag === c.tag && x.role === c.role && x.href === c.href;
  const now = list.find((x) => x.key === c.key) ?? (same(list[c.i]) ? list[c.i] : undefined);
  if (!now || !(await page.evaluate(([k, tb]) => (window as SweepWindow).__sweep!.mark(k, tb), [now.key, opts.tabbable] as const)))
    return { ...c, outcome: "no response", signals: [], error: "not on the settled page" };
  const before = await snapshot(page);
  const silent = (await levelNow(page)) <= AUDIBLE;
  let downloaded = false;
  const onDownload = () => (downloaded = true);
  page.on("download", onDownload);
  let error: string | undefined;
  try {
    await page.locator(`[${MARK}]`).click({ timeout: 4000 });
  } catch (e) {
    // The first line, and Playwright's reason (what intercepted the click, or why the target never settled).
    const lines = String(e).replace(/\u001b\[[0-9;]*m/gu, "").split("\n");
    const why = lines.filter((l) => /intercepts|not stable|not visible|outside of the viewport|detached/u.test(l)).pop()?.trim();
    error = [lines[0].slice(0, 120), why?.slice(0, 200)].filter(Boolean).join(" · ");
  }
  let signals: string[] = [];
  for (let t = 0; t < RESPONSE_MS && !signals.length && !downloaded; t += POLL_MS) {
    await page.waitForTimeout(POLL_MS);
    signals = changed(before, await snapshot(page).catch(() => ({ ...before, url: "(navigated)" })), ignore);
  }
  page.off("download", onDownload);
  if (downloaded) signals.push("download");
  // Sound counts only when it rises from silence (something already playing can't show this click's response).
  if (!signals.length && silent && (await heard(page, 1500)) > AUDIBLE) signals.push("sound");
  const outcome: Outcome = signals.length ? "responded" : now.noOp ? "expected no-op" : "no response";
  return { ...c, noOp: now.noOp, outcome, signals, ...(error ? { error } : {}) };
}

/** One line per control: what it is and what the click did. */
export const describeRow = (r: Row) =>
  `${String(r.i).padStart(3)} ${r.outcome.padEnd(28)} ${r.tag}${r.role ? `[${r.role}]` : ""} "${r.name}"${r.href ? ` → ${r.href}` : ""}` +
  (r.signals.length ? ` (${r.signals.join(", ")})` : "") + (r.noOp && r.outcome === "expected no-op" ? ` (${r.noOp})` : "") + (r.error ? ` !${r.error}` : "");
