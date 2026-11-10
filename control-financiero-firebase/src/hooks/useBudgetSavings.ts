import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toDate } from '@/lib/format';
import { useAuth } from './useAuth';
import type { BudgetGroup } from '@/types/budget';

export function useBudgetSavings(groups: BudgetGroup[], month: string) {
  const { user } = useAuth();
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const planIds = [...new Set(groups.filter((g) => g.kind === 'saving' && g.savingsPlanId)
    .map((g) => g.savingsPlanId))].sort().join(',');

  useEffect(() => {
    setTotals({});
    setError(null);
    if (!user || !planIds) return;
    const unsubscribers = planIds.split(',').map((planId) =>
      onSnapshot(
        collection(db, 'users', user.uid, 'savingsPlans', planId, 'entries'),
        (snapshot) => {
          const amount = snapshot.docs.reduce((sum, entry) => {
            const data = entry.data();
            const date = toDate(data.entryDate);
            const matches = date &&
              date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') === month;
            return sum + (matches && typeof data.amount === 'number' ? data.amount : 0);
          }, 0);
          setTotals((current) => ({ ...current, [planId]: amount }));
        },
        () => setError('No fue posible consultar los aportes de uno o más planes de ahorro.'),
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user, planIds, month]);

  return { totals, error };
}
