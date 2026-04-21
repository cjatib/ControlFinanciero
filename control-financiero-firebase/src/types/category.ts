import type { Timestamp } from 'firebase/firestore';

export type CategoryType = 'income' | 'expense';

export interface CategoryDocument {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category extends CategoryDocument {
  id: string;
}

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

