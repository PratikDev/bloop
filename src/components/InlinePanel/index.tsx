"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";

export interface InlinePanelProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  id?: string;
  className?: string;
  testId?: string;
}

/**
 * What a dialog or a side sheet shows, opened in the page instead (low-vision mode, spec 4.5: "no full-screen pop-ups;
 * panels open inline, next to what opened them"). A labelled region whose heading takes focus when it opens (a
 * magnifier following focus lands on it); Escape or Close shuts it and focus goes back to what opened it.
 */
export function InlinePanel({ title, description, onClose, children, id, className, testId }: InlinePanelProps) {
  const t = useT();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    heading.current?.focus();
    return () => {
      // Back to the opener when focus was in the panel (or fell to the page) as it closed.
      const lost = document.activeElement === document.body || document.activeElement === null;
      if (lost && opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-inline-panel=""
      data-testid={testId}
      onKeyDown={onKeyDown}
      className={cn("w-full basis-full space-y-3 rounded-plate bg-dusk p-4 text-body text-moon ring-2 ring-glass-edge", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} ref={heading} tabIndex={-1} className="font-serif text-title">
          {title}
        </h2>
        <Button variant="ghost" size="icon-lg" onClick={onClose} aria-label={t("inspector.close")} className="size-11 shrink-0 text-haze hover:text-moon">
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>
      {description && <p className="text-haze">{description}</p>}
      {children}
    </section>
  );
}
