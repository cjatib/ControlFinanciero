import { useEffect, useState } from 'react';
import { CreditCard } from '@/components/CreditCard';
import { CreditInstallmentListItem } from '@/components/CreditInstallmentListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
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
      <PageHeader
        eyebrow="Creditos"
        title="Controla cuotas y saldo pendiente"
        description="Registra varios creditos, guarda cada cuota pagada y sigue el avance con el proximo vencimiento calculado automaticamente."
        action={<Button onClick={openCreateCredit}>Nuevo credito</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Creditos activos"
          value={`${creditsSummary.activeCredits}`}
          helper="Pendientes"
        />
        <StatCard
          label="Saldo pendiente"
          value={formatCurrency(creditsSummary.totalPending, profile?.currency ?? 'CLP')}
          tone="negative"
        />
        <StatCard
          label="Total abonado"
          value={formatCurrency(creditsSummary.totalPaid, profile?.currency ?? 'CLP')}
          tone="positive"
        />
      </div>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-400">Cuotas pendientes</p>
          <p className="mt-2 text-2xl font-bold text-ink">{creditsSummary.remainingInstallments}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Cuotas totales registradas</p>
          <p className="mt-2 text-2xl font-bold text-ink">{creditsSummary.totalInstallments}</p>
        </div>
      </Card>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {sortedCredits.length > 0 ? (
        <div className="space-y-4">
          {sortedCredits.map((credit) => (
            <CreditCard
              key={credit.id}
              credit={credit}
              currency={profile?.currency ?? 'CLP'}
              onOpenDetails={(currentCredit) => setSelectedCreditId(currentCredit.id)}
              onEdit={(currentCredit) => {
                setEditingCreditId(currentCredit.id);
                setCreditModalOpen(true);
              }}
              onDelete={(currentCredit) => setCreditPendingDelete(currentCredit)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aun no registras creditos"
          description="Cuando agregues tu primer credito podras ir descontando cada cuota y ver cuanto te falta por pagar."
          action={
            <Button size="lg" onClick={openCreateCredit}>
              Crear mi primer credito
            </Button>
          }
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
            <Card className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Proximo vencimiento</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {selectedCreditNextDueDate ? formatDate(selectedCreditNextDueDate) : 'Credito saldado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Cuotas registradas</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {selectedCredit.paidInstallments} de {selectedCredit.totalInstallments}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Monto total</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {formatCurrency(selectedCredit.totalAmount, profile?.currency ?? 'CLP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Primer vencimiento</p>
                <p className="mt-2 text-lg font-bold text-ink">{formatDate(selectedCredit.firstDueDate)}</p>
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
              <div className="space-y-3">
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
