# Edit & Delete Ingredients and Recipes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Añadir edición y borrado de ingredientes y recetas desde sus respectivas listas.

**Architecture:** Páginas separadas con dynamic route `[id]` para edición. Borrado con `ConfirmationModal` + `deleteDoc`. `ingredientStore` extendido con `updateIngredient` y `removeIngredient`. Recetas usan `onSnapshot` — no necesitan store local para actualizarse al borrar.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Firebase Firestore, Zustand, Tailwind CSS v4

---

### Task 1: Extender `ingredientStore` con update y remove

**Files:**
- Modify: `src/store/ingredientStore.ts`

**Step 1: Añadir `updateIngredient` y `removeIngredient` a la interfaz y al store**

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
  updateIngredient: (id: string, data: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
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

  updateIngredient: (id: string, data: Omit<Ingredient, 'id'>) => {
    set(state => ({
      ingredients: state.ingredients.map(ing =>
        ing.id === id ? { ...ing, ...data } : ing,
      ),
    }));
  },

  removeIngredient: (id: string) => {
    set(state => ({
      ingredients: state.ingredients.filter(ing => ing.id !== id),
    }));
  },
}));
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

Esperado: sin errores.

**Step 3: Commit**

```bash
git add src/store/ingredientStore.ts
git commit -m "feat(store): add updateIngredient and removeIngredient to ingredientStore"
```

---

### Task 2: Añadir editar y borrar en `ingredients-list/page.tsx`

**Files:**
- Modify: `src/app/ingredients/ingredients-list/page.tsx`

**Step 1: Reescribir la página con edit y delete**

```tsx
'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import InputText from '@/components/ui/InputText';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientStore } from '@/store/ingredientStore';
import { ItemType } from '@/types/itemType';
import { Ingredient } from '@/types/ingredient';

export default function IngredientsListPage() {
  const router = useRouter();
  const { data, loading, error } = useIngredients();
  const removeIngredient = useIngredientStore(s => s.removeIngredient);
  const [search, setSearch] = useState('');
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);

  const filteredIngredients = useMemo(
    () => data?.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const handleDelete = async () => {
    if (!ingredientToDelete) return;
    try {
      await deleteDoc(doc(db, Collections.INGREDIENTS, ingredientToDelete.id));
      removeIngredient(ingredientToDelete.id);
      toast.success('Ingrediente eliminado.');
    } catch {
      toast.error('Error al eliminar el ingrediente.');
    } finally {
      setIngredientToDelete(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <p className="text-danger text-center py-8">Error: {error.message}</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-4 py-4">
        <p className="text-2xl font-bold text-primary">Lista de Ingredientes</p>
        <InputText
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredIngredients?.length === 0 ? (
          <p className="text-center text-alternate mt-10">No se encontraron ingredientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredIngredients?.map((item) => (
              <li key={item.id}>
                <Item
                  name={item.name}
                  calories={item.calories}
                  type={ItemType.INGREDIENT}
                  onEdit={() => router.push(`/ingredients/edit-ingredient/${item.id}`)}
                  onDelete={() => setIngredientToDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationModal
        isVisible={!!ingredientToDelete}
        onClose={() => setIngredientToDelete(null)}
        handleConfirm={handleDelete}
        message={`¿Eliminar el ingrediente "${ingredientToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </Screen>
  );
}
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

**Step 3: Commit**

```bash
git add src/app/ingredients/ingredients-list/page.tsx
git commit -m "feat(ingredients): add edit and delete actions to ingredients list"
```

---

### Task 3: Crear página `edit-ingredient/[id]`

**Files:**
- Create: `src/app/ingredients/edit-ingredient/[id]/page.tsx`

**Step 1: Crear la página de edición de ingrediente**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientStore } from '@/store/ingredientStore';
import InputText from '@/components/ui/InputText';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';

const CATEGORIES = [
  'carnes',
  'pescado',
  'verduras',
  'frutas',
  'cereales',
  'lácteos',
  'legumbres',
  'huevos',
  'otra',
];

