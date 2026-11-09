import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeToMonthlyBudgets } from '@/services/budget/budgetService';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import type { MonthlyBudget } from '@/types/budget';

export function useMonthlyBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeToMonthlyBudgets(
      user.uid,
      (data) => {
        setBudgets(data);
        setError(null);
        setLoading(false);
      },
      (failure) => {
        setError(getFirebaseErrorMessage(failure));
        setLoading(false);
      },
    );
  }, [user]);

  return { budgets, loading, error };
}
