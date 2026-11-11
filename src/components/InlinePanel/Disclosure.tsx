"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { InlinePanel, type InlinePanelProps } from ".";

type DataAttributes = { [key: `data-${string}`]: string };

interface InlineDisclosureProps extends Omit<InlinePanelProps, "onClose" | "id"> {
  trigger: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerData?: DataAttributes;
}

export function InlineDisclosure({ trigger, triggerLabel, triggerClassName, triggerData, ...panel }: InlineDisclosureProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <Button variant="ghost" aria-label={triggerLabel} aria-expanded={open} aria-controls={open ? id : undefined} className={triggerClassName} onClick={() => setOpen((o) => !o)} {...triggerData}>
        {trigger}
      </Button>
      {open && <InlinePanel {...panel} id={id} onClose={() => setOpen(false)} />}
    </>
  );
}
