"use client";

import { Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { LanguageChoice } from "../LanguageChoice";
import { Brand } from "./Brand";
import { SettingsMenu } from "./SettingsMenu";
import { TuningDial } from "./TuningDial";

/**
 * One slim bar on every page: the name, the tuning dial (the three pages),
 * then language, settings and help. Below 1024 px the dial gets its own row.
 * It keeps its own view-transition name, so it stays still while pages retune.
 */
export function Header() {
  const t = useT();
  const commands = useCommands();
  return (
    <header className="relative z-(--layer-header) grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-2 pt-2 [view-transition-name:header] sm:gap-x-4 sm:px-3 md:px-5 lg:grid-cols-[1fr_auto_1fr] lg:py-2">
      <Brand />
      <TuningDial className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1" />
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 lg:col-start-3">
        <LanguageChoice />
        <SettingsMenu />
        <Button variant="ghost" size="icon-lg" onClick={commands.openHelp} aria-label={t("help.open")} className="size-11 text-haze hover:text-moon">
          <Question aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </header>
  );
}
