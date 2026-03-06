// src/hooks/useIngredients.ts
import { useEffect } from 'react';
import { useIngredientStore } from '@/store/ingredientStore';

export const useIngredients = () => {
  const { ingredients, status, error, loadIngredients } = useIngredientStore();

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  return {
    data: ingredients,
    loading: status === 'idle' || status === 'loading',
    error,
  };
};
