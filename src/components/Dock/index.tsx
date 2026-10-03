"use client";

import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useAppState, useT } from "../AppState/use-app-state";
import { CaptionBar } from "../CaptionBar";
import { Waveform } from "../Waveform";
import { ListenActions } from "./ListenActions";
import { MixerMenu } from "./MixerMenu";
import { SoundButton } from "./SoundButton";

/**
 * The sound dock, on every page after Start (not on Home): the main sound
 * button, what is playing now (caption and live waveform), and on Listen its
 * actions. It keeps its own view-transition name, so it stays put between pages.
 */
export function Dock() {
  const { state } = useAppState();
  const t = useT();
  const shown = state.started && state.mode !== "home";
  const listen = state.mode === "explore" || state.mode === "story";

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.section
          key="dock"
          aria-label={t("dock.label")}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: SPRING.gentle }}
          exit={{ opacity: 0, y: 24 }}
          className="sticky bottom-0 z-(--layer-dock) px-2 pb-2 [view-transition-name:dock] md:px-4 md:pb-3"
        >
          <div className="surface-glass mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-plate p-1.5 md:p-2 lg:flex lg:gap-4">
            <SoundButton />
            <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
              <CaptionBar className="min-h-0 flex-1 text-body md:text-lead" />
              <Waveform className="h-7 w-16 shrink-0 opacity-90 md:w-24" />
            </div>
            {/* The mixer is on every page: mute all and solo reach Then vs Now too, so they can be undone there. */}
            <div className="col-span-2 flex items-center justify-around gap-0.5 lg:col-span-1 lg:justify-end">
              {listen && <ListenActions />}
              <MixerMenu />
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
