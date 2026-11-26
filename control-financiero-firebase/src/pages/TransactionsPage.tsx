import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CompactMovementList } from '@/components/dashboard/CompactMovementList';
import { Button } from '@/components/ui/Button';
import { FormActions } from '@/components/ui/FormActions';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { TransactionForm } from '@/forms/TransactionForm';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/services/transactions/transactionsService';
import type { Transaction, TransactionPayload } from '@/types/transaction';

export function TransactionsPage() {
  const { user, profile } = useAuth();
  const { categories } = useCategories();
  const { transactions, loading, error } = useTransactions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setSelectedTransaction(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  function closeModal() {
    setModalOpen(false);
    setSelectedTransaction(null);

    if (searchParams.get('create') === '1') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('create');
      setSearchParams(nextParams, { replace: true });
    }
  }

  async function handleCreateOrUpdate(payload: TransactionPayload) {
    if (!user) {
      return;
    }

    if (selectedTransaction) {
      await updateTransaction(user.uid, selectedTransaction.id, payload);
    } else {
      await createTransaction(user.uid, payload);
    }

    closeModal();
  }

  async function handleDelete(transaction: Transaction) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la transaccion de ${transaction.categoryName}?`);

    if (!confirmed) {
      return;
    }

    await deleteTransaction(user.uid, transaction.id);
  }

  if (loading) {
    return <Loader label="Cargando transacciones..." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Actividad financiera</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Movimientos</h1>
          <p className="mt-1 text-xs leading-5 text-slate-400">Consulta y gestiona tus ingresos y gastos.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedTransaction(null);
            setModalOpen(true);
          }}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-[#c9d4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Registrar nuevo movimiento"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo
        </button>
      </header>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {transactions.length > 0 ? (
        <CompactMovementList
          transactions={transactions}
          categories={categories}
          currency={profile?.currency ?? 'CLP'}
          showActions
          onEdit={(currentTransaction) => {
            setSelectedTransaction(currentTransaction);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      ) : (
        <EmptyState
          title="Aun no registras transacciones"
          description="Cuando crees categorias podrás registrar ingresos y gastos desde aqui."
          action={
            categories.length > 0 ? (
              <Button onClick={() => setModalOpen(true)}>Agregar transaccion</Button>
            ) : (
              <Link to="/categories">
                <Button variant="secondary">Crear categorias primero</Button>
              </Link>
            )
          }
        />
      )}

      <Modal
        open={modalOpen}
        title={selectedTransaction ? 'Editar movimiento' : 'Nuevo movimiento'}
        description="Registra el monto, la categoría y la fecha."
        onClose={closeModal}
        footer={
          <FormActions
            form="transaction-editor"
            submitLabel={selectedTransaction ? 'Guardar cambios' : 'Guardar movimiento'}
            submitting={submitting}
            disabled={categories.length === 0}
            onCancel={closeModal}
          />
        }
      >
        <TransactionForm
          categories={categories}
          initialValue={selectedTransaction}
          onSubmit={handleCreateOrUpdate}
          onCancel={closeModal}
          formId="transaction-editor"
          hideActions
          onSubmittingChange={setSubmitting}
        />
      </Modal>
    </div>
  );
}
