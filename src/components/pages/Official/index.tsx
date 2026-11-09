"use client";

import { useT } from "../../AppState/use-app-state";
import { OfficialRecords } from "../../OfficialRecords";

/** Official records: NASA's EIC items and the related SVS records, each played with its checks and credits. */
export function OfficialPage() {
  const t = useT();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 data-page-title tabIndex={-1} className="px-4 pt-3 pb-1 font-wide text-title outline-none md:text-headline">
        {t("nav.official")}
      </h1>
      <OfficialRecords />
    </div>
  );
}
