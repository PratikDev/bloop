"use client";

import { useId, useState } from "react";
import { brailleLabel } from "@/a11y/aria";
import { wrapText } from "@/a11y/brailleText";
import { Button } from "@/components/ui/button";
import { useBrailleSettings } from "@/hooks/use-braille-settings";
import { useT } from "./AppState/use-app-state";

/**
 * A "braille-friendly text" view of a block of text (a record's liner notes): plain lines, front-loaded,
 * wrapped at the reader's display width (the explorer's setting), downloadable as UTF-8 .txt for a note-taker.
 */
export function BrailleTextView({ lines, filename }: { lines: readonly string[]; filename: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [settings] = useBrailleSettings();
  const id = useId();
  const text = open ? wrapText(lines, settings.width).join("\n") : "";

  function download() {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="h-11" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((o) => !o)}>
        {t("braille.txt.show")}
      </Button>
      {open && (
        <div id={id} className="space-y-2">
          <p className="text-small text-haze">{t("braille.txt.note")}</p>
          <textarea readOnly value={text} rows={Math.min(12, text.split("\n").length)} cols={settings.width} aria-label={t("braille.txt.heading")}
            spellCheck={false} className="w-full rounded-md border border-line bg-night px-3 py-2 font-mono text-body text-moon" />
          <Button variant="outline" className="h-11" onClick={download} {...brailleLabel(t("braille.bl.save"))}>
            {t("braille.txt.download")}
          </Button>
        </div>
      )}
    </div>
  );
}
