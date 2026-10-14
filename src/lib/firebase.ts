// Configuration Firebase — syntaxe v8 (API « compat »).
//
// La configuration web Firebase n'est pas un secret : elle est de toute façon
// visible dans le navigateur de chaque visiteur. La protection des données est
// assurée par les règles de sécurité (firestore.rules, storage.rules).
// Les variables VITE_FIREBASE_* d'un fichier .env.local, si présentes, ont la priorité.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyB-vQnuHyGK4dVFaFa2N-MZAfextw59HPk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'my-streakers.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'my-streakers',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'my-streakers.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '990322731756',
  appId: env.VITE_FIREBASE_APP_ID || '1:990322731756:web:aa67fc448ca93811fc53c9',
};

let app: firebase.app.App;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = app.auth();
const db = app.firestore();
const storage = app.storage();

export { auth, db, storage, firebase };
