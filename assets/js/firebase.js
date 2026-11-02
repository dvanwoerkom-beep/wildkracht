/* Wildkracht – Firebase-verbinding (login met Google + Firestore-database)
   Deze gegevens zijn openbaar bedoeld; de beveiliging zit in firestore.rules. */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyCTq5VqOKrXz5GHoMQrqvY_PbKFxZxmSuI",
  authDomain: "wildkracht-nl.firebaseapp.com",
  projectId: "wildkracht-nl",
  storageBucket: "wildkracht-nl.firebasestorage.app",
  messagingSenderId: "29876608970",
  appId: "1:29876608970:web:cf4c4ca50ef14fb3e7b933",
});

export const auth = getAuth(app);
auth.languageCode = "nl";
export const google = new GoogleAuthProvider();
google.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(app);

// Beheerder (mag alle berichten verwijderen en meldingen zien). Moet gelijk zijn aan firestore.rules.
export const BEHEERDER = "dvanwoerkom@gmail.com";
