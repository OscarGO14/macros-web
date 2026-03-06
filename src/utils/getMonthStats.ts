import { History } from '@/types/history';

export interface MonthStats {
  daysLogged: number;
  avgCalories: number;
  avgProteins: number;
  avgCarbs: number;
  avgFats: number;
}

// monthPrefix: "2026-03" | "2026-02"
export const getMonthStats = (history: History, monthPrefix: string): MonthStats => {
  const entries = Object.entries(history).filter(([date]) => date.startsWith(monthPrefix));

  if (entries.length === 0) {
    return { daysLogged: 0, avgCalories: 0, avgProteins: 0, avgCarbs: 0, avgFats: 0 };
  }

  const sum = entries.reduce(
    (acc, [, log]) => ({
      calories: acc.calories + log.totalMacros.calories,
      proteins: acc.proteins + log.totalMacros.proteins,
      carbs: acc.carbs + log.totalMacros.carbs,
      fats: acc.fats + log.totalMacros.fats,
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 },
  );

  const n = entries.length;
  return {
    daysLogged: n,
    avgCalories: Math.round(sum.calories / n),
    avgProteins: Math.round(sum.proteins / n),
    avgCarbs: Math.round(sum.carbs / n),
    avgFats: Math.round(sum.fats / n),
  };
};

// Devuelve el prefijo del mes anterior: "2026-02" dado "2026-03"
export const getPrevMonthPrefix = (currentPrefix: string): string => {
  const [year, month] = currentPrefix.split('-').map(Number);
  const prev = new Date(year, month - 2, 1); // month-2 porque Date usa 0-indexed
  return [
    prev.getFullYear(),
    String(prev.getMonth() + 1).padStart(2, '0'),
  ].join('-');
};