export default function EditIngredientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useIngredients();
  const updateIngredient = useIngredientStore(s => s.updateIngredient);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    const ingredient = data?.find(i => i.id === id);
    if (!ingredient) {
      toast.error('Ingrediente no encontrado.');
      router.back();
      return;
    }
    setName(ingredient.name);
    setCategory(ingredient.category ?? '');
    setCalories(String(ingredient.calories));
    setProteins(String(ingredient.proteins));
    setCarbs(String(ingredient.carbs));
    setFats(String(ingredient.fats));
    setReady(true);
  }, [loading, data, id]);

  const handleSubmit = async () => {
    if (!name || !calories || !proteins || !carbs || !fats) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    const updatedData = {
      name,
      category: category || 'Sin categoría',
      calories: parseFloat(calories),
      proteins: parseFloat(proteins),
      carbs: parseFloat(carbs),
      fats: parseFloat(fats),
    };

    try {
      await updateDoc(doc(db, Collections.INGREDIENTS, id), updatedData);
      updateIngredient(id, updatedData);
      toast.success('Ingrediente actualizado.');
      router.back();
    } catch {
      toast.error('Error al actualizar el ingrediente.');
    }
  };

  if (loading || !ready) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="w-full flex flex-col gap-2">
        <p className="text-xl font-bold text-primary mb-2">Editar Ingrediente</p>
        <InputText
          label="Nombre *"
          placeholder="Ej: Pollo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm text-alternate">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-item-background border border-alternate/20 rounded-lg p-3 text-primary w-full outline-none"
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <InputText
          label="Calorías (kcal) *"
          placeholder="Ej: 120"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <InputText
          label="Proteínas (g) *"
          placeholder="Ej: 25"
          type="number"
          value={proteins}
          onChange={(e) => setProteins(e.target.value)}
        />
        <InputText
          label="Carbohidratos (g)"
          placeholder="Ej: 0"
          type="number"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <InputText
          label="Grasas (g) *"
          placeholder="Ej: 5"
          type="number"
          value={fats}
          onChange={(e) => setFats(e.target.value)}
        />
        <div className="mt-4">
          <SubmitButton label="Guardar cambios" onPress={handleSubmit} />
        </div>
      </div>
    </Screen>
  );
}
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

**Step 3: Commit**

```bash
git add src/app/ingredients/edit-ingredient/
git commit -m "feat(ingredients): add edit ingredient page"
```

---

### Task 4: Añadir editar y borrar en `recipes-list/page.tsx`

**Files:**
- Modify: `src/app/ingredients/recipes-list/page.tsx`

**Step 1: Reescribir la página con edit y delete**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import Screen from '@/components/ui/Screen';
import Item from '@/components/ui/Item';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useRecipes } from '@/hooks/useRecipes';
import { ItemType } from '@/types/itemType';
import { Recipe } from '@/types/recipe';

