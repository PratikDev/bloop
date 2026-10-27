"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { pushEscapeHandler } from "@/lib/escape";
import { cn } from "@/lib/utils";
import { useAnnounce } from "../../Announcer/use-announcer";
import { useAppState } from "../../AppState/use-app-state";
import { CaptionBar } from "../../CaptionBar";
import { useCommands } from "../../Commands/use-commands";
import { Drawer } from "../../Turntable/Drawers";
import { useTT } from "../../Turntable/i18n";
import { SceneDock, type SceneDockProps } from "./SceneDock";

const LABEL_SHADOW = "[text-shadow:0_1px_3px_var(--label-shadow)]";

export interface SceneShellProps {
  title: string;
  /** Announced (live region) when the scene opens. */
  entry: string;
  /** The canvas and its pointer host, plus anything drawn over the 3D view (chip, labels). */
  stage: ReactNode;
  /** Top right: search, badges. */
  topRight?: ReactNode;
  /** Above the legend: a scrubber or a goal line. */
  controls?: ReactNode;
  legend: ReactNode;
  /** Disclosure lines from JSON (datasets, windows, "context layer"). */
  disclosure: readonly string[];
  dock: Omit<SceneDockProps, "onBack" | "onLayers" | "ref">;
  /** The Layers drawer's content. */
  layers: ReactNode;
  /** Scene keys first; return true if the key was used. */
  onKey(e: KeyboardEvent<HTMLElement>): boolean;
  /** I: open or close the details card. */
  onDetails(): void;
  onExit(): void;
}

/**
 * The frame every scene shares, in Turntable v3's language: full-bleed 3D, the
 * needle chip, a caption line, the slim legend, a disclosure line and one dock;
 * Layers opens on demand. Fades in (a cut with reduced motion); Esc or Back
 * returns to the turntable.
 */
export function SceneShell({ title, entry, stage, topRight, controls, legend, disclosure, dock, layers, onKey, onDetails, onExit }: SceneShellProps) {
  const { state } = useAppState();
  const { tt, rootLang } = useTT();
  const commands = useCommands();
  const announce = useAnnounce();
  const rootRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const exitRef = useRef(onExit);
  useEffect(() => {
    exitRef.current = onExit;
  });

  // On entry: focus the scene (keys work at once) and announce it.
  useEffect(() => {
    rootRef.current?.focus();
    announce(entry);
    // Announce once, on entry only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc goes back to the turntable (before the global Esc, which would leave the Turntable).
  useEffect(
    () =>
      pushEscapeHandler(() => {
        exitRef.current();
        return true;
      }),
    [],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (onKey(e)) {
      e.preventDefault();
      return;
    }
    const action = (() => {
      switch (e.key) {
        case " ":
          return dock.onPlay;
        case "[":
          return () => dock.onSpeed(-1);
        case "]":
          return () => dock.onSpeed(1);
        case "i":
        case "I":
          return onDetails;
        case "o":
        case "O":
          return () => setLayersOpen(true);
        case "h":
        case "H":
          return commands.openHelp;
        case "D":
          return e.shiftKey ? () => dockRef.current?.querySelector("button")?.focus() : null;
        default:
          return null;
      }
    })();
    if (!action) return;
    action();
    e.preventDefault();
  };

  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      lang={rootLang}
      aria-label={title}
      onKeyDown={onKeyDown}
      className={cn("tt-warm absolute inset-0 z-20 overflow-hidden bg-tt-black outline-none", !state.reduceMotion && "animate-scene-in")}
    >
      {stage}
      <h2 className={cn("pointer-events-none absolute top-3 left-4 max-w-[60%] font-display text-lead font-semibold text-moon", LABEL_SHADOW)}>{title}</h2>
      {topRight && <div className="pointer-events-none absolute top-3 right-3 left-3 flex items-start justify-end gap-2 pt-8 sm:pt-0">{topRight}</div>}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
        <div className="max-w-2xl text-center">
          <CaptionBar fade className={cn("min-h-0 text-body sm:text-lead", LABEL_SHADOW)} />
        </div>
        {controls && <div className="pointer-events-auto w-full max-w-xl">{controls}</div>}
        <div className="pointer-events-auto w-full max-w-md">{legend}</div>
        <p className={cn("max-w-2xl text-center text-small text-haze", LABEL_SHADOW)}>{disclosure.join(" · ")}</p>
        <div className="pointer-events-auto max-w-full">
          <SceneDock ref={dockRef} {...dock} onBack={onExit} onLayers={() => setLayersOpen(true)} />
        </div>
      </div>
      <Drawer open={layersOpen} onClose={() => setLayersOpen(false)} title={tt("turntable.dock.layers")} description={tt("scenes.layers.note")}>
        {layers}
      </Drawer>
    </section>
  );
}
