"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LetterInput } from "@/lib/art/letter/letter";
import { FLAGS } from "@/lib/flags";
import { useT } from "../../AppState/use-app-state";
import { LetterCard } from "./LetterCard";

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
