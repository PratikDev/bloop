"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { ComingInOctober } from "./ComingInOctober";
import { SettingToggle } from "./SettingToggle";
import { isTurntableKey, ttFor } from "./Turntable/i18n";
import type { TurntableKey } from "./Turntable/strings-bn";

type KeyRow = { key: string | MessageKey; action: MessageKey };

/** Keys shown in Help (plan §9.3). Letters are literal key names, not translated. */
const KEYS: KeyRow[] = [
  { key: "key.arrows", action: "key.arrows.action" },
  { key: "Enter", action: "key.enter.action" },
  { key: "key.space", action: "key.space.action" },
  { key: "S", action: "key.s.action" },
  { key: "1 / 2 / 3", action: "key.123.action" },
  { key: "M", action: "key.m.action" },
  { key: "D", action: "key.d.action" },
  { key: "C", action: "key.c.action" },
  { key: "T", action: "key.t.action" },
  { key: "L", action: "key.l.action" },
  { key: "P", action: "key.p.action" },
  { key: "X", action: "key.x.action" },
  { key: "H, ?", action: "key.h.action" },
  { key: "key.esc", action: "key.esc.action" },
];

/** Turntable keys that differ from the map's; the other letters work there too. */
const TURNTABLE_KEYS: { key: string | TurntableKey; action: TurntableKey }[] = [
  { key: "key.tt.leftRight", action: "key.tt.leftRight.action" },
  { key: "key.tt.upDown", action: "key.tt.upDown.action" },
  { key: "Space", action: "key.tt.space.action" },
  { key: "Enter", action: "key.tt.enter.action" },
  { key: "R / Shift+R", action: "key.tt.r.action" },
  { key: "/ , G", action: "key.tt.search.action" },
  { key: "L", action: "key.tt.where.action" },
  { key: "1 – 9", action: "key.tt.bookmarks.action" },
  { key: "T", action: "key.tt.tour.action" },
  { key: "+ / −", action: "key.tt.zoom.action" },
  { key: "[ / ]", action: "key.tt.speed.action" },
  { key: "V", action: "key.tt.view.action" },
  { key: "O", action: "key.tt.opacity.action" },
  { key: "Esc", action: "key.tt.esc.action" },
];

function KeyTable({ rows, caption, translate, lang }: { rows: KeyRow[]; caption?: string; translate?: (k: MessageKey) => string; lang?: string }) {
  const t = useT();
  const tr = translate ?? ((k: MessageKey) => t(k));
  const label = (k: string | MessageKey) => (k.startsWith("key.") ? tr(k as MessageKey) : k);
  return (
    <table lang={lang} className="w-full text-body">
      {caption && <caption className="pb-2 text-left text-lead font-medium">{caption}</caption>}
      <thead className="text-small text-haze">
        <tr>
          <th scope="col" className="pb-2 text-left font-medium">{t("help.keyColumn")}</th>
          <th scope="col" className="pb-2 text-left font-medium">{t("help.actionColumn")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.action} className="border-t border-tide">
            <td className="py-1.5 pr-4 align-top font-medium whitespace-nowrap">{label(row.key)}</td>
            <td className="py-1.5 text-haze">{tr(row.action)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HelpDialog() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const tr = ttFor(state.lang);

  return (
    <Dialog open={state.helpOpen} onOpenChange={(open) => dispatch({ type: "setHelpOpen", open })}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-title">{t("help.title")}</DialogTitle>
          <DialogDescription className="text-body text-haze">{t("help.focusNote")}</DialogDescription>
        </DialogHeader>

        <KeyTable rows={KEYS} />
        <KeyTable
          rows={TURNTABLE_KEYS}
          caption={tr("help.turntable")}
          translate={(k) => (isTurntableKey(k) ? tr(k) : t(k))}
          lang={state.lang === "bn" ? "bn" : undefined}
        />

        <div className="space-y-3 border-t border-tide pt-4">
          <SettingToggle setting="builtInVoice" />
          <p className="text-small text-haze">{t("help.voiceNote")}</p>
          <SettingToggle setting="reduceMotion" />
          <SettingToggle setting="captions" />
          {/* The top bar shows Describe only on wide screens; here it's reachable everywhere. */}
          <SettingToggle setting="describe" />
        </div>

        <ComingInOctober />
      </DialogContent>
    </Dialog>
  );
}
