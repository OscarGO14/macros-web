# Ingredient Store Design

**Date:** 2026-03-01
**Status:** Approved

## Problem

`useIngredients` abre un `onSnapshot` listener en tiempo real sobre los 531 documentos de la colección `ingredients` cada vez que el componente monta. No hay caché entre navegaciones — cada visita a la lista descarga los 531 docs de Firestore.

## Solution: Zustand `ingredientStore`

Store en memoria por sesión. Carga con `getDocs` una sola vez. Sin `persist` (son datos públicos, no del usuario).

## Data Flow

```
Primera visita a ingredients-list
  → status === 'idle'
  → loadIngredients() → getDocs(ingredientsCollection)
  → status = 'loaded', ingredients = [531 items]

Navegación posterior (misma sesión)
  → status === 'loaded' → render inmediato, sin llamada a Firebase

Añadir ingrediente
  → addDoc(db, ...) + store.addIngredient(newItem)
  → disponible al instante en toda la app sin re-fetch
```

## Store Shape

```ts
interface IngredientState {
  ingredients: Ingredient[]
  status: 'idle' | 'loading' | 'loaded' | 'error'
  error: Error | null
  loadIngredients: () => Promise<void>  // no-op si ya loaded
  addIngredient: (ingredient: Ingredient) => void
}
```

## Files Changed

| File | Action |
|------|--------|
| `src/store/ingredientStore.ts` | Create |
| `src/hooks/useIngredients.ts` | Rewrite — reads from store, calls loadIngredients |
| `src/app/ingredients/add-ingredient/page.tsx` | Call store.addIngredient() after addDoc |

## Out of Scope

- Firestore offline persistence (overkill para este volumen)
- Paginación (531 docs es manejable)
- Tiempo real entre dispositivos (no requerido)
