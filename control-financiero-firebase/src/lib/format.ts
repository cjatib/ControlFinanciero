type DateLike =
  | Date
  | string
  | null
  | undefined
  | {
      toDate: () => Date;
    };

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function';
}

export function toDate(value: DateLike): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (isTimestampLike(value)) {
    return value.toDate();
  }

  return null;
}

export function formatCurrency(amount: number, currency: 'CLP' = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: DateLike): string {
  const parsed = toDate(value);

  if (!parsed) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatRelativeDate(value: DateLike): string {
  const parsed = toDate(value);

  if (!parsed) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
  }).format(parsed);
}

