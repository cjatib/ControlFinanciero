import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSummary,
  filterTransactions,
} from '../src/services/summary/summaryService.ts';

const transactions = [
  { id: 'a', categoryId: 'food', categoryName: 'Supermercado', description: 'Compras', type: 'expense', amount: 45000, transactionDate: new Date(2026, 10, 20) },
  { id: 'b', categoryId: 'salary', categoryName: 'Sueldo', description: '', type: 'income', amount: 1912622, transactionDate: new Date(2026, 10, 1) },
  { id: 'c', categoryId: 'food', categoryName: 'Supermercado', description: '', type: 'expense', amount: 30000, transactionDate: new Date(2026, 9, 15) },
  { id: 'd', categoryId: 'rent', categoryName: 'Dividendo', description: '', type: 'expense', amount: 431969, transactionDate: new Date(2026, 10, 15) },
];

const filters = { type: 'all', categoryId: 'all', month: '2026-11', search: '' };

test('history summary follows the visible month, not unfiltered all-time totals', () => {
  const visible = filterTransactions(transactions, filters);
  assert.deepEqual(visible.map((entry) => entry.id), ['a', 'b', 'd']);
  const summary = calculateSummary(visible);
  assert.equal(summary.totalIncome, 1912622);
  assert.equal(summary.totalExpense, 476969);
});

test('type and category filters remain compatible with compact history controls', () => {
  const byCategory = filterTransactions(transactions, { ...filters, type: 'expense', categoryId: 'food' });
  assert.deepEqual(byCategory.map((entry) => entry.id), ['a']);
  assert.equal(calculateSummary(byCategory).totalExpense, 45000);
  assert.equal(calculateSummary(byCategory).totalIncome, 0);
});

test('search and all-months selection work without changing transactions', () => {
  const allMonths = filterTransactions(transactions, { ...filters, month: '', search: 'supermercado' });
  assert.deepEqual(allMonths.map((entry) => entry.id), ['a', 'c']);
  assert.equal(transactions.length, 4);
  assert.equal(transactions[0].amount, 45000);
});
