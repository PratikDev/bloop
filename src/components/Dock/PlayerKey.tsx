"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { openPlayerSheet } from "../Player/player-sheet-store";
import { useRecords } from "../Records/use-records";
import { VinylMark } from "../VinylMark";

/** Opens the player sheet where the sleeve isn't shown. */
export function PlayerKey({ className }: { className?: string }) {
  const { current } = useRecords();
  const t = useT();
  if (!current) return null;
  return (
    <Button
      variant="ghost"
      aria-haspopup="dialog"
      aria-label={t("player.open", { record: `${current.code} ${current.title(t)}` })}
      onClick={(e) => openPlayerSheet(e.currentTarget)}
      className={cn("key size-11 shrink-0 rounded-lg bg-paper p-0 hover:bg-paper", className)}
    >
      <VinylMark className="size-7" />
    </Button>
  );
}
