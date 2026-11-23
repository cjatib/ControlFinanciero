import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBudgetProgress } from '../src/services/budget/budgetMath.ts';
import { summarizeSavingsGoals } from '../src/services/dashboard/savingsGoalSummary.ts';

const group = (id, name, kind, percentage, savingsPlanId = '') => ({
  id, name, kind, percentage, savingsPlanId, categoryIds: [], color: '#B7C6FA',
});

test('10% of a CLP 1.912.622 base is a planned goal, not money already saved', () => {
  const budget = {
    month: '2026-11',
    incomeAmount: 1912622,
    groups: [
      group('fixed', 'Gastos fijos', 'expense', 70),
      group('variable', 'Gastos variables', 'expense', 20),
      group('emergency', 'Ahorro Emergencia', 'saving', 5, 'plan-emergency'),
      group('travel', 'Fondo Vacaciones', 'saving', 5, 'plan-travel'),
    ],
  };
  const rows = calculateBudgetProgress(budget, [], {});
  assert.equal(rows.reduce((sum, row) => sum + row.assigned, 0), budget.incomeAmount);
  assert.deepEqual(summarizeSavingsGoals(rows), {
    assigned: 191263,
    actual: 0,
    percentage: 10,
    count: 2,
  });
});

test('only recorded savings-plan contributions change the actual savings figure', () => {
  const budget = {
    month: '2026-11',
    incomeAmount: 1000000,
    groups: [
      group('expenses', 'Gastos', 'expense', 80),
      group('savings', 'Ahorro', 'saving', 20, 'plan-id'),
    ],
  };
  const rows = calculateBudgetProgress(budget, [
    { type: 'expense', amount: 45000, categoryId: 'outside-budget' },
  ], { 'plan-id': 25000 });
  assert.deepEqual(summarizeSavingsGoals(rows), {
    assigned: 200000, actual: 25000, percentage: 20, count: 1,
  });
});

test('no savings groups produces no phantom savings target', () => {
  const rows = [{
    group: group('expenses', 'Gastos', 'expense', 100),
    assigned: 900000, actual: 200000, progress: 22, overBudget: false, remaining: 700000,
  }];
  assert.deepEqual(summarizeSavingsGoals(rows), {
    assigned: 0, actual: 0, percentage: 0, count: 0,
  });
});
