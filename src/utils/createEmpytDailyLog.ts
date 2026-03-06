import { DailyLog } from '@/types/history';

export const createEmptyDailyLog = (): DailyLog => ({
  meals: [],
  totalMacros: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
});
