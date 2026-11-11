// The measurements, run inside the page (Playwright serialises `measure`, so it must not use anything outside itself).
// Types are shared with the capture script and the summary.

export interface Settings {
  maxOverlapPx: number;
  minTextPx: number;
  contrast: number;
  coral: [number, number, number];
  cellPx: number;
  /** Count visible Latin words (for Bangla mode). */
  latin: boolean;
}

export interface Measured {
  pageScroll: number;
  mainScroll: number;
  sidewaysDoc: number;
  sidewaysMain: number;
  overlaps: string[];
  smallText: string[];
  lowContrast: string[];
  controlsOutsideMap: number;
  controlNames: string[];
  coralControls: string[];
  hardShadowStatic: string[];
  emptyAreaPx2: number;
  emptyAreaPct: number;
  englishInBangla: string[];
}

export function measure(s: Settings): Measured {
  interface Rect { left: number; top: number; right: number; bottom: number }
  const main = document.querySelector("main");
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewport: Rect = { left: 0, top: 0, right: vw, bottom: vh };
  const intersect = (a: Rect, b: Rect): Rect => ({ left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
  const isEmpty = (r: Rect) => r.right - r.left <= 0 || r.bottom - r.top <= 0;
  const area = (r: Rect) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
  const label = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/u)[0]}` : ""}`;
  const visible = (el: Element) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });

  // Any CSS colour → RGBA, through a canvas (computed colours can be oklch, color-mix, ...).
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, [number, number, number, number]>();
  const rgba = (c: string): [number, number, number, number] => {
    const hit = cache.get(c);
    if (hit) return hit;
    let out: [number, number, number, number] = [0, 0, 0, 0];
    if (cx) {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = "#000";
      cx.fillStyle = c;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    }
    cache.set(c, out);
    return out;
  };
  const lum = (r: number, g: number, b: number) => {
    const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  // --- the elements with their own text
  const textEls: { el: Element; text: string }[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "CANVAS", "svg"].includes(el.tagName)) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim();
    if (!text || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    textEls.push({ el, text });
  }
  const onScreen = (el: Element) => !isEmpty(intersect(el.getBoundingClientRect(), viewport));

  // --- overlapping text boxes (the logic of e2e/layout.e2e.ts)
  const clipped = (el: Element): Rect => {
    let box: Rect = el.getBoundingClientRect();
    for (let a = el.parentElement; a && a !== main && a !== document.body; a = a.parentElement) {
      const st = getComputedStyle(a);
      if (st.overflowX !== "visible" || st.overflowY !== "visible") box = intersect(box, a.getBoundingClientRect());
    }
    return box;
  };
  const items = textEls.filter((t) => !t.el.closest("[data-overlay]")).map((t) => {
    const inMain = main?.contains(t.el) ?? false;
    const rect = clipped(t.el);
    const shown = intersect(rect, inMain && main ? intersect(viewport, main.getBoundingClientRect()) : viewport);
    return { ...t, inMain, rect, shown };
  }).filter((i) => !isEmpty(i.inMain ? i.rect : i.shown));
  const overlaps: string[] = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i]; const b = items[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const both = a.inMain === b.inMain;
    const o = intersect(both ? a.rect : a.shown, both ? b.rect : b.shown);
    if (o.right - o.left > s.maxOverlapPx && o.bottom - o.top > s.maxOverlapPx) overlaps.push(`"${a.text.slice(0, 40)}" × "${b.text.slice(0, 40)}"`);
  }

  // --- text under 14 px (on screen)
  const smallText = textEls.filter((t) => onScreen(t.el) && parseFloat(getComputedStyle(t.el).fontSize) < s.minTextPx)
    .map((t) => `${parseFloat(getComputedStyle(t.el).fontSize).toFixed(1)}px "${t.text.slice(0, 40)}"`);

  // --- contrast: colour over the first opaque-ish background up the tree; gradients, images and canvases are skipped
  const backdrop = (el: Element): [number, number, number] | null => {
    const layers: [number, number, number, number][] = [];
    for (let a: Element | null = el; a; a = a.parentElement) {
      const st = getComputedStyle(a);
      if (st.backgroundImage !== "none") return null;
      const c = rgba(st.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let [r, g, b] = [255, 255, 255];
    for (const [lr, lg, lb, la] of layers.reverse()) { r = lr * la + r * (1 - la); g = lg * la + g * (1 - la); b = lb * la + b * (1 - la); }
    return [r, g, b];
  };
  const lowContrast: string[] = [];
  for (const t of textEls) {
    if (!onScreen(t.el) || t.el.closest("canvas, [data-overlay]")) continue;
    const st = getComputedStyle(t.el);
    const bg = backdrop(t.el);
    if (!bg) continue;
    const fg = rgba(st.color);
    const a = fg[3];
    const f: [number, number, number] = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
    const l1 = lum(...f); const l2 = lum(...bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(st.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(st.fontWeight, 10) >= 700);
    if (ratio < (large ? 3 : s.contrast)) lowContrast.push(`${ratio.toFixed(2)}:1 "${t.text.slice(0, 36)}" (${label(t.el)})`);
  }

  // --- controls outside the map, coral fills
  const CONTROL = 'button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="slider"], [role="combobox"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="link"], [tabindex="0"]';
  const MAP = '[role="application"], #sound-map';
  const controls = [...document.querySelectorAll(CONTROL)].filter((el) => visible(el) && onScreen(el) && !el.closest(MAP) && !el.closest("[aria-hidden='true']"));
  const nameOf = (el: Element) => (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/gu, " ").trim().slice(0, 28) || label(el);
  const coralControls = controls.filter((el) => {
    const c = rgba(getComputedStyle(el).backgroundColor);
    return c[3] > 0.5 && Math.abs(c[0] - s.coral[0]) < 6 && Math.abs(c[1] - s.coral[1]) < 6 && Math.abs(c[2] - s.coral[2]) < 6;
  }).map(nameOf);

  // --- a hard shadow (no blur, an offset) on something you can't press
  const hardShadowStatic: string[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || !onScreen(el)) continue;
    const sh = getComputedStyle(el).boxShadow;
    if (sh === "none") continue;
    const hard = sh.split(/,(?![^(]*\))/u).some((one) => {
      const nums = one.replace(/(rgba?|oklch|color)\([^)]*\)/gu, "").match(/-?\d*\.?\d+px/gu)?.map(parseFloat) ?? [];
      return nums.length >= 2 && (nums[0] !== 0 || nums[1] !== 0) && (nums[2] ?? 0) === 0 && !one.includes("inset");
    });
    if (!hard) continue;
    const pressable = el.closest(CONTROL) || getComputedStyle(el).cursor === "pointer";
    if (pressable) continue;
    const r = el.getBoundingClientRect();
    hardShadowStatic.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}${el.querySelector(CONTROL) ? " (holds controls)" : ""}`);
  }

  // --- the largest empty rectangle on screen: a grid of s.cellPx cells, content marked, then the biggest run of free cells
  const cols = Math.ceil(vw / s.cellPx); const rows = Math.ceil(vh / s.cellPx);
  const grid = Array.from({ length: rows }, () => new Uint8Array(cols));
  const mark = (r: Rect) => {
    const c = intersect(r, viewport);
    if (isEmpty(c)) return;
    for (let y = Math.floor(c.top / s.cellPx); y < Math.min(rows, Math.ceil(c.bottom / s.cellPx)); y++) for (let x = Math.floor(c.left / s.cellPx); x < Math.min(cols, Math.ceil(c.right / s.cellPx)); x++) grid[y][x] = 1;
  };
  for (const t of textEls) {
    const range = document.createRange();
    range.selectNodeContents(t.el);
    for (const r of range.getClientRects()) mark(r);
  }
  for (const el of document.querySelectorAll("img, canvas, svg, video, picture, " + CONTROL)) if (visible(el)) mark(el.getBoundingClientRect());
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (area(intersect(r, viewport)) > 0.25 * vw * vh) continue; // page-sized backgrounds are not content
    const st = getComputedStyle(el);
    if (rgba(st.backgroundColor)[3] > 0.3 || st.backgroundImage !== "none" || st.borderTopWidth !== "0px" && rgba(st.borderTopColor)[3] > 0 || st.boxShadow !== "none") mark(r);
  }
  let best = 0;
  const heights = new Array<number>(cols).fill(0);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) heights[x] = grid[y][x] ? 0 : heights[x] + 1;
    const stack: number[] = [];
    for (let x = 0; x <= cols; x++) {
      const h = x === cols ? 0 : heights[x];
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const top = heights[stack.pop() as number];
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        best = Math.max(best, top * (x - left));
      }
      stack.push(x);
    }
  }
  const emptyAreaPx2 = best * s.cellPx * s.cellPx;

  // --- English words on screen (Bangla mode)
  const englishInBangla: string[] = [];
  if (s.latin) {
    for (const t of textEls) {
      if (!onScreen(t.el)) continue;
      const words = t.text.match(/[A-Za-z]{2,}(?:[ '-][A-Za-z]+)*/gu);
      if (words) englishInBangla.push(...words.map((w) => `${w} (${label(t.el)})`));
    }
  }

  return {
    pageScroll: document.documentElement.scrollHeight - vh,
    mainScroll: main ? main.scrollHeight - main.clientHeight : 0,
    sidewaysDoc: document.documentElement.scrollWidth - vw,
    sidewaysMain: main ? main.scrollWidth - main.clientWidth : 0,
    overlaps, smallText, lowContrast,
    controlsOutsideMap: controls.length,
    controlNames: controls.map(nameOf),
    coralControls, hardShadowStatic,
    emptyAreaPx2,
    emptyAreaPct: Math.round((emptyAreaPx2 / (vw * vh)) * 1000) / 10,
    englishInBangla: [...new Set(englishInBangla)],
  };
}
