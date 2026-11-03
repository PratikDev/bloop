"use client";

import { useEffect } from "react";
import { BrailleExplorer } from "../BrailleExplorer";
import { useOfficialBrailleSource } from "./use-official-braille-source";
import type { OfficialRecordState } from "./use-official-record";

/** A record's explorer: while it is open the voices sound at the needle (time doesn't run), so the caret plays. */
export function OfficialBrailleExplorer({ rec, onClose }: { rec: OfficialRecordState; onClose: () => void }) {
  const source = useOfficialBrailleSource(rec);
  const { setListening } = rec;
  useEffect(() => {
    setListening(true);
    return () => setListening(false);
  }, [setListening]);
  if (!source) return null;
  return <BrailleExplorer key={source.key} source={source} onClose={onClose} />;
}
