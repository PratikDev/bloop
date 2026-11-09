"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { InlinePanel, type InlinePanelProps } from ".";

/** Extra attributes for the trigger, e.g. the data-* hooks the page checks look for. */
type DataAttributes = { [key: `data-${string}`]: string };

interface InlineDisclosureProps extends Omit<InlinePanelProps, "onClose" | "id"> {
  /** What the button shows. */
  trigger: ReactNode;
  /** The button's accessible name, when it differs from what it shows. */
  triggerLabel?: string;
  triggerClassName?: string;
  triggerData?: DataAttributes;
}

/**
 * A button that opens its panel in the page, right after itself (low-vision mode's stand-in for a dialog or sheet that
 * has its own trigger). The button says whether the panel is open (aria-expanded) and which region it opens.
 */
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
