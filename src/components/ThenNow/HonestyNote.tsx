"use client";

import { DATA_PATHS } from "@/lib/data";
import type { DhakaThenNowDemo } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";
import { Fold } from "./Layout";

/**
 * What we checked and what we don't claim, as folds under the finding. The
 * honesty beat and its plot (why NASA POWER was dropped) are about Dhaka's
 * records, so they show for Dhaka only; "not claimed" holds for every city.
 */
export function HonestyFolds({ demo, isDhaka }: { demo: DhakaThenNowDemo; isDhaka: boolean }) {
  const t = useT();
  return (
    <>
      {isDhaka && (
        <Fold title={t("thenNow.powerTitle")}>
          <p>{demo.honesty_beat}</p>
          {/* A static published chart image; next/image adds nothing for a local PNG. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DATA_PATHS.truthImage("crosscheck")}
            alt={t("thenNow.crosscheckAlt")}
            width={1080}
            height={830}
            loading="lazy"
            className="w-full max-w-2xl rounded-lg bg-moon"
          />
        </Fold>
      )}
      <Fold title={t("disclosure.notClaimed")}>
        <ul className="list-disc space-y-1 pl-5 text-haze">
          {demo.not_claimed.map((claim) => (
            <li key={claim}>{claim}</li>
          ))}
        </ul>
      </Fold>
    </>
  );
}
