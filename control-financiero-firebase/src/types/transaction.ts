import type { Timestamp } from 'firebase/firestore';
import type { CategoryType } from './category';

export type TransactionType = CategoryType;

export interface TransactionDocument {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description?: string;
  transactionDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction extends TransactionDocument {
  id: string;
}

export interface TransactionPayload {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description?: string;
  transactionDate: Date;
}

export interface TransactionFilters {
  type: 'all' | TransactionType;
  categoryId: 'all' | string;
  month: string;
  search: string;
}
