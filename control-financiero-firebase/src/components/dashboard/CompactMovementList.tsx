import { EditIcon, TrashIcon } from '@/components/ui/ActionIconButton';
import { CategoryGlyph, DEFAULT_CATEGORY_COLOR_BY_TYPE, DEFAULT_CATEGORY_ICON_BY_TYPE } from '@/lib/categoryAppearance';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

interface CompactMovementListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: 'CLP';
  showActions?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void | Promise<void>;
}

export function CompactMovementList({
  transactions,
  categories,
  currency,
  showActions = false,
  onEdit,
  onDelete,
}: CompactMovementListProps) {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1d2027] px-3 shadow-glow sm:px-5">
      <ul className="divide-y divide-white/10" aria-label={showActions ? 'Movimientos registrados' : 'Últimos movimientos del mes'}>
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId);
          const income = transaction.type === 'income';
          const color = category?.color ?? DEFAULT_CATEGORY_COLOR_BY_TYPE[transaction.type];
          const hasDescription = Boolean(transaction.description?.trim());
          const title = hasDescription ? transaction.description!.trim() : transaction.categoryName;

          return (
            <li key={transaction.id} className="flex min-w-0 items-start gap-3 py-3.5">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                style={{
                  color,
                  borderColor: color + '55',
                  backgroundColor: color + '1c',
                }}
              >
                <CategoryGlyph icon={category?.icon ?? DEFAULT_CATEGORY_ICON_BY_TYPE[transaction.type]} className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1 self-center">
                <p className="truncate text-sm font-bold text-ink" title={title}>{title}</p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {formatRelativeDate(transaction.transactionDate)}
                  {hasDescription ? ' · ' + transaction.categoryName : ''}
                </p>
              </div>

              <div className="min-w-0 shrink-0 self-center text-right">
                <p className={'text-sm font-extrabold tabular-nums sm:text-base ' +
                  (income ? 'text-emerald-300' : 'text-rose-300')}>
                  {income ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {income ? 'Ingreso' : 'Gasto'}
                </p>

                {showActions ? (
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(transaction)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={'Editar movimiento ' + transaction.categoryName}
                      title="Editar movimiento"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { void onDelete?.(transaction); }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-300/10 text-rose-300 transition hover:bg-rose-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                      aria-label={'Eliminar movimiento ' + transaction.categoryName}
                      title="Eliminar movimiento"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
