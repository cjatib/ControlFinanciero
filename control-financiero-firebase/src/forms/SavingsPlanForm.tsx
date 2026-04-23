import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateAmount, validateRequired } from '@/utils/validators';
import type { SavingsPlan, SavingsPlanPayload } from '@/types/savings';

interface SavingsPlanFormProps {
  initialValue?: SavingsPlan | null;
  onSubmit: (payload: SavingsPlanPayload) => Promise<void>;
  onCancel: () => void;
}

interface SavingsPlanFormState {
  reason: string;
  monthlyTarget: string;
}

export function SavingsPlanForm({ initialValue, onSubmit, onCancel }: SavingsPlanFormProps) {
  const [formState, setFormState] = useState<SavingsPlanFormState>({
    reason: initialValue?.reason ?? '',
    monthlyTarget: initialValue ? `${initialValue.monthlyTarget}` : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SavingsPlanFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState({
      reason: initialValue?.reason ?? '',
      monthlyTarget: initialValue ? `${initialValue.monthlyTarget}` : '',
    });
    setErrors({});
    setSubmitError(null);
  }, [initialValue]);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof SavingsPlanFormState, string>> = {};
    const reasonError = validateRequired(formState.reason, 'motivo');
    const amountError = validateAmount(Number(formState.monthlyTarget));

    if (reasonError) {
      nextErrors.reason = reasonError;
    }

    if (amountError) {
      nextErrors.monthlyTarget = amountError;
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
        reason: formState.reason,
        monthlyTarget: Number(formState.monthlyTarget),
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
        id="savings-reason"
        label="Motivo de ahorro"
        placeholder="Ej. Fondo emergencia, vacaciones, pie casa"
        value={formState.reason}
        error={errors.reason}
        onChange={(event) => setFormState((current) => ({ ...current, reason: event.target.value }))}
      />

      <Input
        id="savings-monthly-target"
        label="Monto mensual"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        placeholder="50000"
        value={formState.monthlyTarget}
        error={errors.monthlyTarget}
        onChange={(event) => setFormState((current) => ({ ...current, monthlyTarget: event.target.value }))}
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
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar plan' : 'Crear plan'}
        </Button>
      </div>
    </form>
  );
}
