"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useT } from "../AppState/use-app-state";
import { Credits } from "../Credits";
import { ProductCredits } from "../ProductCredits";
import { useTT } from "./i18n";

/** The full list (assets, licences, data) in a dialog: names stay as in English, the labels follow the language. Opened from More or a drawer. */
export function CreditsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const { tt } = useTT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tt-warm on-space max-w-lg rounded-sheet text-body">
        <DialogTitle className="font-wide text-title text-moon">{tt("turntable.creditsLink")}</DialogTitle>
        <DialogDescription className="text-body text-moon">
          {tt("turntable.credits")}
        </DialogDescription>
        <Credits t={t} className="text-body" />
        <ProductCredits />
      </DialogContent>
    </Dialog>
  );
}

/** A key that opens the credits, where it can stay mounted (a drawer, not a menu that closes as it opens). */
export function CreditsLink({ className }: { className?: string }) {
  const { tt } = useTT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" aria-haspopup="dialog" onClick={() => setOpen(true)} className={className}>
        {tt("turntable.creditsLink")}
      </Button>
      <CreditsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
