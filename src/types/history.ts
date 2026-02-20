// src/types/history.ts
import { Timestamp } from 'firebase/firestore';
import { Macros } from '@/types/macros'; // Reutilizamos el tipo Macros
import { Meal } from '@/types/meal';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const dayOfWeekArray: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export interface DailyLog {
  // El ID será la fecha YYYY-MM-DD, pero no es necesario ponerlo explícitamente en el tipo
  date: Timestamp; // Fecha del registro (usaremos Timestamp de Firestore)
  meals: Meal[];
  totalMacros: Macros; // Macros totales del día
  // Podrías añadir otros campos como notas del día, nivel de actividad, etc.
}

export type History = Partial<Record<DayOfWeek, DailyLog>>;
