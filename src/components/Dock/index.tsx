"use client";

import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useAppState, useT } from "../AppState/use-app-state";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { GoToMenu } from "./GoToMenu";
import { MiniPlayer } from "./MiniPlayer";
import { MixerMenu } from "./MixerMenu";
import { ListenItems, NowPlayingItem, StepItems } from "./MoreItems";
import { NeedleSlider } from "./NeedleSliders";
import { PlayerMore } from "./PlayerMore";
import { RecordsKey } from "./RecordsKey";

export const PLAYER_ID = "player";

/**
 * The player, on every page after Start (not on Home; the Turntable mounts the same MiniPlayer inside its stage).
 * It keeps its own view-transition name, so it stays put between pages.
 */
export function Dock() {
  const { state } = useAppState();
  const t = useT();
  const { status } = useTimeLapse();
  const shown = state.started && state.mode !== "home" && state.mode !== "turntable";
  const explore = state.mode === "explore";
  // While the time-lapse runs, the sheet is what people are after: it comes first.
  const storm = status === "playing" || status === "loading";
  // Pages that spend their controls on their own content: Records joins the rest in More.
  const inMore = state.mode === "thenNow" || state.mode === "how" || state.mode === "official";

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
          className="dock-bar z-(--layer-dock) outline-none [view-transition-name:dock]"
        >
          <MiniPlayer
            slider={explore}
            keys={
              <>
                {!inMore && <RecordsKey />}
                <PlayerMore>
                  {storm && <NowPlayingItem />}
                  {inMore && <RecordsKey wide />}
                  <StepItems />
                  {explore && (
                    <div role="group" aria-label={t("needle.group")} className="space-y-1">
                      <NeedleSlider axis="lat" className="px-3" />
                      <GoToMenu />
                    </div>
                  )}
                  {explore && <ListenItems />}
                  {!storm && <NowPlayingItem />}
                  {/* On every page: mute all and solo reach Then vs Now too, so they can be undone there. */}
                  <MixerMenu />
                </PlayerMore>
              </>
            }
          />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
