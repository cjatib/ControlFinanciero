import {
  Timestamp,
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  SavingsEntry,
  SavingsEntryDocument,
  SavingsEntryPayload,
  SavingsPlan,
  SavingsPlanDocument,
  SavingsPlanPayload,
} from '@/types/savings';

function savingsPlansCollection(uid: string) {
  return collection(db, 'users', uid, 'savingsPlans');
}

function savingsPlanDoc(uid: string, savingsPlanId: string) {
  return doc(db, 'users', uid, 'savingsPlans', savingsPlanId);
}

function savingsEntriesCollection(uid: string, savingsPlanId: string) {
  return collection(db, 'users', uid, 'savingsPlans', savingsPlanId, 'entries');
}

function savingsEntryDoc(uid: string, savingsPlanId: string, entryId: string) {
  return doc(db, 'users', uid, 'savingsPlans', savingsPlanId, 'entries', entryId);
}

function mapSavingsPlan(snapshot: { id: string; data: () => unknown }): SavingsPlan {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<SavingsPlan, 'id'>),
  };
}

function mapSavingsEntry(snapshot: { id: string; data: () => unknown }): SavingsEntry {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<SavingsEntry, 'id'>),
  };
}

export async function getSavingsPlans(uid: string): Promise<SavingsPlan[]> {
  const plansQuery = query(savingsPlansCollection(uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(plansQuery);
  return snapshot.docs.map(mapSavingsPlan);
}

export function subscribeToSavingsPlans(uid: string, callback: (plans: SavingsPlan[]) => void): () => void {
  const plansQuery = query(savingsPlansCollection(uid), orderBy('createdAt', 'desc'));

  return onSnapshot(plansQuery, (snapshot) => {
    callback(snapshot.docs.map(mapSavingsPlan));
  });
}

export async function createSavingsPlan(uid: string, payload: SavingsPlanPayload): Promise<void> {
  await addDoc(savingsPlansCollection(uid), {
    reason: payload.reason.trim(),
    monthlyTarget: Number(payload.monthlyTarget),
    savedAmount: 0,
    entriesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSavingsPlan(
  uid: string,
  savingsPlanId: string,
  payload: SavingsPlanPayload,
): Promise<void> {
  const snapshot = await getDoc(savingsPlanDoc(uid, savingsPlanId));

  if (!snapshot.exists()) {
    throw new Error('El plan de ahorro que intentas editar ya no esta disponible.');
  }

  await updateDoc(savingsPlanDoc(uid, savingsPlanId), {
    reason: payload.reason.trim(),
    monthlyTarget: Number(payload.monthlyTarget),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSavingsPlan(uid: string, savingsPlanId: string): Promise<void> {
  const batch = writeBatch(db);
  const entriesSnapshot = await getDocs(savingsEntriesCollection(uid, savingsPlanId));

  entriesSnapshot.docs.forEach((snapshot) => {
    batch.delete(snapshot.ref);
  });

  batch.delete(savingsPlanDoc(uid, savingsPlanId));
  await batch.commit();
}

export async function getSavingsEntries(uid: string, savingsPlanId: string): Promise<SavingsEntry[]> {
  const entriesQuery = query(savingsEntriesCollection(uid, savingsPlanId), orderBy('entryDate', 'desc'));
  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map(mapSavingsEntry);
}

export function subscribeToSavingsEntries(
  uid: string,
  savingsPlanId: string,
  callback: (entries: SavingsEntry[]) => void,
): () => void {
  const entriesQuery = query(savingsEntriesCollection(uid, savingsPlanId), orderBy('entryDate', 'desc'));

  return onSnapshot(entriesQuery, (snapshot) => {
    callback(snapshot.docs.map(mapSavingsEntry));
  });
}

export async function createSavingsEntry(
  uid: string,
  savingsPlanId: string,
  payload: SavingsEntryPayload,
): Promise<void> {
  const planReference = savingsPlanDoc(uid, savingsPlanId);
  const entryReference = doc(savingsEntriesCollection(uid, savingsPlanId));

  await runTransaction(db, async (transaction) => {
    const planSnapshot = await transaction.get(planReference);

    if (!planSnapshot.exists()) {
      throw new Error('El plan de ahorro ya no esta disponible.');
    }

    const currentPlan = planSnapshot.data() as SavingsPlanDocument;
    const amount = Number(payload.amount);

    transaction.set(entryReference, {
      amount,
      entryDate: Timestamp.fromDate(payload.entryDate),
      ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(planReference, {
      savedAmount: currentPlan.savedAmount + amount,
      entriesCount: currentPlan.entriesCount + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateSavingsEntry(
  uid: string,
  savingsPlanId: string,
  entryId: string,
  payload: SavingsEntryPayload,
): Promise<void> {
  const planReference = savingsPlanDoc(uid, savingsPlanId);
  const entryReference = savingsEntryDoc(uid, savingsPlanId, entryId);

  await runTransaction(db, async (transaction) => {
    const [planSnapshot, entrySnapshot] = await Promise.all([
      transaction.get(planReference),
      transaction.get(entryReference),
    ]);

    if (!planSnapshot.exists() || !entrySnapshot.exists()) {
      throw new Error('El ingreso al ahorro que intentas editar ya no esta disponible.');
    }

    const currentPlan = planSnapshot.data() as SavingsPlanDocument;
    const currentEntry = entrySnapshot.data() as SavingsEntryDocument;
    const amount = Number(payload.amount);
    const nextSavedAmount = currentPlan.savedAmount - currentEntry.amount + amount;

    transaction.update(entryReference, {
      amount,
      entryDate: Timestamp.fromDate(payload.entryDate),
      description: payload.description?.trim() ? payload.description.trim() : deleteField(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(planReference, {
      savedAmount: Math.max(0, nextSavedAmount),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteSavingsEntry(uid: string, savingsPlanId: string, entryId: string): Promise<void> {
  const planReference = savingsPlanDoc(uid, savingsPlanId);
  const entryReference = savingsEntryDoc(uid, savingsPlanId, entryId);

  await runTransaction(db, async (transaction) => {
    const [planSnapshot, entrySnapshot] = await Promise.all([
      transaction.get(planReference),
      transaction.get(entryReference),
    ]);

    if (!planSnapshot.exists() || !entrySnapshot.exists()) {
      throw new Error('El ingreso al ahorro que intentas eliminar ya no esta disponible.');
    }

    const currentPlan = planSnapshot.data() as SavingsPlanDocument;
    const currentEntry = entrySnapshot.data() as SavingsEntryDocument;

    transaction.delete(entryReference);
    transaction.update(planReference, {
      savedAmount: Math.max(0, currentPlan.savedAmount - currentEntry.amount),
      entriesCount: Math.max(0, currentPlan.entriesCount - 1),
      updatedAt: serverTimestamp(),
    });
  });
}
