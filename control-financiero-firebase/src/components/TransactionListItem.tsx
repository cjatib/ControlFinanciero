import { Badge } from '@/components/ui/Badge';
import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import type { Transaction } from '@/types/transaction';

interface TransactionListItemProps {
  transaction: Transaction;
  currency?: 'CLP';
  showActions?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export function TransactionListItem({
  transaction,
  currency = 'CLP',
  showActions = false,
  onEdit,
  onDelete,
}: TransactionListItemProps) {
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={transaction.type === 'income' ? 'income' : 'expense'}>
              {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
            </Badge>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {formatRelativeDate(transaction.transactionDate)}
            </span>
          </div>
          <p className="mt-3 truncate text-base font-semibold text-ink">{transaction.categoryName}</p>
          <p className="mt-1 text-sm text-slate-400">
            {transaction.description?.trim() ? transaction.description : 'Sin descripcion'}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={transaction.type === 'income' ? 'text-lg font-bold text-emerald-300' : 'text-lg font-bold text-rose-300'}>
            {amountPrefix}
            {formatCurrency(transaction.amount, currency)}
          </p>
          {showActions ? (
            <div className="mt-3 flex items-center justify-end gap-2">
              <ActionIconButton
                tone="edit"
                aria-label={`Editar movimiento ${transaction.categoryName}`}
                onClick={() => onEdit?.(transaction)}
              />
              <ActionIconButton
                tone="delete"
                aria-label={`Eliminar movimiento ${transaction.categoryName}`}
                onClick={() => onDelete?.(transaction)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
