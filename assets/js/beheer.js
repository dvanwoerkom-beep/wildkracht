/* Wildkracht – ledenbeheer (alleen voor beheerders; de echte controle zit in firestore.rules) */

import { auth, db, EIGENAAR, haalRol, isBeheerRol } from "./firebase.js";
import { login } from "./account.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, Timestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const $ = (sel) => document.querySelector(sel);
const blokken = { laden: $("[data-laden]"), uitgelogd: $("[data-uitgelogd]"), geenToegang: $("[data-geen-toegang]"), beheerder: $("[data-beheerder]") };
const form = $("[data-lid-form]");
const melding = $("[data-melding]");
const tbody = $("[data-leden]");
const zoek = $("[data-zoek]");

const EMAIL_PATROON = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const datum = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let gebruiker = null;
let leden = [];
let stopLeden = null;

function toon(naam) {
  Object.entries(blokken).forEach(([k, el]) => (el.hidden = k !== naam));
}

$("[data-login]").addEventListener("click", login);

onAuthStateChanged(auth, async (g) => {
  stopLeden?.(); stopLeden = null;
  gebruiker = g;
  if (!g) return toon("uitgelogd");
  toon("laden");
  const rol = await haalRol(g);
  if (auth.currentUser?.uid !== g.uid) return;
  if (!isBeheerRol(rol)) {
    $("[data-mijn-email]").textContent = g.email;
    return toon("geenToegang");
  }
  toon("beheerder");
  stopLeden = onSnapshot(collection(db, "leden"), (snap) => {
    leden = snap.docs.map((d) => ({ email: d.id, ...d.data() }))
      .sort((a, b) => (b.toegevoegdOp?.toMillis() ?? 0) - (a.toegevoegdOp?.toMillis() ?? 0));
    tekenLijst();
  }, (e) => { console.error(e); zegMelding("De ledenlijst kon niet geladen worden.", true); });
});

// ---------- Lijst ----------
function tekenLijst() {
  const filter = zoek.value.trim().toLowerCase();
  const zichtbaar = leden.filter((l) => !filter || l.email.includes(filter) || (l.notitie || "").toLowerCase().includes(filter));
  $("[data-aantal]").textContent = `(${leden.length + 1})`;
  const eigenaarRij = !filter || EIGENAAR.includes(filter) ? `
    <tr class="is-eigenaar">
      <td data-label="E-mailadres">${EIGENAAR}</td>
      <td data-label="Naam / notitie">Eigenaar</td>
      <td data-label="Rol"><span class="rol-label">Eigenaar</span></td>
      <td data-label="Toegevoegd">–</td>
      <td></td>
    </tr>` : "";
  const ik = gebruiker?.email?.toLowerCase();
  tbody.innerHTML = eigenaarRij + zichtbaar.map((l) => `
    <tr>
      <td data-label="E-mailadres">${escape(l.email)}${l.email === ik ? ' <span class="chat-jij">jij</span>' : ""}</td>
      <td data-label="Naam / notitie">${escape(l.notitie) || '<span class="leeg">–</span>'}</td>
      <td data-label="Rol">
        <select data-rol="${escape(l.email)}" aria-label="Rol van ${escape(l.email)}">
          <option value="lid" ${l.rol === "lid" ? "selected" : ""}>Lid</option>
          <option value="beheerder" ${l.rol === "beheerder" ? "selected" : ""}>Beheerder</option>
        </select>
      </td>
      <td data-label="Toegevoegd">${l.toegevoegdOp ? datum.format(l.toegevoegdOp.toDate()) : "–"}<small>${escape(l.toegevoegdDoor || "")}</small></td>
      <td><button type="button" class="verwijder-knop" data-verwijder="${escape(l.email)}">Verwijderen</button></td>
    </tr>`).join("") + (zichtbaar.length || eigenaarRij ? "" : `<tr><td colspan="5" class="leeg">Niemand gevonden.</td></tr>`);
}
zoek.addEventListener("input", tekenLijst);

// ---------- Toevoegen ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim().toLowerCase();
  const notitie = form.notitie.value.trim().slice(0, 100);
  const rol = form.rol.value;
  if (!EMAIL_PATROON.test(email)) return zegMelding("Vul een geldig e-mailadres in.", true);
  if (email === EIGENAAR) return zegMelding("Dit is het adres van de eigenaar; die heeft altijd toegang.", true);
  const knop = form.querySelector("button[type=submit]");
  knop.disabled = true;
  try {
    const bestaand = await getDoc(doc(db, "leden", email));
    if (bestaand.exists()) return zegMelding(`${email} staat al op de lijst.`, true);
    await setDoc(doc(db, "leden", email), {
      rol, notitie, toegevoegdOp: Timestamp.now(), toegevoegdDoor: gebruiker.email,
    });
    form.reset();
    zegMelding(`${email} is toegevoegd als ${rol}. Laat het diegene zelf weten.`);
    form.email.focus();
  } catch (err) {
    console.error(err);
    zegMelding("Toevoegen lukte niet. Ben je nog ingelogd als beheerder?", true);
  } finally {
    knop.disabled = false;
  }
});

// ---------- Rol wijzigen en verwijderen ----------
tbody.addEventListener("change", async (e) => {
  const sel = e.target.closest("[data-rol]");
  if (!sel) return;
  const email = sel.dataset.rol;
  const lid = leden.find((l) => l.email === email);
  if (email === gebruiker.email.toLowerCase() && sel.value === "lid" &&
      !confirm("Je maakt jezelf lid. Daarna kun je deze pagina niet meer gebruiken. Doorgaan?")) {
    sel.value = lid.rol; return;
  }
  try {
    await updateDoc(doc(db, "leden", email), { rol: sel.value });
    zegMelding(`${email} is nu ${sel.value}.`);
  } catch (err) {
    console.error(err); sel.value = lid.rol;
    zegMelding("Rol wijzigen lukte niet.", true);
  }
});

tbody.addEventListener("click", async (e) => {
  const knop = e.target.closest("[data-verwijder]");
  if (!knop) return;
  const email = knop.dataset.verwijder;
  const zelf = email === gebruiker.email.toLowerCase();
  if (!confirm(zelf ? "Je verwijdert jezelf. Daarna heb je geen toegang meer tot het gesprek en deze pagina. Doorgaan?"
                    : `${email} verwijderen? Diegene kan daarna niet meer in het gesprek.`)) return;
  try {
    await deleteDoc(doc(db, "leden", email));
    zegMelding(`${email} is verwijderd.`);
  } catch (err) {
    console.error(err);
    zegMelding("Verwijderen lukte niet.", true);
  }
});

// ---------- Overig ----------
function zegMelding(tekst, isFout = false) {
  melding.textContent = tekst;
  melding.classList.toggle("is-fout", isFout);
}

$("[data-kopieer]").addEventListener("click", async (e) => {
  try {
    await navigator.clipboard.writeText($("[data-link]").textContent);
    e.target.textContent = "Gekopieerd!";
    setTimeout(() => (e.target.textContent = "Kopieer link"), 2000);
  } catch { /* kopiëren niet toegestaan: de link staat in beeld */ }
});
