"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useFreshness } from "@/hooks/use-freshness";
import { voiceSpec } from "@/lib/audio/mapping";
import { livenessAt } from "@/lib/data";
import { PAGE_PATHS } from "@/router/modes";
import type { FreshnessEntry } from "@/types/data-contract";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { ageText } from "../../SourceBadges";
import { StatusBadge } from "../../StatusBadge";
import { useShownPoint } from "../../TimeLapse/use-shown-point";
import { FirstHint } from "./FirstHint";

const KEY = "key h-11 gap-2 rounded-lg bg-paper px-3 text-body font-normal text-moon hover:bg-paper aria-expanded:bg-tide [&_svg]:size-5";

/** The one status allowed on the surface: how old the frame is, and only once it is past its limit. */
function StalePill() {
  const { state } = useAppState();
  const t = useT();
  const freshness = useFreshness();
  const { track } = useShownPoint();
  const [now] = useState(Date.now);
  const voices = track === "both" ? (["ocean", "rain"] as const) : track === "ocean" ? (["ocean"] as const) : (["rain"] as const);
  const stale = voices
    .map((voice) => voiceSpec(voice).source.product)
    .map((product) => (product ? freshness?.products[product] : undefined))
    .find((entry): entry is FreshnessEntry => entry !== undefined && livenessAt(entry, now) === "recorded");
  if (!stale) return null;
  return <StatusBadge kind="october">{ageText(stale, now, t, state.lang)}</StatusBadge>;
}

/** Under the readout: the stale pill, Sources and checks, the way to How we know, and the first-visit hints. */
export function LinerRow() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
      <StalePill />
      <Button variant="ghost" aria-expanded={state.panelOpen} onClick={() => commands.openPanel(state.panel)} className={KEY}>
        <ShieldCheck aria-hidden="true" />
        {t("inspector.open")}
      </Button>
      <Link to={PAGE_PATHS.how} className="inline-flex h-11 items-center text-body underline underline-offset-4">
        {t("listen.howChecked")}
      </Link>
      <FirstHint />
    </div>
  );
}
