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
      <DialogContent closeLabel={t("inspector.close")} className="max-h-[85dvh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-10 font-serif text-headline">{t("help.title")}</DialogTitle>
          <DialogDescription className="text-body text-haze">{t("help.focusNote")}</DialogDescription>
        </DialogHeader>

        <table className="w-full text-body">
          <thead>
            <tr>
              <th scope="col" className="eyebrow pb-2 text-left font-normal">
                {t("help.keyColumn")}
              </th>
              <th scope="col" className="eyebrow pb-2 text-left font-normal">
                {t("help.actionColumn")}
              </th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((row) => (
              <tr key={row.action} className="border-t border-glass-edge">
                <td className="py-2 pr-4 align-top whitespace-nowrap">
                  <kbd className="inline-block rounded-md bg-night px-2 py-0.5 font-mono text-small text-moon ring-1 ring-line">{label(row.key)}</kbd>
                </td>
                <td className="py-2 text-haze">{t(row.action)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-glass-edge pt-4">
          <SettingToggle setting="builtInVoice" />
          <p className="px-3 pb-1 text-small text-haze">{t("help.voiceNote")}</p>
          <SettingToggle setting="reduceMotion" />
          <SettingToggle setting="captions" />
          <SettingToggle setting="describe" />
        </div>

        <ComingInOctober />
        {/* "More below": fades the content at the bottom edge while scrolling; at the end it sits under the last row. */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -mt-4 h-8 bg-linear-to-t from-popover to-transparent" />
      </DialogContent>
    </Dialog>
  );
}
