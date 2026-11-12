"use client";

import { Link } from "@tanstack/react-router";
import { useT } from "../AppState/use-app-state";
import { VinylMark } from "../VinylMark";

/** The name: a link home. */
export function Brand() {
  const t = useT();
  return (
    <Link to="/" aria-label={t("nav.home")} className="flex h-11 w-fit items-center gap-2.5 rounded-lg pr-2">
      <VinylMark className="size-8" />
      {/* Below 360 px only the mark shows, so the bar fits (the link keeps its name). */}
      <span aria-hidden="true" translate="no" className="hidden font-wide text-title leading-none min-[22.5rem]:inline">
        {t("app.title")}
      </span>
    </Link>
  );
}
