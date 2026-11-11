"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { audio } from "@/lib/audio-jukebox";
import { followStorm, loadSequence } from "@/lib/data";
import { earEyeItems, PEAK_OPTIONS, STEP_MS, type EarEyeRecord, type PeakOption } from "@/lib/listen-test/extras/ear-eye";
import { useT } from "../../../AppState/use-app-state";
import { StatusBadge } from "../../../StatusBadge";
import { Bars } from "./Bars";
import type { ExtraStepProps } from "./registry";

const ACTION = "h-11 rounded-full px-5 text-body";
const loadStorm = async () => followStorm(await loadSequence());

/** "When did the rain peak?": once heard, once seen (two halves of the storm, counterbalanced); answers from the data. */
export function EarEyeTask({ onDone, play, coins }: ExtraStepProps) {
  const t = useT();
  const { value: storm, error } = useLoaded(loadStorm);
  const items = useMemo(() => (storm ? earEyeItems(storm, coins[0], coins[1]) : null), [storm, coins]);
  const [i, setI] = useState(0);
  const [records, setRecords] = useState<EarEyeRecord[]>([]);
  const shownAt = useRef(0);
  const unanswerable = Boolean(error || (storm && !items));
  useEffect(() => {
    // No clear answer today (a dry storm): the task is left out, never guessed.
    if (unanswerable) onDone([]);
  }, [unanswerable, onDone]);
  useEffect(() => {
    shownAt.current = performance.now();
  }, [i, items]);
  if (unanswerable) return null;
  if (!items) return <StatusBadge kind="loading">{t("lt.loading")}</StatusBadge>;
  const item = items[i];
  // `at`: the click's own time stamp (the same clock as performance.now).
  const answer = (o: PeakOption, at: number) => {
    const all = [...records, { sense: item.sense, half: item.half, position: i + 1, answer: o, correct_answer: item.correct, correct: o === item.correct, ms: Math.round(at - shownAt.current) }];
    if (i === 0) {
      setRecords(all);
      setI(1);
    } else onDone(all);
  };
  return (
    <div className="space-y-4" data-testid="lt-ear-eye" data-sense={item.sense} data-correct={item.correct}>
      <p className="max-w-prose text-body">{t(item.sense === "sound" ? "ltx.eye.sound" : "ltx.eye.picture")}</p>
      {item.sense === "sound" ? (
        <Button variant="outline" className={ACTION}
          onClick={() => play(() => audio.playSweep(item.values.map((v, k) => ({ lat: item.lats[k], lon: item.lons[k], valueC: null, mmPerHour: v, phase: v === null ? "nodata" : v > 0 ? "liquid" : "dry" })), { stepMs: STEP_MS }))}>
          <Play aria-hidden="true" weight="fill" />
          {t("ltx.eye.listen")}
        </Button>
      ) : (
        <Bars values={item.values} label={t("ltx.eye.chart")} />
      )}
      <p className="text-lead" id="ltx-eye-q">{t("ltx.eye.question")}</p>
      <div role="group" aria-labelledby="ltx-eye-q" className="flex flex-wrap gap-2">
        {PEAK_OPTIONS.map((o) => (
          <Button key={o} className={`${ACTION} bg-tide text-moon`} data-option={o} onClick={(e) => answer(o, e.timeStamp)}>
            {t(`ltx.eye.${o}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
