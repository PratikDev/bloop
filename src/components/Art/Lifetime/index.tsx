"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bornRange } from "@/lib/art/lifetime/song";
import { songMidi, songSheet } from "@/lib/art/lifetime/export";
import { lifetimeLines } from "@/lib/art/lifetime/words";
import { BEND_RANGE_CENTS } from "@/lib/art/midi";
import { artProvenance } from "@/lib/art/provenance";
import { downloadBlob } from "@/lib/download";
import { PLACES } from "@/lib/history";
import { formatInteger, formatYear } from "@/lib/i18n";
import type { ClimateCellName } from "@/types/data-contract";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { HowWeGotThis } from "../../HowWeGotThis";
import { SongChart } from "./SongChart";
import { useLifetime } from "./use-lifetime";

export const DEFAULT_BORN = 1998;

const lifetimeLink = (born: number, city: ClimateCellName) => `/then-now?born=${born}&city=${city.toLowerCase()}`;

export function Lifetime({ born, city, onChange }: { born: number; city: ClimateCellName; onChange: (next: { born?: number; city?: ClimateCellName }) => void }) {
  const { state } = useAppState();
  const t = useT();
  const id = useId();
  const life = useLifetime(city, born);
  if (!life.file) return null;
  const [lo, hi] = bornRange(life.file, city);
  const lines = lifetimeLines(t, state.lang, city, born, life.parts);
  const notes = life.parts.reduce((n, p) => n + p.notes.length, 0);
  const facts = [
    artProvenance({
      subject: t("lifetime.hwgt.subject"),
      method: t("lifetime.hwgt.method"),
      dataset: life.file.credit,
      place: t(`place.${city}`),
      window: `${formatYear(born, state.lang)}, ${formatYear(Math.max(...life.parts.map((p) => p.to)), state.lang)}`,
      n: t("lifetime.hwgt.n", { years: formatInteger(Math.max(...life.parts.map((p) => p.notes.length)), state.lang) }),
      scripts: ["pipeline/stats/lifetime_stats.py", "src/lib/art/lifetime/song.ts", "src/lib/art/lifetime/words.ts"],
      test: "src/lib/art/lifetime/lifetime.test.ts",
    }),
  ];
  const title = `${t("lifetime.title")}: ${t(`place.${city}`)}, ${born}`;
  return (
    <section className="space-y-4" aria-labelledby={`${id}-title`} data-testid="lifetime" data-notes={notes}>
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="font-serif text-title">{t("lifetime.title")}</h2>
        <p className="max-w-2xl text-body text-haze">{t("lifetime.lead")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-born`}>{t("lifetime.born")}</Label>
          <Input id={`${id}-born`} type="number" inputMode="numeric" min={lo} max={hi} value={born} className="h-11 w-32"
            onChange={(e) => {
              const y = Number(e.target.value);
              if (Number.isInteger(y) && y >= lo && y <= hi) onChange({ born: y });
            }} />
        </div>
        <ChoiceGroup<ClimateCellName> showLabel label={t("lifetime.city")} value={city} onChange={(c) => onChange({ city: c })}
          options={PLACES.map((p) => ({ value: p, label: t(`place.${p}`) }))} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" onClick={() => void (life.playing ? life.stop() : life.play())}>
          {t(life.playing ? "lifetime.stop" : "lifetime.play")}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => downloadBlob(new Blob([songMidi(life.parts).slice().buffer], { type: "audio/midi" }), `bloop-lifetime-${city.toLowerCase()}-${born}.mid`)}>
          {t("midi.download")}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => downloadBlob(new Blob([songSheet(title, life.parts)], { type: "text/plain;charset=utf-8" }), `bloop-lifetime-${city.toLowerCase()}-${born}.txt`)}>
          {t("midi.sheet")}
        </Button>
      </div>
      <p className="text-small text-haze">{t("midi.note", { range: formatInteger(BEND_RANGE_CENTS / 100, state.lang) })}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {life.parts.map((p) => (
          <SongChart key={p.part} part={p} year={life.now?.part === p.part ? life.now.year : null} />
        ))}
      </div>
      <div data-provenance-group="" className="space-y-1" data-testid="lifetime-lines">
        {lines.map((l) => (
          <p key={l} className="text-body text-moon">{l}</p>
        ))}
        <p className="text-small text-haze">{t("lifetime.notes", { count: formatInteger(notes, state.lang) })}</p>
        <HowWeGotThis facts={facts} />
      </div>
      <p className="text-small text-haze">
        <a href={lifetimeLink(born, city)} className="underline underline-offset-2" data-testid="lifetime-link">{t("lifetime.link")}</a> {t("lifetime.linkNote")}
      </p>
    </section>
  );
}
