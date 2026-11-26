import { CompactFinancialEntry } from '@/components/CompactFinancialEntry';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CreditInstallment } from '@/types/credit';

interface CreditInstallmentListItemProps {
  installment: CreditInstallment;
  currency?: 'CLP';
  onEdit: (installment: CreditInstallment) => void;
  onDelete: (installment: CreditInstallment) => void;
}

export function CreditInstallmentListItem({
  installment, currency = 'CLP', onEdit, onDelete,
}: CreditInstallmentListItemProps) {
  return (
    <CompactFinancialEntry
      title="cuota"
      amount={formatCurrency(installment.amount, currency)}
      date={formatDate(installment.paymentDate)}
      description={installment.description}
      onEdit={() => onEdit(installment)}
      onDelete={() => onDelete(installment)}
    />
  );
}
