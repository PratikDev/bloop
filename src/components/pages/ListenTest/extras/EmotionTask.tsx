"use client";

import { useMemo, useState } from "react";
import { Play } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { audio } from "@/lib/audio-jukebox";
import { emotionClip, emotionOrder, isRating, SCALE, type EmotionRecord, type Rating } from "@/lib/listen-test/extras/emotion";
import type { SstTruthPair } from "@/types/data-contract";
import { useT } from "../../../AppState/use-app-state";
import { ChoiceGroup } from "../../../ChoiceGroup";
import { Bars } from "./Bars";
import type { ExtraStepProps } from "./registry";

const ACTION = "h-11 rounded-full px-5 text-body";

/** Two clips of the same data (one heard, one seen, counterbalanced), each followed by the two 5-point ratings. */
export function EmotionTask({ inputs, onDone, play, coins }: ExtraStepProps) {
  const t = useT();
  const order = emotionOrder(coins[0]);
  const clip = useMemo(() => emotionClip(inputs.pairs as readonly SstTruthPair[]), [inputs.pairs]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [valence, setValence] = useState<Rating | null>(null);
  const [connection, setConnection] = useState<Rating | null>(null);
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const condition = order[i];

  const show = () => {
    setShown(true);
    if (condition === "sound")
      play(() => audio.playSweep(clip.values.map((v, k) => ({ lat: clip.lats[k], lon: clip.lons[k], valueC: v, mmPerHour: null, phase: "nodata" })), { stepMs: clip.stepMs }));
  };
  const next = () => {
    if (valence === null || connection === null) return;
    const all = [...records, { condition, position: i + 1, valence, connection }];
    if (i === 0) {
      setRecords(all);
      setI(1);
      setShown(false);
      setValence(null);
      setConnection(null);
    } else onDone(all);
  };
  const scale = (key: "ltx.valence" | "ltx.connection", value: Rating | null, set: (r: Rating) => void) => (
    <ChoiceGroup<string>
      showLabel
      label={t(key)}
      value={value === null ? "" : String(value)}
      onChange={(v) => isRating(Number(v)) && set(Number(v) as Rating)}
      options={SCALE.map((r) => ({ value: String(r), label: r === 1 ? t(`${key}.1`) : r === 5 ? t(`${key}.5`) : String(r) }))}
    />
  );
  return (
    <div className="space-y-4" data-testid="lt-emotion" data-condition={condition} data-position={i + 1}>
      <p className="max-w-prose text-body">{t(condition === "sound" ? "ltx.emotion.sound" : "ltx.emotion.visual")}</p>
      <Button variant="outline" className={ACTION} onClick={show}>
        <Play aria-hidden="true" weight="fill" />
        {t(condition === "sound" ? "ltx.emotion.play" : "ltx.emotion.watch")}
      </Button>
      {shown && condition === "visual" && <Bars values={clip.values} label={t("ltx.clip.strip")} animateMs={clip.stepMs} />}
      {shown && (
        <div className="space-y-3">
          {scale("ltx.valence", valence, setValence)}
          {scale("ltx.connection", connection, setConnection)}
          <Button className={`${ACTION} bg-shapla text-ink`} disabled={valence === null || connection === null} onClick={next}>
            {t("ltx.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
