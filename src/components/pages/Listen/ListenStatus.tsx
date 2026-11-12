"use client";

import { useAnnounceError } from "@/hooks/use-announce-error";
import { cn } from "@/lib/utils";
import { useT } from "../../AppState/use-app-state";
import { useFrameImages } from "../../FrameView/use-frame-images";
import { useLiveData } from "../../LiveData/use-live-data";
import { StatusBadge } from "../../StatusBadge";
import { useTimeLapse } from "../../TimeLapse/use-time-lapse";

/** Loading and error states for the map's data, in words and shapes (never colour alone). */
export function ListenStatus({ className }: { className?: string }) {
  const { rainStatus, sstStatus } = useLiveData();
  const t = useT();
  const timeLapse = useTimeLapse();
  const { failed } = useFrameImages();
  const errors = [
    timeLapse.status === "error" && t("timelapse.error"),
    sstStatus === "error" && t("error.ocean"),
    rainStatus === "error" && t("error.rain"),
    failed && sstStatus !== "error" && t("error.frameImage"),
  ].filter((text): text is string => Boolean(text));
  useAnnounceError(errors[0] ?? null);
  const items = [
    sstStatus === "loading" && <StatusBadge key="ocean" kind="loading">{t("start.loading")}</StatusBadge>,
    rainStatus === "loading" && <StatusBadge key="rain" kind="loading">{t("badge.loadingRain")}</StatusBadge>,
    timeLapse.status === "loading" && (
      <StatusBadge key="tl" kind="loading" progress={timeLapse.progress ? timeLapse.progress.loaded / timeLapse.progress.total : undefined}>
        {timeLapse.progress ? t("timelapse.loading", timeLapse.progress) : t("timelapse.loadingStart")}
      </StatusBadge>
    ),
    ...errors.map((text) => <StatusBadge key={text} kind="error">{text}</StatusBadge>),
  ].filter(Boolean);
  if (items.length === 0) return null;
  return <div className={cn("flex flex-col items-start gap-1.5", className)}>{items}</div>;
}
