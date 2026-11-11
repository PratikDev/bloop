import { cvCardEn } from "./cv-card";
import { cvChordEn } from "./cv-chord";
import { cvReadEn } from "./cv-read";
import { cvTestEn } from "./cv-test";

export const cvEn = { ...cvReadEn, ...cvChordEn, ...cvCardEn, ...cvTestEn };
