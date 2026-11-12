"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { CalendarBlank, GridFour } from "@phosphor-icons/react";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import { Button } from "@/components/ui/button";
import { useAnnounceError } from "@/hooks/use-announce-error";
import { bi, type BiText } from "@/lib/bi-text";
import { formatList } from "@/lib/i18n";
import { buildThenNowInput, cityDemo, waterBeat, yearlyBeat, yearlyWindows } from "@/lib/then-now";
import { statTexts } from "@/lib/then-now-stats";
import type { ClimateCellName } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { setBrailleOpener } from "../BrailleExplorer/opener";
import { MORE_ITEM } from "../Dock/PlayerMore";
import { PickOne } from "../PickOne";
import { StatusBadge } from "../StatusBadge";
import { Disclosure } from "./Disclosure";
import { FieldPartView } from "./FieldPartView";
import { HonestyFolds } from "./HonestyNote";
import { PartActionsSlot, PartLayout } from "./Layout";
import { MotionStage } from "./MotionStage";
import { usePauseMotion } from "../SpaceWindow/use-pause-motion";
import { isFieldPart, VIEW_PARTS, type ViewPart } from "./parts";
import { PartTable } from "./PartTable";
import { PartView } from "./PartView";
import { ListenMoreItems, PlayPartButton } from "./PlayControls";
import { ThenNowBraille } from "./ThenNowBraille";
import { useThenNowData } from "./use-then-now-data";
import { useThenNowPlayer, type Part } from "./use-then-now-player";

export const DEFAULT_CITY: ClimateCellName = "Dhaka";

