"use client";

import {
  ArrowClockwise,
  ArrowsOutCardinal,
  BookmarkSimple,
  Crosshair,
  Disc,
  Gauge,
  GearSix,
  MagnifyingGlass,
  MagnifyingGlassPlus,
  Path,
  Question,
  Scroll,
  ShieldCheck,
  SlidersHorizontal,
  Stack,
  Stop,
} from "@phosphor-icons/react";
import type { ReactNode, Ref } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import { useT } from "../AppState/use-app-state";
import { MiniPlayer } from "../Dock/MiniPlayer";
import { MixerContent, MixerPanel, useMixerLimited } from "../Dock/MixerMenu";
import { NeedleSlider } from "../Dock/NeedleSliders";
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
  /** The sound caption, above the needle sliders. */
  caption: ReactNode;
  /** Opens the credits (a dialog kept outside More, so it survives the menu closing). */
  onCredits(): void;
}

/** The Turntable's bar: the shared mini player with four labelled keys and More. Every action comes from one list. */
export function Dock({ ref, ...p }: DockProps) {
  const t = useT();
  const { tt } = useTT();
  const mixerLimited = useMixerLimited();
  const explore = p.cameraMode === "explore";

  const actions: DockAction[] = [
    { id: "turn", place: "key", icon: p.rotating ? Stop : ArrowClockwise, label: tt(p.rotating ? "turntable.stopTurning" : "turntable.turn"), keys: "Space", pressed: p.rotating, onClick: p.onToggleRotation },
    { id: "search", place: "key", icon: MagnifyingGlass, label: tt("turntable.search.label"), short: tt("turntable.search.short"), keys: "/", onClick: p.onSearch },
    { id: "where", place: "key", phoneMore: true, icon: Crosshair, label: tt("turntable.where.button"), keys: "L", onClick: p.onWhereAmI },
    { id: "mixer", place: "key", phoneMore: true, view: "mixer", icon: SlidersHorizontal, label: t(mixerLimited ? "mixer.limited" : "mixer.label"), short: t("dock.short.mixer"), popover: <MixerContent /> },
    { id: "needle", place: "more", icon: ArrowsOutCardinal, label: t("needle.group"), view: "needle" },
    { id: "bookmarks", place: "more", icon: BookmarkSimple, label: tt("turntable.bookmarks"), keys: "1–9", view: "bookmarks" },
    { id: "layers", place: "more", icon: Stack, label: tt("turntable.dock.layers"), keys: "O", onClick: p.onLayers },
    { id: "view", place: "more", icon: MagnifyingGlassPlus, label: tt(explore ? "turntable.view.jukebox" : "turntable.view.explore"), keys: "V", pressed: explore, onClick: () => p.onCameraMode(explore ? "jukebox" : "explore") },
    { id: "keys", place: "more", icon: Question, label: tt("turntable.dock.help"), keys: "H", onClick: p.onHelp },
    { id: "sources", place: "more", icon: ShieldCheck, label: tt("turntable.sources"), onClick: p.onSources },
    { id: "records", place: "more", icon: Disc, label: tt("turntable.records"), keys: "R", view: "records" },
    { id: "tour", place: "more", icon: Path, label: tt(p.touring ? "turntable.tour.stop" : "turntable.tour.start"), keys: "T", pressed: p.touring, onClick: p.onTour },
    { id: "speed", place: "more", icon: Gauge, label: tt("turntable.dock.speed"), keys: "[ ]", view: "speed" },
    { id: "credits", place: "more", icon: Scroll, label: tt("turntable.creditsLink"), onClick: p.onCredits },
    { id: "settings", place: "more", icon: GearSix, label: tt("turntable.dock.settings"), onClick: p.onSettings },
  ];

  const view = (id: DockView, close: () => void) => {
    if (id === "mixer") return <MixerPanel />;
    if (id === "needle") {
      return (
        <div role="group" aria-label={t("needle.group")} className="space-y-1">
          <NeedleSlider axis="lon" />
          <NeedleSlider axis="lat" />
        </div>
      );
    }
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
    <div ref={ref} role="group" aria-label={tt("turntable.dock")}>
      <MiniPlayer
        caption={p.caption}
        fullWidthKeys
        keys={
          <>
            {actions
              .filter((a) => a.place === "key")
              .map((a) =>
                a.popover ? (
                  <Popover key={a.id}>
                    <DockButton icon={a.icon} label={a.label} short={a.short} className={a.phoneMore ? "max-md:hidden" : undefined} wrap={(b) => <PopoverTrigger render={b} />} />
                    {a.popover}
                  </Popover>
                ) : (
                  <DockButton key={a.id} icon={a.icon} label={a.label} short={a.short} keys={a.keys} pressed={a.pressed} className={a.phoneMore ? "max-md:hidden" : undefined} onClick={a.onClick} />
                ),
              )}
            <DockMore actions={[...actions.filter((a) => a.place === "key" && a.phoneMore), ...actions.filter((a) => a.place === "more")]} view={view} />
          </>
        }
      />
    </div>
  );
}
