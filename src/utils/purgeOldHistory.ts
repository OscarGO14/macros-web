import { History } from '@/types/history';

// Elimina entradas del historial con más de 2 meses de antigüedad.
// También elimina claves con formato antiguo (ej: "monday") que no son fechas.
export const purgeOldHistory = (history: History): History => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  const cutoffStr = [
    cutoff.getFullYear(),
    String(cutoff.getMonth() + 1).padStart(2, '0'),
    String(cutoff.getDate()).padStart(2, '0'),
  ].join('-');

  return Object.fromEntries(
    Object.entries(history).filter(
      ([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= cutoffStr,
    ),
  );
};
