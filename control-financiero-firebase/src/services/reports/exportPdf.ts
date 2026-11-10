import type { CategorySpending } from '@/services/analytics/financialAnalytics';
import type { MonthlyReportRow } from '@/services/reports/historicalReport';
import { summarizeHistoricalReport } from './historicalReport.ts';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 43;
const RIGHT = PAGE_WIDTH - LEFT;
const BOTTOM = 63;

type PdfPage = string[];

const COLOR = {
  ink: [0.13, 0.16, 0.23],
  muted: [0.38, 0.43, 0.52],
  lavender: [0.36, 0.44, 0.72],
  green: [0.17, 0.48, 0.38],
  rose: [0.66, 0.29, 0.34],
  rule: [0.83, 0.85, 0.9],
  pale: [0.94, 0.95, 0.98],
} as const;

function number(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/**
 * PDF standard fonts use Windows-1252, not UTF-8. Encode all visible text as
 * hex byte strings so accented Spanish characters and arbitrary category
 * names cannot break PDF syntax or execute PDF operators.
 */
function encodePdfText(text: string): string {
  const extra = new Map<number, number>([
    [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
    [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
    [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
    [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
  ]);

  let encoded = '';
  for (const character of text) {
    const code = character.codePointAt(0)!;
    const byte = code >= 32 && code <= 126 || code >= 160 && code <= 255
      ? code
      : extra.get(code) ?? (code === 9 || code === 10 || code === 13 || code === 160 ? 32 : 63);
    encoded += byte.toString(16).padStart(2, '0');
  }
  return encoded.toUpperCase();
}

function currency(amount: number): string {
  return '$ ' + new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(amount);
}

function crop(text: string, maxLength: number): string {
  const clean = text.replace(/[\r\n\t]+/g, ' ').trim();
  return clean.length > maxLength ? clean.slice(0, maxLength - 3) + '...' : clean;
}

function pdfDocument(objects: string[]): Uint8Array {
  // Every object and stream uses ASCII syntax and hex-encoded text.
  const encoder = new TextEncoder();
  let source = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(encoder.encode(source).length);
    source += (i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n';
  }
  const xrefOffset = encoder.encode(source).length;
  source += 'xref\n0 ' + offsets.length + '\n0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    source += String(offset).padStart(10, '0') + ' 00000 n \n';
  }
  source += 'trailer\n<< /Size ' + offsets.length + ' /Root 1 0 R >>\nstartxref\n'
    + xrefOffset + '\n%%EOF\n';
  return encoder.encode(source);
}

export function reportPdfFilename(endMonth: string, period: number): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(endMonth) ||
      !Number.isInteger(period) || period < 1 || period > 36) {
    throw new Error('Período PDF no válido.');
  }
  return 'control-financiero-reporte-' + endMonth + '-' + period + 'm.pdf';
}

/** Generate an actual paginated A4 PDF completely in memory, without network or libraries. */
export function createHistoricalReportPdf(rows: MonthlyReportRow[], categories: CategorySpending[]): Uint8Array {
  if (!rows.length) throw new Error('Selecciona un período válido para generar el PDF.');

  const summary = summarizeHistoricalReport(rows);
  const pages: PdfPage[] = [];
  let page: PdfPage = [];
  let y = 0;

  function fill(color: readonly number[]): void {
    page.push(color.map(number).join(' ') + ' rg');
  }
  function lineColor(color: readonly number[]): void {
    page.push(color.map(number).join(' ') + ' RG');
  }
  function rectangle(x: number, bottom: number, width: number, height: number, color: readonly number[]): void {
    fill(color);
    page.push([number(x), number(bottom), number(width), number(height), 're f'].join(' '));
  }
  function text(x: number, bottom: number, value: string, size = 10, bold = false,
    color: readonly number[] = COLOR.ink, align: 'left' | 'right' = 'left'): void {
    if (!value) return;
    const textWidth = Array.from(value).length * size * (bold ? 0.55 : 0.51);
    const xPosition = align === 'right' ? x - textWidth : x;
    fill(color);
    page.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + number(size) + ' Tf 1 0 0 1 '
      + number(xPosition) + ' ' + number(bottom) + ' Tm <' + encodePdfText(value) + '> Tj ET');
  }
  function line(bottom: number): void {
    lineColor(COLOR.rule);
    page.push(number(LEFT) + ' ' + number(bottom) + ' m ' + number(RIGHT) + ' '
      + number(bottom) + ' l S');
  }
  function nextPage(): void {
    page = [];
    pages.push(page);
    y = PAGE_HEIGHT - 54;
    rectangle(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, COLOR.lavender);
    text(LEFT, y, 'CONTROLFINANCIERO', 15, true, COLOR.ink);
    text(RIGHT, y, 'REPORTE HISTÓRICO', 10, true, COLOR.muted, 'right');
    y -= 20;
    text(LEFT, y, 'Período: ' + rows[0]!.month + ' a ' + rows[rows.length - 1]!.month
      + '   |   Moneda: CLP', 10, false, COLOR.muted);
    y -= 14;
    line(y);
    y -= 24;
  }
  function ensure(height: number): void {
    if (y - height < BOTTOM) nextPage();
  }
  function heading(value: string): void {
    ensure(35);
    text(LEFT, y, value, 13, true, COLOR.ink);
    y -= 23;
  }
  function summaryCell(x: number, title: string, value: number, color: readonly number[]): void {
    rectangle(x, y - 68, 247, 79, COLOR.pale);
    text(x + 11, y - 12, title, 9, false, COLOR.muted);
    text(x + 11, y - 43, currency(value), 16, true, color);
  }
  function columnHeaders(): void {
    ensure(37);
    rectangle(LEFT, y - 10, RIGHT - LEFT, 23, COLOR.pale);
    text(LEFT + 7, y - 2, 'MES', 9, true, COLOR.ink);
    text(225, y - 2, 'INGRESOS', 9, true, COLOR.ink, 'right');
    text(327, y - 2, 'GASTOS', 9, true, COLOR.ink, 'right');
    text(438, y - 2, 'AHORRO', 9, true, COLOR.ink, 'right');
    text(RIGHT - 8, y - 2, 'BALANCE', 9, true, COLOR.ink, 'right');
    y -= 29;
  }

  nextPage();
  heading('Resumen del período');
  summaryCell(LEFT, 'Ingresos', summary.income, COLOR.green);
  summaryCell(LEFT + 264, 'Gastos', summary.expenses, COLOR.rose);
  y -= 99;
  summaryCell(LEFT, 'Aportes al ahorro', summary.savings, COLOR.green);
  summaryCell(LEFT + 264, 'Balance de movimientos', summary.balance, COLOR.lavender);
  y -= 102;
  text(LEFT, y, 'Balance = ingresos menos gastos. El ahorro NO se descuenta por segunda vez.',
    10, false, COLOR.muted);
  y -= 31;

  heading('Detalle mensual');
  columnHeaders();
  for (const row of rows) {
    if (y - 18 < BOTTOM) {
      nextPage();
      heading('Detalle mensual (continuación)');
      columnHeaders();
    }
    text(LEFT + 7, y, row.month, 9.2);
    text(225, y, currency(row.income), 9.2, false, COLOR.ink, 'right');
    text(327, y, currency(row.expenses), 9.2, false, COLOR.ink, 'right');
    text(438, y, currency(row.savings), 9.2, false, COLOR.ink, 'right');
    text(RIGHT - 8, y, currency(row.balance), 9.2, row.balance < 0,
      row.balance < 0 ? COLOR.rose : COLOR.ink, 'right');
    y -= 20;
    line(y + 8);
  }

  ensure(48);
  y -= 11;
  rectangle(LEFT, y - 14, RIGHT - LEFT, 28, COLOR.pale);
  text(LEFT + 7, y - 3, 'TOTAL', 9.2, true);
  text(225, y - 3, currency(summary.income), 9.2, true, COLOR.ink, 'right');
  text(327, y - 3, currency(summary.expenses), 9.2, true, COLOR.ink, 'right');
  text(438, y - 3, currency(summary.savings), 9.2, true, COLOR.ink, 'right');
  text(RIGHT - 8, y - 3, currency(summary.balance), 9.2, true, COLOR.ink, 'right');
  y -= 54;

  ensure(90);
  heading('Categorías con mayor gasto');
  if (!categories.length) {
    text(LEFT, y, 'No hay gastos por categoría en este período.', 10, false, COLOR.muted);
    y -= 25;
  } else {
    const top = categories.slice(0, 10);
    for (const category of top) {
      ensure(30);
      text(LEFT + 7, y, crop(category.name, 39), 10, false, COLOR.ink);
      text(RIGHT - 7, y, currency(category.total) + '  (' +
        number(category.percentageOfExpenses) + '%)', 9.5, true, COLOR.ink, 'right');
      y -= 22;
      line(y + 9);
    }
  }

  ensure(70);
  y -= 20;
  text(LEFT, y, 'Fuente: movimientos y aportes guardados en ControlFinanciero.',
    9, false, COLOR.muted);
  y -= 15;
  text(LEFT, y, 'Documento creado localmente en el dispositivo. No modifica Firestore.',
    9, false, COLOR.muted);

  // Add page numbers and close with valid PDF object offsets.
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];
  const kids: string[] = [];
  pages.forEach((commands, index) => {
    const pageId = 5 + index * 2;
    const streamId = pageId + 1;
    kids.push(pageId + ' 0 R');
    // Footer on each page.
    commands.push('0.4 0.44 0.52 rg BT /F1 9 Tf 1 0 0 1 ' + number(LEFT)
      + ' 36 Tm <' + encodePdfText('ControlFinanciero - Uso personal') + '> Tj ET');
    commands.push('BT /F1 9 Tf 1 0 0 1 ' + number(RIGHT - 58)
      + ' 36 Tm <' + encodePdfText('Página ' + (index + 1) + ' de ' + pages.length) + '> Tj ET');

    const stream = commands.join('\n') + '\n';
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '
      + number(PAGE_WIDTH) + ' ' + number(PAGE_HEIGHT)
      + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + streamId + ' 0 R >>');
    objects.push('<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream');
  });
  objects[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages.length + ' >>';
  return pdfDocument(objects);
}

export function downloadReportPdf(pdf: Uint8Array, filename: string): void {
  // Materialize a regular PDF file, not an HTML page masquerading as PDF.
  const bytes = new Uint8Array(pdf.length);
  bytes.set(pdf);
  const blob = new Blob([bytes], { type: 'application/pdf' });
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
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

/** Share through native iOS sheet on HTTPS; fall back to proven file download on HTTP. */
export async function shareOrDownloadReportPdf(
  pdf: Uint8Array,
  filename: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const copy = new Uint8Array(pdf.length);
  copy.set(pdf);
  const file = new File([copy], filename, { type: 'application/pdf' });

  // File sharing requires HTTPS or another secure context. Local Wi-Fi HTTP
  // testing will use direct download, just like the working CSV export.
  if (window.isSecureContext && typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Safari/PWA may reject sharing despite canShare; use local download.
    }
  }

  downloadReportPdf(pdf, filename);
  return 'downloaded';
}
