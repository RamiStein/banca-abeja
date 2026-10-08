import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAZtufy7-MAc6_97Yy7Ilj1TRUtgzFWtjY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cobelgrano-36019.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cobelgrano-36019",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cobelgrano-36019.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "386444843080",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:386444843080:web:a6fe7b771b28bda91ba07d"
};

export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'tu_api_key_aqui'
  );
};

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🐝 Firebase conectado con éxito para Banca Abeja en el proyecto:", firebaseConfig.projectId);
  } catch (error) {
    console.warn("Error al inicializar Firebase en Banca Abeja:", error);
  }
} else {
  console.info("Firebase no configurado aún o en modo local. Usando LocalStorage.");
}

export { app, db, auth };

