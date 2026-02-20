// src/utils/dateUtils.ts
import { Timestamp } from 'firebase/firestore';

// Función para verificar si dos fechas son del mismo día
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

// Función para crear una fecha a partir de un día de la semana (0-6 donde 0 es domingo)
export const getCurrentWeekDate = (dayOfWeek: number): Date => {
  const today = new Date();
  const currentDay = today.getDay(); // 0-6 (0 es domingo)
  const diff = dayOfWeek - currentDay;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return targetDate;
};

// Función para verificar si un timestamp es de hoy
export const isFromToday = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | string | number | Date,
): boolean => {
  let firebaseDate: Date;
  // Si es instancia de Timestamp de Firebase
  if (timestamp instanceof Timestamp) {
    firebaseDate = timestamp.toDate();
  }
  // Si es objeto con seconds y nanoseconds (Firestore puede devolver así en algunos casos)
  else if (
    timestamp &&
    typeof timestamp === 'object' &&
    'seconds' in timestamp &&
    'nanoseconds' in timestamp
  ) {
    firebaseDate = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  }
  // Si es Date
  else if (timestamp instanceof Date) {
    firebaseDate = timestamp;
  }
  // Si viene como string o número (milisegundos)
  else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    firebaseDate = new Date(timestamp);
  } else {
    return false; // o lanza un error si prefieres
  }

  const today = new Date();

  return isSameDay(firebaseDate, today);
};
