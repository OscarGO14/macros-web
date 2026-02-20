export const Collections = {
  INGREDIENTS: 'ingredients',
  USERS: 'users',
  RECIPES: 'recipes', // Añadir la colección de recetas
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
