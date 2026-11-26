import { EditIcon, TrashIcon } from '@/components/ui/ActionIconButton';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  getCreditProgress, getCreditStatus, getNextCreditDueDate,
  getRemainingCreditAmount, getRemainingCreditInstallments,
} from '@/types/credit';
import type { Credit } from '@/types/credit';

interface CreditCardProps {
  credit: Credit;
  currency?: 'CLP';
  expanded: boolean;
  onToggleActions: () => void;
  onOpenDetails: (credit: Credit) => void;
  onEdit: (credit: Credit) => void;
  onDelete: (credit: Credit) => void;
}

const STATUS_STYLES = {
  active: 'bg-accent/10 text-accent',
  overdue: 'bg-rose-300/15 text-rose-200',
  paid: 'bg-emerald-300/10 text-emerald-300',
} as const;

const STATUS_LABELS = { active: 'Al día', overdue: 'Vencido', paid: 'Pagado' } as const;

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function CreditCard({
  credit, currency = 'CLP', expanded, onToggleActions, onOpenDetails, onEdit, onDelete,
}: CreditCardProps) {
  const remainingAmount = getRemainingCreditAmount(credit);
  const remainingInstallments = getRemainingCreditInstallments(credit);
  const progress = getCreditProgress(credit);
  const status = getCreditStatus(credit);
  const nextDueDate = getNextCreditDueDate(credit);
  const panelId = 'credit-actions-' + credit.id;

  return (
    <li className="min-w-0 space-y-3 px-3 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M4 10h16M8 15h4" strokeLinecap="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold leading-5 text-ink sm:text-base">{credit.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={'rounded-full px-2 py-0.5 text-[11px] font-semibold ' + STATUS_STYLES[status]}>
              {STATUS_LABELS[status]}
            </span>
            <span className="text-[11px] text-slate-400">
              {credit.paidInstallments} de {credit.totalInstallments} cuotas
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleActions}
          aria-label={'Opciones del crédito ' + credit.name}
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
            (expanded ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-white/10 hover:text-ink')}
          title="Editar o eliminar crédito"
        >
          <MoreIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/[0.035] px-3 py-2.5">
        <div className="min-w-0 border-r border-white/10 pr-2">
          <p className="text-[11px] text-slate-400">Saldo pendiente</p>
          <p className="mt-1 break-words text-sm font-extrabold tabular-nums text-rose-300 sm:text-base">
            {formatCurrency(remainingAmount, currency)}
          </p>
        </div>
        <div className="min-w-0 pl-1">
          <p className="text-[11px] text-slate-400">Total abonado</p>
          <p className="mt-1 break-words text-sm font-extrabold tabular-nums text-emerald-300 sm:text-base">
            {formatCurrency(credit.paidAmount, currency)}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
          <span>Avance: {Math.round(progress)}%</span>
          <span>{nextDueDate ? 'Próximo vencimiento: ' + formatDate(nextDueDate) : 'Crédito saldado'}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar"
          aria-label={'Avance del crédito ' + credit.name}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className={'h-full rounded-full ' + (status === 'overdue' ? 'bg-rose-300' : 'bg-accent')}
            style={{ width: progress + '%' }} />
        </div>
      </div>

      {expanded ? (
        <div id={panelId} className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-2">
          <button
            type="button" onClick={() => onEdit(credit)}
            aria-label={'Editar crédito ' + credit.name}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <EditIcon className="h-4 w-4" /> Editar
          </button>
          <button
            type="button" onClick={() => onDelete(credit)}
            aria-label={'Eliminar crédito ' + credit.name}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 text-xs font-semibold text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
          >
            <TrashIcon className="h-4 w-4" /> Eliminar
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between rounded-xl px-2 text-left text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => onOpenDetails(credit)}
      >
        <span>Ver cuotas y registrar pago</span>
        <span aria-hidden="true" className="text-base">›</span>
      </button>
    </li>
  );
}
