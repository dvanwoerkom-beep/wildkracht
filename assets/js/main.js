/* Wildkracht – algemene interactie (menu, projecten, tellers, fotocredits) */

// Gedeelde data: andere scripts (zoals kaart.js) wachten op deze promises.
window.Wildkracht = {
  projecten: fetch("data/projecten.json").then((r) => r.json()),
  fotos: fetch("data/fotos.json").then((r) => r.json()),
  fotoPad: (naam) => `assets/img/foto/${naam}.jpg`,
};

// ---------- Header: wordt vast/licht zodra je scrolt ----------
const header = document.querySelector("[data-header]");
const updateHeader = () => header.classList.toggle("is-solid", header.hasAttribute("data-solid") || window.scrollY > 40);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// ---------- Mobiel menu ----------
const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const zetMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  header.classList.toggle("menu-open", open);
};
toggle.addEventListener("click", () => zetMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) zetMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") zetMenu(false); });

// ---------- Projectkaarten ----------
const grid = document.querySelector("[data-projecten]");
if (grid) {
  Wildkracht.projecten.then((projecten) => {
    grid.innerHTML = projecten.map((p) => `
      <li class="project-card reveal">
        <a href="project.html?id=${p.id}">
          <div class="project-foto">
            <img src="${Wildkracht.fotoPad(p.foto)}" alt="${p.fotoAlt}" loading="lazy">
            <span class="stempel"><span class="stempel-nr">${p.nr}</span>${p.land}</span>
          </div>
          <div class="project-body">
            <p class="project-aanpak">${p.aanpak}</p>
            <h3>${p.titel}</h3>
            <p>${p.teaser}</p>
            <span class="project-lees">Lees het verhaal</span>
          </div>
        </a>
      </li>`).join("");
    observeer(grid.querySelectorAll(".reveal"));
  });
}

// ---------- Fotoverantwoording ----------
const credits = document.querySelector("[data-fotocredits]");
if (credits) {
  Wildkracht.fotos.then((fotos) => {
    credits.innerHTML = Object.values(fotos).map((f) => {
      const titel = f.title.replace(/\.jpe?g$/i, "");
      const naam = f.source && f.source !== "#" ? `<a href="${f.source}" rel="noopener">${titel}</a>` : titel;
      return `<li>${naam}: ${f.artist}, ${f.license}</li>`;
    }).join("");
  });
}

// ---------- Tellers + verschijnen bij scrollen ----------
const getal = new Intl.NumberFormat("nl-NL");
const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function telOp(el) {
  const doel = Number(el.dataset.count);
  if (rustig) { el.textContent = getal.format(doel); return; }
  const duur = 1600;
  const start = performance.now();
  const stap = (nu) => {
    const t = Math.min((nu - start) / duur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = getal.format(Math.round(doel * eased));
    if (t < 1) requestAnimationFrame(stap);
  };
  requestAnimationFrame(stap);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.count) telOp(el);
    else el.classList.add("is-zichtbaar");
    io.unobserve(el);
  });
}, { threshold: 0.2 });

function observeer(els) { els.forEach((el) => io.observe(el)); }

document.querySelectorAll(".section-head, .stat, .criteria li, .acties li").forEach((el) => el.classList.add("reveal"));
observeer(document.querySelectorAll(".reveal, [data-count]"));
