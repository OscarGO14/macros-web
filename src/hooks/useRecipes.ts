import { useState, useEffect } from 'react';
import { query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { recipesCollection } from '@/services/firebase';
import { Recipe } from '@/types/recipe';
import { useUserStore } from '@/store/userStore'; // Corregir nombre del archivo

/**
 * Hook para obtener las recetas del usuario actual en tiempo real desde Firestore.
 */
export const useRecipes = () => {
  const { user, isLoading: isUserLoading } = useUserStore(); // Obtener usuario y estado de carga
  const userId = user?.uid;

  const [data, setData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Si el usuario aún está cargando, no hacer nada todavía
    if (isUserLoading) {
      setLoading(true); // Mantener el estado de carga
      return;
    }

    // Si no hay userId (usuario no logueado o error), no podemos cargar recetas
    if (!userId) {
      setData([]); // Limpiar datos
      setLoading(false); // Terminar carga
      setError(null); // No es un error del fetch, simplemente no hay usuario
      return () => {}; // Devuelve una función vacía para la limpieza
    }

    // Si llegamos aquí, tenemos un userId y el usuario ya no está cargando
    setLoading(true); // Iniciar carga para esta suscripción
    setError(null); // Resetear error

    let unsubscribe: Unsubscribe = () => {};

    try {
      const q = query(recipesCollection);
      unsubscribe = onSnapshot(
        q, // Usar la query 'q' definida arriba
        (querySnapshot) => {
          const documents = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            // Construir el objeto Recipe explícitamente
            return {
              id: doc.id,
              userId: data.userId || '', // Valor por defecto: string vacío
              name: data.name || 'Sin nombre', // Valor por defecto
              ingredients: data.ingredients || [], // Valor por defecto: array vacío
              macros: data.macros || { calories: 0, proteins: 0, carbs: 0, fats: 0 }, // Macros por defecto
              serves: data.serves || 1, // Valor por defecto: 1 ración
              // Convertir Timestamps a Date, con fallback a new Date()
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Recipe; // Aserción de tipo después de construir el objeto
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
    // Dependencias: re-ejecutar si cambia el userId o el estado de carga del usuario
  }, [userId, isUserLoading]);

  return { data, loading, error };
};
