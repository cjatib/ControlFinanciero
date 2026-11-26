import {
  forwardRef,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, ...props },
  ref,
) {
  return (
    <label className="flex min-w-0 w-full flex-col gap-1.5 text-sm text-slate-300" htmlFor={id}>
      {label ? <span className="font-semibold text-slate-200">{label}</span> : null}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-base text-ink placeholder:text-slate-500 outline-none transition focus:border-accent/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-accent/20',
          error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/10',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});
