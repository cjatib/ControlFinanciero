import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/format';
import type { SavingsEntry } from '@/types/savings';

interface SavingsEntryListItemProps {
  entry: SavingsEntry;
  currency?: 'CLP';
  onEdit: (entry: SavingsEntry) => void;
  onDelete: (entry: SavingsEntry) => void;
}

export function SavingsEntryListItem({
  entry,
  currency = 'CLP',
  onEdit,
  onDelete,
}: SavingsEntryListItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.9">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-ink">{formatCurrency(entry.amount, currency)}</p>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{formatDate(entry.entryDate)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Ingreso de ahorro</p>
          {entry.description ? <p className="mt-2 text-sm leading-6 text-slate-400">{entry.description}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionIconButton tone="edit" aria-label="Editar ingreso de ahorro" onClick={() => onEdit(entry)} />
          <ActionIconButton tone="delete" aria-label="Eliminar ingreso de ahorro" onClick={() => onDelete(entry)} />
        </div>
      </div>
    </Card>
  );
}
