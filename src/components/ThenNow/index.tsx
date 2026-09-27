"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { FrameLabel } from "../FrameLabel";
import { StatusBadge } from "../StatusBadge";
import { Disclosure } from "./Disclosure";
import { PartView } from "./PartView";
import { useThenNowData } from "./use-then-now-data";
import { useThenNowPlayer, type Part } from "./use-then-now-player";

const ACTION = "h-11 gap-2 px-4 text-body";

/**
 * Then vs Now (plan §11.5, the killer demo): heat, monsoon and water for
 * Dhaka, played as sound with a chart that follows it. Replaces the map on
 * the stage; the frame label stays visible in the header.
 */
export function ThenNow() {
  const { state } = useAppState();
  const t = useT();
  const data = useThenNowData();
  const ready = data.status === "ready" ? data : null;
  const player = useThenNowPlayer(ready?.input ?? null, ready?.demo ?? null);
  const [chosen, setChosen] = useState<Part>("heat");
  // While "Play all" runs, the view follows the part that is sounding.
  const part = player.soundingPart ?? chosen;
  // Keyboard users land here when the mode opens (the map they were on is gone).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasData = ready !== null;
  useEffect(() => {
    if (hasData) headingRef.current?.focus();
  }, [hasData]);

  return (
    <section className="flex min-h-0 flex-col gap-5 overflow-y-auto bg-night p-4 lg:p-6">
      <header className="space-y-2">
        <FrameLabel />
        {ready && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-title font-semibold outline-none">
              {ready.demo.title}
            </h2>
            <p className="text-lead">{ready.demo.story}</p>
          </>
        )}
        <p className="text-small text-haze">{t("thenNow.contextNote")}</p>
      </header>

      {data.status === "loading" && <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>}
      {data.status === "error" && <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>}

      {ready && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ChoiceGroup<Part>
              label={t("thenNow.parts")}
              value={part}
              onChange={setChosen}
              options={[
                { value: "heat", label: t("thenNow.part.heat") },
                { value: "monsoon", label: t("thenNow.part.monsoon") },
                { value: "water", label: t("thenNow.part.water") },
              ]}
              itemClassName="h-11"
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={!state.soundOn} onClick={() => player.playPart(part)} className={`${ACTION} bg-tide`}>
                <Play aria-hidden="true" />
                {t("thenNow.play")}
              </Button>
              <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playPart("all")} className={ACTION}>
                {t("thenNow.playAll")}
              </Button>
              {part !== "water" && (
                <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playSplit(part)} className={ACTION}>
                  <Headphones aria-hidden="true" />
                  {t("thenNow.split")}
                </Button>
              )}
              <Button variant="ghost" onClick={player.stop} className={ACTION}>
                <Square aria-hidden="true" />
                {t("thenNow.stop")}
              </Button>
            </div>
          </div>
          {!state.soundOn && <p className="text-haze">{t("thenNow.soundOff")}</p>}

          <PartView
            part={part}
            demo={ready.demo}
            grace={ready.grace}
            index={player.soundingPart === part ? player.index : null}
            splitIndex={player.splitIndex}
          />
          <Disclosure part={part} demo={ready.demo} grace={ready.grace} />

          <section className="space-y-2 text-body">
            <p className="text-haze">{ready.demo.honesty_beat}</p>
            <h3 className="font-medium">{t("disclosure.notClaimed")}</h3>
            <ul className="list-disc pl-5 text-haze">
              {ready.demo.not_claimed.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
