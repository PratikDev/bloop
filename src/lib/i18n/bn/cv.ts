// The CV/ML build's Bangla (drafts, listed in drafts.ts), one file per piece like en/cv.ts.
import type { cvEn } from "../en/cv";
import type { Translated } from "../types";
import { cvCardBn } from "./cv-card";
import { cvChordBn } from "./cv-chord";
import { cvReadBn } from "./cv-read";

export const cvBn: Translated<typeof cvEn> = { ...cvReadBn, ...cvChordBn, ...cvCardBn };
