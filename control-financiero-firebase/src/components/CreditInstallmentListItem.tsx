import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CreditInstallment } from '@/types/credit';

interface CreditInstallmentListItemProps {
  installment: CreditInstallment;
  currency?: 'CLP';
  onEdit: (installment: CreditInstallment) => void;
  onDelete: (installment: CreditInstallment) => void;
}

export function CreditInstallmentListItem({
  installment,
  currency = 'CLP',
  onEdit,
  onDelete,
}: CreditInstallmentListItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.9">
            <path d="M6 12h12M12 6v12" strokeLinecap="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-ink">{formatCurrency(installment.amount, currency)}</p>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {formatDate(installment.paymentDate)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Cuota registrada</p>
          {installment.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-400">{installment.description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionIconButton
            tone="edit"
            aria-label="Editar cuota"
            onClick={() => onEdit(installment)}
          />
          <ActionIconButton
            tone="delete"
            aria-label="Eliminar cuota"
            onClick={() => onDelete(installment)}
          />
        </div>
      </div>
    </Card>
  );
}
