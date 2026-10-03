"use client";

import { Keyboard, Scroll, Sparkle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadGlobeDuet } from "@/lib/data";
import { RISE, STAGGER } from "@/lib/motion";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { ComingInOctober } from "../../ComingInOctober";
import { Credits } from "../../Credits";
import { FrameLabel } from "../../FrameLabel";
import { InfoSheet } from "../../InfoSheet";
import { GlobeTeaser } from "../../panels/GlobeTeaser";
import { MappingPanel, PLAYED_VOICES } from "../../panels/MappingPanel";
import { OceanTruth, RainTruth } from "../../panels/TruthPanel";
import { StatusBadge } from "../../StatusBadge";
import { useLiveData } from "../../LiveData/use-live-data";
import { Tile } from "./Tile";

const FOOT_LINK = "h-11 gap-2 rounded-full px-4 text-body text-haze ring-1 ring-glass-edge hover:bg-tide hover:text-moon";

/**
 * How we know: four checks at a glance (ocean, rain, the sound rules, ground
 * vs satellite), each number from the data files and its full wording a
 * click away; credits, keys and what isn't built yet at the foot.
 */
export function HowPage() {
  const t = useT();
  const commands = useCommands();
  const { sst, rain, rainStatus } = useLiveData();
  const ocean = sst ? oceanTruth(sst.meta) : null;
  const rainCheck = rain ? rainTruth(rain.meta) : null;
  const { value: duet } = useLoaded(loadGlobeDuet);
  const globe = duet?.status === "ok" ? duet.summary.share_within_25_points : undefined;
  const pending = <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>;

  return (
    <section aria-labelledby="how-title" className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-y-auto px-4 pt-3 pb-4 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="space-y-1">
          <h1 id="how-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
            {t("nav.how")}
          </h1>
          <p className="max-w-2xl text-body text-haze">{t("how.lead")}</p>
        </div>
        <FrameLabel className="text-small md:max-w-sm md:text-right" />
      </header>

      <motion.div variants={STAGGER} initial="hidden" animate="shown" className="grid min-h-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Tile
          title={t("truth.ocean.heading")}
          figure={ocean ? t("how.ocean.value", { median: ocean.median }) : undefined}
          figureLabel={ocean ? t("how.ocean.figure") : t("truth.ocean.updating")}
          note={ocean && pending}
          open={t("how.open")}
        >
          <OceanTruth showHeading={false} />
        </Tile>
        <Tile
          title={t("truth.rain.heading")}
          figure={rainCheck ? t("how.rain.value", { percent: rainCheck.percent }) : undefined}
          figureLabel={t("how.rain.figure")}
          note={rainStatus === "loading" ? <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge> : rainCheck && pending}
          open={t("how.open")}
        >
          <RainTruth showHeading={false} />
        </Tile>
        <Tile title={t("how.rules.title")} figure={t("how.rules.value", { count: PLAYED_VOICES.length })} figureLabel={t("how.rules.figure")} open={t("how.openRules")}>
          <MappingPanel scope="all" />
        </Tile>
        <Tile
          title={t("how.globe.title")}
          figure={globe !== undefined ? t("how.globe.value", { percent: globe * 100 }) : undefined}
          figureLabel={t("how.globe.figure")}
          note={<StatusBadge kind="october">{t("globe.teaser")}</StatusBadge>}
          open={t("how.openGlobe")}
        >
          <GlobeTeaser />
        </Tile>
      </motion.div>

      <motion.footer variants={RISE} initial="hidden" animate="shown" className="flex flex-wrap items-center gap-2">
        <InfoSheet title={t("how.credits")} triggerClassName={FOOT_LINK} trigger={<><Scroll aria-hidden="true" className="size-4.5" />{t("how.credits")}</>}>
          <Credits t={t} className="text-body text-moon" />
        </InfoSheet>
        <Button variant="ghost" onClick={commands.openHelp} className={FOOT_LINK}>
          <Keyboard aria-hidden="true" className="size-4.5" />
          {t("how.keys")}
        </Button>
        <InfoSheet title={t("october.heading")} triggerClassName={FOOT_LINK} trigger={<><Sparkle aria-hidden="true" className="size-4.5" />{t("october.heading")}</>}>
          <ComingInOctober />
        </InfoSheet>
        <p className="w-full pt-1 text-small text-haze lg:w-auto lg:flex-1 lg:pl-3">{t("credits.visualizations")}</p>
      </motion.footer>
    </section>
  );
}
