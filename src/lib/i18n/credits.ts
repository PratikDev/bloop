// Team plan §15 credits: the names stay in English in every language; only the
// words around them are translated (src/lib/i18n/en/app.ts, bn/app.ts).
// Mentor item 5: "Data in this app" lists only sources that play somewhere, each with where it plays (checked by
// credits.test.ts against the shipped files); the rest go on the "Used in our testing (not playable)" line.

/** Where a credited source is heard: a Then vs Now part, an Official or Related record, or "proof in unison". */
export type PlaysIn =
  | { kind: "thenNow"; part: "heat" | "monsoon" | "water" }
  | { kind: "related"; record: string }
  | { kind: "official"; record: string }
  | { kind: "unison"; file: string };

export interface DataCredit {
  name: string;
  plays: readonly PlaysIn[];
}

export const DATA_CREDITS: readonly DataCredit[] = [
  { name: "MUR SST (NASA/JPL PO.DAAC)", plays: [{ kind: "unison", file: "truth/sst_pairs.json" }] },
  {
    name: "GPM IMERG (NASA/JAXA, GES DISC)",
    plays: [
      { kind: "related", record: "rel_4284" },
      { kind: "related", record: "rel_4372" },
    ],
  },
  { name: "GRACE/GRACE-FO JPL mascons RL06.3Mv04 (NASA/JPL PO.DAAC)", plays: [{ kind: "thenNow", part: "water" }] },
  { name: "NASA GISTEMP v4", plays: [{ kind: "thenNow", part: "heat" }] },
  { name: "GPCP v2.3 (via NOAA PSL)", plays: [{ kind: "thenNow", part: "monsoon" }] },
];

/** Used in our checks or shown without sound: never under "Data in this app". */
export const TESTING_CREDITS: readonly string[] = [
  "GPCC Full Data v2020 (via NOAA PSL; the rain cross-check, shown, not played)",
  "NASA FIRMS",
  "MODIS MOD13Q1 via ORNL DAAC",
  "NASA GLOBE Program",
];

export const CREDIT_NAMES = {
  svs: "NASA's Scientific Visualization Studio (SVS 5101, 4285)",
  eic: "NASA Earth Information Center",
  data: DATA_CREDITS.map((c) => c.name).join("; "),
  testing: TESTING_CREDITS.join("; "),
  power: "NASA POWER",
};
