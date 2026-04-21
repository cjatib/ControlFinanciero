import {
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
import type { Category, CategoryPayload } from '@/types/category';

function categoriesCollection(uid: string) {
  return collection(db, 'users', uid, 'categories');
}

function categoryDoc(uid: string, categoryId: string) {
  return doc(db, 'users', uid, 'categories', categoryId);
}

function mapCategory(snapshot: { id: string; data: () => unknown }): Category {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Category, 'id'>),
  };
}

export async function getCategories(uid: string): Promise<Category[]> {
  const categoriesQuery = query(categoriesCollection(uid), orderBy('name', 'asc'));
  const snapshot = await getDocs(categoriesQuery);
  return snapshot.docs.map(mapCategory);
}

export function subscribeToCategories(
  uid: string,
  callback: (categories: Category[]) => void,
): () => void {
  const categoriesQuery = query(categoriesCollection(uid), orderBy('name', 'asc'));

  return onSnapshot(categoriesQuery, (snapshot) => {
    callback(snapshot.docs.map(mapCategory));
  });
}

export async function createCategory(uid: string, payload: CategoryPayload): Promise<void> {
  await addDoc(categoriesCollection(uid), {
    name: payload.name.trim(),
    type: payload.type,
    ...(payload.color?.trim() ? { color: payload.color.trim() } : {}),
    ...(payload.icon?.trim() ? { icon: payload.icon.trim() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategory(uid: string, categoryId: string, payload: CategoryPayload): Promise<void> {
  await updateDoc(categoryDoc(uid, categoryId), {
    name: payload.name.trim(),
    type: payload.type,
    color: payload.color?.trim() ? payload.color.trim() : deleteField(),
    icon: payload.icon?.trim() ? payload.icon.trim() : deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  await deleteDoc(categoryDoc(uid, categoryId));
}

