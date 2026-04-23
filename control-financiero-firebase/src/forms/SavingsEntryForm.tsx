import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { toInputDateValue, parseDateInput } from '@/utils/date';
import { validateAmount } from '@/utils/validators';
import type { SavingsEntry, SavingsEntryPayload } from '@/types/savings';

interface SavingsEntryFormProps {
  initialValue?: SavingsEntry | null;
  onSubmit: (payload: SavingsEntryPayload) => Promise<void>;
  onCancel: () => void;
}

interface SavingsEntryFormState {
  amount: string;
  entryDate: string;
  description: string;
}

export function SavingsEntryForm({ initialValue, onSubmit, onCancel }: SavingsEntryFormProps) {
  const [formState, setFormState] = useState<SavingsEntryFormState>({
    amount: initialValue ? `${initialValue.amount}` : '',
    entryDate: toInputDateValue(initialValue?.entryDate ?? null),
    description: initialValue?.description ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SavingsEntryFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState({
      amount: initialValue ? `${initialValue.amount}` : '',
      entryDate: toInputDateValue(initialValue?.entryDate ?? null),
      description: initialValue?.description ?? '',
    });
    setErrors({});
    setSubmitError(null);
  }, [initialValue]);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof SavingsEntryFormState, string>> = {};
    const amountError = validateAmount(Number(formState.amount));

    if (amountError) {
      nextErrors.amount = amountError;
    }

    if (!formState.entryDate) {
      nextErrors.entryDate = 'Selecciona la fecha del ingreso.';
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

    try {
      setSubmitting(true);
      await onSubmit({
        amount: Number(formState.amount),
        entryDate: parseDateInput(formState.entryDate),
        description: formState.description,
      });
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input
        id="savings-entry-amount"
        label="Monto ingresado"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        placeholder="0"
        value={formState.amount}
        error={errors.amount}
        onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
      />

      <Input
        id="savings-entry-date"
        label="Fecha de ingreso"
        type="date"
        value={formState.entryDate}
        error={errors.entryDate}
        onChange={(event) => setFormState((current) => ({ ...current, entryDate: event.target.value }))}
      />

      <Textarea
        id="savings-entry-description"
        label="Nota"
        placeholder="Opcional. Ej. transferencia, efectivo, ahorro extra."
        value={formState.description}
        onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
      />

      {submitError ? (
        <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" fullWidth size="lg" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button fullWidth size="lg" type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar ingreso' : 'Registrar ahorro'}
        </Button>
      </div>
    </form>
  );
}
