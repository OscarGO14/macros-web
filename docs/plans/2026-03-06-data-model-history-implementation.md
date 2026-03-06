# Data Model & History Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cambiar el historial de claves por día-de-semana a claves `YYYY-MM-DD`, añadir stats mensuales en el dashboard, y limpiar campos obsoletos del modelo.

**Architecture:** Opción A — todo en el documento de usuario, clave `YYYY-MM-DD`, purga de entradas con >2 meses en cada escritura, stats mensuales calculados en cliente. Sin cambios en SyncService ni en la estructura de colecciones Firestore.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Firebase Firestore, Zustand, Recharts

---

### Task 1: Actualizar tipos — `history.ts` e `ingredient.ts`

**Files:**
- Modify: `src/types/history.ts`
- Modify: `src/types/ingredient.ts`

**Step 1: Reemplazar `src/types/history.ts`**

```ts
import { Macros } from '@/types/macros';
import { Meal } from '@/types/meal';

export interface DailyLog {
  meals: Meal[];
  totalMacros: Macros;
}

// Clave: "YYYY-MM-DD"
export type History = Record<string, DailyLog>;
```

Eliminar: `DayOfWeek`, `dayOfWeekArray`, `import { Timestamp }`, campo `date` en `DailyLog`.

**Step 2: Eliminar `userId?` de `src/types/ingredient.ts`**

```ts
export interface Ingredient {
  id: string;
  name: string;
  category?: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}
```

**Step 3: Verificar que el build falla con errores esperados**

```bash
npm run build 2>&1 | grep -E "error TS" | head -30
```

Esperado: errores en los archivos que usan `DayOfWeek`, `date`, `userId`. Esto es correcto — los arreglamos en las tareas siguientes.

**Step 4: Commit**

```bash
git add src/types/history.ts src/types/ingredient.ts
git commit -m "refactor(types): replace DayOfWeek with YYYY-MM-DD key, remove date from DailyLog, remove unused userId from Ingredient"
```

---

### Task 2: Crear utils nuevos

**Files:**
- Create: `src/utils/getToday.ts`
- Create: `src/utils/getCurrentWeekDates.ts`
- Create: `src/utils/purgeOldHistory.ts`
- Create: `src/utils/getMonthStats.ts`

**Step 1: Crear `src/utils/getToday.ts`**

Devuelve la fecha de hoy en zona Europe/Madrid en formato `YYYY-MM-DD`.

```ts
// Devuelve "YYYY-MM-DD" en hora de Madrid
export const getToday = (): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
  }).format(new Date());
};
```

> Nota: el locale `sv-SE` formatea fechas como `YYYY-MM-DD` nativamente.

**Step 2: Crear `src/utils/getCurrentWeekDates.ts`**

Devuelve array de 7 strings `YYYY-MM-DD` para la semana actual, Lunes a Domingo.

```ts
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
```

**Step 3: Crear `src/utils/purgeOldHistory.ts`**

```ts
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
```

**Step 4: Crear `src/utils/getMonthStats.ts`**

```ts
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
```

**Step 5: Verificar compilación parcial**

```bash
npm run build 2>&1 | grep -E "error TS" | head -30
```

Los nuevos utils no deberían añadir errores.

**Step 6: Commit**

```bash
git add src/utils/getToday.ts src/utils/getCurrentWeekDates.ts src/utils/purgeOldHistory.ts src/utils/getMonthStats.ts
git commit -m "feat(utils): add getToday, getCurrentWeekDates, purgeOldHistory, getMonthStats"
```

---

### Task 3: Actualizar `dailyLogCalculator.ts` y `createEmptyDailyLog.ts`

**Files:**
- Modify: `src/utils/dailyLogCalculator.ts`
- Modify: `src/utils/createEmpytDailyLog.ts`

**Step 1: Reemplazar `src/utils/dailyLogCalculator.ts`**

Eliminar la dependencia de `Timestamp` y el check de fecha (la clave ya garantiza que es el día correcto).

```ts
import { ConsumedItem, Meal } from '@/types/meal';
import { DailyLog } from '@/types/history';
import { Macros } from '@/types/macros';

export const dailyLogCalculator = (
  dailyLog: DailyLog | undefined,
  currentMealItems: ConsumedItem[],
  totalMealMacros: Macros,
): DailyLog => {
  const existingLog: DailyLog = dailyLog ?? {
    meals: [],
    totalMacros: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
  };

  const updatedMeals: Meal[] = [
    ...existingLog.meals,
    { items: currentMealItems, totalMacros: totalMealMacros },
  ];

  return {
    meals: updatedMeals,
    totalMacros: {
      calories: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.calories, 0),
      proteins: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.proteins, 0),
      carbs: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.carbs, 0),
      fats: updatedMeals.reduce((acc, meal) => acc + meal.totalMacros.fats, 0),
    },
  };
};
```

