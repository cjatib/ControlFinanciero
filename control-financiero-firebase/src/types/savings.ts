import type { Timestamp } from 'firebase/firestore';
import { toDate } from '@/lib/format';

export interface SavingsPlanDocument {
  reason: string;
  monthlyTarget: number;
  savedAmount: number;
  entriesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavingsPlan extends SavingsPlanDocument {
  id: string;
}

export interface SavingsPlanPayload {
  reason: string;
  monthlyTarget: number;
}

export interface SavingsEntryDocument {
  amount: number;
  entryDate: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavingsEntry extends SavingsEntryDocument {
  id: string;
}

export interface SavingsEntryPayload {
  amount: number;
  entryDate: Date;
  description?: string;
}

export function getSavingsMonthValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');

  return `${year}-${month}`;
}

export function filterSavingsEntriesByMonth(entries: SavingsEntry[], month: string): SavingsEntry[] {
  return entries.filter((entry) => {
    const entryDate = toDate(entry.entryDate);

    if (!entryDate) {
      return false;
    }

    return getSavingsMonthValue(entryDate) === month;
  });
}

export function calculateSavingsEntriesTotal(entries: SavingsEntry[]): number {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

export function getSavingsProgress(monthlyTarget: number, currentMonthSaved: number): number {
  if (monthlyTarget <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (currentMonthSaved / monthlyTarget) * 100));
}
