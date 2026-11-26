import { useId, useState, type ReactNode } from 'react';

interface OptionalDetailsProps {
  label?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Preserve optional text even if the section is collapsed; never reset the input. */
export function OptionalDetails({
  label = 'Agregar nota (opcional)', defaultOpen = false, children,
}: OptionalDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          className={'h-4 w-4 shrink-0 transition-transform ' + (open ? 'rotate-180' : '')} aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? <div id={panelId} className="border-t border-white/10 px-3 py-3">{children}</div> : null}
    </section>
  );
}
