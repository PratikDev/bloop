"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePrefersContrast, usePrefersLight } from "@/hooks/use-media-query";
import { isTypingTarget } from "@/a11y/keys";
import { FLAGS } from "@/lib/flags";
import { recoloured, type LowVision, type Theme } from "@/lib/low-vision/settings";
import { useAppState } from "../AppState/use-app-state";
import { useLowVisionPreset } from "./use-low-vision-preset";

const DIM = { off: 1, dim: 0.8, dimmer: 0.6 } as const satisfies Record<LowVision["dim"], number>;
const PCT = 100;

function shownTheme(theme: Theme, prefersContrast: boolean, prefersLight: boolean): Exclude<Theme, "auto"> {
  const hc = prefersLight ? "hcLight" : "hcDark";
  if (theme === "auto") return hc;
  if (theme === "app" && prefersContrast) return hc;
  return theme;
}

export const lowVisionFlow = (lv: LowVision) =>
  FLAGS.lowVision && (lv.textScale > PCT || lv.controls !== "normal" || lv.compact || lv.spacing !== "normal" || recoloured(lv));

function attributes(lv: LowVision, theme: Exclude<Theme, "auto">): Record<string, string | undefined> {
  return {
    "data-lv-theme": theme === "app" ? undefined : theme,
    "data-lv-font": lv.font === "default" ? undefined : lv.font,
    "data-lv-bn-font": lv.banglaFont === "default" ? undefined : lv.banglaFont,
    "data-lv-spacing": lv.spacing === "normal" ? undefined : lv.spacing,
    "data-lv-measure": lv.measure === "normal" ? undefined : lv.measure,
    "data-lv-controls": lv.controls === "normal" ? undefined : lv.controls,
    "data-lv-dim": lv.dim === "off" ? undefined : lv.dim,
    "data-lv-calm": lv.calm ? "" : undefined,
    "data-lv-compact": lv.compact ? "" : undefined,
    "data-lv-cursor": lv.largeCursor ? "" : undefined,
    "data-lv-flow": lowVisionFlow(lv) ? "" : undefined,
  };
}

export function keepPointOfRegard(): void {
  const targets = [document.activeElement, document.querySelector('[data-slot="readout"]'), document.getElementById("sound-map")];
  for (const el of targets) if (el instanceof HTMLElement && el !== document.body) el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export function useApplyLowVision(): void {
  const { state } = useAppState();
  const preset = useLowVisionPreset();
  const prefersContrast = usePrefersContrast();
  const prefersLight = usePrefersLight();
  const lv = state.lowVision;
  const theme = shownTheme(lv.theme, prefersContrast, prefersLight);

  useLayoutEffect(() => {
    if (!FLAGS.lowVision) return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(attributes(lv, theme))) {
      if (value === undefined) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
    root.style.setProperty("--lv-text-scale", String(lv.textScale / PCT));
    root.style.setProperty("--lv-dim", String(DIM[lv.dim]));
    root.style.setProperty("--lv-custom-text", lv.customText);
    root.style.setProperty("--lv-custom-bg", lv.customBackground);
  }, [lv, theme]);

  const layoutKey = `${lv.textScale}|${lv.controls}|${lv.spacing}|${lv.measure}|${lv.font}|${lv.compact}|${lv.calm}`;
  useEffect(() => {
    if (!FLAGS.lowVision) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(keepPointOfRegard));
    return () => cancelAnimationFrame(id);
  }, [layoutKey]);

  useEffect(() => {
    if (!FLAGS.lowVision || !lv.on) return;
    let id = 0;
    const onResize = () => {
      cancelAnimationFrame(id);
      id = requestAnimationFrame(() => requestAnimationFrame(keepPointOfRegard));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(id);
    };
  }, [lv.on]);

  useEffect(() => {
    if (!FLAGS.lowVision) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.code !== "KeyL" || isTypingTarget(e.target)) return;
      e.preventDefault();
      preset.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preset]);
}
