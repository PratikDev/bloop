"use client";

import { ArrowLeft, CircleHelp, Gauge, Layers, Pause, Play } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCommands } from "../../Commands/use-commands";
import { DockButton, DockDivider, SpeedStepper } from "../../Turntable/DockButton";
import { useTT } from "../../Turntable/i18n";

export interface SceneDockProps {
  ref?: Ref<HTMLDivElement>;
  playing: boolean;
  onPlay(): void;
  /** The speed readout ("1×", "0.5 years/s"). */
  speedText: string;
  onSpeed(step: 1 | -1): void;
  onBack(): void;
  onLayers(): void;
  /** Scene-specific buttons, between Speed and Back. */
  extra?: ReactNode;
}

/** A scene's dock: Play/Pause, Speed, Back to turntable, Layers, Help (the Turntable dock's look and keys). */
export function SceneDock({ ref, playing, onPlay, speedText, onSpeed, onBack, onLayers, extra }: SceneDockProps) {
  const { tt } = useTT();
  const commands = useCommands();
  return (
    <div ref={ref} role="group" aria-label={tt("turntable.dock")} className="glass-dock flex flex-wrap items-center justify-center gap-1 rounded-full p-1.5">
      <DockButton icon={playing ? Pause : Play} label={tt(playing ? "scenes.pause" : "scenes.play")} keys="Space" pressed={playing} onClick={onPlay} />
      <Popover>
        <DockButton icon={Gauge} label={tt("turntable.dock.speed")} keys="[ ]" wrap={(b) => <PopoverTrigger render={b} />} />
        <PopoverContent side="top" className="tt-warm glass-card w-auto p-3 text-body">
          <SpeedStepper text={speedText} slower={tt("turntable.slower")} faster={tt("turntable.faster")} onStep={onSpeed} />
        </PopoverContent>
      </Popover>
      {extra}
      <DockDivider />
      <DockButton icon={ArrowLeft} label={tt("scenes.back")} keys="Esc" onClick={onBack} />
      <DockButton icon={Layers} label={tt("turntable.dock.layers")} keys="O" onClick={onLayers} />
      <DockButton icon={CircleHelp} label={tt("turntable.dock.help")} keys="H" onClick={commands.openHelp} />
    </div>
  );
}
