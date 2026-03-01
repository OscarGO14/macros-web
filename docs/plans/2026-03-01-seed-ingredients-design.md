# Seed de ingredientes desde Open Food Facts

**Fecha:** 2026-03-01
**Estado:** Aprobado

## Objetivo

Cargar ~100-200 ingredientes básicos en la colección `ingredients` de Firestore usando la API pública de Open Food Facts (OFF) como fuente. El script se ejecuta una sola vez (o cuando se quiera ampliar), nunca desde la app.

## Flujo

```
Script local (scripts/seed-ingredients.mjs)
    ↓ consulta OFF API por categoría
    ↓ filtra macros completos
    ↓ mapea al modelo Ingredient
    ↓ deduplica internamente (candidatos nuevos entre sí)
    ↓ deduplica contra Firestore existente
    ↓ sube los nuevos con setDoc

App → lee solo de Firestore (sin cambios)
```

## Script — `scripts/seed-ingredients.mjs`

### Pasos

1. **Fetch por categoría** — Consulta `https://world.openfoodfacts.org/cgi/search.pl` con `country=spain`, `lang=es`, paginando hasta ~50 productos por categoría
2. **Filtro de calidad** — Descarta productos sin `energy_100g`, `proteins_100g`, `carbohydrates_100g` o `fat_100g`
3. **Mapeo** al modelo `Ingredient`:
   - `name`: `product_name_es` → `product_name` → fallback al nombre de categoría + index
   - `category`: nombre de la categoría OFF
   - `calories`: `energy-kcal_100g` (o `energy_100g / 4.184` si solo hay kJ)
   - `proteins`: `proteins_100g`
   - `carbs`: `carbohydrates_100g`
   - `fats`: `fat_100g`
   - Sin `userId` (ingrediente global)
4. **Deduplicación interna** — Entre los candidatos nuevos, si dos tienen nombre normalizado similar (Levenshtein ≤ 3) y macros dentro de ±10%, conservar el de nombre más corto (más genérico)
5. **Deduplicación contra Firestore** — Cargar todos los ingredientes existentes; aplicar el mismo criterio; si hay match, saltar el candidato
6. **Upload** — `setDoc` con ID auto-generado para cada ingrediente nuevo; log del total añadido/saltado

### Categorías OFF a consultar

| Tag OFF | Ejemplos esperados |
|---|---|
| `meats` | pollo, ternera, cerdo |
| `fish-and-seafood` | salmón, atún, bacalao |
| `vegetables` | tomate, espinacas, brócoli |
| `fruits` | manzana, plátano, naranja |
| `cereals-and-their-products` | arroz, avena, pasta |
| `dairy-products` | leche, yogur, queso |
| `legumes` | lentejas, garbanzos, alubias |
| `eggs` | huevo |

## Deduplicación

- **Normalización**: minúsculas, sin tildes (`ñ→n`, `á→a`…), sin espacios extra, trim
- **Nombre similar**: distancia Levenshtein ≤ 3
- **Macros similares**: todos los 4 macros con diferencia relativa < 10%
- **Decisión**: si ambas condiciones → conservar el existente, saltar el candidato nuevo

## Modelo destino

```ts
interface Ingredient {
  id: string;        // auto Firestore
  name: string;
  category?: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  // userId ausente → ingrediente global
}
```

## Idempotencia

El script puede re-ejecutarse sin riesgo. Siempre consulta Firestore antes de subir y solo añade lo que no existe según los criterios de deduplicación.

## Dependencias del script

- `firebase-admin` (SDK de admin para Node, sin auth de usuario)
- `serviceAccountKey.json` (credenciales de servicio, no se commitea)
- Node.js >= 18 (fetch nativo)

## No en scope

- Modificar la app o sus servicios
- Traducción automática de nombres (se usa `product_name_es` si existe)
- Importar productos con marca (se prefieren nombres genéricos)
