"use client";

import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import type { LatLon } from "@/lib/data";
import { Globe } from "../../Globe";
import { useFrameImages } from "../../FrameView/use-frame-images";
import { SpaceWindow } from "../../SpaceWindow";
import { PauseMotionKey } from "../../SpaceWindow/PauseMotionKey";
import { usePauseMotion } from "../../SpaceWindow/use-pause-motion";
import { formatUtcDate } from "@/lib/i18n";
import { locationForMode, PAGE_PATHS } from "@/router/modes";
import { useAppState, useT } from "../../AppState/use-app-state";
import { JukeboxFrame } from "../../JukeboxArt/Frame";
import { DataTube } from "../../JukeboxArt/DataTube";
import { armJourney } from "../../JukeboxJourney/journey-store";
import { useLiveData } from "../../LiveData/use-live-data";
import { PAPER_KEY, StartActions, StartHint } from "../../StartActions";

/** Home has one job: say what this is, then start listening. Today's real ocean frame turns inside the jukebox beside it. */
export function HomePage() {
  const { state } = useAppState();
  const { sst, fields } = useLiveData();
  const { sst: sstImage } = useFrameImages();
  const images = useMemo(() => (sstImage ? [sstImage] : []), [sstImage]);
  const pause = usePauseMotion();
  const drift = useRef<HTMLDivElement>(null);
  const t = useT();
  const navigate = useNavigate();
  const toListen = () => void navigate({ to: PAGE_PATHS.listen });
  // The point the globe faces (the Globe reports it once it is mounted in the window); null drains the amber tube.
  const [facing, setFacing] = useState<LatLon | null>(null);
  // While the intro plays, its wordmark follows the sound instead: only one at a time.
  const opening = state.started && !state.introDone;
  const toTour = () => void navigate(locationForMode("story"));

  return (
    <section aria-labelledby="home-title" className="flex min-h-full flex-col justify-center gap-6 px-4 py-6 lg:flex-row lg:items-center lg:px-8">
      <div className="min-w-0 space-y-6 lg:w-96 lg:shrink-0 xl:w-lg">
        <h1 id="home-title" data-page-title tabIndex={-1} className="display-tight font-wide-display text-hero text-moon">
          {t("home.title")}
        </h1>
        <p className="max-w-lg text-lead text-moon">{t("start.lead")}</p>
        {state.started ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to={PAGE_PATHS.listen} onClick={armJourney} className="inline-flex h-13 items-center gap-3 key border-navy rounded-full bg-shapla pr-5 pl-6 text-lead text-moon">
                {t("home.continue")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link {...locationForMode("story")} className={PAPER_KEY}>
                {t("home.tour")}
              </Link>
            </div>
            <StartHint />
          </div>
        ) : (
          <StartActions autoFocus after={toListen} onStartClick={armJourney} onTour={toTour} />
        )}
      </div>

      <div className="jukebox-home -mx-4 flex min-w-0 flex-col items-center lg:mx-0 lg:flex-1">
        <JukeboxFrame
          marquee={t("app.title")}
          reactive={!opening}
          tube={<DataTube facing={facing} paused={pause.paused} />}
          window={
            <SpaceWindow density="sparse" still={pause.paused} driftRef={drift} className="size-full rounded-full border-0">
              <Globe images={images} autoTurn paused={pause.paused} driftRef={drift} onViewChange={setFacing} dataKey={fields} />
            </SpaceWindow>
          }
          footer={
            <>
              {sst && <p className="text-center text-small text-haze">{t("home.frameCaption", { date: formatUtcDate(sst.meta.frame_time_utc, state.lang) })}</p>}
              <PauseMotionKey pause={pause} />
            </>
          }
        />
        <p className="sr-only">{t("globe.home")}</p>
      </div>
    </section>
  );
}
