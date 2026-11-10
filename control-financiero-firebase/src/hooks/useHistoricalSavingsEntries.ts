import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import type { SavingsEntry, SavingsEntryDocument, SavingsPlan } from '@/types/savings';

interface HistoricalSavingsState {
  entries: SavingsEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Firestore's current security rules authorize each savingsPlan/entries path,
 * not a collection-group query. Subscribe only to the user's existing plans
 * and merge contributions without modifying or duplicating any documents.
 */
export function useHistoricalSavingsEntries(plans: SavingsPlan[]): HistoricalSavingsState {
  const { user } = useAuth();
  const uid = user?.uid;
  const planIds = useMemo(
    () => JSON.stringify([...new Set(plans.map((plan) => plan.id))].sort()),
    [plans],
  );
  const [state, setState] = useState<HistoricalSavingsState>({
    entries: [], loading: true, error: null,
  });

  useEffect(() => {
    const ids: string[] = JSON.parse(planIds) as string[];
    if (!uid || ids.length === 0) {
      setState({ entries: [], loading: false, error: null });
      return;
    }

    let active = true;
    const received = new Map<string, SavingsEntry[]>();
    setState({ entries: [], loading: true, error: null });

    const unsubscribers = ids.map((planId) => onSnapshot(
      collection(db, 'users', uid, 'savingsPlans', planId, 'entries'),
      (snapshot) => {
        if (!active) return;
        received.set(planId, snapshot.docs.map((entry) => ({
          id: entry.id,
          ...(entry.data() as SavingsEntryDocument),
        })));
        if (received.size === ids.length) {
          setState({ entries: ids.flatMap((id) => received.get(id) ?? []), loading: false, error: null });
        }
      },
      () => {
        if (active) {
          setState({ entries: [], loading: false, error: 'No fue posible consultar los aportes históricos de ahorro.' });
        }
      },
    ));
    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid, planIds]);

  return state;
}
