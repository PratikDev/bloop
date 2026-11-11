"use client";

import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { FROM_LEFT, FROM_RIGHT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PanelTab } from "../../AppState/reducer";
import { useAppState, useT } from "../../AppState/use-app-state";
import { InlinePanel } from "../../InlinePanel";
import { useInlinePanels } from "../../LowVision/use-inline-panels";
import { MappingPanel } from "../../panels/MappingPanel";
import { ProvenancePanel } from "../../panels/ProvenancePanel";
import { TruthPanel } from "../../panels/TruthPanel";
import { CORE_TABS, shownTab } from "../../panels/core-tabs";

/** The Inspector's tabs (the Turntable's drawer adds History; the Inspector shows Provenance in its place). */
type InspectorTab = Exclude<PanelTab, "history">;
const inspectorTab = (panel: PanelTab): InspectorTab => {
  const shown = shownTab(panel);
  return shown === "history" ? "provenance" : shown;
};

const TABS: { tab: InspectorTab; label: "panel.describe" | "panel.table" | "panel.provenance" | "panel.mapping" | "panel.truth" }[] = [
  ...CORE_TABS,
  { tab: "provenance", label: "panel.provenance" },
  { tab: "mapping", label: "panel.mapping" },
  { tab: "truth", label: "panel.truth" },
];

const PANELS: Record<Exclude<InspectorTab, "describe" | "table">, ReactNode> = {
  provenance: <ProvenancePanel />,
  mapping: <MappingPanel />,
  truth: <TruthPanel />,
};

const panelFor = (tab: InspectorTab): ReactNode => (tab === "describe" || tab === "table" ? CORE_TABS.find((c) => c.tab === tab)?.panel : PANELS[tab]);

function InspectorTabs() {
  const { state, dispatch } = useAppState();
  const t = useT();
  return (
    <Tabs value={inspectorTab(state.panel)} onValueChange={(panel: InspectorTab) => dispatch({ type: "setPanel", panel })} className="gap-5">
      <TabsList variant="line" aria-label={t("panel.label")} className="w-full justify-start gap-0 group-data-horizontal/tabs:h-11">
        {TABS.map(({ tab, label }) => (
          <TabsTrigger key={tab} value={tab} className="h-full flex-none px-3 text-body data-active:text-moon">
            {t(label)}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ tab }) => (
        <TabsContent key={tab} value={tab} className="text-body">
          {panelFor(tab)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function Inspector() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const phone = useMediaQuery(MEDIA.phone);
  const drawer = useMediaQuery(MEDIA.mapOverlay);
  const close = () => dispatch({ type: "setPanelOpen", open: false });
  const left = state.mode === "story";
  const inline = useInlinePanels();

  if (inline) {
    return state.panelOpen ? (
      <InlinePanel title={t("panel.label")} onClose={close} testId="inspector-inline" className="mx-4 mt-3 w-auto fit:mx-0">
        <InspectorTabs />
      </InlinePanel>
    ) : null;
  }

  if (drawer) {
    return (
      <AnimatePresence>
        {state.panelOpen && (
          <motion.aside
            key="inspector"
            aria-label={t("panel.label")}
            variants={left ? FROM_LEFT : FROM_RIGHT}
            initial="hidden"
            animate="shown"
            exit="hidden"
            className={cn("surface-glass absolute top-3 bottom-3 z-(--layer-map-plates) flex w-[min(24rem,45%)] flex-col rounded-plate", left ? "left-3" : "right-3")}
          >
            <div className="flex items-center justify-between px-4 pt-3">
              <h2 className="eyebrow">{t("panel.label")}</h2>
              <Button variant="ghost" size="icon-lg" onClick={close} aria-label={t("inspector.close")} className="size-11 text-haze hover:text-moon">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <InspectorTabs />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Sheet open={state.panelOpen} onOpenChange={(open) => dispatch({ type: "setPanelOpen", open })}>
      <SheetContent closeLabel={t("inspector.close")} side={phone ? "bottom" : "right"} className={phone ? "max-h-[85dvh] overflow-y-auto rounded-t-sheet bg-dusk p-4 pt-14" : "w-full overflow-y-auto rounded-l-sheet bg-dusk p-4 pt-14 sm:max-w-md"}>
        <SheetTitle className="eyebrow absolute top-5 left-4">{t("panel.label")}</SheetTitle>
        <InspectorTabs />
      </SheetContent>
    </Sheet>
  );
}
