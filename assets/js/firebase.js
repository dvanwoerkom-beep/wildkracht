/* Wildkracht – Firebase-verbinding (login met Google + Firestore-database)
   Deze gegevens zijn openbaar bedoeld; de beveiliging zit in firestore.rules. */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

// Eigenaar: staat altijd op de ledenlijst en is altijd beheerder. Moet gelijk zijn aan firestore.rules.
export const EIGENAAR = "dvanwoerkom@gmail.com";

// Geeft de rol van een ingelogde gebruiker: "eigenaar", "beheerder", "lid" of null (geen toegang)
export async function haalRol(gebruiker) {
  if (!gebruiker?.email || !gebruiker.emailVerified) return null;
  const email = gebruiker.email.toLowerCase();
  if (email === EIGENAAR) return "eigenaar";
  try {
    const lid = await getDoc(doc(db, "leden", email));
    return lid.exists() ? lid.data().rol : null;
  } catch {
    return null;
  }
}

export const isBeheerRol = (rol) => rol === "eigenaar" || rol === "beheerder";
