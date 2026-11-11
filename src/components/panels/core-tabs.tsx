"use client";

import type { ReactNode } from "react";
import { FLAGS } from "@/lib/flags";
import type { PanelTab } from "../AppState/reducer";
import { DescriptionPanel } from "../Describe";
import { ValueTable } from "../ValueTable";

interface CoreTab {
  tab: "describe" | "table";
  label: "panel.describe" | "panel.table";
  panel: ReactNode;
}

export const CORE_TABS: readonly CoreTab[] = [
  ...(FLAGS.describe ? [{ tab: "describe", label: "panel.describe", panel: <DescriptionPanel /> } as const] : []),
  ...(FLAGS.tablePlaces ? [{ tab: "table", label: "panel.table", panel: <ValueTable /> } as const] : []),
];

export function shownTab(panel: PanelTab): PanelTab {
  return (panel === "describe" || panel === "table") && !CORE_TABS.some((c) => c.tab === panel) ? "provenance" : panel;
}
