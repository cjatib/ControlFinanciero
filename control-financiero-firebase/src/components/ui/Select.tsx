import {
  forwardRef,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null | undefined;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  return (
    <label className="flex min-w-0 w-full flex-col gap-1.5 text-sm text-slate-300" htmlFor={id}>
      {label ? <span className="font-semibold text-slate-200">{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          'h-11 min-w-0 rounded-xl border border-white/10 bg-[#252936] px-3.5 text-base text-ink outline-none transition focus:border-accent/60 focus:bg-[#303645] focus:ring-2 focus:ring-accent/20',
          error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});