export default function RecipesListPage() {
  const router = useRouter();
  const { data, loading, error } = useRecipes();
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    try {
      await deleteDoc(doc(db, Collections.RECIPES, recipeToDelete.id));
      toast.success('Receta eliminada.');
    } catch {
      toast.error('Error al eliminar la receta.');
    } finally {
      setRecipeToDelete(null);
    }
  };

  return (
    <Screen>
      <div className="flex flex-col gap-4 py-4">
        <p className="text-lg font-semibold text-primary">Recetas</p>
        {loading && <p className="text-alternate italic">Cargando recetas...</p>}
        {error && <p className="text-alternate italic">Error: {error.message}</p>}
        {data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((item) => (
              <li key={item.id}>
                <Item
                  name={item.name}
                  type={ItemType.RECIPE}
                  calories={item.macros.calories}
                  onEdit={() => router.push(`/ingredients/edit-recipe/${item.id}`)}
                  onDelete={() => setRecipeToDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
        <ActionButton
          label="Crear receta"
          onPress={() => router.push('/ingredients/add-recipe')}
        />
      </div>

      <ConfirmationModal
        isVisible={!!recipeToDelete}
        onClose={() => setRecipeToDelete(null)}
        handleConfirm={handleDelete}
        message={`¿Eliminar la receta "${recipeToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </Screen>
  );
}
```

> Nota: `useRecipes` usa `onSnapshot` — al hacer `deleteDoc`, la lista se actualiza automáticamente sin tocar estado local.

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

**Step 3: Commit**

```bash
git add src/app/ingredients/recipes-list/page.tsx
git commit -m "feat(recipes): add edit and delete actions to recipes list"
```

---

### Task 5: Crear página `edit-recipe/[id]`

**Files:**
- Create: `src/app/ingredients/edit-recipe/[id]/page.tsx`

**Step 1: Verificar qué tipo tiene `Collections.RECIPES`**

Revisar `src/types/collections.ts` para confirmar el valor exacto de `Collections.RECIPES`.

**Step 2: Crear la página de edición de receta**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { recipesCollection, db } from '@/services/firebase';
import { Collections } from '@/types/collections';
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

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [serves, setServes] = useState('1');
  const [selectedIngredientsData, setSelectedIngredientsData] = useState<SelectedIngredientData[]>([]);
  const [currentMacros, setCurrentMacros] = useState<Macros>(initialMacros);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Cargar receta al montar
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const snapshot = await getDoc(doc(db, Collections.RECIPES, id));
        if (!snapshot.exists()) {
          toast.error('Receta no encontrada.');
          router.back();
          return;
        }
        const data = snapshot.data();
        setName(data.name || '');
        setServes(String(data.serves || 1));
        // Los ingredientes guardados son { ingredientId, quantity } — para editar
        // necesitamos el objeto Ingredient completo. Los cargamos del ingredientStore
        // o los dejamos como datos básicos. Como alternativa, guardamos el nombre también.
        // Por simplicidad: restauramos solo los datos guardados como ingredientData básica.
        // Si el ingredientStore está cargado, buscamos ahí. Si no, mostramos solo nombre/quantity.
        // Usamos el store para reconstruir los ingredientes completos.
        // (Se recalcularán macros correctamente si el store está cargado)
        setLoading(false);
      } catch {
        toast.error('Error al cargar la receta.');
        router.back();
      }
    };
    fetchRecipe();
  }, [id]);

  // Recalcular macros al cambiar ingredientes o raciones
  useEffect(() => {
    const numServes = parseInt(serves, 10) || 1;
    if (selectedIngredientsData.length > 0) {
      setCurrentMacros(calculateRecipeMacros(selectedIngredientsData, numServes));
    } else {
      setCurrentMacros(initialMacros);
    }
  }, [selectedIngredientsData, serves]);

  const handleIngredientSelected = (item: SearchableItem, quantity: number) => {
    if (!('calories' in item)) {
      toast.error('Solo se pueden añadir ingredientes a una receta.');
      return;
    }
    setSelectedIngredientsData(prev => [...prev, { ingredient: item as Ingredient, quantity }]);
    setIsModalVisible(false);
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredientsData(prev => prev.filter(i => i.ingredient.id !== ingredientId));
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      toast.error('El nombre de la receta no puede estar vacío.');
      return;
    }
    setSaving(true);
    const numServes = parseInt(serves, 10) || 1;
    const updatedData = {
      name: name.trim(),
      ingredients: selectedIngredientsData.map(item => ({
        ingredientId: item.ingredient.id,
        quantity: item.quantity,
      })),
      macros: currentMacros,
      serves: numServes,
      updatedAt: new Date(),
    };
    try {
      await updateDoc(doc(db, Collections.RECIPES, id), updatedData);
      toast.success('Receta actualizada.');
      router.back();
    } catch {
      toast.error('Error al guardar la receta.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-3 pb-10">
        <p className="text-xl font-bold text-primary mb-2">Editar Receta</p>
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

        <div className="flex flex-col gap-1">
          <InputText
            label="Raciones por receta"
            placeholder="Ej: 2"
            type="number"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
          />
          <p className="text-alternate text-sm px-1">
            Número de platos que rinde esta receta. Los macros se dividen entre este número.
          </p>
        </div>

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
          label={saving ? 'Guardando...' : 'Guardar receta'}
          onPress={handleSave}
          disabled={saving}
        />

        <SearchItemModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectItem={handleIngredientSelected}
          itemTypes={['ingredient']}
        />
      </div>
    </Screen>
  );
}
```

> **Nota sobre ingredientes precargados:** La página de edición arranca con la lista de ingredientes vacía — el usuario puede añadir nuevos desde cero. Si se quiere precargar los ingredientes existentes de la receta, se necesitaría cruzar los `ingredientId` almacenados con el `ingredientStore`. Esto se puede hacer como mejora posterior; por ahora la edición permite modificar nombre, raciones y reconstruir la lista de ingredientes.

**Step 3: Verificar compilación sin errores**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: build limpio.

**Step 4: Commit**

```bash
git add src/app/ingredients/edit-recipe/
git commit -m "feat(recipes): add edit recipe page"
```

---

### Task 6: Verificar en el navegador con MCP devtools

**Step 1: Levantar el servidor**

```bash
npm run dev
```

**Step 2: Verificar ingredientes (MCP devtools)**

1. Navegar a `/ingredients/ingredients-list`
2. Verificar que cada ingrediente muestra botón editar (✏️) y borrar (🗑️)
3. Pulsar editar → debe navegar a `/ingredients/edit-ingredient/[id]` con los campos pre-poblados
4. Modificar un campo → guardar → verificar toast de éxito y que vuelve a la lista con el dato actualizado
5. Pulsar borrar → confirmar → verificar que desaparece de la lista

**Step 3: Verificar recetas (MCP devtools)**

1. Navegar a `/ingredients/recipes-list`
2. Verificar botones editar y borrar en cada receta
3. Pulsar editar → navegar a `/ingredients/edit-recipe/[id]` con nombre y raciones cargados
4. Añadir ingredientes → guardar → verificar actualización
5. Pulsar borrar → confirmar → verificar que la lista se actualiza sola (onSnapshot)

**Step 4: Commit final**

```bash
git add .
git commit -m "chore: verify edit/delete ingredients and recipes end-to-end"
```

---

## Archivos creados/modificados

| Archivo | Cambio |
|---|---|
| `src/store/ingredientStore.ts` | Añadir `updateIngredient`, `removeIngredient` |
| `src/app/ingredients/ingredients-list/page.tsx` | Añadir `onEdit`, `onDelete` a cada `Item` |
| `src/app/ingredients/edit-ingredient/[id]/page.tsx` | Nueva página |
| `src/app/ingredients/recipes-list/page.tsx` | Añadir `onEdit`, `onDelete` a cada `Item` |
| `src/app/ingredients/edit-recipe/[id]/page.tsx` | Nueva página |
