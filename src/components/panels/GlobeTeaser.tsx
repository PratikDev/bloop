"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { loadGlobeDuet } from "@/lib/data";
import { formatDay } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";

/**
 * Citizen observers vs satellite (contract §12, plan §11.6 teaser): the typical
 * place-day, how often the two agree, and L1's own disclosure. Only when the
 * file says there are enough pairs (status "ok"); otherwise nothing is shown.
 */
export function GlobeTeaser() {
  const { state } = useAppState();
  const t = useT();
  const { value: duet } = useLoaded(loadGlobeDuet);
  if (!duet || duet.status !== "ok" || !duet.featured) return null;
  const f = duet.featured;
  const s = duet.summary;

  return (
    <section className="space-y-2 rounded-lg border border-tide p-4">
      <StatusBadge kind="october">{t("globe.teaser")}</StatusBadge>
      <h3 className="text-lead font-medium">{duet.title}</h3>
      <p className="text-moon">{t("globe.plan")}</p>
      <p>
        {t("globe.featured", {
          date: formatDay(f.date, state.lang),
          lat: f.lat,
          lon: f.lon,
          ground: f.ground_pct,
          satellite: f.satellite_pct,
          reports: f.n_reports,
        })}
      </p>
      {s.median_abs_difference_pct !== undefined && s.share_within_25_points !== undefined && (
        <p className="text-haze">
          {t("globe.summary", { placeDays: s.unique_place_days, median: s.median_abs_difference_pct, within: s.share_within_25_points * 100 })}
        </p>
      )}
      <p className="text-small text-haze">{duet.disclosure}</p>
      <p className="text-small text-haze">{duet.credit}</p>
    </section>
  );
}
