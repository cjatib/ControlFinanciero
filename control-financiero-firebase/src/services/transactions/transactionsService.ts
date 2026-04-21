import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Transaction, TransactionPayload } from '@/types/transaction';

function transactionsCollection(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

function transactionDoc(uid: string, transactionId: string) {
  return doc(db, 'users', uid, 'transactions', transactionId);
}

function mapTransaction(snapshot: { id: string; data: () => unknown }): Transaction {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Transaction, 'id'>),
  };
}

export async function getTransactions(uid: string): Promise<Transaction[]> {
  const transactionsQuery = query(transactionsCollection(uid), orderBy('transactionDate', 'desc'));
  const snapshot = await getDocs(transactionsQuery);
  return snapshot.docs.map(mapTransaction);
}

export function subscribeToTransactions(
  uid: string,
  callback: (transactions: Transaction[]) => void,
): () => void {
  const transactionsQuery = query(transactionsCollection(uid), orderBy('transactionDate', 'desc'));

  return onSnapshot(transactionsQuery, (snapshot) => {
    callback(snapshot.docs.map(mapTransaction));
  });
}

export async function createTransaction(uid: string, payload: TransactionPayload): Promise<void> {
  await addDoc(transactionsCollection(uid), {
    type: payload.type,
    amount: Number(payload.amount),
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
    transactionDate: Timestamp.fromDate(payload.transactionDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  payload: TransactionPayload,
): Promise<void> {
  await updateDoc(transactionDoc(uid, transactionId), {
    type: payload.type,
    amount: Number(payload.amount),
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    description: payload.description?.trim() ? payload.description.trim() : deleteField(),
    transactionDate: Timestamp.fromDate(payload.transactionDate),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
  await deleteDoc(transactionDoc(uid, transactionId));
}

