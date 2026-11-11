"use client";

import type { GraceContextFile } from "@/types/data-contract";
import { useT } from "./AppState/use-app-state";

export function WaterNote({ grace }: { grace: GraceContextFile }) {
  const t = useT();
  return (
    <p data-testid="water-note" className="text-small text-moon">
      {t("water.bangladeshWide", { deg: grace.mascon_deg })}
    </p>
  );
}
