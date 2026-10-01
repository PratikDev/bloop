"use client";

import { Link } from "@tanstack/react-router";
import { MusicNotesSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { SignalMark } from "../SignalMark";

/** The name (home link) and the Jukebox motif beside it. */
export function Brand() {
  const t = useT();
  const commands = useCommands();
  return (
    <div className="flex items-center gap-1">
      <Link to="/" aria-label={t("nav.home")} className="flex h-11 items-center gap-2.5 rounded-lg pr-2">
        <SignalMark className="size-7" />
        <span aria-hidden="true" className="font-serif text-title leading-none italic">
          {/* Below 360 px only the mark shows, so the bar fits (the link keeps its full name). */}
          <span className="hidden min-[22.5rem]:inline lg:hidden">{t("app.titleShort")}</span>
          <span className="hidden lg:inline">{t("app.title")}</span>
        </span>
      </Link>
      <Button variant="ghost" size="icon-lg" onClick={commands.playMotif} aria-label={t("motif.play")} className="size-11 text-haze hover:text-moon">
        <MusicNotesSimple aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}
