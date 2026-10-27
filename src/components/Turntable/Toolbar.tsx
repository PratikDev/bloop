"use client";

import { Compass, Grid3x3, LocateFixed, Map as MapIcon, Minus, Pause, Play, Plus, Route, Square, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ChoiceGroup } from "../ChoiceGroup";
import { useTT } from "./i18n";
import { QUALITIES, type TextureQuality } from "./textures";
import { SPEEDS } from "./use-turntable";
import type { CameraMode } from "./scene";

const BUTTON = "h-11 gap-2 px-3 text-body";
const ICON_BUTTON = "size-11";
/** Choice groups wrap rather than overflow (Bangla labels are longer). */
const WRAP = "flex-wrap";

export interface ToolbarSettings {
  dataOpacity: number; // 0..1
  sunAtFrameTime: boolean;
  graticule: boolean;
  quality: TextureQuality | null;
}

export interface ToolbarProps {
  rotating: boolean;
  speed: number;
  cameraMode: CameraMode;
  touring: boolean;
  settings: ToolbarSettings;
  onToggleRotation(): void;
  onSpeed(step: 1 | -1): void;
  onZoom(step: 1 | -1): void;
  onCameraMode(mode: CameraMode): void;
  onTour(): void;
  onMyLocation(): void;
  onWhereAmI(): void;
  onFlatMap(): void;
  onSettings(next: Partial<ToolbarSettings>): void;
  className?: string;
}

/** Every Turntable key has a button here (or on the globe and sleeves). */
export function Toolbar(p: ToolbarProps) {
  const { tt } = useTT();
  const quality = p.settings.quality === null ? "auto" : String(p.settings.quality);
  return (
    <div className={cn("space-y-3", p.className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={p.onWhereAmI} className={BUTTON}>
          <Compass aria-hidden="true" />
          {tt("turntable.where.button")}
        </Button>
        <Button variant={p.touring ? "secondary" : "outline"} onClick={p.onTour} className={BUTTON}>
          {p.touring ? <Square aria-hidden="true" /> : <Route aria-hidden="true" />}
          {tt(p.touring ? "turntable.tour.stop" : "turntable.tour.start")}
        </Button>
        <Button variant="outline" onClick={p.onMyLocation} className={BUTTON} title={tt("turntable.myLocation.note")}>
          <LocateFixed aria-hidden="true" />
          {tt("turntable.myLocation")}
        </Button>
        <Button variant="outline" onClick={p.onFlatMap} className={BUTTON}>
          <MapIcon aria-hidden="true" />
          {tt("turntable.flatMap")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={p.onToggleRotation} className={BUTTON}>
          {p.rotating ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {tt(p.rotating ? "turntable.stopTurning" : "turntable.turn")}
        </Button>
        <Button variant="ghost" size="icon-lg" onClick={() => p.onSpeed(-1)} disabled={p.speed === SPEEDS[0]} aria-label={tt("turntable.slower")} className={ICON_BUTTON}>
          <Minus aria-hidden="true" />
        </Button>
        <span className="min-w-20 text-center text-body text-moon tabular-nums">{tt("turntable.speed", { speed: p.speed })}</span>
        <Button variant="ghost" size="icon-lg" onClick={() => p.onSpeed(1)} disabled={p.speed === SPEEDS[SPEEDS.length - 1]} aria-label={tt("turntable.faster")} className={ICON_BUTTON}>
          <Plus aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-lg" onClick={() => p.onZoom(-1)} aria-label={tt("turntable.zoomOut")} className={ICON_BUTTON}>
          <ZoomOut aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-lg" onClick={() => p.onZoom(1)} aria-label={tt("turntable.zoomIn")} className={ICON_BUTTON}>
          <ZoomIn aria-hidden="true" />
        </Button>
      </div>

      <ChoiceGroup<CameraMode>
        label={tt("turntable.view.label")}
        value={p.cameraMode}
        onChange={p.onCameraMode}
        options={[
          { value: "jukebox", label: tt("turntable.view.jukebox") },
          { value: "explore", label: tt("turntable.view.explore") },
        ]}
        className={WRAP}
        itemClassName="md:h-11"
      />

      <fieldset className="space-y-3 rounded-lg border border-haze p-3">
        <legend className="px-1 text-body font-medium text-moon">{tt("turntable.settings")}</legend>
        <div className="space-y-2">
          <p className="text-body text-moon">{tt("turntable.opacity.value", { percent: Math.round(p.settings.dataOpacity * 100) })}</p>
          <Slider
            value={[Math.round(p.settings.dataOpacity * 100)]}
            onValueChange={(v) => p.onSettings({ dataOpacity: (Array.isArray(v) ? v[0] : v) / 100 })}
            thumbLabel={tt("turntable.opacity")}
            className="h-11"
          />
        </div>
        <ChoiceGroup<"frame" | "day">
          label={tt("turntable.sun.label")}
          value={p.settings.sunAtFrameTime ? "frame" : "day"}
          onChange={(v) => p.onSettings({ sunAtFrameTime: v === "frame" })}
          options={[
            { value: "frame", label: tt("turntable.sun.frame") },
            { value: "day", label: tt("turntable.sun.day") },
          ]}
          className={WRAP}
          itemClassName="md:h-11"
        />
        <Toggle
          variant="outline"
          pressed={p.settings.graticule}
          onPressedChange={(on) => p.onSettings({ graticule: on })}
          className="h-11 gap-2 px-3 text-body aria-pressed:bg-tide"
        >
          <Grid3x3 aria-hidden="true" />
          {tt("turntable.graticule")}
        </Toggle>
        <div className="space-y-1">
          <p className="text-body text-moon">{tt("turntable.quality")}</p>
          <ChoiceGroup<string>
            label={tt("turntable.quality")}
            value={quality}
            onChange={(v) => p.onSettings({ quality: v === "auto" ? null : (Number(v) as TextureQuality) })}
            options={[
              { value: "auto", label: tt("turntable.quality.auto") },
              ...QUALITIES.map((q) => ({ value: String(q), label: tt("turntable.quality.size", { size: q }) })),
            ]}
            className={WRAP}
            itemClassName="md:h-11"
          />
        </div>
      </fieldset>
    </div>
  );
}
