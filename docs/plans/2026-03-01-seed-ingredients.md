# Seed Ingredients Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `scripts/seed-ingredients.mjs` that fetches ~150-200 basic ingredients from the Open Food Facts API, deduplicates them against existing Firestore data, and uploads them to the `ingredients` collection.

**Architecture:** Node.js script using `firebase-admin` (server-side SDK, no browser auth needed) + native `fetch` to call the OFF API. Runs once from the developer's machine. The app never changes — it keeps reading from Firestore as today.

**Tech Stack:** Node.js >= 18 (native fetch), `firebase-admin` v12, Open Food Facts REST API v2

---

## Pre-requisites (manual steps before running the script)

1. Go to [Firebase Console](https://console.firebase.google.com) → Project `macros-comida` → Project Settings → Service accounts → **Generate new private key**
2. Save the downloaded JSON as `scripts/serviceAccountKey.json` (this file is gitignored, never commit it)

---

### Task 1: Setup — install firebase-admin and gitignore the key

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

**Step 1: Install firebase-admin as dev dependency**

```bash
npm install --save-dev firebase-admin
```

Expected output: `added N packages`

**Step 2: Add serviceAccountKey.json to .gitignore**

Open `.gitignore` and add at the end:

```
# Firebase Admin service account key (never commit)
scripts/serviceAccountKey.json
```

**Step 3: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: install firebase-admin for seed script"
```

---

### Task 2: Create the firebase-admin initializer helper

**Files:**
- Create: `scripts/firebase-admin.mjs`

**Step 1: Create the file**

```js
// scripts/firebase-admin.mjs
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

export const db = getFirestore();
```

**Step 2: Verify manually**

```bash
node -e "import('./scripts/firebase-admin.mjs').then(() => console.log('OK'))"
```

Expected: `OK` (no error). If you see "Cannot find module serviceAccountKey.json", download the key first (see Pre-requisites).

**Step 3: Commit**

```bash
git add scripts/firebase-admin.mjs
git commit -m "chore: add firebase-admin initializer for scripts"
```

---

### Task 3: Create the Open Food Facts fetcher

**Files:**
- Create: `scripts/off-fetcher.mjs`

**Step 1: Create the file**

```js
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
```

**Step 2: Quick smoke test**

```bash
node -e "
import('./scripts/off-fetcher.mjs').then(async ({ fetchAllProducts }) => {
  const p = await fetchAllProducts();
  console.log('Total raw products:', p.length);
})
"
```

Expected: `Total raw products: NNN` (somewhere between 100 and 400 depending on OFF availability). If 0 products on every category, check internet connection or OFF API status.

**Step 3: Commit**

```bash
git add scripts/off-fetcher.mjs
git commit -m "feat(script): add OFF API fetcher by category"
```

---

### Task 4: Create the mapper + quality filter

**Files:**
- Create: `scripts/ingredient-mapper.mjs`

**Step 1: Create the file**

```js
// scripts/ingredient-mapper.mjs

/**
 * Map a raw OFF product to our Ingredient model.
 * Returns null if required nutrition data is missing.
 *
 * @param {object} product  raw OFF product
 * @param {string} categoryLabel  human-readable category name (e.g. 'meats')
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
```

**Step 2: Manual verify**

```bash
node -e "
import('./scripts/ingredient-mapper.mjs').then(({ mapProduct }) => {
  const fake = {
    product_name_es: 'Pechuga de pollo',
    nutriments: { 'energy-kcal_100g': 165, proteins_100g: 31, 'carbohydrates_100g': 0, fat_100g: 3.6 }
  };
  console.log(JSON.stringify(mapProduct(fake, 'carnes'), null, 2));
})
"
```

Expected: a valid ingredient object with all 4 macros.

**Step 3: Commit**

```bash
git add scripts/ingredient-mapper.mjs
git commit -m "feat(script): add OFF product → Ingredient mapper"
```

---

### Task 5: Create the deduplication logic

**Files:**
- Create: `scripts/deduplicator.mjs`

**Step 1: Create the file**

```js
// scripts/deduplicator.mjs

/**
 * Normalize a name for comparison:
 * lowercase, remove accents, collapse whitespace.
 */
function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

/**
 * Returns true if two macro values are within ±10% of each other.
 */
function macrosSimilar(a, b) {
  const fields = ['calories', 'proteins', 'carbs', 'fats'];
  return fields.every(f => {
    const va = a[f], vb = b[f];
    if (va === 0 && vb === 0) return true;
    const max = Math.max(Math.abs(va), Math.abs(vb));
    return Math.abs(va - vb) / max <= 0.1;
  });
}

/**
 * Returns true if two ingredients are considered duplicates.
 */
function isDuplicate(a, b) {
  const na = normalize(a.name);
  const nb = normalize(b.name);
  return levenshtein(na, nb) <= 3 && macrosSimilar(a, b);
}

/**
 * Deduplicate a list of new candidates against an existing list.
 * Keeps candidates not found in existing.
 *
 * @param {object[]} candidates  new ingredients to check
 * @param {object[]} existing    ingredients already in Firestore
 * @returns {{ toAdd: object[], skipped: number }}
 */
export function deduplicate(candidates, existing) {
  // First: deduplicate candidates among themselves
  const uniqueCandidates = [];
  for (const c of candidates) {
    const alreadyIn = uniqueCandidates.some(u => isDuplicate(u, c));
    if (!alreadyIn) {
      uniqueCandidates.push(c);
    }
    // If duplicate, prefer the one already in uniqueCandidates (shorter/earlier)
  }

  // Second: filter out those already in Firestore
  let skipped = candidates.length - uniqueCandidates.length;
  const toAdd = [];

  for (const c of uniqueCandidates) {
    const existsInFirestore = existing.some(e => isDuplicate(e, c));
    if (existsInFirestore) {
      skipped++;
    } else {
      toAdd.push(c);
    }
  }

  return { toAdd, skipped };
}
```

**Step 2: Quick sanity check**

```bash
node -e "
import('./scripts/deduplicator.mjs').then(({ deduplicate }) => {
  const existing = [{ name: 'Arroz blanco', calories: 130, proteins: 2.7, carbs: 28, fats: 0.3 }];
  const candidates = [
    { name: 'Arroz blancoo', calories: 132, proteins: 2.8, carbs: 28, fats: 0.3 }, // duplicate
    { name: 'Pollo a la plancha', calories: 165, proteins: 31, carbs: 0, fats: 3.6 }, // new
  ];
  const { toAdd, skipped } = deduplicate(candidates, existing);
  console.log('toAdd:', toAdd.length, '| skipped:', skipped);
  // Expected: toAdd: 1 | skipped: 1
})
"
```

**Step 3: Commit**

```bash
git add scripts/deduplicator.mjs
git commit -m "feat(script): add ingredient deduplication logic"
```

---

### Task 6: Create the main orchestration script

**Files:**
- Create: `scripts/seed-ingredients.mjs`

**Step 1: Create the file**

```js
// scripts/seed-ingredients.mjs
import { db } from './firebase-admin.mjs';
import { fetchAllProducts } from './off-fetcher.mjs';
import { mapProduct, categoryLabel } from './ingredient-mapper.mjs';
import { deduplicate } from './deduplicator.mjs';

const INGREDIENTS_COLLECTION = 'ingredients';

async function getExistingIngredients() {
  const snapshot = await db.collection(INGREDIENTS_COLLECTION).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function uploadIngredients(ingredients) {
  const batch = db.batch();
  for (const ingredient of ingredients) {
    const ref = db.collection(INGREDIENTS_COLLECTION).doc();
    batch.set(ref, ingredient);
  }
  await batch.commit();
}

async function main() {
  console.log('=== Seed Ingredients ===\n');

  // 1. Fetch from OFF
  console.log('1. Fetching from Open Food Facts...');
  const rawProducts = await fetchAllProducts();
  console.log(`   Total raw products: ${rawProducts.length}\n`);

  // 2. Map + filter
  console.log('2. Mapping and filtering...');
  const candidates = [];
  for (const product of rawProducts) {
    // Determine which category this product belongs to
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
  console.log(`5. Uploading ${toAdd.length} ingredients to Firestore...`);
  // Firestore batch limit is 500 — split if needed
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
```

**Step 2: Commit**

```bash
git add scripts/seed-ingredients.mjs
git commit -m "feat(script): add seed-ingredients main orchestration"
```

---

### Task 7: Add npm script + dry-run mode

**Files:**
- Modify: `package.json`
- Modify: `scripts/seed-ingredients.mjs`

**Step 1: Add `--dry-run` flag to main script**

In `scripts/seed-ingredients.mjs`, replace the `// 5. Upload` block with:

```js
  // 5. Upload
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('5. DRY RUN — not uploading. First 5 ingredients to be added:');
    toAdd.slice(0, 5).forEach(i => console.log('  ', JSON.stringify(i)));
    return;
  }

  console.log(`5. Uploading ${toAdd.length} ingredients to Firestore...`);
  // ... (keep the rest)
```

**Step 2: Add npm script to package.json**

In `package.json`, add inside `"scripts"`:

```json
"seed:ingredients": "node scripts/seed-ingredients.mjs",
"seed:ingredients:dry": "node scripts/seed-ingredients.mjs --dry-run"
```

**Step 3: Commit**

```bash
git add scripts/seed-ingredients.mjs package.json
git commit -m "feat(script): add dry-run mode and npm scripts for seed"
```

---

### Task 8: Run and verify

**Step 1: Dry run first**

```bash
npm run seed:ingredients:dry
```

Expected output:
```
=== Seed Ingredients ===

1. Fetching from Open Food Facts...
  Fetching en:meats...
    → XX products
  ...
   Total raw products: NNN

2. Mapping and filtering...
   Valid candidates: NNN

3. Loading existing Firestore ingredients...
   Existing in Firestore: N

4. Deduplicating...
   To add: NNN | Skipped (duplicates): NNN

5. DRY RUN — not uploading. First 5 ingredients to be added:
   {"name":"...","category":"...","calories":...}
   ...
```

Verify the 5 sample ingredients look sensible (realistic macro values, Spanish names).

**Step 2: Real run**

```bash
npm run seed:ingredients
```

Expected: ends with `=== Done === Added: NNN | Skipped: NNN`

**Step 3: Verify in Firebase Console**

Go to [Firebase Console](https://console.firebase.google.com) → Firestore → `ingredients` collection. You should see new documents with the 4 macro fields and no `userId`.

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: verify seed-ingredients script runs successfully"
```

---

## Files Created/Modified Summary

| File | Action |
|---|---|
| `scripts/firebase-admin.mjs` | Create |
| `scripts/off-fetcher.mjs` | Create |
| `scripts/ingredient-mapper.mjs` | Create |
| `scripts/deduplicator.mjs` | Create |
| `scripts/seed-ingredients.mjs` | Create |
| `package.json` | Modify (add dev dep + npm scripts) |
| `.gitignore` | Modify (ignore serviceAccountKey.json) |
| `scripts/serviceAccountKey.json` | Download manually, never commit |
