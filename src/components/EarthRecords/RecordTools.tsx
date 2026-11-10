"use client";

import { useId, useState, type ReactNode } from "react";
import { brailleLabel } from "@/a11y/aria";
import { Button } from "@/components/ui/button";
import type { BoundT, Lang } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { InfoSheet } from "../InfoSheet";

const TOOL = "h-11 rounded-full px-4 text-body";

/** Describe (layered): says the record's description at the reader's verbosity, through the app's speech mode. */
export function DescribeButton({ describe }: { describe: (t: BoundT, lang: Lang, level: "brief" | "standard" | "detailed") => string }) {
  const t = useT();
  const { state } = useAppState();
  const commands = useCommands();
  return (
    <Button variant="outline" className={TOOL} data-testid="describe-record" onClick={() => void commands.say((tt, lang) => describe(tt, lang, state.verbosity))}>
      {t("earth.describe")}
    </Button>
  );
}

/** The record's braille value line: ASCII and Western digits, short (src/a11y/brailleText.ts rules). */
export function BrailleLine({ line }: { line: string }) {
  const t = useT();
  return (
    <p className="text-small text-haze">
      {t("earth.braille")}:{" "}
      <output lang="en" data-testid="braille-line" className="font-mono text-moon" {...brailleLabel(line)}>
        {line}
      </output>
    </p>
  );
}

/** Liner notes in a sheet: plain lines, most important first. */
export function LinerNotes({ lines }: { lines: readonly string[] }) {
  const t = useT();
  return (
    <InfoSheet title={t("earth.liner")} trigger={t("earth.liner")} triggerClassName={`${TOOL} text-haze ring-1 ring-glass-edge`}>
      <div className="space-y-1.5 text-body" data-testid="liner-notes">
        {lines.map((l, i) => (l ? <p key={i}>{l}</p> : <hr key={i} className="border-tide" />))}
      </div>
    </InfoSheet>
  );
}

/** "View as table": a button that shows and hides the record's table below it. */
export function TableToggle({ children, label }: { children: ReactNode; label?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="space-y-2">
      <Button variant="ghost" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`${TOOL} -ml-3 text-moon hover:bg-tide`}>
        {label && !open ? label : t(open ? "earth.hideTable" : "earth.viewTable")}
      </Button>
      <div id={id} hidden={!open}>
        {open && children}
      </div>
    </div>
  );
}
