import assert from 'node:assert/strict';
import test from 'node:test';
import {
  previousMonth,
  percentageChange,
  categorySpending,
  budgetExpenseOverview,
  budgetAlerts,
} from '../src/services/analytics/financialAnalytics.ts';

const expense = (id, name, amount) => ({ id: id + '-' + amount, type: 'expense', categoryId: id, categoryName: name, amount });
const income = (amount) => ({ id: 'income-' + amount, type: 'income', amount });

test('previousMonth handles January/year rollover and rejects invalid months', () => {
  assert.equal(previousMonth('2027-01'), '2026-12');
  assert.equal(previousMonth('2026-11'), '2026-10');
  assert.equal(previousMonth('2026-13'), null);
});

test('month comparisons do not pretend to have a valid percentage without a base', () => {
  assert.equal(percentageChange(150, 100), 50);
  assert.equal(percentageChange(80, 100), -20);
  assert.equal(percentageChange(100, 0), null);
});

test('spending breakdown ignores income, groups expenses by category ID and sorts highest first', () => {
  const groups = categorySpending([expense('food', 'Alimentación', 4000), expense('home', 'Hogar', 7000), expense('food', 'Alimentación', 1000), income(50000)]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].name, 'Hogar');
  assert.equal(groups[0].total, 7000);
  assert.equal(groups[1].total, 5000);
  assert.equal(groups[1].count, 2);
  assert.ok(Math.abs(groups.reduce((sum, c) => sum + c.percentageOfExpenses, 0) - 100) < 0.001);
});

const progress = (id, name, kind, assigned, actual) => ({
  group: { id, name, kind, percentage: 40, categoryIds: [], savingsPlanId: '', color: '#B7C6FA' },
  assigned, actual, remaining: Math.max(0, assigned - actual),
  progress: assigned > 0 ? actual / assigned * 100 : 0,
  overBudget: actual > assigned && kind === 'expense',
});

test('budget overview excludes savings, and warns at 80% and above', () => {
  const data = [
    progress('rent', 'Arriendo', 'expense', 100000, 120000),
    progress('food', 'Alimentación', 'expense', 50000, 40000),
    progress('save', 'Ahorro', 'saving', 25000, 25000),
  ];
  assert.deepEqual(budgetExpenseOverview(data), {
    assigned: 150000,
    spent: 160000,
    available: 0,
    exceeded: 10000,
    spentPercentage: 160000 / 150000 * 100,
  });
  const alerts = budgetAlerts(data);
  assert.equal(alerts.length, 2);
  assert.deepEqual(alerts.map((a) => a.severity), ['danger', 'warning']);
});

test('no alerts for unspent groups or savings groups', () => {
  assert.deepEqual(budgetAlerts([progress('a', 'Ahorro', 'saving', 10000, 15000), progress('b', 'Cuentas', 'expense', 10000, 0)]), []);
});
