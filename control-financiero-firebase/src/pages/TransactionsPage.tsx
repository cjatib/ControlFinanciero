import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TransactionListItem } from '@/components/TransactionListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
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
      <PageHeader
        eyebrow="Transacciones"
        title="Registra ingresos y gastos"
        description="Mantén tu flujo actualizado con transacciones editables, seguras y asociadas a tus categorias."
        action={<Button onClick={() => setModalOpen(true)}>Nueva transaccion</Button>}
      />

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionListItem
              key={transaction.id}
              transaction={transaction}
              currency={profile?.currency ?? 'CLP'}
              showActions
              onEdit={(currentTransaction) => {
                setSelectedTransaction(currentTransaction);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
        title={selectedTransaction ? 'Editar transaccion' : 'Nueva transaccion'}
        description="Guarda el monto, categoria y fecha para mantener tu balance al dia."
        onClose={closeModal}
      >
        <TransactionForm
          categories={categories}
          initialValue={selectedTransaction}
          onSubmit={handleCreateOrUpdate}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
