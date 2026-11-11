"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { SpeakerSimpleSlash } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import { buildThenNowInput, cityDemo } from "@/lib/then-now";
import { bi, type BiText } from "@/lib/bi-text";
import { statTexts } from "@/lib/then-now-stats";
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
import { StatsDetails, StatsLine } from "./StatsDetails";
import { ThenNowBraille } from "./ThenNowBraille";
import { WaterNote } from "../WaterNote";
import { HowWeGotThis, ProvenanceGroup } from "../HowWeGotThis";
import { usePartProvenance } from "./use-part-provenance";
import { useThenNowData } from "./use-then-now-data";
import { useThenNowPlayer, type Part } from "./use-then-now-player";
import { ThenNowMidi } from "../Art/ThenNowMidi";

export const DEFAULT_CITY: ClimateCellName = "Dhaka";

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
  const sharedFor = useCallback(
    (p: ViewPart): ClimateCellName[] => {
      const cell = p === "heat" ? city?.heat : p === "monsoon" ? city?.rain.gpcp : null;
      return cell && cell.same_record_as === null ? cell.shares_cell_with : [];
    },
    [city],
  );
  const stats = ready?.stats ?? null;
  const statLines = useCallback((p: Part) => (stats ? statTexts(stats, cityName, p) : null), [stats, cityName]);
  const deg = ready?.grace.mascon_deg ?? null;
  const noteLines = useCallback(
    (p: Part): BiText[] => {
      const shared = sharedFor(p);
      return [
        ...(p === "water" ? [bi((tl) => tl("water.bangladeshWide", { deg }))] : []),
        ...(shared.length ? [bi((tl) => tl("history.sharedCell", { places: shared.map((c) => tl(`place.${c}`)).join(", ") }))] : []),
      ];
    },
    [sharedFor, deg],
  );
  const player = useThenNowPlayer(view?.input ?? null, view?.demo ?? null, statLines, noteLines);
  // While "Play heat, rain and water" runs, the view follows the part that is sounding.
  const part: ViewPart = player.soundingPart ?? chosen;
  const field = isFieldPart(part);
  const sharedWith = sharedFor(part);
  const cities = ready?.cities?.cities ?? [];
  const facts = usePartProvenance(ready && view ? { cityName, city, demo: view.demo, grace: ready.grace, stats: ready.stats } : null, part);

  const [brailleOpen, setBrailleOpen] = useState(false);
  const brailleInput = useMemo(
    () => (ready && view && !isFieldPart(part) ? { part, cityName, demo: view.demo, grace: ready.grace, stats: ready.stats ?? null } : null),
    [ready, view, part, cityName],
  );
  const openBraille = (open: boolean) => {
    if (open) player.stop();
    setBrailleOpen(open);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (field || !isLetter(e, "b") || isTypingTarget(e.target)) return;
    e.preventDefault();
    openBraille(!brailleOpen);
  };

  const choosePart = (next: ViewPart) => {
    if (isFieldPart(next)) player.stop(); // a record without sound: nothing else keeps playing under it
    onPart(next);
  };
  const chooseCity = (name: ClimateCellName) => {
    player.stop(); // sound and chart never show two different cities
    onCity(name);
  };

  return (
    <div className="flex flex-col gap-4 lg:short:gap-3" onKeyDown={onKeyDown}>
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
                  <ProvenanceGroup className="flex flex-col gap-3">
                    <HowWeGotThis facts={facts} className="self-start" />
                    <PartView
                      part={part}
                      demo={view.demo}
                      grace={ready.grace}
                      index={player.soundingPart === part ? player.index : null}
                      splitIndex={player.splitIndex}
                      notes={
                        <>
                          {part === "water" && <WaterNote grace={ready.grace} />}
                          {sharedWith.length > 0 && (
                            <p data-testid="shared-cell-note" className="text-small text-moon">
                              {t("history.sharedCell", { places: sharedWith.map((c) => t(`place.${c}`)).join(", ") })}
                            </p>
                          )}
                        </>
                      }
                    />
                    {ready.stats && <StatsLine stats={ready.stats} city={cityName} part={part} />}
                    {part === "monsoon" && (
                      <p className="text-small text-haze" data-testid="rain-window-note">
                        {t("data.text", { text: view.demo.rain.gpcc_end_note })}
                      </p>
                    )}
                    <p className="text-small text-haze">{t("thenNow.contextNote")}</p>
                  </ProvenanceGroup>
                }
                sideTitle={t("thenNow.listen")}
                side={
                  <>
                    <PlayControls part={part} player={player} />
                    {brailleInput && <ThenNowBraille input={brailleInput} open={brailleOpen} onOpenChange={openBraille} />}
                    {view && <ThenNowMidi input={view.input} part={part} city={cityName} />} {}
                  </>
                }
                detailsTitle={t("disclosure.title")}
                details={
                  <ProvenanceGroup className="space-y-4">
                    <HowWeGotThis facts={facts} />
                    <Disclosure part={part} demo={view.demo} grace={ready.grace} />
                    {ready.stats && <StatsDetails stats={ready.stats} city={cityName} part={part} />}
                    <HonestyFolds demo={view.demo} isDhaka={isDhaka} />
                  </ProvenanceGroup>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
