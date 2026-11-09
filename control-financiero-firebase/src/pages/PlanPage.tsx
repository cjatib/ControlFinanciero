import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { useSavingsPlans } from '@/hooks/useSavingsPlans';
import { formatCurrency } from '@/lib/format';
import { saveMonthlyBudget } from '@/services/budget/budgetService';
import { validateMonthlyBudget } from '@/services/budget/budgetMath';
import { resolveMonthlyBudget } from '@/services/budget/resolveMonthlyBudget';
import { getCurrentMonthValue } from '@/services/summary/summaryService';
import { BUDGET_COLORS, newBudgetGroup, starterBudgetGroups } from '@/types/budget';
import type { BudgetGroup, BudgetGroupKind, MonthlyBudgetPayload } from '@/types/budget';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

function monthTitle(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNumber - 1, 1));
}

export function PlanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { budgets, loading: budgetsLoading, error: budgetsError } = useMonthlyBudgets();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { plans, loading: savingsLoading, error: savingsError } = useSavingsPlans();
  const [month, setMonth] = useState(() => {
    const requested = searchParams.get('month');
    return requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : getCurrentMonthValue();
  });
  const [income, setIncome] = useState('');
  const [groups, setGroups] = useState<BudgetGroup[]>(starterBudgetGroups);
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isHistorical = month < getCurrentMonthValue();
  const existing = budgets.find((item) => item.month === month);
  const resolved = resolveMonthlyBudget(budgets, month);
  const source = resolved.budget;

  useEffect(() => {
    const nextGroups = source
      ? source.groups.map((g) => ({ ...g, categoryIds: [...g.categoryIds] }))
      : starterBudgetGroups();
    setIncome(source ? String(source.incomeAmount) : '');
    setGroups(nextGroups);
    setPercentageInputs(Object.fromEntries(nextGroups.map((g) => [g.id, String(g.percentage)])));
    setSaved(false);
    setSaveError(null);
  }, [month, source]);


  const total = groups.reduce((sum, group) => sum + Number(group.percentage || 0), 0);
  const amount = Number(income);
  const assignedTotal = Number.isFinite(amount) ? amount : 0;
  const draft: MonthlyBudgetPayload = { month, incomeAmount: amount, groups };
  const validation = validateMonthlyBudget(draft);
  const incompletePercentage = groups.some((g) => !percentageInputs[g.id]?.trim());
  const usedExpenseCategoryIds = useMemo(
    () => new Set(groups.filter((g) => g.kind === 'expense').flatMap((g) => g.categoryIds)),
    [groups],
  );
  const unassigned = categories.filter((c) => c.type === 'expense' && !usedExpenseCategoryIds.has(c.id));

  function patchGroup(id: string, patch: Partial<BudgetGroup>) {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, ...patch } : group));
    setSaved(false);
  }

  function changePercentage(groupId: string, raw: string) {
    const value = raw.replace(',', '.');
    if (value !== '' && !/^\d*(?:\.\d{0,2})?$/.test(value)) return;
    setPercentageInputs((current) => ({ ...current, [groupId]: value }));
    patchGroup(groupId, { percentage: value === '' ? 0 : Number(value) });
  }

  function normalizePercentage(groupId: string) {
    setPercentageInputs((current) => {
      const raw = current[groupId] ?? '';
      if (raw.trim() === '') return current;
      return { ...current, [groupId]: String(Number(raw)) };
    });
  }

  function changeKind(id: string, kind: BudgetGroupKind) {
    patchGroup(id, { kind, categoryIds: [], savingsPlanId: '' });
  }

  function toggleCategory(groupId: string, categoryId: string, checked: boolean) {
    setGroups((current) => current.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          categoryIds: checked
            ? [...group.categoryIds, categoryId]
            : group.categoryIds.filter((id) => id !== categoryId),
        };
      }
      return checked
        ? { ...group, categoryIds: group.categoryIds.filter((id) => id !== categoryId) }
        : group;
    }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    if (!user) return;
    if (isHistorical) {
      setSaveError('Este mes ya está cerrado. Los planes anteriores son de solo lectura.');
      return;
    }
    const issue = incompletePercentage ? 'Completa el porcentaje de cada grupo.' : validateMonthlyBudget(draft);
    if (issue) {
      setSaveError(issue);
      return;
    }
    try {
      setSaving(true);
      await saveMonthlyBudget(user.uid, draft);
      setSaved(true);
    } catch (failure) {
      setSaveError(getFirebaseErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  if (budgetsLoading || categoriesLoading || savingsLoading) {
    return <Loader label="Cargando tu planificación..." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plan financiero"
        title="Distribuye tu sueldo"
        description="Los meses siguientes heredan tu plan, y los meses anteriores quedan cerrados para preservar su historial."
      />
      {budgetsError || categoriesError || savingsError ? (
        <Card className="space-y-2 p-4 text-sm text-rose-200">
          {budgetsError ? <p>{budgetsError} Revisa las reglas de Firestore para monthlyBudgets.</p> : null}
          {categoriesError ? <p>{categoriesError}</p> : null}
          {savingsError ? <p>{savingsError}</p> : null}
        </Card>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="budget-month" className="text-sm font-semibold text-slate-200">Mes de planificación</label>
            {existing ? <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">Personalizado</span> : <span className="text-xs text-accent">{resolved.inherited ? "Heredado" : "Sin plan"}</span>}
          </div>
          <input id="budget-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-ink" required />
          <p className="text-sm text-slate-400">{monthTitle(month)} · Los cambios solo afectarán al mes seleccionado.</p>
          <fieldset disabled={isHistorical} className="space-y-3">
            <label htmlFor="budget-income" className="block text-sm font-semibold text-slate-200">Sueldo base del mes (CLP)</label>
            <input id="budget-income" type="number" inputMode="numeric" min={1} step={1}
              placeholder="Ejemplo: 1000000" value={income} onChange={(e) => { setIncome(e.target.value); setSaved(false); }}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-xl font-bold text-ink placeholder:text-slate-500 disabled:opacity-60" required />
          </fieldset>
          <p className="text-xs leading-5 text-slate-400">El sueldo base sirve para calcular tus límites. No crea un ingreso ni modifica las transacciones existentes.</p>
        </Card>

        <fieldset disabled={isHistorical} className="min-w-0 space-y-5 disabled:opacity-80">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Distribución</h2>
            <span className={'text-xl font-extrabold ' + (Math.abs(total - 100) < 0.001 ? 'text-emerald-300' : 'text-rose-300')}>
              {total.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            {groups.map((group) =>
              <div key={group.id} style={{
                background: group.color,
                width: String(Math.max(0, Math.min(100, group.percentage))) + '%',
              }} aria-hidden="true" />,
            )}
          </div>
          <p className="text-xs text-slate-400">La suma debe ser 100 %. Puedes agregar, editar o eliminar grupos sin límite fijo de tres.</p>
        </Card>

        <div className="space-y-3">
          {groups.map((group, index) => {
            const assigned = Math.round(assignedTotal * Number(group.percentage || 0) / 100);
            return (
              <Card key={group.id} className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Grupo {index + 1}</span>
                  <button type="button" onClick={() => { setGroups((current) => current.filter((g) => g.id !== group.id)); setSaved(false); }}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-300/10"
                    aria-label={'Eliminar grupo ' + group.name}>Eliminar</button>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block">Nombre</span>
                    <input type="text" maxLength={60} value={group.name} onChange={(e) => patchGroup(group.id, { name: e.target.value })}
                      placeholder="Ej.: Alimentación" className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 text-base text-ink" required />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block">Porcentaje</span>
                    <input type="text" inputMode="decimal" autoComplete="off" pattern="[0-9]+([.,][0-9]{1,2})?" value={percentageInputs[group.id] ?? String(group.percentage)}
                      onChange={(e) => changePercentage(group.id, e.target.value)}
                      onBlur={() => normalizePercentage(group.id)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-2 text-base text-ink" required />
                  </label>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block">Tipo de objetivo</span>
                    <select value={group.kind} onChange={(e) => changeKind(group.id, e.target.value as BudgetGroupKind)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#2b2d37] px-3 text-base text-ink">
                      <option value="expense">Límite de gasto</option>
                      <option value="saving">Meta de ahorro</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-xs text-slate-300">
                    <span className="block">Color</span>
                    <select aria-label={'Color de ' + group.name} value={group.color}
                      onChange={(e) => patchGroup(group.id, { color: e.target.value })}
                      className="h-12 w-16 rounded-xl border border-white/10 bg-[#2b2d37] px-2 text-base text-ink">
                      {BUDGET_COLORS.map((color, idx) => <option key={color} value={color}>{idx + 1}</option>)}
                    </select>
                  </label>
                </div>
                {group.kind === 'expense' ? (
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm font-medium text-slate-200">Categorías de gasto vinculadas</legend>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {categories.filter((c) => c.type === 'expense').map((category) =>
                        <label key={category.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                          <input type="checkbox" checked={group.categoryIds.includes(category.id)}
                            onChange={(e) => toggleCategory(group.id, category.id, e.target.checked)}
                            className="h-5 w-5 accent-[#B7C6FA]" />
                          <span className="truncate">{category.name}</span>
                        </label>,
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Cada gasto se asigna a un solo grupo, según su categoría.</p>
                  </fieldset>
                ) : (
                  <label className="block space-y-2 text-sm text-slate-300">
                    <span className="block">Plan de ahorro para medir aportes reales</span>
                    <select value={group.savingsPlanId}
                      onChange={(e) => patchGroup(group.id, { savingsPlanId: e.target.value })}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#2b2d37] px-3 text-base text-ink">
                      <option value="">Sin vincular (progreso no contabilizado)</option>
                      {plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.reason}</option>)}
                    </select>
                    <p className="text-xs leading-5 text-slate-400">Los aportes provienen de Ahorro. No se cuentan como gastos ni se descuentan automáticamente del saldo.</p>
                  </label>
                )}
                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <span className="text-xs text-slate-400">Monto asignado</span>
                  <span className="text-lg font-bold" style={{ color: group.color }}>{formatCurrency(assigned)}</span>
                </div>
              </Card>
            );
          })}
        </div>
        <button type="button" onClick={() => {
            const group = newBudgetGroup();
            setGroups((current) => [...current, group]);
            setPercentageInputs((current) => ({ ...current, [group.id]: '' }));
            setSaved(false);
          }}
          disabled={groups.length >= 100}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-dashed border-accent/50 bg-accent/10 text-sm font-bold text-accent disabled:opacity-50">
          + Agregar grupo
        </button>
        {unassigned.length > 0 ? (
          <Card className="space-y-2 p-4 text-sm text-amber-100">
            <p className="font-semibold">Categorías sin grupo ({unassigned.length})</p>
            <p className="text-xs leading-5 text-slate-300">Los gastos de estas categorías seguirán en tu balance, pero no se mostrarán dentro de ninguna barra del plan: {unassigned.map((c) => c.name).join(', ')}.</p>
          </Card>
        ) : null}
        {saveError || validation || incompletePercentage ? <p role="alert" className="rounded-xl bg-rose-300/10 p-3 text-sm text-rose-200">{saveError ?? (incompletePercentage ? 'Completa el porcentaje de cada grupo.' : validation)}</p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-300/10 p-3 text-sm text-emerald-200">Plan mensual guardado correctamente.</p> : null}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#1d2027] p-3">
          <Button type="submit" fullWidth size="lg" disabled={isHistorical || saving || !!validation || incompletePercentage || !!budgetsError}>
            {saving ? 'Guardando...' : existing ? 'Guardar cambios del mes' : resolved.inherited ? 'Personalizar plan de este mes' : 'Guardar plan mensual'}
          </Button>
          <Link to="/dashboard" className="block py-2 text-center text-sm text-slate-300">Volver al inicio</Link>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
