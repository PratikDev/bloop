"use client";

import { FLAGS } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useListenPlayContext } from "../../Art/use-play-context";
import { LiveBrailleExplorer } from "../../BrailleExplorer/LiveBrailleExplorer";
import { Cabinet } from "../../Cabinet";
import { FireWeatherLayerSound } from "../../EarthData/FireWeatherLayer";
import { ExploreControls } from "../../ExploreControls";
import { FrameView } from "../../FrameView";
import { TimeLapseStage } from "../../Globe/TimeLapseStage";
import { LvLegend } from "../../LowVision/Legend";
import { LENS_DOCK_ID } from "../../LowVision/lens-place";
import { useRecords } from "../../Records/use-records";
import { StoryPanel } from "../../Story/StoryPanel";
import { Inspector } from "./Inspector";
import { ListenSheet } from "./ListenSheet";
import { ListenStatus } from "./ListenStatus";
import { NeedleSoundWord } from "./NeedleSoundWord";

/**
 * Listen: the latest EIC frame as a sound map, in the open jukebox, as large as the screen allows. From 1024 px the
 * cabinet is sized from the space it has (a container named cabinet); the records open from the player. On phones
 * the map window is tall and pans to keep the needle in view.
 */
export function ListenPage() {
  const { state } = useAppState();
  const { current } = useRecords();
  const t = useT();
  const story = state.mode === "story";
  useListenPlayContext();
  return (
    <section aria-labelledby="listen-title" className="flex min-h-full flex-col gap-6 px-4 py-6 lg:h-full lg:min-h-0 lg:flex-row lg:px-8">
      <h1 id="listen-title" data-page-title tabIndex={-1} className="sr-only">
        {t("listen.title")}
      </h1>

      {story && <StoryPanel className="lg:order-last lg:max-h-full lg:flex-[1_1_20rem] lg:overflow-y-auto" />}

      <div className="cabinet-sizes min-w-0 lg:h-full lg:flex-[999_1_40rem]">
        <div className="min-w-0 lg:h-full lg:[container:cabinet_/_size]">
          <Cabinet code={current?.code} title={current?.title(t)} tubes foldCrown flush className="mx-auto lg:w-fit lg:max-w-full">
            <div className="cabinet-map relative">
              <div className="relative overflow-hidden rounded-plate border-(length:--outline-panel) border-navy">
                <ExploreControls>
                  {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
                  <FrameView pan revealClassName={cn(state.introDone && "animate-reveal-equator")} />
                </ExploreControls>
                {/* The storm time-lapse on a globe over the map window (Session B), with its Globe / Flat map choice. */}
                <TimeLapseStage />
              </div>
              <div data-overlay>
                <ListenStatus className="pt-2 lg:absolute lg:top-3 lg:left-3 lg:z-(--layer-map-plates) lg:p-0" />
                <NeedleSoundWord />
              </div>
              {FLAGS.lowVision && <div id={LENS_DOCK_ID} className="mt-3 empty:hidden" />}
              {FLAGS.lowVision && <LvLegend className="mt-3" />}
              <Inspector />
            </div>
          </Cabinet>
        </div>
      </div>
      {/* The braille explorer: Listen's right-hand column from 1024 px (the map stays whole beside it), a sheet below. */}
      <LiveBrailleExplorer className="lg:order-last lg:max-h-full lg:w-[min(30rem,40%)] lg:shrink-0 lg:overflow-y-auto" />
      <FireWeatherLayerSound />
      <ListenSheet />
    </section>
  );
}
