import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getCategories, subscribeToCategories } from '@/services/categories/categoriesService';
import { useAuth } from './useAuth';
import type { Category } from '@/types/category';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCategories(user.uid, (nextCategories) => {
      setCategories(nextCategories);
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
      const nextCategories = await getCategories(user.uid);
      setCategories(nextCategories);
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    categories,
    loading,
    error,
    refresh,
  };
}

