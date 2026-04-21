import { Button } from '@/components/ui/Button';
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
  const availableCategories =
    filters.type === 'all' ? categories : categories.filter((category) => category.type === filters.type);

  return (
    <div className="grid gap-4">
      <Input
        id="history-search"
        label="Buscar"
        placeholder="Categoria, descripcion o monto"
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
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

            onChange({
              ...filters,
              type: nextType,
              categoryId: nextCategoryId,
            });
          }}
        >
          <option value="all">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </Select>

        <Select
          id="history-category"
          label="Categoria"
          value={filters.categoryId}
          onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
        >
          <option value="all">Todas</option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="history-month"
          label="Mes"
          type="month"
          value={filters.month}
          onChange={(event) => onChange({ ...filters, month: event.target.value })}
        />
        <div className="flex items-end">
          <Button variant="ghost" className="w-full" onClick={onClear}>
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
