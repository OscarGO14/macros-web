import { Macros } from '@/types/macros';
import { Meal } from '@/types/meal';

export interface DailyLog {
  meals: Meal[];
  totalMacros: Macros;
}

// Clave: "YYYY-MM-DD"
export type History = Record<string, DailyLog>;
