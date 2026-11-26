import { useEffect, useState } from 'react';
import { SavingsEntryListItem } from '@/components/SavingsEntryListItem';
import { SavingsPlanCard } from '@/components/SavingsPlanCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { SavingsEntryForm } from '@/forms/SavingsEntryForm';
import { SavingsPlanForm } from '@/forms/SavingsPlanForm';
import { useAuth } from '@/hooks/useAuth';
import { useSavingsEntries } from '@/hooks/useSavingsEntries';
import { useSavingsPlans } from '@/hooks/useSavingsPlans';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  createSavingsEntry,
  createSavingsPlan,
  deleteSavingsEntry,
  deleteSavingsPlan,
  updateSavingsEntry,
  updateSavingsPlan,
} from '@/services/savings/savingsService';
import {
  calculateSavingsEntriesTotal,
  filterSavingsEntriesByMonth,
  getSavingsMonthValue,
  getSavingsProgress,
} from '@/types/savings';
import type { SavingsEntry, SavingsEntryPayload, SavingsPlan, SavingsPlanPayload } from '@/types/savings';

export function SavingsPage() {
  const { user, profile } = useAuth();
  const { plans, loading, error } = useSavingsPlans();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [expandedPlanActions, setExpandedPlanActions] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SavingsEntry | null>(null);
  const [planPendingDelete, setPlanPendingDelete] = useState<SavingsPlan | null>(null);
  const [entryPendingDelete, setEntryPendingDelete] = useState<SavingsEntry | null>(null);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const editingPlan = plans.find((plan) => plan.id === editingPlanId) ?? null;
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
  } = useSavingsEntries(selectedPlan?.id ?? null);

  useEffect(() => {
    if (selectedPlanId && !selectedPlan) {
      setSelectedPlanId(null);
      setEntryModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedPlan, selectedPlanId]);

  if (loading) {
    return <Loader label="Cargando tus planes de ahorro..." />;
  }

  const currentMonth = getSavingsMonthValue();
  const currentMonthEntries = filterSavingsEntriesByMonth(entries, currentMonth);
  const currentMonthSaved = calculateSavingsEntriesTotal(currentMonthEntries);
  const currentProgress = selectedPlan ? getSavingsProgress(selectedPlan.monthlyTarget, currentMonthSaved) : 0;
  const lastEntry = entries[0] ?? null;
  const savingsSummary = plans.reduce(
    (summary, plan) => {
      summary.totalMonthlyTarget += plan.monthlyTarget;
      summary.totalSaved += plan.savedAmount;
      summary.totalPlans += 1;
      return summary;
    },
    {
      totalMonthlyTarget: 0,
      totalSaved: 0,
      totalPlans: 0,
    },
  );

  function openCreatePlan() {
    setEditingPlanId(null);
    setPlanModalOpen(true);
  }

  function closePlanModal() {
    setPlanModalOpen(false);
    setEditingPlanId(null);
  }

  function closePlanDetails() {
    setSelectedPlanId(null);
    setEntryModalOpen(false);
    setSelectedEntry(null);
  }

  function closeEntryModal() {
    setEntryModalOpen(false);
    setSelectedEntry(null);
  }

  async function handleSavePlan(payload: SavingsPlanPayload) {
    if (!user) {
      return;
    }

    if (editingPlan) {
      await updateSavingsPlan(user.uid, editingPlan.id, payload);
    } else {
      await createSavingsPlan(user.uid, payload);
    }

    closePlanModal();
  }

  async function handleSaveEntry(payload: SavingsEntryPayload) {
    if (!user || !selectedPlan) {
      return;
    }

    if (selectedEntry) {
      await updateSavingsEntry(user.uid, selectedPlan.id, selectedEntry.id, payload);
    } else {
      await createSavingsEntry(user.uid, selectedPlan.id, payload);
    }

    closeEntryModal();
  }

  async function confirmDeletePlan() {
    if (!user || !planPendingDelete) {
      return;
    }

    await deleteSavingsPlan(user.uid, planPendingDelete.id);

    if (selectedPlanId === planPendingDelete.id) {
      closePlanDetails();
    }

    setPlanPendingDelete(null);
  }

  async function confirmDeleteEntry() {
    if (!user || !selectedPlan || !entryPendingDelete) {
      return;
    }

    await deleteSavingsEntry(user.uid, selectedPlan.id, entryPendingDelete.id);
    setEntryPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Tus objetivos</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Ahorro</h1>
          <p className="mt-1 text-xs leading-5 text-slate-400">Organiza tus metas y registra aportes reales.</p>
        </div>
        <button
          type="button" onClick={openCreatePlan}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-slate-950 transition hover:bg-[#c9d4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo plan
        </button>
      </header>

      <Card className="grid grid-cols-2 gap-2 p-3.5 sm:gap-4 sm:p-5" aria-label="Resumen de tus ahorros">
        <div className="min-w-0 border-r border-white/10 pr-2">
          <p className="text-xs text-slate-400">Meta mensual total</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-slate-100 sm:text-xl">
            {formatCurrency(savingsSummary.totalMonthlyTarget, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <div className="min-w-0 pl-1">
          <p className="text-xs text-slate-400">Total acumulado</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-emerald-300 sm:text-xl">
            {formatCurrency(savingsSummary.totalSaved, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <p className="col-span-2 text-[11px] text-slate-400">
          {savingsSummary.totalPlans} {savingsSummary.totalPlans === 1 ? 'plan' : 'planes'} · La meta es mensual y el acumulado corresponde a aportes registrados.
        </p>
      </Card>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {plans.length > 0 ? (
        <section className="space-y-3" aria-label="Planes de ahorro">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">Mis planes</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {plans.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1d2027] shadow-glow">
            <ul className="divide-y divide-white/10">
              {plans.map((plan) => (
                <SavingsPlanCard
                  key={plan.id}
                  plan={plan}
                  currency={profile?.currency ?? 'CLP'}
                  expanded={expandedPlanActions === plan.id}
                  onToggleActions={() => setExpandedPlanActions((current) => current === plan.id ? null : plan.id)}
                  onOpenDetails={(currentPlan) => {
                    setExpandedPlanActions(null);
                    setSelectedPlanId(currentPlan.id);
                  }}
                  onEdit={(currentPlan) => {
                    setExpandedPlanActions(null);
                    setEditingPlanId(currentPlan.id);
                    setPlanModalOpen(true);
                  }}
                  onDelete={(currentPlan) => {
                    setExpandedPlanActions(null);
                    setPlanPendingDelete(currentPlan);
                  }}
                />
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Aún no registras planes de ahorro"
          description="Crea tu primer objetivo para comenzar a registrar aportes."
          action={<Button size="lg" onClick={openCreatePlan}>Crear mi primer plan</Button>}
        />
      )}

      <Modal
        open={planModalOpen}
        title={editingPlan ? 'Editar plan de ahorro' : 'Nuevo plan de ahorro'}
        description="Establece el nombre y la meta mensual."
        onClose={closePlanModal}
        centered
      >
        <SavingsPlanForm initialValue={editingPlan} onSubmit={handleSavePlan} onCancel={closePlanModal} />
      </Modal>

      <Modal
        open={Boolean(selectedPlan)}
        title={selectedPlan ? `Ahorro: ${selectedPlan.reason}` : 'Detalle del ahorro'}
        description={
          selectedPlan
            ? `Meta mensual ${formatCurrency(selectedPlan.monthlyTarget, profile?.currency ?? 'CLP')} y total acumulado ${formatCurrency(selectedPlan.savedAmount, profile?.currency ?? 'CLP')}.`
            : ''
        }
        onClose={closePlanDetails}
      >
        {selectedPlan ? (
          <div className="space-y-5">
            <Card className="space-y-4 p-3.5 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-slate-400">Monto mensual</p>
                  <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">
                    {formatCurrency(selectedPlan.monthlyTarget, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total ahorrado</p>
                  <p className="mt-1 break-words text-sm font-bold text-accent sm:text-lg">
                    {formatCurrency(selectedPlan.savedAmount, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ahorrado este mes</p>
                  <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">
                    {formatCurrency(currentMonthSaved, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ultimo ingreso</p>
                  <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">{lastEntry ? formatDate(lastEntry.entryDate) : 'Sin ingresos'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>Avance del mes</span>
                  <span>{Math.round(currentProgress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${currentProgress}%` }} />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Ingresos registrados</h3>
                <p className="mt-1 text-sm text-slate-400">Cada abono queda guardado con su fecha y nota opcional.</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedEntry(null);
                  setEntryModalOpen(true);
                }}
              >
                Registrar ahorro
              </Button>
            </div>

            {entriesError ? <Card className="p-4 text-sm text-rose-200">{entriesError}</Card> : null}

            {entriesLoading ? (
              <Loader label="Cargando ingresos de ahorro..." />
            ) : entries.length > 0 ? (
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-1">
                {entries.map((entry) => (
                  <SavingsEntryListItem
                    key={entry.id}
                    entry={entry}
                    currency={profile?.currency ?? 'CLP'}
                    onEdit={(currentEntry) => {
                      setSelectedEntry(currentEntry);
                      setEntryModalOpen(true);
                    }}
                    onDelete={(currentEntry) => setEntryPendingDelete(currentEntry)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin ingresos registrados"
                description="Apenas ingreses tu primer ahorro, aqui veras el monto, la fecha de ingreso y cualquier nota que agregues."
                action={
                  <Button
                    onClick={() => {
                      setSelectedEntry(null);
                      setEntryModalOpen(true);
                    }}
                  >
                    Registrar primer ahorro
                  </Button>
                }
              />
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={entryModalOpen && Boolean(selectedPlan)}
        title={selectedEntry ? 'Editar ingreso de ahorro' : 'Registrar ingreso de ahorro'}
        description="Anota cuánto ahorraste y cuándo."
        onClose={closeEntryModal}
      >
        <SavingsEntryForm initialValue={selectedEntry} onSubmit={handleSaveEntry} onCancel={closeEntryModal} />
      </Modal>

      <ConfirmDialog
        open={Boolean(planPendingDelete)}
        title="Eliminar plan de ahorro"
        description={
          planPendingDelete
            ? `Se eliminara el plan "${planPendingDelete.reason}" junto con todos sus ingresos registrados. Esta accion no se puede deshacer.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setPlanPendingDelete(null)}
        onConfirm={confirmDeletePlan}
      />

      <ConfirmDialog
        open={Boolean(entryPendingDelete)}
        title="Eliminar ingreso de ahorro"
        description={
          entryPendingDelete
            ? `Se quitara el ingreso por ${formatCurrency(
                entryPendingDelete.amount,
                profile?.currency ?? 'CLP',
              )} registrado el ${formatDate(entryPendingDelete.entryDate)}. El total ahorrado del plan se recalculara.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setEntryPendingDelete(null)}
        onConfirm={confirmDeleteEntry}
      />
    </div>
  );
}
