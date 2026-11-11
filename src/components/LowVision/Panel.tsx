"use client";

import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatFixed, formatInteger, type MessageKey } from "@/lib/i18n";
import { contrast, TEXT_AAA } from "@/lib/low-vision/contrast";
import {
  BAND_COUNTS,
  BANGLA_FONTS,
  COASTS,
  CONTROL_SIZES,
  DIMS,
  FONTS,
  isHex,
  LENS_PLACES,
  LENS_SIZES,
  MEASURES,
  SCHEMES,
  SPACINGS,
  TEXT_SCALES,
  THEMES,
  type LowVision,
} from "@/lib/low-vision/settings";
import { readingText } from "@/lib/reading";
import { cn } from "@/lib/utils";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { OnOffToggle } from "../OnOffToggle";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { LV_PANEL_ID } from "./HeaderButtons";
import { LvLegend } from "./Legend";

type StringKey = { [K in keyof LowVision]: LowVision[K] extends string ? (K extends "customText" | "customBackground" ? never : K) : never }[keyof LowVision];
type NumberKey = "textScale" | "bands" | "lensSize";
type BoolKey = { [K in keyof LowVision]: LowVision[K] extends boolean ? (K extends "on" ? never : K) : never }[keyof LowVision];

const STRING_CHOICES: { [K in StringKey]: { label: MessageKey; values: readonly LowVision[K][]; option: (v: LowVision[K]) => MessageKey } } = {
  theme: { label: "lv.theme", values: THEMES, option: (v) => `lv.theme.${v}` },
  dim: { label: "lv.dim", values: DIMS, option: (v) => `lv.dim.${v}` },
  controls: { label: "lv.controls", values: CONTROL_SIZES, option: (v) => `lv.controls.${v}` },
  font: { label: "lv.font", values: FONTS, option: (v) => `lv.font.${v}` },
  banglaFont: { label: "lv.banglaFont", values: BANGLA_FONTS, option: (v) => `lv.banglaFont.${v}` },
  spacing: { label: "lv.spacing", values: SPACINGS, option: (v) => `lv.spacing.${v}` },
  measure: { label: "lv.measure", values: MEASURES, option: (v) => `lv.measure.${v}` },
  scheme: { label: "lv.scheme", values: SCHEMES, option: (v) => `lv.scheme.${v}` },
  coast: { label: "lv.coast", values: COASTS, option: (v) => `lv.coast.${v}` },
  lensPlace: { label: "lv.lensPlace", values: LENS_PLACES, option: (v) => `lv.lensPlace.${v}` },
};

const BOOL_LABEL = {
  cities: "lv.cities",
  lens: "lv.lens",
  edges: "lv.edges",
  calm: "lv.calm",
  compact: "lv.compact",
  largeCursor: "lv.largeCursor",
  speakDwell: "lv.speakDwell",
} as const satisfies Record<BoolKey, MessageKey>;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-plate border border-line p-3">
      <legend className="px-1 text-lead font-semibold text-moon">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Low-vision settings (accessibility core, step 8; spec 4.3–4.7), inline under the header (never a full-screen
 * pop-up), with a live preview: the value at the needle in the chosen text, and the map's legend. Each change applies
 * at once and is remembered on this device; Reset puts every setting back.
 */
