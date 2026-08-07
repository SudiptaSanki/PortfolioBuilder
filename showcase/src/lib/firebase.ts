import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "portfolio4builders",
  appId: "1:647502686537:web:5d3ab0f49fd0d8ad949298",
  storageBucket: "portfolio4builders.firebasestorage.app",
  apiKey: "AIzaSyA3ObFMtD3V-2t3vN4Ga9QQD34sPZTXHGY",
  authDomain: "portfolio4builders.firebaseapp.com",
  messagingSenderId: "647502686537",
  measurementId: "G-TZV1PP9XZJ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
