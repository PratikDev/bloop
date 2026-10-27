"use client";

import {
  CircleHelp,
  Disc3,
  Gauge,
  Layers,
  LocateFixed,
  Pause,
  Play,
  Route,
  ScanEye,
  Search,
  Settings2,
  Square,
} from "lucide-react";
import { useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { useAppState, useT } from "../AppState/use-app-state";
import { DockButton, DockDivider, SpeedStepper } from "./DockButton";
import { useTT } from "./i18n";
import type { CameraMode } from "./scene";
import type { SceneId } from "../Scenes/registry";
import { SleeveRow } from "./SleeveRow";

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
  onScene(id: SceneId): void;
  onCameraMode(mode: CameraMode): void;
  onLayers(): void;
  onSettings(): void;
  onHelp(): void;
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
          <SpeedStepper text={tt("turntable.speed", { speed: p.speed })} slower={tt("turntable.slower")} faster={tt("turntable.faster")} onStep={p.onSpeed} />
        </PopoverContent>
      </Popover>
      <DockDivider />
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
            onScene={(id) => {
              setRecordsOpen(false);
              p.onScene(id);
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
      <DockDivider />
      <DockButton icon={Layers} label={tt("turntable.dock.layers")} keys="O" onClick={p.onLayers} />
      <DockButton icon={Settings2} label={tt("turntable.dock.settings")} onClick={p.onSettings} />
      <DockButton icon={CircleHelp} label={tt("turntable.dock.help")} keys="H" onClick={p.onHelp} />
    </div>
  );
}
