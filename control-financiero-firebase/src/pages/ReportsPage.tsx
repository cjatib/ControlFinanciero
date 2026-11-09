import { useMemo, useState } from 'react';
import { downloadReportCsv, reportCsvFilename, serializeHistoricalReportCsv } from '@/services/reports/exportReport';
import { Link } from 'react-router-dom';
import { MonthlyChart } from '@/components/reports/MonthlyChart';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useHistoricalSavingsEntries } from '@/hooks/useHistoricalSavingsEntries';
import { useSavingsPlans } from '@/hooks/useSavingsPlans';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { categorySpending } from '@/services/analytics/financialAnalytics';
import { getCurrentMonthValue } from '@/services/summary/summaryService';
import {
  buildHistoricalReport,
  monthLabel,
  summarizeHistoricalReport,
} from '@/services/reports/historicalReport';

const PERIOD_OPTIONS = [6, 12, 24] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

function Stat({ title, value, description, tone = 'normal' }: {
  title: string;
  value: string;
  description: string;
  tone?: 'normal' | 'positive' | 'negative';
}) {
  const color = tone === 'positive' ? 'text-[#A6D9C7]' : tone === 'negative' ? 'text-[#F4AEA7]' : 'text-ink';
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#252833] p-4">
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <p className={'mt-2 break-words text-lg font-extrabold tracking-tight sm:text-xl ' + color}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

export function ReportsPage() {
  const { profile } = useAuth();
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions();
  const { plans, loading: plansLoading, error: plansError } = useSavingsPlans();
  const { entries, loading: savingsLoading, error: savingsError } = useHistoricalSavingsEntries(plans);
  const [endMonth, setEndMonth] = useState(getCurrentMonthValue());
  const [period, setPeriod] = useState<Period>(12);
  const [exportError, setExportError] = useState<string | null>(null);
  const currency = profile?.currency ?? 'CLP';

  const rows = useMemo(
    () => buildHistoricalReport(transactions, entries, endMonth, period),
    [transactions, entries, endMonth, period],
  );
  const summary = useMemo(() => summarizeHistoricalReport(rows), [rows]);
  const months = useMemo(() => new Set(rows.map((row) => row.month)), [rows]);
  const categoryTotals = useMemo(() => categorySpending(transactions.filter((item) => {
    const date = item.transactionDate?.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      && months.has(getCurrentMonthValue(date));
  })), [transactions, months]);

  if (transactionsLoading || plansLoading || savingsLoading) {
    return <Loader label="Construyendo los reportes históricos..." />;
  }

  const error = transactionsError || plansError || savingsError;
  const anyCashflow = rows.some((row) => row.income > 0 || row.expenses > 0);
  const anySavings = rows.some((row) => row.savings > 0);
  const periodStart = rows[0]?.month ?? '';
  const periodEnd = rows[rows.length - 1]?.month ?? '';
  const topCategory = categoryTotals[0];

  function handleExportCsv() {
    try {
      downloadReportCsv(
        serializeHistoricalReportCsv(rows, categoryTotals),
        reportCsvFilename(endMonth, period),
      );
      setExportError(null);
    } catch (failure) {
      setExportError(failure instanceof Error ? failure.message : 'No se pudo generar el archivo CSV.');
    }
  }

  return (
    <div className="report-print-area space-y-5">
      <PageHeader
        eyebrow="Reportes históricos"
        title="La evolución de tu dinero"
        description="Analiza tus ingresos, gastos y aportes de ahorro a través del tiempo, sin modificar tus registros."
      />

      <div className="print-only">
        <h2>Reporte financiero histórico</h2>
        <p>Período: {period} meses · hasta {endMonth}</p>
        <p>Moneda: CLP · Los aportes de ahorro se muestran separadamente del balance.</p>
      </div>

      <Card className="report-filters space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <label htmlFor="report-end-month" className="block text-sm font-semibold text-slate-200">Hasta qué mes</label>
            <input id="report-end-month" type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#292c36] px-3 text-base text-ink focus:border-accent/60 sm:w-auto" />
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-200">Período</span>
            <div className="inline-flex rounded-2xl border border-white/10 bg-[#292c36] p-1" role="group" aria-label="Cantidad de meses del reporte">
              {PERIOD_OPTIONS.map((monthsOption) => (
                <button key={monthsOption} type="button" aria-pressed={period === monthsOption}
                  onClick={() => setPeriod(monthsOption)}
                  className={'min-h-10 rounded-xl px-4 text-sm font-semibold transition ' +
                    (period === monthsOption ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-white/10')}>
                  {monthsOption} meses
                </button>
              ))}
            </div>
          </div>
        </div>
        {rows.length > 0 ? (
          <p className="text-xs text-slate-400">
            Incluye {monthLabel(periodStart, 'long')} a {monthLabel(periodEnd, 'long')}, también los meses sin movimientos.
          </p>
        ) : <p className="text-xs text-rose-200">Selecciona un mes válido para generar el reporte.</p>}
      </Card>

      {!error && rows.length > 0 ? (
        <div className="print-hidden flex flex-wrap gap-3" role="group" aria-label="Exportar reportes">
          <button type="button" onClick={handleExportCsv}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-accent px-4 text-sm font-extrabold text-slate-950 sm:flex-none">
            Descargar CSV (Excel)
          </button>
          <button type="button" onClick={() => window.print()}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-slate-100 sm:flex-none">
            Imprimir / Guardar PDF
          </button>
        </div>
      ) : null}
      {exportError ? <p role="alert" className="print-hidden rounded-xl bg-rose-300/10 p-3 text-sm text-rose-200">{exportError}</p> : null}

      {error ? (
        <Card className="space-y-2 p-5" role="alert">
          <p className="font-bold text-rose-200">No se pudo cargar el reporte completo</p>
          <p className="text-sm text-slate-300">{error}</p>
          <p className="text-xs text-slate-400">Para evitar estadísticas incompletas, no se muestran los cálculos mientras exista este error.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat title="Ingresos del período" value={formatCurrency(summary.income, currency)}
              description={summary.movements + ' movimientos de ingresos y gastos'} tone="positive" />
            <Stat title="Gastos del período" value={formatCurrency(summary.expenses, currency)}
              description={'Promedio mensual: ' + formatCurrency(summary.expenseAverage, currency)} tone="negative" />
            <Stat title="Aportes al ahorro" value={formatCurrency(summary.savings, currency)}
              description={summary.contributions + ' aportes · Promedio: ' + formatCurrency(summary.savingsAverage, currency)} tone="positive" />
            <Stat title="Balance de movimientos" value={formatCurrency(summary.balance, currency)}
              description="Ingresos menos gastos; no es saldo bancario ni descuenta el ahorro otra vez."
              tone={summary.balance >= 0 ? 'positive' : 'negative'} />
          </div>

          <Card className="space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Ingresos frente a gastos</h2>
              <p className="mt-1 text-sm text-slate-400">Comparación mensual de los movimientos registrados.</p>
            </div>
            {anyCashflow ? <MonthlyChart mode="cashflow" rows={rows} />
              : <p className="rounded-2xl bg-white/5 p-5 text-sm text-slate-400">No hay ingresos ni gastos registrados en el período seleccionado.</p>}
          </Card>

          <Card className="space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Evolución del ahorro</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Aportes reales a los planes de ahorro existentes, agrupados por mes; no corresponde al saldo acumulado de tus cuentas.
              </p>
            </div>
            {anySavings ? <MonthlyChart mode="savings" rows={rows} />
              : <p className="rounded-2xl bg-white/5 p-5 text-sm text-slate-400">No hay aportes a planes de ahorro registrados en el período.</p>}
            <p className="text-xs leading-5 text-slate-400">
              Se consideran los aportes de los planes de ahorro que siguen existiendo. No se incluyen como gasto en el balance.
            </p>
          </Card>

          <Card className="space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Categorías con más gastos</h2>
              <p className="mt-1 text-sm text-slate-400">
                Desglose de los gastos del período seleccionado.
              </p>
            </div>
            {topCategory ? (
              <div className="space-y-4">
                {categoryTotals.slice(0, 5).map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{category.name}</p>
                        <p className="text-xs text-slate-400">{category.count} {category.count === 1 ? 'movimiento' : 'movimientos'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-ink">{formatCurrency(category.total, currency)}</p>
                        <p className="text-xs text-slate-400">{Math.round(category.percentageOfExpenses)}% de gastos</p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"
                      role="progressbar" aria-label={'Porcentaje de gastos en ' + category.name}
                      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(category.percentageOfExpenses)}>
                      <div className="h-full rounded-full bg-[#B7C6FA]" style={{ width: category.percentageOfExpenses + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">Sin gastos registrados para este período.</p>}
          </Card>

          <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Detalle por mes</h2>
                <p className="mt-1 text-xs text-slate-400">Importes exactos en pesos chilenos.</p>
              </div>
              <Link to="/history" className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-bold text-accent">
                Ver movimientos
              </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-white/10" role="region" aria-label="Tabla del reporte histórico" tabIndex={0}>
              <table className="w-full min-w-[580px] border-collapse text-sm">
                <thead className="bg-white/[0.055] text-xs text-slate-300">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold">Mes</th>
                    <th className="px-3 py-3 text-right font-semibold">Ingresos</th>
                    <th className="px-3 py-3 text-right font-semibold">Gastos</th>
                    <th className="px-3 py-3 text-right font-semibold">Ahorro</th>
                    <th className="px-3 py-3 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((row) => (
                    <tr key={row.month} className="border-t border-white/10">
                      <th scope="row" className="whitespace-nowrap px-3 py-3 text-left font-semibold text-ink">{monthLabel(row.month, 'long')}</th>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-[#B7C6FA]">{formatCurrency(row.income, currency)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-[#F4AEA7]">{formatCurrency(row.expenses, currency)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-[#A6D9C7]">{formatCurrency(row.savings, currency)}</td>
                      <td className={'whitespace-nowrap px-3 py-3 text-right font-semibold ' + (row.balance < 0 ? 'text-rose-200' : 'text-ink')}>
                        {formatCurrency(row.balance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
