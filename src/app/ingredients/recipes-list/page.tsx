'use client';
import { useRouter } from 'next/navigation';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import ActionButton from '@/components/ui/ActionButton';
import { useRecipes } from '@/hooks/useRecipes';
import { ItemType } from '@/types/itemType';

export default function RecipesListPage() {
  const router = useRouter();
  const { data, loading, error } = useRecipes();

  return (
    <Screen>
      <div className="flex flex-col gap-4 py-4">
        <p className="text-lg font-semibold text-primary">Mis recetas</p>
        {loading && <p className="text-alternate italic">Cargando recetas...</p>}
        {error && <p className="text-alternate italic">Error: {error.message}</p>}
        {data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((item) => (
              <li key={item.id}>
                <Item name={item.name} type={ItemType.RECIPE} calories={item.macros.calories} />
              </li>
            ))}
          </ul>
        )}
        <ActionButton
          label="Crear receta"
          onPress={() => router.push('/ingredients/add-recipe')}
        />
      </div>
    </Screen>
  );
}
