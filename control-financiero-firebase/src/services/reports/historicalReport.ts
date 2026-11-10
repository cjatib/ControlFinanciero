import type { Transaction } from '@/types/transaction';
import type { SavingsEntry } from '@/types/savings';

export interface MonthlyReportRow {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  movementCount: number;
  contributionCount: number;
}

export interface HistoricalReportSummary {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  expenseAverage: number;
  savingsAverage: number;
  months: number;
  movements: number;
  contributions: number;
}

function validMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function monthOf(value: { toDate(): Date } | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : value.toDate();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return String(date.getFullYear()).padStart(4, '0') + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

/** Returns consecutive months in ascending chronological order, including empty months. */
export function reportMonths(endMonth: string, count: number): string[] {
  if (!validMonth(endMonth) || !Number.isInteger(count) || count < 1 || count > 36) return [];
  const year = Number(endMonth.slice(0, 4));
  const month = Number(endMonth.slice(5, 7)) - 1;
  if (year < 1000 || year > 9999) return [];
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - count + 1 + index, 1);
    return String(date.getFullYear()).padStart(4, '0') + '-' + String(date.getMonth() + 1).padStart(2, '0');
  });
}

export function buildHistoricalReport(
  transactions: Transaction[],
  savingsEntries: SavingsEntry[],
  endMonth: string,
  monthCount: number,
): MonthlyReportRow[] {
  const months = reportMonths(endMonth, monthCount);
  const indexed = new Map<string, MonthlyReportRow>();
  for (const month of months) {
    indexed.set(month, {
      month, income: 0, expenses: 0, savings: 0, balance: 0, movementCount: 0, contributionCount: 0,
    });
  }
  if (!months.length) return [];

  for (const tx of transactions) {
    const month = monthOf(tx.transactionDate);
    const row = month ? indexed.get(month) : undefined;
    if (!row || !Number.isFinite(tx.amount) || tx.amount <= 0) continue;
    if (tx.type === 'income') row.income += tx.amount;
    else if (tx.type === 'expense') row.expenses += tx.amount;
    else continue;
    row.movementCount += 1;
  }

  for (const entry of savingsEntries) {
    const month = monthOf(entry.entryDate);
    const row = month ? indexed.get(month) : undefined;
    if (!row || !Number.isFinite(entry.amount) || entry.amount <= 0) continue;
    row.savings += entry.amount;
    row.contributionCount += 1;
  }

  return months.map((month) => {
    const row = indexed.get(month)!;
    return { ...row, balance: row.income - row.expenses };
  });
}

export function summarizeHistoricalReport(rows: MonthlyReportRow[]): HistoricalReportSummary {
  const totals = rows.reduce(
    (sum, row) => ({
      income: sum.income + row.income,
      expenses: sum.expenses + row.expenses,
      savings: sum.savings + row.savings,
      balance: sum.balance + row.balance,
      movements: sum.movements + row.movementCount,
      contributions: sum.contributions + row.contributionCount,
    }),
    { income: 0, expenses: 0, savings: 0, balance: 0, movements: 0, contributions: 0 },
  );
  return {
    ...totals,
    months: rows.length,
    expenseAverage: rows.length ? totals.expenses / rows.length : 0,
    savingsAverage: rows.length ? totals.savings / rows.length : 0,
  };
}

export function monthLabel(month: string, format: 'short' | 'long' = 'short'): string {
  if (!validMonth(month)) return month;
  return new Intl.DateTimeFormat('es-CL', {
    month: format === 'short' ? 'short' : 'long',
    year: format === 'long' ? 'numeric' : undefined,
  }).format(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1));
}
