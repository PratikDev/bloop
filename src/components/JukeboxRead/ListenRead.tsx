"use client";

import type { ReactNode } from "react";
import { useLiveProvenance } from "@/hooks/use-live-provenance";
import { useAppState } from "../AppState/use-app-state";
import { JukeboxRead } from ".";
import { useListenSource } from "./use-listen-source";

export function ListenRead({ className, children }: { className?: string; children?: ReactNode }) {
  const { state } = useAppState();
  const { source, loading, record } = useListenSource();
  const [base] = useLiveProvenance(record, null, { gap: false });
  return (
    <JukeboxRead source={source} base={base ?? null} needle={state.cursor} playMode={state.track === "both" ? "both" : "single"} loading={loading} className={className}>
      {children}
    </JukeboxRead>
  );
}
