import { continuousRule, semitonesPerUnit, withInputRange } from "@/lib/audio/mapping-maths";
import file from "../../../public/data/meta/error_budget.json";

interface BudgetAxis {
  id: string;
  label: string;
  voice: string;
  rule_file: string;
  records: string[];
  log: boolean;
  unit: string;
  dynamic: boolean;
  st_per_unit: number | null;
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

const centsOf = (stPerUnit: number, error: number) => 100 * stPerUnit * error;

export const budgetFor = (recordId: string): BudgetAxis | null => ERROR_BUDGET.axes.find((a) => a.records.includes(recordId)) ?? null;

export interface LiveBudget {
  axis: BudgetAxis;
  stPerUnit: number | null;
  cents: number | null;
  flag: boolean;
  withinSemitones: number | null;
}

export function liveBudget(axis: BudgetAxis, span?: { min: number; max: number }): LiveBudget {
  const st = axis.dynamic ? (span ? semitonesPerUnit(withInputRange(continuousRule(axis.voice), span)) : null) : axis.st_per_unit;
  const cents = st === null || axis.error_in_axis_units === null ? null : centsOf(st, axis.error_in_axis_units);
  return { axis, stPerUnit: st, cents, flag: cents !== null && cents > FLAG_CENTS, withinSemitones: cents === null ? null : cents / 100 };
}
