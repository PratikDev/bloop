"use client";

import {
  Bookmark,
  CircleHelp,
  Disc3,
  Gauge,
  Layers,
  LocateFixed,
  Pause,
  Play,
  RotateCw,
  Route,
  ScanEye,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import { useAppState, useT } from "../AppState/use-app-state";
import { MixerContent, useMixerLimited } from "../Dock/MixerMenu";
import type { DockAction, DockView } from "./dock-actions";
import { DockButton, SpeedStepper } from "./DockButton";
import { DockMore } from "./DockMore";
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
  bookmarks: readonly string[];
  onPlay(): void;
  onToggleRotation(): void;
  onSpeed(step: 1 | -1): void;
  onSearch(): void;
  onWhereAmI(): void;
  onTour(): void;
  onRecord(track: TrackMode): void;
  onScene(id: SceneId): void;
  onCameraMode(mode: CameraMode): void;
  onBookmark(n: number): void;
  onLayers(): void;
  onSettings(): void;
  onSources(): void;
  onHelp(): void;
  /** The sound caption, on its own row at the top of the bar. */
  caption: ReactNode;
}

/** The Turntable's bar: Play, four labelled keys, and More for everything else. Every action comes from one list. */
export function Dock({ ref, ...p }: DockProps) {
  const { state } = useAppState();
  const t = useT();
  const { tt } = useTT();
  const mixerLimited = useMixerLimited();
  const explore = p.cameraMode === "explore";

  const actions: DockAction[] = [
    { id: "play", place: "key", primary: true, icon: state.playing ? Pause : Play, label: t(!state.soundOn ? "sound.turnOn" : state.playing ? "sound.pause" : "sound.play"), pressed: state.playing, onClick: p.onPlay },
    { id: "turn", place: "key", icon: p.rotating ? Square : RotateCw, label: tt(p.rotating ? "turntable.stopTurning" : "turntable.turn"), keys: "Space", pressed: p.rotating, onClick: p.onToggleRotation },
    { id: "search", place: "key", icon: Search, label: tt("turntable.search.label"), short: tt("turntable.search.short"), keys: "/", onClick: p.onSearch },
    { id: "where", place: "key", icon: LocateFixed, label: tt("turntable.where.button"), keys: "L", onClick: p.onWhereAmI },
    { id: "mixer", place: "key", icon: SlidersHorizontal, label: t(mixerLimited ? "mixer.limited" : "mixer.label"), short: t("dock.short.mixer"), popover: <MixerContent /> },
    { id: "bookmarks", place: "more", icon: Bookmark, label: tt("turntable.bookmarks"), keys: "1–9", view: "bookmarks" },
    { id: "layers", place: "more", icon: Layers, label: tt("turntable.dock.layers"), keys: "O", onClick: p.onLayers },
    { id: "view", place: "more", icon: ScanEye, label: tt(explore ? "turntable.view.jukebox" : "turntable.view.explore"), keys: "V", pressed: explore, onClick: () => p.onCameraMode(explore ? "jukebox" : "explore") },
    { id: "keys", place: "more", icon: CircleHelp, label: tt("turntable.dock.help"), keys: "H", onClick: p.onHelp },
    { id: "sources", place: "more", icon: ShieldCheck, label: tt("turntable.sources"), onClick: p.onSources },
    { id: "records", place: "more", icon: Disc3, label: tt("turntable.records"), keys: "R", view: "records" },
    { id: "tour", place: "more", icon: Route, label: tt(p.touring ? "turntable.tour.stop" : "turntable.tour.start"), keys: "T", pressed: p.touring, onClick: p.onTour },
    { id: "speed", place: "more", icon: Gauge, label: tt("turntable.dock.speed"), keys: "[ ]", view: "speed" },
    { id: "settings", place: "more", icon: Settings2, label: tt("turntable.dock.settings"), onClick: p.onSettings },
  ];

  const view = (id: DockView, close: () => void) => {
    if (id === "speed") {
      return <SpeedStepper text={tt("turntable.speed", { speed: p.speed })} slower={tt("turntable.slower")} faster={tt("turntable.faster")} onStep={p.onSpeed} />;
    }
    if (id === "bookmarks") {
      return p.bookmarks.map((place, i) => (
        <Button
          key={place}
          variant="ghost"
          onClick={() => {
            close();
            p.onBookmark(i + 1);
          }}
          className="key h-auto min-h-11 justify-start rounded-lg bg-paper px-3 py-1 text-left text-body font-normal whitespace-normal text-moon hover:bg-paper"
        >
          {tt("turntable.bookmark", { key: i + 1, place })}
        </Button>
      ));
    }
    return (
      <SleeveRow
        covers={p.covers}
        onSelect={(track) => {
          p.onRecord(track);
          close();
        }}
        onScene={(scene) => {
          close();
          p.onScene(scene);
        }}
      />
    );
  };

  return (
    <div ref={ref} role="group" aria-label={tt("turntable.dock")} className="on-space flex flex-wrap items-center justify-center gap-2 rounded-sheet p-2">
      <div className="basis-full empty:hidden">{p.caption}</div>
      {actions
        .filter((a) => a.place === "key")
        .map((a) =>
          a.popover ? (
            <Popover key={a.id}>
              <DockButton icon={a.icon} label={a.label} short={a.short} wrap={(b) => <PopoverTrigger render={b} />} />
              {a.popover}
            </Popover>
          ) : (
            <DockButton key={a.id} icon={a.icon} label={a.label} short={a.short} keys={a.keys} pressed={a.pressed} primary={a.primary} onClick={a.onClick} />
          ),
        )}
      <DockMore actions={actions.filter((a) => a.place === "more")} view={view} />
    </div>
  );
}
