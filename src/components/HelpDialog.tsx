"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { useCommands } from "./Commands/use-commands";
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
  { key: "U", action: "key.u.action" },
  { key: "B", action: "key.b.action" },
  { key: "R", action: "key.r.action" },
  { key: "H, ?", action: "key.h.action" },
  { key: "key.esc", action: "key.esc.action" },
];

/** The map widget's keys with the accessibility core's step 2 (docs/accessibility/CORE_PLAN.md): D describes here,
 *  Shift+D keeps Describe mode, and + / −, J then 1–9, "." and Page Up / Page Down join after the arrows. */
const CORE_KEYS: KeyRow[] = KEYS.flatMap((row): KeyRow[] => {
  if (row.key === "key.arrows")
    return [
      row,
      { key: "+ / −", action: "key.cell.action" },
      { key: "key.regions", action: "key.regions.action" },
      { key: ".", action: "key.back.action" },
      { key: "key.frames", action: "key.frames.action" },
    ];
  if (row.key === "D") return [{ key: "D", action: "key.d.here.action" }, { key: "Shift+D", action: "key.shiftD.action" }];
  if (row.key === "P" && FLAGS.tuning) return [row, { key: "Shift+P", action: "key.shiftP.action" }];
  return [row];
});

/** Turntable keys that differ from the map's; the other letters work there too. */
const TURNTABLE_KEYS: { key: string | TurntableKey; action: TurntableKey }[] = [
  { key: "key.tt.leftRight", action: "key.tt.leftRight.action" },
  { key: "key.tt.upDown", action: "key.tt.upDown.action" },
  { key: "Space", action: "key.tt.space.action" },
  { key: "Enter", action: "key.tt.enter.action" },
  { key: "I", action: "key.tt.details.action" },
  { key: "Shift+D", action: "key.tt.dock.action" },
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

/** The scenes' keys (SceneShell's shared keys, then each scene's own), named by the scenes' sleeves. */
const SCENE_KEYS: { key: TurntableKey; action: TurntableKey }[] = [
  { key: "key.sc.all", action: "key.sc.all.action" },
  { key: "scenes.ghost.sleeve", action: "key.sc.ghost.action" },
  { key: "scenes.delta.sleeve", action: "key.sc.delta.action" },
  { key: "scenes.terrain.sleeve", action: "key.sc.terrain.action" },
  { key: "scenes.tunnel.sleeve", action: "key.sc.tunnel.action" },
];

function KeyTable({ rows, caption, translate, lang }: { rows: KeyRow[]; caption?: string; translate?: (k: MessageKey) => string; lang?: string }) {
  const t = useT();
  const tr = translate ?? ((k: MessageKey) => t(k));
  const label = (k: string | MessageKey) => (k.startsWith("key.") || k.startsWith("scenes.") ? tr(k as MessageKey) : k);
  return (
    <table lang={lang} className="w-full text-body">
      {caption && <caption className="pb-2 text-left text-lead font-medium">{caption}</caption>}
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
        {rows.map((row) => (
          <tr key={row.action} className="border-t border-glass-edge">
            <td className="py-2 pr-4 align-top whitespace-nowrap">
              <kbd className="inline-block rounded-md bg-night px-2 py-0.5 font-mono text-small text-moon ring-1 ring-line">{label(row.key)}</kbd>
            </td>
            <td className="py-2 text-haze">{tr(row.action)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HelpDialog() {
  const { state, dispatch } = useAppState();
  const commands = useCommands();
  const t = useT();
  const tr = ttFor(state.lang);

  return (
    <Dialog open={state.helpOpen} onOpenChange={(open) => dispatch({ type: "setHelpOpen", open })}>
      <DialogContent closeLabel={t("inspector.close")} className="max-h-[85dvh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-10 font-serif text-headline">{t("help.title")}</DialogTitle>
          <DialogDescription className="text-body text-haze">{t("help.focusNote")}</DialogDescription>
          {FLAGS.mapKeys && <p className="text-body text-haze">{t("help.browseNote")}</p>}
        </DialogHeader>

        <KeyTable rows={FLAGS.mapKeys ? CORE_KEYS : KEYS} />
        <KeyTable
          rows={TURNTABLE_KEYS}
          caption={tr("help.turntable")}
          translate={(k) => (isTurntableKey(k) ? tr(k) : t(k))}
          lang={state.lang === "bn" ? "bn" : undefined}
        />
        <KeyTable rows={SCENE_KEYS} caption={tr("help.scenes")} translate={(k) => tr(k as TurntableKey)} lang={state.lang === "bn" ? "bn" : undefined} />

        <div className="space-y-1 border-t border-glass-edge pt-4">
          <SettingToggle setting="builtInVoice" />
          <p className="px-3 pb-1 text-small text-haze">{t("help.voiceNote")}</p>
          <SettingToggle setting="reduceMotion" />
          <SettingToggle setting="captions" />
          <SettingToggle setting="describe" />
          {FLAGS.mapKeys && <SettingToggle setting="hide3d" />}
          {FLAGS.tuning && (
            <Button
              variant="outline"
              size="lg"
              className="mt-2 h-11 w-full rounded-full"
              onClick={() => {
                dispatch({ type: "setHelpOpen", open: false });
                dispatch({ type: "startTuning" });
                commands.setMode("explore");
              }}
            >
              {t("tuning.replay")}
            </Button>
          )}
        </div>

        {/* "More below": fades the content at the bottom edge while scrolling; at the end it sits under the last row. */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -mt-4 h-8 bg-linear-to-t from-popover to-transparent" />
      </DialogContent>
    </Dialog>
  );
}
