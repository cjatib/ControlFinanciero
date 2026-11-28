import { toDate } from '../../lib/format.ts';
import type { Category } from '@/types/category';
import type { MonthlyBudget } from '@/types/budget';
import type { Transaction } from '@/types/transaction';

export type BudgetIncomeSource =
  | 'monthly_salary'
  | 'previous_salary'
  | 'monthly_snapshot'
  | 'inherited_plan'
  | 'historical_plan'
  | 'missing';

export interface ResolvedBudgetIncome {
  amount: number | null;
  source: BudgetIncomeSource;
  sourceMonth: string | null;
  provisional: boolean;
  salaryMovements: number;
}

interface BudgetIncomeInput {
  month: string;
  budget: MonthlyBudget | null;
  transactions: Transaction[];
  categories: Category[];
  /** Pass a fixed month in tests; production uses the user's local month. */
  currentMonth?: string;
}

function localMonth(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

/**
 * Identify salary by the existing income category named "Sueldo".
 * Use category ID as well as the transaction's saved categoryName so renaming
 * or removing a category does not silently erase an older salary movement.
 */
function salaryTotals(transactions: Transaction[], categories: Category[]): Map<string, { amount: number; count: number }> {
  const salaryCategoryIds = new Set(categories
    .filter((category) => category.type === 'income' && category.name.trim().toLocaleLowerCase('es-CL') === 'sueldo')
    .map((category) => category.id));
  const grouped = new Map<string, { amount: number; count: number }>();

  for (const item of transactions) {
    if (item.type !== 'income' ||
        !(salaryCategoryIds.has(item.categoryId) ||
          item.categoryName.trim().toLocaleLowerCase('es-CL') === 'sueldo') ||
        !Number.isSafeInteger(item.amount) || item.amount <= 0) continue;

    const date = toDate(item.transactionDate);
    if (!date || !Number.isFinite(date.getTime())) continue;
    const month = localMonth(date);
    const previous = grouped.get(month);
    const newAmount = (previous?.amount ?? 0) + item.amount;
    if (!Number.isSafeInteger(newAmount)) continue;

    grouped.set(month, { amount: newAmount, count: (previous?.count ?? 0) + 1 });
  }
  return grouped;
}

/**
 * A historical month retains its previous planned base; we never rewrite
 * historical snapshots. For the current and future months, an actual recorded
 * salary takes precedence over a manually saved snapshot. With no salary for
 * that month, an explicit monthly snapshot wins, otherwise the last known
 * salary is a provisional base and finally the inherited saved plan.
 *
 * All values are derived in memory. No Firestore writes or salary duplication.
 */
export function resolveBudgetIncome({
  month, budget, transactions, categories,
  currentMonth = localMonth(new Date()),
}: BudgetIncomeInput): ResolvedBudgetIncome {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { amount: null, source: 'missing', sourceMonth: null, provisional: true, salaryMovements: 0 };
  }

  if (month < currentMonth) {
    return budget
      ? {
          amount: budget.incomeAmount, source: 'historical_plan', sourceMonth: budget.month,
          provisional: false, salaryMovements: 0,
        }
      : { amount: null, source: 'missing', sourceMonth: null, provisional: false, salaryMovements: 0 };
  }

  const salaryByMonth = salaryTotals(transactions, categories);
  const currentSalary = salaryByMonth.get(month);
  if (currentSalary && currentSalary.amount > 0) {
    return {
      amount: currentSalary.amount, source: 'monthly_salary', sourceMonth: month,
      provisional: false, salaryMovements: currentSalary.count,
    };
  }

  if (budget?.month === month) {
    return {
      amount: budget.incomeAmount, source: 'monthly_snapshot', sourceMonth: month,
      provisional: true, salaryMovements: 0,
    };
  }

  const previousSalaryMonths = [...salaryByMonth.keys()]
    .filter((salaryMonth) => salaryMonth < month)
    .sort();
  const previousSalaryMonth = previousSalaryMonths[previousSalaryMonths.length - 1];
  if (previousSalaryMonth) {
    const previous = salaryByMonth.get(previousSalaryMonth)!;
    return {
      amount: previous.amount, source: 'previous_salary', sourceMonth: previousSalaryMonth,
      provisional: true, salaryMovements: previous.count,
    };
  }

  if (budget) {
    return {
      amount: budget.incomeAmount, source: 'inherited_plan', sourceMonth: budget.month,
      provisional: true, salaryMovements: 0,
    };
  }

  return { amount: null, source: 'missing', sourceMonth: null, provisional: true, salaryMovements: 0 };
}
