/**
 * Deco Vintage Guate - Official Firebase Firestore Configuration
 * Connects directly to Google Cloud Firestore (tienda-web-deco-vintage).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tienda-web-deco-vintage.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tienda-web-deco-vintage",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tienda-web-deco-vintage.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769351516290",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769351516290:web:bcc54a093adfb6e8a1b49b"
};

// Initialize Firebase App & Firestore Database instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export const isFirebaseActive = true;

export { app, db, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, query };
