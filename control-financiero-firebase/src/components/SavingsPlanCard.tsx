import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { SavingsPlan } from '@/types/savings';

interface SavingsPlanCardProps {
  plan: SavingsPlan;
  currency?: 'CLP';
  onOpenDetails: (plan: SavingsPlan) => void;
  onEdit: (plan: SavingsPlan) => void;
  onDelete: (plan: SavingsPlan) => void;
}

export function SavingsPlanCard({
  plan,
  currency = 'CLP',
  onOpenDetails,
  onEdit,
  onDelete,
}: SavingsPlanCardProps) {
  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">Plan de ahorro</p>
          <h2 className="mt-2 text-xl font-bold text-ink">{plan.reason}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionIconButton tone="edit" aria-label={`Editar plan ${plan.reason}`} onClick={() => onEdit(plan)} />
          <ActionIconButton tone="delete" aria-label={`Eliminar plan ${plan.reason}`} onClick={() => onDelete(plan)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Monto mensual</p>
          <p className="mt-2 text-2xl font-extrabold text-ink">{formatCurrency(plan.monthlyTarget, currency)}</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Total ahorrado</p>
          <p className="mt-2 text-2xl font-extrabold text-accent">{formatCurrency(plan.savedAmount, currency)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ingresos registrados</p>
        <p className="mt-2 text-base font-semibold text-ink">{plan.entriesCount}</p>
      </div>

      <Button variant="secondary" fullWidth size="md" onClick={() => onOpenDetails(plan)}>
        Ver detalle
      </Button>
    </Card>
  );
}
