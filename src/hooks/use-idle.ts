"use client";

import { useEffect, useState } from "react";
import { whenIdle } from "@/lib/idle";

/** True once the page, mounted and usable, has had a moment of idle time (lib/idle.ts). */
export function useIdle(deadlineMs?: number): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => whenIdle(() => setIdle(true), deadlineMs), [deadlineMs]);
  return idle;
}
