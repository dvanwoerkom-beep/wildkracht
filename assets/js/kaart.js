/* Wildkracht – klikbare kaart van Afrika (d3 + topojson, landsgrenzen van Natural Earth via world-atlas) */

(function () {
  const svg = document.querySelector("[data-kaart]");
  if (!svg || !window.d3 || !window.topojson) return;

  const panel = document.querySelector("[data-kaart-panel]");
  const lijst = document.querySelector("[data-kaart-lijst]");

  // ISO-landcodes van Afrikaanse landen (Somaliland heeft in de dataset geen code)
  const AFRIKA = new Set([12, 24, 72, 108, 120, 140, 148, 178, 180, 204, 226, 231, 232, 262, 266, 270, 288, 324, 384, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 624, 646, 686, 694, 706, 710, 716, 728, 729, 732, 748, 768, 788, 800, 818, 834, 854, 894]);
  // Landen met een project (voor een iets lichtere kleur)
  const PROJECTLANDEN = new Set([508, 646, 710, 516, 800, 180, 404, 450, 562]);

  const W = 600, H = 640;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  Promise.all([
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((r) => r.json()),
    Wildkracht.projecten,
  ]).then(([wereld, projecten]) => {
    const landen = topojson.feature(wereld, wereld.objects.countries).features
      .filter((f) => AFRIKA.has(Number(f.id)) || f.properties.name === "Somaliland");
    const afrika = { type: "FeatureCollection", features: landen };

    const projectie = d3.geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], afrika);
    const pad = d3.geoPath(projectie);
    const kaart = d3.select(svg);

    kaart.append("g").selectAll("path").data(landen).join("path")
      .attr("class", (d) => "land" + (PROJECTLANDEN.has(Number(d.id)) ? " is-project" : ""))
      .attr("d", pad);

    // Punten die dicht bij elkaar liggen krijgen een "verschuif" [x, y] met een lijntje naar de echte plek
    const plek = (d) => {
      const [x, y] = projectie(d.coord);
      const [dx, dy] = d.verschuif || [0, 0];
      return [x + dx, y + dy];
    };
    kaart.append("g").selectAll("line").data(projecten.filter((d) => d.verschuif)).join("line")
      .attr("class", "marker-lijn")
      .attr("x1", (d) => projectie(d.coord)[0]).attr("y1", (d) => projectie(d.coord)[1])
      .attr("x2", (d) => plek(d)[0]).attr("y2", (d) => plek(d)[1]);

    const markers = kaart.append("g").selectAll("g").data(projecten).join("g")
      .attr("class", "marker")
      .attr("transform", (d) => `translate(${plek(d)})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.nr}. ${d.kort}, ${d.land}`)
      .on("click", (e, d) => kies(d))
      .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); kies(d); } });

    markers.append("circle").attr("class", "marker-ring").attr("r", 13);
    markers.append("circle").attr("class", "marker-dot").attr("r", 11);
    markers.append("text").text((d) => d.nr);

    // Knoppenlijst onder de kaart (handig op mobiel en voor toetsenbord)
    lijst.innerHTML = projecten.map((p) =>
      `<li><button type="button" aria-pressed="false" data-id="${p.id}"><span class="nr">${p.nr}</span>${p.kort}</button></li>`
    ).join("");
    lijst.addEventListener("click", (e) => {
      const knop = e.target.closest("button");
      if (knop) kies(projecten.find((p) => p.id === knop.dataset.id), true);
    });

    function kies(p, scrollNaarPanel) {
      markers.classed("is-actief", (d) => d.id === p.id);
      markers.filter((d) => d.id === p.id).raise();
      lijst.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === p.id)));
      panel.innerHTML = `
        <article class="kaart-kaartje">
          <img src="${Wildkracht.fotoPad(p.foto)}" alt="${p.fotoAlt}">
          <div>
            <p class="kaart-land">${p.land}</p>
            <h3>${p.titel}</h3>
            <p>${p.teaser}</p>
            <a class="link-arrow" href="project.html?id=${p.id}">Lees het verhaal</a>
          </div>
        </article>`;
      if (scrollNaarPanel && window.matchMedia("(max-width: 860px)").matches) {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }).catch(() => {
    svg.remove();
    panel.innerHTML = '<p class="kaart-hint">De kaart kon niet geladen worden. Bekijk de projecten hierboven.</p>';
  });
})();
