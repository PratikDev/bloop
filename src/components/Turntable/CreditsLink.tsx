"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useT } from "../AppState/use-app-state";
import { Credits } from "../Credits";
import { ProductCredits } from "../ProductCredits";
import { useTT } from "./i18n";

/** A tiny link in the corner; the full list (assets, licences, data) opens in a dialog. Attribution stays English. */
export function CreditsLink({ className }: { className?: string }) {
  const t = useT();
  const { tt } = useTT();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className={className} />}>{tt("turntable.creditsLink")}</DialogTrigger>
      <DialogContent className="tt-warm on-space max-w-lg rounded-sheet text-body">
        <DialogTitle className="font-wide text-title text-moon">{tt("turntable.creditsLink")}</DialogTitle>
        <DialogDescription lang="en" className="text-body text-moon">
          {tt("turntable.credits")}
        </DialogDescription>
        {/* Phase 6's flat land replaces the Blue Marble texture; this note goes with it. */}
        <p className="text-body text-moon">{tt("turntable.background")}</p>
        <Credits t={t} className="text-body" />
        <ProductCredits />
      </DialogContent>
    </Dialog>
  );
}
