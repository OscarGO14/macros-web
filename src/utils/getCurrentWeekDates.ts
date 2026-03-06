import { getToday } from '@/utils/getToday';

// Suma `days` días a una fecha en formato "YYYY-MM-DD"
const addDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

// Devuelve ["YYYY-MM-DD", ...] de Lunes a Domingo de la semana actual
export const getCurrentWeekDates = (): string[] => {
  const today = getToday();
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // getDay(): 0=Dom, 1=Lun, ..., 6=Sab
  const dayOfWeek = date.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = addDays(today, -daysSinceMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

// Devuelve el label corto del día ("Lun", "Mar", ...) a partir de "YYYY-MM-DD"
export const getDayLabel = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const label = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
};
