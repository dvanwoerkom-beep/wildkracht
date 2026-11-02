/* Wildkracht – het gesprek (realtime chat via Firestore) */

import { auth, db, haalRol, isBeheerRol } from "./firebase.js";
import { login, logout } from "./account.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection, doc, query, orderBy, limit, onSnapshot, writeBatch, deleteDoc, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const $ = (sel) => document.querySelector(sel);
const uitgelogd = $("[data-uitgelogd]");
const venster = $("[data-venster]");
const laden = $("[data-laden]");
const lijst = $("[data-berichten]");
const form = $("[data-form]");
const teller = $("[data-teller]");
const fout = $("[data-fout]");
const meldBlok = $("[data-meldingen]");
const geenToegang = $("[data-geen-toegang]");

const MAX_BERICHTEN = 150;
let gebruiker = null;
let isBeheerder = false;
let stopBerichten = null;
let stopMeldingen = null;
let berichten = new Map();

const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tijdFormaat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const tijdTekst = (ts) => (ts ? tijdFormaat.format(ts.toDate()) : "zojuist");

$("[data-login]").addEventListener("click", login);
$("[data-logout-gesprek]").addEventListener("click", logout);

onAuthStateChanged(auth, async (g) => {
  stopBerichten?.(); stopBerichten = null;
  stopMeldingen?.(); stopMeldingen = null;
  lijst.innerHTML = "";
  gebruiker = g;
  laden.hidden = false;
  [uitgelogd, venster, geenToegang, meldBlok].forEach((el) => (el.hidden = true));

  if (!g) { laden.hidden = true; uitgelogd.hidden = false; return; }

  // Gesloten gesprek: alleen mensen op de ledenlijst
  const rol = await haalRol(g);
  if (auth.currentUser?.uid !== g.uid) return; // inmiddels uitgelogd of gewisseld
  laden.hidden = true;
  if (!rol) {
    $("[data-mijn-email]").textContent = g.email;
    geenToegang.hidden = false;
    return;
  }
  isBeheerder = isBeheerRol(rol);
  venster.hidden = false;
  meldBlok.hidden = !isBeheerder;
  luisterNaarBerichten();
  if (isBeheerder) luisterNaarMeldingen();
});

// ---------- Berichten lezen ----------
function luisterNaarBerichten() {
  const q = query(collection(db, "berichten"), orderBy("tijd", "desc"), limit(MAX_BERICHTEN));
  stopBerichten = onSnapshot(q, (snap) => {
    const bijnaOnderaan = lijst.scrollHeight - lijst.scrollTop - lijst.clientHeight < 120;
    berichten = new Map(snap.docs.map((d) => [d.id, d.data({ serverTimestamps: "estimate" })]));
    const items = snap.docs.slice().reverse();
    lijst.innerHTML = items.length
      ? items.map((d) => berichtHtml(d.id, d.data({ serverTimestamps: "estimate" }), d.metadata.hasPendingWrites)).join("")
      : `<li class="chat-leeg">Nog geen berichten. Begin jij het gesprek?</li>`;
    if (bijnaOnderaan || snap.docChanges().some((c) => c.type === "added" && c.doc.data().uid === gebruiker?.uid)) {
      lijst.scrollTop = lijst.scrollHeight;
    }
  }, (e) => {
    console.error(e);
    lijst.innerHTML = `<li class="chat-leeg">Het gesprek kon niet geladen worden. Probeer de pagina te verversen.</li>`;
  });
}

