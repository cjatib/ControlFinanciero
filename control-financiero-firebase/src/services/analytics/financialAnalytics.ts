import type { Transaction } from '@/types/transaction';
import type { BudgetGroupProgress } from '@/services/budget/budgetMath';

export interface CategorySpending {
  id: string;
  name: string;
  total: number;
  count: number;
  percentageOfExpenses: number;
}

export interface BudgetAlert {
  id: string;
  name: string;
  assigned: number;
  actual: number;
  percentage: number;
  severity: 'warning' | 'danger';
}

export interface BudgetExpenseOverview {
  assigned: number;
  spent: number;
  available: number;
  exceeded: number;
  spentPercentage: number;
}

export function previousMonth(month: string): string | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const resultYear = monthNumber === 1 ? year - 1 : year;
  const resultMonth = monthNumber === 1 ? 12 : monthNumber - 1;
  return resultYear > 0 ? String(resultYear).padStart(4, '0') + '-' + String(resultMonth).padStart(2, '0') : null;
}

/** Return a change percentage only if the comparison period has a nonzero base. */
export function percentageChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous * 100;
}

export function categorySpending(transactions: Transaction[]): CategorySpending[] {
  const grouped = new Map<string, { id: string; name: string; total: number; count: number }>();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !Number.isFinite(transaction.amount) || transaction.amount <= 0) continue;
    const id = transaction.categoryId;
    const current = grouped.get(id);
    if (current) {
      current.total += transaction.amount;
      current.count += 1;
    } else {
      grouped.set(id, { id, name: transaction.categoryName, total: transaction.amount, count: 1 });
    }
  }
  const totalExpenses = [...grouped.values()].reduce((sum, category) => sum + category.total, 0);
  return [...grouped.values()]
    .map((category) => ({ ...category, percentageOfExpenses: totalExpenses > 0 ? category.total / totalExpenses * 100 : 0 }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'es-CL'));
}

export function budgetExpenseOverview(progress: BudgetGroupProgress[]): BudgetExpenseOverview {
  const expenses = progress.filter((item) => item.group.kind === 'expense');
  const assigned = expenses.reduce((sum, item) => sum + item.assigned, 0);
  const spent = expenses.reduce((sum, item) => sum + item.actual, 0);
  return {
    assigned,
    spent,
    available: Math.max(0, assigned - spent),
    exceeded: Math.max(0, spent - assigned),
    spentPercentage: assigned > 0 ? spent / assigned * 100 : 0,
  };
}

export function budgetAlerts(progress: BudgetGroupProgress[]): BudgetAlert[] {
  return progress
    .filter((item) => item.group.kind === 'expense' && item.assigned > 0 && item.progress >= 80)
    .map((item) => ({
      id: item.group.id,
      name: item.group.name,
      assigned: item.assigned,
      actual: item.actual,
      percentage: item.progress,
      severity: item.progress > 100 ? 'danger' as const : 'warning' as const,
    }))
    .sort((a, b) => (a.severity === b.severity ? b.percentage - a.percentage : a.severity === 'danger' ? -1 : 1));
}
