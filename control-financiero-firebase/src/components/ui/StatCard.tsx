import { Card } from './Card';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
  helper?: string;
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'text-ink',
  positive: 'text-emerald-300',
  negative: 'text-rose-300',
};

export function StatCard({ label, value, helper, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={cn('mt-3 text-2xl font-extrabold tracking-tight', TONE_STYLES[tone])}>{value}</p>
      {helper ? <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">{helper}</p> : null}
    </Card>
  );
}

