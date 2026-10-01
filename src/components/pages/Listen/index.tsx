"use client";

import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ExploreControls } from "../../ExploreControls";
import { FrameLabel } from "../../FrameLabel";
import { FrameView } from "../../FrameView";
import { Readout } from "../../Readout";
import { StoryPanel } from "../../Story/StoryPanel";
import { TrackChoice } from "../../TrackChoice";
import { FirstHint } from "./FirstHint";
import { Inspector } from "./Inspector";
import { ListenStatus } from "./ListenStatus";

/**
 * Listen: the latest EIC frame as a sound map, full size. The page's title,
 * the frame times and the track choice sit above the map, never on it; the
 * tour's panel sits beside it from 1024 px (above it on phones), and the
 * readout (the value under the cursor) sits under it, or, on wide screens,
 * in a panel beside it with the track choice and the frame times. On the map only what
 * was asked for (the Inspector, the first-visit hint) and loading badges.
 * The dock (AppShell) holds the sound controls.
 */
export function ListenPage() {
  const { state } = useAppState();
  const t = useT();
  const story = state.mode === "story";
  return (
    <section aria-labelledby="listen-title" className="flex h-full min-h-0 flex-col lg:px-4 lg:pt-2 lg:pb-2">
      {/*
        From 1024 px the stage is measured (a container named listen), and a grid inside it gives the
        head and the map (2:1) the width that fits both ways. The readout sits under the map, or beside
        it when the stage is wider than 2:1 (most desktops); the tour's column sits on the left.
        In the page (and reading) order: head, tour, map, readout.
      */}
      <div className={cn("contents lg:block lg:h-full", story ? "lg:[container:listen-tour_/_size]" : "lg:[container:listen_/_size]")}>
        <div
          className={cn(
            "contents lg:grid lg:h-full lg:content-center lg:justify-center lg:gap-x-4",
            "lg:[--listen-head:4.75rem] lg:[--listen-foot:2.75rem] lg:[--listen-map:min(100cqw_-_var(--listen-side),(100cqh_-_var(--listen-head)_-_var(--listen-foot))_*_2)]",
            story
              ? "lg:grid-cols-[var(--listen-tour)_auto] lg:[--listen-side:calc(var(--listen-tour)_+_1rem)] lg:[--listen-tour:20rem] xl:[--listen-tour:24rem]"
              : "lg:grid-cols-[auto] lg:[--listen-side:0rem]",
            "lg:listen-wide:grid-cols-[auto_var(--listen-panel)] lg:listen-wide:[--listen-head:2.75rem] lg:listen-wide:[--listen-foot:0rem] lg:listen-wide:[--listen-panel:15rem] lg:listen-wide:[--listen-side:calc(var(--listen-panel)_+_1rem)]",
          )}
        >
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-3 pb-3 lg:col-start-[-2] lg:h-(--listen-head) lg:w-(--listen-map) lg:flex-nowrap lg:px-1 lg:pt-0 lg:pb-2 lg:listen-wide:col-start-1">
            <div className="min-w-0 space-y-1">
              <h1 id="listen-title" data-page-title tabIndex={-1} className="font-serif text-title leading-tight md:text-headline lg:truncate lg:text-title">
                {t("listen.title")}
              </h1>
              <FrameLabel className="hidden lg:block lg:listen-wide:hidden" />
            </div>
            {!story && <TrackChoice className="shrink-0 lg:listen-wide:hidden" />}
          </header>

          {story && <StoryPanel className="px-4 pb-3 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:max-h-[100cqh] lg:self-start lg:overflow-y-auto lg:surface-glass lg:rounded-plate lg:p-5" />}

          <div className="relative flex flex-col lg:col-start-[-2] lg:w-(--listen-map) lg:listen-wide:col-start-1">
            <div className="relative overflow-hidden lg:rounded-plate lg:shadow-float">
              <ExploreControls>
                {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
                <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
              </ExploreControls>
              <FirstHint />
            </div>
            <ListenStatus className="px-4 pt-3 lg:absolute lg:top-3 lg:left-3 lg:z-(--layer-map-plates) lg:p-0" />
            <Inspector />
          </div>

          {/*
            What's under the cursor, in one place: below the map on phones and on narrower stages (a one-line strip),
            or, when the stage is wider than 2:1, a panel beside the map as tall as it, with the track choice and frame times.
          */}
          <aside
            aria-label={t("listen.panel")}
            className={cn(
              "px-4 py-3 lg:col-start-[-2] lg:h-(--listen-foot) lg:w-(--listen-map) lg:overflow-hidden lg:px-1 lg:pt-2 lg:pb-0",
              "lg:listen-wide:col-start-2 lg:listen-wide:row-start-2 lg:listen-wide:flex lg:listen-wide:h-auto lg:listen-wide:w-auto lg:listen-wide:flex-col lg:listen-wide:justify-between lg:listen-wide:gap-4 lg:listen-wide:surface-plate lg:listen-wide:rounded-plate lg:listen-wide:p-4",
            )}
          >
            <div className="hidden lg:listen-wide:block">
              <TrackChoice showLabel className="w-full" itemClassName="flex-1 px-2" />
            </div>
            <Readout />
            <FrameLabel className="hidden lg:listen-wide:block" />
          </aside>
        </div>
      </div>
    </section>
  );
}
