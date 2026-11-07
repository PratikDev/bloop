"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { loadCredits } from "@/lib/credits/load";

/** The credits list, loaded once per page (src/lib/credits/load.ts). */
export const useCredits = () => useLoaded(loadCredits);
