import { ConsumedItem, Meal } from '@/types/meal';
import { DailyLog } from '@/types/history';
import { Macros } from '@/types/macros';

export const dailyLogCalculator = (
  dailyLog: DailyLog | undefined,
  currentMealItems: ConsumedItem[],
  totalMealMacros: Macros,
): DailyLog => {
  const existingLog: DailyLog = dailyLog ?? {
    meals: [],
    totalMacros: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
  };

  const updatedMeals: Meal[] = [
    ...existingLog.meals,
    { items: currentMealItems, totalMacros: totalMealMacros },
  ];

  return {
    meals: updatedMeals,
    totalMacros: {
      calories: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.calories, 0),
      proteins: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.proteins, 0),
      carbs: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.carbs, 0),
      fats: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.fats, 0),
    },
  };
};
