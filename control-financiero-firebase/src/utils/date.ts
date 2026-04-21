import { toDate } from '@/lib/format';

export function toInputDateValue(value?: Date | string | { toDate: () => Date } | null): string {
  const date = toDate(value ?? null) ?? new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

