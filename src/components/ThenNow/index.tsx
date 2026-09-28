"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildThenNowInput, cityDemo } from "@/lib/then-now";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { FrameLabel } from "../FrameLabel";
import { StatusBadge } from "../StatusBadge";
import { Disclosure } from "./Disclosure";
import { FieldPartView, type FieldPart } from "./FieldPartView";
import { HonestyFolds } from "./HonestyNote";
import { Fold, PartLayout } from "./Layout";
import { PartView } from "./PartView";
import { PlayControls } from "./PlayControls";
import { useThenNowData } from "./use-then-now-data";
import { useThenNowPlayer, type Part } from "./use-then-now-player";

const DEFAULT_CITY: ClimateCellName = "Dhaka";

/** The sounded parts (L2's Then vs Now), then the records shown without sound yet. */
type ViewPart = Part | FieldPart;
const PARTS: readonly ViewPart[] = ["heat", "monsoon", "water", "fires", "vegetation"];
const isFieldPart = (p: ViewPart): p is FieldPart => p === "fires" || p === "vegetation";

/**
 * Then vs Now (plan §11.5, the killer demo). A header (title, story, city), a
 * tab per record, and for each: the finding (caption, chart) beside how to
 * listen, with the details folded away. Dhaka by default; Chattogram, Rajshahi
 * and Sylhet from L1's cities file (§13); fires and vegetation without sound yet.
 */
export function ThenNow() {
  const t = useT();
  const data = useThenNowData();
  const ready = data.status === "ready" ? data : null;
  const [cityName, setCityName] = useState<ClimateCellName>(DEFAULT_CITY);
  const city = ready?.cities?.cities.find((c) => c.name === cityName) ?? null;
  const isDhaka = cityName === DEFAULT_CITY;
  // The chosen city in the demo's shape: its heat and rain, the national water record.
  const view = useMemo(() => {
    if (!ready) return null;
    const demo = city ? cityDemo(ready.demo, city) : ready.demo;
    return { demo, input: buildThenNowInput(demo, ready.grace) };
  }, [ready, city]);
  const player = useThenNowPlayer(view?.input ?? null, view?.demo ?? null);
  const [chosen, setChosen] = useState<ViewPart>("heat");
  // While "Play heat, rain and water" runs, the view follows the part that is sounding.
  const part: ViewPart = player.soundingPart ?? chosen;
  const field = isFieldPart(part);
  const cities = ready?.cities?.cities ?? [];

  // Keyboard users land here when the mode opens (the map they were on is gone).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasData = ready !== null;
  useEffect(() => {
    if (hasData) headingRef.current?.focus();
  }, [hasData]);

  const choosePart = (next: ViewPart) => {
    if (isFieldPart(next)) player.stop(); // a record without sound: nothing else keeps playing under it
    setChosen(next);
  };
  const chooseCity = (name: ClimateCellName) => {
    player.stop(); // sound and chart never show two different cities
    setCityName(name);
  };

  return (
    <section className="flex min-h-0 flex-col gap-5 overflow-y-auto bg-night p-4 lg:p-6">
      <header className="space-y-3">
        <div className="text-small text-haze">
          <FrameLabel />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-2xl space-y-1">
            <h2 ref={headingRef} tabIndex={-1} className="text-title font-semibold outline-none">
              {field ? t("thenNow.moreTitle") : t("thenNow.title", { city: t(`place.${cityName}`) })}
            </h2>
            {/* Dhaka's story line is its cross-checked claim; other cities are computed with the same method. */}
            {!field && ready && view && <p className="text-lead text-haze">{isDhaka ? view.demo.story : t("thenNow.computed")}</p>}
          </div>
          {!field && cities.length > 1 && (
            <ChoiceGroup<ClimateCellName>
              label={t("thenNow.city")}
              showLabel
              value={cityName}
              onChange={chooseCity}
              options={cities.map((c) => ({ value: c.name, label: t(`place.${c.name}`) }))}
              className="flex-wrap"
            />
          )}
        </div>
      </header>

      {data.status === "loading" && <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>}
      {data.status === "error" && <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>}

      {ready && view && (
        <Tabs value={part} onValueChange={(next: ViewPart) => choosePart(next)} className="gap-5">
          {/* Wraps on narrow screens, so no record hides off the edge. */}
          <TabsList variant="line" aria-label={t("thenNow.parts")} className="w-full flex-wrap justify-start gap-x-1 gap-y-0 border-b border-tide group-data-horizontal/tabs:h-auto">
            {PARTS.map((p) => (
              <TabsTrigger key={p} value={p} className="h-11 flex-none px-3 text-body data-active:text-moon">
                {t(`thenNow.part.${p}`)}
                {isFieldPart(p) && (
                  <>
                    <VolumeX aria-hidden="true" className="size-3.5 text-haze" />
                    <span className="sr-only">{t("thenNow.noSound")}</span>
                  </>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={part}>
            {isFieldPart(part) ? (
              <FieldPartView part={part} />
            ) : (
              <PartLayout
                finding={
                  <>
                    <PartView
                      part={part}
                      demo={view.demo}
                      grace={ready.grace}
                      index={player.soundingPart === part ? player.index : null}
                      splitIndex={player.splitIndex}
                    />
                    {part === "water" && !isDhaka && <p className="text-small text-haze">{t("thenNow.waterNational")}</p>}
                    <p className="text-small text-haze">{t("thenNow.contextNote")}</p>
                  </>
                }
                sideTitle={t("thenNow.listen")}
                side={<PlayControls part={part} player={player} />}
                folds={
                  <>
                    <Fold title={t("disclosure.title")}>
                      <Disclosure part={part} demo={view.demo} grace={ready.grace} />
                    </Fold>
                    <HonestyFolds demo={view.demo} isDhaka={isDhaka} />
                  </>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
