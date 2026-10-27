"use client";

import dynamic from "next/dynamic";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ttFor } from "../Turntable/i18n";
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

/** Truth, Mapping, Provenance and History (also the Turntable's "How we know" drawer). */
export function PanelTabs() {
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
  // Turntable only: the column folds to one button so the globe gets the width.
  const foldable = state.mode === "turntable";
  const tr = ttFor(state.lang);
  const fold = (collapsed: boolean) => dispatch({ type: "setPanelCollapsed", collapsed });
  return (
    <>
      {foldable && state.panelCollapsed ? (
        <aside aria-label={t("panel.label")} className="hidden rounded-l-sheet bg-dusk p-2 lg:block">
          <Button variant="ghost" onClick={() => fold(false)} className="h-auto min-h-11 flex-col gap-2 px-2 py-3 text-body [writing-mode:vertical-rl]">
            <PanelRightOpen aria-hidden="true" />
            {tr("turntable.panels.show")}
          </Button>
        </aside>
      ) : (
        <aside aria-label={t("panel.label")} className="hidden overflow-y-auto rounded-l-sheet bg-dusk p-4 text-body lg:block">
          {foldable && (
            <Button variant="ghost" onClick={() => fold(true)} className="mb-3 h-11 gap-2 px-3 text-body">
              <PanelRightClose aria-hidden="true" />
              {tr("turntable.panels.hide")}
            </Button>
          )}
          <PanelTabs />
        </aside>
      )}
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
