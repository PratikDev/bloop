"use client";

import { useSyncExternalStore } from "react";
import { getCvView, serverCvView, setCvView, subscribeCvView, type CvView } from "@/lib/cv/view-store";

/** The CV view's settings (the box read, the chord toggle), shared by every component that shows or changes them. */
export function useCvView(): [CvView, (patch: Partial<CvView>) => void] {
  return [useSyncExternalStore(subscribeCvView, getCvView, serverCvView), setCvView];
}
