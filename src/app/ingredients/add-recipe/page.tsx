'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'sonner';
import { db, recipesCollection } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import { Ingredient } from '@/types/ingredient';
import { Macros } from '@/types/macros';
import { Collections } from '@/types/collections';
import { ItemType } from '@/types/itemType';
import { SearchableItem } from '@/components/SearchItemModal/types';
import SearchItemModal from '@/components/SearchItemModal';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';
import InputText from '@/components/ui/InputText';
import ActionButton from '@/components/ui/ActionButton';
import Item from '@/components/ui/Item';
import { StatsCard } from '@/components/ui/StatsCard';

interface SelectedIngredientData {
  ingredient: Ingredient;
  quantity: number;
}

const initialMacros: Macros = { calories: 0, proteins: 0, carbs: 0, fats: 0 };

export default function AddRecipePage() {
  const router = useRouter();
  const { user } = useUserStore();

  const [name, setName] = useState('');
  const [selectedIngredientsData, setSelectedIngredientsData] = useState<SelectedIngredientData[]>([]);
  const [serves, setServes] = useState('1');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMacros, setCurrentMacros] = useState<Macros>(initialMacros);

  const handleIngredientSelected = (ingredient: Ingredient, quantity: number) => {
    setSelectedIngredientsData((prev) => [...prev, { ingredient, quantity }]);
    setIsModalVisible(false);
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredientsData((prev) =>
      prev.filter((item) => item.ingredient.id !== ingredientId),
    );
  };

  const calculateRecipeMacros = (
    ingredientsData: SelectedIngredientData[],
    numServes: number,
  ): Macros => {
    const total: Macros = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    ingredientsData.forEach((item) => {
      const factor = item.quantity / 100;
      total.calories += (item.ingredient.calories || 0) * factor;
      total.proteins += (item.ingredient.proteins || 0) * factor;
      total.carbs += (item.ingredient.carbs || 0) * factor;
      total.fats += (item.ingredient.fats || 0) * factor;
    });
    const perServing: Macros = {
      calories: parseFloat((total.calories / numServes).toFixed(2)),
      proteins: parseFloat((total.proteins / numServes).toFixed(2)),
      carbs: parseFloat((total.carbs / numServes).toFixed(2)),
      fats: parseFloat((total.fats / numServes).toFixed(2)),
    };
    return perServing;
  };

  useEffect(() => {
    const numServes = parseInt(serves, 10) || 1;
    if (selectedIngredientsData.length > 0) {
      setCurrentMacros(calculateRecipeMacros(selectedIngredientsData, numServes));
    } else {
      setCurrentMacros(initialMacros);
    }
  }, [selectedIngredientsData, serves]);

  const handleSaveRecipe = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar recetas.');
      return;
    }
    if (name.trim() === '') {
      toast.error('El nombre de la receta no puede estar vacío.');
      return;
    }

    setLoading(true);
    const numServes = parseInt(serves, 10) || 1;
    const newRecipeData = {
      userId: user.uid,
      name: name.trim(),
      ingredients: selectedIngredientsData.map((item) => ({
        ingredientId: item.ingredient.id,
        quantity: item.quantity,
      })),
      macros: currentMacros,
      serves: numServes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const newRecipeRef = await addDoc(recipesCollection, newRecipeData);
      await updateDoc(doc(db, Collections.USERS, user.uid), {
        customRecipeIds: arrayUnion(newRecipeRef.id),
      });
      toast.success('Receta guardada correctamente.');
      router.back();
    } catch (error) {
      toast.error(`Error al guardar la receta: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItemWrapper = (item: SearchableItem, quantity: number) => {
    if ('calories' in item) {
      handleIngredientSelected(item as Ingredient, quantity);
    } else {
      toast.error('Se intentó añadir un tipo de item incorrecto.');
    }
  };

  return (
    <Screen>
      <div className="flex flex-col gap-3 pb-10">
        <InputText
          label="Nombre de la receta"
          placeholder="Ej: Lentejas de la abuela"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mb-2">
          <p className="text-primary font-semibold mb-2">Lista de ingredientes:</p>
          <div className="min-h-28">
            {selectedIngredientsData.length === 0 ? (
              <p className="text-alternate italic text-center p-4">
                Añade ingredientes a tu receta
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selectedIngredientsData.map((item) => (
                  <li key={item.ingredient.id}>
                    <Item
                      name={item.ingredient.name}
                      calories={item.ingredient.calories}
                      type={ItemType.INGREDIENT}
                      onDelete={() => removeIngredient(item.ingredient.id)}
                      showType={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ActionButton
            onPress={() => setIsModalVisible(true)}
            label="Añadir ingrediente"
            disabled={isModalVisible}
          />
        </div>

        <InputText
          label="Raciones por receta"
          placeholder="Ej: 2 (para cuántas comidas rinde)"
          type="number"
          value={serves}
          onChange={(e) => setServes(e.target.value)}
        />

        <StatsCard
          title="Macros por ración"
          value={currentMacros.calories.toFixed(0)}
          variant="primary"
          trend={[
            `P: ${currentMacros.proteins.toFixed(1)}`,
            `C: ${currentMacros.carbs.toFixed(1)}`,
            `G: ${currentMacros.fats.toFixed(1)}`,
          ]}
        />

        <SubmitButton
          label={loading ? 'Guardando...' : 'Guardar receta'}
          onPress={handleSaveRecipe}
          disabled={loading}
        />

        <SearchItemModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectItem={handleSelectItemWrapper}
          itemTypes={['ingredient']}
        />
      </div>
    </Screen>
  );
}
