import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TransactionListItem } from '@/components/TransactionListItem';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { useBudgetSavings } from '@/hooks/useBudgetSavings';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { calculateBudgetProgress } from '@/services/budget/budgetMath';
import { calculateSummary, filterTransactionsByMonth, getCurrentMonthValue } from '@/services/summary/summaryService';
import type { BudgetGroup } from '@/types/budget';

function MonthPicker({ month, onChange }: { month: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#292c36] px-3 py-2 text-sm text-slate-200">
      <span className="sr-only">Mes del dashboard</span>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-accent" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
      <input type="month" value={month} onChange={(event) => onChange(event.target.value)}
        className="min-w-0 max-w-full bg-transparent text-sm font-semibold text-ink outline-none" />
    </label>
  );
}

function ProgressBar({ color, progress }: { color: string; progress: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar"
      aria-valuenow={Math.round(Math.min(100, progress))} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all" style={{
        background: color,
        width: String(Math.max(0, Math.min(100, progress))) + '%',
      }} />
    </div>
  );
}

function EmptyBudgetCard() {
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Distribución del sueldo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Crea tu presupuesto mensual con cuantos grupos necesites. Aquí verás lo gastado, ahorrado y lo que falta para cada objetivo.
          </p>
        </div>
        <span className="rounded-2xl bg-accent/15 p-3 text-2xl" aria-hidden="true">📊</span>
      </div>
      <Link to="/plan" className="flex min-h-12 items-center justify-center rounded-2xl bg-accent px-4 text-sm font-extrabold text-slate-950">
        Configurar mi plan
      </Link>
    </Card>
  );
}