function berichtHtml(id, b, bezig) {
  const vanMij = b.uid === gebruiker?.uid;
  const foto = b.foto
    ? `<img class="chat-avatar" src="${escape(b.foto)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
    : `<span class="chat-avatar avatar-letter" aria-hidden="true">${escape((b.naam || "?")[0])}</span>`;
  const acties = [];
  if (vanMij || isBeheerder) acties.push(`<button type="button" data-verwijder="${id}">Verwijder</button>`);
  if (!vanMij) acties.push(`<button type="button" data-meld="${id}">Meld</button>`);
  return `
    <li class="chat-bericht${vanMij ? " van-mij" : ""}${bezig ? " is-bezig" : ""}">
      ${foto}
      <div class="chat-inhoud">
        <p class="chat-meta"><strong>${escape(b.naam)}</strong>${vanMij ? " <span class=\"chat-jij\">jij</span>" : ""} <time>${tijdTekst(b.tijd)}</time></p>
        <p class="chat-tekst">${escape(b.tekst)}</p>
        <div class="chat-acties">${acties.join("")}</div>
      </div>
    </li>`;
}

// ---------- Bericht plaatsen ----------
form.tekst.addEventListener("input", () => {
  teller.textContent = `${form.tekst.value.length} / 1000`;
  fout.textContent = "";
});
form.tekst.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tekst = form.tekst.value.trim();
  if (!tekst || !gebruiker) return;
  if (!gebruiker.displayName) { fout.textContent = "Je Google-account heeft geen naam. Voeg die toe in je Google-account."; return; }
  const knop = form.querySelector("button[type=submit]");
  knop.disabled = true;
  try {
    const batch = writeBatch(db);
    const bericht = { tekst, uid: gebruiker.uid, naam: gebruiker.displayName, tijd: serverTimestamp() };
    if (gebruiker.photoURL) bericht.foto = gebruiker.photoURL;
    batch.set(doc(collection(db, "berichten")), bericht);
    batch.set(doc(db, "gebruikers", gebruiker.uid), { laatst: serverTimestamp() });
    await batch.commit();
    form.reset();
    teller.textContent = "0 / 1000";
  } catch (err) {
    console.error(err);
    fout.textContent = err.code === "permission-denied"
      ? "Even geduld: je kunt één bericht per 5 seconden plaatsen."
      : "Versturen lukte niet. Probeer het nog eens.";
  } finally {
    knop.disabled = false;
    form.tekst.focus();
  }
});

// ---------- Verwijderen en melden ----------
lijst.addEventListener("click", async (e) => {
  const verwijder = e.target.closest("[data-verwijder]");
  const meld = e.target.closest("[data-meld]");
  if (verwijder) {
    if (!confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    try { await deleteDoc(doc(db, "berichten", verwijder.dataset.verwijder)); }
    catch (err) { console.error(err); alert("Verwijderen lukte niet."); }
  }
  if (meld) {
    const b = berichten.get(meld.dataset.meld);
    if (!b || !confirm(`Wil je dit bericht van ${b.naam} melden bij de beheerder?`)) return;
    try {
      await addDoc(collection(db, "meldingen"), {
        berichtId: meld.dataset.meld, tekst: b.tekst, naamAfzender: b.naam,
        melderUid: gebruiker.uid, melderNaam: gebruiker.displayName, tijd: serverTimestamp(),
      });
      meld.textContent = "Gemeld";
      meld.disabled = true;
    } catch (err) { console.error(err); alert("Melden lukte niet."); }
  }
});

// ---------- Meldingen (alleen beheerder) ----------
function luisterNaarMeldingen() {
  const q = query(collection(db, "meldingen"), orderBy("tijd", "desc"), limit(50));
  stopMeldingen = onSnapshot(q, (snap) => {
    $("[data-meld-aantal]").textContent = `(${snap.size})`;
    $("[data-meld-lijst]").innerHTML = snap.empty
      ? `<li class="meld-leeg">Geen meldingen. Fijn!</li>`
      : snap.docs.map((d) => {
          const m = d.data({ serverTimestamps: "estimate" });
          const bestaat = berichten.has(m.berichtId);
          return `
            <li>
              <p class="meld-tekst">"${escape(m.tekst)}"</p>
              <p class="meld-meta">Van <strong>${escape(m.naamAfzender)}</strong> · gemeld door ${escape(m.melderNaam)} · ${tijdTekst(m.tijd)}</p>
              <div class="chat-acties">
                ${bestaat ? `<button type="button" data-meld-verwijder="${escape(m.berichtId)}" data-melding="${d.id}">Bericht verwijderen</button>` : `<span class="meld-weg">Bericht is al verwijderd</span>`}
                <button type="button" data-melding-sluit="${d.id}">Melding sluiten</button>
              </div>
            </li>`;
        }).join("");
  }, (e) => console.error(e));
}

$("[data-meld-lijst]").addEventListener("click", async (e) => {
  const verwijder = e.target.closest("[data-meld-verwijder]");
  const sluit = e.target.closest("[data-melding-sluit]");
  try {
    if (verwijder) {
      await deleteDoc(doc(db, "berichten", verwijder.dataset.meldVerwijder));
      await deleteDoc(doc(db, "meldingen", verwijder.dataset.melding));
    }
    if (sluit) await deleteDoc(doc(db, "meldingen", sluit.dataset.meldingSluit));
  } catch (err) { console.error(err); alert("Dat lukte niet."); }
});
