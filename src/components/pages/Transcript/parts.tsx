"use client";

import type { ReactNode } from "react";
import { StatusBadge } from "../../StatusBadge";
import { useT } from "../../AppState/use-app-state";

export const PAGE = "mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-5 overflow-y-auto px-4 pt-3 pb-6 md:px-8";
const SECTION = "surface-plate space-y-3 rounded-plate p-5 md:p-6";

export function TranscriptHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="space-y-1">
      <h1 id="transcript-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
        {title}
      </h1>
      {lead && <p className="max-w-2xl text-body text-haze">{lead}</p>}
    </header>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`transcript-${id}`} data-testid={`transcript-${id}`} className={SECTION}>
      <h2 id={`transcript-${id}`} className="text-lead font-medium text-moon">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Lines({ lines, lang }: { lines: readonly string[]; lang?: "en" }) {
  return (
    <div lang={lang} className="max-w-prose space-y-2 text-body text-moon">
      {lines.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

export function Moments({ items }: { items: readonly { time: string; text: string }[] }) {
  return (
    <ol className="max-w-prose space-y-1.5 text-body text-moon">
      {items.map((m, i) => (
        <li key={i}>
          <span className="font-medium tabular-nums">{m.time}</span> <span>{m.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function Loading({ error }: { error: boolean }) {
  const t = useT();
  return error ? <StatusBadge kind="error">{t("transcript.error")}</StatusBadge> : <StatusBadge kind="loading">{t("transcript.loading")}</StatusBadge>;
}