**Step 2: Reemplazar `src/utils/createEmpytDailyLog.ts`**

Eliminar `date` y la dependencia de `Timestamp`.

```ts
import { DailyLog } from '@/types/history';

export const createEmptyDailyLog = (): DailyLog => ({
  meals: [],
  totalMacros: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
});
```

**Step 3: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -30
```

**Step 4: Commit**

```bash
git add src/utils/dailyLogCalculator.ts src/utils/createEmpytDailyLog.ts
git commit -m "refactor(utils): remove date field from dailyLogCalculator and createEmptyDailyLog"
```

---

### Task 4: Actualizar `translator.ts` y `BarChart`

**Files:**
- Modify: `src/utils/translator.ts`
- Modify: `src/components/BarChart/index.tsx`

**Step 1: Reemplazar `src/utils/translator.ts`**

`DayOfWeek` ya no existe. El helper `formatDay` se elimina; `getDayLabel` en `getCurrentWeekDates.ts` cumple su función. Dejamos el archivo vacío o lo eliminamos. Lo más limpio es eliminarlo y actualizar las importaciones.

Eliminar el archivo `src/utils/translator.ts` (se borrará en el commit de BarChart).

**Step 2: Reemplazar `src/components/BarChart/index.tsx`**

```tsx
'use client';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MyColors } from '@/types/colors';
import { History } from '@/types/history';
import { getDayLabel } from '@/utils/getCurrentWeekDates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: MyColors.ALTERNATE,
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        <p style={{ color: MyColors.PRIMARY, fontSize: 12 }}>{payload[0].value} kcal</p>
      </div>
    );
  }
  return null;
};

