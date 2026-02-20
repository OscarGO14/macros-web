// src/types/consumed.ts
import { ItemType } from '@/types/itemType';
import { Macros } from './macros';

/**
 * Representa un Ingrediente consumido como parte de una comida.
 */
export interface MealIngredient {
  id: string; // ID del ingrediente original
  name: string;
  itemType: typeof ItemType.INGREDIENT;
  quantity: number; // Cantidad consumida en gramos (g)
  macros: Macros; // Macros calculados para la cantidad consumida
}

/**
 * Representa una Receta consumida como parte de una comida.
 */
export interface MealRecipe {
  id: string; // ID de la receta original
  name: string;
  itemType: typeof ItemType.RECIPE;
  quantity: number; // Cantidad consumida en número de raciones
  macros: Macros; // Macros calculados para la cantidad consumida
}

/**
 * Tipo unión para cualquier ítem que pueda ser consumido en una comida.
 */
export type ConsumedItem = MealIngredient | MealRecipe;

// Define la estructura de una comida (desayuno, almuerzo, etc.)
export type Meal = {
  items: ConsumedItem[];
  totalMacros: Macros; // Macros totales de esta comida
};
