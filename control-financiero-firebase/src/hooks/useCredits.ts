import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getCredits, subscribeToCredits } from '@/services/credits/creditsService';
import { useAuth } from './useAuth';
import type { Credit } from '@/types/credit';

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCredits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCredits(user.uid, (nextCredits) => {
      setCredits(nextCredits);
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
      const nextCredits = await getCredits(user.uid);
      setCredits(nextCredits);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    credits,
    loading,
    error,
    refresh,
  };
}
