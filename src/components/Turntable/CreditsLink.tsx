"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataCredits } from "../DataCredits";
import { useTT } from "./i18n";

/** A tiny link in the corner; the full list (assets, licences, data) opens in a dialog. Attribution stays English. */
export function CreditsLink({ className }: { className?: string }) {
  const { tt } = useTT();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className={className} />}>{tt("turntable.creditsLink")}</DialogTrigger>
      <DialogContent className="tt-warm glass-card max-h-[85dvh] max-w-lg overflow-y-auto text-body">
        <DialogTitle className="text-lead font-semibold text-moon">{tt("turntable.creditsLink")}</DialogTitle>
        <DialogDescription lang="en" className="text-body text-moon">
          {tt("turntable.credits")}
        </DialogDescription>
        <DataCredits level={2} />
      </DialogContent>
    </Dialog>
  );
}
