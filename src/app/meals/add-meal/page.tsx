'use client';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { getDayOfWeek } from '@/utils/getDayOfWeek';
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

export default function AddMealPage() {
  const { user, updateUserData } = useUserStore();
  const router = useRouter();
  const [currentMealItems, setCurrentMealItems] = useState<ConsumedItem[]>([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const totalMealMacros = useMemo(() => {
    return currentMealItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.macros.calories,
        proteins: acc.proteins + item.macros.proteins,
        carbs: acc.carbs + item.macros.carbs,
        fats: acc.fats + item.macros.fats,
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 },
    );
  }, [currentMealItems]);

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
    setCurrentMealItems((prev) => [...prev, newItem]);
    setIsSearchModalVisible(false);
  }, []);

  const handleSaveMeal = useCallback(async () => {
    if (currentMealItems.length === 0) {
      toast.error('No has añadido ningún alimento a la comida.');
      return;
    }
    if (!user) return;

    const today = getDayOfWeek();
    const dailyLog = dailyLogCalculator(user.history?.[today], currentMealItems, totalMealMacros);
    const updatedUserData = { ...user, history: { ...user.history, [today]: dailyLog } };
    const previousUserData = user;
    updateUserData(updatedUserData);

    try {
      await updateUser(user.uid, { history: { ...user.history, [today]: dailyLog } });
    } catch {
      updateUserData(previousUserData);
      toast.error('No se pudo guardar la comida. Inténtalo de nuevo.');
      return;
    }

    setCurrentMealItems([]);
    router.replace('/dashboard');
  }, [currentMealItems, totalMealMacros, user, router, updateUserData]);

  const handleDeleteItem = useCallback((index: number) => {
    setCurrentMealItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <ActionButton
          label="Añadir ingrediente o receta"
          onPress={() => setIsSearchModalVisible(true)}
        />

        <p className="text-xl font-semibold text-primary my-4">Elementos añadidos:</p>

        <div className="flex flex-col gap-2 min-h-24">
          {currentMealItems.length === 0 ? (
            <p className="text-center text-alternate">No has añadido ningún alimento.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {currentMealItems.map((item, index) => (
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
