"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LiveBrailleExplorer } from "../../BrailleExplorer/LiveBrailleExplorer";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ExploreControls } from "../../ExploreControls";
import { FrameGapNote } from "../../FrameGapNote";
import { FrameLabel } from "../../FrameLabel";
import { FrameView } from "../../FrameView";
import { LENS_DOCK_ID } from "../../LowVision/lens-place";
import { LvLegend } from "../../LowVision/Legend";
import { Readout } from "../../Readout";
import { StoryPanel } from "../../Story/StoryPanel";
import { TrackChoice } from "../../TrackChoice";
import { FLAGS } from "@/lib/flags";
import { TuningPanel } from "../../Tuning";
import { FirstHint } from "./FirstHint";
import { Inspector } from "./Inspector";
import { ListenStatus } from "./ListenStatus";
import { AskBloop } from "../../AskBloop";
import { ListenRead } from "../../JukeboxRead/ListenRead";
import { ART_ROW, ArtListen } from "../../Art/ArtListen";

const STAGE_HEIGHT = ["", "fit:h-[calc(100%-3.5rem)]", "fit:h-[calc(100%-7rem)]", "fit:h-[calc(100%-10.5rem)]"] as const;

export function ListenPage() {
  const { state } = useAppState();
  const t = useT();
  const story = state.mode === "story";
  const [askOpen, setAskOpen] = useState(false);
  const [artOpen, setArtOpen] = useState(false);
  const artRow = ART_ROW && !story;
  const gapInHead = state.track === "both" && !story;
  const rowsUnder = story ? 0 : Number(FLAGS.cvRead) + Number(FLAGS.askBloop) + Number(artRow);
  return (
    // With the braille explorer open (B, or the dock's Braille) the page scrolls: the map keeps the screen, the explorer
    // follows below it (focus moves into it, which brings it into view).
    <section aria-labelledby="listen-title" className={cn("flex h-full min-h-0 flex-col fit:px-4 fit:pt-2 fit:pb-2", (state.brailleOpen || askOpen || artOpen || FLAGS.cvRead) && "overflow-y-auto")}>
      {/*
        From 1024 px the stage is measured (a container named listen), and a grid inside it gives the
        head and the map (2:1) the width that fits both ways. The readout sits under the map, or beside
        it when the stage is wider than 2:1 (most desktops); the tour's column sits on the left.
        In the page (and reading) order: head, tour, map, readout.
      */}
      {}
      <div className={cn("contents fit:block fit:h-full fit:shrink-0", STAGE_HEIGHT[rowsUnder], story ? "fit:[container:listen-tour_/_size]" : "fit:[container:listen_/_size]")}>
        <div
          className={cn(
            "contents fit:grid fit:h-full fit:content-center fit:justify-center fit:gap-x-4",
            "fit:[--listen-head:4.75rem] fit:[--listen-foot:2.75rem] fit:[--listen-map:min(100cqw_-_var(--listen-side),(100cqh_-_var(--listen-head)_-_var(--listen-foot))_*_2)]",
            story
              ? "fit:grid-cols-[var(--listen-tour)_auto] fit:[--listen-side:calc(var(--listen-tour)_+_1rem)] fit:[--listen-tour:20rem] xl:[--listen-tour:24rem]"
              : "fit:grid-cols-[auto] fit:[--listen-side:0rem]",
            gapInHead ? "fit:listen-wide:[--listen-head:5rem]" : "fit:listen-wide:[--listen-head:2.75rem]",
            "fit:listen-wide:grid-cols-[auto_var(--listen-panel)] fit:listen-wide:[--listen-foot:0rem] fit:listen-wide:[--listen-panel:15rem] fit:listen-wide:[--listen-side:calc(var(--listen-panel)_+_1rem)]",
          )}
        >
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-3 pb-3 fit:col-start-[-2] fit:h-(--listen-head) fit:w-(--listen-map) fit:flex-nowrap fit:px-1 fit:pt-0 fit:pb-2 fit:listen-wide:col-start-1">
            <div className="min-w-0 space-y-1">
              <h1 id="listen-title" data-page-title tabIndex={-1} className="font-serif text-title leading-tight md:text-headline fit:truncate fit:text-title">
                {t("listen.title")}
              </h1>
              <FrameLabel className="hidden fit:block fit:listen-wide:hidden" />
              {}
              {gapInHead && <FrameGapNote explained className="fit:hidden fit:listen-wide:flex fit:listen-wide:flex-nowrap" />}
            </div>
            {!story && <TrackChoice className="shrink-0 fit:listen-wide:hidden" />}
          </header>

          {story && <StoryPanel className="px-4 pb-3 fit:col-start-1 fit:row-span-3 fit:row-start-1 fit:max-h-[100cqh] fit:self-start fit:overflow-y-auto fit:surface-glass fit:rounded-plate fit:p-5" />}

          <div className="relative flex flex-col fit:col-start-[-2] fit:w-(--listen-map) fit:listen-wide:col-start-1">
            <div className="relative overflow-hidden fit:rounded-plate fit:shadow-float">
              <ExploreControls>
                {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
                <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
              </ExploreControls>
              <FirstHint />
            </div>
            {}
            {}
            {FLAGS.lowVision && <div id={LENS_DOCK_ID} className="mx-4 mt-3 empty:hidden fit:mx-0" />}
            <LvLegend className="mx-4 mt-3 fit:mx-0" />
            {FLAGS.tuning && state.tuning && !story && <TuningPanel className="mx-4 mt-3 fit:absolute fit:bottom-3 fit:left-3 fit:z-(--layer-map-plates) fit:m-0" />}
            <ListenStatus className="px-4 pt-3 fit:absolute fit:top-3 fit:left-3 fit:z-(--layer-map-plates) fit:p-0" />
            <Inspector />
          </div>

          {}
          <aside
            aria-label={t("listen.panel")}
            className={cn(
              "relative px-4 py-3 fit:col-start-[-2] fit:h-(--listen-foot) fit:w-(--listen-map) fit:overflow-hidden fit:px-1 fit:pt-2 fit:pb-0",
              "fit:listen-wide:col-start-2 fit:listen-wide:row-start-2 fit:listen-wide:flex fit:listen-wide:h-auto fit:listen-wide:w-auto fit:listen-wide:flex-col fit:listen-wide:justify-between fit:listen-wide:gap-4 fit:listen-wide:surface-plate fit:listen-wide:rounded-plate fit:listen-wide:p-4",
            )}
          >
            <div className="hidden fit:listen-wide:block">
              <TrackChoice showLabel className="w-full" itemClassName="flex-1 px-2" />
            </div>
            <Readout />
            <FrameLabel className="hidden fit:listen-wide:block" />
          </aside>
        </div>
      </div>
      {}
      {FLAGS.cvRead && !story && <ListenRead className="shrink-0 px-4 pb-3 fit:px-1 fit:pt-2" />}
      {/*  */}
      {FLAGS.askBloop && !story && <AskBloop open={askOpen} onOpenChange={setAskOpen} className="shrink-0 px-4 pb-3 fit:px-1 fit:pt-2" />}
      {}
      {(FLAGS.artDial || FLAGS.artOrchestra || ART_ROW) && <ArtListen onOpenChange={setArtOpen} className="shrink-0 space-y-3 px-4 pb-3 fit:px-1 fit:pt-2" />}
      <LiveBrailleExplorer className="shrink-0 px-4 pb-3 fit:px-1 fit:pt-4" />
    </section>
  );
}
