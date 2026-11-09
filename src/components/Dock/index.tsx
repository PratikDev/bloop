"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { SPRING } from "@/lib/motion";
import { useAppState, useT } from "../AppState/use-app-state";
import { ListenActions } from "./ListenActions";
import { MiniPlayer } from "./MiniPlayer";
import { MixerMenu } from "./MixerMenu";
import { RecordsKey } from "./RecordsKey";

export const PLAYER_ID = "player";

/**
 * The player, on every page after Start (not on Home; the Turntable mounts the same MiniPlayer inside its stage).
 * It keeps its own view-transition name, so it stays put between pages.
 */
export function Dock() {
  const { state } = useAppState();
  const t = useT();
  const wide = useMediaQuery(MEDIA.mapOverlay);
  const shown = state.started && state.mode !== "home" && state.mode !== "turntable";
  const explore = state.mode === "explore";
  const listen = explore || state.mode === "story";

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.section
          key="dock"
          id={PLAYER_ID}
          tabIndex={-1}
          aria-label={t("dock.label")}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: SPRING.gentle }}
          exit={{ opacity: 0, y: 24 }}
          className="sticky bottom-0 z-(--layer-dock) px-2 pb-3 outline-none [view-transition-name:dock] md:px-4"
        >
          <MiniPlayer
            className="mx-auto max-w-7xl"
            keys={
              <>
                {explore && <ListenActions />}
                {!(listen && wide) && <RecordsKey />}
                {/* On every page: mute all and solo reach Then vs Now too, so they can be undone there. */}
                <MixerMenu />
              </>
            }
          />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
