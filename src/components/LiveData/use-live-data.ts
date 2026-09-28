"use client";

import { createContext, useContext } from "react";
import type { LoadStatus } from "@/hooks/use-loaded";
import type { LiveFields, RainField, SstField } from "@/lib/data";

export type { LoadStatus };

export interface LiveDataValue {
  sst: SstField | null;
  rain: RainField | null;
  sstStatus: LoadStatus;
  rainStatus: LoadStatus;
  /** Ready once the ocean grid is in; rain may still be loading. */
  fields: LiveFields | null;
}

export const LiveDataContext = createContext<LiveDataValue | null>(null);

export function useLiveData(): LiveDataValue {
  const value = useContext(LiveDataContext);
  if (!value) throw new Error("useLiveData must be used inside <LiveDataProvider>");
  return value;
}
