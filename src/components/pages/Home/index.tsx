"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { formatUtcDate } from "@/lib/i18n";
import { locationForMode, PAGE_PATHS } from "@/router/modes";
import { useAppState, useT } from "../../AppState/use-app-state";
import { JukeboxArt } from "../../JukeboxArt";
import { useLiveData } from "../../LiveData/use-live-data";
import { PAPER_KEY, StartActions, StartHint } from "../../StartActions";

/** Home has one job: say what this is, then start listening. The closed jukebox stands beside it. */
export function HomePage() {
  const { state } = useAppState();
  const { sst } = useLiveData();
  const t = useT();
  const navigate = useNavigate();
  const toListen = () => void navigate({ to: PAGE_PATHS.listen });
  const toTour = () => void navigate(locationForMode("story"));

  return (
    <section aria-labelledby="home-title" className="flex min-h-full flex-col justify-center gap-8 px-4 py-6 md:px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
      <div className="min-w-0 space-y-6 lg:shrink lg:grow-0 lg:basis-160">
        <h1 id="home-title" data-page-title tabIndex={-1} className="display-tight font-wide-display text-hero text-moon">
          {t("home.title")}
        </h1>
        <p className="max-w-lg text-lead text-moon">{t("start.lead")}</p>
        {state.started ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to={PAGE_PATHS.listen} className="inline-flex h-13 items-center gap-3 key rounded-full bg-shapla pr-5 pl-6 text-lead text-moon">
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
          <StartActions autoFocus after={toListen} onTour={toTour} />
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md min-w-0 flex-col items-center gap-3 lg:max-w-none lg:flex-1 lg:basis-80">
        <JukeboxArt marquee={t("app.title")} className="w-full max-w-[min(28rem,54dvh)]" />
        {sst && <p className="text-center text-small text-haze">{t("home.frameCaption", { date: formatUtcDate(sst.meta.frame_time_utc, state.lang) })}</p>}
      </div>
    </section>
  );
}
