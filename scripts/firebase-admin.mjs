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
