// scripts/seed-ingredients.mjs
import { db, authenticate } from './firebase-admin.mjs';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { fetchAllProducts } from './off-fetcher.mjs';
import { mapProduct, categoryLabel } from './ingredient-mapper.mjs';
import { deduplicate } from './deduplicator.mjs';

const INGREDIENTS_COLLECTION = 'ingredients';

async function getExistingIngredients() {
  const snapshot = await getDocs(collection(db, INGREDIENTS_COLLECTION));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function uploadIngredients(ingredients) {
  const batch = writeBatch(db);
  for (const ingredient of ingredients) {
    const ref = doc(collection(db, INGREDIENTS_COLLECTION));
    batch.set(ref, ingredient);
  }
  await batch.commit();
}

async function main() {
  console.log('=== Seed Ingredients ===\n');

  // 0. Authenticate
  console.log('0. Authenticating...');
  await authenticate();
  console.log('   OK\n');

  // 1. Fetch from OFF
  console.log('1. Fetching from Open Food Facts...');
  const rawProducts = await fetchAllProducts();
  console.log(`   Total raw products: ${rawProducts.length}\n`);

  // 2. Map + filter
  console.log('2. Mapping and filtering...');
  const candidates = [];
  for (const product of rawProducts) {
    const tags = product.categories_tags ?? [];
    const matchedTag = [
      'en:meats', 'en:fish-and-seafood', 'en:vegetables', 'en:fruits',
      'en:cereals-and-their-products', 'en:dairy-products', 'en:legumes', 'en:eggs',
    ].find(t => tags.includes(t)) ?? 'en:other';

    const ingredient = mapProduct(product, categoryLabel(matchedTag));
    if (ingredient) candidates.push(ingredient);
  }
  console.log(`   Valid candidates: ${candidates.length}\n`);

  // 3. Load existing
  console.log('3. Loading existing Firestore ingredients...');
  const existing = await getExistingIngredients();
  console.log(`   Existing in Firestore: ${existing.length}\n`);

  // 4. Deduplicate
  console.log('4. Deduplicating...');
  const { toAdd, skipped } = deduplicate(candidates, existing);
  console.log(`   To add: ${toAdd.length} | Skipped (duplicates): ${skipped}\n`);

  if (toAdd.length === 0) {
    console.log('Nothing new to add. Done.');
    return;
  }

  // 5. Upload
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('5. DRY RUN — not uploading. First 5 ingredients to be added:');
    toAdd.slice(0, 5).forEach(i => console.log('  ', JSON.stringify(i)));
    return;
  }

  console.log(`5. Uploading ${toAdd.length} ingredients to Firestore...`);
  const BATCH_SIZE = 400;
  for (let i = 0; i < toAdd.length; i += BATCH_SIZE) {
    const chunk = toAdd.slice(i, i + BATCH_SIZE);
    await uploadIngredients(chunk);
    console.log(`   Uploaded ${Math.min(i + BATCH_SIZE, toAdd.length)}/${toAdd.length}`);
  }

  console.log('\n=== Done ===');
  console.log(`Added: ${toAdd.length} | Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
