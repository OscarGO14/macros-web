import { useState, useEffect } from 'react';
import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { recipesCollection } from '@/services/firebase';
import { Recipe } from '@/types/recipe';

/**
 * Hook para obtener todas las recetas en tiempo real desde Firestore.
 * Las recetas son globales: visibles y editables por cualquier usuario autenticado.
 */
export const useRecipes = () => {
  const [data, setData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe = () => {};

    try {
      unsubscribe = onSnapshot(
        recipesCollection,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Sin nombre',
              ingredients: data.ingredients || [],
              macros: data.macros || { calories: 0, proteins: 0, carbs: 0, fats: 0 },
              serves: data.serves || 1,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Recipe;
          });
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error('Firebase listener error for recipesCollection:', err);
          setError(err as Error);
          setLoading(false);
        },
      );
    } catch (err) {
      console.error('Error setting up listener for recipesCollection:', err);
      setError(err as Error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  return { data, loading, error };
};
