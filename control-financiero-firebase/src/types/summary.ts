import type { Transaction } from './transaction';

export interface SummarySnapshot {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: Transaction[];
}

