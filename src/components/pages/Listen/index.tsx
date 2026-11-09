"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { LiveBrailleExplorer } from "../../BrailleExplorer/LiveBrailleExplorer";
import { Cabinet } from "../../Cabinet";
import { ExploreControls } from "../../ExploreControls";
import { FrameLabel } from "../../FrameLabel";
import { FrameView } from "../../FrameView";
import { Rack } from "../../Rack";
import { Readout } from "../../Readout";
import { useRecords } from "../../Records/use-records";
import { StoryPanel } from "../../Story/StoryPanel";
import { RECORDS_ID } from "./ids";
import { Inspector } from "./Inspector";
import { LinerRow } from "./LinerRow";
import { ListenStatus } from "./ListenStatus";
import { NeedleSoundWord } from "./NeedleSoundWord";

/**
 * Listen: the latest EIC frame as a sound map, in the open jukebox. From 1024 px the cabinet is sized from the space
 * it has (a container named cabinet), so the 2:1 map always fits, and the rack (or, on the tour, its steps) sits
 * beside it. Below 1024 px the cabinet takes the width and the records open from the player.
 */
export function ListenPage() {
  const { state } = useAppState();
  const { current } = useRecords();
  const t = useT();
  const wide = useMediaQuery(MEDIA.mapOverlay);
  const story = state.mode === "story";
  return (
    <section aria-labelledby="listen-title" className="flex min-h-full flex-col gap-4 p-2 lg:h-full lg:min-h-0 lg:flex-row lg:gap-6 lg:px-8 lg:pt-3 lg:pb-3">
      <h1 id="listen-title" data-page-title tabIndex={-1} className="sr-only">
        {t("listen.title")}
      </h1>

      {story && <StoryPanel className="px-2 lg:order-last lg:max-h-full lg:flex-[1_1_20rem] lg:overflow-y-auto" />}

      <div className="min-w-0 lg:h-full lg:flex-[999_1_40rem] lg:overflow-y-auto">
        <div className={cn("min-w-0 [--cab-chrome:16rem] short:[--cab-chrome:14.5rem]", !state.brailleOpen && "lg:h-full lg:[container:cabinet_/_size]")}>
          <Cabinet
            code={current?.code}
            title={current?.title(t)}
            tubes
            className="mx-auto lg:w-fit lg:max-w-full"
            below={
              <div className="mt-2 space-y-1.5 px-1">
                <Readout />
                <LinerRow />
              </div>
            }
          >
            <div className="lg:w-[min(100cqw_-_7.5rem,(100cqh_-_var(--cab-chrome))_*_2)]">
              <FrameLabel compact className="mb-1 px-1 short:hidden max-lg:hidden" />
              <div className="relative">
              <div className="overflow-hidden rounded-plate border-(length:--outline-panel) border-navy">
                <ExploreControls>
                  {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
                  <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
                </ExploreControls>
              </div>
              <div data-overlay>
                <ListenStatus className="pt-2 lg:absolute lg:top-3 lg:left-3 lg:z-(--layer-map-plates) lg:p-0" />
                <NeedleSoundWord />
              </div>
              <Inspector />
              </div>
            </div>
          </Cabinet>
          <LiveBrailleExplorer className="mt-4 shrink-0 px-2 lg:px-1" />
        </div>
      </div>

      {wide && !story && (
        <aside id={RECORDS_ID} tabIndex={-1} aria-label={t("records.label")} className="min-h-0 overflow-y-auto pt-1 pr-2 pb-2 pl-1 outline-none lg:flex-[1_1_20rem] lg:max-w-88">
          <Rack />
        </aside>
      )}
    </section>
  );
}
