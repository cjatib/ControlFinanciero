import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import {
  budgetAlerts,
  budgetExpenseOverview,
  categorySpending,
  percentageChange,
} from '@/services/analytics/financialAnalytics';
import type { BudgetGroupProgress } from '@/services/budget/budgetMath';
import type { Transaction } from '@/types/transaction';

interface FinancialInsightsProps {
  currency: 'CLP';
  month: string;
  transactions: Transaction[];
  previousTransactions: Transaction[];
  progress: BudgetGroupProgress[];
  hasBudget: boolean;
  previousMonth: string | null;
  unassignedExpenses: number;
}

function Comparison({ current, previous, label }: { current: number; previous: number; label: string }) {
  const change = percentageChange(current, previous);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{change === null
        ? 'Sin referencia'
        : (change > 0 ? '+' : '') + change.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + '%'}</p>
      <p className="mt-1 text-xs text-slate-500">
        {change === null ? 'No hubo monto registrado el mes anterior' : 'Respecto del mes anterior'}
      </p>
    </div>
  );
}

export function FinancialInsights({
  currency, month, transactions, previousTransactions, progress,
  hasBudget, previousMonth, unassignedExpenses,
}: FinancialInsightsProps) {
  const totals = (items: Transaction[]) => items.reduce(
    (acc, item) => {
      if (item.type === 'income') acc.income += item.amount;
      else acc.expenses += item.amount;
      return acc;
    },
    { income: 0, expenses: 0 },
  );
  const now = totals(transactions);
  const before = totals(previousTransactions);
  const categories = categorySpending(transactions);
  const expensePlan = budgetExpenseOverview(progress);
  const alerts = budgetAlerts(progress);
  const hasRelevantExpenses = expensePlan.assigned > 0;

  return (
    <section className="space-y-4" aria-labelledby="insights-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Análisis mensual</p>
          <h2 id="insights-title" className="mt-1 text-xl font-extrabold text-ink">Cómo va tu dinero</h2>
        </div>
        <Link to="/reports" className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-bold text-accent">
          Ver reportes históricos
        </Link>
      </div>

      {hasBudget && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-ink">Presupuesto de gastos</h3>
              <p className="mt-1 text-xs text-slate-400">Solo grupos de gasto · No incluye metas de ahorro</p>
            </div>
            {hasRelevantExpenses && (
              <span className={'rounded-full px-3 py-1 text-xs font-bold ' +
                (expensePlan.spentPercentage > 100
                  ? 'bg-rose-300/15 text-rose-200'
                  : expensePlan.spentPercentage >= 80
                    ? 'bg-amber-300/15 text-amber-200'
                    : 'bg-emerald-300/15 text-emerald-200')}>
                {Math.round(expensePlan.spentPercentage)}% utilizado
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.035] p-3">
              <p className="text-xs text-slate-400">Presupuestado</p>
              <p className="mt-2 break-words font-extrabold text-ink">{formatCurrency(expensePlan.assigned, currency)}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.035] p-3">
              <p className="text-xs text-slate-400">Gastado en grupos</p>
              <p className="mt-2 break-words font-extrabold text-ink">{formatCurrency(expensePlan.spent, currency)}</p>
            </div>
          </div>
          {hasRelevantExpenses ? (
            <>
              <div role="progressbar" aria-label="Porcentaje de presupuesto de gastos utilizado"
                aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={Math.round(Math.max(0, Math.min(100, expensePlan.spentPercentage)))}
                className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent transition-all"
                  style={{ width: Math.max(0, Math.min(100, expensePlan.spentPercentage)) + '%' }} />
              </div>
              <p className={'text-sm font-semibold ' + (expensePlan.exceeded > 0 ? 'text-rose-200' : 'text-emerald-200')}>
                {expensePlan.exceeded > 0
                  ? 'Exceso total: ' + formatCurrency(expensePlan.exceeded, currency)
                  : 'Disponible: ' + formatCurrency(expensePlan.available, currency)}
              </p>
            </>
          ) : <p className="text-xs text-slate-400">Configura al menos un grupo de gasto para medir su uso.</p>}
          {unassignedExpenses > 0 ? (
            <p className="rounded-xl bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
              Hay {formatCurrency(unassignedExpenses, currency)} en gastos de categorías no vinculadas. No se incluyen en la barra anterior, pero sí en el total de gastos del mes.
            </p>
          ) : null}
        </Card>
      )}

      {alerts.length > 0 ? (
        <Card className="space-y-3 p-5">
          <h3 className="font-bold text-ink">Atención a tus límites</h3>
          {alerts.map((alert) => (
            <div key={alert.id} className={'rounded-2xl border p-3 ' +
              (alert.severity === 'danger' ? 'border-rose-300/25 bg-rose-300/10' : 'border-amber-300/20 bg-amber-300/10')}>
              <div className="flex justify-between gap-3">
                <p className="min-w-0 font-semibold text-sm text-ink">{alert.name}</p>
                <span className={'shrink-0 text-sm font-extrabold ' +
                  (alert.severity === 'danger' ? 'text-rose-200' : 'text-amber-200')}>
                  {Math.round(alert.percentage)}%
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                {alert.severity === 'danger' ? 'Límite superado' : 'Cerca del límite'}:
                {' '}{formatCurrency(alert.actual, currency)} de {formatCurrency(alert.assigned, currency)}
              </p>
            </div>
          ))}
        </Card>
      ) : null}

      <Card className="space-y-4 p-5">
        <div>
          <h3 className="font-bold text-ink">Comparación mensual</h3>
          <p className="mt-1 text-xs text-slate-400">
            {previousMonth ? month + ' frente a ' + previousMonth : 'Sin mes anterior disponible'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Comparison label="Ingresos" current={now.income} previous={before.income} />
          <Comparison label="Gastos" current={now.expenses} previous={before.expenses} />
        </div>
        <p className="text-xs leading-5 text-slate-400">
          La comparación utiliza movimientos registrados por fecha. Una subida de gastos no significa necesariamente que hayas superado tu presupuesto.
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Dónde gastaste más</h3>
            <p className="mt-1 text-xs text-slate-400">Por categoría · {month}</p>
          </div>
          <Link to="/history" className="text-xs font-bold text-accent">Historial</Link>
        </div>
        {categories.length > 0 ? (
          <div className="space-y-4">
            {categories.slice(0, 5).map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.count} {category.count === 1 ? 'movimiento' : 'movimientos'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink">{formatCurrency(category.total, currency)}</p>
                    <p className="text-xs text-slate-400">{Math.round(category.percentageOfExpenses)}% del gasto</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar" aria-label={'Porcentaje de gasto de ' + category.name}
                  aria-valuemin={0} aria-valuemax={100}
                  aria-valuenow={Math.round(category.percentageOfExpenses)}>
                  <div className="h-full rounded-full bg-[#B7C6FA]" style={{ width: category.percentageOfExpenses + '%' }} />
                </div>
              </div>
            ))}
            {categories.length > 5 ? (
              <p className="text-xs text-slate-400">Mostrando las 5 categorías con mayor gasto, de {categories.length}.</p>
            ) : null}
          </div>
        ) : <p className="text-sm text-slate-400">Todavía no hay gastos registrados en este mes.</p>}
      </Card>
    </section>
  );
}
