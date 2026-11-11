"use client";

import { Link } from "@tanstack/react-router";
import { Disc, Keyboard, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadGlobeDuet } from "@/lib/data";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { useT } from "../../AppState/use-app-state";
import { ArtHowCards } from "../../Art/HowCards";
import { useCommands } from "../../Commands/use-commands";
import { ComingInOctober } from "../../ComingInOctober";
import { Credits } from "../../Credits";
import { InfoSheet } from "../../InfoSheet";
import { ROW_KEY } from "../../row-key";
import { GlobeTeaser } from "../../panels/GlobeTeaser";
import { MappingPanel, PLAYED_VOICES } from "../../panels/MappingPanel";
import { OceanTruth, RainTruth } from "../../panels/TruthPanel";
import { StatusBadge } from "../../StatusBadge";
import { useLiveData } from "../../LiveData/use-live-data";
import { PAGE_PATHS } from "@/router/modes";
import { Tile } from "./Tile";

const FOOT_LINK = "key border-navy inline-flex h-11 items-center gap-2 rounded-lg bg-paper px-4 text-body font-normal text-moon hover:bg-paper";

/**
 * How we know, the back of the sleeve: four checks as a numbered track list (ocean, rain, the sound rules, ground
 * vs satellite), each number from the data files and its full wording a click away; the credits at the foot.
 */
export function HowPage() {
  const t = useT();
  const commands = useCommands();
  const { sst, rain, rainStatus } = useLiveData();
  const ocean = sst ? oceanTruth(sst.meta) : null;
  const rainCheck = rain ? rainTruth(rain.meta) : null;
  const { value: duet } = useLoaded(loadGlobeDuet);
  const globe = duet?.status === "ok" ? duet.summary.share_within_25_points : undefined;

  return (
    <section aria-labelledby="how-title" className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:short:py-4">
      <div data-land className="slab space-y-6 p-5 lg:p-6">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 id="how-title" data-page-title tabIndex={-1} className="display-tight font-wide text-title lg:text-headline">
            {t("nav.how")}
          </h1>
          <p className="max-w-[60ch] flex-1 basis-80 text-body text-haze">{t("how.lead")}</p>
          {/* The credits and the page's other links, in a drawer: the four tracks keep the screen. */}
          <InfoSheet title={t("how.credits")} triggerClassName={ROW_KEY} trigger={t("how.credits")}>
            <div className="space-y-3">
              <Credits t={t} />
              <div className="flex flex-wrap items-center gap-2">
                <Link to={PAGE_PATHS.official} className={FOOT_LINK}>
                  <Disc aria-hidden="true" className="size-4.5" />
                  {t("records.allOfficial")}
                </Link>
                <Button variant="ghost" onClick={commands.openHelp} className={FOOT_LINK}>
                  <Keyboard aria-hidden="true" className="size-4.5" />
                  {t("how.keys")}
                </Button>
                <InfoSheet title={t("october.heading")} triggerClassName={FOOT_LINK} trigger={<><Sparkle aria-hidden="true" className="size-4.5" />{t("october.heading")}</>}>
                  <ComingInOctober />
                </InfoSheet>
              </div>
            </div>
          </InfoSheet>
        </header>

        <ol className="grid gap-6 lg:grid-cols-2">
        <Tile
          number={1}
          title={t("truth.ocean.heading")}
          figure={ocean ? t("how.ocean.value", { median: ocean.median }) : undefined}
          figureLabel={ocean ? t("how.ocean.figure") : t("truth.ocean.updating")}
          open={t("how.open.ocean")}
        >
          <OceanTruth showHeading={false} />
        </Tile>
        <Tile
          number={2}
          title={t("truth.rain.heading")}
          figure={rainCheck ? t("how.rain.value", { percent: rainCheck.percent }) : undefined}
          figureLabel={t("how.rain.figure")}
          context={rainCheck ? t(rainCheck.allAgreed ? "how.rain.contextAll" : "how.rain.context", { agreed: rainCheck.agreedPct, passed: rainCheck.recheckRun !== null }) : undefined}
          note={rainStatus === "loading" ? <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge> : undefined}
          open={t("how.open.rain")}
        >
          <RainTruth showHeading={false} />
        </Tile>
        <Tile number={3} title={t("how.rules.title")} figure={t("how.rules.value", { count: PLAYED_VOICES.length })} figureLabel={t("how.rules.figure")} open={t("how.openRules")}>
          <MappingPanel scope="all" />
        </Tile>
        <Tile
          number={4}
          title={t("how.globe.title")}
          figure={globe !== undefined ? t("how.globe.value", { percent: globe * 100 }) : undefined}
          figureLabel={t("how.globe.figure")}
          context={t("globe.plan")}
          note={<StatusBadge kind="note">{t("globe.teaser")}</StatusBadge>}
          open={t("how.openGlobe")}
        >
          <GlobeTeaser />
        </Tile>
        <ArtHowCards firstNumber={5} />
        </ol>
      </div>
    </section>
  );
}
