# Edit & Delete Ingredients and Recipes — Design Doc

**Date:** 2026-03-06
**Scope:** Añadir capacidad de editar y borrar ingredientes y recetas desde las listas existentes.

---

## Decisiones clave

- **Edición:** páginas separadas con dynamic route `[id]` (patrón consistente con `add-ingredient` y `add-recipe`)
- **Recetas:** edición con complejidad completa (ingredientes, cantidades, raciones, macros en tiempo real)
- **Borrado:** `ConfirmationModal` existente + `deleteDoc` en Firestore

---

## Cambios por fichero

### `src/store/ingredientStore.ts`

Añadir dos acciones:
- `updateIngredient(id: string, data: Omit<Ingredient, 'id'>)` — actualiza el ingrediente en el array local
- `removeIngredient(id: string)` — elimina por id del array local

### `src/app/ingredients/ingredients-list/page.tsx`

En cada `<Item>`:
- `onEdit` → navega a `/ingredients/edit-ingredient/[id]`
- `onDelete` → abre `ConfirmationModal`, en confirmación llama `deleteDoc` + `removeIngredient` del store + toast de éxito

### `src/app/ingredients/edit-ingredient/[id]/page.tsx` (nueva)

- Lee el ingrediente del `ingredientStore` por `params.id` (ya cargado gracias a `loadIngredients`)
- Si no está en el store (navegación directa), llama `loadIngredients` primero
- Mismo formulario que `add-ingredient`, pre-poblado con los datos del ingrediente
- Al guardar: `updateDoc` en Firestore + `updateIngredient` en store + toast + `router.back()`

### `src/app/ingredients/recipes-list/page.tsx`

En cada `<Item>`:
- `onEdit` → navega a `/ingredients/edit-recipe/[id]`
- `onDelete` → `ConfirmationModal`, en confirmación llama `deleteDoc` (el `onSnapshot` de `useRecipes` actualiza la lista automáticamente) + toast de éxito

### `src/app/ingredients/edit-recipe/[id]/page.tsx` (nueva)

- Hace `getDoc(doc(recipesCollection, id))` al montar para cargar la receta
- Mismo formulario que `add-recipe`:
  - Nombre de la receta
  - Lista de ingredientes (con cantidad), añadir/eliminar mediante `SearchItemModal`
  - Raciones por receta
  - `StatsCard` con macros calculados en tiempo real
- Al guardar: `updateDoc` con `updatedAt: new Date()` + toast + `router.back()`

---

## Flujo de borrado

```
Usuario pulsa ✕ en Item
  → ConfirmationModal visible
  → Usuario confirma
  → deleteDoc(Firestore)
  → removeIngredient(store) / onSnapshot actualiza recetas automáticamente
  → toast.success
  → modal se cierra
```

---

## Archivos modificados/creados

| Archivo | Cambio |
|---|---|
| `src/store/ingredientStore.ts` | Añadir `updateIngredient`, `removeIngredient` |
| `src/app/ingredients/ingredients-list/page.tsx` | Añadir `onEdit` y `onDelete` a cada `Item` |
| `src/app/ingredients/edit-ingredient/[id]/page.tsx` | Nueva página de edición |
| `src/app/ingredients/recipes-list/page.tsx` | Añadir `onEdit` y `onDelete` a cada `Item` |
| `src/app/ingredients/edit-recipe/[id]/page.tsx` | Nueva página de edición de receta |

**Sin cambios:** `Item` component (ya tiene `onEdit`/`onDelete`), `ConfirmationModal`, `SearchItemModal`, `useRecipes`, `useIngredients`
