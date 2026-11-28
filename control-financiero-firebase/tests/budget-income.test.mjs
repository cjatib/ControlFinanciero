import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBudgetIncome } from '../src/services/budget/resolveBudgetIncome.ts';

const salaryCategory = { id: 'salary-id', name: 'Sueldo', type: 'income' };
const otherIncomeCategory = { id: 'bonus', name: 'Bonificación', type: 'income' };
const expenseCategory = { id: 'costs', name: 'Sueldo', type: 'expense' };
const groups = [
  { id: 'fixed', name: 'Gastos fijos', kind: 'expense', percentage: 70, categoryIds: [], color: '#ffffff', savingsPlanId: '' },
  { id: 'variable', name: 'Variables', kind: 'expense', percentage: 20, categoryIds: [], color: '#eeeeee', savingsPlanId: '' },
  { id: 'saving', name: 'Ahorro', kind: 'saving', percentage: 10, categoryIds: [], color: '#dddddd', savingsPlanId: '' },
];
function budget(month, incomeAmount = 1900000) {
  return { id: month, month, incomeAmount, groups };
}
function movement(month, day, amount, overrides = {}) {
  return {
    id: month + '/' + day + '/' + amount,
    type: 'income', categoryId: 'salary-id', categoryName: 'Sueldo',
    amount, transactionDate: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, day, 12),
    ...overrides,
  };
}
const base = {
  month: '2026-11', budget: budget('2026-10'), currentMonth: '2026-11',
  categories: [salaryCategory, otherIncomeCategory, expenseCategory],
};

test('salary from the selected month replaces the inherited plan salary', () => {
  const input = { ...base, transactions: [
    movement('2026-10', 5, 1900000),
    movement('2026-11', 5, 2050000),
    movement('2026-11', 6, 400000, { categoryId: 'bonus', categoryName: 'Bonificación' }),
  ] };
  const result = resolveBudgetIncome(input);
  assert.deepEqual(result, {
    amount: 2050000, source: 'monthly_salary', sourceMonth: '2026-11',
    provisional: false, salaryMovements: 1,
  });
  assert.equal(Math.round(result.amount * 0.7), 1435000);
});

test('multiple partial Sueldo income movements sum within the same month', () => {
  const result = resolveBudgetIncome({
    ...base, transactions: [movement('2026-11', 2, 1000000), movement('2026-11', 15, 1100000)],
  });
  assert.equal(result.amount, 2100000);
  assert.equal(result.salaryMovements, 2);
});

test('without current salary, most recent prior salary becomes provisional', () => {
  const result = resolveBudgetIncome({
    ...base, month: '2027-01',
    transactions: [movement('2026-09', 5, 1500000), movement('2026-11', 5, 2100000)],
  });
  assert.deepEqual(result, {
    amount: 2100000, source: 'previous_salary', sourceMonth: '2026-11',
    provisional: true, salaryMovements: 1,
  });
});

test('an explicit saved month retains its manual amount until its own salary is registered', () => {
  const saved = budget('2026-11', 2230000);
  const empty = resolveBudgetIncome({
    ...base, budget: saved, transactions: [movement('2026-10', 5, 1900000)],
  });
  assert.equal(empty.amount, 2230000);
  assert.equal(empty.source, 'monthly_snapshot');
  const withSalary = resolveBudgetIncome({
    ...base, budget: saved, transactions: [movement('2026-11', 5, 2050000)],
  });
  assert.equal(withSalary.amount, 2050000);
  assert.equal(saved.incomeAmount, 2230000);
});

test('past plans retain historical base, even after transactions change', () => {
  const saved = budget('2026-10', 1800000);
  const result = resolveBudgetIncome({
    ...base, month: '2026-10', budget: saved,
    transactions: [movement('2026-10', 5, 2050000), movement('2026-11', 5, 2300000)],
  });
  assert.equal(result.amount, 1800000);
  assert.equal(result.source, 'historical_plan');
  assert.equal(result.provisional, false);
});

test('old salary transactions remain recognized after category rename/removal', () => {
  const result = resolveBudgetIncome({
    ...base, categories: [otherIncomeCategory],
    transactions: [movement('2026-11', 5, 2010000)],
  });
  assert.equal(result.amount, 2010000);
});

test('salary category matches by id, but expense income impostors are excluded', () => {
  const result = resolveBudgetIncome({
    ...base, transactions: [
      movement('2026-11', 5, 1900000, { categoryName: 'Renombrado' }),
      movement('2026-11', 6, 999999, { type: 'expense', categoryId: 'costs', categoryName: 'Sueldo' }),
    ],
  });
  assert.equal(result.amount, 1900000);
});

test('no future salary leaks into earlier months; inherited configured base is last resort', () => {
  const result = resolveBudgetIncome({
    ...base, transactions: [movement('2026-12', 5, 2500000)],
  });
  assert.equal(result.amount, 1900000);
  assert.equal(result.source, 'inherited_plan');
});

test('no salary or plan returns missing, allowing first-time configuration', () => {
  const result = resolveBudgetIncome({
    ...base, budget: null, transactions: [],
  });
  assert.equal(result.amount, null);
  assert.equal(result.source, 'missing');
});

test('does not count zero, unsafe amounts or invalid dates', () => {
  const result = resolveBudgetIncome({
    ...base, transactions: [
      movement('2026-11', 5, 0),
      movement('2026-11', 6, Number.MAX_SAFE_INTEGER + 1),
      movement('2026-11', 7, 1800000, { transactionDate: 'not a date' }),
    ],
  });
  assert.equal(result.source, 'inherited_plan');
});
