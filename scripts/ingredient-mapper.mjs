// scripts/ingredient-mapper.mjs

/**
 * Map a raw OFF product to our Ingredient model.
 * Returns null if required nutrition data is missing.
 *
 * @param {object} product  raw OFF product
 * @param {string} categoryLabel  human-readable category name (e.g. 'carnes')
 * @returns {{ name, category, calories, proteins, carbs, fats } | null}
 */
export function mapProduct(product, categoryLabel) {
  const n = product.nutriments ?? {};

  // Require all four macros
  const calories = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : null);
  const proteins = n['proteins_100g'] ?? null;
  const carbs    = n['carbohydrates_100g'] ?? null;
  const fats     = n['fat_100g'] ?? null;

  if (calories == null || proteins == null || carbs == null || fats == null) return null;
  if (isNaN(calories) || isNaN(proteins) || isNaN(carbs) || isNaN(fats)) return null;

  // Prefer Spanish name
  const rawName = (product.product_name_es || product.product_name || '').trim();
  if (!rawName) return null;

  // Shorten to the first meaningful part (before comma or dash) to get generic names
  const name = rawName.split(/[,\-–(]/)[0].trim();
  if (name.length < 2) return null;

  return {
    name,
    category: categoryLabel,
    calories: Math.round(calories * 10) / 10,
    proteins: Math.round(proteins * 10) / 10,
    carbs:    Math.round(carbs * 10) / 10,
    fats:     Math.round(fats * 10) / 10,
  };
}

/**
 * Extract a short category label from an OFF category tag.
 * e.g. 'en:meats' → 'carnes'
 */
const CATEGORY_LABELS = {
  'en:meats':                       'carnes',
  'en:fish-and-seafood':            'pescado',
  'en:vegetables':                  'verduras',
  'en:fruits':                      'frutas',
  'en:cereals-and-their-products':  'cereales',
  'en:dairy-products':              'lácteos',
  'en:legumes':                     'legumbres',
  'en:eggs':                        'huevos',
};

export function categoryLabel(tag) {
  return CATEGORY_LABELS[tag] ?? tag;
}
