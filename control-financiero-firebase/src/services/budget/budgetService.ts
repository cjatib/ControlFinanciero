import {
  collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { validateMonthlyBudget } from './budgetMath';
import type { MonthlyBudget, MonthlyBudgetDocument, MonthlyBudgetPayload } from '@/types/budget';

function monthlyBudgetsCollection(uid: string) {
  return collection(db, 'users', uid, 'monthlyBudgets');
}

export function subscribeToMonthlyBudgets(
  uid: string,
  onData: (budgets: MonthlyBudget[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(monthlyBudgetsCollection(uid), orderBy('month', 'desc')),
    (snapshot) => onData(snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as MonthlyBudgetDocument),
    }))),
    onError,
  );
}

export async function saveMonthlyBudget(uid: string, payload: MonthlyBudgetPayload): Promise<void> {
  const validationError = validateMonthlyBudget(payload);
  if (validationError) throw new Error(validationError);
  const ref = doc(monthlyBudgetsCollection(uid), payload.month);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    transaction.set(ref, {
      ...payload,
      groups: payload.groups.map((group) => ({
        ...group,
        name: group.name.trim(),
        categoryIds: group.kind === 'expense' ? group.categoryIds : [],
        savingsPlanId: group.kind === 'saving' ? group.savingsPlanId : '',
      })),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
