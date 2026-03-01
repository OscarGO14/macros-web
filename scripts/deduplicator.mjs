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
