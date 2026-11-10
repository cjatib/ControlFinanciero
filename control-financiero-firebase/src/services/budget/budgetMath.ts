import type { Transaction } from '@/types/transaction';
import type { BudgetGroup, MonthlyBudgetPayload } from '@/types/budget';

export interface BudgetGroupProgress {
  group: BudgetGroup;
  assigned: number;
  actual: number;
  remaining: number;
  progress: number;
  overBudget: boolean;
}

export function validateMonthlyBudget(payload: MonthlyBudgetPayload): string | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payload.month)) return 'Selecciona un mes válido.';
  if (!Number.isSafeInteger(payload.incomeAmount) || payload.incomeAmount <= 0) {
    return 'El sueldo base debe ser un monto entero mayor a cero.';
  }
  if (payload.groups.length === 0 || payload.groups.length > 100) {
    return 'Configura entre 1 y 100 grupos de distribución.';
  }
  const total = payload.groups.reduce((sum, group) => sum + group.percentage, 0);
  if (Math.abs(total - 100) > 0.001) return 'Los porcentajes deben sumar exactamente 100%.';
  const ids = new Set<string>();
  const categoryIds = new Set<string>();
  const savingsPlanIds = new Set<string>();
  for (const group of payload.groups) {
    if (!group.id || ids.has(group.id)) return 'Cada grupo necesita un identificador único.';
    ids.add(group.id);
    if (!group.name.trim() || group.name.trim().length > 60) return 'Cada grupo necesita un nombre de hasta 60 caracteres.';
    if (group.kind !== 'expense' && group.kind !== 'saving') return 'Tipo de grupo no válido.';
    if (!Number.isFinite(group.percentage) || group.percentage <= 0 || group.percentage > 100) {
      return 'Los porcentajes de cada grupo deben ser mayores a cero y menores o iguales a 100.';
    }
    if (!Array.isArray(group.categoryIds)) return 'Las categorías de un grupo no son válidas.';
    if (group.kind === 'expense') {
      for (const id of group.categoryIds) {
        if (categoryIds.has(id)) return 'Una misma categoría de gasto no puede pertenecer a dos grupos.';
        categoryIds.add(id);
      }
    } else if (group.savingsPlanId) {
      if (savingsPlanIds.has(group.savingsPlanId)) return 'Un plan de ahorro no puede pertenecer a dos grupos.';
      savingsPlanIds.add(group.savingsPlanId);
    }
  }
  return null;
}

export function calculateBudgetProgress(
  budget: MonthlyBudgetPayload,
  transactionsThisMonth: Transaction[],
  savedByPlan: Record<string, number>,
): BudgetGroupProgress[] {
  let allocated = 0;
  return budget.groups.map((group, index) => {
    const assigned = index === budget.groups.length - 1
      ? budget.incomeAmount - allocated
      : Math.round(budget.incomeAmount * group.percentage / 100);
    allocated += assigned;
    const actual = group.kind === 'expense'
      ? transactionsThisMonth.filter((transaction) =>
        transaction.type === 'expense' && group.categoryIds.includes(transaction.categoryId),
      ).reduce((sum, transaction) => sum + transaction.amount, 0)
      : group.savingsPlanId ? savedByPlan[group.savingsPlanId] ?? 0 : 0;
    return {
      group,
      assigned,
      actual,
      remaining: Math.max(0, assigned - actual),
      progress: assigned > 0 ? actual / assigned * 100 : 0,
      overBudget: group.kind === 'expense' && actual > assigned,
    };
  });
}
