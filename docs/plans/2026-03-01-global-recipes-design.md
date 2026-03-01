# Recetas globales — Diseño

**Fecha:** 2026-03-01
**Estado:** Aprobado

## Objetivo

Hacer que las recetas sean compartidas entre todos los usuarios autenticados, igual que los ingredientes. Cualquier usuario puede crear, editar y eliminar cualquier receta.

## Estado actual

- Las recetas se guardan con `userId` del creador
- Las reglas de Firestore permiten leer a todos pero solo el creador puede escribir
- El hook `useRecipes` ya consulta TODAS las recetas (sin filtrar por userId)
- Al crear una receta se guarda `customRecipeIds` en el documento del usuario
- El título de la pantalla dice "Mis recetas"

## Cambios

### 1. `src/types/recipe.ts`
`userId: string` → `userId?: string`

Backward-compatible: los documentos existentes con userId siguen siendo válidos.

### 2. `firestore.rules`
```
match /recipes/{recipeId} {
  allow read, write: if isAuthenticated();
}
```
Igual que la regla de ingredientes. Sin control de propietario.

### 3. `src/app/ingredients/add-recipe/page.tsx`
- Eliminar `userId: user.uid` del objeto guardado en Firestore
- Eliminar `updateDoc(user, { customRecipeIds: arrayUnion(newRecipeRef.id) })`
- Eliminar imports sobrantes: `db`, `updateDoc`, `arrayUnion`, `Collections`
- Eliminar dependencia de `useUserStore` (el `user` ya no se usa)

### 4. `src/hooks/useRecipes.ts`
- Eliminar dependencia de `userId` e `isUserLoading`
- El hook suscribe directamente sin condición de usuario
- Simplificar el `useEffect`

### 5. `src/app/ingredients/recipes-list/page.tsx`
- `"Mis recetas"` → `"Recetas"`

## Lo que NO cambia
- La colección `recipes` en Firestore
- Los documentos existentes (userId queda como campo ignorado)
- El formulario de crear receta (UI idéntica)
- La navegación
