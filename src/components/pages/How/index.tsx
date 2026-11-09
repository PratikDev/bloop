"use client";

import { Link } from "@tanstack/react-router";
import { Disc, Keyboard, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadGlobeDuet } from "@/lib/data";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { ComingInOctober } from "../../ComingInOctober";
import { Credits } from "../../Credits";
import { InfoSheet } from "../../InfoSheet";
import { GlobeTeaser } from "../../panels/GlobeTeaser";
import { MappingPanel, PLAYED_VOICES } from "../../panels/MappingPanel";
import { OceanTruth, RainTruth } from "../../panels/TruthPanel";
import { StatusBadge } from "../../StatusBadge";
import { useLiveData } from "../../LiveData/use-live-data";
import { PAGE_PATHS } from "@/router/modes";
import { Tile } from "./Tile";

const FOOT_LINK = "key inline-flex h-11 items-center gap-2 rounded-lg bg-paper px-4 text-body font-normal text-moon hover:bg-paper";

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
    <section aria-labelledby="how-title" className="mx-auto w-full max-w-3xl px-4 pt-3 pb-6 md:px-8">
      <div className="slab space-y-5 p-5 md:p-8">
        <header className="space-y-1">
          <h1 id="how-title" data-page-title tabIndex={-1} className="display-tight font-wide text-headline">
            {t("nav.how")}
          </h1>
          <p className="max-w-2xl text-body text-haze">{t("how.lead")}</p>
        </header>

        <ol className="divide-y-2 divide-navy border-y-2 border-navy">
        <Tile
          number={1}
          title={t("truth.ocean.heading")}
          figure={ocean ? t("how.ocean.value", { median: ocean.median }) : undefined}
          figureLabel={ocean ? t("how.ocean.figure") : t("truth.ocean.updating")}
          open={t("how.open")}
        >
          <OceanTruth showHeading={false} />
        </Tile>
        <Tile
          number={2}
          title={t("truth.rain.heading")}
          figure={rainCheck ? t("how.rain.value", { percent: rainCheck.percent }) : undefined}
          figureLabel={t("how.rain.figure")}
          note={rainStatus === "loading" ? <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge> : undefined}
          open={t("how.open")}
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
          note={<StatusBadge kind="october">{t("globe.teaser")}</StatusBadge>}
          open={t("how.openGlobe")}
        >
          <GlobeTeaser />
        </Tile>
        </ol>

        <footer className="space-y-3">
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
        </footer>
      </div>
    </section>
  );
}
