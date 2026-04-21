import { useState } from 'react';
import { TransactionListItem } from '@/components/TransactionListItem';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
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
      <PageHeader
        eyebrow="Historico"
        title="Explora tus movimientos"
        description="Busca todos tus ingresos y gastos, filtrando por tipo, categoria, texto y mes."
      />

      <Card className="p-5">
        <HistoryFiltersForm
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onClear={() => setFilters(INITIAL_FILTERS)}
        />
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-400">Ingresos del mes</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {formatCurrency(filteredSummary.totalIncome, profile?.currency ?? 'CLP')}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Gastos del mes</p>
          <p className="mt-2 text-2xl font-bold text-rose-300">
            {formatCurrency(filteredSummary.totalExpense, profile?.currency ?? 'CLP')}
          </p>
        </div>
      </Card>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <TransactionListItem
              key={transaction.id}
              transaction={transaction}
              currency={profile?.currency ?? 'CLP'}
              showActions
              onEdit={(currentTransaction) => {
                setSelectedTransaction(currentTransaction);
                setModalOpen(true);
              }}
              onDelete={(currentTransaction) => setTransactionPendingDelete(currentTransaction)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No encontramos movimientos"
          description="Prueba cambiando el mes, el tipo, la categoria o el texto buscado."
        />
      )}

      <Modal
        open={modalOpen}
        title="Editar transaccion"
        description="Actualiza el monto, categoria o fecha del movimiento seleccionado."
        onClose={closeModal}
      >
        <TransactionForm
          categories={categories}
          initialValue={selectedTransaction}
          onSubmit={handleCreateOrUpdate}
          onCancel={closeModal}
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
