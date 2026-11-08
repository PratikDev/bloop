// Feature flags for the remaining-features build (docs/accessibility/CORE_PLAN.md). NEXT_PUBLIC_<NAME>=1 turns a flag
// on and =0 off. Unset, a flag is on in development and in Vercel preview builds, and in production only once its
// feature's tests pass (`ready`), so the app stays recordable while a feature is being built.
// Next inlines NEXT_PUBLIC_ variables only where they are read by their full name, so each flag reads its own.

/** Vercel sets NEXT_PUBLIC_VERCEL_ENV ("production" | "preview" | "development") when system variables are exposed. */
const PREVIEW = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

/** A flag's value: the variable when set, else on in dev/preview, and in production once `ready`. */
export function flag(value: string | undefined, ready: boolean, preview: boolean = PREVIEW): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return preview || ready;
}

export const FLAGS = {
  /** Accessibility core, step 1: speech mode, verbosity, text/sound/both (docs/accessibility/CORE_PLAN.md). */
  // Ready on 8 Nov 2026: e2e/a11y/speech-choices.e2e.ts 10/10 and the whole suite 250/250 with it on.
  speechChoices: flag(process.env.NEXT_PUBLIC_A11Y_SPEECH, true),
  /** Step 2: the map widget's keys (+/−, J then 1–9, ., PageUp/PageDown, D, Shift+D), hide 3D, help while focused. */
  mapKeys: flag(process.env.NEXT_PUBLIC_A11Y_MAP_KEYS, false),
} as const;
