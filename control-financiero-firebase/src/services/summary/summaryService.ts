import { toDate } from '@/lib/format';
import type { SummarySnapshot } from '@/types/summary';
import type { Transaction, TransactionFilters } from '@/types/transaction';

function getMonthBounds(month: string): { start: Date; end: Date } | null {
  if (!month) {
    return null;
  }

  const [yearPart, monthPart] = month.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  return {
    start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
  };
}

export function getCurrentMonthValue(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = `${referenceDate.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

export function filterTransactionsByMonth(transactions: Transaction[], month: string): Transaction[] {
  const monthBounds = getMonthBounds(month);

  if (!monthBounds) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const transactionDate = toDate(transaction.transactionDate);

    if (!transactionDate) {
      return false;
    }

    return transactionDate >= monthBounds.start && transactionDate <= monthBounds.end;
  });
}

export function calculateSummary(transactions: Transaction[]): SummarySnapshot {
  const totals = transactions.reduce(
    (accumulator, transaction) => {
      if (transaction.type === 'income') {
        accumulator.totalIncome += transaction.amount;
      } else {
        accumulator.totalExpense += transaction.amount;
      }

      return accumulator;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
    },
  );

  return {
    balance: totals.totalIncome - totals.totalExpense,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    recentTransactions: transactions.slice(0, 5),
  };
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const monthBounds = getMonthBounds(filters.month);
  const search = filters.search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const transactionDate = toDate(transaction.transactionDate);

    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }

    if (filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    if (monthBounds && transactionDate && transactionDate < monthBounds.start) {
      return false;
    }

    if (monthBounds && transactionDate && transactionDate > monthBounds.end) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      transaction.categoryName,
      transaction.description ?? '',
      `${transaction.amount}`,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}
