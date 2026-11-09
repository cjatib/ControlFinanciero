import type { Timestamp } from 'firebase/firestore';

export type BudgetGroupKind = 'expense' | 'saving';

export interface BudgetGroup {
  id: string;
  name: string;
  kind: BudgetGroupKind;
  percentage: number;
  color: string;
  categoryIds: string[];
  savingsPlanId: string;
}

export interface MonthlyBudgetPayload {
  month: string;
  incomeAmount: number;
  groups: BudgetGroup[];
}

export interface MonthlyBudgetDocument extends MonthlyBudgetPayload {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MonthlyBudget extends MonthlyBudgetDocument {
  id: string;
}

export const BUDGET_COLORS = ['#B7C6FA', '#E5B9D7', '#A6D9C7', '#F5C49F', '#C6C8DF', '#D8D3A3'] as const;

export function newBudgetGroup(kind: BudgetGroupKind = 'expense', percentage = 0, name = ''): BudgetGroup {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
    name,
    kind,
    percentage,
    color: BUDGET_COLORS[Math.floor(Math.random() * BUDGET_COLORS.length)] ?? '#B7C6FA',
    categoryIds: [],
    savingsPlanId: '',
  };
}

export function starterBudgetGroups(): BudgetGroup[] {
  return [
    { ...newBudgetGroup('expense', 50, 'Gastos fijos'), color: BUDGET_COLORS[0] },
    { ...newBudgetGroup('expense', 30, 'Gastos variables'), color: BUDGET_COLORS[1] },
    { ...newBudgetGroup('saving', 20, 'Ahorro'), color: BUDGET_COLORS[2] },
  ];
}
