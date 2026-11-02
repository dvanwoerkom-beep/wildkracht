/* Wildkracht Rangers – gedeelde hulpfuncties voor de kidssite */

window.Rangers = (function () {
  const dieren = fetch("dieren.json").then((r) => r.json());
  const fotoPad = (naam) => `../assets/img/foto/${naam}.jpg`;

  // ---------- Voorlezen (spraak van de browser, Nederlands) ----------
  const kanSpreken = "speechSynthesis" in window;
  let actieveKnop = null;

  function stem() {
    const stemmen = speechSynthesis.getVoices();
    return stemmen.find((s) => s.lang === "nl-NL") || stemmen.find((s) => s.lang.startsWith("nl")) || null;
  }

  function lees(tekst, knop) {
    if (!kanSpreken) return;
    const wasActief = actieveKnop === knop && speechSynthesis.speaking;
    stop();
    if (wasActief) return; // tweede klik = stoppen
    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = "nl-NL";
    const s = stem();
    if (s) u.voice = s;
    u.rate = 0.92;
    u.onend = u.onerror = () => { if (actieveKnop) actieveKnop.setAttribute("aria-pressed", "false"); actieveKnop = null; };
    actieveKnop = knop || null;
    if (knop) knop.setAttribute("aria-pressed", "true");
    speechSynthesis.speak(u);
  }

  function stop() {
    if (!kanSpreken) return;
    speechSynthesis.cancel();
    if (actieveKnop) actieveKnop.setAttribute("aria-pressed", "false");
    actieveKnop = null;
  }

  const luidspreker = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Knop die de tekst uit data-lees (of een functie) voorleest
  function voorleesKnop(tekst, label = "Lees voor") {
    if (!kanSpreken) return "";
    const veilig = tekst.replace(/"/g, "&quot;");
    return `<button type="button" class="voorlees" aria-pressed="false" data-lees="${veilig}">${luidspreker}<span>${label}</span></button>`;
  }

  document.addEventListener("click", (e) => {
    const knop = e.target.closest("[data-lees]");
    if (knop) lees(knop.dataset.lees, knop);
  });

  // ---------- Video: eerst een plaatje, pas bij klikken de YouTube-speler ----------
  function video(v) {
    const taal = v.taal === "en" ? " · Engelstalig, maar de beelden zeggen genoeg!" : "";
    return `
      <div class="video" data-video="${v.id}">
        <button type="button" class="video-knop" aria-label="Speel het filmpje: ${v.titel}">
          <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
          <span class="speel" aria-hidden="true"></span>
        </button>
      </div>
      <p class="video-onderschrift">Filmpje: ${v.titel} (${v.bron})${taal}</p>`;
  }

  document.addEventListener("click", (e) => {
    const knop = e.target.closest(".video-knop");
    if (!knop) return;
    const box = knop.closest("[data-video]");
    stop();
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0&modestbranding=1" title="Filmpje" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  });

  // ---------- Opdrachten voor thuis (bewaard in deze browser) ----------
  const OPDRACHTEN = [
    ["Tel de vogels", "Kijk 10 minuten uit het raam of op het schoolplein. Hoeveel verschillende vogels zie je?"],
    ["Maak een wild hoekje", "Vraag of er een stukje tuin of balkon wild mag groeien, voor bijen, vlinders en egels."],
    ["Bouw een insectenhotel", "Van holle stengels, dennenappels en stukjes hout. Hang het op een zonnige plek."],
    ["Vertel over je favoriete dier", "Leg aan iemand thuis of in de klas uit waarom jouw dier zo bijzonder is."],
    ["Teken een dierenposter", "Teken een Afrikaans dier met drie weetjes erbij en hang hem op."],
    ["Ruim zwerfafval op", "Raap samen met een volwassene 10 stukjes afval op. Plastic is gevaarlijk voor dieren."],
    ["Koop nooit iets van een wild dier", "Geen schelpen, koraal, ivoor of schubben als souvenir. Laat ze in de natuur!"],
    ["Spaar voor de natuur", "Lever lege flessen in of verkoop oud speelgoed en geef het geld aan een natuurproject."],
  ];
  const SLEUTEL = "wildkracht-rangers-opdrachten";
  const leesOpgeslagen = () => { try { return JSON.parse(localStorage.getItem(SLEUTEL)) || []; } catch { return []; } };
  const bewaar = (lijst) => { try { localStorage.setItem(SLEUTEL, JSON.stringify(lijst)); } catch {} };

  function actielijst(el) {
    const klaar = new Set(leesOpgeslagen());
    el.innerHTML = `
      <p class="actie-teller" data-teller></p>
      <ul class="actielijst">${OPDRACHTEN.map(([titel, uitleg], i) => `
        <li><label><input type="checkbox" value="${i}" ${klaar.has(i) ? "checked" : ""}>
          <span><strong>${titel}</strong><small>${uitleg}</small></span></label></li>`).join("")}
      </ul>`;
    const teller = el.querySelector("[data-teller]");
    const tel = () => {
      const n = el.querySelectorAll("input:checked").length;
      teller.textContent = n === OPDRACHTEN.length ? "Wauw, alle opdrachten gedaan! Jij bent een echte ranger."
        : `${n} van de ${OPDRACHTEN.length} opdrachten gedaan. Vink af wat je hebt gedaan!`;
    };
    el.addEventListener("change", () => {
      bewaar([...el.querySelectorAll("input:checked")].map((i) => Number(i.value)));
      tel();
    });
    tel();
  }

  return { dieren, fotoPad, lees, stop, voorleesKnop, video, actielijst };
})();
