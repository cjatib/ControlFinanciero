import { useState } from 'react';
import { CompactMovementList } from '@/components/dashboard/CompactMovementList';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { HistoryFiltersForm } from '@/forms/HistoryFiltersForm';
import { TransactionForm } from '@/forms/TransactionForm';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import {
  calculateSummary,
  filterTransactions,
  getCurrentMonthValue,
} from '@/services/summary/summaryService';
import {
  deleteTransaction,
  updateTransaction,
} from '@/services/transactions/transactionsService';
import type { Transaction, TransactionFilters, TransactionPayload } from '@/types/transaction';

const INITIAL_FILTERS: TransactionFilters = {
  type: 'all',
  categoryId: 'all',
  month: getCurrentMonthValue(),
  search: '',
};

export function HistoryPage() {
  const { user, profile } = useAuth();
  const { categories } = useCategories();
  const { transactions, loading, error } = useTransactions();
  const [filters, setFilters] = useState<TransactionFilters>(INITIAL_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transactionPendingDelete, setTransactionPendingDelete] = useState<Transaction | null>(null);

  if (loading) {
    return <Loader label="Construyendo tu historico..." />;
  }

  const filteredTransactions = filterTransactions(transactions, filters);
  const filteredSummary = calculateSummary(filteredTransactions);

  function closeModal() {
    setModalOpen(false);
    setSelectedTransaction(null);
  }

  async function handleCreateOrUpdate(payload: TransactionPayload) {
    if (!user || !selectedTransaction) {
      return;
    }

    await updateTransaction(user.uid, selectedTransaction.id, payload);
    closeModal();
  }

  async function confirmDeleteTransaction() {
    if (!user || !transactionPendingDelete) {
      return;
    }

    await deleteTransaction(user.uid, transactionPendingDelete.id);
    setTransactionPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Tu actividad</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Historial</h1>
        <p className="mt-1 text-xs leading-5 text-slate-400">Encuentra movimientos por fecha, tipo o categoría.</p>
      </header>

      <Card className="p-3.5 sm:p-5">
        <HistoryFiltersForm
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onClear={() => setFilters(INITIAL_FILTERS)}
        />
      </Card>

      <Card className="grid grid-cols-2 gap-2 p-3.5 sm:gap-4 sm:p-5" aria-label="Totales de movimientos filtrados">
        <div className="min-w-0 border-r border-white/10 pr-2 sm:pr-4">
          <p className="text-xs text-slate-400">Ingresos</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-emerald-300 sm:text-xl">
            {formatCurrency(filteredSummary.totalIncome, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <div className="min-w-0 pl-1">
          <p className="text-xs text-slate-400">Gastos</p>
          <p className="mt-1 break-words text-base font-extrabold tabular-nums text-rose-300 sm:text-xl">
            {formatCurrency(filteredSummary.totalExpense, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <p className="col-span-2 text-[11px] text-slate-500">Totales calculados según los filtros seleccionados.</p>
      </Card>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      <section className="space-y-3" aria-label="Resultados del historial">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Movimientos</h2>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
        {filteredTransactions.length > 0 ? (
          <CompactMovementList
            transactions={filteredTransactions}
            categories={categories}
            currency={profile?.currency ?? 'CLP'}
            showActions
            onEdit={(currentTransaction) => {
              setSelectedTransaction(currentTransaction);
              setModalOpen(true);
            }}
            onDelete={(currentTransaction) => setTransactionPendingDelete(currentTransaction)}
          />
        ) : (
          <EmptyState
            title="No encontramos movimientos"
            description="Prueba cambiando el mes, el tipo, la categoría o el texto buscado."
          />
        )}
      </section>

      <Modal
        open={modalOpen}
        title="Editar transaccion"
        description="Actualiza el monto, categoria o fecha del movimiento seleccionado."
        onClose={closeModal}
        footer={
          <div className="flex flex-col gap-2">
            <Button form="history-transaction-editor" type="submit" fullWidth size="lg" disabled={submitting || categories.length === 0}>
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="ghost" type="button" fullWidth onClick={closeModal} disabled={submitting}>Cancelar</Button>
          </div>
        }
      >
        <TransactionForm
          categories={categories}
          initialValue={selectedTransaction}
          onSubmit={handleCreateOrUpdate}
          onCancel={closeModal}
          formId="history-transaction-editor"
          hideActions
          onSubmittingChange={setSubmitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(transactionPendingDelete)}
        title="Eliminar movimiento"
        description={
          transactionPendingDelete
            ? `Se eliminara el movimiento "${transactionPendingDelete.categoryName}" por ${formatCurrency(
                transactionPendingDelete.amount,
                profile?.currency ?? 'CLP',
              )}. Este cambio afectara tu historial y no se puede deshacer.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setTransactionPendingDelete(null)}
        onConfirm={confirmDeleteTransaction}
      />
    </div>
  );
}
