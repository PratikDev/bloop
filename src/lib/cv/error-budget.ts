// The cents error budget (public/data/meta/error_budget.json, written by pipeline/stats/error_budget.py): how many cents
// of pitch a record's measured error spans on its value -> pitch rule. Over FLAG_CENTS, pitch differences smaller than
// the error carry no meaning, and the app says so. A zoomed axis (Sound terrain) is computed here from its live span.
import { continuousRule, semitonesPerUnit, withInputRange } from "@/lib/audio/mapping-maths";
import file from "../../../public/data/meta/error_budget.json";

interface BudgetAxis {
  id: string;
  label: string;
  voice: string;
  rule_file: string;
  /** App record ids this axis describes (a Listen voice id or an official record id). */
  records: string[];
  log: boolean;
  unit: string;
  dynamic: boolean;
  st_per_unit: number | null;
  /** null: no validation source; shown as "error not known", never 0. */
  error: number | null;
  error_in_axis_units: number | null;
  error_kind: string;
  error_source: string | null;
  cents: number | null;
  flag: boolean | null;
}

interface ErrorBudget {
  generated_by: string;
  flag_cents: number;
  formula: string;
  axes: BudgetAxis[];
}

export const ERROR_BUDGET: ErrorBudget = file;
const FLAG_CENTS = ERROR_BUDGET.flag_cents;

/** cents = 100 × semitones per unit × error. */
const centsOf = (stPerUnit: number, error: number) => 100 * stPerUnit * error;

/** The axis describing a record, or null. */
export const budgetFor = (recordId: string): BudgetAxis | null => ERROR_BUDGET.axes.find((a) => a.records.includes(recordId)) ?? null;

export interface LiveBudget {
  axis: BudgetAxis;
  stPerUnit: number | null;
  cents: number | null;
  flag: boolean;
  /** Pitch steps under this many semitones are within the error (shown on flagged axes). */
  withinSemitones: number | null;
}

/** An axis's budget now: a dynamic (zoomed) axis needs the span it plays over today, from the grid. */
export function liveBudget(axis: BudgetAxis, span?: { min: number; max: number }): LiveBudget {
  const st = axis.dynamic ? (span ? semitonesPerUnit(withInputRange(continuousRule(axis.voice), span)) : null) : axis.st_per_unit;
  const cents = st === null || axis.error_in_axis_units === null ? null : centsOf(st, axis.error_in_axis_units);
  return { axis, stPerUnit: st, cents, flag: cents !== null && cents > FLAG_CENTS, withinSemitones: cents === null ? null : cents / 100 };
}
