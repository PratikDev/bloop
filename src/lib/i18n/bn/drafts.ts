import type { MessageKey } from "../index";
import { ACCESS_DRAFTS } from "./drafts/access";
import { PAGE_DRAFTS } from "./drafts/pages";
import { EVIDENCE_DRAFTS } from "./drafts/pages-evidence";
import { timedTextBn } from "./timed-text";
import { lowVisionBn } from "./low-vision";
import { askBloopBn } from "./ask-bloop";
import { cvBn } from "./cv";
import { earthBn } from "./earth";
import { artBn } from "./art";

export const DRAFT_KEYS: readonly MessageKey[] = [
  ...PAGE_DRAFTS,
  ...EVIDENCE_DRAFTS,
  ...ACCESS_DRAFTS,
  ...(Object.keys(timedTextBn) as MessageKey[]),
  ...(Object.keys(lowVisionBn) as MessageKey[]),
  ...(Object.keys(askBloopBn) as MessageKey[]),
  ...(Object.keys(cvBn) as MessageKey[]),
  ...(Object.keys(earthBn) as MessageKey[]),
  ...(Object.keys(artBn) as MessageKey[]),
];
