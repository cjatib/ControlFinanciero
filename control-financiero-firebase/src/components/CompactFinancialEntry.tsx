import { useId, useState } from 'react';
import { EditIcon, TrashIcon } from '@/components/ui/ActionIconButton';

interface CompactFinancialEntryProps {
  title: string;
  amount: string;
  date: string;
  description?: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

export function CompactFinancialEntry({
  title, amount, date, description, onEdit, onDelete,
}: CompactFinancialEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  return (
    <div className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold tabular-nums text-slate-100">{amount}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{date}{description ? ' · ' + description : ''}</p>
        </div>
        <button
          type="button"
          className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
            (expanded ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-white/10 hover:text-ink')}
          aria-label={'Opciones de ' + title}
          aria-expanded={expanded}
          aria-controls={expanded ? id : undefined}
          onClick={() => setExpanded((current) => !current)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
      </div>
      {expanded ? (
        <div id={id} className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-2">
          <button type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent"
            onClick={() => { setExpanded(false); onEdit(); }}
            aria-label={'Editar ' + title}
          >
            <EditIcon className="h-4 w-4" /> Editar
          </button>
          <button type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 text-xs font-semibold text-rose-200"
            onClick={() => { setExpanded(false); onDelete(); }}
            aria-label={'Eliminar ' + title}
          >
            <TrashIcon className="h-4 w-4" /> Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}
