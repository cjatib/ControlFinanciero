import { useEffect, useState, type FormEvent } from 'react';
import { FormActions } from '@/components/ui/FormActions';
import { OptionalDetails } from '@/components/ui/OptionalDetails';
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
  formId?: string;
  hideActions?: boolean;
  onSubmittingChange?: (value: boolean) => void;
}

interface TransactionState {
  type: TransactionPayload['type'];
  amount: string;
  categoryId: string;
  description: string;
  transactionDate: string;
}

export function TransactionForm({ categories, initialValue, onSubmit, onCancel, formId, hideActions = false, onSubmittingChange }: TransactionFormProps) {
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

  // Keep the selected value while the category is valid. The filtered list
  // is recreated on each render, so it must not be an effect dependency:
  // otherwise resetting an already-empty selection causes a render loop.
  useEffect(() => {
    // Categories may still be loading when an existing transaction is opened.
    if (!formState.categoryId || categories.length === 0) return;
    const stillAvailable = categories.some(
      (category) => category.id === formState.categoryId && category.type === formState.type,
    );
    if (!stillAvailable) {
      setFormState((current) =>
        current.categoryId === formState.categoryId ? { ...current, categoryId: '' } : current,
      );
    }
  }, [categories, formState.categoryId, formState.type]);

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
    if (submitting) return;
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const selectedCategory = categories.find((category) => category.id === formState.categoryId && category.type === formState.type);

    if (!selectedCategory) {
      setSubmitError('La categoria elegida ya no esta disponible.');
      return;
    }

    try {
      setSubmitting(true);
      onSubmittingChange?.(true);
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
      onSubmittingChange?.(false);
    }
  }

  return (
    <form id={formId} className="space-y-3.5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de movimiento">
        {(['expense', 'income'] as const).map((type) => (
          <button key={type} type="button" aria-pressed={formState.type === type}
            onClick={() => setFormState((current) => ({ ...current, type, categoryId: '' }))}
            className={'min-h-11 rounded-xl border text-sm font-semibold transition ' +
              (formState.type === type ? 'border-accent bg-accent text-slate-950' : 'border-white/10 bg-white/5 text-slate-200')}>
            {type === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>

      <Input
        id="transaction-amount"
        label="Monto (CLP)"
        className="font-semibold tabular-nums"
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
        label="Categoría"
        value={formState.categoryId}
        error={errors.categoryId}
        disabled={filteredCategories.length === 0}
        onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
      >
        <option value="" disabled>{filteredCategories.length === 0 ? "No hay categorías disponibles" : "Selecciona una categoría"}</option>
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

      <OptionalDetails defaultOpen={Boolean(initialValue?.description?.trim())} label="Agregar descripción (opcional)">
        <Textarea
          id="transaction-description"
          label="Descripción"
          rows={2}
          placeholder="Ej. Compra del supermercado"
          value={formState.description}
          onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
        />
      </OptionalDetails>

      {submitError ? <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">{submitError}</p> : null}

      {filteredCategories.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Crea primero una categoria de tipo {formState.type === 'income' ? 'ingreso' : 'gasto'} para guardar esta transaccion.
        </p>
      ) : null}

      {!hideActions ? (
        <FormActions
          submitLabel={initialValue ? 'Guardar cambios' : 'Guardar movimiento'}
          submitting={submitting}
          disabled={filteredCategories.length === 0}
          onCancel={onCancel}
        />
      ) : null}
    </form>
  );
}
