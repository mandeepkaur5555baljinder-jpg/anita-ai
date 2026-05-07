import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQ8fujY0X_Kkt_gX9798m4RCrImLa8pp0",
  authDomain: "anita-c2695.firebaseapp.com",
  projectId: "anita-c2695",
  storageBucket: "anita-c2695.firebasestorage.app",
  messagingSenderId: "1043699444975",
  appId: "1:1043699444975:web:373f6be6a5e687f5607f1a",
  measurementId: "G-6935BT5F6L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
