// Devuelve "YYYY-MM-DD" en hora de Madrid
export const getToday = (): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
  }).format(new Date());
};
