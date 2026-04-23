import { useEffect, useState } from 'react';
import { SavingsEntryListItem } from '@/components/SavingsEntryListItem';
import { SavingsPlanCard } from '@/components/SavingsPlanCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
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
      <PageHeader
        eyebrow="Ahorro"
        title="Construye tus planes de ahorro"
        description="Define cuanto ahorraras cada mes, registra cada ingreso y sigue el total acumulado por motivo."
        action={<Button onClick={openCreatePlan}>Nuevo plan</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Planes activos"
          value={`${savingsSummary.totalPlans}`}
          helper="Motivos"
        />
        <StatCard
          label="Meta mensual total"
          value={formatCurrency(savingsSummary.totalMonthlyTarget, profile?.currency ?? 'CLP')}
        />
        <StatCard
          label="Total ahorrado"
          value={formatCurrency(savingsSummary.totalSaved, profile?.currency ?? 'CLP')}
          tone="positive"
        />
      </div>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {plans.length > 0 ? (
        <div className="space-y-4">
          {plans.map((plan) => (
            <SavingsPlanCard
              key={plan.id}
              plan={plan}
              currency={profile?.currency ?? 'CLP'}
              onOpenDetails={(currentPlan) => setSelectedPlanId(currentPlan.id)}
              onEdit={(currentPlan) => {
                setEditingPlanId(currentPlan.id);
                setPlanModalOpen(true);
              }}
              onDelete={(currentPlan) => setPlanPendingDelete(currentPlan)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aun no registras planes de ahorro"
          description="Crea tu primer motivo de ahorro y empieza a registrar cada ingreso para seguir tu avance."
          action={
            <Button size="lg" onClick={openCreatePlan}>
              Crear mi primer plan
            </Button>
          }
        />
      )}

      <Modal
        open={planModalOpen}
        title={editingPlan ? 'Editar plan de ahorro' : 'Nuevo plan de ahorro'}
        description="Define el motivo y el monto que quieres ahorrar mes a mes."
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
            <Card className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Monto mensual</p>
                  <p className="mt-2 text-lg font-bold text-ink">
                    {formatCurrency(selectedPlan.monthlyTarget, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total ahorrado</p>
                  <p className="mt-2 text-lg font-bold text-accent">
                    {formatCurrency(selectedPlan.savedAmount, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ahorrado este mes</p>
                  <p className="mt-2 text-lg font-bold text-ink">
                    {formatCurrency(currentMonthSaved, profile?.currency ?? 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ultimo ingreso</p>
                  <p className="mt-2 text-lg font-bold text-ink">{lastEntry ? formatDate(lastEntry.entryDate) : 'Sin ingresos'}</p>
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
              <div className="space-y-3">
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
        description="Guarda el monto ahorrado y la fecha en que lo ingresaste."
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
