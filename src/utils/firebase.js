import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  enableIndexedDbPersistence
} from 'firebase/firestore';

// Standard Firebase Configuration for Deco Vintage Guate
// Uses environment variables if available with fallback to default project ID
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDecoVintageGuateProduction",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tienda-web-deco-vintage.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tienda-web-deco-vintage",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tienda-web-deco-vintage.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Initialize Firebase safely (prevent multiple app instances)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence when running in browser
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.debug('[Firebase Firestore] Multi-tab persistence disabled');
      } else if (err.code === 'unimplemented') {
        console.debug('[Firebase Firestore] Browser lacks IndexedDB persistence');
      }
    });
  } catch (e) {
    // Ignore in unsupported environments
  }
}

export { app, db, collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query };
