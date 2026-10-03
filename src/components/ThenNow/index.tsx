"use client";

import { useMemo } from "react";
import { SpeakerSimpleSlash } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildThenNowInput, cityDemo } from "@/lib/then-now";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { StatusBadge } from "../StatusBadge";
import { Disclosure } from "./Disclosure";
import { FieldPartView } from "./FieldPartView";
import { HonestyFolds } from "./HonestyNote";
import { PartLayout } from "./Layout";
import { isFieldPart, VIEW_PARTS, type ViewPart } from "./parts";
import { PartView } from "./PartView";
import { PlayControls } from "./PlayControls";
import { useThenNowData } from "./use-then-now-data";
import { useThenNowPlayer } from "./use-then-now-player";

export const DEFAULT_CITY: ClimateCellName = "Dhaka";

/**
 * Then vs Now, compare decades (plan §11.5, the killer demo): the city and a
 * tab per record; for each, the finding (caption, chart) beside how to
 * listen, with the details a click away. Dhaka by default; Chattogram,
 * Rajshahi and Sylhet from L1's cities file (§13); fires and vegetation
 * without sound yet. The city and the part live in the URL (the page passes them in).
 */
export function ThenNow({
  cityName,
  chosen,
  onCity,
  onPart,
}: {
  cityName: ClimateCellName;
  chosen: ViewPart;
  onCity: (city: ClimateCellName) => void;
  onPart: (part: ViewPart) => void;
}) {
  const t = useT();
  const data = useThenNowData();
  const ready = data.status === "ready" ? data : null;
  const city = ready?.cities?.cities.find((c) => c.name === cityName) ?? null;
  const isDhaka = cityName === DEFAULT_CITY;
  // The chosen city in the demo's shape: its heat and rain, the national water record.
  const view = useMemo(() => {
    if (!ready) return null;
    const demo = city ? cityDemo(ready.demo, city) : ready.demo;
    return { demo, input: buildThenNowInput(demo, ready.grace) };
  }, [ready, city]);
  const player = useThenNowPlayer(view?.input ?? null, view?.demo ?? null);
  // While "Play heat, rain and water" runs, the view follows the part that is sounding.
  const part: ViewPart = player.soundingPart ?? chosen;
  const field = isFieldPart(part);
  const cities = ready?.cities?.cities ?? [];

  const choosePart = (next: ViewPart) => {
    if (isFieldPart(next)) player.stop(); // a record without sound: nothing else keeps playing under it
    onPart(next);
  };
  const chooseCity = (name: ClimateCellName) => {
    player.stop(); // sound and chart never show two different cities
    onCity(name);
  };

  return (
    <div className="flex flex-col gap-4 lg:short:gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-2xl space-y-1">
          {/* The headline and the chosen city already say which city; the heading keeps the page's outline for screen readers. */}
          <h2 className={field ? "font-serif text-title" : "sr-only"}>{field ? t("thenNow.moreTitle") : t("thenNow.title", { city: t(`place.${cityName}`) })}</h2>
          {/* Dhaka's story line is its cross-checked claim; other cities are computed with the same method. */}
          {!field && ready && view && <p className="font-serif text-lead text-moon">{isDhaka ? t("data.text", { text: view.demo.story }) : t("thenNow.computed")}</p>}
        </div>
        {!field && cities.length > 1 && (
          <ChoiceGroup<ClimateCellName>
            label={t("thenNow.city")}
            value={cityName}
            onChange={chooseCity}
            options={cities.map((c) => ({ value: c.name, label: t(`place.${c.name}`) }))}
          />
        )}
      </div>

      {data.status === "loading" && <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>}
      {data.status === "error" && <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>}

      {ready && view && (
        <Tabs value={part} onValueChange={(next: ViewPart) => choosePart(next)} className="gap-4 lg:short:gap-3">
          {/* Wraps on narrow screens, so no record hides off the edge. */}
          <TabsList variant="line" aria-label={t("thenNow.parts")} className="w-full flex-wrap justify-start gap-x-1 gap-y-0 border-b border-glass-edge group-data-horizontal/tabs:h-auto">
            {VIEW_PARTS.map((p) => (
              <TabsTrigger key={p} value={p} className="h-11 flex-none px-3 text-body data-active:text-moon">
                {t(`thenNow.part.${p}`)}
                {isFieldPart(p) && (
                  <>
                    <SpeakerSimpleSlash aria-hidden="true" className="size-3.5 text-haze" />
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
                detailsTitle={t("disclosure.title")}
                details={
                  <>
                    <Disclosure part={part} demo={view.demo} grace={ready.grace} />
                    <HonestyFolds demo={view.demo} isDhaka={isDhaka} />
                  </>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
