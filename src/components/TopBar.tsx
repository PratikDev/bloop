"use client";

import { CircleHelp, Music2, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { ChoiceGroup } from "./ChoiceGroup";
import { useCommands } from "./Commands/use-commands";
import { ModeTabs } from "./ModeTabs";
import { SettingToggle } from "./SettingToggle";
import { TrackChoice } from "./TrackChoice";

export function TopBar() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-dusk px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-lg" onClick={commands.playMotif} aria-label={t("motif.play")} className="size-11">
          <Music2 aria-hidden="true" />
        </Button>
        <h1 className="text-lead font-semibold md:text-title">{t("app.title")}</h1>
      </div>

      <ModeTabs className="order-last w-full md:order-none md:w-auto" />

      <TrackChoice className="hidden xl:flex" />

      <div className="ml-auto flex items-center gap-2">
        <SettingToggle setting="describe" className="hidden h-9 px-3 text-body pointer-coarse:h-11 aria-pressed:bg-tide lg:inline-flex" />
        <ChoiceGroup<Lang>
          label={t("settings.language")}
          value={state.lang}
          onChange={commands.setLang}
          options={[
            { value: "en", label: "EN" },
            { value: "bn", label: t("lang.bn"), lang: "bn" },
          ]}
        />
        <Button variant="ghost" size="icon-lg" onClick={commands.openHelp} aria-label={t("help.open")} className="size-11">
          <CircleHelp aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => commands.openPanel(state.panel)}
          aria-label={t("panels.open")}
          className="size-11 lg:hidden"
        >
          <PanelRight aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
