/* Wildkracht – inlogknop in de header (op elke pagina van de volwassenensite) */

import { auth, google } from "./firebase.js";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

export async function login() {
  try {
    await signInWithPopup(auth, google);
  } catch (fout) {
    // Pop-up geblokkeerd (vaak op telefoons): dan via een doorverwijzing
    if (fout.code === "auth/popup-blocked" || fout.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, google);
    } else if (fout.code !== "auth/popup-closed-by-user" && fout.code !== "auth/cancelled-popup-request") {
      alert("Inloggen lukte niet. Probeer het nog eens.");
      console.error(fout);
    }
  }
}

export const logout = () => signOut(auth);

const voornaam = (naam) => (naam || "").split(" ")[0] || "Account";
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const plek = document.querySelector("[data-account]");
if (plek) {
  onAuthStateChanged(auth, (gebruiker) => {
    if (!gebruiker) {
      plek.innerHTML = `<button type="button" class="account-knop" data-login>Inloggen</button>`;
      return;
    }
    const foto = gebruiker.photoURL
      ? `<img src="${escape(gebruiker.photoURL)}" alt="" referrerpolicy="no-referrer">`
      : `<span class="avatar-letter" aria-hidden="true">${escape(voornaam(gebruiker.displayName)[0])}</span>`;
    plek.innerHTML = `
      <button type="button" class="account-knop account-ingelogd" aria-expanded="false" aria-controls="accountmenu" data-account-toggle>
        ${foto}<span>${escape(voornaam(gebruiker.displayName))}</span>
      </button>
      <div class="account-menu" id="accountmenu" hidden>
        <p class="account-naam">${escape(gebruiker.displayName)}<small>${escape(gebruiker.email)}</small></p>
        <a href="gesprek.html">Naar het gesprek</a>
        <button type="button" data-logout>Uitloggen</button>
      </div>`;
  });

  plek.addEventListener("click", (e) => {
    if (e.target.closest("[data-login]")) login();
    if (e.target.closest("[data-logout]")) logout();
    const toggle = e.target.closest("[data-account-toggle]");
    if (toggle) {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      plek.querySelector(".account-menu").hidden = !open;
    }
  });
  document.addEventListener("click", (e) => {
    if (plek.contains(e.target)) return;
    const toggle = plek.querySelector("[data-account-toggle]");
    if (toggle) { toggle.setAttribute("aria-expanded", "false"); plek.querySelector(".account-menu").hidden = true; }
  });
}
