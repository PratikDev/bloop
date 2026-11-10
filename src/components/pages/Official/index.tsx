"use client";

import { useT } from "../../AppState/use-app-state";
import { OfficialRecords } from "../../OfficialRecords";

/** Official records: NASA's EIC items and the related SVS records, each played with its checks and credits. */
export function OfficialPage() {
  const t = useT();
  return (
    <div className="flex min-h-full w-full flex-col gap-6 px-4 py-6 lg:px-8">
      <h1 data-page-title tabIndex={-1} className="sr-only">
        {t("nav.official")}
      </h1>
      <OfficialRecords />
    </div>
  );
}
