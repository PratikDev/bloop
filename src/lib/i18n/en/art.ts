// ART's English strings (docs/statement/ART.md), one file per feature; Bangla drafts in ../../bn/art/.

import { dialEn, proofEn } from "./art-dial";
import { orchestraEn } from "./art-orchestra";
import { rawPixelEn } from "./art-raw-pixel";
import { letterEn, tourEn } from "./art-letter";
import { lifetimeEn } from "./art-lifetime";
import { choicesEn } from "./art-choices";
import { listenTestArtEn } from "./art-listen-test";
import { journeyEn } from "./art-journey";

export const artEn = {
  ...orchestraEn,
  ...dialEn,
  ...proofEn,
  ...rawPixelEn,
  ...letterEn,
  ...tourEn,
  ...lifetimeEn,
  ...choicesEn,
  ...listenTestArtEn,
  ...journeyEn,
};
