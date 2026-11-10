"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { JOURNEY_STEPS, type Journey, type JourneyStepId } from "@/lib/art/journey/plan";
import { BAY } from "@/lib/art/journey/sources";
import { formatInteger, type BoundT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { StatusBadge } from "../../StatusBadge";
import { LetterCard } from "../Letter/LetterCard";
import { useListenLetter } from "../Letter/use-listen-letter";
import { useJourney } from "./use-journey";

const statusText = (t: BoundT, status: string) =>
  status === "pattern only" || status === "relative" || status === "verified" || status === "observation" || status === "model" ? t(`journey.status.${status}`) : status;

/** A step's line: its name, dataset, period and status (shown, and spoken as it starts). */
export function stepLine(t: BoundT, j: Journey, id: JourneyStepId): string {
  const s = j.steps.find((x) => x.id === id);
  return s ? t("journey.line", { name: t(`journey.step.${id}`), dataset: s.dataset, period: s.period, status: statusText(t, s.status) }) : "";
}

/**
 * Water's journey: its steps as a list (the one sounding is the current step), its dataset, period and status shown
 * and said as it starts, Play / Stop by button (keyboard and screen reader), "Play as one piece" (a WAV), and the
 * letter to the future at the end, for the Bay of Bengal.
 */
export function JourneyPanel({ onClose }: { onClose: () => void }) {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const [ended, setEnded] = useState(false);
  const onStep = useCallback((id: JourneyStepId, j: Journey) => void commands.say((bt) => stepLine(bt, j, id)), [commands]);
  const onEnd = useCallback(() => setEnded(true), []);
  const j = useJourney(onStep, onEnd);
  const bay = { lat: BAY.lat, lon: BAY.lon };
  const letter = useListenLetter(bay);
  return (
    <section aria-labelledby="journey-title" className="surface-plate space-y-3 rounded-plate p-4" data-testid="journey" data-step={j.step ?? ""} data-ended={ended}>
      <h2 id="journey-title" className="font-serif text-title">{t("journey.title")}</h2>
      <p className="text-body text-haze">{t("journey.lead")}</p>
      {!j.journey ? (
        <StatusBadge kind="loading">{t("journey.loading")}</StatusBadge>
      ) : (
        <>
          <ol className="space-y-1">
            {j.journey.steps.map((s) => (
              <li key={s.id} aria-current={j.step === s.id ? "step" : undefined} data-id={s.id} className={cn("text-small", j.step === s.id ? "text-moon" : "text-haze")}>
                {stepLine(t, j.journey!, s.id)}
              </li>
            ))}
          </ol>
          <p className="text-small text-haze">{t("journey.dial")} {t("journey.season")}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11" onClick={() => void (j.playing ? j.stop() : (setEnded(false), j.play()))}>
              {t(j.playing ? "journey.stop" : "journey.play")}
            </Button>
            <Button variant="outline" className="h-11" disabled={j.rendering} onClick={() => void j.saveWav()}>
              {t(j.rendering ? "journey.rendering" : "journey.wav")}
            </Button>
            <Button variant="ghost" className="h-11" onClick={() => { j.stop(); onClose(); }}>
              {t("journey.close")}
            </Button>
          </div>
          {j.wav && (
            <p className="text-small text-moon" data-testid="journey-wav" data-fingerprint={j.wav.id}>
              {t("journey.wavDone", { seconds: formatInteger(j.wav.seconds, state.lang), id: j.wav.id })}
            </p>
          )}
        </>
      )}
      {ended && letter && <LetterCard letter={letter.letter} lon={bay.lon} />}
    </section>
  );
}

export { JOURNEY_STEPS };
