export const THEMES = ["app", "auto", "hcDark", "hcLight", "custom"] as const;
export const DIMS = ["off", "dim", "dimmer"] as const;
export const TEXT_SCALES = [100, 125, 150, 200, 250, 300] as const;
export const CONTROL_SIZES = ["normal", "large", "xl"] as const;
export const FONTS = ["default", "atkinson"] as const;
export const BANGLA_FONTS = ["default", "noto", "hind"] as const;
export const SPACINGS = ["normal", "wide"] as const;
export const MEASURES = ["normal", "narrow"] as const;
export const SCHEMES = ["original", "luminance", "cividis", "twoTone"] as const;
export const BAND_COUNTS = [0, 5, 7, 10] as const;
export const COASTS = ["normal", "thick"] as const;
export const LENS_SIZES = [240, 320, 420, 560] as const;
export const LENS_PLACES = ["follow", "topLeft", "topRight", "bottomLeft", "bottomRight", "docked"] as const;

export type Theme = (typeof THEMES)[number];
export type Dim = (typeof DIMS)[number];
type TextScale = (typeof TEXT_SCALES)[number];
type ControlSize = (typeof CONTROL_SIZES)[number];
export type Font = (typeof FONTS)[number];
type BanglaFont = (typeof BANGLA_FONTS)[number];
type Spacing = (typeof SPACINGS)[number];
export type Measure = (typeof MEASURES)[number];
export type Scheme = (typeof SCHEMES)[number];
export type BandCount = (typeof BAND_COUNTS)[number];
type Coast = (typeof COASTS)[number];
type LensSize = (typeof LENS_SIZES)[number];
export type LensPlace = (typeof LENS_PLACES)[number];

type Hex = `#${string}`;
const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is Hex => typeof v === "string" && HEX.test(v);

export interface LowVision {
  on: boolean;
  theme: Theme;
  customText: Hex;
  customBackground: Hex;
  dim: Dim;
  textScale: TextScale;
  controls: ControlSize;
  font: Font;
  banglaFont: BanglaFont;
  spacing: Spacing;
  measure: Measure;
  scheme: Scheme;
  bands: BandCount;
  coast: Coast;
  cities: boolean;
  lens: boolean;
  lensSize: LensSize;
  lensPlace: LensPlace;
  edges: boolean;
  calm: boolean;
  compact: boolean;
  largeCursor: boolean;
  speakDwell: boolean;
}

type LowVisionKey = keyof LowVision;

const LV_VALUES = {
  theme: THEMES,
  dim: DIMS,
  textScale: TEXT_SCALES,
  controls: CONTROL_SIZES,
  font: FONTS,
  banglaFont: BANGLA_FONTS,
  spacing: SPACINGS,
  measure: MEASURES,
  scheme: SCHEMES,
  bands: BAND_COUNTS,
  coast: COASTS,
  lensSize: LENS_SIZES,
  lensPlace: LENS_PLACES,
} as const satisfies Partial<{ [K in LowVisionKey]: readonly LowVision[K][] }>;

const BOOLEANS = ["on", "cities", "lens", "edges", "calm", "compact", "largeCursor", "speakDwell"] as const satisfies readonly LowVisionKey[];
const COLOURS = ["customText", "customBackground"] as const satisfies readonly LowVisionKey[];

export const LV_DEFAULTS: LowVision = {
  on: false,
  theme: "app",
  customText: "#ffff00",
  customBackground: "#000000",
  dim: "off",
  textScale: 100,
  controls: "normal",
  font: "default",
  banglaFont: "default",
  spacing: "normal",
  measure: "normal",
  scheme: "original",
  bands: 0,
  coast: "normal",
  cities: false,
  lens: false,
  lensSize: 320,
  lensPlace: "follow",
  edges: false,
  calm: false,
  compact: false,
  largeCursor: false,
  speakDwell: false,
};

const LV_PRESET: Partial<LowVision> = {
  theme: "hcDark",
  textScale: 150,
  controls: "large",
  calm: true,
  lens: true,
  scheme: "luminance",
  bands: 7,
  coast: "thick",
  cities: true,
};

export function applyPreset(lv: LowVision, on: boolean): LowVision {
  const keys = Object.keys(LV_PRESET) as (keyof typeof LV_PRESET)[];
  const patch = Object.fromEntries(keys.map((k) => [k, on ? LV_PRESET[k] : LV_DEFAULTS[k]]));
  return { ...lv, ...patch, on };
}

const LV_STORAGE_KEY = "bloop.lowvision.v1";

function parseLowVision(raw: unknown): LowVision {
  const out: LowVision = { ...LV_DEFAULTS };
  if (typeof raw !== "object" || raw === null) return out;
  const saved = raw as Record<string, unknown>;
  const set = <K extends LowVisionKey>(k: K, v: LowVision[K]) => {
    out[k] = v;
  };
  for (const [k, values] of Object.entries(LV_VALUES) as [keyof typeof LV_VALUES, readonly (string | number)[]][]) {
    const v = values.find((x) => x === saved[k]);
    if (v !== undefined) set(k, v as LowVision[typeof k]);
  }
  for (const k of BOOLEANS) if (typeof saved[k] === "boolean") set(k, saved[k]);
  for (const k of COLOURS) if (isHex(saved[k])) set(k, saved[k]);
  return out;
}

export function readLowVision(): LowVision {
  try {
    return parseLowVision(JSON.parse(localStorage.getItem(LV_STORAGE_KEY) ?? "{}"));
  } catch {
    return { ...LV_DEFAULTS };
  }
}

export function writeLowVision(lv: LowVision): void {
  try {
    localStorage.setItem(LV_STORAGE_KEY, JSON.stringify(lv));
  } catch {
  }
}

export function nextLensSize(size: LensSize, dir: 1 | -1): LensSize {
  const i = LENS_SIZES.indexOf(size);
  return LENS_SIZES[Math.max(0, Math.min(LENS_SIZES.length - 1, i + dir))];
}

export const recoloured = (lv: Pick<LowVision, "scheme" | "bands">) => lv.scheme !== "original" || lv.bands !== 0;
