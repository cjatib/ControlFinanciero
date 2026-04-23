import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatCurrency } from '@/lib/format';
import { toInputDateValue, parseDateInput } from '@/utils/date';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateAmount } from '@/utils/validators';
import type { CreditInstallment, CreditInstallmentPayload } from '@/types/credit';

interface CreditInstallmentFormProps {
  initialValue?: CreditInstallment | null;
  remainingAmount: number;
  remainingInstallments: number;
  currency?: 'CLP';
  onSubmit: (payload: CreditInstallmentPayload) => Promise<void>;
  onCancel: () => void;
}

interface CreditInstallmentFormState {
  amount: string;
  paymentDate: string;
  description: string;
}

export function CreditInstallmentForm({
  initialValue,
  remainingAmount,
  remainingInstallments,
  currency = 'CLP',
  onSubmit,
  onCancel,
}: CreditInstallmentFormProps) {
  const [formState, setFormState] = useState<CreditInstallmentFormState>({
    amount: initialValue ? `${initialValue.amount}` : '',
    paymentDate: toInputDateValue(initialValue?.paymentDate ?? null),
    description: initialValue?.description ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreditInstallmentFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState({
      amount: initialValue ? `${initialValue.amount}` : '',
      paymentDate: toInputDateValue(initialValue?.paymentDate ?? null),
      description: initialValue?.description ?? '',
    });
    setErrors({});
    setSubmitError(null);
  }, [initialValue]);

  const maxAmount = remainingAmount + (initialValue?.amount ?? 0);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CreditInstallmentFormState, string>> = {};
    const amount = Number(formState.amount);
    const amountError = validateAmount(amount);

    if (amountError) {
      nextErrors.amount = amountError;
    } else if (amount > maxAmount) {
      nextErrors.amount = 'La cuota no puede superar el saldo pendiente del credito.';
    }

    if (!formState.paymentDate) {
      nextErrors.paymentDate = 'Selecciona la fecha en que ingresaste la cuota.';
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
        paymentDate: parseDateInput(formState.paymentDate),
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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Resumen actual</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-400">Saldo pendiente</p>
            <p className="mt-1 text-lg font-bold text-ink">{formatCurrency(remainingAmount, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Cuotas restantes</p>
            <p className="mt-1 text-lg font-bold text-ink">{remainingInstallments}</p>
          </div>
        </div>
      </div>

      <Input
        id="credit-installment-amount"
        label="Monto de la cuota"
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
        id="credit-installment-date"
        label="Fecha de ingreso"
        type="date"
        value={formState.paymentDate}
        error={errors.paymentDate}
        onChange={(event) => setFormState((current) => ({ ...current, paymentDate: event.target.value }))}
      />

      <Textarea
        id="credit-installment-description"
        label="Nota"
        placeholder="Opcional. Ej. abono extra, pago desde cuenta sueldo, refinanciamiento."
        value={formState.description}
        onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
      />

      {!initialValue && remainingInstallments <= 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Este credito ya no tiene cuotas pendientes. Si necesitas ajustar algo, edita o elimina una cuota ya
          registrada.
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
        <Button
          fullWidth
          size="lg"
          type="submit"
          disabled={submitting || (!initialValue && remainingInstallments <= 0)}
        >
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar cuota' : 'Registrar cuota'}
        </Button>
      </div>
    </form>
  );
}
