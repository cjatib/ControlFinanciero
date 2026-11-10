import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMonthlyBudget } from '../src/services/budget/resolveMonthlyBudget.ts';

function budget(month, percentages) {
  return { id: month, month, incomeAmount: 1000000,
    groups: percentages.map((percentage, index) => ({ id: String(index), name: 'Grupo ' + index, percentage })) };
}

test('December inherits November when no December snapshot has been saved', () => {
  const november = budget('2026-11', [70, 20, 10]);
  const result = resolveMonthlyBudget([november], '2026-12');
  assert.equal(result.inherited, true);
  assert.equal(result.sourceMonth, '2026-11');
  assert.equal(result.budget, november);
});

test('Changing January does not change the plan inherited by December', () => {
  const november = budget('2026-11', [70, 20, 10]);
  const january = budget('2027-01', [60, 25, 15]);
  const december = resolveMonthlyBudget([january, november], '2026-12');
  assert.equal(december.sourceMonth, '2026-11');
  assert.deepEqual(december.budget.groups.map((g) => g.percentage), [70, 20, 10]);
  const february = resolveMonthlyBudget([january, november], '2027-02');
  assert.equal(february.sourceMonth, '2027-01');
  assert.deepEqual(february.budget.groups.map((g) => g.percentage), [60, 25, 15]);
});

test('A monthly snapshot takes precedence over inherited plans', () => {
  const november = budget('2026-11', [70, 20, 10]);
  const december = budget('2026-12', [65, 25, 10]);
  const january = budget('2027-01', [60, 25, 15]);
  const result = resolveMonthlyBudget([november, december, january], '2026-12');
  assert.equal(result.inherited, false);
  assert.equal(result.budget, december);
});

test('A prior month never inherits future plans', () => {
  const january = budget('2027-01', [60, 25, 15]);
  assert.deepEqual(resolveMonthlyBudget([january], '2026-12'), {
    budget: null, sourceMonth: null, inherited: false,
  });
});
