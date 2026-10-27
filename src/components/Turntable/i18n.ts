"use client";

import { createElement, type ReactNode } from "react";
import { t, type ArgsOf, type Lang } from "@/lib/i18n";
import { turntableEn } from "@/lib/i18n/en/turntable";
import { useAppState } from "../AppState/use-app-state";
import { turntableBnDraft, type TurntableKey } from "./strings-bn";

/** The Turntable's strings in a language: its Bangla drafts first, then the app's own t() (English fallback). */
export function ttFor(lang: Lang) {
  return <K extends TurntableKey>(key: K, ...args: ArgsOf<K>): string => {
    const draft = lang === "bn" ? turntableBnDraft[key] : undefined;
    if (draft === undefined) return t(lang, key, ...args);
    if (typeof draft === "string") return draft;
    return (draft as (p: ArgsOf<K>[0]) => string)(args[0]);
  };
}

export type TT = ReturnType<typeof ttFor>;

export function isTurntableKey(key: string): key is TurntableKey {
  return key in turntableEn;
}

/** The Turntable translator for the current UI language, and the lang attribute for its root. */
export function useTT(): { tt: TT; lang: Lang; rootLang: "bn" | undefined } {
  const { state } = useAppState();
  return { tt: ttFor(state.lang), lang: state.lang, rootLang: state.lang === "bn" ? "bn" : undefined };
}

/**
 * Text that stays English inside the Bangla Turntable (the app's untranslated
 * strings, honesty wording, credits, English-only place names), marked so
 * screen readers read it with an English voice.
 */
export function En({ children, active }: { children: ReactNode; active: boolean }) {
  return active ? createElement("span", { lang: "en" }, children) : children;
}
