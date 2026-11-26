import { Button } from './Button';

interface FormActionsProps {
  submitLabel: string;
  submitting: boolean;
  disabled?: boolean;
  onCancel: () => void;
  form?: string;
}

export function FormActions({
  submitLabel, submitting, disabled = false, onCancel, form,
}: FormActionsProps) {
  return (
    <div className="space-y-1 pt-1">
      <Button
        form={form}
        type="submit"
        fullWidth
        size="md"
        className="h-12 rounded-xl shadow-none"
        disabled={submitting || disabled}
      >
        {submitting ? 'Guardando…' : submitLabel}
      </Button>
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancelar
      </button>
    </div>
  );
}