const MOTION_STAGE = "size-full lg:absolute lg:inset-0";

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
  onMonthly,
}: {
  cityName: ClimateCellName;
  chosen: ViewPart;
  onCity: (city: ClimateCellName) => void;
  onPart: (part: ViewPart) => void;
  onMonthly: () => void;
}) {
  const t = useT();
  const { state } = useAppState();
  const data = useThenNowData();
  const ready = data.status === "ready" ? data : null;
  useAnnounceError(data.status === "error" ? t("thenNow.error") : null);
  const city = ready?.cities?.cities.find((c) => c.name === cityName) ?? null;
  const isDhaka = cityName === DEFAULT_CITY;
  // The chosen city in the demo's shape: its heat and rain, the national water record.
  const view = useMemo(() => {
    if (!ready) return null;
    const demo = city ? cityDemo(ready.demo, city) : ready.demo;
    return { demo, input: buildThenNowInput(demo, ready.grace) };
  }, [ready, city]);
  // The cell a part plays from; the sharer's caption already names its reference city, the reference's doesn't.
  // Heat's sentence is written from the numbers and no longer carries the caption's "same cell" sentence, so every
  // city that shares its cell gets the note; rain's caption still says it for the sharer, so only the reference gets it.
  const sharedFor = useCallback(
    (p: ViewPart): ClimateCellName[] => {
      const cell = p === "heat" ? city?.heat : p === "monsoon" ? city?.rain.gpcp : null;
      return cell && (p === "heat" || cell.same_record_as === null) ? cell.shares_cell_with : [];
    },
    [city],
  );
  const stats = ready?.stats ?? null;
  const statLines = useCallback((p: Part) => (stats ? statTexts(stats, cityName, p) : null), [stats, cityName]);
  // Captions and Describe carry the same notes as the screen: Bangladesh-wide water, shared cells.
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
  const playing = player.soundingPart !== null;
  const cities = ready?.cities?.cities ?? [];
  const sharedWith = sharedFor(part);
  const pause = usePauseMotion();
  const sounding = player.soundingPart === part ? player.index : null;
  const beat = !view || !ready || isFieldPart(part) ? null : part === "water" ? waterBeat(ready.grace, sounding) : yearlyBeat(part, yearlyWindows(view.demo, part), sounding, player.splitIndex);

  const [actionsRow, setActionsRow] = useState<HTMLElement | null>(null);
  const monthly = (
    <Button variant="ghost" onClick={onMonthly} className={MORE_ITEM}>
      <CalendarBlank aria-hidden="true" />
      {t("thenNow.view.monthly")}
    </Button>
  );
  // The Braille Data Explorer: B on the page, or its row in the player's More. Opening it stops the part playing, so
  // the caret's own tone is the only sound.
  const [brailleOpen, setBrailleOpen] = useState(false);
  // One input per part, city and data (a new object each render would rebuild the source and reset the caret).
  const brailleInput = useMemo(
    () => (ready && view && !isFieldPart(part) ? { part, cityName, demo: view.demo, grace: ready.grace, stats: ready.stats ?? null } : null),
    [ready, view, part, cityName],
  );
  const openBraille = (open: boolean) => {
    if (open) {
      player.stop();
      setBrailleOpener(document.activeElement);
    }
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
    <div className="flex flex-col gap-4" onKeyDown={onKeyDown}>
      <h2 className="sr-only">{field ? t("thenNow.moreTitle") : t("thenNow.title", { city: t(`place.${cityName}`) })}</h2>
      {data.status === "loading" && <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>}
      {data.status === "error" && <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>}

      {ready && view && (
        <PartActionsSlot.Provider value={actionsRow}>
          {/* While a part plays, only Play/Stop stays in the row: the pickers would stop it anyway, and the stage keeps the room. */}
          <div className="flex flex-wrap items-center gap-4">
            {!playing && !field && cities.length > 1 && <PickOne<ClimateCellName> label={t("thenNow.city")} value={cityName} onChange={chooseCity} options={cities.map((c) => ({ value: c.name, label: t(`place.${c.name}`) }))} />}
            {!playing && <PickOne<ViewPart> label={t("thenNow.parts")} value={part} onChange={choosePart} options={VIEW_PARTS.map((p) => ({ value: p, label: t(`thenNow.part.${p}`) }))} />}
            <div ref={setActionsRow} className="contents" />
          </div>
          {isFieldPart(part) ? (
            <FieldPartView part={part} more={monthly} stage={<MotionStage city={cityName} beat={null} beatIndex={null} pause={pause} className={MOTION_STAGE} />} />
          ) : (
            <PartLayout
              finding={
                <PartView
                  part={part}
                  place={t(`place.${cityName}`)}
                  demo={view.demo}
                  grace={ready.grace}
                  index={sounding}
                  splitIndex={player.splitIndex}
                  motionPaused={pause.paused}
                  note={sharedWith.length > 0 && <p className="text-body text-moon">{t("history.sharedCell", { places: formatList([cityName, ...sharedWith].map((c) => t(`place.${c}`)), state.lang) })}</p>}
                />
              }
              stage={<MotionStage city={cityName} beat={beat} beatIndex={sounding ?? player.splitIndex} pause={pause} className={MOTION_STAGE} />}
              actions={<PlayPartButton part={part} player={player} />}
              more={
                <>
                  <ListenMoreItems part={part} player={player} />
                  <Button variant="ghost" aria-expanded={brailleOpen} onClick={() => openBraille(true)} className={MORE_ITEM}>
                    <GridFour aria-hidden="true" />
                    {t("braille.open")}
                  </Button>
                  {monthly}
                </>
              }
              detailsTitle={t("disclosure.title")}
              details={
                <>
                  {/* Dhaka's story line is its cross-checked claim; other cities are computed with the same method. */}
                  <p className="text-moon">{isDhaka ? t("data.text", { text: view.demo.story }) : t("thenNow.computed")}</p>
                  {part === "water" && <p className="text-haze">{t("thenNow.waterNational")}</p>}
                  <p className="text-haze">{t("thenNow.contextNote")}</p>
                  <Disclosure part={part} demo={view.demo} grace={ready.grace} />
                  <PartTable part={part} demo={view.demo} grace={ready.grace} />
                  <HonestyFolds demo={view.demo} isDhaka={isDhaka} />
                </>
              }
            />
          )}
          {brailleInput && <ThenNowBraille input={brailleInput} open={brailleOpen} onOpenChange={openBraille} />}
        </PartActionsSlot.Provider>
      )}
    </div>
  );
}
