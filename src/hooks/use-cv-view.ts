"use client";

import { useSyncExternalStore } from "react";
import { getCvView, serverCvView, setCvView, subscribeCvView, type CvView } from "@/lib/cv/view-store";

export function useCvView(): [CvView, (patch: Partial<CvView>) => void] {
  return [useSyncExternalStore(subscribeCvView, getCvView, serverCvView), setCvView];
}
