import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Collections } from '@/types/collections';
import { Ingredient } from '@/types/ingredient';
import { Recipe } from '@/types/recipe';

/**
 * Centralized service for general data operations (ingredients, recipes, etc.)
 * Provides consistent error handling and type safety
 */
export class DataService {
  /**
   * Get all ingredients
   */
  static async getIngredients(): Promise<Ingredient[]> {
    try {
      const ingredientsCollection = collection(db, Collections.INGREDIENTS);
      const snapshot = await getDocs(ingredientsCollection);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ingredient));
    } catch (error) {
      console.error('Error al obtener ingredientes:', error);
      throw new Error(`Failed to get ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ingredient by ID
   */
  static async getIngredient(id: string): Promise<Ingredient | null> {
    try {
      const ingredientDoc = doc(db, Collections.INGREDIENTS, id);
      const snapshot = await getDoc(ingredientDoc);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as Ingredient;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener ingrediente:', error);
      throw new Error(`Failed to get ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or update ingredient
   */
  static async saveIngredient(ingredient: Omit<Ingredient, 'id'>, id?: string): Promise<string> {
    try {
      let ingredientDoc;

      if (id) {
        ingredientDoc = doc(db, Collections.INGREDIENTS, id);
        await updateDoc(ingredientDoc, ingredient);
      } else {
        ingredientDoc = doc(collection(db, Collections.INGREDIENTS));
        await setDoc(ingredientDoc, ingredient);
      }

      console.log(`Ingrediente ${id ? 'actualizado' : 'creado'} exitosamente`);
      return ingredientDoc.id;
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
      throw new Error(`Failed to save ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete ingredient
   */
  static async deleteIngredient(id: string): Promise<void> {
    try {
      const ingredientDoc = doc(db, Collections.INGREDIENTS, id);
      await deleteDoc(ingredientDoc);
      console.log('Ingrediente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar ingrediente:', error);
      throw new Error(`Failed to delete ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all recipes
   */
  static async getRecipes(): Promise<Recipe[]> {
    try {
      const recipesCollection = collection(db, Collections.RECIPES);
      const snapshot = await getDocs(recipesCollection);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recipe));
    } catch (error) {
      console.error('Error al obtener recetas:', error);
      throw new Error(`Failed to get recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recipe by ID
   */
  static async getRecipe(id: string): Promise<Recipe | null> {
    try {
      const recipeDoc = doc(db, Collections.RECIPES, id);
      const snapshot = await getDoc(recipeDoc);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as Recipe;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener receta:', error);
      throw new Error(`Failed to get recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or update recipe
   */
  static async saveRecipe(recipe: Omit<Recipe, 'id'>, id?: string): Promise<string> {
    try {
      let recipeDoc;

      if (id) {
        recipeDoc = doc(db, Collections.RECIPES, id);
        await updateDoc(recipeDoc, recipe);
      } else {
        recipeDoc = doc(collection(db, Collections.RECIPES));
        await setDoc(recipeDoc, recipe);
      }

      console.log(`Receta ${id ? 'actualizada' : 'creada'} exitosamente`);
      return recipeDoc.id;
    } catch (error) {
      console.error('Error al guardar receta:', error);
      throw new Error(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete recipe
   */
  static async deleteRecipe(id: string): Promise<void> {
    try {
      const recipeDoc = doc(db, Collections.RECIPES, id);
      await deleteDoc(recipeDoc);
      console.log('Receta eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar receta:', error);
      throw new Error(`Failed to delete recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search ingredients by name
   */
  static async searchIngredients(searchTerm: string, limitResults = 10): Promise<Ingredient[]> {
    try {
      const ingredientsCollection = collection(db, Collections.INGREDIENTS);
      // Firestore doesn't support full-text search, so we'll get all and filter client-side
      // In production, consider using Algolia or similar for better search
      const snapshot = await getDocs(ingredientsCollection);

      const allIngredients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ingredient));

      return allIngredients
        .filter(ingredient =>
          ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limitResults);
    } catch (error) {
      console.error('Error al buscar ingredientes:', error);
      throw new Error(`Failed to search ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search recipes by name
   */
  static async searchRecipes(searchTerm: string, limitResults = 10): Promise<Recipe[]> {
    try {
      const recipesCollection = collection(db, Collections.RECIPES);
      const snapshot = await getDocs(recipesCollection);

      const allRecipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recipe));

      return allRecipes
        .filter(recipe =>
          recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limitResults);
    } catch (error) {
      console.error('Error al buscar recetas:', error);
      throw new Error(`Failed to search recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}