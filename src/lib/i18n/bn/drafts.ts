// Bangla drafted by the developer for the mentor fixes (docs/MENTOR_FIXES.md), not yet checked by a
// Bangla-speaking teammate. docs/i18n/TO_TRANSLATE.md lists each one as "draft, needs review" (written by
// `bun run i18n:todo`); move an entry out of here once Samonwita has checked it.

import type { MessageKey } from "../index";

/** UI keys whose Bangla is a draft. */
export const DRAFT_KEYS: readonly MessageKey[] = ["disclosure.whyYears", "disclosure.extra"];

/** Data-file sentences (bn/data.ts templates) whose Bangla is a draft: the English template, numbers as "#". */
export const DRAFT_DATA_TEMPLATES: readonly string[] = [
  "GPCC stops at # because the gauge version we use (GPCC Full Data Monthly V#) ends in December #, so both rain records compare #–# with #–#.",
  "GPCP only, newer decade; GPCC data ends in #",
];
