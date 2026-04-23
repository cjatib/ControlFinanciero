import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  getCreditProgress,
  getCreditStatus,
  getNextCreditDueDate,
  getRemainingCreditAmount,
  getRemainingCreditInstallments,
} from '@/types/credit';
import type { Credit } from '@/types/credit';

interface CreditCardProps {
  credit: Credit;
  currency?: 'CLP';
  onOpenDetails: (credit: Credit) => void;
  onEdit: (credit: Credit) => void;
  onDelete: (credit: Credit) => void;
}

const STATUS_STYLES = {
  active: 'bg-accent/15 text-accent',
  overdue: 'bg-danger/20 text-rose-200',
  paid: 'bg-white/10 text-slate-200',
} as const;

const STATUS_LABELS = {
  active: 'Activo',
  overdue: 'Vencido',
  paid: 'Pagado',
} as const;

export function CreditCard({
  credit,
  currency = 'CLP',
  onOpenDetails,
  onEdit,
  onDelete,
}: CreditCardProps) {
  const remainingAmount = getRemainingCreditAmount(credit);
  const remainingInstallments = getRemainingCreditInstallments(credit);
  const progress = getCreditProgress(credit);
  const status = getCreditStatus(credit);
  const nextDueDate = getNextCreditDueDate(credit);

  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{credit.name}</h2>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                STATUS_STYLES[status],
              )}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          {credit.description ? <p className="mt-2 text-sm leading-6 text-slate-400">{credit.description}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionIconButton tone="edit" aria-label={`Editar credito ${credit.name}`} onClick={() => onEdit(credit)} />
          <ActionIconButton tone="delete" aria-label={`Eliminar credito ${credit.name}`} onClick={() => onDelete(credit)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Saldo pendiente</p>
          <p className="mt-2 text-2xl font-extrabold text-ink">{formatCurrency(remainingAmount, currency)}</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Abonado</p>
          <p className="mt-2 text-2xl font-extrabold text-accent">{formatCurrency(credit.paidAmount, currency)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monto total</p>
          <p className="mt-2 text-base font-semibold text-ink">{formatCurrency(credit.totalAmount, currency)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cuotas restantes</p>
          <p className="mt-2 text-base font-semibold text-ink">
            {remainingInstallments} de {credit.totalInstallments}
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Proximo vencimiento</p>
          <p className="mt-2 text-base font-semibold text-ink">{nextDueDate ? formatDate(nextDueDate) : 'Credito saldado'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>Avance del credito</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className={cn(
              'h-full rounded-full transition-[width]',
              status === 'paid' ? 'bg-white/70' : status === 'overdue' ? 'bg-rose-300' : 'bg-accent',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button variant="secondary" fullWidth size="md" onClick={() => onOpenDetails(credit)}>
        Ver cuotas
      </Button>
    </Card>
  );
}
