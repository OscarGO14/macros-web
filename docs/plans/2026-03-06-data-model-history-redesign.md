# Data Model & History Redesign — Design Doc

**Date:** 2026-03-06
**Scope:** Refactor del modelo de historial para soportar fechas reales, semana actual y stats mensuales. Limpieza de campos obsoletos.

---

## Problema

El modelo actual almacena el historial keyed por día de la semana (`'monday'…'sunday'`), lo que sobreescribe los datos de semanas anteriores. No hay historial real — cada lunes machaca el lunes anterior.

Además, `Ingredient.userId` está sin uso desde que los ingredientes son globales, y `DailyLog.date` es redundante si la clave ya es la fecha.

---

## Decisión

**Opción A: cambiar la clave a `YYYY-MM-DD` dentro del documento de usuario.** Mínima fricción, sin cambio de arquitectura Firestore, sin nuevas lecturas. Se purgan entradas con más de 2 meses en cada escritura. Stats mensuales calculados al vuelo en el cliente.

---

## Cambios en tipos

### `src/types/history.ts`

```ts
// Antes
export type DayOfWeek = 'monday' | ... | 'sunday';
export const dayOfWeekArray: DayOfWeek[] = [...];

export interface DailyLog {
  date: Timestamp;
  meals: Meal[];
  totalMacros: Macros;
}

export type History = Partial<Record<DayOfWeek, DailyLog>>;

// Después
export interface DailyLog {
  meals: Meal[];
  totalMacros: Macros;
}

export type History = Record<string, DailyLog>; // clave: "YYYY-MM-DD"
```

`DayOfWeek` y `dayOfWeekArray` se eliminan de este archivo. Si se necesitan para UI (labels del gráfico), se crean en un util de presentación.

### `src/types/ingredient.ts`

Eliminar `userId?: string` — no se usa.

---

## Utils nuevos/modificados

### `src/utils/getToday.ts` (reemplaza `getDayOfWeek.ts`)

```ts
export function getToday(): string {
  return new Date().toISOString().split('T')[0]; // "2026-03-06"
}
```

### `src/utils/getCurrentWeekDates.ts` (nuevo)

Devuelve array de 7 strings `YYYY-MM-DD` para la semana actual, Lunes a Domingo.

```ts
export function getCurrentWeekDates(): string[] {
  // Calcula el lunes de la semana actual y genera 7 fechas
}
```

### `src/utils/getMonthStats.ts` (nuevo)

```ts
export interface MonthStats {
  daysLogged: number;
  avgCalories: number;
  avgProteins: number;
  avgCarbs: number;
  avgFats: number;
}

export function getMonthStats(history: History, monthPrefix: string): MonthStats {
  // monthPrefix: "2026-03" | "2026-02"
  // Filtra history por clave que empieza con monthPrefix
  // Calcula medias de totalMacros
}
```

### `src/utils/purgeOldHistory.ts` (nuevo)

```ts
export function purgeOldHistory(history: History): History {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return Object.fromEntries(
    Object.entries(history).filter(([date]) => date >= cutoffStr)
  );
}
```

### `src/utils/dailyLogCalculator.ts` (modificar)

Eliminar el campo `date` del `DailyLog` que construye.

---

## Lógica de escritura

En `add-meal/page.tsx` (o en el servicio que corresponda):

```ts
const today = getToday(); // "2026-03-06"
const dailyLog = dailyLogCalculator(user.history?.[today], currentMealItems, totalMealMacros);
const cleanHistory = purgeOldHistory({ ...user.history, [today]: dailyLog });
await updateUser(user.uid, { history: cleanHistory });
```

**Datos existentes:** las claves tipo `"monday"` en Firestore quedan huérfanas. No se migran — son datos sin fecha real asociable y se purgarán automáticamente en la primera escritura (no coinciden con el formato `YYYY-MM-DD >= cutoff`).

---

## Vistas

### Dashboard — hoy

```ts
const today = getToday();
const todayLog = user.history?.[today];
```

Sin cambios visuales.

### Dashboard — semana actual (BarChart)

```ts
const weekDates = getCurrentWeekDates(); // ["2026-03-02", ..., "2026-03-08"]
const weekData = weekDates.map(date => ({
  label: // "Lun", "Mar"... derivado de la fecha
  calories: user.history?.[date]?.totalMacros.calories ?? 0,
}));
```

Labels generados desde la fecha, no hardcodeados.

### Dashboard — stats mensuales

Dos bloques `StatsCard`:

```ts
const currentMonthPrefix = getToday().slice(0, 7); // "2026-03"
const prevMonthPrefix = getPrevMonthPrefix();       // "2026-02"

const currentStats = getMonthStats(user.history ?? {}, currentMonthPrefix);
const prevStats    = getMonthStats(user.history ?? {}, prevMonthPrefix);
```

Mostrar: días registrados, media de calorías diarias, media de proteínas. Sin lecturas extra a Firestore.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/types/history.ts` | Eliminar `DayOfWeek`, `date` en `DailyLog`, cambiar tipo `History` |
| `src/types/ingredient.ts` | Eliminar `userId?` |
| `src/utils/getDayOfWeek.ts` | Reemplazar por `getToday.ts` |
| `src/utils/dailyLogCalculator.ts` | Eliminar campo `date` |
| `src/utils/getCurrentWeekDates.ts` | Nuevo |
| `src/utils/getMonthStats.ts` | Nuevo |
| `src/utils/purgeOldHistory.ts` | Nuevo |
| `src/app/meals/add-meal/page.tsx` | Usar `getToday()` + `purgeOldHistory()` |
| `src/app/dashboard/page.tsx` | Usar fecha real, `getCurrentWeekDates()`, añadir stats mensuales |

**Sin cambios:** `SyncService`, `RetryService`, estructura Firestore, colecciones, `Recipe`, `Macros`, `Goals`, `Meal`.
