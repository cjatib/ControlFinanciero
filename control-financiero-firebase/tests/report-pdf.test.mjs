import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoricalReportPdf, reportPdfFilename } from '../src/services/reports/exportPdf.ts';

const monthly = (month, income, expenses, savings) => ({
  month, income, expenses, savings, balance: income - expenses,
  movementCount: 2, contributionCount: 1,
});

function inspect(bytes) {
  const raw = Buffer.from(bytes).toString('latin1');
  assert.ok(raw.startsWith('%PDF-1.4\n'), 'Expected a real PDF header');
  assert.ok(raw.endsWith('%%EOF\n'), 'Expected PDF EOF marker');
  const match = raw.match(/startxref\n(\d+)\n%%EOF\n$/);
  assert.ok(match, 'Expected PDF cross-reference offset');
  const offset = Number(match[1]);
  assert.ok(raw.slice(offset).startsWith('xref\n'), 'xref points to a valid table');

  const table = raw.slice(offset).split('\n');
  const objectCount = Number(table[1]?.split(' ')[1]);
  assert.ok(objectCount >= 7);
  for (let id = 1; id < objectCount; id += 1) {
    const objOffset = Number(table[id + 2]?.slice(0, 10));
    assert.ok(raw.slice(objOffset).startsWith(id + ' 0 obj\n'), 'Invalid object reference #' + id);
  }
  const pageCount = (raw.match(/\/Type \/Page \/Parent/g) ?? []).length;
  assert.ok(pageCount >= 1);
  assert.ok(raw.includes('/Count ' + pageCount));
  return { raw, pageCount };
}

test('creates a valid PDF with monthly totals, rather than HTML or print markup', () => {
  const bytes = createHistoricalReportPdf([
    monthly('2026-11', 2000000, 1450000, 200000),
    monthly('2026-12', 2400000, 1500000, 250000),
  ], [{ id: 'c', name: 'Alimentación', total: 450000, count: 2, percentageOfExpenses: 15 }]);
  assert.ok(bytes.length > 1500);
  const { raw } = inspect(bytes);
  assert.ok(raw.includes('/BaseFont /Helvetica'));
  // Text is hex-encoded so user-defined names cannot break syntax.
  assert.ok(!raw.includes('Alimentación'));
});

test('automatically paginates 24 months and long category lists', () => {
  const rows = Array.from({ length: 24 }, (_, i) =>
    monthly(String(2025 + Math.floor(i / 12)) + '-' + String(i % 12 + 1).padStart(2, '0'),
      900000 + i * 1000, 600000 + i * 1500, 100000),
  );
  const categories = Array.from({ length: 10 }, (_, i) => ({
    id: String(i), name: 'Categoría internacional y vivienda ' + i,
    total: i * 3000, count: i + 1, percentageOfExpenses: i,
  }));
  const { pageCount } = inspect(createHistoricalReportPdf(rows, categories));
  assert.ok(pageCount >= 2, 'Long historical reports should be paginated');
});

test('PDF filenames are stable and invalid periods are rejected', () => {
  assert.equal(reportPdfFilename('2026-11', 12), 'control-financiero-reporte-2026-11-12m.pdf');
  assert.throws(() => reportPdfFilename('2026-13', 12));
  assert.throws(() => reportPdfFilename('2026-11', 0));
  assert.throws(() => createHistoricalReportPdf([], []));
});
