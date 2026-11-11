"use client";

import { useCvView } from "@/hooks/use-cv-view";
import { useT } from "../AppState/use-app-state";
import { OnOffToggle } from "../OnOffToggle";

export function ChordToggle({ className }: { className?: string }) {
  const t = useT();
  const [view, setView] = useCvView();
  return <OnOffToggle label={t("cv.chord.toggle")} on={view.chord} onChange={(chord) => setView({ chord })} className={className} />;
}
