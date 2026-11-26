import { EditIcon, TrashIcon } from '@/components/ui/ActionIconButton';
import { formatCurrency } from '@/lib/format';
import type { SavingsPlan } from '@/types/savings';

interface SavingsPlanCardProps {
  plan: SavingsPlan;
  currency?: 'CLP';
  expanded: boolean;
  onToggleActions: () => void;
  onOpenDetails: (plan: SavingsPlan) => void;
  onEdit: (plan: SavingsPlan) => void;
  onDelete: (plan: SavingsPlan) => void;
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function SavingsPlanCard({
  plan, currency = 'CLP', expanded, onToggleActions, onOpenDetails, onEdit, onDelete,
}: SavingsPlanCardProps) {
  const panelId = 'savings-actions-' + plan.id;
  return (
    <li className="min-w-0 space-y-3 px-3 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/10 text-emerald-300"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 12a8 8 0 0 1 13.7-5.6M4 12v5h5M20 12a8 8 0 0 1-13.7 5.6M20 12V7h-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v8m-2.5-6.5h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4" strokeLinecap="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold leading-5 text-ink sm:text-base">{plan.reason}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {plan.entriesCount} {plan.entriesCount === 1 ? 'aporte registrado' : 'aportes registrados'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleActions}
          aria-label={'Opciones del plan ' + plan.reason}
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
            (expanded ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-white/10 hover:text-ink')}
          title="Editar o eliminar plan"
        >
          <MoreIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/[0.035] px-3 py-2.5">
        <div className="min-w-0 border-r border-white/10 pr-2">
          <p className="text-[11px] text-slate-400">Meta mensual</p>
          <p className="mt-1 break-words text-sm font-extrabold tabular-nums text-slate-100 sm:text-base">
            {formatCurrency(plan.monthlyTarget, currency)}
          </p>
        </div>
        <div className="min-w-0 pl-1">
          <p className="text-[11px] text-slate-400">Total acumulado</p>
          <p className="mt-1 break-words text-sm font-extrabold tabular-nums text-emerald-300 sm:text-base">
            {formatCurrency(plan.savedAmount, currency)}
          </p>
        </div>
      </div>

      {expanded ? (
        <div id={panelId} className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => onEdit(plan)}
            aria-label={'Editar plan ' + plan.reason}
          >
            <EditIcon className="h-4 w-4" /> Editar
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 text-xs font-semibold text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
            onClick={() => onDelete(plan)}
            aria-label={'Eliminar plan ' + plan.reason}
          >
            <TrashIcon className="h-4 w-4" /> Eliminar
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between rounded-xl px-2 text-left text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => onOpenDetails(plan)}
      >
        <span>Ver aportes y registrar ahorro</span>
        <span aria-hidden="true" className="text-base">›</span>
      </button>
    </li>
  );
}
