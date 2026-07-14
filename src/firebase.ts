import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC3X8Pwq7ZWyciV4kMLLREvAmUkBdaQLu8",
    authDomain: "wav-gradient-app.firebaseapp.com",
      projectId: "wav-gradient-app",
        storageBucket: "wav-gradient-app.firebasestorage.app",
          messagingSenderId: "876680882091",
            appId: "1:876680882091:web:2c4b364dcda043d64994ee",
              measurementId: "G-MW2B2K0G6T"
              };

              const app = initializeApp(firebaseConfig);
              export const db = getFirestore(app);
              export const auth = getAuth(app);
