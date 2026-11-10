"use client";

import { getRouteApi } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import type { HistoryMetric } from "@/lib/history";
import type { ThenNowSearch, ThenNowView } from "@/router/search";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { Cabinet } from "../../Cabinet";
import { DEFAULT_PLACE, MonthByMonth } from "../../MonthByMonth";
import { useRecords } from "../../Records/use-records";
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
  const { current } = useRecords();
  const view: ThenNowView = search.view ?? "compare";
  // In-page choices replace the entry (Back leaves the page, not each tab); the view switch pushes one.
  const set = (next: Partial<ThenNowSearch>, replace = true) => void navigate({ search: (prev) => ({ ...prev, ...next }), replace });

  return (
    <section aria-labelledby="then-now-title" className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
      <h1 id="then-now-title" data-page-title tabIndex={-1} className="sr-only">
        {t("nav.thenNow")}
      </h1>
      {view === "monthly" && (
        <ChoiceGroup<ThenNowView>
          label={t("thenNow.view")}
          value={view}
          onChange={(v) => set({ view: v }, false)}
          options={[
            { value: "compare", label: t("thenNow.view.compare") },
            { value: "monthly", label: t("thenNow.view.monthly") },
          ]}
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          <Cabinet code={current?.code} title={current?.title(t)} flush>
          {view === "compare" ? (
            <ThenNow
              cityName={search.city ?? DEFAULT_CITY}
              chosen={search.part ?? "heat"}
              onCity={(city: ClimateCellName) => set({ city })}
              onPart={(part: ViewPart) => set({ part })}
              onMonthly={() => set({ view: "monthly" }, false)}
            />
          ) : (
            <MonthByMonth
              place={search.place ?? DEFAULT_PLACE}
              metric={search.record ?? "heat"}
              onPlace={(place: string) => set({ place })}
              onMetric={(record: HistoryMetric) => set({ record })}
            />
          )}
          </Cabinet>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
