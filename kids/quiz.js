/* Wildkracht Rangers – de dierenquiz
   Verloop: per dier eerst kennismaken (Pip + filmpje), dan 1 (jong) of 2 (oud) vragen
   met directe uitleg. Daarna: favoriete dier kiezen → resultaat met diploma en opdrachten. */

(function () {
  const niveau = new URLSearchParams(location.search).get("niveau") === "oud" ? "oud" : "jong";
  const NIVEAUNAAM = { jong: "Junior Ranger", oud: "Expert Ranger" };
  document.querySelector("[data-niveau-naam]").textContent = `Dierenquiz · ${NIVEAUNAAM[niveau]}`;

  const scherm = document.querySelector("[data-scherm]");
  const voortgangTekst = document.querySelector("[data-voortgang-tekst]");
  const balk = document.querySelector(".voortgang-balk");
  const sterrenEl = document.querySelector("[data-sterren]");
  const PIP = { blij: "../assets/img/pip-juich.webp", denk: "../assets/img/pip-denk.webp", staand: "../assets/img/mascotte-pip.webp" };
  const LETTERS = ["A", "B", "C", "D"];

  let dieren = [];
  let dierIndex = 0;
  let vraagIndex = 0;
  let sterren = 0;
  let totaalVragen = 0;

  Rangers.dieren.then((lijst) => {
    dieren = lijst;
    totaalVragen = dieren.reduce((n, d) => n + d.vragen[niveau].length, 0);
    toonDier();
  });

  function zetVoortgang() {
    const klaar = Math.min(dierIndex, dieren.length);
    voortgangTekst.textContent = dierIndex < dieren.length ? `Dier ${dierIndex + 1} van ${dieren.length}` : "Klaar!";
    balk.setAttribute("aria-valuenow", klaar);
    balk.firstElementChild.style.width = `${(klaar / dieren.length) * 100}%`;
    sterrenEl.textContent = `★ ${sterren}`;
    sterrenEl.setAttribute("aria-label", `${sterren} sterren`);
  }

  function nieuwScherm(html) {
    Rangers.stop();
    scherm.innerHTML = `<div class="scherm">${html}</div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const kop = scherm.querySelector("h1, h2");
    if (kop) { kop.tabIndex = -1; kop.focus({ preventScroll: true }); }
  }

  // ---------- 1. Kennismaken met het dier ----------
  function toonDier() {
    zetVoortgang();
    const d = dieren[dierIndex];
    vraagIndex = 0;
    const weetjes = niveau === "jong" ? d.weetjes.slice(0, 2) : d.weetjes;
    nieuwScherm(`
      <p class="dier-label">Dier ${dierIndex + 1}</p>
      <h1>${d.naam}</h1>
      <div class="intro-grid">
        <div>
          <img class="intro-foto" src="${Rangers.fotoPad(d.foto)}" alt="${d.fotoAlt}">
          <div class="pip-rij">
            <img src="${PIP.staand}" alt="Pip">
            <div class="ballon ballon-links">
              <p class="naam">Pip zegt</p>
              <p>${d.pip}</p>
              ${Rangers.voorleesKnop(d.pip)}
            </div>
          </div>
        </div>
        <div>
          ${Rangers.video(d.video)}
          <h2 style="font-size:1.4rem;margin-top:1.2em">Wist je dat…</h2>
          <ul class="weetjes">${weetjes.map((w) => `<li>${w}</li>`).join("")}</ul>
          <div class="acties-rij">
            <button type="button" class="btn btn-zon" data-naar-vraag>Naar de vraag →</button>
            ${Rangers.voorleesKnop(weetjes.join(" "), "Lees weetjes voor")}
          </div>
        </div>
      </div>`);
    scherm.querySelector("[data-naar-vraag]").addEventListener("click", toonVraag);
  }

  // ---------- 2. De vraag ----------
  function toonVraag() {
    const d = dieren[dierIndex];
    const vragen = d.vragen[niveau];
    const v = vragen[vraagIndex];
    const voorleesTekst = `${v.vraag} ${v.opties.map((o, i) => `${LETTERS[i]}: ${o}.`).join(" ")}`;
    nieuwScherm(`
      <div class="vraag-kaart">
        <div class="vraag-kop">
          <p class="dier-label">${d.kort} · vraag ${vraagIndex + 1} van ${vragen.length}</p>
          ${Rangers.voorleesKnop(voorleesTekst)}
        </div>
        <h2>${v.vraag}</h2>
        <ul class="opties">${v.opties.map((o, i) => `
          <li><button type="button" class="optie" data-optie="${i}"><span class="optie-letter">${LETTERS[i]}</span><span>${o}</span></button></li>`).join("")}
        </ul>
        <div data-feedback></div>
      </div>`);
    scherm.querySelector(".opties").addEventListener("click", (e) => {
      const knop = e.target.closest("[data-optie]");
      if (knop) beantwoord(Number(knop.dataset.optie), v);
    });
  }

  function beantwoord(keuze, v) {
    Rangers.stop();
    const knoppen = scherm.querySelectorAll("[data-optie]");
    knoppen.forEach((k) => (k.disabled = true));
    knoppen[v.goed].classList.add("is-goed");
    const goed = keuze === v.goed;
    if (goed) sterren++;
    else knoppen[keuze].classList.add("is-fout");
    zetVoortgang();

    const laatsteVraag = vraagIndex === dieren[dierIndex].vragen[niveau].length - 1;
    const laatsteDier = dierIndex === dieren.length - 1;
    const verder = !laatsteVraag ? "Volgende vraag →" : laatsteDier ? "Naar de finish →" : "Volgend dier →";
    const kop = goed ? kies(["Goed zo!", "Helemaal goed!", "Knap gedaan!", "Yes, goed!"]) : kies(["Bijna!", "Goed geprobeerd!", "Oei, net niet!"]);
    const intro = goed ? "" : `Het goede antwoord is <strong>${v.opties[v.goed]}</strong>. `;

    const fb = scherm.querySelector("[data-feedback]");
    fb.innerHTML = `
      <div class="feedback ${goed ? "feedback-goed" : "feedback-fout"}">
        <img src="${goed ? PIP.blij : PIP.denk}" alt="${goed ? "Pip juicht" : "Pip denkt na"}">
        <div class="ballon ballon-links">
          <h3>${kop}</h3>
          <p>${intro}${v.uitleg}</p>
          ${Rangers.voorleesKnop(`${kop} ${intro.replace(/<[^>]+>/g, "")}${v.uitleg}`)}
        </div>
      </div>
      <div class="acties-rij"><button type="button" class="btn btn-nacht" data-verder>${verder}</button></div>`;
    const knopVerder = fb.querySelector("[data-verder]");
    knopVerder.focus({ preventScroll: true });
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    knopVerder.addEventListener("click", () => {
      if (!laatsteVraag) { vraagIndex++; toonVraag(); }
      else { dierIndex++; dierIndex < dieren.length ? toonDier() : toonFavorietKeuze(); }
    });
  }

  const kies = (lijst) => lijst[Math.floor(Math.random() * lijst.length)];

  // ---------- 3. Favoriete dier kiezen ----------
  function toonFavorietKeuze() {
    zetVoortgang();
    nieuwScherm(`
      <div class="resultaat-kop">
        <img src="${PIP.blij}" alt="Pip juicht">
        <h1>Je hebt alle 10 dieren ontdekt!</h1>
        <p>Nog één vraag, en die is makkelijk: welk dier vond jij het leukst?</p>
      </div>
      <ul class="favoriet-grid">${dieren.map((d) => `
        <li><button type="button" data-favoriet="${d.id}"><img src="${Rangers.fotoPad(d.foto)}" alt=""><span>${d.kort}</span></button></li>`).join("")}
      </ul>`);
    scherm.querySelector(".favoriet-grid").addEventListener("click", (e) => {
      const knop = e.target.closest("[data-favoriet]");
      if (knop) toonResultaat(dieren.find((d) => d.id === knop.dataset.favoriet));
    });
  }

  // ---------- 4. Resultaat: favoriet, diploma en opdrachten ----------
  function toonResultaat(fav) {
    let naam = "";
    try { naam = localStorage.getItem("wildkracht-rangers-naam") || ""; } catch {}
    const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    const lof = sterren === totaalVragen ? "Alles goed, wauw!" : sterren >= totaalVragen * 0.7 ? "Super gedaan!" : "Je hebt heel veel geleerd!";

    nieuwScherm(`
      <div class="resultaat-kop">
        <img src="${PIP.blij}" alt="Pip juicht">
        <h1>Je bent een ${NIVEAUNAAM[niveau]}!</h1>
        <p><strong>${lof}</strong> Je had ${sterren} van de ${totaalVragen} vragen in één keer goed.${sterren < totaalVragen ? " En bij de andere vragen heb je iets nieuws geleerd." : ""}</p>
      </div>

      <section class="resultaat-blok" aria-labelledby="fav-kop">
        <div class="favoriet-kaart">
          <img src="${Rangers.fotoPad(fav.foto)}" alt="${fav.fotoAlt}">
          <div>
            <p class="dier-label">Jouw favoriete dier</p>
            <h2 id="fav-kop">${fav.naam}</h2>
            <ul class="weetjes">${fav.weetjes.map((w) => `<li>${w}</li>`).join("")}</ul>
            <p><strong>Goed nieuws:</strong> ${fav.actie}</p>
          </div>
        </div>
      </section>

      <section class="resultaat-blok diploma-blok" aria-labelledby="dip-kop">
        <h2 id="dip-kop">Jouw ranger-diploma</h2>
        <label class="naam-veld">
          <span>Hoe heet je?</span>
          <input type="text" data-naam maxlength="40" placeholder="Typ je naam" value="${naam.replace(/"/g, "&quot;")}" autocomplete="off">
          <button type="button" class="btn btn-zon" data-print>Print je diploma</button>
        </label>
        <div class="diploma">
          <p class="diploma-kicker">Wildkracht Rangers</p>
          <h3>Diploma ${NIVEAUNAAM[niveau]}</h3>
          <p>Dit diploma is voor</p>
          <p class="diploma-naam" data-diploma-naam>${naam || "…"}</p>
          <p>omdat je 10 Afrikaanse dieren hebt ontdekt en nu weet hoe je de natuur kunt helpen. Favoriete dier: <strong>${fav.kort.toLowerCase()}</strong>.</p>
          <p class="diploma-datum">${datum}</p>
          <span class="diploma-zegel">★ ${sterren}<br>sterren</span>
          <img class="diploma-pip" src="${PIP.blij}" alt="">
        </div>
      </section>

      <section class="resultaat-blok" aria-labelledby="opd-kop">
        <h2 id="opd-kop">Jouw ranger-opdrachten</h2>
        <p>Rangers in Afrika beschermen olifanten, leeuwen en gorilla's. Jij kunt de natuur bij jou in de buurt helpen!</p>
        <div data-actielijst></div>
      </section>

      <div class="acties-rij" style="justify-content:center">
        <a class="btn btn-nacht" href="quiz.html?niveau=${niveau === "jong" ? "oud" : "jong"}">${niveau === "jong" ? "Probeer de Expert-quiz" : "Doe de Junior-quiz"}</a>
        <a class="btn btn-licht" href="index.html">Terug naar start</a>
      </div>`);

    const invoer = scherm.querySelector("[data-naam]");
    const dipNaam = scherm.querySelector("[data-diploma-naam]");
    invoer.addEventListener("input", () => {
      dipNaam.textContent = invoer.value.trim() || "…";
      try { localStorage.setItem("wildkracht-rangers-naam", invoer.value.trim()); } catch {}
    });
    scherm.querySelector("[data-print]").addEventListener("click", () => {
      if (!invoer.value.trim()) { invoer.focus(); invoer.placeholder = "Typ eerst je naam!"; return; }
      document.body.classList.add("print-diploma");
      window.print();
    });
    window.addEventListener("afterprint", () => document.body.classList.remove("print-diploma"));
    Rangers.actielijst(scherm.querySelector("[data-actielijst]"));
  }
})();
