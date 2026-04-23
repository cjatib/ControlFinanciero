import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getSavingsPlans, subscribeToSavingsPlans } from '@/services/savings/savingsService';
import { useAuth } from './useAuth';
import type { SavingsPlan } from '@/types/savings';

export function useSavingsPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSavingsPlans(user.uid, (nextPlans) => {
      setPlans(nextPlans);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  async function refresh() {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const nextPlans = await getSavingsPlans(user.uid);
      setPlans(nextPlans);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    plans,
    loading,
    error,
    refresh,
  };
}
