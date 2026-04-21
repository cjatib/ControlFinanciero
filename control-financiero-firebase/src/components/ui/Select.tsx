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
    <label className="flex w-full flex-col gap-2 text-sm text-slate-300" htmlFor={id}>
      {label ? <span className="font-medium text-slate-200">{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          'h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-ink outline-none transition focus:border-accent/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-accent/10',
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
