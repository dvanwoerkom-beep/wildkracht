/* Wildkracht – projectartikel: leest ?id= uit de adresbalk, haalt data + Markdown-tekst op */

(function () {
  const id = new URLSearchParams(location.search).get("id");
  const veld = (naam) => document.querySelector(`[data-veld="${naam}"]`);

  Promise.all([Wildkracht.projecten, Wildkracht.fotos]).then(async ([projecten, fotos]) => {
    const p = projecten.find((x) => x.id === id);
    if (!p) return nietGevonden();

    document.title = `${p.titel} – Wildkracht`;
    const foto = veld("foto");
    foto.src = Wildkracht.fotoPad(p.foto);
    foto.alt = p.fotoAlt;
    veld("land").textContent = p.land;
    veld("titel").textContent = p.titel;
    veld("aanpak").textContent = p.aanpak;
    const f = fotos[p.foto];
    if (f) veld("credit").textContent = `${p.fotoOnderschrift} · Foto: ${f.artist}, ${f.license}`;
    veld("doneerlink").href = `doneer.html?project=${p.id}`;

    veld("cijfers").innerHTML = p.cijfers.map((c) => `<div><dt>${c.getal}</dt><dd>${c.label}</dd></div>`).join("");

    // Artikeltekst (Markdown) ophalen en omzetten
    const md = await fetch(`content/projecten/${p.id}.md`).then((r) => (r.ok ? r.text() : Promise.reject()));
    // Leestijd: tekst zonder bronnenlijst, ± 180 woorden per minuut op een scherm
    const woorden = md.split("## Bronnen")[0].split(/\s+/).length;
    veld("leestijd").textContent = `${Math.max(1, Math.round(woorden / 180))} min lezen`;
    const artikel = veld("tekst");
    artikel.innerHTML = marked.parse(md);
    verfraai(artikel);

    // Drie andere projecten eronder
    const andere = projecten.filter((x) => x.id !== p.id);
    const start = projecten.indexOf(p) % andere.length;
    const keuze = [0, 1, 2].map((i) => andere[(start + i) % andere.length]);
    document.querySelector("[data-meer]").innerHTML = keuze.map((x) => `
      <li class="project-card">
        <a href="project.html?id=${x.id}">
          <div class="project-foto">
            <img src="${Wildkracht.fotoPad(x.foto)}" alt="${x.fotoAlt}" loading="lazy">
            <span class="stempel"><span class="stempel-nr">${x.nr}</span>${x.land}</span>
          </div>
          <div class="project-body">
            <p class="project-aanpak">${x.aanpak}</p>
            <h3>${x.titel}</h3>
            <span class="project-lees">Lees het verhaal</span>
          </div>
        </a>
      </li>`).join("");
  }).catch(nietGevonden);

  // Maakt van "Kanttekeningen" een kader en van "Bronnen" een kleine bronnenlijst
  function verfraai(artikel) {
    artikel.querySelector("p")?.classList.add("artikel-lead");
    artikel.querySelectorAll("h2").forEach((h2) => {
      const titel = h2.textContent.trim().toLowerCase();
      if (titel !== "kanttekeningen" && titel !== "bronnen") return;
      const kader = document.createElement("section");
      kader.className = titel === "kanttekeningen" ? "kanttekening" : "bronnen";
      h2.before(kader);
      let el = h2;
      while (el && !(el !== h2 && el.tagName === "H2")) {
        const volgende = el.nextElementSibling;
        kader.append(el);
        el = volgende;
      }
    });
    artikel.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  function nietGevonden() {
    veld("titel").textContent = "Dit project bestaat (nog) niet";
    veld("tekst").innerHTML = '<p>Ga terug naar <a href="index.html#projecten">alle projecten</a>.</p>';
    document.querySelector(".artikel-zij")?.remove();
  }
})();
