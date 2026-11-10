import type { MonthlyBudget } from '@/types/budget';

export interface ResolvedMonthlyBudget {
  budget: MonthlyBudget | null;
  sourceMonth: string | null;
  inherited: boolean;
}

/**
 * A saved budget is a month-specific snapshot. For a month with no snapshot,
 * use the latest plan from an earlier month, without copying or writing data.
 * Saving changes for that month creates its own independent snapshot.
 */
export function resolveMonthlyBudget(budgets: MonthlyBudget[], month: string): ResolvedMonthlyBudget {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { budget: null, sourceMonth: null, inherited: false };
  }

  const exact = budgets.find((item) => item.month === month);
  if (exact) return { budget: exact, sourceMonth: month, inherited: false };

  const previous = budgets
    .filter((item) => item.month < month)
    .reduce<MonthlyBudget | null>((latest, item) =>
      !latest || item.month > latest.month ? item : latest, null);

  return previous
    ? { budget: previous, sourceMonth: previous.month, inherited: true }
    : { budget: null, sourceMonth: null, inherited: false };
}
