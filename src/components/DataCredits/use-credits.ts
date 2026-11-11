"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { loadCredits } from "@/lib/credits/load";

export const useCredits = () => useLoaded(loadCredits);
