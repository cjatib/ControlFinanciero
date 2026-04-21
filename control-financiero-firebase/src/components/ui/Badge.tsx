import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps {
  children: ReactNode;
  tone?: 'income' | 'expense' | 'neutral';
}

const TONE_STYLES: Record<NonNullable<BadgeProps['tone']>, string> = {
  income: 'bg-emerald-500/15 text-emerald-200',
  expense: 'bg-rose-500/15 text-rose-200',
  neutral: 'bg-white/8 text-slate-300',
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]', TONE_STYLES[tone])}>
      {children}
    </span>
  );
}
