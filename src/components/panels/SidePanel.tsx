"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PanelTab } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { MappingPanel } from "./MappingPanel";
import { ProvenancePanel } from "./ProvenancePanel";
import { TruthPanel } from "./TruthPanel";

// The chart library loads only when History opens (keeps the first load light).
const HistoryPanel = dynamic(() => import("./HistoryPanel").then((m) => m.HistoryPanel), { ssr: false });

const TABS: { tab: PanelTab; label: "panel.truth" | "panel.mapping" | "panel.provenance" | "panel.history" }[] = [
  { tab: "truth", label: "panel.truth" },
  { tab: "mapping", label: "panel.mapping" },
  { tab: "provenance", label: "panel.provenance" },
  { tab: "history", label: "panel.history" },
];

function PanelTabs() {
  const { state, dispatch } = useAppState();
  const t = useT();
  return (
    <Tabs value={state.panel} onValueChange={(panel: PanelTab) => dispatch({ type: "setPanel", panel })} className="gap-4">
      <TabsList aria-label={t("panel.label")} className="w-full bg-night group-data-horizontal/tabs:h-11">
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
      </TabsContent>
      <TabsContent value="history">
        <HistoryPanel />
      </TabsContent>
    </Tabs>
  );
}

/**
 * One tabbed side sheet attached to the map (not a grid of cards).
 * Wide screens: a column beside the map. Narrower: a sheet (right on tablet, bottom on phones).
 */
export function SidePanel() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const phone = useMediaQuery("(max-width: 767px)");
  // The column is always there on wide screens; the sheet (modal) only opens below lg.
  const wide = useMediaQuery("(min-width: 1024px)");
  return (
    <>
      <aside
        aria-label={t("panel.label")}
        className="hidden overflow-y-auto rounded-l-sheet bg-dusk p-4 text-body lg:block"
      >
        <PanelTabs />
      </aside>
      <Sheet open={state.panelOpen && !wide} onOpenChange={(open) => dispatch({ type: "setPanelOpen", open })}>
        <SheetContent
          side={phone ? "bottom" : "right"}
          className={cn(
            "overflow-y-auto bg-dusk p-4 text-body lg:hidden",
            phone ? "max-h-[85dvh] rounded-t-sheet" : "w-full rounded-l-sheet sm:max-w-md",
          )}
        >
          <SheetTitle className="sr-only">{t("panel.label")}</SheetTitle>
          <PanelTabs />
        </SheetContent>
      </Sheet>
    </>
  );
}
