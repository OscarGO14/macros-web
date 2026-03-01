# Global Recipes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hacer las recetas globales (visibles y editables por todos los usuarios autenticados), igual que los ingredientes.

**Architecture:** 5 cambios quirúrgicos: tipo Recipe (userId opcional), reglas Firestore (write abierto), página add-recipe (eliminar tracking de propietario), hook useRecipes (eliminar dependencia de userId), y título de lista. Sin nuevos ficheros.

**Tech Stack:** TypeScript, Firebase Firestore, Next.js App Router, React hooks

---

### Task 1: Hacer `userId` opcional en el tipo Recipe

**Files:**
- Modify: `src/types/recipe.ts`

**Step 1: Aplicar el cambio**

Reemplazar el contenido de `src/types/recipe.ts` con:

```ts
import { Macros } from '@/types/macros';

export type RecipeIngredient = {
  ingredientId: string;
  quantity: number;
};

export interface Recipe {
  id: string;
  userId?: string; // Opcional: las recetas son globales, sin propietario
  name: string;
  ingredients: RecipeIngredient[];
  macros: Macros;
  serves: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 2: Verificar que compila sin errores**

```bash
npm run build 2>&1 | head -30
```

Expected: sin errores de TypeScript relacionados con `userId`.

**Step 3: Commit**

```bash
git add src/types/recipe.ts
git commit -m "feat(recipes): make userId optional — recipes are now global"
```

---

### Task 2: Actualizar reglas de Firestore

**Files:**
- Modify: `firestore.rules`

**Step 1: Aplicar el cambio**

Reemplazar el bloque de recipes en `firestore.rules`:

```
// Antes:
match /recipes/{recipeId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated()
                && request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated()
                        && resource.data.userId == request.auth.uid;
}

// Después:
match /recipes/{recipeId} {
  allow read, write: if isAuthenticated();
}
```

El fichero completo resultante debe quedar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    // Usuarios: solo el propietario puede leer/escribir su propio documento
    match /users/{uid} {
      allow read, write: if isAuthenticated() && request.auth.uid == uid;
    }

    // Ingredientes: cualquier usuario autenticado puede leer y escribir
    match /ingredients/{ingredientId} {
      allow read, write: if isAuthenticated();
    }

    // Recetas: cualquier usuario autenticado puede leer y escribir
    match /recipes/{recipeId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

**Step 2: Desplegar las reglas a Firebase**

```bash
npx firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

Si no tienes `firebase-tools` instalado globalmente:
```bash
npx firebase-tools deploy --only firestore:rules
```

**Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(recipes): open firestore rules — any auth user can write recipes"
```

---

### Task 3: Simplificar el hook `useRecipes`

**Files:**
- Modify: `src/hooks/useRecipes.ts`

**Step 1: Reemplazar el contenido del fichero**

```ts
import { useState, useEffect } from 'react';
import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { recipesCollection } from '@/services/firebase';
import { Recipe } from '@/types/recipe';

/**
 * Hook para obtener todas las recetas en tiempo real desde Firestore.
 * Las recetas son globales: visibles y editables por cualquier usuario autenticado.
 */
