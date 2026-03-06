import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ConsumedItem } from '@/types/meal';

interface MealDraftState {
  draftItems: ConsumedItem[];
  addItem: (item: ConsumedItem) => void;
  removeItem: (index: number) => void;
  clearDraft: () => void;
}

export const useMealDraftStore = create<MealDraftState>()(
  persist(
    (set) => ({
      draftItems: [],
      addItem: (item) => set((state) => ({ draftItems: [...state.draftItems, item] })),
      removeItem: (index) =>
        set((state) => ({ draftItems: state.draftItems.filter((_, i) => i !== index) })),
      clearDraft: () => set({ draftItems: [] }),
    }),
    {
      name: 'meal-draft-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
