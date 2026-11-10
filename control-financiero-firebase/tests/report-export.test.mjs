import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reportCsvFilename,
  serializeHistoricalReportCsv,
} from '../src/services/reports/exportReport.ts';

const monthly = [
  { month: '2026-11', income: 1000000, expenses: 640000, savings: 150000, balance: 360000, movementCount: 3, contributionCount: 1 },
  { month: '2026-12', income: 1200000, expenses: 850000, savings: 180000, balance: 350000, movementCount: 4, contributionCount: 2 },
];

test('produces Excel-friendly UTF-8 CSV with currency values and totals', () => {
  const csv = serializeHistoricalReportCsv(monthly, [{
    id: 'food', name: 'Alimentación', total: 450000, count: 2, percentageOfExpenses: 45,
  }]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('"Categoría";"Gasto CLP"'));
  assert.ok(csv.includes('"2026-11";"1000000";"640000";"150000";"360000";"3";"1"'));
  assert.ok(csv.includes('"TOTAL";"2200000";"1490000";"330000";"710000";"7";"3"'));
  assert.ok(csv.includes('"Alimentación";"450000";"2";"45"'));
  assert.ok(csv.includes('\r\n'));
});

test('keeps negative balances as numeric values in Excel', () => {
  const csv = serializeHistoricalReportCsv([{
    month: '2026-11', income: 15000, expenses: 24000,
    savings: 0, balance: -9000, movementCount: 2, contributionCount: 0,
  }], []);
  assert.ok(csv.includes('"2026-11";"15000";"24000";"0";"-9000";"2";"0"'));
  assert.ok(!csv.includes('"\'-9000"'));
});

test('quotes CSV injection prefixes in category names and doubles embedded quotation marks', () => {
  const csv = serializeHistoricalReportCsv(monthly, [
    { id: 'a', name: '=HYPERLINK("https://example.com")', total: 1, count: 1, percentageOfExpenses: 50 },
    { id: 'b', name: '\t+cmd|test', total: 1, count: 1, percentageOfExpenses: 50 },
    { id: 'c', name: 'Café;"especial"', total: 1, count: 1, percentageOfExpenses: 0 },
  ]);
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"https://example.com\"\")\""));
  assert.ok(csv.includes("\"'\t+cmd|test\""));
  assert.ok(csv.includes('"Café;""especial"""'));
});

test('rejects invalid ranges and creates stable filenames without user details', () => {
  assert.equal(reportCsvFilename('2026-11', 12), 'control-financiero-reporte-2026-11-12m.csv');
  assert.throws(() => reportCsvFilename('2026-13', 12));
  assert.throws(() => reportCsvFilename('2026-12', 0));
  assert.throws(() => serializeHistoricalReportCsv([], []));
});
