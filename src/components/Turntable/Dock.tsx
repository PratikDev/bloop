"use client";

import {
  CircleHelp,
  Disc3,
  Gauge,
  Layers,
  LocateFixed,
  Minus,
  Pause,
  Play,
  Plus,
  Route,
  ScanEye,
  Search,
  Settings2,
  Square,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactElement, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { useAppState, useT } from "../AppState/use-app-state";
import { useTT } from "./i18n";
import type { CameraMode } from "./scene";
import { SleeveRow } from "./SleeveRow";

const DOCK_BUTTON = "size-11 rounded-full text-moon hover:bg-tide/60 active:scale-95 aria-pressed:bg-amber aria-pressed:text-ink motion-reduce:active:scale-100";

export interface DockProps {
  ref?: Ref<HTMLDivElement>;
  rotating: boolean;
  speed: number;
  touring: boolean;
  cameraMode: CameraMode;
  covers: Partial<Record<TrackMode, string>>;
  onPlay(): void;
  onToggleRotation(): void;
  onSpeed(step: 1 | -1): void;
  onSearch(): void;
  onWhereAmI(): void;
  onTour(): void;
  onRecord(track: TrackMode): void;
  onCameraMode(mode: CameraMode): void;
  onLayers(): void;
  onSettings(): void;
  onHelp(): void;
}

/** An icon button with a tooltip naming it and its key; `render` lets a popover trigger wrap it. */
function DockButton({
  icon: Icon,
  label,
  keys,
  pressed,
  onClick,
  wrap,
}: {
  icon: LucideIcon;
  label: string;
  keys?: string;
  pressed?: boolean;
  onClick?: () => void;
  wrap?: (button: ReactElement) => ReactElement;
}) {
  const button = <Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} onClick={onClick} className={DOCK_BUTTON} />;
  return (
    <Tooltip>
      <TooltipTrigger render={wrap ? wrap(button) : button}>
        <Icon aria-hidden="true" className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="tt-warm text-body">
        {label}
        {keys && <kbd className="ml-2 rounded border border-line px-1 text-small text-haze">{keys}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/** The one floating control strip: everything else opens from here, closed by default. */
export function Dock({ ref, ...p }: DockProps) {
  const { state } = useAppState();
  const t = useT();
  const { tt } = useTT();
  const [recordsOpen, setRecordsOpen] = useState(false);
  const playLabel = t(!state.soundOn ? "sound.turnOn" : state.playing ? "sound.pause" : "sound.play");

  return (
    <div ref={ref} role="group" aria-label={tt("turntable.dock")} className="glass-dock flex flex-wrap items-center justify-center gap-1 rounded-full p-1.5">
      <DockButton icon={state.playing ? Pause : Play} label={playLabel} pressed={state.playing} onClick={p.onPlay} />
      <Popover>
        <DockButton icon={Gauge} label={tt("turntable.dock.speed")} keys="Space [ ]" wrap={(b) => <PopoverTrigger render={b} />} />
        <PopoverContent side="top" className="tt-warm glass-card w-auto gap-3 p-3 text-body">
          <Button variant="secondary" onClick={p.onToggleRotation} className="h-11 gap-2 px-3 text-body">
            {p.rotating ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
            {tt(p.rotating ? "turntable.stopTurning" : "turntable.turn")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={tt("turntable.slower")} onClick={() => p.onSpeed(-1)} className="size-11">
              <Minus aria-hidden="true" />
            </Button>
            <span aria-live="polite" className="min-w-20 text-center text-moon tabular-nums">
              {tt("turntable.speed", { speed: p.speed })}
            </span>
            <Button variant="ghost" size="icon" aria-label={tt("turntable.faster")} onClick={() => p.onSpeed(1)} className="size-11">
              <Plus aria-hidden="true" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
      <DockButton icon={Search} label={tt("turntable.search.label")} keys="/" onClick={p.onSearch} />
      <DockButton icon={LocateFixed} label={tt("turntable.where.button")} keys="L" onClick={p.onWhereAmI} />
      <DockButton icon={Route} label={tt(p.touring ? "turntable.tour.stop" : "turntable.tour.start")} keys="T" pressed={p.touring} onClick={p.onTour} />
      <Popover open={recordsOpen} onOpenChange={setRecordsOpen}>
        <DockButton icon={Disc3} label={tt("turntable.records")} keys="R" wrap={(b) => <PopoverTrigger render={b} />} />
        <PopoverContent side="top" className="tt-warm glass-card w-[min(46rem,calc(100vw-2rem))] p-4">
          <SleeveRow
            covers={p.covers}
            onSelect={(track) => {
              p.onRecord(track);
              setRecordsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <DockButton
        icon={ScanEye}
        label={tt(p.cameraMode === "explore" ? "turntable.view.jukebox" : "turntable.view.explore")}
        keys="V"
        pressed={p.cameraMode === "explore"}
        onClick={() => p.onCameraMode(p.cameraMode === "explore" ? "jukebox" : "explore")}
      />
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
      <DockButton icon={Layers} label={tt("turntable.dock.layers")} keys="O" onClick={p.onLayers} />
      <DockButton icon={Settings2} label={tt("turntable.dock.settings")} onClick={p.onSettings} />
      <DockButton icon={CircleHelp} label={tt("turntable.dock.help")} keys="H" onClick={p.onHelp} />
    </div>
  );
}
