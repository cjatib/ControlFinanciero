import { CompactFinancialEntry } from '@/components/CompactFinancialEntry';
import { formatCurrency, formatDate } from '@/lib/format';
import type { SavingsEntry } from '@/types/savings';

interface SavingsEntryListItemProps {
  entry: SavingsEntry;
  currency?: 'CLP';
  onEdit: (entry: SavingsEntry) => void;
  onDelete: (entry: SavingsEntry) => void;
}

export function SavingsEntryListItem({ entry, currency = 'CLP', onEdit, onDelete }: SavingsEntryListItemProps) {
  return (
    <CompactFinancialEntry
      title="aporte de ahorro"
      amount={formatCurrency(entry.amount, currency)}
      date={formatDate(entry.entryDate)}
      description={entry.description}
      onEdit={() => onEdit(entry)}
      onDelete={() => onDelete(entry)}
    />
  );
}
