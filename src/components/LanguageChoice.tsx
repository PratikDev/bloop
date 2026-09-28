"use client";

import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import type { Choice } from "./ChoiceGroup";
import { useCommands } from "./Commands/use-commands";

/**
 * EN / বাংলা: one button that shows the other language, in that language, and
 * switches to it. Its name says what it is for ("Language: …").
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
    <Button
      variant="ghost"
      title={t("settings.language")}
      onClick={() => commands.setLang(other.value)}
      className="h-11 rounded-full px-3 text-body text-haze hover:text-moon"
    >
      <span lang={other.lang}>{other.label}</span>
    </Button>
  );
}
