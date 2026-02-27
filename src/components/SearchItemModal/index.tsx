'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { SearchItemModalProps, SearchableItem, TypedSearchableItem } from './types';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipes } from '@/hooks/useRecipes';
import InputText from '@/components/ui/InputText';
import { ItemType } from '@/types/itemType';
import Item from '@/components/ui/Item';
import ActionButton from '@/components/ui/ActionButton';

const SearchItemModal = ({ isVisible, onClose, onSelectItem, itemTypes }: SearchItemModalProps) => {
  const shouldFetchIngredients = itemTypes.includes('ingredient');
  const shouldFetchRecipes = itemTypes.includes('recipe');

  const { data: ingredientsData, loading: ingredientsLoading, error: ingredientsError } = useIngredients();
  const { data: recipesData, loading: recipesLoading, error: recipesError } = useRecipes();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<TypedSearchableItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  const loading = ingredientsLoading || recipesLoading;
  const fetchError =
    (shouldFetchIngredients && ingredientsError) || (shouldFetchRecipes && recipesError);

  useEffect(() => {
    if (isVisible) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setSearchTerm('');
      setSelectedItem(null);
      setQuantity('');
    }
  }, [isVisible]);

  const allItems: TypedSearchableItem[] = useMemo(() => {
    const combined: TypedSearchableItem[] = [];
    if (shouldFetchIngredients && ingredientsData) {
      ingredientsData.forEach((ing) => combined.push({ ...ing, itemType: 'ingredient' }));
    }
    if (shouldFetchRecipes && recipesData) {
      recipesData.forEach((rec) => combined.push({ ...rec, itemType: 'recipe' }));
    }
    return combined;
  }, [ingredientsData, recipesData, shouldFetchIngredients, shouldFetchRecipes]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return allItems;
    return allItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allItems, searchTerm]);

  const handleConfirm = () => {
    if (!selectedItem) {
      toast.error('Por favor, selecciona un item.');
      return;
    }
    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      const unit = selectedItem.itemType === 'ingredient' ? 'gramos' : 'raciones';
      toast.error(`Por favor, introduce una cantidad válida en ${unit}.`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { itemType: _itemType, ...baseItem } = selectedItem;
    onSelectItem(baseItem as SearchableItem, numQuantity);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="backdrop:bg-black/50 bg-transparent w-11/12 max-w-2xl max-h-[90vh] rounded-lg p-0"
    >
      <div
        className="bg-item-background rounded-lg p-5 flex flex-col gap-3 shadow-lg h-full max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-primary text-center">Añadir Item</h2>

        <InputText
          placeholder="Buscar ingrediente o receta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-center text-alternate py-4">Cargando...</p>
          ) : fetchError ? (
            <p className="text-danger text-center py-4">
              Error al cargar datos. {(fetchError as Error).message}
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-alternate py-4">No se encontraron items</p>
          ) : (
            <ul className="flex flex-col gap-1 py-2">
              {filteredItems.map((item) => (
                <li key={`${item.itemType}-${item.id}`}>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-2 rounded border cursor-pointer ${
                      selectedItem?.id === item.id && selectedItem?.itemType === item.itemType
                        ? 'border-accent bg-accent/10'
                        : 'border-transparent'
                    }`}
                  >
                    <Item
                      name={item.name}
                      type={item.itemType === 'ingredient' ? ItemType.INGREDIENT : ItemType.RECIPE}
                      calories={item.itemType === 'ingredient' ? item.calories : item.macros.calories}
                      showType
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedItem && (
          <div className="p-3 border border-alternate rounded bg-item-background">
            <p className="font-semibold mb-2 text-primary">Seleccionado: {selectedItem.name}</p>
            <input
              type="number"
              placeholder={selectedItem.itemType === 'ingredient' ? 'Cantidad (gr)' : 'Cantidad (raciones)'}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-background border border-alternate rounded p-2 text-primary placeholder:text-alternate outline-none"
            />
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <ActionButton label="Cancelar" onPress={onClose} color="secondary" />
          <ActionButton
            label="Confirmar"
            onPress={handleConfirm}
            disabled={!selectedItem || loading}
            color="accent"
          />
        </div>
      </div>
    </dialog>
  );
};

export default SearchItemModal;
