"use client";

import { getRouteApi } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import type { HistoryMetric } from "@/lib/history";
import type { ThenNowSearch, ThenNowView } from "@/router/search";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { FrameLabel } from "../../FrameLabel";
import { DEFAULT_PLACE, MonthByMonth } from "../../MonthByMonth";
import { DEFAULT_CITY, ThenNow } from "../../ThenNow";
import type { ViewPart } from "../../ThenNow/parts";

const route = getRouteApi("/then-now");

/**
 * Then vs Now: how the records have changed, two ways. Compare decades (the
 * cities and their records) and Month by month (any place, any month). Every
 * choice is in the URL, so a link opens the same view.
 */
export function ThenNowPage() {
  const t = useT();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const view: ThenNowView = search.view ?? "compare";
  // In-page choices replace the entry (Back leaves the page, not each tab); the view switch pushes one.
  const set = (next: Partial<ThenNowSearch>, replace = true) => void navigate({ search: (prev) => ({ ...prev, ...next }), replace });

  return (
    <section aria-labelledby="then-now-title" className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 overflow-y-auto px-4 pt-3 pb-4 md:px-8 lg:short:gap-2 lg:short:pt-1 lg:short:pb-1">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="space-y-1">
          <h1 id="then-now-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
            {t("nav.thenNow")}
          </h1>
          <p className="max-w-2xl text-body text-haze">{t("thenNow.pageLead")}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <ChoiceGroup<ThenNowView>
            label={t("thenNow.view")}
            value={view}
            onChange={(v) => set({ view: v }, false)}
            options={[
              { value: "compare", label: t("thenNow.view.compare") },
              { value: "monthly", label: t("thenNow.view.monthly") },
            ]}
          />
          <FrameLabel className="text-small md:text-right" />
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          {view === "compare" ? (
            <ThenNow
              cityName={search.city ?? DEFAULT_CITY}
              chosen={search.part ?? "heat"}
              onCity={(city: ClimateCellName) => set({ city })}
              onPart={(part: ViewPart) => set({ part })}
            />
          ) : (
            <MonthByMonth
              place={search.place ?? DEFAULT_PLACE}
              metric={search.record ?? "heat"}
              onPlace={(place: string) => set({ place })}
              onMetric={(record: HistoryMetric) => set({ record })}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
