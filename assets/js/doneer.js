/* Wildkracht – doneerpagina (schets: er wordt niets verstuurd of opgeslagen) */

(function () {
  const form = document.querySelector("[data-doneer-form]");
  const doelen = document.querySelector("[data-doelen]");
  const impact = document.querySelector("[data-impact]");
  const knop = document.querySelector("[data-knop]");
  const bedankt = document.querySelector("[data-bedankt]");
  const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  // Voorbeelden van wat een bedrag mogelijk maakt (indicatief)
  const VOORBEELDEN = [
    [10, "een jaar lang schriften en potloden voor een kind in een dorp naast een park"],
    [25, "een dag op patrouille voor een ranger uit de buurt"],
    [50, "een vergoeding voor een geit die door een roofdier is gedood, zodat de herder geen wraak neemt"],
    [100, "training en gereedschap voor een boer die bomen op zijn akker laat teruggroeien"],
    [250, "een zender waarmee rangers een neushoorn of leeuw kunnen volgen"],
  ];

  let projecten = [];
  Wildkracht.projecten.then((lijst) => {
    projecten = lijst;
    doelen.insertAdjacentHTML("beforeend", lijst.map((p) => `
      <label class="doel">
        <input type="radio" name="doel" value="${p.id}">
        <span class="doel-kaart">
          <img src="${Wildkracht.fotoPad(p.foto)}" alt="" loading="lazy">
          <span class="doel-titel">${p.kort}</span>
          <span class="doel-sub">${p.land}</span>
        </span>
      </label>`).join(""));
    const gekozen = new URLSearchParams(location.search).get("project");
    const radio = gekozen && form.querySelector(`input[name="doel"][value="${CSS.escape(gekozen)}"]`);
    if (radio) radio.checked = true;
    werkBij();
  });

  const bedrag = () => {
    const ander = Number(form.ander.value);
    if (ander > 0) return Math.round(ander);
    return Number(form.querySelector('input[name="bedrag"]:checked')?.value || 0);
  };
  const doelNaam = () => {
    const id = form.querySelector('input[name="doel"]:checked')?.value;
    return id === "fonds" ? "het Wildkrachtfonds" : (projecten.find((p) => p.id === id)?.kort || "het Wildkrachtfonds");
  };

  function werkBij() {
    const b = bedrag();
    const maand = form.frequentie.value === "maandelijks";
    knop.textContent = b ? `Doneer ${euro.format(b)}${maand ? " per maand" : ""}` : "Kies een bedrag";
    knop.disabled = !b;
    const vb = [...VOORBEELDEN].reverse().find(([grens]) => b >= grens);
    impact.innerHTML = vb
      ? `<strong>${euro.format(b)}${maand ? " per maand" : ""}</strong> kan bijvoorbeeld betalen voor ${vb[1]}.`
      : b ? `<strong>Elke euro telt.</strong> Kleine giften samen betalen voor rangers, scholen en herstel.` : "";
  }

  form.addEventListener("input", (e) => {
    if (e.target.name === "bedrag") form.ander.value = "";
    if (e.target.name === "ander" && form.ander.value) form.querySelectorAll('input[name="bedrag"]').forEach((r) => (r.checked = false));
    werkBij();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = bedrag();
    if (!b) return;
    const naam = form.naam.value.trim();
    const maand = form.frequentie.value === "maandelijks";
    document.querySelector("[data-bedankt-kop]").textContent = naam ? `Dank je wel, ${naam}!` : "Dank je wel!";
    document.querySelector("[data-bedankt-tekst]").textContent =
      `Je ${maand ? "maandelijkse " : ""}gift van ${euro.format(b)} gaat naar ${doelNaam()}. Samen zorgen we dat het wild terugkomt, en dat de mensen die het beschermen er sterker van worden.`;
    form.hidden = true;
    bedankt.hidden = false;
    bedankt.focus();
    bedankt.scrollIntoView({ behavior: "smooth", block: "start" });
    form.reset(); // niets bewaren
  });
})();