export function DashboardPage() {
  const { profile } = useAuth();
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions();
  const { budgets, loading: budgetLoading, error: budgetError } = useMonthlyBudgets();
  const [month, setMonth] = useState(getCurrentMonthValue());
  const budget = budgets.find((item) => item.month === month);
  const groups: BudgetGroup[] = budget?.groups ?? [];
  const { totals: savingsTotals, error: savingsError } = useBudgetSavings(groups, month);

  if (transactionsLoading || budgetLoading) {
    return <Loader label="Preparando tu resumen financiero..." />;
  }

  const monthTransactions = filterTransactionsByMonth(transactions, month);
  const summary = calculateSummary(monthTransactions);
  const currency = profile?.currency ?? 'CLP';
  const progress = budget ? calculateBudgetProgress(budget, monthTransactions, savingsTotals) : [];
  const linkedCategoryIds = new Set(groups.filter((group) => group.kind === 'expense').flatMap((group) => group.categoryIds));
  const unassignedExpenseAmount = monthTransactions
    .filter((tx) => tx.type === 'expense' && !linkedCategoryIds.has(tx.categoryId))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const savingTotal = progress.filter((item) => item.group.kind === 'saving').reduce((sum, item) => sum + item.actual, 0);
  const savingAssigned = progress.filter((item) => item.group.kind === 'saving').reduce((sum, item) => sum + item.assigned, 0);
  const distributionUsed = progress.filter((item) => item.group.kind === 'expense').reduce((sum, item) => sum + item.actual, 0);
  const monthLabel = /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ? new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' })
      .format(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1))
    : month;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Inicio</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Mi resumen financiero</h1>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>
      <p className="text-sm text-slate-400">Movimientos y objetivos de {monthLabel}.</p>

      {transactionsError || budgetError || savingsError ? (
        <Card className="space-y-1 p-4 text-sm text-rose-200" role="alert">
          {transactionsError ? <p>No se pudo leer el historial: {transactionsError}</p> : null}
          {budgetError ? <p>No se pudieron consultar los presupuestos: {budgetError}. Revisa las reglas de Firestore.</p> : null}
          {savingsError ? <p>{savingsError}</p> : null}
        </Card>
      ) : null}

      <Card className="overflow-hidden border-0 bg-[#B7C6FA] p-5 text-[#24365f] sm:p-7">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#344b83] px-4 py-2 text-xs font-bold text-[#e9efff]">Saldo de movimientos</span>
          <span className="rounded-full bg-[#344b83] px-3 py-2 text-xs font-bold text-[#e9efff]">CLP</span>
        </div>
        <p className="mt-12 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {formatCurrency(summary.balance, currency)}
        </p>
        <svg viewBox="0 0 330 80" className="mt-4 w-full" fill="none" aria-hidden="true">
          <path d="M0 64 L48 61 L94 46 L136 47 L167 31 L204 38 L241 20 L281 27 L330 10" stroke="#5e77b4" strokeWidth="3" strokeLinecap="round" opacity=".65" />
        </svg>
        <p className="mt-1 text-xs leading-5 text-[#344b83]">Ingresos menos gastos registrados en este mes. No representa el saldo bancario ni descuenta los ahorros por segunda vez.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="space-y-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7C6FA]/15 text-xl text-[#B7C6FA]" aria-hidden="true">↗</span>
          <p className="text-sm text-slate-300">Ingresos</p>
          <p className="break-words text-xl font-extrabold tracking-tight text-[#B7C6FA]">{formatCurrency(summary.totalIncome, currency)}</p>
        </Card>
        <Card className="space-y-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4AEA7]/15 text-xl text-[#F4AEA7]" aria-hidden="true">↘</span>
          <p className="text-sm text-slate-300">Gastos</p>
          <p className="break-words text-xl font-extrabold tracking-tight text-[#F4AEA7]">{formatCurrency(summary.totalExpense, currency)}</p>
        </Card>
      </div>

      {budget ? (
        <>
          <Card className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Distribución de mi sueldo</h2>
                <p className="mt-1 text-xs text-slate-400">Base: {formatCurrency(budget.incomeAmount, currency)}</p>
              </div>
              <Link to="/plan" className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-bold text-accent">Editar</Link>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
              {progress.map((item) => (
                <div key={item.group.id} style={{
                  width: String(item.group.percentage) + '%',
                  background: item.group.color,
                }} aria-hidden="true" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {progress.map((item) => (
                <div key={item.group.id} className="rounded-2xl border border-white/10 bg-[#292c35] p-3">
                  <span className="text-xs font-bold" style={{ color: item.group.color }}>{item.group.percentage}%</span>
                  <p className="mt-1 truncate text-sm font-bold" title={item.group.name}>{item.group.name}</p>
                  <div className="mt-3 flex h-24 items-end overflow-hidden rounded-xl bg-white/5">
                    <div className="w-full rounded-xl transition-all" style={{
                      height: String(Math.max(3, Math.min(100, item.progress))) + '%',
                      background: item.group.color,
                    }} />
                  </div>
                  <p className="mt-2 truncate text-sm font-bold">{formatCurrency(item.actual, currency)}</p>
                  <p className="text-xs text-slate-400">{Math.round(item.progress)}% {item.group.kind === 'saving' ? 'ahorrado' : 'gastado'}</p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Los grupos de gasto muestran consumo del límite; los grupos de ahorro muestran cumplimiento del objetivo.
            </p>
          </Card>
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold">Objetivos del mes</h2>
            {progress.map((item) => (
              <Card key={item.group.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.group.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.group.kind === 'saving' ? 'Meta de ahorro' : 'Presupuesto de gasto'} · {item.group.percentage}%
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold" style={{ color: item.group.color }}>
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <ProgressBar color={item.overBudget ? '#F4AEA7' : item.group.color} progress={item.progress} />
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">{item.group.kind === 'saving' ? 'Ahorrado' : 'Gastado'}</p>
                    <p className="mt-1 font-bold">{formatCurrency(item.actual, currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{item.overBudget ? 'Excedido' : item.group.kind === 'saving' ? 'Falta ahorrar' : 'Disponible'}</p>
                    <p className={'mt-1 font-extrabold ' + (item.overBudget ? 'text-rose-300' : 'text-ink')}>
                      {formatCurrency(item.overBudget ? item.actual - item.assigned : item.remaining, currency)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Asignado: {formatCurrency(item.assigned, currency)}</p>
                {item.group.kind === 'saving' && !item.group.savingsPlanId ? (
                  <p className="text-xs text-amber-200">Vincula un plan de ahorro para mostrar aportes reales.</p>
                ) : null}
                {item.group.kind === 'expense' && item.group.categoryIds.length === 0 ? (
                  <p className="text-xs text-amber-200">Vincula categorías de gasto para calcular el avance.</p>
                ) : null}
              </Card>
            ))}
          </div>
          {unassignedExpenseAmount > 0 ? (
            <Card className="space-y-2 p-4">
              <p className="text-sm font-bold text-amber-100">Gastos sin asignar a grupos</p>
              <p className="text-xl font-extrabold">{formatCurrency(unassignedExpenseAmount, currency)}</p>
              <p className="text-xs text-slate-400">Estos gastos sí están incluidos en tu saldo, pero no en las barras de los grupos. <Link to="/plan" className="font-bold text-accent">Revisar categorías</Link></p>
            </Card>
          ) : null}
          {savingAssigned > 0 ? (
            <Card className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">Ahorro planificado</p>
                <span className="text-sm font-bold text-emerald-300">{Math.round(savingTotal / savingAssigned * 100)}%</span>
              </div>
              <ProgressBar color="#A6D9C7" progress={savingTotal / savingAssigned * 100} />
              <p className="text-xs text-slate-400">{formatCurrency(savingTotal, currency)} registrados / {formatCurrency(savingAssigned, currency)} de objetivo</p>
              <p className="text-xs text-slate-400">Aportes reales registrados en planes vinculados. Gastos asignados: {formatCurrency(distributionUsed, currency)}.</p>
            </Card>
          ) : null}
        </>
      ) : <EmptyBudgetCard />}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">Movimientos del mes</h2>
          <Link to="/history" className="text-xs font-bold text-accent">Ver historial</Link>
        </div>
        {monthTransactions.length ? (
          <div className="space-y-2">
            {monthTransactions.slice(0, 5).map((transaction) => (
              <TransactionListItem key={transaction.id} transaction={transaction} currency={currency} />
            ))}
          </div>
        ) : (
          <Card className="p-5 text-sm text-slate-400">No hay movimientos registrados para este mes.</Card>
        )}
      </section>
    </div>
  );
}
