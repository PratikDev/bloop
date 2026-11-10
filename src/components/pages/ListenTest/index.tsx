"use client";

import { Play } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { placeLabel } from "@/lib/history";
import { formatInteger, type MessageKey } from "@/lib/i18n";
import type { OptionId, Task, TaskId } from "@/lib/listen-test/tasks";
import { useAppState, useT } from "../../AppState/use-app-state";
import { StatusBadge } from "../../StatusBadge";
import { useListenTest } from "./use-listen-test";

const ACTION = "h-11 rounded-full px-5 text-body";
const OPTION_KEYS = {
  warmer: "lt.opt.warmer",
  colder: "lt.opt.colder",
  first: "lt.opt.first",
  second: "lt.opt.second",
  yes: "lt.opt.yes",
  no: "lt.opt.no",
} as const satisfies Record<OptionId, MessageKey>;

function Panel({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby="lt-step" className="surface-plate space-y-4 rounded-plate p-5 md:p-6">
      <h2 id="lt-step" tabIndex={-1} className="font-serif text-title">
        {heading}
      </h2>
      {children}
    </section>
  );
}

/**
 * The quick listener test (mentor item 8): hidden (no link, noindex), anonymous, adults only, five tasks whose answers
 * come from the shipped data, answers kept in memory and exported as a file by the facilitator
 * (docs/LISTEN_TEST_PROTOCOL.md). No listener result is shown anywhere in the app.
 */
export function ListenTestPage() {
  const t = useT();
  const { state } = useAppState();
  const lt = useListenTest();
  const n = (v: number) => formatInteger(v, state.lang);

  const question = (task: Task): string => {
    const q: Record<TaskId, () => string> = {
      ocean: () => t("lt.q.ocean"),
      rain: () => t("lt.q.rain", { a: task.params.a, b: task.params.b }),
      unison: () => t("lt.q.unison"),
      both: () => t("lt.q.both"),
      heat: () => t("lt.q.heat", { place: placeLabel(t, task.params.place), a: task.params.a, b: task.params.b }),
    };
    return q[task.id]();
  };

  const s = lt.step;
  const inTest = s.kind === "intro" || s.kind === "task" || s.kind === "extra" || s.kind === "comment";
  let body: ReactNode;
  if (lt.error) body = <StatusBadge kind="error">{t("lt.error")}</StatusBadge>;
  else if (s.kind === "consent")
    body = (
      <Panel heading={t("lt.consent.heading")}>
        <p className="max-w-prose text-body">{t("lt.consent.body")}</p>
        <Button className={`${ACTION} bg-shapla text-ink`} onClick={() => lt.go({ kind: "age" })}>
          {t("lt.consent.agree")}
        </Button>
      </Panel>
    );
  else if (s.kind === "age")
    body = (
      <Panel heading={t("lt.age.question")}>
        <div className="flex flex-wrap gap-2">
          <Button className={`${ACTION} bg-shapla text-ink`} onClick={() => lt.go({ kind: "intro" })}>{t("lt.yes")}</Button>
          <Button variant="outline" className={ACTION} onClick={() => lt.go({ kind: "ended" })}>{t("lt.no")}</Button>
        </div>
      </Panel>
    );
  else if (s.kind === "ended") body = <Panel heading={t("lt.done.heading")}><p className="text-body">{t("lt.ended")}</p></Panel>;
  else if (s.kind === "stopped") body = <Panel heading={t("lt.stop")}><p className="text-body">{t("lt.stopped")}</p></Panel>;
  else if (!lt.tasks || lt.reference === null) body = <StatusBadge kind="loading">{t("lt.loading")}</StatusBadge>;
  else if (s.kind === "intro") {
    const ref = lt.reference;
    body = (
      <Panel heading={t("lt.intro.heading")}>
        <p className="max-w-prose text-body">{t("lt.intro.body")}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className={ACTION} onClick={() => void lt.play({ kind: "tones", first: ref, second: ref })}>
            <Play aria-hidden="true" weight="fill" />
            {t("lt.intro.reference")}
          </Button>
          <Button variant="outline" className={ACTION} onClick={() => void lt.play("scale")}>
            <Play aria-hidden="true" weight="fill" />
            {t("lt.intro.scale")}
          </Button>
        </div>
        <Button className={`${ACTION} bg-shapla text-ink`} onClick={() => lt.go({ kind: "task", index: 0 })}>{t("lt.intro.start")}</Button>
      </Panel>
    );
  } else if (s.kind === "task") {
    const task = lt.tasks[s.index];
    body = (
      <Panel heading={t("lt.task.count", { n: n(s.index + 1), total: n(lt.tasks.length) })}>
        <p className="max-w-prose text-lead" id="lt-question">{question(task)}</p>
        <Button variant="outline" className={ACTION} onClick={() => void lt.play(task.sound)}>
          <Play aria-hidden="true" weight="fill" />
          {t("lt.play")}
        </Button>
        <div role="group" aria-labelledby="lt-question" className="flex flex-wrap gap-2">
          {task.options.map((o) => (
            <Button key={o} className={`${ACTION} bg-tide text-moon`} data-option={o} onClick={() => lt.answer(task, o, s.index)}>
              {t(OPTION_KEYS[o])}
            </Button>
          ))}
        </div>
      </Panel>
    );
  } else if (s.kind === "extra") {
    // ART: an extra task module (src/components/pages/ListenTest/extras/registry.ts)
    const { Step, info, heading } = lt.extras[s.index];
    body = (
      <Panel heading={t(heading)}>
        <Step key={`${info.id}-${s.index}`} inputs={{ pairs: lt.pairs }} play={lt.playExtra} coins={lt.coins} onDone={(r) => lt.extraDone(s.index, r)} />
      </Panel>
    );
  } else if (s.kind === "comment")
    body = (
      <Panel heading={t("lt.comment.label")}>
        <label className="block space-y-2">
          <span className="sr-only">{t("lt.comment.label")}</span>
          <textarea value={lt.comment} onChange={(e) => lt.setComment(e.target.value)} rows={4} className="w-full rounded-plate bg-night p-3 text-body text-moon ring-1 ring-glass-edge" />
        </label>
        <Button className={`${ACTION} bg-shapla text-ink`} onClick={() => lt.go({ kind: "done" })}>{t("lt.comment.next")}</Button>
      </Panel>
    );
  else
    body = (
      <Panel heading={t("lt.done.heading")}>
        <p className="text-body">{t("lt.done.body")}</p>
        <Button className={`${ACTION} bg-shapla text-ink`} onClick={lt.exportResults}>{t("lt.export")}</Button>
      </Panel>
    );

  return (
    <section aria-labelledby="lt-title" className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 overflow-y-auto px-4 pt-3 pb-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 id="lt-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
          {t("lt.title")}
        </h1>
        {inTest && (
          <Button variant="ghost" className={`${ACTION} ring-1 ring-glass-edge`} onClick={lt.stop}>
            {t("lt.stop")}
          </Button>
        )}
      </header>
      {body}
    </section>
  );
}
