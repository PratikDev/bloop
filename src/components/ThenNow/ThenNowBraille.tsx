"use client";

import { useRef } from "react";
import { brailleLabel } from "@/a11y/aria";
import { Button } from "@/components/ui/button";
import { useT } from "../AppState/use-app-state";
import { BrailleExplorer } from "../BrailleExplorer";
import { useThenNowBrailleSource, type ThenNowBrailleInput } from "./use-then-now-braille-source";

/**
 * Then vs Now's Braille Data Explorer, beside the part's play controls: a button (or B on the page)
 * opens it; closing gives focus back to the button.
 */
export function ThenNowBraille({ input, open, onOpenChange }: { input: ThenNowBrailleInput; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const button = useRef<HTMLButtonElement>(null);
  const source = useThenNowBrailleSource(open ? input : null);
  const close = () => {
    onOpenChange(false);
    button.current?.focus();
  };
  return (
    <>
      <Button ref={button} variant="outline" className="h-11" aria-expanded={open} onClick={() => onOpenChange(!open)} {...brailleLabel(t("braille.bl.braille"))}>
        {t("braille.open")}
      </Button>
      {open && source && <BrailleExplorer key={source.key} source={source} onClose={close} />}
    </>
  );
}
