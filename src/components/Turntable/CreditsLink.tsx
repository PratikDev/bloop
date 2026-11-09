"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataCredits } from "../DataCredits";
import { useInlinePanels } from "../LowVision/use-inline-panels";
import { useTT } from "./i18n";

/**
 * A tiny link in the corner; the full list (assets, licences, data) opens in a dialog. Attribution stays English.
 * In low-vision mode it opens in the page instead, under the stage, as the drawers do (`onInline` opens that drawer).
 */
export function CreditsLink({ className, onInline }: { className?: string; onInline: () => void }) {
  const { tt } = useTT();
  const inline = useInlinePanels();
  if (inline) {
    return (
      <Button variant="ghost" className={className} onClick={onInline}>
        {tt("turntable.creditsLink")}
      </Button>
    );
  }
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

/** The credits as the low-vision drawer shows them (the same text and list as the dialog). */
export function CreditsBody() {
  const { tt } = useTT();
  return (
    <>
      <p lang="en" className="text-body text-moon">
        {tt("turntable.credits")}
      </p>
      <DataCredits level={2} />
    </>
  );
}
