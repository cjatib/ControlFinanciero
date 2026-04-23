import { Link } from 'react-router-dom';
import { TransactionListItem } from '@/components/TransactionListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import {
  calculateSummary,
  filterTransactionsByMonth,
  getCurrentMonthValue,
} from '@/services/summary/summaryService';

export function DashboardPage() {
  const { profile } = useAuth();
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return <Loader label="Cargando tu dashboard..." />;
  }

  const currentMonth = getCurrentMonthValue();
  const currentMonthLabel = new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const currentMonthTransactions = filterTransactionsByMonth(transactions, currentMonth);
  const summary = calculateSummary(currentMonthTransactions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Tu balance del mes"
        description={`Aqui solo ves ingresos, gastos y movimientos de ${currentMonthLabel}.`}
      />

      <Card className="overflow-hidden p-6">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Saldo disponible</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
              {formatCurrency(summary.balance, profile?.currency ?? 'CLP')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Ingresos"
              value={formatCurrency(summary.totalIncome, profile?.currency ?? 'CLP')}
              tone="positive"
            />
            <StatCard
              label="Gastos"
              value={formatCurrency(summary.totalExpense, profile?.currency ?? 'CLP')}
              tone="negative"
            />
            <StatCard
              label="Movimientos"
              value={`${currentMonthTransactions.length}`}
              helper="Mes actual"
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Herramientas</h2>
            <p className="mt-1 text-sm text-slate-400">Accede rapido a creditos y planes de ahorro.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link to="/credits">
            <Button variant="secondary" fullWidth size="lg">
              Ver creditos
            </Button>
          </Link>
          <Link to="/savings">
            <Button variant="secondary" fullWidth size="lg">
              Ver ahorros
            </Button>
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Movimientos del mes</h2>
          <Link to="/history" className="text-sm font-semibold text-accent">
            Ver historico
          </Link>
        </div>

        {error ? (
          <Card className="p-5 text-sm text-rose-200">{error}</Card>
        ) : summary.recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {summary.recentTransactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                currency={profile?.currency ?? 'CLP'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aun no tienes movimientos este mes"
            description="Cuando registres ingresos o gastos durante el mes actual, apareceran aqui en tu resumen."
            action={
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/categories">
                  <Button variant="secondary">Crear categoria</Button>
                </Link>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
