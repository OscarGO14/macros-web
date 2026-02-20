import { DayOfWeek } from '@/types/history';

export const formatDay = (day: DayOfWeek) => {
  switch (day) {
    case 'monday':
      return 'Lun';
    case 'tuesday':
      return 'Mar';
    case 'wednesday':
      return 'Mier';
    case 'thursday':
      return 'Jue';
    case 'friday':
      return 'Vie';
    case 'saturday':
      return 'Sab';
    case 'sunday':
      return 'Dom';
    default:
      return day;
  }
};
