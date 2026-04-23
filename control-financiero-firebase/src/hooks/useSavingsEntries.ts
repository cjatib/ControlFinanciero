import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getSavingsEntries, subscribeToSavingsEntries } from '@/services/savings/savingsService';
import { useAuth } from './useAuth';
import type { SavingsEntry } from '@/types/savings';

export function useSavingsEntries(savingsPlanId: string | null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !savingsPlanId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSavingsEntries(user.uid, savingsPlanId, (nextEntries) => {
      setEntries(nextEntries);
      setLoading(false);
    });

    return unsubscribe;
  }, [savingsPlanId, user]);

  async function refresh() {
    if (!user || !savingsPlanId) {
      return;
    }

    try {
      setLoading(true);
      const nextEntries = await getSavingsEntries(user.uid, savingsPlanId);
      setEntries(nextEntries);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    entries,
    loading,
    error,
    refresh,
  };
}
