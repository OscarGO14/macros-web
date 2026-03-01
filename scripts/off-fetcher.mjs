// scripts/off-fetcher.mjs

const CATEGORIES = [
  'en:meats',
  'en:fish-and-seafood',
  'en:vegetables',
  'en:fruits',
  'en:cereals-and-their-products',
  'en:dairy-products',
  'en:legumes',
  'en:eggs',
];

const PAGE_SIZE = 50;
const BASE_URL = 'https://world.openfoodfacts.org/api/v2/search';
const FIELDS = 'product_name,product_name_es,categories_tags,nutriments';

/**
 * Fetch products for a single OFF category.
 * @param {string} category  e.g. 'en:meats'
 * @returns {Promise<object[]>} raw OFF product objects
 */
async function fetchCategory(category) {
  const url = new URL(BASE_URL);
  url.searchParams.set('categories_tags', category);
  url.searchParams.set('countries_tags', 'en:spain');
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('page', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'macros-comida-seed/1.0 (contact@example.com)' },
  });

  if (!res.ok) throw new Error(`OFF API error ${res.status} for ${category}`);

  const json = await res.json();
  return json.products ?? [];
}

/**
 * Fetch all categories and return combined raw products.
 * @returns {Promise<object[]>}
 */
export async function fetchAllProducts() {
  const results = [];

  for (const category of CATEGORIES) {
    console.log(`  Fetching ${category}...`);
    try {
      const products = await fetchCategory(category);
      console.log(`    → ${products.length} products`);
      results.push(...products);
    } catch (err) {
      console.warn(`  WARN: skipping ${category}: ${err.message}`);
    }
    // Polite delay to avoid hammering OFF
    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}
