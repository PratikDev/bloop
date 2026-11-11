import { dialLayers, whatChanges } from "@/lib/art/dial";
import type { DialStop, EarthCategory, PlayMode } from "@/lib/audio/layers/types";
import { formatNumber } from "@/lib/audio/mapping";
import type { BoundT } from "@/lib/i18n";
import type { VoiceSpec } from "@/types/data-contract";

const DRIVES: Record<string, "pitch" | "rate" | "brightness" | "loudness" | "echo"> = {
  frequency: "pitch",
  dropsPerSecond: "rate",
  dropsPerStep: "rate",
  clicksPerSecond: "rate",
  cutoff: "brightness",
  gain: "loudness",
  reverbSec: "echo",
};

interface ArtNow {
  orchestra: boolean;
  stop: DialStop | null;
  playMode: PlayMode;
}

interface DataChoiceLists {
  data: string[];
  choice: string[];
}

const stopKey = (s: DialStop) => (s === 0 ? "0" : s === 1 ? "1" : "0.5");

export function dataChoice(t: BoundT, v: VoiceSpec, category: EarthCategory | null, art: ArtNow): DataChoiceLists {
  const m = v.mapping;
  const sound = t("data.text", { text: v.sound.timbre });
  if (!m || m.kind !== "continuous") return { data: [t("choices.data.none")], choice: [t("choices.timbre", { instrument: sound })] };
  const drives = DRIVES[m.output.param] ?? "pitch";
  const layers = art.stop === null ? null : dialLayers(art.stop, art.playMode, art.orchestra);
  const timbre = layers ? layers.timbre : art.orchestra;
  const instrument = timbre && category ? t(`orchestra.inst.${category}`) : sound;
  return {
    data: [t(`choices.data.${drives}`, { unit: m.input.unit }), t("choices.data.silence")],
    choice: [
      t("choices.range", { min: formatNumber(m.output.min), max: formatNumber(m.output.max), unit: m.output.unit, scale: t(`choices.scale.${m.output.scale}`) }),
      t("choices.timbre", { instrument }),
      ...(v.legend.length ? [t("choices.legend")] : []),
      ...(layers && art.stop !== null ? [t("choices.dial", { stop: t(`dial.stop.${stopKey(art.stop)}`), list: whatChanges(layers).map((k) => t(`dial.change.${k}`)).join(", ") })] : []),
    ],
  };
}
