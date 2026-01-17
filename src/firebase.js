// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqFZo4GDMxM4AERs5PQD2NEeGukyLMPxA",
  authDomain: "mind-mate-94675.firebaseapp.com",
  projectId: "mind-mate-94675",
  storageBucket: "mind-mate-94675.appspot.com",
  messagingSenderId: "1029632166505",
  appId: "1:1029632166505:web:4d5409368adf6d66def0f8",
  measurementId: "G-1XCEPRHZR9"
};

const app = initializeApp(firebaseConfig);

// ✅ Auth
export const auth = getAuth(app);

// ✅ Google provider with proper scopes
export const provider = new GoogleAuthProvider();
provider.addScope("profile"); // needed for photoURL & displayName
provider.addScope("email");   // optional, usually already included
export const db = getFirestore(app);

export { signInWithRedirect, signInWithPopup, signOut };
