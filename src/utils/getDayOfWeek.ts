import { DayOfWeek } from '@/types/history';

// Coger el DailyLog del día actual
export const getDayOfWeek = (): DayOfWeek => {
  const date = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'Europe/Madrid',
  }).format(date);

  return dayOfWeek?.toLowerCase() as DayOfWeek;
};
