import type { BudgetGroupProgress } from '@/services/budget/budgetMath';

export interface SavingsGoalSummary {
  assigned: number;
  actual: number;
  percentage: number;
  count: number;
}

/** The allocation is a goal, not a bank balance or an automatic expense. */
export function summarizeSavingsGoals(progress: BudgetGroupProgress[]): SavingsGoalSummary {
  return progress.reduce<SavingsGoalSummary>((summary, item) => {
    if (item.group.kind !== 'saving') return summary;
    summary.count += 1;
    summary.assigned += item.assigned;
    summary.actual += item.actual;
    summary.percentage += item.group.percentage;
    return summary;
  }, { assigned: 0, actual: 0, percentage: 0, count: 0 });
}