const BarChartComponent = ({
  history = {},
  today,
  weekDates,
  dailyGoal = 1700,
}: {
  history?: History;
  today: string;
  weekDates: string[];
  dailyGoal?: number;
}) => {
  const barData = useMemo(
    () =>
      weekDates.map((date) => {
        const dayCalories = history?.[date]?.totalMacros?.calories ?? 0;
        const isToday = date === today;

        let color: string = MyColors.ALTERNATE;
        if (dayCalories > 0) {
          if (dayCalories > dailyGoal * 0.9 && dayCalories < dailyGoal * 1.05) {
            color = MyColors.ACCENT;
          } else if (dayCalories < dailyGoal * 0.9) {
            color = MyColors.PRIMARY;
          } else {
            color = MyColors.DANGER;
          }
        }

        return {
          name: getDayLabel(date),
          value: dayCalories,
          color,
          labelColor: isToday ? MyColors.ACCENT : MyColors.ALTERNATE,
        };
      }),
    [history, dailyGoal, weekDates, today],
  );

  return (
    <div className="flex flex-col items-center w-full rounded-lg gap-2">
      <p className="text-lg font-semibold text-alternate">Semana actual</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke={MyColors.ALTERNATE}
            tick={{ fill: MyColors.ALTERNATE, fontSize: 12 }}
          />
          <YAxis
            stroke={MyColors.ALTERNATE}
            tick={{ fill: MyColors.ALTERNATE, fontSize: 11 }}
            domain={[0, 2200]}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <ReferenceLine
            y={dailyGoal}
            stroke={MyColors.ACCENT}
            strokeDasharray="4 4"
            strokeWidth={2}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={28}>
            {barData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rotate-45"
          style={{ backgroundColor: MyColors.ACCENT }}
        />
        <p className="text-xs text-primary">Objetivo: {dailyGoal} kcal</p>
      </div>
    </div>
  );
};

export default BarChartComponent;
```

**Step 3: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -30
```

**Step 4: Commit**

```bash
git add src/components/BarChart/index.tsx
git rm src/utils/translator.ts
git commit -m "refactor(barchart): use YYYY-MM-DD dates and weekDates prop, remove translator.ts"
```

---

### Task 5: Actualizar `dashboard/page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Reescribir `src/app/dashboard/page.tsx`**

Eliminar: `useState`, `useEffect`, lógica de `createEmptyDailyLog`, `isFromToday`, `getDayOfWeek`.
Añadir: `getToday`, `getCurrentWeekDates`, `getMonthStats`, `getPrevMonthPrefix`, `StatsCard`.

```tsx
'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { getToday } from '@/utils/getToday';
import { getCurrentWeekDates } from '@/utils/getCurrentWeekDates';
import { getMonthStats, getPrevMonthPrefix } from '@/utils/getMonthStats';
import DoughnutChart from '@/components/DoughnutChart';
import BarChartComponent from '@/components/BarChart';
import Screen from '@/components/ui/Screen';
import SettingsItem from '@/components/ui/SettingsItem';
import { SettingsControlType } from '@/components/ui/SettingsItem/types';
import { StatsCard } from '@/components/ui/StatsCard';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const today = useMemo(() => getToday(), []);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const objective = user?.dailyGoals?.calories;
  const consumed = user?.history?.[today]?.totalMacros?.calories ?? 0;

  const currentMonthPrefix = useMemo(() => today.slice(0, 7), [today]);
  const prevMonthPrefix = useMemo(() => getPrevMonthPrefix(currentMonthPrefix), [currentMonthPrefix]);

  const currentMonthStats = useMemo(
    () => getMonthStats(user?.history ?? {}, currentMonthPrefix),
    [user?.history, currentMonthPrefix],
  );
  const prevMonthStats = useMemo(
    () => getMonthStats(user?.history ?? {}, prevMonthPrefix),
    [user?.history, prevMonthPrefix],
  );

  return (
    <Screen>
      <div className="flex flex-col items-center justify-evenly gap-4 flex-1">
        <div className="flex items-center justify-center">
          <p className="text-xl text-primary text-center py-4">
            Hola {user?.displayName || 'colega'}
          </p>
        </div>

        {objective !== undefined && (
          <DoughnutChart data={{ objective, consumed }} />
        )}

        {user && (
          <BarChartComponent
            history={user.history}
            today={today}
            weekDates={weekDates}
            dailyGoal={user.dailyGoals?.calories}
          />
        )}

        {currentMonthStats.daysLogged > 0 && (
          <div className="flex gap-3 w-full">
            <div className="flex-1">
              <StatsCard
                title={`Media ${currentMonthPrefix.slice(5)}`}
                value={currentMonthStats.avgCalories}
                variant="primary"
                trend={[
                  `Días: ${currentMonthStats.daysLogged}`,
                  `P: ${currentMonthStats.avgProteins}`,
                ]}
              />
            </div>
            {prevMonthStats.daysLogged > 0 && (
              <div className="flex-1">
                <StatsCard
                  title={`Media ${prevMonthPrefix.slice(5)}`}
                  value={prevMonthStats.avgCalories}
                  variant="secondary"
                  trend={[
                    `Días: ${prevMonthStats.daysLogged}`,
                    `P: ${prevMonthStats.avgProteins}`,
                  ]}
                />
              </div>
            )}
          </div>
        )}

        <SettingsItem
          label="Añadir comida"
          controlType={SettingsControlType.ARROW_ONLY}
          onPress={() => router.push('/meals/add-meal')}
        />
      </div>
    </Screen>
  );
}
```

> Nota: Se elimina el `useEffect` que creaba un log vacío en Firestore al cargar el dashboard. Ese comportamiento era un antipatrón — con el nuevo modelo, el log solo se crea al guardar una comida.

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -30
```

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): use date-based history, add weekly chart and monthly stats cards"
```

---

### Task 6: Actualizar `meals/page.tsx`, `add-meal/page.tsx` y `useHistoryData.ts`

**Files:**
- Modify: `src/app/meals/page.tsx`
- Modify: `src/app/meals/add-meal/page.tsx`
- Modify: `src/hooks/useHistoryData.ts`

**Step 1: Actualizar `src/app/meals/page.tsx`**

Reemplazar `getDayOfWeek()` por `getToday()`. No hay más cambios necesarios.

```tsx
// Cambiar:
import { getDayOfWeek } from '@/utils/getDayOfWeek';
// ...
const today = useMemo(() => getDayOfWeek(), []);

// Por:
import { getToday } from '@/utils/getToday';
// ...
const today = useMemo(() => getToday(), []);
```

También actualizar `deleteMealsForToday` — ya usa `createEmptyDailyLog()` que ahora no tiene `date`. No hay más cambios.

**Step 2: Actualizar `src/app/meals/add-meal/page.tsx`**

```tsx
// Añadir imports:
import { getToday } from '@/utils/getToday';
import { purgeOldHistory } from '@/utils/purgeOldHistory';

// En handleSaveMeal, reemplazar:
const today = getDayOfWeek();
const dailyLog = dailyLogCalculator(user.history?.[today], currentMealItems, totalMealMacros);
const updatedUserData = { ...user, history: { ...user.history, [today]: dailyLog } };
// ...
await updateUser(user.uid, { history: { ...user.history, [today]: dailyLog } });

// Por:
const today = getToday();
const dailyLog = dailyLogCalculator(user.history?.[today], currentMealItems, totalMealMacros);
const cleanHistory = purgeOldHistory({ ...user.history, [today]: dailyLog });
const updatedUserData = { ...user, history: cleanHistory };
// ...
await updateUser(user.uid, { history: cleanHistory });
```

Eliminar el import de `getDayOfWeek`.

**Step 3: Actualizar `src/hooks/useHistoryData.ts`**

```ts
// Cambiar:
import { getDayOfWeek } from '@/utils/getDayOfWeek';
// ...
const today = getDayOfWeek();

// Por:
import { getToday } from '@/utils/getToday';
// ...
const today = getToday();
```

**Step 4: Verificar compilación sin errores**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores de TypeScript ni de build.

**Step 5: Commit**

```bash
git add src/app/meals/page.tsx src/app/meals/add-meal/page.tsx src/hooks/useHistoryData.ts
git commit -m "refactor(meals): replace getDayOfWeek with getToday, add purgeOldHistory on save"
```

---

### Task 7: Eliminar `getDayOfWeek.ts` y `dateUtils.ts`

**Files:**
- Delete: `src/utils/getDayOfWeek.ts`
- Modify: `src/utils/dateUtils.ts` (eliminar `getCurrentWeekDate` e `isFromToday` que ya no se usan)

**Step 1: Verificar que `getDayOfWeek` ya no se importa en ningún archivo**

```bash
grep -r "getDayOfWeek\|isFromToday\|getCurrentWeekDate" src/ --include="*.ts" --include="*.tsx"
```

Esperado: sin resultados (si quedan referencias, arreglarlas antes de continuar).

**Step 2: Eliminar `getDayOfWeek.ts`**

```bash
git rm src/utils/getDayOfWeek.ts
```

**Step 3: Limpiar `dateUtils.ts`**

Solo queda `isSameDay` que puede ser útil. Eliminar `getCurrentWeekDate` e `isFromToday`:

```ts
// src/utils/dateUtils.ts
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};
```

Si `isSameDay` tampoco se usa, eliminar el archivo entero.

**Step 4: Verificar compilación final sin errores**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: build limpio.

**Step 5: Commit**

```bash
git add src/utils/dateUtils.ts
git rm src/utils/getDayOfWeek.ts
git commit -m "chore: remove getDayOfWeek and unused dateUtils functions"
```

---

### Task 8: Verificación manual en el navegador

**Step 1: Levantar el servidor**

```bash
npm run dev
```

**Step 2: Verificar en el navegador (usar MCP devtools)**

1. `/dashboard` — debe cargar sin errores. Mostrar nombre, doughnut, barchart con días de la semana actual (Lun–Dom con fechas reales).

2. Añadir una comida desde `/meals/add-meal` → guardar → verificar que el dashboard actualiza el doughnut y el día correcto en el BarChart.

3. `/dashboard` → verificar que las `StatsCard` de stats mensuales aparecen después de registrar al menos un día.

4. Verificar en Firebase Console (`users/{uid}.history`) que la clave es `"YYYY-MM-DD"` y no `"monday"`.

5. `/meals` → "Borrar comidas" → verificar que funciona correctamente.

**Step 3: Commit final de verificación**

```bash
git add .
git commit -m "chore: verify data model redesign working end-to-end"
```

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/types/history.ts` | Eliminar `DayOfWeek`, `date`, cambiar `History` |
| `src/types/ingredient.ts` | Eliminar `userId?` |
| `src/utils/getToday.ts` | Nuevo |
| `src/utils/getCurrentWeekDates.ts` | Nuevo (incluye `getDayLabel`) |
| `src/utils/purgeOldHistory.ts` | Nuevo |
| `src/utils/getMonthStats.ts` | Nuevo (incluye `getPrevMonthPrefix`) |
| `src/utils/dailyLogCalculator.ts` | Eliminar `date`, simplificar |
| `src/utils/createEmpytDailyLog.ts` | Eliminar `date` |
| `src/utils/translator.ts` | Eliminar |
| `src/utils/getDayOfWeek.ts` | Eliminar |
| `src/utils/dateUtils.ts` | Limpiar funciones obsoletas |
| `src/components/BarChart/index.tsx` | Usar `weekDates: string[]` y labels de fecha |
| `src/app/dashboard/page.tsx` | Simplificar, añadir stats mensuales |
| `src/app/meals/page.tsx` | Usar `getToday()` |
| `src/app/meals/add-meal/page.tsx` | Usar `getToday()` + `purgeOldHistory()` |
| `src/hooks/useHistoryData.ts` | Usar `getToday()` |
