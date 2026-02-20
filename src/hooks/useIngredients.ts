import { onSnapshot, Unsubscribe } from 'firebase/firestore'; // Import onSnapshot and Unsubscribe type
import { useEffect, useState } from 'react';

import { ingredientsCollection } from '@/services/firebase'; // Make sure this path is correct
import { Ingredient } from '@/types/ingredient';

// Hook para extraer documentos de Firestore con escucha en tiempo real
export const useIngredients = () => {
  const [data, setData] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true); // Start loading when effect runs or collectionName changes
    setError(null); // Reset error on new subscription attempt

    let unsubscribe: Unsubscribe = () => {}; // Initialize unsubscribe to an empty function

    try {
      // Subscribe to real-time updates
      unsubscribe = onSnapshot(
        ingredientsCollection,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            // Ensure all expected fields exist, provide defaults if necessary
            return {
              id: doc.id,
              name: data.name ?? 'Desconocido',
              category: data.category ?? 'Sin categoría',
              calories: data.calories ?? 0,
              proteins: data.proteins ?? 0,
              carbs: data.carbs ?? 0,
              fats: data.fats ?? 0,
            } as Ingredient; // Assert type after mapping
          });
          setData(documents);
          setLoading(false); // Set loading false after the first batch of data arrives
        },
        (err) => {
          // Handle errors from the listener itself
          console.error(`Firebase listener error for ingredientsCollection:`, err);
          setError(err as Error);
          setLoading(false);
        },
      );
    } catch (err) {
      // Catch potential errors during collection() call (e.g., invalid path)
      console.error(`Error setting up listener for ingredientsCollection:`, err);
      setError(err as Error);
      setLoading(false);
    }

    // Cleanup function: unsubscribe when component unmounts or collectionName changes
    return () => {
      // console.log(`Unsubscribing from ${collectionName}`); // Optional log
      unsubscribe(); // Call the stored unsubscribe function
    };
  }, []); // Dependency array ensures effect re-runs if collectionName changes

  return { data, loading, error };
};
