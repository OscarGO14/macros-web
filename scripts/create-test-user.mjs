// Script para crear el documento Firestore del usuario de prueba
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCBY3wdDH2loAJdfS7qO4aKIbCv0USdPLo',
  authDomain: 'macros-comida.firebaseapp.com',
  projectId: 'macros-comida',
  storageBucket: 'macros-comida.firebasestorage.app',
  messagingSenderId: '54277400407',
  appId: '1:54277400407:web:bd8f3501c1c9abbd510012',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const email = 'test@test.com';
const password = 'test12';

const userData = {
  uid: '',
  email,
  displayName: 'test',
  dailyGoals: { calories: 1700, proteins: 140, carbs: 170, fats: 60 },
  history: {},
};

try {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  userData.uid = uid;
  await setDoc(doc(db, 'users', uid), userData);
  console.log('Documento creado para', email, '(uid:', uid + ')');
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
