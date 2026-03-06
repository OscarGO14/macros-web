# UX Improvements & Icon Bug Fix — Design Doc

**Date:** 2026-03-06
**Approach:** Enfoque A — Mejoras quirúrgicas sin rediseño de arquitectura

---

## Contexto

Tras verificar todas las features implementadas en master, se detectaron 5 puntos de dolor concretos en los flujos de formularios y en el componente `Item`. Todos se pueden resolver con cambios quirúrgicos sin tocar la arquitectura existente.

---

## Sección 1 — Bug: Iconos aleatorios en `Item`

**Problema:** `Item/index.tsx` usa `getRandomElement(INGREDIENT_ICONS)` dentro de un `useMemo`, lo que provoca que el icono sea aleatorio e inconsistente entre renders.

**Solución:** Icono fijo por tipo:
- `ItemType.INGREDIENT` → `MdFoodBank`
- `ItemType.RECIPE` → `MdRamenDining`

**Archivos:** `src/components/ui/Item/index.tsx`

---

## Sección 2 — `add-ingredient`: categoría como select + navegación tras guardar

**Problema 1:** El campo categoría es texto libre, lo que genera inconsistencia con las categorías del seed.

**Solución:** Reemplazar `InputText` de categoría por un `<select>` nativo con las categorías predefinidas:
- carnes, pescado, verduras, frutas, cereales, lácteos, legumbres, huevos, otra

Estilos inline consistentes con el resto de inputs (`bg-item-background border border-alternate/20 rounded-lg p-3 text-primary w-full`).

**Problema 2:** Tras guardar exitosamente, el form se limpia pero el usuario se queda en la misma página. Esto es confuso — parece que no ha pasado nada.

**Solución:** Llamar `router.back()` tras el toast de éxito.

**Archivos:** `src/app/ingredients/add-ingredient/page.tsx`

---

## Sección 3 — `add-meal`: macros en tiempo real + reordenar layout

**Problema 1:** No hay resumen de macros mientras el usuario construye la comida.

**Solución:** Añadir una `StatsCard` con calorías totales y subtítulos P/C/G que se actualiza reactivamente con `totalMealMacros` (ya calculado en el componente).

**Problema 2:** El botón "Añadir ingrediente o receta" está arriba y la lista aparece abajo, separando visualmente acción y resultado.

**Solución:** Nuevo orden de layout:
```
1. Lista de items añadidos (o mensaje "No has añadido ningún alimento")
2. Botón "Añadir ingrediente o receta"
3. StatsCard macros totales
4. Botón "Guardar Comida"
```

**Archivos:** `src/app/meals/add-meal/page.tsx`

---

## Sección 4 — `add-recipe`: texto de ayuda en campo Raciones

**Problema:** El campo "Raciones por receta" no explica qué significa, generando confusión.

**Solución:** Añadir un párrafo de ayuda debajo del input:
```
"Número de platos que rinde esta receta. Los macros se dividen entre este número."
```
En `text-alternate text-sm`. Sin cambios en lógica.

**Archivos:** `src/app/ingredients/add-recipe/page.tsx`

---

## Sección 5 — `SearchItemModal`: separadores de sección + unidad en cantidad

**Problema 1:** Con 500+ ingredientes y recetas mezclados, la lista es difícil de navegar visualmente.

**Solución:** Cuando la lista filtrada contiene ambos tipos, insertar encabezados de sección:
- "Ingredientes" antes del primer ingrediente
- "Recetas" antes de la primera receta

Solo se muestran si hay items de ambos tipos en la lista filtrada actual.

**Problema 2:** El label del input de cantidad solo dice "Seleccionado: X", sin indicar la unidad esperada.

**Solución:** Cambiar el label a `"{nombre} — {unidad}"` donde unidad es "gramos" para ingredientes y "raciones" para recetas.

**Archivos:** `src/components/SearchItemModal/index.tsx`

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/ui/Item/index.tsx` | Iconos fijos por tipo |
| `src/app/ingredients/add-ingredient/page.tsx` | Select de categoría + router.back() |
| `src/app/meals/add-meal/page.tsx` | Reordenar layout + StatsCard macros |
| `src/app/ingredients/add-recipe/page.tsx` | Texto de ayuda en raciones |
| `src/components/SearchItemModal/index.tsx` | Separadores de sección + label cantidad |

---

## No incluido (YAGNI)

- Iconos por categoría específica (demasiado complejo para el valor aportado ahora)
- Wizard de formularios
- Paginación o filtros por categoría en el modal
- Preview de macros al seleccionar en el modal
