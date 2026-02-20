import { Macros } from '@/types/macros';

export type RecipeIngredient = {
  ingredientId: string;
  quantity: number;
};

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  ingredients: RecipeIngredient[];
  macros: Macros;
  serves: number;
  createdAt: Date;
  updatedAt: Date;
}
