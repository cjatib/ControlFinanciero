import type { CategorySpending } from '@/services/analytics/financialAnalytics';
import type { MonthlyReportRow } from '@/services/reports/historicalReport';
import { summarizeHistoricalReport } from '@/services/reports/historicalReport';

function safeCsvCell(value: string | number): string {
  const raw = String(value);
  // Avoid spreadsheet formula execution (including formula prefixes hidden by whitespace).
  // Tabs and line breaks also get neutralized before CSV quoting.
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function csvLine(cells: Array<string | number>): string {
  return cells.map(safeCsvCell).join(';');
}

/**
 * Excel in Chile generally expects semicolon-separated values. Include UTF-8
 * BOM for accents and retain numeric amounts without thousands separators.
 */
export function serializeHistoricalReportCsv(
  rows: MonthlyReportRow[],
  categories: CategorySpending[],
): string {
  if (rows.length === 0) {
    throw new Error('Selecciona un período válido para exportar el reporte.');
  }
  const summary = summarizeHistoricalReport(rows);
  const lines = [
    csvLine(['ControlFinanciero - Reporte histórico']),
    csvLine(['Desde', rows[0].month, 'Hasta', rows[rows.length - 1].month]),
    csvLine(['Moneda', 'CLP']),
    '',
    csvLine(['Mes', 'Ingresos CLP', 'Gastos CLP', 'Aportes al ahorro CLP', 'Balance de movimientos CLP', 'N° movimientos', 'N° aportes']),
    ...rows.map((row) => csvLine([
      row.month, row.income, row.expenses, row.savings, row.balance, row.movementCount, row.contributionCount,
    ])),
    csvLine(['TOTAL', summary.income, summary.expenses, summary.savings, summary.balance, summary.movements, summary.contributions]),
    '',
    csvLine(['Ahorro: los aportes se presentan por separado y no se descuentan nuevamente del balance.']),
    '',
    csvLine(['Categorias con mas gastos en el período']),
    csvLine(['Categoría', 'Gasto CLP', 'N° movimientos', 'Porcentaje del gasto (%)']),
    ...categories.map((category) =>
      csvLine([category.name, category.total, category.count, Number(category.percentageOfExpenses.toFixed(2))])),
    '',
  ];
  return '\ufeff' + lines.join('\r\n');
}

export function reportCsvFilename(endMonth: string, numberOfMonths: number): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(endMonth) || !Number.isInteger(numberOfMonths) || numberOfMonths < 1 || numberOfMonths > 36) {
    throw new Error('Período de exportación no válido.');
  }
  return 'control-financiero-reporte-' + endMonth + '-' + numberOfMonths + 'm.csv';
}

export function downloadReportCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Safari can require a moment before the download reads the blob URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
