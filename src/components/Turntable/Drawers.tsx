"use client";

import { LocateFixed, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ChoiceGroup } from "../ChoiceGroup";
import { Mixer } from "../Mixer";
import { OnOffToggle } from "../OnOffToggle";
import { PanelTabs } from "../panels/SidePanel";
import { SettingToggle } from "../SettingToggle";
import { useTT, type TT } from "./i18n";
import { TIERS, type Tier } from "./quality";
import type { TurntableSettings } from "./settings";

export type DrawerId = "layers" | "settings" | "howWeKnow";

const SECTION = "space-y-2";
const HEADING = "text-body font-semibold text-moon";

/** One slide-over drawer: right on wide screens, bottom sheet on phones. */
function Drawer({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode }) {
  const phone = useMediaQuery("(max-width: 767px)");
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={phone ? "bottom" : "right"}
        className={cn("tt-warm glass-card overflow-y-auto p-5 text-body", phone ? "max-h-[85dvh] rounded-t-sheet" : "w-full rounded-l-sheet sm:max-w-md")}
      >
        <SheetTitle className="text-lead font-semibold text-moon">{title}</SheetTitle>
        {description && <SheetDescription className="text-body text-haze">{description}</SheetDescription>}
        <div className="mt-2 space-y-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

type Update = (next: Partial<TurntableSettings>) => void;

const LAYER_KEYS = ["clouds", "labels", "borders", "districts", "rivers", "graticule"] as const;
const LAYER_LABELS = {
  clouds: "turntable.layers.clouds",
  labels: "turntable.layers.labels",
  borders: "turntable.layers.borders",
  districts: "turntable.layers.districts",
  rivers: "turntable.layers.rivers",
  graticule: "turntable.graticule",
} as const satisfies Record<(typeof LAYER_KEYS)[number], Parameters<TT>[0]>;

function LayersBody({ settings, update }: { settings: TurntableSettings; update: Update }) {
  const { tt } = useTT();
  const percent = Math.round(settings.dataOpacity * 100);
  return (
    <>
      <section className={SECTION}>
        <p className={HEADING}>{tt("turntable.opacity.value", { percent })}</p>
        <Slider
          value={[percent]}
          onValueChange={(v) => update({ dataOpacity: (Array.isArray(v) ? v[0] : v) / 100 })}
          thumbLabel={tt("turntable.opacity")}
        />
      </section>
      <section className={SECTION}>
        <p className={HEADING}>{tt("turntable.layers.decoration")}</p>
        <div className="grid grid-cols-2 gap-2">
          {LAYER_KEYS.map((key) => (
            <OnOffToggle key={key} label={tt(LAYER_LABELS[key])} on={settings[key]} onChange={(on) => update({ [key]: on })} />
          ))}
        </div>
      </section>
      <section className={SECTION}>
        <p className={HEADING}>{tt("turntable.sun.label")}</p>
        <ChoiceGroup<"frame" | "day">
          label={tt("turntable.sun.label")}
          value={settings.sunAtFrameTime ? "frame" : "day"}
          onChange={(v) => update({ sunAtFrameTime: v === "frame" })}
          options={[
            { value: "frame", label: tt("turntable.sun.frame") },
            { value: "day", label: tt("turntable.sun.day") },
          ]}
          className="flex-wrap"
          itemClassName="h-11"
        />
      </section>
      <section className={SECTION}>
        <p className={HEADING}>{tt("turntable.layers.sound")}</p>
        <Mixer className="flex-col items-start" />
      </section>
    </>
  );
}

function SettingsBody({ settings, update, onMyLocation, onFlatMap }: { settings: TurntableSettings; update: Update; onMyLocation: () => void; onFlatMap: () => void }) {
  const { tt } = useTT();
  return (
    <>
      <section className={SECTION}>
        <p className={HEADING}>{tt("turntable.quality")}</p>
        <ChoiceGroup<Tier | "auto">
          label={tt("turntable.quality")}
          value={settings.quality ?? "auto"}
          onChange={(v) => update({ quality: v === "auto" ? null : v })}
          options={[{ value: "auto", label: tt("turntable.quality.auto") }, ...TIERS.map((t) => ({ value: t, label: tt(`turntable.quality.${t}`) }))]}
          className="flex-wrap"
          itemClassName="h-11"
        />
      </section>
      <section className={SECTION}>
        <SettingToggle setting="reduceMotion" />
        <SettingToggle setting="captions" />
        <SettingToggle setting="describe" />
      </section>
      <section className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onMyLocation} className="h-11 gap-2 px-3 text-body">
          <LocateFixed aria-hidden="true" />
          {tt("turntable.myLocation")}
        </Button>
        <Button variant="secondary" onClick={onFlatMap} className="h-11 gap-2 px-3 text-body">
          <MapIcon aria-hidden="true" />
          {tt("turntable.flatMap")}
        </Button>
      </section>
      <p className="text-body text-haze">{tt("turntable.myLocation.note")}</p>
    </>
  );
}

export interface DrawersProps {
  open: DrawerId | null;
  onClose(): void;
  settings: TurntableSettings;
  update: Update;
  onMyLocation(): void;
  onFlatMap(): void;
}

/** Layers & sound, Settings, and "How we know" (Truth, Mapping, Provenance, History): all closed by default. */
export function Drawers({ open, onClose, settings, update, onMyLocation, onFlatMap }: DrawersProps) {
  const { tt } = useTT();
  return (
    <>
      <Drawer open={open === "layers"} onClose={onClose} title={tt("turntable.dock.layers")} description={tt("turntable.layers.note")}>
        <LayersBody settings={settings} update={update} />
      </Drawer>
      <Drawer open={open === "settings"} onClose={onClose} title={tt("turntable.dock.settings")}>
        <SettingsBody settings={settings} update={update} onMyLocation={onMyLocation} onFlatMap={onFlatMap} />
      </Drawer>
      <Drawer open={open === "howWeKnow"} onClose={onClose} title={tt("turntable.howWeKnow")}>
        <PanelTabs />
      </Drawer>
    </>
  );
}
