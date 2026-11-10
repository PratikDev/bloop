"use client";

import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { LiveBrailleExplorer } from "../../BrailleExplorer/LiveBrailleExplorer";
import { Cabinet } from "../../Cabinet";
import { ExploreControls } from "../../ExploreControls";
import { FrameView } from "../../FrameView";
import { useRecords } from "../../Records/use-records";
import { StoryPanel } from "../../Story/StoryPanel";
import { Inspector } from "./Inspector";
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
  return (
    <section aria-labelledby="listen-title" className="flex min-h-full flex-col gap-6 px-4 py-6 lg:h-full lg:min-h-0 lg:flex-row lg:px-8">
      <h1 id="listen-title" data-page-title tabIndex={-1} className="sr-only">
        {t("listen.title")}
      </h1>

      {story && <StoryPanel className="lg:order-last lg:max-h-full lg:flex-[1_1_20rem] lg:overflow-y-auto" />}

      <div className="cabinet-sizes min-w-0 lg:h-full lg:flex-[999_1_40rem]">
        <div className={cn("min-w-0", !state.brailleOpen && "lg:h-full lg:[container:cabinet_/_size]")}>
          <Cabinet code={current?.code} title={current?.title(t)} tubes foldCrown className="mx-auto lg:w-fit lg:max-w-full">
            <div className="cabinet-map relative">
              <div className="overflow-hidden rounded-plate border-(length:--outline-panel) border-navy">
                <ExploreControls>
                  {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
                  <FrameView pan revealClassName={cn(state.introDone && "animate-reveal-equator")} />
                </ExploreControls>
              </div>
              <div data-overlay>
                <ListenStatus className="pt-2 lg:absolute lg:top-3 lg:left-3 lg:z-(--layer-map-plates) lg:p-0" />
                <NeedleSoundWord />
              </div>
              <Inspector />
            </div>
          </Cabinet>
          <LiveBrailleExplorer className="mt-4 shrink-0 px-2 lg:px-1" />
        </div>
      </div>
    </section>
  );
}
