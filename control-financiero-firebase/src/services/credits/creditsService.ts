import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
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
  Credit,
  CreditDocument,
  CreditInstallment,
  CreditInstallmentDocument,
  CreditInstallmentPayload,
  CreditPayload,
} from '@/types/credit';

function creditsCollection(uid: string) {
  return collection(db, 'users', uid, 'credits');
}

function creditDoc(uid: string, creditId: string) {
  return doc(db, 'users', uid, 'credits', creditId);
}

function installmentsCollection(uid: string, creditId: string) {
  return collection(db, 'users', uid, 'credits', creditId, 'installments');
}

function installmentDoc(uid: string, creditId: string, installmentId: string) {
  return doc(db, 'users', uid, 'credits', creditId, 'installments', installmentId);
}

function mapCredit(snapshot: { id: string; data: () => unknown }): Credit {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Credit, 'id'>),
  };
}

function mapInstallment(snapshot: { id: string; data: () => unknown }): CreditInstallment {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<CreditInstallment, 'id'>),
  };
}

export async function getCredits(uid: string): Promise<Credit[]> {
  const creditsQuery = query(creditsCollection(uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(creditsQuery);
  return snapshot.docs.map(mapCredit);
}

export function subscribeToCredits(uid: string, callback: (credits: Credit[]) => void): () => void {
  const creditsQuery = query(creditsCollection(uid), orderBy('createdAt', 'desc'));

  return onSnapshot(creditsQuery, (snapshot) => {
    callback(snapshot.docs.map(mapCredit));
  });
}

export async function createCredit(uid: string, payload: CreditPayload): Promise<void> {
  await addDoc(creditsCollection(uid), {
    name: payload.name.trim(),
    ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
    totalAmount: Number(payload.totalAmount),
    totalInstallments: Number(payload.totalInstallments),
    paidAmount: 0,
    paidInstallments: 0,
    firstDueDate: Timestamp.fromDate(payload.firstDueDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCredit(uid: string, creditId: string, payload: CreditPayload): Promise<void> {
  const snapshot = await getDoc(creditDoc(uid, creditId));

  if (!snapshot.exists()) {
    throw new Error('El credito que intentas editar ya no esta disponible.');
  }

  const currentCredit = snapshot.data() as CreditDocument;

  if (payload.totalAmount < currentCredit.paidAmount) {
    throw new Error('El monto total no puede ser menor a lo que ya fue abonado.');
  }

  if (payload.totalInstallments < currentCredit.paidInstallments) {
    throw new Error('La cantidad total de cuotas no puede ser menor a las cuotas ya registradas.');
  }

  await updateDoc(creditDoc(uid, creditId), {
    name: payload.name.trim(),
    description: payload.description?.trim() ? payload.description.trim() : deleteField(),
    totalAmount: Number(payload.totalAmount),
    totalInstallments: Number(payload.totalInstallments),
    firstDueDate: Timestamp.fromDate(payload.firstDueDate),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCredit(uid: string, creditId: string): Promise<void> {
  const batch = writeBatch(db);
  const installmentsSnapshot = await getDocs(installmentsCollection(uid, creditId));

  installmentsSnapshot.docs.forEach((snapshot) => {
    batch.delete(snapshot.ref);
  });

  batch.delete(creditDoc(uid, creditId));
  await batch.commit();
}

export async function getCreditInstallments(uid: string, creditId: string): Promise<CreditInstallment[]> {
  const installmentsQuery = query(installmentsCollection(uid, creditId), orderBy('paymentDate', 'desc'));
  const snapshot = await getDocs(installmentsQuery);
  return snapshot.docs.map(mapInstallment);
}

export function subscribeToCreditInstallments(
  uid: string,
  creditId: string,
  callback: (installments: CreditInstallment[]) => void,
): () => void {
  const installmentsQuery = query(installmentsCollection(uid, creditId), orderBy('paymentDate', 'desc'));

  return onSnapshot(installmentsQuery, (snapshot) => {
    callback(snapshot.docs.map(mapInstallment));
  });
}

export async function createCreditInstallment(
  uid: string,
  creditId: string,
  payload: CreditInstallmentPayload,
): Promise<void> {
  const creditReference = creditDoc(uid, creditId);
  const installmentReference = doc(installmentsCollection(uid, creditId));

  await runTransaction(db, async (transaction) => {
    const creditSnapshot = await transaction.get(creditReference);

    if (!creditSnapshot.exists()) {
      throw new Error('El credito ya no esta disponible.');
    }

    const currentCredit = creditSnapshot.data() as CreditDocument;
    const remainingAmount = currentCredit.totalAmount - currentCredit.paidAmount;
    const remainingInstallments = currentCredit.totalInstallments - currentCredit.paidInstallments;
    const amount = Number(payload.amount);

    if (remainingInstallments <= 0 || remainingAmount <= 0) {
      throw new Error('Este credito ya fue pagado por completo.');
    }

    if (amount > remainingAmount) {
      throw new Error('La cuota no puede superar el saldo pendiente del credito.');
    }

    transaction.set(installmentReference, {
      amount,
      paymentDate: Timestamp.fromDate(payload.paymentDate),
      ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(creditReference, {
      paidAmount: currentCredit.paidAmount + amount,
      paidInstallments: currentCredit.paidInstallments + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateCreditInstallment(
  uid: string,
  creditId: string,
  installmentId: string,
  payload: CreditInstallmentPayload,
): Promise<void> {
  const creditReference = creditDoc(uid, creditId);
  const installmentReference = installmentDoc(uid, creditId, installmentId);

  await runTransaction(db, async (transaction) => {
    const [creditSnapshot, installmentSnapshot] = await Promise.all([
      transaction.get(creditReference),
      transaction.get(installmentReference),
    ]);

    if (!creditSnapshot.exists() || !installmentSnapshot.exists()) {
      throw new Error('La cuota que intentas editar ya no esta disponible.');
    }

    const currentCredit = creditSnapshot.data() as CreditDocument;
    const currentInstallment = installmentSnapshot.data() as CreditInstallmentDocument;
    const amount = Number(payload.amount);
    const nextPaidAmount = currentCredit.paidAmount - currentInstallment.amount + amount;

    if (nextPaidAmount > currentCredit.totalAmount) {
      throw new Error('La cuota no puede dejar el credito con un total abonado superior al monto original.');
    }

    transaction.update(installmentReference, {
      amount,
      paymentDate: Timestamp.fromDate(payload.paymentDate),
      description: payload.description?.trim() ? payload.description.trim() : deleteField(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(creditReference, {
      paidAmount: nextPaidAmount,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteCreditInstallment(uid: string, creditId: string, installmentId: string): Promise<void> {
  const creditReference = creditDoc(uid, creditId);
  const installmentReference = installmentDoc(uid, creditId, installmentId);

  await runTransaction(db, async (transaction) => {
    const [creditSnapshot, installmentSnapshot] = await Promise.all([
      transaction.get(creditReference),
      transaction.get(installmentReference),
    ]);

    if (!creditSnapshot.exists() || !installmentSnapshot.exists()) {
      throw new Error('La cuota que intentas eliminar ya no esta disponible.');
    }

    const currentCredit = creditSnapshot.data() as CreditDocument;
    const currentInstallment = installmentSnapshot.data() as CreditInstallmentDocument;

    transaction.delete(installmentReference);
    transaction.update(creditReference, {
      paidAmount: Math.max(0, currentCredit.paidAmount - currentInstallment.amount),
      paidInstallments: Math.max(0, currentCredit.paidInstallments - 1),
      updatedAt: serverTimestamp(),
    });
  });
}
