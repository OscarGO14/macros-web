# Ingredient Store Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el `onSnapshot` de `useIngredients` con un Zustand store en memoria que carga los ingredientes una sola vez por sesión vía `getDocs`.

**Architecture:** Nuevo `ingredientStore` (Zustand, sin persist) expone `loadIngredients()` (idempotente) y `addIngredient()`. `useIngredients` se reescribe para leer del store. `add-ingredient/page.tsx` llama a `store.addIngredient()` tras escribir en Firestore.

**Tech Stack:** Zustand 5, Firebase JS SDK v12 (`getDocs`), TypeScript, Next.js App Router

---

### Task 1: Crear `ingredientStore.ts`

**Files:**
- Create: `src/store/ingredientStore.ts`

**Step 1: Crear el archivo**

```ts
// src/store/ingredientStore.ts
import { create } from 'zustand';
import { getDocs } from 'firebase/firestore';
import { ingredientsCollection } from '@/services/firebase';
import { Ingredient } from '@/types/ingredient';

interface IngredientState {
  ingredients: Ingredient[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: Error | null;
  loadIngredients: () => Promise<void>;
  addIngredient: (ingredient: Ingredient) => void;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  status: 'idle',
  error: null,

  loadIngredients: async () => {
    if (get().status === 'loaded' || get().status === 'loading') return;

    set({ status: 'loading', error: null });
    try {
      const snapshot = await getDocs(ingredientsCollection);
      const ingredients = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name ?? 'Desconocido',
        category: doc.data().category ?? 'Sin categoría',
        calories: doc.data().calories ?? 0,
        proteins: doc.data().proteins ?? 0,
        carbs: doc.data().carbs ?? 0,
        fats: doc.data().fats ?? 0,
      } as Ingredient));
      set({ ingredients, status: 'loaded' });
    } catch (err) {
      set({ error: err as Error, status: 'error' });
    }
  },

  addIngredient: (ingredient: Ingredient) => {
    set(state => ({ ingredients: [...state.ingredients, ingredient] }));
  },
}));
```

**Step 2: Verificar que compila**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores de TypeScript referentes a `ingredientStore`.

**Step 3: Commit**

```bash
git add src/store/ingredientStore.ts
git commit -m "feat(store): add ingredientStore with session-scoped caching"
```

---

### Task 2: Reescribir `useIngredients.ts`

**Files:**
- Modify: `src/hooks/useIngredients.ts`

**Step 1: Reemplazar el contenido del hook**

```ts
// src/hooks/useIngredients.ts
import { useEffect } from 'react';
import { useIngredientStore } from '@/store/ingredientStore';

export const useIngredients = () => {
  const { ingredients, status, error, loadIngredients } = useIngredientStore();

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  return {
    data: ingredients,
    loading: status === 'idle' || status === 'loading',
    error,
  };
};
```

**Step 2: Verificar que compila**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores. La página `ingredients-list/page.tsx` usa `useIngredients` con la misma interfaz `{ data, loading, error }` — no necesita cambios.

**Step 3: Commit**

```bash
git add src/hooks/useIngredients.ts
git commit -m "refactor(hook): rewrite useIngredients to use ingredientStore"
```

---

### Task 3: Actualizar `add-ingredient/page.tsx`

**Files:**
- Modify: `src/app/ingredients/add-ingredient/page.tsx`

**Step 1: Importar el store**

Añadir al bloque de imports existente:

```ts
import { useIngredientStore } from '@/store/ingredientStore';
```

**Step 2: Usar `addIngredient` del store**

Dentro del componente, tras las declaraciones de `useState` existentes, añadir:

```ts
const addIngredientToStore = useIngredientStore(s => s.addIngredient);
```

**Step 3: Llamar a `addIngredientToStore` tras el `addDoc`**

En `handleSubmit`, reemplazar el bloque `try` existente:

```ts
    try {
      const ingredientData = {
        name,
        category: category || 'Sin categoría',
        calories: parseFloat(calories),
        proteins: parseFloat(proteins),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
      };
      const docRef = await addDoc(collection(db, Collections.INGREDIENTS), ingredientData);
      addIngredientToStore({ id: docRef.id, ...ingredientData });
      toast.success('Ingrediente añadido correctamente.');
      setName('');
      setCategory('');
      setCalories('');
      setProteins('');
      setCarbs('');
      setFats('');
    } catch (error) {
      toast.error(`Error al guardar el ingrediente: ${error}`);
    }
```

**Step 4: Verificar que compila**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 5: Commit**

```bash
git add src/app/ingredients/add-ingredient/page.tsx
git commit -m "feat(ingredients): update store after adding new ingredient"
```

---

### Task 4: Verificar en el navegador

**Step 1: Levantar el dev server (si no está corriendo)**

```bash
npm run dev
```

**Step 2: Abrir http://localhost:3000 y autenticarse con `test@test.com` / `test12`**

**Step 3: Verificar lista de ingredientes**

- Ir a `/ingredients/ingredients-list`
- Debe cargar los ingredientes (primera vez: red, `status: loading → loaded`)
- Navegar a otra pantalla y volver — debe ser instantáneo (sin loading)

**Step 4: Verificar añadir ingrediente**

- Ir a `/ingredients/add-ingredient`
- Añadir un ingrediente de prueba
- Volver a la lista — el nuevo ingrediente debe aparecer sin recargar

**Step 5: Verificar en DevTools que no hay llamadas extra a Firestore**

En Network, filtrar por `firestore.googleapis.com`:
- Primera visita a la lista: 1 request
- Navegación posterior: 0 requests adicionales

**Step 6: Commit final**

```bash
git add .
git commit -m "chore: verify ingredient store caching works end-to-end"
```

---

## Archivos Creados/Modificados

| Archivo | Acción |
|---|---|
| `src/store/ingredientStore.ts` | Crear |
| `src/hooks/useIngredients.ts` | Reescribir |
| `src/app/ingredients/add-ingredient/page.tsx` | Modificar |
