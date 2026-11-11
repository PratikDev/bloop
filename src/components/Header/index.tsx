"use client";

import { useState } from "react";
import { Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { LanguageChoice } from "../LanguageChoice";
import { LowVisionButtons } from "../LowVision/HeaderButtons";
import { LowVisionPanel } from "../LowVision/Panel";
import { Brand } from "./Brand";
import { HEADER_KEY } from "./header-key";
import { SettingsMenu } from "./SettingsMenu";
import { TuningDial } from "./TuningDial";

/**
 * One slim bar on every page: the name, the pages as pills,
 * then language, Settings and Help (always there; they don't count toward a page's controls). Below 1024 px the dial gets its own row.
 * It keeps its own view-transition name, so it stays still while pages retune.
 */
export function Header() {
  const t = useT();
  const commands = useCommands();
  const [lvOpen, setLvOpen] = useState(false);
  return (
    <header className="relative z-(--layer-header) grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 px-4 [view-transition-name:header] lg:grid-cols-[1fr_auto_1fr] lg:px-8">
      <Brand />
      <TuningDial className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1" />
      <div className="col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-2 lg:col-start-3 lg:flex-nowrap">
        <LanguageChoice />
        {FLAGS.lowVision && <LowVisionButtons open={lvOpen} onOpenChange={setLvOpen} />}
        <SettingsMenu />
        <Button variant="ghost" size="icon-lg" onClick={commands.openHelp} aria-label={t("help.open")} className={HEADER_KEY}>
          <Question aria-hidden="true" className="size-5" />
        </Button>
      </div>
      {FLAGS.lowVision && lvOpen && <LowVisionPanel onClose={() => setLvOpen(false)} className="col-span-full mt-2" />}
    </header>
  );
}
