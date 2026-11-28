import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { BudgetGroupProgress } from '@/services/budget/budgetMath';
import type { ResolvedBudgetIncome } from '@/services/budget/resolveBudgetIncome';
import { summarizeSavingsGoals } from '@/services/dashboard/savingsGoalSummary';

interface BudgetDistributionSummaryProps {
  currency: 'CLP';
  incomeAmount: number;
  budgetIncome: ResolvedBudgetIncome;
  inherited: boolean;
  month: string;
  progress: BudgetGroupProgress[];
  sourceMonth: string | null;
}

function percent(value: number): string {
  return value.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + '%';
}

export function BudgetDistributionSummary({
  currency,
  incomeAmount,
  budgetIncome,
  inherited,
  month,
  progress,
  sourceMonth,
}: BudgetDistributionSummaryProps) {
  const savings = summarizeSavingsGoals(progress);

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink">Distribución de mi sueldo</h2>
          <p className="mt-1 text-xs text-slate-400">Base del plan: {formatCurrency(incomeAmount, currency)}</p>
          <p className={'mt-1 text-[11px] font-semibold ' +
            (budgetIncome.source === 'monthly_salary' ? 'text-emerald-300' : 'text-amber-200')}>
            {budgetIncome.source === 'monthly_salary'
              ? 'Sueldo de este mes · actualizado desde Movimientos'
              : budgetIncome.source === 'previous_salary'
                ? 'Provisional · último sueldo registrado (' + budgetIncome.sourceMonth + ')'
                : budgetIncome.source === 'monthly_snapshot'
                  ? 'Provisional · sueldo configurado para este mes'
                  : budgetIncome.source === 'inherited_plan'
                    ? 'Provisional · sueldo heredado del plan ' + budgetIncome.sourceMonth
                    : budgetIncome.source === 'historical_plan'
                      ? 'Base histórica del plan · sin recálculo retroactivo'
                      : 'Sin sueldo registrado'}
          </p>
        </div>
        <Link
          to={'/plan?month=' + month}
          className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-bold text-accent transition hover:bg-accent/25"
        >
          {inherited ? 'Personalizar plan' : 'Editar plan'}
        </Link>
      </div>

      {inherited ? (
        <p className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs text-accent">
          {budgetIncome.source === 'historical_plan'
            ? 'Distribución histórica heredada de ' + sourceMonth + '. La base se mantiene fija para proteger el historial.'
            : 'Distribución heredada de ' + sourceMonth + '. Los porcentajes se mantienen; el sueldo se actualiza al registrar «Sueldo» en Movimientos. Para cambiar porcentajes, personaliza este mes.'}
        </p>
      ) : null}

      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        {progress.map((item) => (
          <span
            key={item.group.id}
            className="h-full"
            style={{ width: String(Math.max(0, item.group.percentage)) + '%', backgroundColor: item.group.color }}
          />
        ))}
      </div>

      <div className="divide-y divide-white/10" role="list" aria-label="Grupos del presupuesto">
        {progress.map((item) => {
          const saving = item.group.kind === 'saving';
          const label = saving ? 'Aportado' : 'Gastado';
          const remainingLabel = item.overBudget ? 'Excedido' : saving ? 'Falta aportar' : 'Disponible';
          const remaining = item.overBudget ? item.actual - item.assigned : item.remaining;
          const value = Math.max(0, Math.min(100, item.progress));

          return (
            <div key={item.group.id} role="listitem" className="space-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.group.color }}
                  />
                  <span className="min-w-0 break-words text-sm font-bold text-ink">{item.group.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-slate-400">{percent(item.group.percentage)}</span>
                </div>
                <span className={'text-xs font-extrabold ' + (item.overBudget ? 'text-rose-300' : 'text-slate-200')}>
                  {percent(item.progress)} {saving ? 'ahorrado' : 'utilizado'}
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label={'Avance de ' + item.group.name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(value)}
                aria-valuetext={percent(item.progress) + ' de ' + (saving ? 'meta de ahorro' : 'presupuesto de gastos')}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: value + '%', backgroundColor: item.overBudget ? '#F4AEA7' : item.group.color }}
                />
              </div>

              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs">
                <p className="text-slate-400">
                  {label}: <span className="font-bold text-slate-200">{formatCurrency(item.actual, currency)}</span>
                  <span className="text-slate-500"> / {formatCurrency(item.assigned, currency)}</span>
                </p>
                <p className={item.overBudget ? 'font-semibold text-rose-300' : 'font-semibold text-slate-300'}>
                  {remainingLabel}: {formatCurrency(remaining, currency)}
                </p>
              </div>

              {saving && !item.group.savingsPlanId ? (
                <p className="text-xs text-amber-200">Sin plan vinculado: no se pueden medir los aportes reales.</p>
              ) : null}
              {!saving && item.group.categoryIds.length === 0 ? (
                <p className="text-xs text-amber-200">Vincula categorías de gasto en tu plan para medir este grupo.</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {savings.count > 0 ? (
        <div className="rounded-xl bg-white/[0.04] px-3 py-3 text-xs leading-5 text-slate-300">
          <p className="font-bold text-slate-100">¿Cómo se calcula el ahorro?</p>
          <p className="mt-1">
            Reservaste {percent(savings.percentage)} del sueldo ({formatCurrency(savings.assigned, currency)})
            para tus metas. Aportes realmente registrados en los planes vinculados: {formatCurrency(savings.actual, currency)}.
          </p>
          <p className="mt-1 text-slate-400">
            Es un objetivo, no dinero ya ahorrado. Solo se registra avance al ingresar aportes en
            {' '}<Link className="font-semibold text-accent" to="/savings">Ahorro</Link>.
            No se descuenta del saldo de movimientos.
          </p>
        </div>
      ) : (
        <p className="text-xs leading-5 text-slate-400">
          Las barras muestran el uso del presupuesto. Puedes ajustar las asignaciones desde Editar plan.
        </p>
      )}
    </Card>
  );
}
