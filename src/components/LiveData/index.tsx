"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { afterFirstPaint } from "@/lib/after-paint";
import { loadRain, loadSst, type RainField, type SstField } from "@/lib/data";
import { LiveDataContext, type LoadStatus } from "./use-live-data";

/**
 * Loads today's grids: the ocean grid first (the app can't start without it),
 * then the rain grid once the page has painted, to keep the first load light.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [sst, setSst] = useState<SstField | null>(null);
  const [rain, setRain] = useState<RainField | null>(null);
  const [sstStatus, setSstStatus] = useState<LoadStatus>("loading");
  const [rainStatus, setRainStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    loadSst()
      .then((field) => {
        if (cancelled) return;
        setSst(field);
        setSstStatus("ready");
      })
      .catch(() => !cancelled && setSstStatus("error"));

    const cancelRain = afterFirstPaint(() => {
      loadRain()
        .then((field) => {
          if (cancelled) return;
          setRain(field);
          setRainStatus("ready");
        })
        .catch(() => !cancelled && setRainStatus("error"));
    });
    return () => {
      cancelled = true;
      cancelRain();
    };
  }, []);

  const value = useMemo(
    () => ({ sst, rain, sstStatus, rainStatus, fields: sst ? { sst, rain } : null }),
    [sst, rain, sstStatus, rainStatus],
  );
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}
