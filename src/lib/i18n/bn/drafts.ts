// Bangla drafted by the developer for the mentor fixes (docs/MENTOR_FIXES.md), not yet checked by a
// Bangla-speaking teammate. docs/i18n/TO_TRANSLATE.md lists each one as "draft, needs review" (written by
// `bun run i18n:todo`); move an entry out of here once Samonwita has checked it.

import type { MessageKey } from "../index";
import { ACCESS_DRAFTS } from "./drafts/access";
import { PAGE_DRAFTS } from "./drafts/pages";
import { timedTextBn } from "./timed-text";
import { lowVisionBn } from "./low-vision";
import { askBloopBn } from "./ask-bloop";
import { cvBn } from "./cv";
import { earthBn } from "./earth";
import { artBn } from "./art"; // ART

/** UI keys whose Bangla is a draft. */
export const DRAFT_KEYS: readonly MessageKey[] = [
  ...PAGE_DRAFTS,
  ...ACCESS_DRAFTS,
  // Timed text (en/timed-text.ts): every key
  ...(Object.keys(timedTextBn) as MessageKey[]),
  // Low vision (en/low-vision.ts): every key
  ...(Object.keys(lowVisionBn) as MessageKey[]),
  // Ask Bloop (en/ask-bloop.ts): every key (needsReview)
  ...(Object.keys(askBloopBn) as MessageKey[]),
  // CV/ML (en/cv-*.ts): every key
  ...(Object.keys(cvBn) as MessageKey[]),
  ...(Object.keys(earthBn) as MessageKey[]),
  // Art (en/art/): every key, a developer's draft
  ...(Object.keys(artBn) as MessageKey[]),
];
