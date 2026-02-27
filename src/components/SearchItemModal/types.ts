import { Ingredient } from '@/types/ingredient';
import { Recipe } from '@/types/recipe';

export type SearchableItem = Ingredient | Recipe;

export type SearchableItemType = 'ingredient' | 'recipe';

export type TypedIngredient = Ingredient & { itemType: 'ingredient' };
export type TypedRecipe = Recipe & { itemType: 'recipe' };

export type TypedSearchableItem = TypedIngredient | TypedRecipe;

export interface SearchItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectItem: (item: SearchableItem, quantity: number) => void;
  itemTypes: SearchableItemType[];
}
