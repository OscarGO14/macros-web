'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import InputText from '@/components/ui/InputText';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientStore } from '@/store/ingredientStore';
import { ItemType } from '@/types/itemType';
import { Ingredient } from '@/types/ingredient';

export default function IngredientsListPage() {
  const router = useRouter();
  const { data, loading, error } = useIngredients();
  const removeIngredient = useIngredientStore(s => s.removeIngredient);
  const [search, setSearch] = useState('');
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);

  const filteredIngredients = useMemo(
    () => data?.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const handleDelete = async () => {
    if (!ingredientToDelete) return;
    try {
      await deleteDoc(doc(db, Collections.INGREDIENTS, ingredientToDelete.id));
      removeIngredient(ingredientToDelete.id);
      toast.success('Ingrediente eliminado.');
    } catch {
      toast.error('Error al eliminar el ingrediente.');
    } finally {
      setIngredientToDelete(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <p className="text-danger text-center py-8">Error: {error.message}</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-4 py-4">
        <p className="text-2xl font-bold text-primary">Lista de Ingredientes</p>
        <InputText
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredIngredients?.length === 0 ? (
          <p className="text-center text-alternate mt-10">No se encontraron ingredientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredIngredients?.map((item) => (
              <li key={item.id}>
                <Item
                  name={item.name}
                  calories={item.calories}
                  type={ItemType.INGREDIENT}
                  onEdit={() => router.push(`/ingredients/edit-ingredient?id=${item.id}`)}
                  onDelete={() => setIngredientToDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationModal
        isVisible={!!ingredientToDelete}
        onClose={() => setIngredientToDelete(null)}
        handleConfirm={handleDelete}
        message={`¿Eliminar el ingrediente "${ingredientToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </Screen>
  );
}