export function LowVisionPanel({ onClose, className }: { onClose: () => void; className?: string }) {
  const { state, dispatch } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const shown = useShownPoint();
  const lv = state.lowVision;
  const set = (patch: Partial<LowVision>) => dispatch({ type: "setLowVision", patch });
  const common = { showLabel: true, className: "w-full", itemClassName: "flex-1" } as const;

  const pick = <K extends StringKey>(k: K) => {
    const c = STRING_CHOICES[k];
    return (
      <ChoiceGroup<LowVision[K]>
        {...common}
        label={t(c.label)}
        options={c.values.map((value) => ({ value, label: t(c.option(value)) }))}
        value={lv[k]}
        onChange={(value) => set({ [k]: value } as Partial<LowVision>)}
      />
    );
  };
  const pickNumber = <K extends NumberKey>(k: K, label: MessageKey, values: readonly LowVision[K][], option: (v: LowVision[K]) => string) => (
    <ChoiceGroup
      {...common}
      label={t(label)}
      options={values.map((v) => ({ value: String(v), label: option(v) }))}
      value={String(lv[k])}
      onChange={(v) => set({ [k]: Number(v) } as Partial<LowVision>)}
    />
  );
  const toggle = (k: BoolKey) => <OnOffToggle label={t(BOOL_LABEL[k])} on={lv[k]} onChange={(on) => set({ [k]: on } as Partial<LowVision>)} />;
  const ratio = contrast(lv.customText, lv.customBackground);
  const ratioText = formatFixed(ratio, state.lang, 1);

  return (
    <section id={LV_PANEL_ID} data-testid="lv-settings" aria-labelledby="lv-settings-title" className={cn("surface-glass max-h-[70dvh] overflow-y-auto rounded-plate p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="lv-settings-title" className="text-title font-semibold text-moon">
          {t("lv.settings")}
        </h2>
        <Button variant="ghost" size="icon-lg" aria-label={t("lv.close")} onClick={onClose} className="size-11">
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <div data-testid="lv-preview" className="mb-4 space-y-2 rounded-plate border-2 border-shapla p-3">
        <p className="text-small text-haze">{t("lv.preview")}</p>
        <p className="text-lead text-moon">{shown.reading ? readingText(t, shown.reading, shown.track) : t("lv.lens.none")}</p>
        <LvLegend />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Group title={t("lv.section.look")}>
          {pick("theme")}
          {lv.theme === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              {(["customText", "customBackground"] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1 text-body text-moon">
                  {t(k === "customText" ? "lv.customText" : "lv.customBackground")}
                  <input type="color" value={lv[k]} onChange={(e) => isHex(e.target.value) && set({ [k]: e.target.value })} className="h-11 w-full rounded-lg border border-line bg-transparent" />
                </label>
              ))}
              <p role="status" className={cn("col-span-2 text-body", ratio < TEXT_AAA ? "font-semibold text-moon" : "text-haze")}>
                {ratio < TEXT_AAA ? t("lv.customLow", { ratio: ratioText }) : t("lv.customContrast", { ratio: ratioText })}
              </p>
            </div>
          )}
          {pick("dim")}
        </Group>
        <Group title={t("lv.section.text")}>
          {pickNumber("textScale", "lv.textScale", TEXT_SCALES, (v) => t("lv.textScale.value", { pct: formatInteger(v, state.lang) }))}
          {pick("controls")}
          {pick("font")}
          {pick("banglaFont")}
          {pick("spacing")}
          {pick("measure")}
        </Group>
        <Group title={t("lv.section.map")}>
          {pick("scheme")}
          {pickNumber("bands", "lv.bands", BAND_COUNTS, (v) => (v === 0 ? t("lv.bands.0") : t("lv.bands.n", { n: formatInteger(v, state.lang) })))}
          {pick("coast")}
          {toggle("cities")}
          {toggle("speakDwell")}
        </Group>
        <Group title={t("lv.section.lens")}>
          {toggle("lens")}
          {pickNumber("lensSize", "lv.lensSize", LENS_SIZES, (v) => t("lv.lensSize.value", { px: formatInteger(v, state.lang) }))}
          {pick("lensPlace")}
          {toggle("edges")}
        </Group>
        <Group title={t("lv.section.layout")}>
          {toggle("calm")}
          {toggle("compact")}
          {toggle("largeCursor")}
        </Group>
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          dispatch({ type: "resetLowVision" });
          announce(t("lv.resetDone"));
        }}
      >
        {t("lv.reset")}
      </Button>
    </section>
  );
}
