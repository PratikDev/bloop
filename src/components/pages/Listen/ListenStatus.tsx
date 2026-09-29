"use client";

import { useAppState, useT } from "../../AppState/use-app-state";
import { useLiveData } from "../../LiveData/use-live-data";
import { StatusBadge } from "../../StatusBadge";
import { useTimeLapse } from "../../TimeLapse/use-time-lapse";

/** Loading and error states for the map's data, in words and shapes (never colour alone). */
export function ListenStatus() {
  const { rainStatus, sstStatus } = useLiveData();
  const { state } = useAppState();
  const t = useT();
  const timeLapse = useTimeLapse();
  const items = [
    rainStatus === "loading" && <StatusBadge key="rain" kind="loading">{t("badge.loadingRain")}</StatusBadge>,
    // In Explore the time-lapse button shows the progress itself; the tour has no button.
    timeLapse.status === "loading" && state.mode !== "explore" && (
      <StatusBadge key="tl" kind="loading">
        {timeLapse.progress ? t("timelapse.loading", timeLapse.progress) : t("timelapse.loadingStart")}
      </StatusBadge>
    ),
    timeLapse.status === "error" && <StatusBadge key="tle" kind="error">{t("timelapse.error")}</StatusBadge>,
    sstStatus === "error" && <StatusBadge key="sst" kind="error">{t("error.ocean")}</StatusBadge>,
    rainStatus === "error" && <StatusBadge key="rne" kind="error">{t("error.rain")}</StatusBadge>,
  ].filter(Boolean);
  if (items.length === 0) return null;
  return <div className="flex flex-col items-start gap-1.5">{items}</div>;
}
