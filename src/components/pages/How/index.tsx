"use client";

import { Keyboard, Scroll } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadGlobeDuet } from "@/lib/data";
import { RISE, STAGGER } from "@/lib/motion";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { DataCredits } from "../../DataCredits";
import { FrameLabel } from "../../FrameLabel";
import { InfoSheet } from "../../InfoSheet";
import { GlobeTeaser } from "../../panels/GlobeTeaser";
import { MappingPanel, PLAYED_VOICES } from "../../panels/MappingPanel";
import { OceanTruth, RainTruth } from "../../panels/TruthPanel";
import { StatusBadge } from "../../StatusBadge";
import { useLiveData } from "../../LiveData/use-live-data";
import { GlobeFace, OceanFace, RainFace, RulesFace } from "./cards";
import { Tile } from "./Tile";

const FOOT_LINK = "h-11 gap-2 rounded-full px-4 text-body text-haze ring-1 ring-glass-edge hover:bg-tide hover:text-moon";

/**
 * How we know: four checks at a glance (ocean, rain, the sound rules, ground
 * vs satellite), each with its evidence on the card (plot or table, key numbers,
 * a plain explanation; mentor item 6) and its full wording a click away; credits and keys at the foot.
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

      <motion.div variants={STAGGER} initial="hidden" animate="shown" className="grid gap-3 sm:grid-cols-2 lg:gap-4">
        <Tile
          title={t("truth.ocean.heading")}
          figure={ocean ? t("how.ocean.value", { median: ocean.median }) : undefined}
          figureLabel={ocean ? t("how.ocean.figure") : t("truth.ocean.updating")}
          face={<OceanFace />}
          open={t("how.open")}
        >
          <OceanTruth showHeading={false} />
        </Tile>
        <Tile
          title={t("truth.rain.heading")}
          figure={rainCheck ? t("how.rain.value", { percent: rainCheck.percent }) : undefined}
          figureLabel={t("how.rain.figure")}
          note={rainStatus === "loading" ? <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge> : undefined}
          face={<RainFace />}
          open={t("how.open")}
        >
          <RainTruth showHeading={false} />
        </Tile>
        <Tile title={t("how.rules.title")} figure={t("how.rules.value", { count: PLAYED_VOICES.length })} figureLabel={t("how.rules.figure")} face={<RulesFace />} open={t("how.openRules")}>
          <MappingPanel scope="all" />
        </Tile>
        <Tile
          title={t("how.globe.title")}
          figure={globe !== undefined ? t("how.globe.value", { percent: globe * 100 }) : undefined}
          figureLabel={t("how.globe.figure")}
          face={<GlobeFace />}
          open={t("how.openGlobe")}
        >
          <GlobeTeaser />
        </Tile>
      </motion.div>

      <motion.footer variants={RISE} initial="hidden" animate="shown" className="flex flex-wrap items-center gap-2">
        <InfoSheet title={t("how.credits")} triggerClassName={FOOT_LINK} trigger={<><Scroll aria-hidden="true" className="size-4.5" />{t("how.credits")}</>}>
          <DataCredits />
        </InfoSheet>
        <Button variant="ghost" onClick={commands.openHelp} className={FOOT_LINK}>
          <Keyboard aria-hidden="true" className="size-4.5" />
          {t("how.keys")}
        </Button>
        <p className="w-full pt-1 text-small text-haze lg:w-auto lg:flex-1 lg:pl-3">{t("credits.visualizations")}</p>
      </motion.footer>
    </section>
  );
}
