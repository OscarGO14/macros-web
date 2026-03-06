'use client';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useMealDraftStore } from '@/store/mealDraftStore';
import { getToday } from '@/utils/getToday';
import { purgeOldHistory } from '@/utils/purgeOldHistory';
import { dailyLogCalculator } from '@/utils/dailyLogCalculator';
import { Ingredient } from '@/types/ingredient';
import { Recipe } from '@/types/recipe';
import { ConsumedItem, MealIngredient, MealRecipe } from '@/types/meal';
import { ItemType } from '@/types/itemType';
import { SearchableItem } from '@/components/SearchItemModal/types';
import { updateUser } from '@/services/firebase';
import Item from '@/components/ui/Item';
import SearchItemModal from '@/components/SearchItemModal';
import SubmitButton from '@/components/ui/SubmitButton';
import ActionButton from '@/components/ui/ActionButton';
import Screen from '@/components/ui/Screen';
import { StatsCard } from '@/components/ui/StatsCard';

export default function AddMealPage() {
  const { user, updateUserData } = useUserStore();
  const { draftItems, addItem, removeItem, clearDraft } = useMealDraftStore();
  const router = useRouter();
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const totalMealMacros = useMemo(() => {
    return draftItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.macros.calories,
        proteins: acc.proteins + item.macros.proteins,
        carbs: acc.carbs + item.macros.carbs,
        fats: acc.fats + item.macros.fats,
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 },
    );
  }, [draftItems]);

  const handleSelectItem = useCallback((item: SearchableItem, quantity: number) => {
    let newItem: ConsumedItem;
    if ('calories' in item) {
      const ingredient = item as Ingredient;
      newItem = {
        id: ingredient.id,
        name: ingredient.name,
        itemType: ItemType.INGREDIENT,
        quantity,
        macros: {
          calories: Math.round((ingredient.calories / 100) * quantity),
          proteins: Math.round((ingredient.proteins / 100) * quantity),
          carbs: Math.round((ingredient.carbs / 100) * quantity),
          fats: Math.round((ingredient.fats / 100) * quantity),
        },
      } as MealIngredient;
    } else {
      const recipe = item as Recipe;
      if (!recipe.serves || recipe.serves <= 0) {
        toast.error(`La receta "${recipe.name}" no tiene un número de raciones válido.`);
        setIsSearchModalVisible(false);
        return;
      }
      newItem = {
        id: recipe.id,
        name: recipe.name,
        itemType: ItemType.RECIPE,
        quantity,
        macros: {
          calories: Math.round(recipe.macros.calories * quantity),
          proteins: Math.round(recipe.macros.proteins * quantity),
          carbs: Math.round(recipe.macros.carbs * quantity),
          fats: Math.round(recipe.macros.fats * quantity),
        },
      } as MealRecipe;
    }
    addItem(newItem);
    setIsSearchModalVisible(false);
  }, [addItem]);

  const handleSaveMeal = useCallback(async () => {
    if (draftItems.length === 0) {
      toast.error('No has añadido ningún alimento a la comida.');
      return;
    }
    if (!user) return;

    const today = getToday();
    const dailyLog = dailyLogCalculator(user.history?.[today], draftItems, totalMealMacros);
    const cleanHistory = purgeOldHistory({ ...user.history, [today]: dailyLog });
    const updatedUserData = { ...user, history: cleanHistory };
    const previousUserData = user;
    updateUserData(updatedUserData);

    try {
      await updateUser(user.uid, { history: cleanHistory });
    } catch {
      updateUserData(previousUserData);
      toast.error('No se pudo guardar la comida. Inténtalo de nuevo.');
      return;
    }

    clearDraft();
    router.replace('/dashboard');
  }, [draftItems, totalMealMacros, user, router, updateUserData, clearDraft]);

  const handleDeleteItem = useCallback((index: number) => {
    removeItem(index);
  }, [removeItem]);

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <p className="text-xl font-semibold text-primary">Elementos añadidos:</p>

        <div className="flex flex-col gap-2 min-h-24">
          {draftItems.length === 0 ? (
            <p className="text-center text-alternate">No has añadido ningún alimento.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {draftItems.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <Item
                    name={item.name}
                    type={item.itemType as (typeof ItemType)[keyof typeof ItemType]}
                    calories={Math.round(item.macros.calories)}
                    showType
                    onDelete={() => handleDeleteItem(index)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <ActionButton
          label="Añadir ingrediente o receta"
          onPress={() => setIsSearchModalVisible(true)}
        />

        <StatsCard
          title="Total comida"
          value={totalMealMacros.calories.toFixed(0)}
          variant="primary"
          trend={[
            `P: ${totalMealMacros.proteins.toFixed(1)}`,
            `C: ${totalMealMacros.carbs.toFixed(1)}`,
            `G: ${totalMealMacros.fats.toFixed(1)}`,
          ]}
        />

        <SubmitButton onPress={handleSaveMeal} label="Guardar Comida" />

        <SearchItemModal
          isVisible={isSearchModalVisible}
          onClose={() => setIsSearchModalVisible(false)}
          onSelectItem={handleSelectItem}
          itemTypes={['ingredient', 'recipe']}
        />
      </div>
    </Screen>
  );
}
