import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getTransactions, subscribeToTransactions } from '@/services/transactions/transactionsService';
import { useAuth } from './useAuth';
import type { Transaction } from '@/types/transaction';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTransactions(user.uid, (nextTransactions) => {
      setTransactions(nextTransactions);
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
      const nextTransactions = await getTransactions(user.uid);
      setTransactions(nextTransactions);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    transactions,
    loading,
    error,
    refresh,
  };
}

