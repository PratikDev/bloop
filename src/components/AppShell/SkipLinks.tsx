"use client";

import { useAppState, useT } from "../AppState/use-app-state";
import { PLAYER_ID } from "../Dock";
import { MAP_REGION_ID } from "../ExploreControls";

const SKIP = "fixed top-2 left-2 z-(--layer-start) -translate-y-20 key border-navy rounded-lg bg-shapla px-4 py-2 text-body text-moon focus-visible:translate-y-0";

/** The first keys on the page: to the map and the player on Listen; to the content and the player elsewhere. */
export function SkipLinks({ contentId }: { contentId: string }) {
  const { state } = useAppState();
  const t = useT();
  const player = state.started && state.mode !== "home" && state.mode !== "turntable";
  const links =
    state.mode === "explore"
      ? [{ href: MAP_REGION_ID, label: t("skip.map") }]
      : [{ href: contentId, label: t("app.skipToContent") }];
  return (
    <>
      {[...links, ...(player ? [{ href: PLAYER_ID, label: t("skip.player") }] : [])].map((link) => (
        <a key={link.href} href={`#${link.href}`} className={SKIP}>
          {link.label}
        </a>
      ))}
    </>
  );
}
