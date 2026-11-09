"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HistoryMetric } from "@/lib/history";
import type { PanelTab } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { DEFAULT_PLACE, MonthByMonth } from "../MonthByMonth";
import { MappingPanel } from "./MappingPanel";
import { ProvenancePanel } from "./ProvenancePanel";
import { TruthPanel } from "./TruthPanel";

const TABS: { tab: PanelTab; label: "panel.truth" | "panel.mapping" | "panel.provenance" | "panel.history" }[] = [
  { tab: "truth", label: "panel.truth" },
  { tab: "mapping", label: "panel.mapping" },
  { tab: "provenance", label: "panel.provenance" },
  { tab: "history", label: "panel.history" },
];

/** Month by month (Then vs Now's Place History) inside the drawer: the place and record kept here, not in a URL. */
function HistoryTab() {
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [metric, setMetric] = useState<HistoryMetric>("heat");
  return <MonthByMonth place={place} metric={metric} onPlace={setPlace} onMetric={setMetric} />;
}

/** Truth, Mapping, Provenance and History: the Turntable's "Sources and checks" drawer. */
export function PanelTabs({ provenanceNote }: { provenanceNote?: ReactNode }) {
  const { state, dispatch } = useAppState();
  const t = useT();
  return (
    <Tabs value={state.panel} onValueChange={(panel: PanelTab) => dispatch({ type: "setPanel", panel })} className="gap-4">
      <TabsList aria-label={t("panel.label")} className="w-full bg-paper group-data-horizontal/tabs:h-11">
        {TABS.map(({ tab, label }) => (
          <TabsTrigger key={tab} value={tab} className="h-full px-2 text-body data-active:bg-tide">
            {t(label)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="truth">
        <TruthPanel />
      </TabsContent>
      <TabsContent value="mapping">
        <MappingPanel />
      </TabsContent>
      <TabsContent value="provenance">
        <ProvenancePanel />
        {provenanceNote && <p className="mt-3 text-body text-moon">{provenanceNote}</p>}
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  );
}
