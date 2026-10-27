"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { formatFixed } from "@/lib/i18n";
import { readingText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { checkPick, createDebugApi, type PickCheck } from "./debug";
import type { SentReading } from "./needle-sound";
import type { Turntable } from "./use-turntable";

const POLL_MS = 250;

/**
 * ?debug=1: the needle's lat/lon and value next to the flat map's reading of
 * the same place, and FPS. Developer-only, so its labels aren't translated.
 */
export function DebugOverlay({ tt, sendLog }: { tt: Turntable; sendLog: RefObject<SentReading[]> }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const latest = useRef({ tt, fields });
  useEffect(() => {
    latest.current = { tt, fields };
  });
  const [snap, setSnap] = useState<{ check: PickCheck | null; fps: number } | null>(null);

  useEffect(() => {
    window.__turntable = createDebugApi(
      () => latest.current.tt,
      () => latest.current.fields,
      sendLog.current,
    );
    const timer = setInterval(() => {
      const { tt: now, fields: f } = latest.current;
      if (!f) return;
      setSnap({ check: checkPick(now, f, null), fps: now.fpsRef.current });
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      delete window.__turntable;
    };
  }, [sendLog]);

  const c = snap?.check;
  const deg = (v: number) => formatFixed(v, "en", 4);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-2 left-2 max-w-sm space-y-0.5 rounded-lg bg-scrim p-2 font-mono text-small text-moon">
      <p>debug · FPS {snap ? formatFixed(snap.fps, "en", 0) : "—"}</p>
      {c && (
        <>
          <p>needle {deg(c.needle.lat)}, {deg(c.needle.lon)} · SST cell {c.sstCell.needle}</p>
          <p>3D: {readingText(t, c.needleReading, state.track)}</p>
          <p>
            camera pick {c.cameraPick ? `${deg(c.cameraPick.lat)}, ${deg(c.cameraPick.lon)} · cell ${c.sstCell.camera}` : "off globe"}
            {c.cameraMatch ? " ✓" : " ≠ needle (cell edge)"}
          </p>
          <p>2D: {readingText(t, c.flatReading, state.track)} · cell {c.sstCell.flat}</p>
          <p>{c.match ? "3D = 2D ✓" : "3D ≠ 2D ✗"} · ocean voice {c.oceanSilent ? "silent (land / no data)" : "sounding"}</p>
        </>
      )}
    </div>
  );
}
