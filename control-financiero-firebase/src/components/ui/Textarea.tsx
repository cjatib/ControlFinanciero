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
    <label className="flex w-full flex-col gap-2 text-sm text-slate-300" htmlFor={id}>
      {label ? <span className="font-medium text-slate-200">{label}</span> : null}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-ink placeholder:text-slate-500 outline-none transition focus:border-accent/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-accent/10',
          error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/10',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});