export const useRecipes = () => {
  const [data, setData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe = () => {};

    try {
      unsubscribe = onSnapshot(
        recipesCollection,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              name: data.name || 'Sin nombre',
              ingredients: data.ingredients || [],
              macros: data.macros || { calories: 0, proteins: 0, carbs: 0, fats: 0 },
              serves: data.serves || 1,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Recipe;
          });
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error('Firebase listener error for recipesCollection:', err);
          setError(err as Error);
          setLoading(false);
        },
      );
    } catch (err) {
      console.error('Error setting up listener for recipesCollection:', err);
      setError(err as Error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  return { data, loading, error };
};
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | head -30
```

Expected: sin errores.

**Step 3: Commit**

```bash
git add src/hooks/useRecipes.ts
git commit -m "refactor(recipes): simplify useRecipes — remove userId dependency"
```

---

### Task 4: Limpiar `add-recipe/page.tsx`

**Files:**
- Modify: `src/app/ingredients/add-recipe/page.tsx`

**Step 1: Reemplazar el contenido del fichero**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { recipesCollection } from '@/services/firebase';
import { Ingredient } from '@/types/ingredient';
import { Macros } from '@/types/macros';
import { ItemType } from '@/types/itemType';
import { SearchableItem } from '@/components/SearchItemModal/types';
import SearchItemModal from '@/components/SearchItemModal';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';
import InputText from '@/components/ui/InputText';
import ActionButton from '@/components/ui/ActionButton';
import Item from '@/components/ui/Item';
import { StatsCard } from '@/components/ui/StatsCard';

interface SelectedIngredientData {
  ingredient: Ingredient;
  quantity: number;
}

const initialMacros: Macros = { calories: 0, proteins: 0, carbs: 0, fats: 0 };

export default function AddRecipePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [selectedIngredientsData, setSelectedIngredientsData] = useState<SelectedIngredientData[]>([]);
  const [serves, setServes] = useState('1');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMacros, setCurrentMacros] = useState<Macros>(initialMacros);

  const handleIngredientSelected = (ingredient: Ingredient, quantity: number) => {
    setSelectedIngredientsData((prev) => [...prev, { ingredient, quantity }]);
    setIsModalVisible(false);
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredientsData((prev) =>
      prev.filter((item) => item.ingredient.id !== ingredientId),
    );
  };

  const calculateRecipeMacros = (
    ingredientsData: SelectedIngredientData[],
    numServes: number,
  ): Macros => {
    const total: Macros = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    ingredientsData.forEach((item) => {
      const factor = item.quantity / 100;
      total.calories += (item.ingredient.calories || 0) * factor;
      total.proteins += (item.ingredient.proteins || 0) * factor;
      total.carbs += (item.ingredient.carbs || 0) * factor;
      total.fats += (item.ingredient.fats || 0) * factor;
    });
    return {
      calories: parseFloat((total.calories / numServes).toFixed(2)),
      proteins: parseFloat((total.proteins / numServes).toFixed(2)),
      carbs: parseFloat((total.carbs / numServes).toFixed(2)),
      fats: parseFloat((total.fats / numServes).toFixed(2)),
    };
  };

  useEffect(() => {
    const numServes = parseInt(serves, 10) || 1;
    if (selectedIngredientsData.length > 0) {
      setCurrentMacros(calculateRecipeMacros(selectedIngredientsData, numServes));
    } else {
      setCurrentMacros(initialMacros);
    }
  }, [selectedIngredientsData, serves]);

  const handleSaveRecipe = async () => {
    if (name.trim() === '') {
      toast.error('El nombre de la receta no puede estar vacío.');
      return;
    }

    setLoading(true);
    const numServes = parseInt(serves, 10) || 1;
    const newRecipeData = {
      name: name.trim(),
      ingredients: selectedIngredientsData.map((item) => ({
        ingredientId: item.ingredient.id,
        quantity: item.quantity,
      })),
      macros: currentMacros,
      serves: numServes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addDoc(recipesCollection, newRecipeData);
      toast.success('Receta guardada correctamente.');
      router.back();
    } catch (error) {
      toast.error(`Error al guardar la receta: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItemWrapper = (item: SearchableItem, quantity: number) => {
    if ('calories' in item) {
      handleIngredientSelected(item as Ingredient, quantity);
    } else {
      toast.error('Se intentó añadir un tipo de item incorrecto.');
    }
  };

  return (
    <Screen>
      <div className="flex flex-col gap-3 pb-10">
        <InputText
          label="Nombre de la receta"
          placeholder="Ej: Lentejas de la abuela"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mb-2">
          <p className="text-primary font-semibold mb-2">Lista de ingredientes:</p>
          <div className="min-h-28">
            {selectedIngredientsData.length === 0 ? (
              <p className="text-alternate italic text-center p-4">
                Añade ingredientes a tu receta
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selectedIngredientsData.map((item) => (
                  <li key={item.ingredient.id}>
                    <Item
                      name={item.ingredient.name}
                      calories={item.ingredient.calories}
                      type={ItemType.INGREDIENT}
                      onDelete={() => removeIngredient(item.ingredient.id)}
                      showType={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ActionButton
            onPress={() => setIsModalVisible(true)}
            label="Añadir ingrediente"
            disabled={isModalVisible}
          />
        </div>

        <InputText
          label="Raciones por receta"
          placeholder="Ej: 2 (para cuántas comidas rinde)"
          type="number"
          value={serves}
          onChange={(e) => setServes(e.target.value)}
        />

        <StatsCard
          title="Macros por ración"
          value={currentMacros.calories.toFixed(0)}
          variant="primary"
          trend={[
            `P: ${currentMacros.proteins.toFixed(1)}`,
            `C: ${currentMacros.carbs.toFixed(1)}`,
            `G: ${currentMacros.fats.toFixed(1)}`,
          ]}
        />

        <SubmitButton
          label={loading ? 'Guardando...' : 'Guardar receta'}
          onPress={handleSaveRecipe}
          disabled={loading}
        />

        <SearchItemModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectItem={handleSelectItemWrapper}
          itemTypes={['ingredient']}
        />
      </div>
    </Screen>
  );
}
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | head -30
```

Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/ingredients/add-recipe/page.tsx
git commit -m "feat(recipes): remove userId and customRecipeIds tracking from add-recipe"
```

---

### Task 5: Cambiar título en la lista de recetas

**Files:**
- Modify: `src/app/ingredients/recipes-list/page.tsx`

**Step 1: Cambiar el título**

En `src/app/ingredients/recipes-list/page.tsx`, línea 17, cambiar:

```tsx
// Antes:
<p className="text-lg font-semibold text-primary">Mis recetas</p>

// Después:
<p className="text-lg font-semibold text-primary">Recetas</p>
```

**Step 2: Verificar compilación y lint**

```bash
npm run build 2>&1 | head -30
```

Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/ingredients/recipes-list/page.tsx
git commit -m "feat(recipes): rename 'Mis recetas' to 'Recetas'"
```

---

### Task 6: Verificación manual en el navegador

**Step 1: Levantar el servidor de desarrollo**

```bash
npm run dev
```

**Step 2: Verificar con el usuario de prueba**

1. Ir a `http://localhost:3000`
2. Login con `test@test.com` / `test12`
3. Navegar a **Ingredientes → Recetas**
4. Verificar que el título dice **"Recetas"** (no "Mis recetas")
5. Crear una receta nueva — debe guardarse sin errores
6. Verificar en Firebase Console → Firestore → colección `recipes` que el nuevo documento **no tiene campo `userId`**
7. Verificar que las recetas existentes (con `userId`) siguen apareciendo en la lista

**Step 3: Commit final si todo OK**

```bash
git add .
git commit -m "chore: verify global recipes working correctly"
```

---

## Resumen de ficheros modificados

| Fichero | Cambio |
|---|---|
| `src/types/recipe.ts` | `userId: string` → `userId?: string` |
| `firestore.rules` | Regla recipes: `allow read, write: if isAuthenticated()` |
| `src/hooks/useRecipes.ts` | Eliminar dependencia de userId, simplificar useEffect |
| `src/app/ingredients/add-recipe/page.tsx` | Eliminar userId y customRecipeIds del guardado |
| `src/app/ingredients/recipes-list/page.tsx` | Título "Mis recetas" → "Recetas" |
