"use client";

import { Info } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Provenance } from "@/lib/provenance/types";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { InlineDisclosure } from "../InlinePanel/Disclosure";
import { useInlinePanels } from "../LowVision/use-inline-panels";
import { Facts } from "./Facts";

export function HowWeGotThis({ facts, className }: { facts: readonly Provenance[]; className?: string }) {
  const t = useT();
  const inline = useInlinePanels();
  if (!facts.length) return null;
  const subject = facts.map((f) => f.subject).join(", ");
  const name = t("hwgt.name", { subject });
  const triggerClassName = cn("h-9 gap-1.5 rounded-full px-3 text-small text-moon ring-1 ring-glass-edge hover:bg-tide", className);
  const trigger = (
    <>
      <Info aria-hidden="true" className="size-4" />
      {t("hwgt.button")}
    </>
  );
  const body =
    facts.length === 1 ? (
      <Facts t={t} facts={facts[0]} />
    ) : (
      facts.map((f) => (
        <section key={f.subject} className="space-y-2">
          <h3 className="text-lead font-medium text-moon">{f.subject}</h3>
          <Facts t={t} facts={f} />
        </section>
      ))
    );
  if (inline) {
    return (
      <InlineDisclosure trigger={trigger} triggerLabel={name} triggerClassName={triggerClassName} triggerData={{ "data-how-we-got-this": "" }} title={name} description={t("hwgt.intro")} testId="how-we-got-this">
        {body}
      </InlineDisclosure>
    );
  }
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" aria-label={name} data-how-we-got-this="" className={triggerClassName} />}>{trigger}</DialogTrigger>
      <DialogContent closeLabel={t("inspector.close")} className="max-h-[85dvh] overflow-y-auto bg-dusk text-body sm:max-w-xl" data-testid="how-we-got-this">
        <DialogTitle className="pr-10 font-serif text-title">{name}</DialogTitle>
        <DialogDescription className="text-body text-haze">{t("hwgt.intro")}</DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}

export function ProvenanceGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-provenance-group="" className={className}>
      {children}
    </div>
  );
}
