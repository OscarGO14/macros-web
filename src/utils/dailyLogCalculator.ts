import { ConsumedItem } from '@/types/meal';
import { DailyLog } from '@/types/history';
import { Meal } from '@/types/meal';
import { Macros } from '@/types/macros';
import { Timestamp } from 'firebase/firestore';

export const dailyLogCalculator = (
  dailyLog: DailyLog | undefined,
  currentMealItems: ConsumedItem[],
  totalMealMacros: Macros,
) => {
  const today = new Date();
  if (dailyLog?.date.toDate().toDateString() !== today.toDateString() || !dailyLog) {
    dailyLog = {
      date: Timestamp.fromDate(today),
      meals: [],
      totalMacros: {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      },
    };
  }
  dailyLog.meals.push({
    items: currentMealItems,
    totalMacros: totalMealMacros,
  });
  dailyLog.totalMacros = {
    calories: dailyLog.meals.reduce(
      (acc: number, meal: Meal) => acc + meal.totalMacros.calories,
      0,
    ),
    proteins: dailyLog.meals.reduce(
      (acc: number, meal: Meal) => acc + meal.totalMacros.proteins,
      0,
    ),
    carbs: dailyLog.meals.reduce((acc: number, meal: Meal) => acc + meal.totalMacros.carbs, 0),
    fats: dailyLog.meals.reduce((acc: number, meal: Meal) => acc + meal.totalMacros.fats, 0),
  };

  return dailyLog;
};
