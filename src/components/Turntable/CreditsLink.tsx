"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataCredits } from "../DataCredits";
import { useInlinePanels } from "../LowVision/use-inline-panels";
import { useTT } from "./i18n";

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
