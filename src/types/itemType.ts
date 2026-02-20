// Enum para los tipos de item
export const ItemType = {
  INGREDIENT: 'ingredient',
  RECIPE: 'recipe',
  UNKNOWN: 'unknown',
} as const;

export type ItemTypeValue = (typeof ItemType)[keyof typeof ItemType];
