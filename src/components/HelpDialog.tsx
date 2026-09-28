"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { ComingInOctober } from "./ComingInOctober";
import { SettingToggle } from "./SettingToggle";

/** Keys shown in Help (plan §9.3). Letters are literal key names, not translated. */
const KEYS: { key: string | MessageKey; action: MessageKey }[] = [
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

export function HelpDialog() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const label = (k: string | MessageKey) => (k.startsWith("key.") ? t(k as MessageKey) : k);

  return (
    <Dialog open={state.helpOpen} onOpenChange={(open) => dispatch({ type: "setHelpOpen", open })}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-title">{t("help.title")}</DialogTitle>
          <DialogDescription className="text-body text-haze">{t("help.focusNote")}</DialogDescription>
        </DialogHeader>

        <table className="w-full text-body">
          <thead className="text-small text-haze">
            <tr>
              <th scope="col" className="pb-2 text-left font-medium">{t("help.keyColumn")}</th>
              <th scope="col" className="pb-2 text-left font-medium">{t("help.actionColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((row) => (
              <tr key={row.action} className="border-t border-tide">
                <td className="py-1.5 pr-4 align-top font-medium whitespace-nowrap">{label(row.key)}</td>
                <td className="py-1.5 text-haze">{t(row.action)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-3 border-t border-tide pt-4">
          <SettingToggle setting="builtInVoice" />
          <p className="text-small text-haze">{t("help.voiceNote")}</p>
          <SettingToggle setting="reduceMotion" />
          <SettingToggle setting="captions" />
          {/* The top bar shows Describe only on wide screens; here it's reachable everywhere. */}
          <SettingToggle setting="describe" />
        </div>

        <ComingInOctober />
        {/* "More below": fades the content at the bottom edge while scrolling; at the end it sits under the last row. */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -mt-4 h-8 bg-linear-to-t from-popover to-transparent" />
      </DialogContent>
    </Dialog>
  );
}
