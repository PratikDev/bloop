// English strings for the "What the jukebox read" panel and the cents error budget (CV/ML build, piece A;
// src/components/JukeboxRead). Every number is a slot filled from a grid or a generated file, never typed here.
import { NAMED_BOXES } from "@/lib/cv/boxes";
import budget from "../../../../public/data/meta/error_budget.json";

export const cvReadEn = {
  "cv.read.title": "What the jukebox read from this frame",
  "cv.read.box": "Box",
  "cv.box.needle": "Around the needle",
  "cv.box.name": (p: { id: string }) => NAMED_BOXES.find((b) => b.id === p.id)?.name ?? p.id,
  "cv.axis": (p: { id: string }) => budget.axes.find((a) => a.id === p.id)?.label ?? p.id,
  "cv.read.record": "Record",
  "cv.read.frame": "Frame",
  "cv.read.median": "Median",
  "cv.read.spread": "10th to 90th percentile",
  "cv.read.nodata": "No data",
  "cv.read.cells": "Cells read",
  "cv.read.status": "Validation",
  "cv.read.budget": "Error budget",
  "cv.read.value": (p: { value: string; unit: string }) => (p.unit ? `${p.value} ${p.unit}` : p.value),
  "cv.read.range": (p: { lo: string; hi: string; unit: string }) => (p.unit ? `${p.lo} to ${p.hi} ${p.unit}` : `${p.lo} to ${p.hi}`),
  "cv.read.percent": (p: { value: string }) => `${p.value} %`,
  "cv.read.pattern": "Pattern only: no values read.",
  "cv.read.relative": "Relative values: no units.",
  "cv.read.empty": "No values in this box (land or no data).",
  "cv.read.loading": "Reading the frame",
  "cv.read.none": "Nothing to read on this page yet.",
  "cv.read.short": "Braille line",
  "cv.budget.known": (p: { error: string; cents: string }) => `Our measured error is about ${p.error}: about ${p.cents} cents of pitch.`,
  "cv.budget.flag": (p: { semitones: string }) => `Pitch differences under about ${p.semitones} semitones here are within our error; don't read them as real.`,
  "cv.budget.unknown": "Error not known: no validation source for this axis.",
  "cv.budget.noPitch": "No pitch axis: this record plays drops, not pitch.",
  "cv.budget.zoomWaiting": "Computed from today's span once the frame loads.",
  "cv.budget.all": "Error budget for every pitch axis",
  "cv.budget.col.axis": "Pitch axis",
  "cv.budget.col.error": "Measured error",
  "cv.budget.col.cents": "Cents",
  "cv.budget.col.note": "What it means",
  "cv.budget.ok": "Pitch steps above the error carry meaning.",
  "cv.hwgt.subject": "What the jukebox read",
  "cv.hwgt.place": (p: { box: string; bounds: string }) => `${p.box} (${p.bounds})`,
  "cv.hwgt.method":
    "Every grid cell whose centre lies in the box, read from the decoded frame with the app's own decoder: the median and the 10th and 90th percentiles of the cells with a value; cells with no value are counted apart. The pipeline test recomputes the same numbers with numpy.",
  "cv.hwgt.n": (p: { n: string; valid: string }) => `${p.valid} of ${p.n} cells have a value`,
  "cv.hwgt.budgetMethod":
    "Semitones per unit of each value-to-pitch rule (12 x log2 of its highest over its lowest pitch, divided by its input range; per decade on a log axis), times the record's measured error, times 100. Over 100 cents, a pitch step smaller than the error carries no meaning. Sound terrain's zoomed axis uses today's span.",
  "cv.hwgt.budgetUnc": "Each error is the record's own measured error, read from the validation table or the data file. A record with no validation source shows its error as not known, never 0.",
  "cv.hwgt.unc": (p: { budget: string }) => `${p.budget} Inversion confidence per cell is not shipped, so it is not shown.`,
};
