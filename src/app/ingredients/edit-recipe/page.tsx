'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import { Ingredient } from '@/types/ingredient';
import { Macros } from '@/types/macros';
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
  return {
    calories: parseFloat((total.calories / numServes).toFixed(2)),
    proteins: parseFloat((total.proteins / numServes).toFixed(2)),
    carbs: parseFloat((total.carbs / numServes).toFixed(2)),
    fats: parseFloat((total.fats / numServes).toFixed(2)),
  };
};

function EditRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [name, setName] = useState('');
  const [serves, setServes] = useState('1');
  const [selectedIngredientsData, setSelectedIngredientsData] = useState<SelectedIngredientData[]>([]);
  const [currentMacros, setCurrentMacros] = useState<Macros>(initialMacros);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error('Receta no encontrada.');
      router.back();
      return;
    }
    const fetchRecipe = async () => {
      try {
        const snapshot = await getDoc(doc(db, Collections.RECIPES, id));
        if (!snapshot.exists()) {
          toast.error('Receta no encontrada.');
          router.back();
          return;
        }
        const data = snapshot.data();
        setName(data.name || '');
        setServes(String(data.serves || 1));
        setLoading(false);
      } catch {
        toast.error('Error al cargar la receta.');
        router.back();
      }
    };
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    const numServes = parseInt(serves, 10) || 1;
    if (selectedIngredientsData.length > 0) {
      setCurrentMacros(calculateRecipeMacros(selectedIngredientsData, numServes));
    } else {
      setCurrentMacros(initialMacros);
    }
  }, [selectedIngredientsData, serves]);

  const handleIngredientSelected = (item: SearchableItem, quantity: number) => {
    if (!('calories' in item)) {
      toast.error('Solo se pueden añadir ingredientes a una receta.');
      return;
    }
    setSelectedIngredientsData(prev => [...prev, { ingredient: item as Ingredient, quantity }]);
    setIsModalVisible(false);
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredientsData(prev => prev.filter(i => i.ingredient.id !== ingredientId));
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      toast.error('El nombre de la receta no puede estar vacío.');
      return;
    }
    setSaving(true);
    const numServes = parseInt(serves, 10) || 1;
    const updatedData = {
      name: name.trim(),
      ingredients: selectedIngredientsData.map(item => ({
        ingredientId: item.ingredient.id,
        quantity: item.quantity,
      })),
      macros: currentMacros,
      serves: numServes,
      updatedAt: new Date(),
    };
    try {
      await updateDoc(doc(db, Collections.RECIPES, id), updatedData);
      toast.success('Receta actualizada.');
      router.back();
    } catch {
      toast.error('Error al guardar la receta.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3 pb-10">
        <p className="text-xl font-bold text-primary mb-2">Editar Receta</p>
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

        <div className="flex flex-col gap-1">
          <InputText
            label="Raciones por receta"
            placeholder="Ej: 2"
            type="number"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
          />
          <p className="text-alternate text-sm px-1">
            Número de platos que rinde esta receta. Los macros se dividen entre este número.
          </p>
        </div>

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
          label={saving ? 'Guardando...' : 'Guardar receta'}
          onPress={handleSave}
          disabled={saving}
        />

        <SearchItemModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectItem={handleIngredientSelected}
          itemTypes={['ingredient']}
        />
      </div>
    </Screen>
  );
}

export default function EditRecipePage() {
  return (
    <Suspense fallback={<Screen><p className="text-center text-alternate py-8">Cargando...</p></Screen>}>
      <EditRecipeForm />
    </Suspense>
  );
}
