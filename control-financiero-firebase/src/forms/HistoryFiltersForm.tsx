import { useId, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Category } from '@/types/category';
import type { TransactionFilters } from '@/types/transaction';

interface HistoryFiltersFormProps {
  filters: TransactionFilters;
  categories: Category[];
  onChange: (filters: TransactionFilters) => void;
  onClear: () => void;
}

export function HistoryFiltersForm({ filters, categories, onChange, onClear }: HistoryFiltersFormProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const availableCategories =
    filters.type === 'all' ? categories : categories.filter((category) => category.type === filters.type);
  const extraFilterCount = Number(filters.type !== 'all') + Number(filters.categoryId !== 'all');
  const hasChanges = Boolean(filters.search.trim()) || extraFilterCount > 0 || filters.month === '';

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="history-search"
          label="Buscar"
          placeholder="Categoría, detalle o monto"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="h-11"
        />
        <Input
          id="history-month"
          label="Mes"
          type="month"
          value={filters.month}
          onChange={(event) => onChange({ ...filters, month: event.target.value })}
          className="h-11"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className={'inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
            (expanded || extraFilterCount ? 'bg-accent/15 text-accent' : 'bg-white/5 text-slate-200 hover:bg-white/10')}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={detailsId}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
          </svg>
          Tipo y categoría
          {extraFilterCount ? (
            <span className="rounded-full bg-accent/20 px-1.5 text-[11px] font-bold">{extraFilterCount}</span>
          ) : null}
          <span aria-hidden="true" className="text-xs">{expanded ? '▴' : '▾'}</span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {filters.month ? (
            <button
              type="button"
              className="min-h-11 text-xs font-semibold text-slate-300 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => onChange({ ...filters, month: '' })}
            >
              Todos los meses
            </button>
          ) : null}
          {hasChanges ? (
            <button
              type="button"
              className="min-h-11 text-xs font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => {
                onClear();
                setExpanded(false);
              }}
            >
              Restablecer
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div id={detailsId} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-2">
          <Select
            id="history-type"
            label="Tipo"
            value={filters.type}
            onChange={(event) => {
              const nextType = event.target.value as TransactionFilters['type'];
              const nextAvailableCategories =
                nextType === 'all'
                  ? categories
                  : categories.filter((category) => category.type === nextType);
              const nextCategoryId =
                nextType === 'all'
                  ? filters.categoryId
                  : nextAvailableCategories.some((category) => category.id === filters.categoryId)
                    ? filters.categoryId
                    : 'all';

              onChange({ ...filters, type: nextType, categoryId: nextCategoryId });
            }}
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </Select>

          <Select
            id="history-category"
            label="Categoría"
            value={filters.categoryId}
            onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
          >
            <option value="all">Todas</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        </div>
      ) : null}
    </div>
  );
}
