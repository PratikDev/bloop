// The CV/ML build's English strings (docs/cvml/BUILD.md), one file per piece, gathered here so the i18n index
// registers them in one line.
import { cvCardEn } from "./cv-card";
import { cvChordEn } from "./cv-chord";
import { cvReadEn } from "./cv-read";
import { cvTestEn } from "./cv-test";

export const cvEn = { ...cvReadEn, ...cvChordEn, ...cvCardEn, ...cvTestEn };
