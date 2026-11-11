"use client";

import { ensureAudioAll } from "@/lib/audio-engines";
import { earconAllowed, useRecordEarcon } from "../use-record-earcon";
import { useAppState } from "../../AppState/use-app-state";
import { RecordGrid, type GridRecord } from "./RecordGrid";

export function RecordPicker({ records, value, onChange }: { records: readonly GridRecord[]; value: string; onChange: (record: string) => void }) {
  const { state } = useAppState();
  const [earcon, played] = useRecordEarcon();
  const pick = async (record: string) => {
    onChange(record);
    if (!earconAllowed(state)) return;
    await ensureAudioAll().catch(() => undefined);
    earcon(record);
  };
  return (
    <div data-earcons={played} data-testid="record-picker">
      <RecordGrid records={records} value={value} onChange={(r) => void pick(r)} />
    </div>
  );
}
