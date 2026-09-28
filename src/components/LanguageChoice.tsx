"use client";

import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { ChoiceGroup, type Choice } from "./ChoiceGroup";
import { useCommands } from "./Commands/use-commands";

/**
 * EN / বাংলা. From 768 px: both, as a pair. On phones: one button that shows
 * the other language and switches to it, so the header fits on one row.
 */
export function LanguageChoice() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const options: readonly Choice<Lang>[] = [
    { value: "en", label: "EN" },
    { value: "bn", label: t("lang.bn"), lang: "bn" },
  ];
  const other = options.find((o) => o.value !== state.lang) ?? options[0];

  return (
    <>
      <ChoiceGroup<Lang> label={t("settings.language")} value={state.lang} onChange={commands.setLang} options={options} className="hidden md:flex" />
      <Button variant="outline" lang={other.lang} onClick={() => commands.setLang(other.value)} className="h-11 px-3 text-body md:hidden">
        {other.label}
      </Button>
    </>
  );
}
