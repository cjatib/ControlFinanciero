import {
  forwardRef,
  type ButtonHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-slate-950 shadow-[0_12px_30px_rgba(53,217,165,0.3)] hover:bg-[#69e8be] focus-visible:ring-accent/40',
  secondary: 'bg-white/8 text-ink hover:bg-white/12 focus-visible:ring-white/10',
  ghost: 'bg-transparent text-ink hover:bg-white/6 focus-visible:ring-white/10',
  danger: 'bg-danger/20 text-rose-100 hover:bg-danger/30 focus-visible:ring-danger/30',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
});

