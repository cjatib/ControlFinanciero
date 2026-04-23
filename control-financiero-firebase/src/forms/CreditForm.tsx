import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toInputDateValue, parseDateInput } from '@/utils/date';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  validateAmount,
  validateInstallmentsCount,
  validateRequired,
} from '@/utils/validators';
import type { Credit, CreditPayload } from '@/types/credit';

interface CreditFormProps {
  initialValue?: Credit | null;
  onSubmit: (payload: CreditPayload) => Promise<void>;
  onCancel: () => void;
}

interface CreditFormState {
  name: string;
  description: string;
  totalAmount: string;
  totalInstallments: string;
  firstDueDate: string;
}

export function CreditForm({ initialValue, onSubmit, onCancel }: CreditFormProps) {
  const [formState, setFormState] = useState<CreditFormState>({
    name: initialValue?.name ?? '',
    description: initialValue?.description ?? '',
    totalAmount: initialValue ? `${initialValue.totalAmount}` : '',
    totalInstallments: initialValue ? `${initialValue.totalInstallments}` : '',
    firstDueDate: toInputDateValue(initialValue?.firstDueDate ?? null),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreditFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState({
      name: initialValue?.name ?? '',
      description: initialValue?.description ?? '',
      totalAmount: initialValue ? `${initialValue.totalAmount}` : '',
      totalInstallments: initialValue ? `${initialValue.totalInstallments}` : '',
      firstDueDate: toInputDateValue(initialValue?.firstDueDate ?? null),
    });
    setErrors({});
    setSubmitError(null);
  }, [initialValue]);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CreditFormState, string>> = {};
    const amount = Number(formState.totalAmount);
    const installments = Number(formState.totalInstallments);

    const nameError = validateRequired(formState.name, 'nombre');
    const amountError = validateAmount(amount);
    const installmentsError = validateInstallmentsCount(installments);

    if (nameError) {
      nextErrors.name = nameError;
    }

    if (amountError) {
      nextErrors.totalAmount = amountError;
    }

    if (installmentsError) {
      nextErrors.totalInstallments = installmentsError;
    }

    if (!formState.firstDueDate) {
      nextErrors.firstDueDate = 'Selecciona la fecha del primer vencimiento.';
    }

    if (initialValue && amount < initialValue.paidAmount) {
      nextErrors.totalAmount = 'El monto total no puede quedar por debajo de lo que ya fue abonado.';
    }

    if (initialValue && installments < initialValue.paidInstallments) {
      nextErrors.totalInstallments = 'No puedes dejar menos cuotas totales que las ya registradas.';
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
        name: formState.name,
        description: formState.description,
        totalAmount: Number(formState.totalAmount),
        totalInstallments: Number(formState.totalInstallments),
        firstDueDate: parseDateInput(formState.firstDueDate),
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
        id="credit-name"
        label="Nombre del credito"
        placeholder="Ej. Prestamo auto, avance, tarjeta"
        value={formState.name}
        error={errors.name}
        onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
      />

      <Input
        id="credit-total-amount"
        label="Monto total"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        placeholder="0"
        value={formState.totalAmount}
        error={errors.totalAmount}
        onChange={(event) => setFormState((current) => ({ ...current, totalAmount: event.target.value }))}
      />

      <Input
        id="credit-installments"
        label="Cantidad de cuotas"
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        placeholder="12"
        value={formState.totalInstallments}
        error={errors.totalInstallments}
        onChange={(event) =>
          setFormState((current) => ({ ...current, totalInstallments: event.target.value }))
        }
      />

      <Input
        id="credit-first-due-date"
        label="Primer vencimiento"
        type="date"
        value={formState.firstDueDate}
        error={errors.firstDueDate}
        onChange={(event) => setFormState((current) => ({ ...current, firstDueDate: event.target.value }))}
      />

      <Textarea
        id="credit-description"
        label="Descripcion"
        placeholder="Opcional. Agrega el banco, casa comercial o un detalle que te sirva para identificarlo."
        value={formState.description}
        onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
      />

      {initialValue ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Ya tienes {initialValue.paidInstallments} cuotas registradas por un total de ${' '}
          {initialValue.paidAmount.toLocaleString('es-CL')}. Puedes ampliar el credito si hace falta, pero no
          dejarlo por debajo de lo ya abonado.
        </p>
      ) : null}

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
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar credito' : 'Crear credito'}
        </Button>
      </div>
    </form>
  );
}
