import { useId, useState } from 'react';
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

function OptionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

/** Shared, compact presentation for dashboard and editable transaction history. */
export function CompactMovementList({
  transactions,
  categories,
  currency,
  showActions = false,
  onEdit,
  onDelete,
}: CompactMovementListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const idPrefix = useId();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1d2027] px-3 shadow-glow sm:px-5">
      <ul className="divide-y divide-white/10" aria-label={showActions ? 'Movimientos registrados' : 'Últimos movimientos del mes'}>
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId);
          const income = transaction.type === 'income';
          const color = category?.color ?? DEFAULT_CATEGORY_COLOR_BY_TYPE[transaction.type];
          const description = transaction.description?.trim() ?? '';
          const title = description || transaction.categoryName;
          const expanded = showActions && expandedId === transaction.id;
          const actionPanelId = idPrefix + '-actions-' + transaction.id;

          return (
            <li key={transaction.id} className="min-w-0 py-3 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border sm:h-11 sm:w-11"
                  style={{
                    color,
                    borderColor: color + '55',
                    backgroundColor: color + '1c',
                  }}
                >
                  <CategoryGlyph
                    icon={category?.icon ?? DEFAULT_CATEGORY_ICON_BY_TYPE[transaction.type]}
                    className="h-5 w-5"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink sm:text-[15px]" title={title}>{title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {formatRelativeDate(transaction.transactionDate)}
                    {description ? ' · ' + transaction.categoryName : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <div className="text-right">
                    <p className={'whitespace-nowrap text-sm font-extrabold tabular-nums sm:text-base ' +
                      (income ? 'text-emerald-300' : 'text-rose-300')}>
                      {income ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {income ? 'Ingreso' : 'Gasto'}
                    </p>
                  </div>

                  {showActions ? (
                    <button
                      type="button"
                      className={'flex h-11 w-9 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                        (expanded ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-white/10 hover:text-ink')}
                      onClick={() => setExpandedId(expanded ? null : transaction.id)}
                      aria-label={'Opciones del movimiento ' + title}
                      aria-expanded={expanded}
                      aria-controls={actionPanelId}
                      title="Editar o eliminar"
                    >
                      <OptionsIcon />
                    </button>
                  ) : null}
                </div>
              </div>

              {expanded ? (
                <div id={actionPanelId} className="mt-2 flex flex-wrap justify-end gap-2 border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedId(null);
                      onEdit?.(transaction);
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <EditIcon className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedId(null);
                      void onDelete?.(transaction);
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 text-xs font-semibold text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
