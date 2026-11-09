import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reportMonths, buildHistoricalReport, summarizeHistoricalReport,
} from '../src/services/reports/historicalReport.ts';

const when = (year, month, day = 15) => ({ toDate: () => new Date(year, month - 1, day) });
const transaction = (type, amount, year, month) => ({
  id: type + month + amount, categoryId: 'cat', categoryName: 'Categoría',
  type, amount, transactionDate: when(year, month),
});
const saving = (amount, year, month) => ({
  id: String(year) + String(month) + String(amount),
  amount, entryDate: when(year, month),
});

test('builds a continuous month range, including January year rollover', () => {
  assert.deepEqual(reportMonths('2027-01', 4), ['2026-10', '2026-11', '2026-12', '2027-01']);
  assert.deepEqual(reportMonths('2027-00', 12), []);
  assert.deepEqual(reportMonths('2027-12', 0), []);
  assert.deepEqual(reportMonths('2027-12', 37), []);
});

test('aggregates income, expenses and savings separately without double discount', () => {
  const rows = buildHistoricalReport(
    [
      transaction('income', 500000, 2026, 11),
      transaction('income', 100000, 2026, 11),
      transaction('expense', 150000, 2026, 11),
      transaction('expense', 25000, 2026, 12),
      transaction('income', 300000, 2027, 1),
      transaction('expense', 800000, 2026, 9),
    ],
    [saving(45000, 2026, 11), saving(25000, 2026, 11), saving(5000, 2027, 1)],
    '2027-01',
    3,
  );
  assert.deepEqual(rows, [
    { month: '2026-11', income: 600000, expenses: 150000, savings: 70000, balance: 450000, movementCount: 3, contributionCount: 2 },
    { month: '2026-12', income: 0, expenses: 25000, savings: 0, balance: -25000, movementCount: 1, contributionCount: 0 },
    { month: '2027-01', income: 300000, expenses: 0, savings: 5000, balance: 300000, movementCount: 1, contributionCount: 1 },
  ]);
  assert.deepEqual(summarizeHistoricalReport(rows), {
    income: 900000, expenses: 175000, savings: 75000,
    balance: 725000, expenseAverage: 175000 / 3,
    savingsAverage: 75000 / 3, months: 3, movements: 5, contributions: 3,
  });
});

test('empty months remain in the report and averages include them', () => {
  const rows = buildHistoricalReport([transaction('income', 20000, 2026, 11)], [], '2026-11', 3);
  assert.deepEqual(rows.map((row) => row.month), ['2026-09', '2026-10', '2026-11']);
  assert.equal(rows[0].income, 0);
  assert.equal(rows[1].expenses, 0);
  assert.equal(summarizeHistoricalReport(rows).months, 3);
});

test('rejects invalid dates, zero amounts and out-of-range records', () => {
  const rows = buildHistoricalReport([
    transaction('expense', 0, 2026, 11),
    transaction('expense', -100, 2026, 11),
    { type: 'income', amount: 500, transactionDate: { toDate: () => new Date('invalid') } },
    transaction('income', 10000, 2028, 2),
  ], [
    saving(0, 2026, 11),
    { amount: 100, entryDate: { toDate: () => new Date('invalid') } },
  ], '2026-11', 1);
  assert.equal(rows[0].income, 0);
  assert.equal(rows[0].expenses, 0);
  assert.equal(rows[0].savings, 0);
  assert.equal(rows[0].movementCount, 0);
  assert.equal(rows[0].contributionCount, 0);
});
