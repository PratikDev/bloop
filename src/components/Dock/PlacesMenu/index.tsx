"use client";

import { useId, useRef, useState } from "react";
import { CaretDown, GlobeHemisphereEast } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { LatLon } from "@/lib/data";
import type { MessageKey } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { CONTINENTS, type Continent, type RegionNode } from "@/lib/geo/regions";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { MAP_REGION_ID } from "../../ExploreControls";
import { StatusBadge } from "../../StatusBadge";
import { DockAction } from "../DockAction";
import { usePlaces } from "./use-places";

const CONTINENT_LABEL = {
  Asia: "continent.asia",
  Africa: "continent.africa",
  Europe: "continent.europe",
  "North America": "continent.northAmerica",
  "South America": "continent.southAmerica",
  Oceania: "continent.oceania",
  Antarctica: "continent.antarctica",
  "Seven seas (open ocean)": "continent.sevenSeas",
} as const satisfies Record<Continent, MessageKey>;

const ITEM = "flex min-h-11 w-full items-center rounded-lg px-3 py-1.5 text-left text-body text-moon hover:bg-tide/60 pointer-fine:min-h-9";

const localName = (n: { name: string; nameBn: string | null }, lang: Lang) => (lang === "bn" && n.nameBn ? n.nameBn : n.name);

export function PlacesMenu() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const went = useRef(false);
  const places = usePlaces(open);
  const id = useId();
  const lang = state.lang;

  const go = (at: LatLon, name: string) => {
    commands.setCursor(at, { remember: true, lead: t("places.moved", { name }) });
    commands.note(`${t("places.moved", { name })} ${t("place.latlon", at)}`, []);
    went.current = true;
    setOpen(false);
  };
  const nodeName = (n: RegionNode) => {
    const continent = CONTINENTS.find((c) => `continent:${c}` === n.id);
    return continent ? t(CONTINENT_LABEL[continent]) : localName(n, lang);
  };
  const results = places.status === "ready" && query.trim() ? places.gazetteer.search(query) : [];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) went.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger render={<DockAction icon={<GlobeHemisphereEast aria-hidden="true" />} full={t("places.open")} label={t("places.short")} short={t("places.short")} />} />
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        finalFocus={() => (went.current ? document.getElementById(MAP_REGION_ID) : true)}
        className="surface-glass max-h-[min(36rem,70dvh)] w-[min(24rem,calc(100vw-1.5rem))] gap-3 overflow-y-auto rounded-plate p-4 text-body"
        data-testid="places-menu"
      >
        <PopoverTitle className="eyebrow">{t("places.title")}</PopoverTitle>
        {places.status === "loading" && <p className="text-haze">{t("places.loading")}</p>}
        {places.status === "error" && <StatusBadge kind="error">{t("places.error")}</StatusBadge>}
        {places.status === "ready" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-q`} className="text-small font-normal text-haze">
                {t("places.search")}
              </Label>
              <Input
                id={`${id}-q`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${id}-hint`}
                className="h-11 rounded-lg border-line bg-ink/45 px-3 md:text-base pointer-fine:h-9"
              />
              <p id={`${id}-hint`} className="text-small text-haze">
                {t("places.searchHint")}
              </p>
            </div>
            {query.trim() &&
              (results.length === 0 ? (
                <p className="text-haze">{t("places.none")}</p>
              ) : (
                <ul aria-label={t("places.search")} className="space-y-0.5">
                  {results.map((r) => {
                    const name = localName(r, lang);
                    return (
                      <li key={`${r.kind}:${r.name}:${r.lat}:${r.lon}`}>
                        <button type="button" className={ITEM} onClick={() => go(r, name)}>
                          {r.detail ? `${name}, ${r.detail}` : name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
            <section aria-labelledby={`${id}-browse`} className="space-y-1 border-t border-glass-edge pt-3">
              <h3 id={`${id}-browse`} className="text-small font-medium text-haze">
                {t("places.browse")}
              </h3>
              <RegionList nodes={places.tree} name={nodeName} go={go} goLabel={(name) => t("places.goTo", { name })} />
            </section>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface ListProps {
  nodes: RegionNode[];
  name(n: RegionNode): string;
  go(at: LatLon, name: string): void;
  goLabel(name: string): string;
}

function RegionList({ nodes, name, go, goLabel }: ListProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((n) => {
        const label = name(n);
        if (n.children.length === 0)
          return (
            <li key={n.id}>
              <button type="button" className={ITEM} onClick={() => go(n, label)}>
                {label}
              </button>
            </li>
          );
        return (
          <li key={n.id}>
            <details className="group">
              <summary className={`${ITEM} cursor-pointer list-none justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden`}>
                {label}
                <CaretDown aria-hidden="true" className="size-4 shrink-0 text-haze transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="ml-3 border-l border-glass-edge pl-2">
                <button type="button" className={ITEM} onClick={() => go(n, label)}>
                  {goLabel(label)}
                </button>
                <RegionList nodes={n.children} name={name} go={go} goLabel={goLabel} />
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
