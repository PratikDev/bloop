"use client";

import { useT } from "../../AppState/use-app-state";
import { OfficialRecords } from "../../OfficialRecords";

/** Official records: NASA's EIC items and the related SVS records, each played with its checks and credits. */
export function OfficialPage() {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-3 px-4 pt-3 pb-6 md:px-8">
      <h1 data-page-title tabIndex={-1} className="display-tight font-wide text-headline outline-none">
        {t("nav.official")}
      </h1>
      <OfficialRecords />
    </div>
  );
}
