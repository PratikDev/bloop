"use client";

import { useT } from "./AppState/use-app-state";

/** The name as a comic sound word: the intro and the 404 page only. Drawn only: both screens already name themselves. */
export function ComicWordmark() {
  const t = useT();
  return (
    <span aria-hidden="true" translate="no" className="comic-box inline-block -rotate-3 rounded-caption px-3 py-1 font-wide text-title leading-tight">
      {t("app.title")}
    </span>
  );
}
