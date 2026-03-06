# UX Improvements & Icon Bug Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aplicar 5 mejoras quirúrgicas de usabilidad: iconos fijos en Item, categoría con select en add-ingredient, layout y macros en add-meal, texto de ayuda en add-recipe, y separadores + unidad en SearchItemModal.

**Architecture:** Cambios aislados en 5 archivos. Sin nuevos componentes, sin cambios en servicios ni store. Cada task modifica un único archivo y se commitea de forma independiente.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Corregir iconos aleatorios en `Item`

**Files:**
- Modify: `src/components/ui/Item/index.tsx`

**Step 1: Aplicar el cambio**

En `src/components/ui/Item/index.tsx`, reemplazar el bloque de imports y la constante `IconComponent`:

Eliminar las líneas 20-21:
```ts
const INGREDIENT_ICONS: IconType[] = [MdFoodBank, MdBreakfastDining, MdFastfood, FaFish];
const RECIPE_ICONS: IconType[] = [MdTakeoutDining, MdRamenDining, MdBrunchDining, MdOutdoorGrill];
```

Reemplazar el `useMemo` de `IconComponent` (líneas 24-33):
```ts
const IconComponent = useMemo((): IconType => {
  switch (type) {
    case ItemType.INGREDIENT:
      return MdFoodBank;
    case ItemType.RECIPE:
      return MdRamenDining;
    default:
      return MdHelpOutline;
  }
}, [type]);
```

Eliminar también el import de `getRandomElement`:
```ts
// Eliminar esta línea:
import { getRandomElement } from '@/utils/getRandomElement';
```

Y limpiar los imports de react-icons — solo quedan los que se usan:
```ts
import {
  MdFoodBank,
  MdRamenDining,
  MdEdit,
  MdDelete,
  MdHelpOutline,
} from 'react-icons/md';
```

Eliminar el import de `FaFish` de `react-icons/fa` si ya no se usa en ningún otro lugar del archivo.

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 3: Commit**

```bash
git add src/components/ui/Item/index.tsx
git commit -m "fix(item): use fixed icons per type instead of random selection"
```

---

### Task 2: Categoría con select + navegar atrás en `add-ingredient`

**Files:**
- Modify: `src/app/ingredients/add-ingredient/page.tsx`

**Step 1: Añadir import de `useRouter`**

En la línea de imports añadir:
```ts
import { useRouter } from 'next/navigation';
```

**Step 2: Añadir constante de categorías y useRouter**

Después de la línea `export default function AddIngredientPage() {`, añadir:

```ts
const router = useRouter();

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
```

**Step 3: Llamar `router.back()` tras el éxito**

En `handleSubmit`, dentro del bloque `try`, justo después de `toast.success(...)`:

```ts
toast.success('Ingrediente añadido correctamente.');
router.back();
```

Eliminar los `setState('')` que resetean el form tras el éxito — ya no son necesarios porque la página se desmonta al navegar atrás:

```ts
// Eliminar:
setName('');
setCategory('');
setCalories('');
setProteins('');
setCarbs('');
setFats('');
```

**Step 4: Reemplazar el InputText de categoría por un `<select>`**

Reemplazar el bloque completo del `InputText` de categoría:

```tsx
// Antes:
<InputText
  label="Categoría (Opcional)"
  placeholder="Ej: Carnes, Lácteos, Verduras..."
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>

// Después:
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
```

**Step 5: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 6: Commit**

```bash
git add src/app/ingredients/add-ingredient/page.tsx
git commit -m "feat(add-ingredient): replace category text input with select + navigate back on save"
```

---

### Task 3: Reordenar layout y añadir macros totales en `add-meal`

**Files:**
- Modify: `src/app/meals/add-meal/page.tsx`

**Step 1: Añadir import de `StatsCard`**

Añadir al bloque de imports:
```ts
import { StatsCard } from '@/components/ui/StatsCard';
```

**Step 2: Reordenar el JSX del return**

Reemplazar el contenido del `<div className="flex flex-col gap-3">` con el nuevo orden:

```tsx
<div className="flex flex-col gap-3">
  <p className="text-xl font-semibold text-primary">Elementos añadidos:</p>

  <div className="flex flex-col gap-2 min-h-24">
    {currentMealItems.length === 0 ? (
      <p className="text-center text-alternate">No has añadido ningún alimento.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {currentMealItems.map((item, index) => (
          <li key={`${item.id}-${index}`}>
            <Item
              name={item.name}
              type={item.itemType as (typeof ItemType)[keyof typeof ItemType]}
              calories={Math.round(item.macros.calories)}
              showType
              onDelete={() => handleDeleteItem(index)}
            />
          </li>
        ))}
      </ul>
    )}
  </div>

  <ActionButton
    label="Añadir ingrediente o receta"
    onPress={() => setIsSearchModalVisible(true)}
  />

  <StatsCard
    title="Total comida"
    value={totalMealMacros.calories.toFixed(0)}
    variant="primary"
    trend={[
      `P: ${totalMealMacros.proteins.toFixed(1)}`,
      `C: ${totalMealMacros.carbs.toFixed(1)}`,
      `G: ${totalMealMacros.fats.toFixed(1)}`,
    ]}
  />

  <SubmitButton onPress={handleSaveMeal} label="Guardar Comida" />

  <SearchItemModal
    isVisible={isSearchModalVisible}
    onClose={() => setIsSearchModalVisible(false)}
    onSelectItem={handleSelectItem}
    itemTypes={['ingredient', 'recipe']}
  />
</div>
```

**Step 3: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 4: Commit**

```bash
git add src/app/meals/add-meal/page.tsx
git commit -m "feat(add-meal): reorder layout and show total macros in real time"
```

