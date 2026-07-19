import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3X8Pwq7ZWyciV4kMLLREvAmUkBdaQLu8",
  authDomain: "wav-gradient-app.firebaseapp.com",
  projectId: "wav-gradient-app",
  storageBucket: "wav-gradient-app.firebasestorage.app",
  messagingSenderId: "876680882091",
  appId: "1:876680882091:web:2c4b364dcda043d64994ee",
  measurementId: "G-MW2B2K0G6T"
};

// Firebase (app/auth/firestore) is ~470KB and only needed for anonymous
// sign-in + cross-device preset sync — presets already work fully offline
// via localStorage (see usePresets.ts), so nothing needs this bundle
// synchronously on first paint. getFirebase() dynamically imports the SDK
// on first call and memoizes the result; every subsequent call resolves
// instantly off the same cached promise instead of re-importing.
export interface FirebaseBundle {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

let firebasePromise: Promise<FirebaseBundle> | null = null;

export function getFirebase(): Promise<FirebaseBundle> {
  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([{ initializeApp }, { getAuth }, { getFirestore }]) => {
      const app = initializeApp(firebaseConfig);
      return { app, db: getFirestore(app), auth: getAuth(app) };
    });
  }
  return firebasePromise;
}
