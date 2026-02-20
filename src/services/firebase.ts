import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { Collections } from '@/types/collections';
import { IUserStateData } from '@/types/user';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Persistencia en localStorage del navegador
setPersistence(auth, browserLocalPersistence);

// Collections
const ingredientsCollection = collection(db, Collections.INGREDIENTS);
const usersCollection = collection(db, Collections.USERS);
const recipesCollection = collection(db, Collections.RECIPES);

// Legacy exports - delegating to centralized services
import { UserService } from './userService';

const getUserQuery = (uid: string) => UserService.getUser(uid);
const deleteUser = (uid: string) => UserService.deleteUser(uid);
const updateUser = (uid: string, data: Partial<IUserStateData>) => UserService.updateUser(uid, data);

export {
  app,
  db,
  auth,
  usersCollection,
  ingredientsCollection,
  recipesCollection,
  getUserQuery,
  deleteUser,
  updateUser,
};
