"use client";

import { useState } from "react";
import { DownloadSimple, Notebook } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useBrailleSettings } from "@/hooks/use-braille-settings";
import { downloadBlob } from "@/lib/download";
import { logText } from "@/lib/expedition-log";
import { formatInteger, formatUtc } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { DockAction } from "../DockAction";

export function LogMenu() {
  const { state } = useAppState();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [{ width }] = useBrailleSettings();
  const text = logText(state.log, width, { title: t("log.title"), empty: t("log.empty"), sources: t("log.sources") }, (iso) => `${formatUtc(iso, state.lang)} UTC`);

  const download = () => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `bloop-expedition-log-${new Date().toISOString().slice(0, 10)}.txt`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<DockAction icon={<Notebook aria-hidden="true" />} full={t("log.open")} label={t("log.short")} short={t("log.short")} />} />
      <PopoverContent side="top" align="start" sideOffset={12} data-testid="log-menu" className="surface-glass w-[min(28rem,calc(100vw-1.5rem))] gap-3 rounded-plate p-4 text-body">
        <PopoverTitle className="eyebrow">{t("log.title")}</PopoverTitle>
        <p className="text-small text-haze">{t("log.width", { width: formatInteger(width, state.lang) })}</p>
        {}
        <pre
          role="region"
          aria-label={t("log.title")}
          tabIndex={0}
          data-testid="log-text"
          className="max-h-[50dvh] overflow-auto rounded-lg bg-ink/45 p-3 font-mono text-small whitespace-pre text-moon ring-1 ring-line focus-visible:ring-2 focus-visible:ring-shapla"
        >
          {text}
        </pre>
        <Button onClick={download} className="h-11 w-full gap-2 rounded-full bg-shapla text-body text-ink hover:bg-shapla/90 pointer-fine:h-9">
          <DownloadSimple aria-hidden="true" />
          {t("log.download")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
