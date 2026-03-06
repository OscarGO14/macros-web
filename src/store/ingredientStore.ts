// src/store/ingredientStore.ts
import { create } from 'zustand';
import { getDocs } from 'firebase/firestore';
import { ingredientsCollection } from '@/services/firebase';
import { Ingredient } from '@/types/ingredient';

interface IngredientState {
  ingredients: Ingredient[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: Error | null;
  loadIngredients: () => Promise<void>;
  addIngredient: (ingredient: Ingredient) => void;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  status: 'idle',
  error: null,

  loadIngredients: async () => {
    if (get().status === 'loaded' || get().status === 'loading') return;

    set({ status: 'loading', error: null });
    try {
      const snapshot = await getDocs(ingredientsCollection);
      const ingredients = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name ?? 'Desconocido',
        category: doc.data().category ?? 'Sin categoría',
        calories: doc.data().calories ?? 0,
        proteins: doc.data().proteins ?? 0,
        carbs: doc.data().carbs ?? 0,
        fats: doc.data().fats ?? 0,
      } as Ingredient));
      set({ ingredients, status: 'loaded' });
    } catch (err) {
      set({ error: err as Error, status: 'error' });
    }
  },

  addIngredient: (ingredient: Ingredient) => {
    set(state => ({ ingredients: [...state.ingredients, ingredient] }));
  },
}));
