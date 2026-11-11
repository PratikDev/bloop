"use client";

import type { ReactNode } from "react";
import { useArtSettings } from "@/hooks/use-art-settings";
import { useCvView } from "@/hooks/use-cv-view";
import { chordLayer, chordOptedIn } from "@/lib/art/chord-hook";
import { dialLayers, whatChanges, type DialLayers } from "@/lib/art/dial";
import { droneColour } from "@/lib/art/layers";
import { orchestraOn, type PlayContext } from "@/lib/art/settings";
import { DIAL_STOPS, type DialStop } from "@/lib/audio/layers/types";
import type { BoundT } from "@/lib/i18n";
import { FLAGS } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { useCommands } from "../../Commands/use-commands";

const STOP_KEYS = { "0": 0, "0.5": 0.5, "1": 1 } as const satisfies Record<string, DialStop>;
type StopKey = keyof typeof STOP_KEYS;
const keyOf = (s: DialStop): StopKey => (s === 0 ? "0" : s === 1 ? "1" : "0.5");

export function chordText(t: BoundT, layers: DialLayers, context: PlayContext | null): string | null {
  if (!layers.bed) return null;
  if (context && context.playMode !== "single") return t("dial.chord.off");
  if (!layers.chord) return null;
  const chord = chordLayer();
  if (!chord) return t("dial.chord.none");
  if (!chordOptedIn()) return t("dial.chord.optIn");
  if (!context) return null;
  const gate = chord.gate({ recordId: context.recordId, playMode: context.playMode });
  return gate.allowed || gate.block === null ? null : t("dial.chord.blocked", { why: t(`dial.chord.why.${gate.block}`) });
}

function dialLines(t: BoundT, layers: DialLayers, context: PlayContext | null): string[] {
  const list = whatChanges(layers).map((k) => t(`dial.change.${k}`)).join(", ");
  const lines = [t("dial.unchanged"), t("dial.whatChanges", { list })];
  const chord = chordText(t, layers, context);
  if (chord) lines.push(chord);
  if (layers.drone) lines.push(t("dial.season", { colour: t(`dial.season.${droneColour(context?.month ?? null)}`) }));
  return lines;
}

export function ArtDial({ className, children }: { className?: string; children?: ReactNode }) {
  const t = useT();
  const commands = useCommands();
  const [art, setArt] = useArtSettings();
  useCvView();
  if (!FLAGS.artDial) return null;
  const layers = dialLayers(art.dial, art.context?.playMode ?? "single", orchestraOn(art));
  const choose = (key: StopKey) => {
    const dial = STOP_KEYS[key];
    setArt({ dial });
    const stop = (bt: BoundT) => bt(`dial.stop.${keyOf(dial)}`);
    void commands.say((bt) => bt("dial.announce", { stop: stop(bt) }), null, (bt) => bt("dial.braille", { stop: stop(bt) }));
  };
  return (
    <div className={cn("space-y-2", className)} data-testid="art-dial" data-dial={art.dial} data-layers={whatChanges(layers).join(" ")}>
      <ChoiceGroup
        showLabel
        label={t("dial.label")}
        className="w-full"
        itemClassName="flex-1"
        value={keyOf(art.dial)}
        onChange={choose}
        options={DIAL_STOPS.map((s) => ({ value: keyOf(s), label: t(`dial.stop.${keyOf(s)}`), brailleLabel: t(`dial.stopHint.${keyOf(s)}`) }))}
      />
      <div className="space-y-1 px-1 text-small" data-testid="dial-lines">
        {dialLines(t, layers, art.context).map((line) => (
          <p key={line} className="text-moon">
            {line}
          </p>
        ))}
        <p className="text-haze">{t("dial.artistic")}</p>
      </div>
      {children}
    </div>
  );
}
