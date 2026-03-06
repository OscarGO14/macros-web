'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useRecipes } from '@/hooks/useRecipes';
import { ItemType } from '@/types/itemType';
import { Recipe } from '@/types/recipe';

export default function RecipesListPage() {
  const router = useRouter();
  const { data, loading, error } = useRecipes();
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    try {
      await deleteDoc(doc(db, Collections.RECIPES, recipeToDelete.id));
      toast.success('Receta eliminada.');
    } catch {
      toast.error('Error al eliminar la receta.');
    } finally {
      setRecipeToDelete(null);
    }
  };

  return (
    <Screen>
      <div className="flex flex-col gap-4 py-4">
        <p className="text-lg font-semibold text-primary">Recetas</p>
        {loading && <p className="text-alternate italic">Cargando recetas...</p>}
        {error && <p className="text-alternate italic">Error: {error.message}</p>}
        {data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((item) => (
              <li key={item.id}>
                <Item
                  name={item.name}
                  type={ItemType.RECIPE}
                  calories={item.macros.calories}
                  onEdit={() => router.push(`/ingredients/edit-recipe/${item.id}`)}
                  onDelete={() => setRecipeToDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
        <ActionButton
          label="Crear receta"
          onPress={() => router.push('/ingredients/add-recipe')}
        />
      </div>

      <ConfirmationModal
        isVisible={!!recipeToDelete}
        onClose={() => setRecipeToDelete(null)}
        handleConfirm={handleDelete}
        message={`¿Eliminar la receta "${recipeToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </Screen>
  );
}
