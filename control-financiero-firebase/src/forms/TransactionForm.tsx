import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { toInputDateValue, parseDateInput } from '@/utils/date';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateAmount } from '@/utils/validators';
import type { Category } from '@/types/category';
import type { Transaction, TransactionPayload } from '@/types/transaction';

interface TransactionFormProps {
  categories: Category[];
  initialValue?: Transaction | null;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
  onCancel: () => void;
}

interface TransactionState {
  type: TransactionPayload['type'];
  amount: string;
  categoryId: string;
  description: string;
  transactionDate: string;
}

export function TransactionForm({ categories, initialValue, onSubmit, onCancel }: TransactionFormProps) {
  const [formState, setFormState] = useState<TransactionState>({
    type: initialValue?.type ?? 'expense',
    amount: initialValue ? `${initialValue.amount}` : '',
    categoryId: initialValue?.categoryId ?? '',
    description: initialValue?.description ?? '',
    transactionDate: toInputDateValue(initialValue?.transactionDate ?? null),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((category) => category.type === formState.type);

  useEffect(() => {
    const selectedCategory = filteredCategories.find((category) => category.id === formState.categoryId);

    if (!selectedCategory) {
      setFormState((current) => ({
        ...current,
        categoryId: filteredCategories[0]?.id ?? '',
      }));
    }
  }, [filteredCategories, formState.categoryId]);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof TransactionState, string>> = {};
    const amount = Number(formState.amount);
    const amountError = validateAmount(amount);

    if (amountError) {
      nextErrors.amount = amountError;
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = 'Selecciona una categoria.';
    }

    if (!formState.transactionDate) {
      nextErrors.transactionDate = 'Selecciona una fecha.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const selectedCategory = categories.find((category) => category.id === formState.categoryId);

    if (!selectedCategory) {
      setSubmitError('La categoria elegida ya no esta disponible.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        type: formState.type,
        amount: Number(formState.amount),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        description: formState.description,
        transactionDate: parseDateInput(formState.transactionDate),
      });
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Select
        id="transaction-type"
        label="Tipo"
        value={formState.type}
        onChange={(event) =>
          setFormState((current) => ({
            ...current,
            type: event.target.value as TransactionPayload['type'],
          }))
        }
      >
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
      </Select>

      <Input
        id="transaction-amount"
        label="Monto"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        placeholder="0"
        value={formState.amount}
        error={errors.amount}
        onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
      />

      <Select
        id="transaction-category"
        label="Categoria"
        value={formState.categoryId}
        error={errors.categoryId}
        disabled={filteredCategories.length === 0}
        onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
      >
        {filteredCategories.length === 0 ? <option value="">No hay categorias disponibles</option> : null}
        {filteredCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <Input
        id="transaction-date"
        label="Fecha del movimiento"
        type="date"
        value={formState.transactionDate}
        error={errors.transactionDate}
        onChange={(event) => setFormState((current) => ({ ...current, transactionDate: event.target.value }))}
      />

      <Textarea
        id="transaction-description"
        label="Descripcion"
        placeholder="Opcional. Agrega un detalle que te ayude a recordarlo."
        value={formState.description}
        onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
      />

      {submitError ? <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">{submitError}</p> : null}

      {filteredCategories.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Crea primero una categoria de tipo {formState.type === 'income' ? 'ingreso' : 'gasto'} para guardar esta transaccion.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" fullWidth size="lg" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button fullWidth size="lg" type="submit" disabled={submitting || filteredCategories.length === 0}>
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar transaccion' : 'Crear transaccion'}
        </Button>
      </div>
    </form>
  );
}
