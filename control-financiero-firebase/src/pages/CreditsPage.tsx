import { useEffect, useState } from 'react';
import { CreditCard } from '@/components/CreditCard';
import { CreditInstallmentListItem } from '@/components/CreditInstallmentListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { CreditForm } from '@/forms/CreditForm';
import { CreditInstallmentForm } from '@/forms/CreditInstallmentForm';
import { useAuth } from '@/hooks/useAuth';
import { useCreditInstallments } from '@/hooks/useCreditInstallments';
import { useCredits } from '@/hooks/useCredits';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  createCredit,
  createCreditInstallment,
  deleteCredit,
  deleteCreditInstallment,
  updateCredit,
  updateCreditInstallment,
} from '@/services/credits/creditsService';
import {
  getCreditStatus,
  getNextCreditDueDate,
  getRemainingCreditAmount,
  getRemainingCreditInstallments,
} from '@/types/credit';
import type { Credit, CreditInstallment, CreditInstallmentPayload, CreditPayload } from '@/types/credit';

const STATUS_PRIORITY = {
  overdue: 0,
  active: 1,
  paid: 2,
} as const;

export function CreditsPage() {
  const { user, profile } = useAuth();
  const { credits, loading, error } = useCredits();
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [expandedCreditActions, setExpandedCreditActions] = useState<string | null>(null);
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<CreditInstallment | null>(null);
  const [creditPendingDelete, setCreditPendingDelete] = useState<Credit | null>(null);
  const [installmentPendingDelete, setInstallmentPendingDelete] = useState<CreditInstallment | null>(null);

  const selectedCredit = credits.find((credit) => credit.id === selectedCreditId) ?? null;
  const editingCredit = credits.find((credit) => credit.id === editingCreditId) ?? null;
  const {
    installments,
    loading: installmentsLoading,
    error: installmentsError,
  } = useCreditInstallments(selectedCredit?.id ?? null);

  useEffect(() => {
    if (selectedCreditId && !selectedCredit) {
      setSelectedCreditId(null);
      setInstallmentModalOpen(false);
      setSelectedInstallment(null);
    }
  }, [selectedCredit, selectedCreditId]);

  if (loading) {
    return <Loader label="Cargando tus creditos..." />;
  }

  const sortedCredits = [...credits].sort((left, right) => {
    const leftStatus = getCreditStatus(left);
    const rightStatus = getCreditStatus(right);

    if (STATUS_PRIORITY[leftStatus] !== STATUS_PRIORITY[rightStatus]) {
      return STATUS_PRIORITY[leftStatus] - STATUS_PRIORITY[rightStatus];
    }

    const leftDue = getNextCreditDueDate(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = getNextCreditDueDate(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return leftDue - rightDue;
  });

  const creditsSummary = credits.reduce(
    (summary, credit) => {
      summary.totalPending += getRemainingCreditAmount(credit);
      summary.totalPaid += credit.paidAmount;
      summary.totalInstallments += credit.totalInstallments;
      summary.remainingInstallments += getRemainingCreditInstallments(credit);

      if (getCreditStatus(credit) !== 'paid') {
        summary.activeCredits += 1;
      }

      return summary;
    },
    {
      totalPending: 0,
      totalPaid: 0,
      totalInstallments: 0,
      remainingInstallments: 0,
      activeCredits: 0,
    },
  );

  const selectedCreditRemainingAmount = selectedCredit ? getRemainingCreditAmount(selectedCredit) : 0;
  const selectedCreditRemainingInstallments = selectedCredit
    ? getRemainingCreditInstallments(selectedCredit)
    : 0;
  const selectedCreditNextDueDate = selectedCredit ? getNextCreditDueDate(selectedCredit) : null;

  function openCreateCredit() {
    setEditingCreditId(null);
    setCreditModalOpen(true);
  }

  function closeCreditModal() {
    setCreditModalOpen(false);
    setEditingCreditId(null);
  }

  function closeCreditDetails() {
    setSelectedCreditId(null);
    setInstallmentModalOpen(false);
    setSelectedInstallment(null);
  }

  function closeInstallmentModal() {
    setInstallmentModalOpen(false);
    setSelectedInstallment(null);
  }

  async function handleSaveCredit(payload: CreditPayload) {
    if (!user) {
      return;
    }

    if (editingCredit) {
      await updateCredit(user.uid, editingCredit.id, payload);
    } else {
      await createCredit(user.uid, payload);
    }

    closeCreditModal();
  }

  async function handleSaveInstallment(payload: CreditInstallmentPayload) {
    if (!user || !selectedCredit) {
      return;
    }

    if (selectedInstallment) {
      await updateCreditInstallment(user.uid, selectedCredit.id, selectedInstallment.id, payload);
    } else {
      await createCreditInstallment(user.uid, selectedCredit.id, payload);
    }

    closeInstallmentModal();
  }

  async function confirmDeleteCredit() {
    if (!user || !creditPendingDelete) {
      return;
    }

    await deleteCredit(user.uid, creditPendingDelete.id);

    if (selectedCreditId === creditPendingDelete.id) {
      closeCreditDetails();
    }

    setCreditPendingDelete(null);
  }

  async function confirmDeleteInstallment() {
    if (!user || !selectedCredit || !installmentPendingDelete) {
      return;
    }

    await deleteCreditInstallment(user.uid, selectedCredit.id, installmentPendingDelete.id);
    setInstallmentPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Tus compromisos</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Créditos</h1>
          <p className="mt-1 text-xs leading-5 text-slate-400">Revisa saldos, cuotas y próximos vencimientos.</p>
        </div>
        <button
          type="button" onClick={openCreateCredit}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-slate-950 transition hover:bg-[#c9d4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo
        </button>
      </header>

      <Card className="grid grid-cols-2 gap-2 p-3.5 sm:gap-4 sm:p-5" aria-label="Resumen de créditos">
        <div className="min-w-0 border-r border-white/10 pr-2">
          <p className="text-xs text-slate-400">Saldo pendiente</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-rose-300 sm:text-xl">
            {formatCurrency(creditsSummary.totalPending, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <div className="min-w-0 pl-1">
          <p className="text-xs text-slate-400">Total abonado</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-emerald-300 sm:text-xl">
            {formatCurrency(creditsSummary.totalPaid, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <p className="col-span-2 text-[11px] text-slate-400">
          {creditsSummary.activeCredits} {creditsSummary.activeCredits === 1 ? 'crédito activo' : 'créditos activos'} · {creditsSummary.remainingInstallments} cuotas pendientes de {creditsSummary.totalInstallments} totales.
        </p>
      </Card>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {sortedCredits.length > 0 ? (
        <section className="space-y-3" aria-label="Listado de créditos">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">Mis créditos</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">{sortedCredits.length}</span>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1d2027] shadow-glow">
            <ul className="divide-y divide-white/10">
              {sortedCredits.map((credit) => (
                <CreditCard
                  key={credit.id}
                  credit={credit}
                  currency={profile?.currency ?? 'CLP'}
                  expanded={expandedCreditActions === credit.id}
                  onToggleActions={() => setExpandedCreditActions((current) => current === credit.id ? null : credit.id)}
                  onOpenDetails={(currentCredit) => {
                    setExpandedCreditActions(null);
                    setSelectedCreditId(currentCredit.id);
                  }}
                  onEdit={(currentCredit) => {
                    setExpandedCreditActions(null);
                    setEditingCreditId(currentCredit.id);
                    setCreditModalOpen(true);
                  }}
                  onDelete={(currentCredit) => {
                    setExpandedCreditActions(null);
                    setCreditPendingDelete(currentCredit);
                  }}
                />
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Aún no registras créditos"
          description="Agrega un crédito para seguir tus cuotas y el saldo pendiente."
          action={<Button size="lg" onClick={openCreateCredit}>Crear mi primer crédito</Button>}
        />
      )}

      <Modal
        open={creditModalOpen}
        title={editingCredit ? 'Editar credito' : 'Nuevo credito'}
        description="Define el monto total, el numero de cuotas y la fecha del primer vencimiento."
        onClose={closeCreditModal}
      >
        <CreditForm initialValue={editingCredit} onSubmit={handleSaveCredit} onCancel={closeCreditModal} />
      </Modal>

      <Modal
        open={Boolean(selectedCredit)}
        title={selectedCredit?.name ?? 'Detalle del credito'}
        description={
          selectedCredit
            ? `Saldo pendiente ${formatCurrency(selectedCreditRemainingAmount, profile?.currency ?? 'CLP')} en ${selectedCreditRemainingInstallments} cuotas.`
            : ''
        }
        onClose={closeCreditDetails}
      >
        {selectedCredit ? (
          <div className="space-y-5">
            <Card className="grid grid-cols-2 gap-3 p-3.5 sm:p-5">
              <div>
                <p className="text-sm text-slate-400">Proximo vencimiento</p>
                <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">
                  {selectedCreditNextDueDate ? formatDate(selectedCreditNextDueDate) : 'Credito saldado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Cuotas registradas</p>
                <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">
                  {selectedCredit.paidInstallments} de {selectedCredit.totalInstallments}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Monto total</p>
                <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">
                  {formatCurrency(selectedCredit.totalAmount, profile?.currency ?? 'CLP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Primer vencimiento</p>
                <p className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">{formatDate(selectedCredit.firstDueDate)}</p>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Cuotas registradas</h3>
                <p className="mt-1 text-sm text-slate-400">Puedes editar o eliminar cualquier abono ya guardado.</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedInstallment(null);
                  setInstallmentModalOpen(true);
                }}
                disabled={selectedCreditRemainingInstallments <= 0}
              >
                Registrar cuota
              </Button>
            </div>

            {installmentsError ? <Card className="p-4 text-sm text-rose-200">{installmentsError}</Card> : null}

            {installmentsLoading ? (
              <Loader label="Cargando cuotas..." />
            ) : installments.length > 0 ? (
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-1">
                {installments.map((installment) => (
                  <CreditInstallmentListItem
                    key={installment.id}
                    installment={installment}
                    currency={profile?.currency ?? 'CLP'}
                    onEdit={(currentInstallment) => {
                      setSelectedInstallment(currentInstallment);
                      setInstallmentModalOpen(true);
                    }}
                    onDelete={(currentInstallment) => setInstallmentPendingDelete(currentInstallment)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin cuotas registradas"
                description="A medida que vayas pagando este credito, tus cuotas quedaran guardadas aqui con su fecha de ingreso."
                action={
                  <Button
                    onClick={() => {
                      setSelectedInstallment(null);
                      setInstallmentModalOpen(true);
                    }}
                    disabled={selectedCreditRemainingInstallments <= 0}
                  >
                    Registrar primera cuota
                  </Button>
                }
              />
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={installmentModalOpen && Boolean(selectedCredit)}
        title={selectedInstallment ? 'Editar cuota' : 'Registrar cuota'}
        description="Guarda el monto abonado y la fecha en que ingresaste la cuota."
        onClose={closeInstallmentModal}
      >
        {selectedCredit ? (
          <CreditInstallmentForm
            initialValue={selectedInstallment}
            remainingAmount={selectedCreditRemainingAmount}
            remainingInstallments={selectedCreditRemainingInstallments}
            currency={profile?.currency ?? 'CLP'}
            onSubmit={handleSaveInstallment}
            onCancel={closeInstallmentModal}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(creditPendingDelete)}
        title="Eliminar credito"
        description={
          creditPendingDelete
            ? `Se eliminara el credito "${creditPendingDelete.name}" junto con todas sus cuotas registradas. Esta accion no se puede deshacer.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setCreditPendingDelete(null)}
        onConfirm={confirmDeleteCredit}
      />

      <ConfirmDialog
        open={Boolean(installmentPendingDelete)}
        title="Eliminar cuota"
        description={
          installmentPendingDelete
            ? `Se quitara la cuota por ${formatCurrency(
                installmentPendingDelete.amount,
                profile?.currency ?? 'CLP',
              )} ingresada el ${formatDate(installmentPendingDelete.paymentDate)}. El saldo pendiente del credito se recalculara.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setInstallmentPendingDelete(null)}
        onConfirm={confirmDeleteInstallment}
      />
    </div>
  );
}
