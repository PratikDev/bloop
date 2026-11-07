"use client";

import teamJson from "../../../../content/team.json";
import { PLACES } from "@/lib/history";
import { parseTeam, shownTeam } from "@/lib/team";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../../AppState/use-app-state";
import { DataCredits } from "../../DataCredits";

const TEAM = shownTeam(parseTeam(teamJson));
const isPlace = (name: string): name is ClimateCellName => (PLACES as readonly string[]).includes(name);

const SECTION = "surface-plate space-y-3 rounded-plate p-5 md:p-6";

/**
 * Team and about (mentor item 7): who made the app, for which challenge and event, and the data it plays, from
 * content/team.json. A field the team hasn't filled ("TODO") shows nothing here; BLOOP_RELEASE=1 builds refuse it.
 */
export function TeamPage() {
  const t = useT();
  return (
    <section aria-labelledby="team-title" className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-5 overflow-y-auto px-4 pt-3 pb-6 md:px-8">
      <header className="space-y-1">
        <h1 id="team-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
          {TEAM.teamName ?? t("team.title")}
        </h1>
        <p className="max-w-2xl text-body text-haze">{t("team.lead")}</p>
      </header>

      <section aria-labelledby="team-members" className={SECTION}>
        <h2 id="team-members" className="text-lead font-medium text-moon">{t("team.members")}</h2>
        {TEAM.members.length > 0 && (
          <ul className="space-y-1.5 text-body">
            {TEAM.members.map((m) => (
              <li key={m.name}>
                <span lang="en" className="font-medium text-moon">{m.name}</span>
                {m.role && <span className="text-haze">: {m.role}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="team-challenge" className={SECTION}>
        <h2 id="team-challenge" className="text-lead font-medium text-moon">{t("team.challenge")}</h2>
        {TEAM.challenge && <p lang="en" className="text-body text-moon">{TEAM.challenge}</p>}
        {TEAM.localEvent && <p className="text-body text-haze">{t("team.localEvent", { place: isPlace(TEAM.localEvent) ? t(`place.${TEAM.localEvent}`) : TEAM.localEvent })}</p>}
      </section>

      <section aria-labelledby="team-data" className={SECTION}>
        <h2 id="team-data" className="text-lead font-medium text-moon">{t("team.madeWith")}</h2>
        <DataCredits level={3} />
        {TEAM.licence && <p className="text-small text-haze">{t("team.licence", { licence: TEAM.licence })}</p>}
      </section>
    </section>
  );
}
