"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LetterInput } from "@/lib/art/letter/letter";
import { FLAGS } from "@/lib/flags";
import { useT } from "../../AppState/use-app-state";
import { LetterCard } from "./LetterCard";

/**
 * "Leave a letter from this record" on DATA's records (fire weather, landslide exposure, night lights): the same dated
 * card, built only from the record's files (src/lib/art/letter/data-records.ts). Category records record their class
 * and say it is not a measurement; a cloud-masked night is a gap. The record's own Play keeps its sound.
 */
export function RecordLetter({ letter }: { letter: LetterInput | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!FLAGS.artLetter || !letter) return null;
  return (
    <div className="space-y-3" data-testid="record-letter">
      <Button variant="outline" className="h-11 rounded-full px-4 text-body" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t("letter.leaveHere")}
      </Button>
      {open && <LetterCard letter={letter} lon={0} onClose={() => setOpen(false)} />}
    </div>
  );
}
