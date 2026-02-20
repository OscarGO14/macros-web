// Función para crear un DailyLog vacío para el día actual

import { DailyLog } from '@/types/history';
import { Timestamp } from 'firebase/firestore';

// Esto asegura que el campo 'date' se establezca al momento de la acción.
export const createEmptyDailyLog = (): DailyLog => ({
  date: Timestamp.now(), // Fecha y hora actual para el registro reseteado
  meals: [],
  totalMacros: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
});
