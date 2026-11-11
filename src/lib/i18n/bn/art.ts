// ART's Bangla drafts (docs/statement/ART.md), one file per feature; every key is listed for review in
// docs/i18n/TO_TRANSLATE.md through bn/drafts.ts.

import { dialBn, proofBn } from "./art-dial";
import { orchestraBn } from "./art-orchestra";
import { rawPixelBn } from "./art-raw-pixel";
import { letterBn, tourBn } from "./art-letter";
import { lifetimeBn } from "./art-lifetime";
import { choicesBn } from "./art-choices";
import { listenTestArtBn } from "./art-listen-test";
import { journeyBn } from "./art-journey";

export const artBn = {
  ...orchestraBn,
  ...dialBn,
  ...proofBn,
  ...rawPixelBn,
  ...letterBn,
  ...tourBn,
  ...lifetimeBn,
  ...choicesBn,
  ...listenTestArtBn,
  ...journeyBn,
};
