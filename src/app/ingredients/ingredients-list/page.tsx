'use client';
import { useState, useMemo } from 'react';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import InputText from '@/components/ui/InputText';
import { useIngredients } from '@/hooks/useIngredients';
import { ItemType } from '@/types/itemType';

export default function IngredientsListPage() {
  const { data, loading, error } = useIngredients();
  const [search, setSearch] = useState('');

  const filteredIngredients = useMemo(
    () => data?.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

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
                <Item name={item.name} calories={item.calories} type={ItemType.INGREDIENT} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
