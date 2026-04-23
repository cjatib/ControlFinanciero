import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  getCreditInstallments,
  subscribeToCreditInstallments,
} from '@/services/credits/creditsService';
import { useAuth } from './useAuth';
import type { CreditInstallment } from '@/types/credit';

export function useCreditInstallments(creditId: string | null) {
  const { user } = useAuth();
  const [installments, setInstallments] = useState<CreditInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !creditId) {
      setInstallments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCreditInstallments(user.uid, creditId, (nextInstallments) => {
      setInstallments(nextInstallments);
      setLoading(false);
    });

    return unsubscribe;
  }, [creditId, user]);

  async function refresh() {
    if (!user || !creditId) {
      return;
    }

    try {
      setLoading(true);
      const nextInstallments = await getCreditInstallments(user.uid, creditId);
      setInstallments(nextInstallments);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    installments,
    loading,
    error,
    refresh,
  };
}
