// Bangla strings for the Then vs Now statistics (src/lib/i18n/en/stats.ts). Draft, needs review (bn/drafts.ts).
// The short form (announce.thenNow.stat) reaches a braille display: its numbers come from bnNumber (Western digits).

import type { statsEn } from "../en/stats";
import type { Translated } from "../types";

export const statsBn: Translated<typeof statsEn> = {
  "stats.title": "অনিশ্চয়তা ও তাৎপর্য",
  "stats.item": (p: { label: string; value: string; lo: string; hi: string }) => `${p.label ? `${p.label} ` : ""}${p.value} (৯৫% CI ${p.lo} থেকে ${p.hi})`,
  "stats.line": (p: { head: string; items: string; result: string }) => `${p.head ? `${p.head} ` : ""}${p.items}। ${p.result}`,
  "stats.head.noWetter": "এই রেকর্ডগুলোতে বেশি ভেজা নয়:",
  "stats.head.noClear": "এই রেকর্ডগুলোতে স্পষ্ট পরিবর্তন নেই:",
  "stats.head.mixed": "মিশ্র ফল:",
  "stats.result.clear": "স্পষ্ট পরিবর্তন: বছর-থেকে-বছরের ওঠানামার চেয়ে বড়।",
  "stats.result.unclear": "স্পষ্ট পরিবর্তন নয়: বছর-থেকে-বছরের ওঠানামা বেশি।",
  "stats.result.mixed": "এই রেকর্ডগুলোর কয়েকটিতেই কেবল স্পষ্ট পরিবর্তন দেখা যায়।",
  "stats.unit.cmPerYear": "সেমি প্রতি বছর",
  "stats.label.trend": "প্রবণতা",
  "stats.unit.short.cmPerYear": "সেমি/বছর",
  "stats.unit.perDecade": "°সে প্রতি দশক",
  "stats.short.heat": "তাপ",
  "stats.short.monsoon": "বৃষ্টি",
  "stats.short.water": "পানি",
  "stats.short.clear": "স্পষ্ট",
  "stats.short.unclear": "স্পষ্ট নয়",
  "announce.thenNow.stat": (p: { part: string; value: string; lo: string; hi: string; verdict: string }) =>
    `${p.part} ${p.value} CI ${p.lo} থেকে ${p.hi} ${p.verdict}`,
  "stats.row.result": "ফল",
  "stats.row.tests": "পরীক্ষা",
  "stats.tests": (p: { welch: string; mw: string; a: string; b: string }) =>
    `Welch t-পরীক্ষা p = ${p.welch}; Mann–Whitney U p = ${p.mw} (${p.a} ও ${p.b} বছর)`,
  "stats.row.method": "পদ্ধতি",
  "stats.method.decades": (p: { draws: string }) =>
    `বার্ষিক মানগুলোর দশক-গড়; পরিবর্তন = সাম্প্রতিক − ভিত্তি। ৯৫% পরিসর এসেছে বছরগুলোর ${p.draws}টি বুটস্ট্র্যাপ পুনর্নমুনা থেকে। দুটি পরীক্ষাতেই p < ০.০৫ হলে এবং পরিসরে ০ না থাকলেই কেবল পরিবর্তনকে স্পষ্ট বলা হয়।`,
  "stats.method.trend":
    "মাসিক মান থেকে প্রতিটি পঞ্জিকা-মাসের গড় বাদ; স্বতঃসম্পর্কের জন্য সংশোধিত Mann–Kendall পরীক্ষা; ৯৫% পরিসরসহ Sen-এর ঢাল।",
  "stats.row.trend": "পুরো রেকর্ডের প্রবণতা",
  "stats.trend": (p: { test: string; from: string; to: string; slope: string; lo: string; hi: string; unit: string; p: string }) =>
    `${p.test}, ${p.from}–${p.to}: Sen-এর ঢাল ${p.slope} ${p.unit} (৯৫% CI ${p.lo} থেকে ${p.hi}), p = ${p.p}`,
  "stats.row.alsoChecked": "আরও যাচাই",
  "stats.totals": (p: { which: string; value: string; welch: string; mw: string }) => `${p.which}: ${p.value}; p = ${p.welch} ও ${p.mw}`,
  "stats.totals.jjas": "জুন–সেপ্টেম্বরের মোট",
  "stats.totals.annual": "বার্ষিক মোট",
  "stats.row.windows": "সময়সীমার গড়",
  "stats.row.measurement": "পরিমাপের ত্রুটি",
  "stats.grace": (p: { median: string; min: string; max: string }) =>
    `এই বক্সে GRACE-এর নিজস্ব ১-সিগমা: মধ্যমা মাসে ${p.median} সেমি (${p.min} থেকে ${p.max})`,
};