---

### Task 4: Texto de ayuda en campo Raciones de `add-recipe`

**Files:**
- Modify: `src/app/ingredients/add-recipe/page.tsx`

**Step 1: Añadir texto de ayuda debajo del input de raciones**

Localizar el bloque del `InputText` de raciones:

```tsx
<InputText
  label="Raciones por receta"
  placeholder="Ej: 2 (para cuántas comidas rinde)"
  type="number"
  value={serves}
  onChange={(e) => setServes(e.target.value)}
/>
```

Envolverlo en un `<div>` y añadir el texto de ayuda debajo:

```tsx
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
```

**Step 2: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 3: Commit**

```bash
git add src/app/ingredients/add-recipe/page.tsx
git commit -m "feat(add-recipe): add help text for servings field"
```

---

### Task 5: Separadores de sección y unidad en cantidad en `SearchItemModal`

**Files:**
- Modify: `src/components/SearchItemModal/index.tsx`

**Step 1: Añadir lógica de separadores en la lista filtrada**

En el componente, después de la definición de `filteredItems`, añadir una variable derivada que indica si hay ambos tipos en la lista:

```ts
const hasIngredients = filteredItems.some(i => i.itemType === 'ingredient');
const hasRecipes = filteredItems.some(i => i.itemType === 'recipe');
const showSectionHeaders = hasIngredients && hasRecipes;
```

**Step 2: Añadir separadores en el JSX de la lista**

Reemplazar el `<ul>` de items:

```tsx
<ul className="flex flex-col gap-1 py-2">
  {filteredItems.map((item, index) => {
    const prevItem = filteredItems[index - 1];
    const isFirstIngredient = showSectionHeaders && item.itemType === 'ingredient' && (index === 0 || prevItem?.itemType !== 'ingredient');
    const isFirstRecipe = showSectionHeaders && item.itemType === 'recipe' && prevItem?.itemType !== 'recipe';

    return (
      <React.Fragment key={`${item.itemType}-${item.id}`}>
        {isFirstIngredient && (
          <li className="px-2 pt-2 pb-1">
            <p className="text-alternate text-xs font-semibold uppercase tracking-wide">Ingredientes</p>
          </li>
        )}
        {isFirstRecipe && (
          <li className="px-2 pt-2 pb-1">
            <p className="text-alternate text-xs font-semibold uppercase tracking-wide">Recetas</p>
          </li>
        )}
        <li>
          <button
            onClick={() => setSelectedItem(item)}
            className={`w-full p-2 rounded border cursor-pointer ${
              selectedItem?.id === item.id && selectedItem?.itemType === item.itemType
                ? 'border-accent bg-accent/10'
                : 'border-transparent'
            }`}
          >
            <Item
              name={item.name}
              type={item.itemType === 'ingredient' ? ItemType.INGREDIENT : ItemType.RECIPE}
              calories={item.itemType === 'ingredient' ? item.calories : item.macros.calories}
              showType
            />
          </button>
        </li>
      </React.Fragment>
    );
  })}
</ul>
```

**Step 3: Actualizar el label del input de cantidad**

Reemplazar el bloque de `selectedItem`:

```tsx
{selectedItem && (
  <div className="p-3 border border-alternate rounded bg-item-background">
    <p className="font-semibold mb-2 text-primary">
      {selectedItem.name} —{' '}
      <span className="text-alternate font-normal">
        cantidad en {selectedItem.itemType === 'ingredient' ? 'gramos' : 'raciones'}
      </span>
    </p>
    <input
      type="number"
      placeholder={selectedItem.itemType === 'ingredient' ? 'Ej: 150' : 'Ej: 1'}
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
      className="w-full bg-background border border-alternate rounded p-2 text-primary placeholder:text-alternate outline-none"
    />
  </div>
)}
```

**Step 4: Verificar compilación**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Esperado: sin errores.

**Step 5: Commit**

```bash
git add src/components/SearchItemModal/index.tsx
git commit -m "feat(search-modal): add section headers for ingredients/recipes and show unit in quantity label"
```

---

### Task 6: Verificación manual en el navegador

**Step 1: Levantar el servidor**

```bash
npm run dev
```

**Step 2: Verificar cada cambio**

1. Ir a `/ingredients/ingredients-list` → todos los ingredientes deben tener el mismo icono (`MdFoodBank`). Sin aleatoriedad al recargar.

2. Ir a `/ingredients` → "Añadir ingrediente" → verificar que categoría es un `<select>`, añadir un ingrediente de prueba → debe navegar atrás automáticamente.

3. Ir a `/meals/add-meal` → verificar que la lista está arriba, el botón "Añadir" en el medio, y la StatsCard de macros debajo. Añadir un ingrediente → verificar que los macros se actualizan en tiempo real.

4. Ir a `/ingredients` → "Crear receta" → verificar que aparece el texto de ayuda debajo del campo Raciones.

5. Ir a `/meals/add-meal` → abrir el modal → verificar los encabezados "INGREDIENTES" y "RECETAS". Seleccionar un ingrediente → verificar que el label dice "Pollo campero — cantidad en gramos".

**Step 3: Commit final**

```bash
git add .
git commit -m "chore: verify all UX improvements working end-to-end"
```

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/ui/Item/index.tsx` | Iconos fijos por tipo |
| `src/app/ingredients/add-ingredient/page.tsx` | Select de categoría + router.back() |
| `src/app/meals/add-meal/page.tsx` | Reordenar layout + StatsCard macros |
| `src/app/ingredients/add-recipe/page.tsx` | Texto de ayuda en raciones |
| `src/components/SearchItemModal/index.tsx` | Separadores de sección + label cantidad |
