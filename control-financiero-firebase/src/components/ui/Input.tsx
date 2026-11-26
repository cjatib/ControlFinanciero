import {
  forwardRef,
  type InputHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null | undefined;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, helperText, id, ...props },
  ref,
) {
  return (
    <label className="flex min-w-0 w-full flex-col gap-1.5 text-sm text-slate-300" htmlFor={id}>
      {label ? <span className="font-semibold text-slate-200">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-3.5 text-base text-ink placeholder:text-slate-500 outline-none transition focus:border-accent/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-accent/20',
          error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/10',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
      {!error && helperText ? <span className="text-xs text-slate-400">{helperText}</span> : null}
    </label>
  );
});
