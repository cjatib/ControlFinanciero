import type { Timestamp } from 'firebase/firestore';
import { toDate } from '@/lib/format';

export interface CreditDocument {
  name: string;
  description?: string;
  totalAmount: number;
  totalInstallments: number;
  paidAmount: number;
  paidInstallments: number;
  firstDueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Credit extends CreditDocument {
  id: string;
}

export interface CreditPayload {
  name: string;
  description?: string;
  totalAmount: number;
  totalInstallments: number;
  firstDueDate: Date;
}

export interface CreditInstallmentDocument {
  amount: number;
  paymentDate: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreditInstallment extends CreditInstallmentDocument {
  id: string;
}

export interface CreditInstallmentPayload {
  amount: number;
  paymentDate: Date;
  description?: string;
}

export type CreditStatus = 'active' | 'overdue' | 'paid';

function addMonths(sourceDate: Date, months: number) {
  const nextDate = new Date(sourceDate);
  const originalDay = nextDate.getDate();
  nextDate.setMonth(nextDate.getMonth() + months);

  if (nextDate.getDate() !== originalDay) {
    nextDate.setDate(0);
  }

  return nextDate;
}

export function getRemainingCreditAmount(credit: Pick<CreditDocument, 'totalAmount' | 'paidAmount'>): number {
  return Math.max(credit.totalAmount - credit.paidAmount, 0);
}

export function getRemainingCreditInstallments(
  credit: Pick<CreditDocument, 'totalInstallments' | 'paidInstallments'>,
): number {
  return Math.max(credit.totalInstallments - credit.paidInstallments, 0);
}

export function getNextCreditDueDate(
  credit: Pick<CreditDocument, 'firstDueDate' | 'paidInstallments' | 'totalInstallments'>,
): Date | null {
  if (getRemainingCreditInstallments(credit) <= 0) {
    return null;
  }

  const firstDueDate = toDate(credit.firstDueDate);

  if (!firstDueDate) {
    return null;
  }

  return addMonths(firstDueDate, credit.paidInstallments);
}

export function getCreditStatus(
  credit: Pick<
    CreditDocument,
    'totalAmount' | 'paidAmount' | 'totalInstallments' | 'paidInstallments' | 'firstDueDate'
  >,
): CreditStatus {
  if (getRemainingCreditAmount(credit) <= 0 || getRemainingCreditInstallments(credit) <= 0) {
    return 'paid';
  }

  const nextDueDate = getNextCreditDueDate(credit);

  if (!nextDueDate) {
    return 'paid';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDueDate.setHours(0, 0, 0, 0);

  return nextDueDate < today ? 'overdue' : 'active';
}

export function getCreditProgress(credit: Pick<CreditDocument, 'totalAmount' | 'paidAmount'>): number {
  if (credit.totalAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (credit.paidAmount / credit.totalAmount) * 100));
}
