/* =========================================================
   GRAM — main.js
   Header, footer, cardurile de produs și afișarea fiecărei
   pagini. Datele (PRODUCTS, KITS, SHOP...) vin din products.js,
   care se încarcă ÎNAINTE de acest fișier.
   ========================================================= */


/* ---------- 1. Iconițe SVG (linie, stroke 2) ---------- */

const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',
  bag: '<path d="M4 8h16l-1.2 13H5.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  truck: '<path d="M1 5h13v11H1zM14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>',
  return: '<path d="M3 7h12a6 6 0 0 1 0 12H8"/><path d="M7 3 3 7l4 4"/>',
  weight: '<circle cx="12" cy="5" r="2"/><path d="M6 9h12l2 11H4z"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><path d="M15 4v4M9 10v4M17 16v4"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12l5 5 9-10"/>'
};

// Întoarce codul SVG al unei iconițe (aria-hidden: e doar decor)
function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="square" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}


/* ---------- 1b. Micro-animații: funcții ajutătoare ---------- */

// true dacă utilizatorul a cerut mai puțină mișcare (setarea sistemului)
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Citește o durată din CSS (ex: "--dur" → 220), ca JS și CSS să folosească aceleași valori
function cssMs(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

// Curba pentru intrări (aceeași ca --ease din CSS)
function cssEase() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease").trim() || "ease-out";
}

// Rulează o animație (Web Animations API) doar dacă mișcarea e permisă.
// Întoarce o promisiune care se termină când animația s-a terminat (sau imediat).
function animate(element, keyframes, options) {
  if (!element || !element.animate || prefersReducedMotion()) return Promise.resolve();
  return element.animate(keyframes, options).finished.catch(() => {});
}

// Pozele de produs apar cu fade după încărcare (vezi .js-fade în style.css).
// „load” nu urcă prin document, dar îl prindem în faza de capturare (true).
function setupImageFade() {
  document.documentElement.classList.add("js-fade");
  const markLoaded = event => {
    if (event.target.tagName === "IMG") event.target.classList.add("is-loaded");
  };
  document.addEventListener("load", markLoaded, true);
  document.addEventListener("error", markLoaded, true); // o poză stricată nu rămâne invizibilă
}

// Pozele deja încărcate (din cache) primesc imediat clasa
function markLoadedImages() {
  document.querySelectorAll("img").forEach(img => {
    if (img.complete) img.classList.add("is-loaded");
  });
}

// „Adaugă în coș”: ~1,2s bifă + „Adăugat” (aceeași lățime), apoi revine.
// Cât timp arată „Adăugat”, butonul nu poate fi apăsat din nou (vezi isButtonBusy).
function showAddedFeedback(button, onDone) {
  if (!button) return;
  const original = button.innerHTML;
  button.dataset.busy = "true";
  button.style.width = button.offsetWidth + "px"; // lățimea nu se schimbă
  button.classList.add("is-added");
  button.innerHTML = `${icon("check", "icon-sm")}<span>Adăugat</span>`;

  setTimeout(() => {
    button.innerHTML = original;
    button.style.width = "";
    button.classList.remove("is-added");
    delete button.dataset.busy;
    if (onDone) onDone();
  }, 1200);
}

function isButtonBusy(button) {
  return Boolean(button && button.dataset.busy);
}

// Numărul de pe iconița coșului face un mic „puls”
function pulseCartCount() {
  animate(document.querySelector(".cart-count"),
    [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
    { duration: cssMs("--dur-slow"), easing: cssEase() });
}

// Un text se schimbă cu un fade scurt (doar dacă s-a schimbat de fapt)
function setTextWithFade(element, text) {
  if (element.textContent === text) return;
  const hadText = element.textContent !== "";
  element.textContent = text;
  if (hadText) animate(element, [{ opacity: 0 }, { opacity: 1 }], { duration: cssMs("--dur-fast"), easing: cssEase() });
}

// Schimbă poza fără „clipire”: încarcă întâi poza nouă, apoi o arată cu fade
function swapImage(img, src) {
  if (!img || img.getAttribute("src") === src) return;
  img.dataset.nextSrc = src;
  const loader = new Image();
  const show = () => {
    if (img.dataset.nextSrc !== src) return; // între timp s-a ales altă poză
    img.src = src;
    animate(img, [{ opacity: 0 }, { opacity: 1 }], { duration: cssMs("--dur-fast"), easing: cssEase() });
  };
  loader.onload = show;
  loader.onerror = show;
  loader.src = src;
}

// O cifră (grame) „curge” de la valoarea veche la cea nouă
function countUpWeight(element, from, to) {
  if (prefersReducedMotion() || from === to) {
    element.textContent = showWeight(to);
    return;
  }
  const duration = cssMs("--dur-slow");
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out
    element.textContent = showWeight(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Catalog: cardurile noi apar cu fade, cu 20ms între ele (doar primele 8)
function animateCardsIn(container) {
  [...container.children].forEach((card, i) => {
    animate(card, [{ opacity: 0 }, { opacity: 1 }], {
      duration: cssMs("--dur-fast"),
      delay: i < 8 ? i * 20 : 0,
      easing: cssEase(),
      fill: "backwards"
    });
  });
}

// Barele (livrare gratuită, greutate) pornesc de la lățimea veche spre cea nouă.
// oldWidths = { cheie: "42%" } citite înainte să redesenăm coșul.
function readBarWidths() {
  const widths = {};
  document.querySelectorAll("[data-bar]").forEach(el => { widths[el.dataset.bar] = el.style.width; });
  return widths;
}

function animateBarsFrom(oldWidths) {
  document.querySelectorAll("[data-bar]").forEach(el => {
    const target = el.style.width;
    const from = oldWidths[el.dataset.bar] || "0%";
    if (from === target) return;
    el.style.width = from;
    el.getBoundingClientRect(); // forțăm browserul să „vadă” lățimea veche
    el.style.width = target;    // tranziția din CSS face restul
  });
}


/* ---------- 2. Funcții ajutătoare ---------- */

// Ia un parametru din adresă: produs.html?id=abc → getParam("id") = "abc"
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Găsește o categorie după id
function getCategory(id) {
  return CATEGORIES.find(c => c.id === id);
}

// Toate produsele dintr-o categorie
function getProductsInCategory(categoryId) {
  return PRODUCTS.filter(p => p.category === categoryId);
}

// Pozele unui produs în culoarea aleasă: pentru fiecare poziție i,
// color.images[i] dacă există, altfel product.images[i].
// Vezi explicația câmpului `images` din products.js.
function getProductImages(product, colorId) {
  const color = product.colors.find(c => c.id === colorId);
  const colorImages = color && Array.isArray(color.images) ? color.images : [];
  return product.images.map((src, i) => colorImages[i] || src);
}

// Prima poză (cea principală) în culoarea aleasă
function getProductImage(product, colorId) {
  return getProductImages(product, colorId)[0];
}

// true dacă o culoare are măcar o poză proprie
function hasColorImages(color) {
  return Boolean(color && Array.isArray(color.images) && color.images.length > 0);
}

// Culoarea pe care o arată de fapt poza (cea aleasă, dacă are poze proprii;
// altfel culoarea implicită) — pentru textul alternativ
function getShownColor(product, colorId) {
  const color = product.colors.find(c => c.id === colorId);
  return hasColorImages(color) ? color : product.colors[0];
}

// Greutatea celei mai ușoare variante
function getMinWeight(product) {
  return Math.min(...product.variants.map(v => v.weight));
}

// true dacă variantele au prețuri diferite (atunci scriem „de la ...”)
function hasDifferentPrices(product) {
  const prices = product.variants.map(v => v.price);
  return Math.min(...prices) !== Math.max(...prices);
}

// Prețul redus + prețul vechi tăiat (kit-uri). Același HTML peste tot;
// stilul e în clasele .price-pair / .price--sale / .price-old din style.css.
function salePriceHTML(price, fullPrice) {
  return `<span class="price-pair">` +
    `<span class="price--sale"><span class="visually-hidden">Preț redus: </span>${showPrice(price)}</span>` +
    `<s class="price-old"><span class="visually-hidden">Preț vechi: </span>${showPrice(fullPrice)}</s>` +
    `</span>`;
}

// Banda neagră de sus. Sub 480px se vede doar textul scurt (vezi CSS).
function demoBarHTML() {
  return `
    <p class="demo-bar">
      <span class="demo-long">Magazin demo de portofoliu · nu se fac plăți reale</span>
      <span class="demo-short">Magazin demo · fără plăți reale</span>
    </p>`;
}

// Prețul și greutatea pentru afișare: folosim formatPrice() / formatWeight()
// din products.js, dar înlocuim spațiile cu spații „nedespărțibile”,
// ca „3 000 lei” să nu se rupă pe două rânduri.
function showPrice(lei) {
  return formatPrice(lei).replace(/ /g, "\u00A0");
}

function showWeight(grams) {
  return formatWeight(grams).replace(/ /g, "\u00A0");
}

// Textul etichetelor de pe card
const TAG_LABELS = {
  "nou": "Nou",
  "sub-100g": "Sub 100 g",
  "usor": "Ușor"
};

// „1 produs”, „3 produse”, „20 de produse” (regula din română)
function countLabel(n, one, many) {
  if (n === 1) return "1 " + one;
  if (n >= 20) return n + " de " + many;
  return n + " " + many;
}


/* ---------- 3. Header ---------- */

function renderHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  // Checkout: header simplificat (doar logo + „Înapoi la coș”), fără meniu
  if (document.body.dataset.header === "simple") {
    header.innerHTML = `
      ${demoBarHTML()}
      <div class="site-header-inner header-simple">
        <div class="container header-main">
          <a class="logo" href="index.html">Gram</a>
          <a class="back-link" href="cos.html">${icon("arrowLeft", "icon-sm")}Înapoi la coș</a>
        </div>
      </div>`;
    return;
  }

  header.innerHTML = `
    ${demoBarHTML()}
    <div class="site-header-inner">
      <div class="container header-main">
        <a class="logo" href="index.html">Gram</a>

        <!-- Meniul de desktop (de la 1024px) -->
        <nav class="desktop-nav" aria-label="Meniu principal">
          <ul class="desktop-nav-list">
            <li class="catalog-menu">
              <button class="nav-item catalog-toggle" type="button" aria-expanded="false" aria-controls="catalog-panel">
                Catalog ${icon("chevron", "icon-sm chevron")}
              </button>
              ${catalogPanelHTML()}
            </li>
            <li>
              <a class="nav-item" href="catalog.html?cat=kituri" data-cat="kituri">
                Kit-uri și oferte <span class="badge">${kitDiscountLabel()}</span>
              </a>
            </li>
            <li><a class="nav-item" href="ghid.html" data-nav="guide">Ghid de echipament</a></li>
          </ul>
        </nav>

        <!-- Căutarea (desktop): duce la catalog.html?q=... -->
        <form class="header-search" role="search" action="catalog.html" method="get">
          <label class="visually-hidden" for="header-search-input">Caută produse</label>
          <input class="input" id="header-search-input" name="q" type="search" placeholder="Caută: frontală, cană…" required>
          <button class="header-search-submit" type="submit" aria-label="Caută">${icon("search", "icon-sm")}</button>
        </form>

        <div class="header-actions">
          <!-- Lupa: doar sub 1024px (pe desktop căutarea e mereu vizibilă) -->
          <button class="icon-btn search-toggle" type="button" aria-label="Caută" aria-expanded="false" aria-controls="search-bar">${icon("search")}</button>
          <a class="icon-btn cart-link" href="cos.html">
            ${icon("bag")}
            <span class="cart-count" aria-hidden="true"></span>
          </a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
            ${icon("menu", "icon-sm")}<span>Meniu</span>
          </button>
        </div>
      </div>

      <!-- Rândul de căutare de sub header (telefon / tabletă), deschis de lupă -->
      <form class="search-bar" id="search-bar" role="search" action="catalog.html" method="get" hidden>
        <div class="container search-bar-inner">
          <label class="visually-hidden" for="bar-search-input">Caută produse</label>
          <input class="input" id="bar-search-input" name="q" type="search" placeholder="Caută: frontală, cană…" required>
          <button class="btn btn-primary" type="submit">Caută</button>
          <button class="icon-btn search-close" type="button" aria-label="Închide căutarea">${icon("close")}</button>
        </div>
      </form>
    </div>

    ${mobileMenuHTML()}`;

  // Pagina curentă în meniu + textul căutat (pe catalog)
  updateNavCurrent(document.body.dataset.page === "catalog" ? getParam("cat") : null);
  if (document.body.dataset.page === "guide") {
    document.querySelectorAll('[data-nav="guide"]').forEach(link => link.setAttribute("aria-current", "page"));
  }
  if (document.body.dataset.page === "catalog") {
    document.querySelectorAll('input[name="q"]').forEach(input => { input.value = getParam("q") || ""; });
  }

  updateCartCount();
  setupCatalogPanel();
  setupMobileMenu();
  setupSearchBar();
}

// Lupa de pe telefon: deschide rândul de căutare cu focus în câmp;
// se închide cu × sau Escape, iar focusul revine pe lupă
function setupSearchBar() {
  const toggle = document.querySelector(".search-toggle");
  const bar = document.getElementById("search-bar");
  const input = document.getElementById("bar-search-input");

  const setOpen = isOpen => {
    bar.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", isOpen);
    if (isOpen) {
      input.focus();
    } else {
      toggle.focus();
    }
  };

  toggle.addEventListener("click", () => setOpen(bar.hidden));
  bar.querySelector(".search-close").addEventListener("click", () => setOpen(false));
  bar.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

// „−10%” (cea mai mare reducere dintre kit-uri)
function kitDiscountLabel() {
  return "−" + Math.round(Math.max(...KITS.map(k => k.discount)) * 100) + "%";
}

// Numărul de produse și greutatea minimă dintr-o categorie (calculate din PRODUCTS)
function categoryInfo(category) {
  const products = getProductsInCategory(category.id);
  return {
    count: products.length,
    minWeight: Math.min(...products.map(getMinWeight)),
    image: products[0].images[0]
  };
}

// Panoul care se deschide sub „Catalog ▾” (desktop)
function catalogPanelHTML() {
  const categories = CATEGORIES.map(category => {
    const info = categoryInfo(category);
    return `
      <li>
        <a class="panel-cat" href="catalog.html?cat=${category.id}">
          <img src="${info.image}" alt="" width="48" height="60" loading="lazy">
          <span>
            <span class="panel-cat-name">${category.name}</span>
            <span class="panel-cat-meta">${countLabel(info.count, "produs", "produse")} · de la ${showWeight(info.minWeight)}</span>
          </span>
        </a>
      </li>`;
  }).join("");

  const lightCount = PRODUCTS.filter(p => getMinWeight(p) < 100).length;

  return `
    <div class="catalog-panel" id="catalog-panel" hidden>
      <div class="container catalog-panel-inner">
        <div class="catalog-panel-main">
          <p class="eyebrow">Categorii</p>
          <ul class="panel-cats">${categories}</ul>
          <a class="panel-all" href="catalog.html">Toate produsele (${PRODUCTS.length}) <span aria-hidden="true">→</span></a>
        </div>
        <div class="catalog-panel-side">
          <p class="eyebrow">Scurtături</p>
          <ul class="panel-shortcuts">
            <li><a href="catalog.html?light=1">Sub 100 g <span class="panel-count">· ${lightCount}</span></a></li>
            <li><a href="catalog.html?trip=o-zi">Pentru tura de o zi</a></li>
            <li><a href="catalog.html?trip=mai-multe-zile">Pentru mai multe zile</a></li>
          </ul>
        </div>
      </div>
    </div>`;
}

// Meniul de telefon / tabletă: un <dialog> pe tot ecranul
// (browserul se ocupă de Escape, de focus și de fundalul blocat)
function mobileMenuHTML() {
  const categories = CATEGORIES.map(category => `
    <li>
      <a href="catalog.html?cat=${category.id}" data-cat="${category.id}">
        <span>${category.name}</span>
        <span class="mobile-cat-count">${categoryInfo(category).count}</span>
      </a>
    </li>`).join("");

  return `
    <dialog class="mobile-menu" id="mobile-menu" aria-label="Meniu">
      <div class="container mobile-menu-head">
        <a class="logo" href="index.html">Gram</a>
        <button class="menu-toggle menu-close" type="button">${icon("close", "icon-sm")}<span>Închide</span></button>
      </div>

      <div class="container mobile-menu-body">
        <form class="mobile-search" role="search" action="catalog.html" method="get">
          <label class="visually-hidden" for="mobile-search-input">Caută produse</label>
          <input class="input" id="mobile-search-input" name="q" type="search" placeholder="Caută: frontală, cană…" required>
          <button class="btn btn-primary" type="submit">Caută</button>
        </form>

        <p class="eyebrow mobile-menu-title">Categorii</p>
        <ul class="mobile-cats">${categories}</ul>
        <a class="mobile-all" href="catalog.html">Toate produsele (${PRODUCTS.length}) <span aria-hidden="true">→</span></a>

        <ul class="mobile-main-links">
          <li><a href="catalog.html?cat=kituri" data-cat="kituri">Kit-uri și oferte <span class="badge">${kitDiscountLabel()}</span></a></li>
          <li><a href="ghid.html" data-nav="guide">Ghid de echipament</a></li>
        </ul>

        <ul class="mobile-meta-links">
          <li><a href="#livrare-retur" data-scroll-to="livrare-retur">Livrare și retur</a></li>
          <li><a href="credite.html">Credite foto</a></li>
          <li>
            <a href="https://github.com/IonBlg/gram-magazin-demo" target="_blank" rel="noopener">
              GitHub <span aria-hidden="true">↗</span><span class="visually-hidden"> (se deschide într-un tab nou)</span>
            </a>
          </li>
        </ul>
      </div>
    </dialog>`;
}

// Marchează pagina curentă: categoria / „Kit-uri și oferte” (aria-current)
// și butonul „Catalog ▾” pe orice pagină de catalog în afară de kit-uri
function updateNavCurrent(catId) {
  document.querySelectorAll("#site-header a[data-cat]").forEach(link => {
    if (link.dataset.cat === catId) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const toggle = document.querySelector(".catalog-toggle");
  if (toggle) {
    toggle.classList.toggle("is-current", document.body.dataset.page === "catalog" && catId !== "kituri");
  }
}

// Numărul de lângă coș (din localStorage, prin cart.js)
function updateCartCount() {
  const link = document.querySelector(".cart-link");
  if (!link) return; // header-ul simplificat (checkout) nu are coș

  const count = getCartCount();
  link.querySelector(".cart-count").textContent = count;
  link.setAttribute("aria-label", "Coșul de cumpărături, " + countLabel(count, "articol", "articole"));
}

// Panoul „Catalog”: se deschide la click / Enter / Space (nu la hover),
// se închide cu Escape, la click în afară și când focusul iese din el
function setupCatalogPanel() {
  const wrapper = document.querySelector(".catalog-menu");
  const button = wrapper.querySelector(".catalog-toggle");
  const panel = document.getElementById("catalog-panel");

  const setOpen = isOpen => {
    panel.hidden = !isOpen;
    button.setAttribute("aria-expanded", isOpen);
  };

  button.addEventListener("click", () => setOpen(panel.hidden));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      button.focus(); // focusul revine pe „Catalog”
    }
  });

  // Click oriunde în afara butonului și a panoului
  document.addEventListener("click", event => {
    if (!panel.hidden && !wrapper.contains(event.target)) setOpen(false);
  });

  // Tab în afara butonului + panoului
  wrapper.addEventListener("focusout", event => {
    if (!panel.hidden && event.relatedTarget && !wrapper.contains(event.relatedTarget)) setOpen(false);
  });
}

// Meniul de telefon: „Meniu” îl deschide, „Închide” / Escape îl închid
function setupMobileMenu() {
  const openButton = document.querySelector(".header-actions .menu-toggle");
  const menu = document.getElementById("mobile-menu");

  openButton.addEventListener("click", () => {
    menu.showModal();
    openButton.setAttribute("aria-expanded", "true");
  });

  menu.querySelector(".menu-close").addEventListener("click", () => menu.close());

  // La închidere (și cu Escape) browserul pune focusul înapoi pe „Meniu”
  menu.addEventListener("close", () => openButton.setAttribute("aria-expanded", "false"));

  // Un click pe un link închide meniul; „Livrare și retur” derulează la subsol
  menu.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    menu.close();

    if (link.dataset.scrollTo) {
      event.preventDefault(); // fără „#” în adresă (pe 404, <base> ar trimite la Acasă)
      document.getElementById(link.dataset.scrollTo).scrollIntoView();
    }
  });

  // Dacă fereastra se lărgește la desktop cu meniul deschis, îl închidem
  window.matchMedia("(min-width: 1024px)").addEventListener("change", event => {
    if (event.matches && menu.open) menu.close();
  });
}


/* ---------- 4. Footer ---------- */

function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const shopLinks = CATEGORIES.map(c =>
    `<li><a href="catalog.html?cat=${c.id}">${c.name}</a></li>`
  ).join("");

  footer.innerHTML = `
    <div class="site-footer-inner">
      <div class="container">

        <!-- Cele 4 coloane -->
        <div class="footer-grid">
          <div class="footer-brand">
            <p class="footer-logo">${SHOP.name}</p>
            <p class="footer-slogan">${SHOP.slogan}</p>
            <a class="btn btn-outline-light" href="catalog.html">Vezi catalogul</a>
          </div>

          <nav aria-label="Magazin (subsol)">
            <h2 class="eyebrow footer-title">Magazin</h2>
            <ul class="footer-list footer-list-columns">
              ${shopLinks}
            </ul>
            <!-- Sub categorii, pe toată lățimea coloanei (nu se mai rup pe rând) -->
            <ul class="footer-list footer-list-extra">
              <li><a href="catalog.html?cat=kituri">Kit-uri și oferte</a></li>
              <li><a href="ghid.html">Ghid de echipament</a></li>
            </ul>
          </nav>

          <div id="livrare-retur">
            <h2 class="eyebrow footer-title">Ajutor</h2>
            <p class="footer-text"><strong>Livrare</strong> gratuită de la ${showPrice(SHOP.freeShippingFrom)}, altfel ${showPrice(SHOP.shippingCost)}.</p>
            <p class="footer-text"><strong>Retur</strong> în ${countLabel(SHOP.returnDays, "zi", "zile")} de la primire.</p>
            <ul class="footer-list">
              <li><a href="cos.html">Coșul tău</a></li>
            </ul>
          </div>

          <div>
            <h2 class="eyebrow footer-title">Despre proiect</h2>
            <ul class="footer-list">
              <li>
                <a href="https://github.com/IonBlg/gram-magazin-demo" target="_blank" rel="noopener">
                  Codul pe GitHub <span aria-hidden="true">↗</span><span class="visually-hidden"> (se deschide într-un tab nou)</span>
                </a>
              </li>
              <li><a href="credite.html">Credite foto</a></li>
            </ul>
            <p class="footer-text footer-tech">HTML, CSS, JavaScript</p>
          </div>
        </div>

        <!-- Rândul de jos -->
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} ${SHOP.name} · proiect demo de portofoliu realizat de Ion Beșleaga · nu se fac plăți reale</p>
          <a class="back-to-top" href="#site-header">Sus <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </div>`;

  setupBackToTop();
}

// „Sus ↑”: urcă la începutul paginii și mută focusul pe logo.
// (Cu JavaScript, nu cu href="#": în 404.html, din cauza <base>, „#” ar duce la Acasă.)
function setupBackToTop() {
  document.querySelector(".back-to-top").addEventListener("click", event => {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logo = document.querySelector(".logo");
    if (logo) logo.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
}


/* ---------- 5. Carduri ---------- */

// Cardul de produs — folosit pe toate paginile.
// lazy = false doar pentru pozele vizibile imediat la încărcare.
function productCard(product, lazy = true) {
  const category = getCategory(product.category);
  const minWeight = getMinWeight(product);
  const variantCount = product.variants.length;

  // Rândul tehnic: „86 g” sau „de la 890 g · 3 variante”
  let techLine = showWeight(minWeight);
  if (variantCount > 1) {
    techLine = "de la " + showWeight(minWeight) + " · " + countLabel(variantCount, "variantă", "variante");
  }

  // Prețul: „de la 1 950 lei” doar dacă variantele costă diferit
  let priceText = showPrice(product.variants[0].price);
  if (hasDifferentPrices(product)) {
    priceText = "de la " + showPrice(getMinPrice(product));
  }

  // Eticheta de pe poză: „Stoc epuizat” are prioritate
  let badge = "";
  if (!product.inStock) {
    badge = '<span class="badge badge-dark">Stoc epuizat</span>';
  } else if (product.tags.length > 0) {
    badge = `<span class="badge">${TAG_LABELS[product.tags[0]]}</span>`;
  }

  return `
    <a class="product-card${product.inStock ? "" : " is-sold-out"}" href="produs.html?id=${product.id}">
      <div class="card-media">
        <img src="${product.images[0]}" alt="${product.name}" width="1200" height="1500"
          ${lazy ? 'loading="lazy"' : ""}>
        ${badge}
      </div>
      <div class="card-body">
        <p class="eyebrow">${category.name}</p>
        <h3 class="card-title">${product.name}</h3>
        <p class="card-tech">${techLine}</p>
        <p class="card-price">${priceText}</p>
      </div>
    </a>`;
}

// Cardul unei categorii (pe Acasă): poza primului produs din categorie
function categoryCard(category) {
  const products = getProductsInCategory(category.id);
  const first = products[0];

  return `
    <a class="category-card" href="catalog.html?cat=${category.id}">
      <img src="${first.images[0]}" alt="${first.name}" width="1200" height="1500" loading="lazy">
      <div class="category-card-body">
        <h3>${category.name}</h3>
        <span class="eyebrow">${countLabel(products.length, "produs", "produse")}</span>
      </div>
    </a>`;
}

// Cardul unui kit: mozaic 2×2, lista produselor, greutate și preț
function kitCard(kit) {
  const totals = getKitTotals(kit);
  const discountPercent = Math.round(kit.discount * 100);
  // Kitul se poate cumpăra doar dacă toate produsele lui sunt în stoc
  const available = kit.items.every(item => getProduct(item.productId).inStock);

  // Pozele pentru mozaic (maxim 4). Clasa kit-mosaic-3 / kit-mosaic-4 spune
  // CSS-ului cum să le așeze (la 3: prima poză mare în stânga).
  const cells = [];
  kit.items.slice(0, 4).forEach(item => {
    const product = getProduct(item.productId);
    cells.push(`<img src="${product.images[0]}" alt="${product.name}" width="1200" height="1500" loading="lazy">`);
  });

  // Lista: „Rucsac Creasta · 20 L ........ 890 g”
  const itemRows = kit.items.map(item => {
    const product = getProduct(item.productId);
    const variant = getVariant(product, item.variantId);
    const label = product.variants.length > 1 ? product.name + " · " + variant.label : product.name;
    return `<li><span>${label}</span><span class="kit-item-weight">${showWeight(variant.weight)}</span></li>`;
  }).join("");

  return `
    <article class="kit-card" id="${kit.id}">
      <div class="kit-mosaic kit-mosaic-${cells.length}">${cells.join("")}</div>
      <div class="kit-body">
        <p><span class="badge">Kit · −${discountPercent}%</span></p>
        <h3>${kit.name}</h3>
        <!-- Doar pe telefon (cardul compact): „4 produse · 1,22 kg” -->
        <p class="kit-meta">${countLabel(kit.items.length, "produs", "produse")} · ${showWeight(totals.weight)}</p>
        <p class="kit-short">${kit.short}</p>
        <ul class="kit-items">${itemRows}</ul>
        <div class="kit-totals">
          <p class="kit-weight">Greutate totală <strong>${showWeight(totals.weight)}</strong></p>
          <p class="kit-price">${salePriceHTML(totals.price, totals.fullPrice)}</p>
        </div>
        ${available
          ? `<button class="btn btn-secondary btn-block" type="button" data-add-kit="${kit.id}">Adaugă kitul</button>`
          : '<button class="btn btn-secondary btn-block" type="button" disabled>Kit indisponibil</button>'}
      </div>
    </article>`;
}


/* ---------- 6. Pagina Acasă ---------- */

function initHome() {
  // Categoriile
  document.getElementById("category-grid").innerHTML =
    CATEGORIES.map(categoryCard).join("");

  // Kit-urile
  document.getElementById("kit-grid").innerHTML =
    KITS.map(kitCard).join("");

  // Recomandate: întâi produsele „nou”, apoi primele în stoc, până la 4
  const featured = PRODUCTS.filter(p => p.tags.includes("nou") && p.inStock);
  PRODUCTS.forEach(p => {
    if (featured.length < 4 && p.inStock && !featured.includes(p)) {
      featured.push(p);
    }
  });
  document.getElementById("featured-grid").innerHTML =
    featured.map(p => productCard(p)).join("");

  // Banda cu informații (cifrele vin din SHOP)
  document.getElementById("free-shipping-text").textContent =
    "Livrare gratuită de la " + showPrice(SHOP.freeShippingFrom);
  document.getElementById("shipping-cost-text").textContent =
    "Sub această sumă, livrarea costă " + showPrice(SHOP.shippingCost) + ".";
  document.getElementById("return-text").textContent =
    "Retur în " + countLabel(SHOP.returnDays, "zi", "zile");
}


/* ---------- 7. Pagina Catalog ---------- */

function initCatalog() {
  const filters = readFiltersFromURL();

  // Cazul special: „Kit-uri” nu e o categorie, afișăm kit-urile
  if (filters.cat === "kituri") {
    renderKitsPage();
    return;
  }

  // O categorie greșită în adresă (ex: ?cat=xyz) = toate produsele
  if (!getCategory(filters.cat)) filters.cat = "";

  fillFilterOptions();
  setFormFromFilters(filters);
  renderCatalog(filters);
  setupFiltersToggle();

  // La orice schimbare în formular: citim filtrele, actualizăm adresa și grila
  const form = document.getElementById("filters-panel");
  form.addEventListener("change", () => {
    const newFilters = readFiltersFromForm();
    newFilters.q = filters.q; // căutarea nu e în formular, o păstrăm
    Object.assign(filters, newFilters);
    writeFiltersToURL(filters);
    renderCatalog(filters);
    animateCardsIn(document.getElementById("catalog-grid"));
  });

  // Formularul nu trebuie să reîncarce pagina (ex: Enter într-un câmp)
  form.addEventListener("submit", event => event.preventDefault());

  // „Șterge căutarea” și „Resetează filtrele”
  document.getElementById("main").addEventListener("click", event => {
    if (event.target.closest("[data-clear-search]")) {
      filters.q = "";
    } else if (event.target.closest("[data-reset-filters]")) {
      Object.assign(filters, { trip: "", stock: false, light: false, q: "" });
      setFormFromFilters(filters);
    } else {
      return;
    }
    writeFiltersToURL(filters);
    renderCatalog(filters);
    animateCardsIn(document.getElementById("catalog-grid"));
    document.getElementById("catalog-title").focus();
  });
}

// Pagina cu kit-uri (catalog.html?cat=kituri)
function renderKitsPage() {
  document.getElementById("catalog-title").textContent = "Kit-uri";
  document.getElementById("catalog-crumb").innerHTML = crumbsHTML("Kit-uri");
  document.getElementById("catalog-count").textContent = countLabel(KITS.length, "kit", "kit-uri");
  document.getElementById("catalog-filters").hidden = true; // filtrele nu se aplică la kit-uri

  const grid = document.getElementById("catalog-grid");
  grid.className = "kit-grid";
  grid.innerHTML = KITS.map(kitCard).join("");

  setPageTitle("Kit-uri", "Kit-uri de hiking gata făcute, cu reducere: " + KITS.map(k => k.name).join(", ") + ".");
  scrollToHash(); // linkurile de tip catalog.html?cat=kituri#kit-tura-o-zi
}

// Breadcrumb: Acasă / Catalog / <pagina curentă>
function crumbsHTML(currentName) {
  const home = '<li><a href="index.html">Acasă</a></li>';
  if (!currentName) return home + '<li><span aria-current="page">Catalog</span></li>';
  return home + '<li><a href="catalog.html">Catalog</a></li>' +
    `<li><span aria-current="page">${currentName}</span></li>`;
}


/* ----- Filtrele: citire / scriere ----- */

// Filtrele sunt păstrate în adresă, ca linkul să poată fi trimis cuiva:
// catalog.html?cat=apa&trip=o-zi&stock=1&light=1&sort=pret-crescator&q=titan
function readFiltersFromURL() {
  return {
    cat: getParam("cat") || "",
    trip: getParam("trip") || "",
    stock: getParam("stock") === "1",
    light: getParam("light") === "1",
    sort: getParam("sort") || "recomandate",
    q: (getParam("q") || "").trim()
  };
}

function writeFiltersToURL(filters) {
  const params = new URLSearchParams();
  if (filters.cat) params.set("cat", filters.cat);
  if (filters.trip) params.set("trip", filters.trip);
  if (filters.stock) params.set("stock", "1");
  if (filters.light) params.set("light", "1");
  if (filters.sort !== "recomandate") params.set("sort", filters.sort);
  if (filters.q) params.set("q", filters.q);

  // replaceState schimbă adresa fără să reîncarce pagina
  const query = params.toString();
  history.replaceState(null, "", query ? "catalog.html?" + query : "catalog.html");
}

function readFiltersFromForm() {
  return {
    cat: document.getElementById("filter-category").value,
    trip: document.getElementById("filter-trip").value,
    stock: document.getElementById("filter-stock").checked,
    light: document.getElementById("filter-light").checked,
    sort: document.getElementById("sort").value
  };
}

function setFormFromFilters(filters) {
  document.getElementById("filter-category").value = filters.cat;
  document.getElementById("filter-trip").value = filters.trip;
  document.getElementById("filter-stock").checked = filters.stock;
  document.getElementById("filter-light").checked = filters.light;
  document.getElementById("sort").value = filters.sort;
}

// Pune opțiunile în listele „Categorie” și „Tip tură” (din products.js)
function fillFilterOptions() {
  document.getElementById("filter-category").innerHTML = '<option value="">Toate</option>' +
    CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  document.getElementById("filter-trip").innerHTML = '<option value="">Toate</option>' +
    TRIP_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
}


/* ----- Filtrele: aplicare ----- */

// Întoarce produsele care trec de toate filtrele, sortate
function filterProducts(filters) {
  const list = PRODUCTS.filter(p => {
    if (filters.cat && p.category !== filters.cat) return false;
    if (filters.trip && !p.tripTypes.includes(filters.trip)) return false;
    if (filters.stock && !p.inStock) return false;
    if (filters.light && getMinWeight(p) >= 100) return false; // cea mai ușoară variantă sub 100 g
    if (filters.q && !matchesSearch(p, filters.q)) return false;
    return true;
  });

  // filter() a făcut deja o copie, deci sort() nu strică ordinea din PRODUCTS
  if (filters.sort === "pret-crescator") list.sort((a, b) => getMinPrice(a) - getMinPrice(b));
  if (filters.sort === "pret-descrescator") list.sort((a, b) => getMinPrice(b) - getMinPrice(a));
  if (filters.sort === "usoare") list.sort((a, b) => getMinWeight(a) - getMinWeight(b));

  return list;
}

// „frontala” găsește „Frontală Licăr”: comparăm fără diacritice și fără majuscule
function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Fiecare cuvânt căutat trebuie să apară în nume, categorie sau descrierea scurtă
function matchesSearch(product, query) {
  const text = normalizeText(product.name + " " + getCategory(product.category).name + " " + product.short);
  return normalizeText(query).split(/\s+/).every(word => text.includes(word));
}

// Afișează titlul, numărul, grila și mesajul „Niciun produs”
function renderCatalog(filters) {
  const category = getCategory(filters.cat);
  const products = filterProducts(filters);

  // Titlul, breadcrumb-ul și <title>
  document.getElementById("catalog-title").textContent = category ? category.name : "Toate produsele";
  document.getElementById("catalog-crumb").innerHTML = crumbsHTML(category ? category.name : "");
  if (category) {
    setPageTitle(category.name, category.name + " pentru hiking, cu greutatea fiecărei variante. Magazin demo.");
  } else {
    setPageTitle("Catalog");
  }

  // Căutarea: „Rezultate pentru „titan” · Șterge căutarea”
  // (textContent, nu innerHTML: textul vine de la utilizator)
  const searchInfo = document.getElementById("catalog-search");
  searchInfo.hidden = !filters.q;
  document.getElementById("catalog-search-term").textContent = filters.q;

  document.getElementById("catalog-count").textContent = countLabel(products.length, "produs", "produse");

  // Grila (primele 4 poze se încarcă imediat, restul „leneș”)
  document.getElementById("catalog-grid").innerHTML =
    products.map((p, i) => productCard(p, i >= 4)).join("");
  document.getElementById("catalog-empty").hidden = products.length > 0;

  updateNavCurrent(filters.cat);
  updateFiltersToggleLabel(filters);
}

// Pe mobil, butonul arată câte filtre sunt active: „Filtre și sortare · 2”
function updateFiltersToggleLabel(filters) {
  const active = [filters.cat, filters.trip, filters.stock, filters.light].filter(Boolean).length;
  document.getElementById("filters-toggle-count").textContent = active > 0 ? " · " + active : "";
}

// Pe mobil, butonul „Filtre” deschide/închide panoul
function setupFiltersToggle() {
  const button = document.querySelector(".filters-toggle");
  const panel = document.getElementById("filters-panel");

  button.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("is-open");
    button.setAttribute("aria-expanded", isOpen);
  });
}

// Schimbă <title> și descrierea paginii
function setPageTitle(name, description) {
  document.title = name + " — Gram (magazin demo)";
  if (description) {
    document.querySelector('meta[name="description"]').setAttribute("content", description);
  }
}

// Conținutul e pus de JS, așa că sărim noi la #ancora din adresă
function scrollToHash() {
  if (!window.location.hash) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) target.scrollIntoView();
}


/* ---------- 8. Pagina Produs ---------- */

// MAX_QUANTITY vine din cart.js

// Ce a ales utilizatorul pe pagina de produs
const productState = {
  product: null,
  variant: null,
  color: null,
  quantity: 1,
  imageIndex: 0 // miniatura selectată în galerie
};

function initProduct() {
  const root = document.getElementById("product-root");
  const product = getProduct(getParam("id"));

  // Produs inexistent (sau lipsește ?id=)
  if (!product) {
    root.innerHTML = productNotFoundHTML();
    setPageTitle("Produsul nu a fost găsit");
    return;
  }

  productState.product = product;
  productState.variant = product.variants[0];
  productState.color = product.colors.length > 0 ? product.colors[0] : null;
  productState.quantity = 1;
  productState.imageIndex = 0; // ce miniatură e selectată în galerie

  setPageTitle(product.name, product.short + " " + product.description);
  root.innerHTML = productPageHTML(product);

  setupGallery();
  setupOptionButtons();
  setupQuantity();
  window.addEventListener("load", () => preloadColorImages(product));
  setupAddToCart();
  updateProductDetails();
}

// Tot HTML-ul paginii de produs
function productPageHTML(product) {
  const category = getCategory(product.category);
  const tripNames = product.tripTypes.map(id => TRIP_TYPES.find(t => t.id === id).name).join(" · ");
  const related = getRelatedProducts(product);

  return `
    <div class="container">
      <nav class="breadcrumb page-head" aria-label="Breadcrumb">
        <ol>
          <li><a href="index.html">Acasă</a></li>
          <li><a href="catalog.html?cat=${category.id}">${category.name}</a></li>
          <li><span aria-current="page">${product.name}</span></li>
        </ol>
      </nav>

      <!-- Ordinea din HTML = ordinea vizuală (și pentru cititoarele de ecran):
           titlu + preț, apoi galeria, apoi restul. Pe desktop, CSS-ul așază
           galeria în stânga și cele două blocuri de detalii în dreapta. -->
      <div class="product-layout">
        <div class="product-head">
          <p class="eyebrow">${category.name} · ${tripNames}</p>
          <h1 class="product-title">${product.name}</h1>
          <p class="product-description">${product.description}</p>

          <div class="price-box">
            <div>
              <span class="eyebrow">Preț</span>
              <span class="price-box-price" id="product-price"></span>
            </div>
            <div>
              <span class="eyebrow">Greutate</span>
              <span class="price-box-weight" id="product-weight"></span>
            </div>
          </div>
        </div>

        ${galleryHTML(product)}

        <div class="product-info">
          ${stockHTML(product)}
          ${variantPickerHTML(product)}
          ${colorPickerHTML(product)}
          ${buyRowHTML(product)}
          ${infoBoxHTML(product)}
        </div>
      </div>

      <div class="section product-details">
        <section aria-labelledby="specs-title">
          <div class="section-head"><h2 id="specs-title">Fișa tehnică</h2></div>
          <table class="spec-table">
            <tbody id="spec-rows"></tbody>
          </table>
        </section>

        <section aria-labelledby="reviews-title">
          <div class="section-head"><h2 id="reviews-title">Recenzii</h2></div>
          <p class="empty-state">Încă nu sunt recenzii.</p>
        </section>
      </div>

      <section class="section" aria-labelledby="related-title">
        <div class="section-head"><h2 id="related-title">Poate te interesează</h2></div>
        <div class="product-grid row-of-4">${related.map(p => productCard(p)).join("")}</div>
      </section>
    </div>

    ${buyBarHTML(product)}`;
}

// Poza mare + miniaturi (miniaturile apar doar dacă sunt mai multe poze)
function galleryHTML(product) {
  let thumbs = "";
  if (product.images.length > 1) {
    const buttons = product.images.map((src, i) => `
      <li>
        <button class="thumb" type="button" data-index="${i}" aria-pressed="${i === 0}"
          aria-label="Poza ${i + 1} din ${product.images.length}">
          <img src="${src}" alt="" width="1200" height="1500">
        </button>
      </li>`).join("");
    thumbs = `<ul class="thumbs">${buttons}</ul>`;
  }

  // Prima poză vizibilă: fără loading="lazy"
  return `
    <div class="gallery">
      <div class="gallery-main">
        <img class="product-img" id="main-image" src="${product.images[0]}" alt="${product.name}" width="1200" height="1500">
      </div>
      ${thumbs}
    </div>`;
}

function stockHTML(product) {
  if (product.inStock) {
    return '<p class="stock in-stock"><span class="stock-dot" aria-hidden="true"></span>În stoc</p>';
  }
  return '<p class="stock out-of-stock"><span class="stock-dot" aria-hidden="true"></span>Stoc epuizat</p>';
}

// Butoanele de variantă (doar dacă produsul are mai multe variante)
function variantPickerHTML(product) {
  if (product.variants.length < 2) return "";

  const buttons = product.variants.map(v =>
    `<button class="option-btn" type="button" data-variant="${v.id}" aria-pressed="false">${v.label}</button>`
  ).join("");

  return `
    <div class="option-group">
      <p class="option-label" id="variant-label">Variantă: <strong id="variant-name"></strong></p>
      <div class="option-list" role="group" aria-labelledby="variant-label">${buttons}</div>
    </div>`;
}

// Pătrățelele de culoare (doar dacă lista de culori nu e goală)
function colorPickerHTML(product) {
  if (product.colors.length === 0) return "";

  // O singură culoare: nu ai ce alege, scriem doar culoarea
  if (product.colors.length === 1) {
    return `<p class="option-label">Culoare: <strong>${product.colors[0].name}</strong></p>`;
  }

  // Nota apare doar dacă vreo culoare (în afară de cea implicită) nu are poză proprie
  const missingImage = product.colors.slice(1).some(c => !hasColorImages(c));
  const note = missingImage
    ? `<p class="option-note">Poza arată culoarea ${product.colors[0].name.toLowerCase()}.</p>`
    : "";

  const buttons = product.colors.map(c =>
    `<button class="swatch" type="button" data-color="${c.id}" aria-pressed="false" aria-label="${c.name}">
      <span style="background: ${c.hex}"></span>
    </button>`
  ).join("");

  return `
    <div class="option-group">
      <p class="option-label" id="color-label">Culoare: <strong id="color-name"></strong></p>
      <div class="option-list" role="group" aria-labelledby="color-label">${buttons}</div>
      ${note}
    </div>`;
}

// Cantitatea + butonul „Adaugă în coș”
function buyRowHTML(product) {
  // Stoc epuizat: fără cantitate, doar butonul dezactivat
  if (!product.inStock) {
    return '<button class="btn btn-primary btn-block" id="add-to-cart" type="button" disabled>Stoc epuizat</button>';
  }

  return `
    <div class="buy-row">
      <div class="field">
        <label class="field-label" for="qty-input">Cantitate</label>
        <div class="qty">
          <button class="qty-btn" type="button" data-step="-1" aria-label="Scade cantitatea">−</button>
          <input class="qty-input" id="qty-input" type="number" inputmode="numeric"
            min="1" max="${MAX_QUANTITY}" value="1">
          <button class="qty-btn" type="button" data-step="1" aria-label="Crește cantitatea">+</button>
        </div>
      </div>
      <button class="btn btn-primary" id="add-to-cart" type="button">Adaugă în coș</button>
    </div>`;
}

// Bara fixă de jos, doar pe telefon (sub 768px, vezi CSS).
// Apare cât timp butonul principal „Adaugă în coș” nu se vede pe ecran.
function buyBarHTML(product) {
  const button = product.inStock
    ? '<button class="btn btn-primary" id="buy-bar-button" type="button">Adaugă în coș</button>'
    : '<button class="btn btn-primary" type="button" disabled>Stoc epuizat</button>';

  return `
    <div class="buy-bar" id="buy-bar" role="region" aria-label="Cumpără rapid">
      <img class="buy-bar-image" id="buy-bar-image" src="${product.images[0]}" alt="" width="40" height="50">
      <div class="buy-bar-price">
        <span class="eyebrow">${product.name}</span>
        <span class="buy-bar-amount" id="buy-bar-price"></span>
      </div>
      ${button}
    </div>`;
}

// Livrare, retur și (dacă e cazul) kitul din care face parte
function infoBoxHTML(product) {
  const kit = KITS.find(k => k.items.some(item => item.productId === product.id));

  let kitRow = "";
  if (kit) {
    kitRow = `
      <li>
        ${icon("box")}
        <div>
          <strong>Kit</strong>
          <p>Face parte din kitul <a href="catalog.html?cat=kituri#${kit.id}">«${kit.name}»</a> (−${Math.round(kit.discount * 100)}%).</p>
        </div>
      </li>`;
  }

  return `
    <ul class="info-box">
      <li>
        ${icon("truck")}
        <div>
          <strong>Livrare</strong>
          <p>Gratuită de la ${showPrice(SHOP.freeShippingFrom)}. Altfel, ${showPrice(SHOP.shippingCost)}.</p>
        </div>
      </li>
      <li>
        ${icon("return")}
        <div>
          <strong>Retur</strong>
          <p>În ${countLabel(SHOP.returnDays, "zi", "zile")} de la primire.</p>
        </div>
      </li>
      ${kitRow}
    </ul>`;
}

// Rândurile fișei tehnice pentru varianta aleasă
function specRowsHTML(product, variant) {
  const rows = [];

  if (product.variants.length > 1) {
    rows.push(["Variantă", variant.label]);
  }

  // Dacă fișa are deja „Greutate” (ex: „pentru o pereche”), o lipim lângă grame
  let weightText = showWeight(variant.weight);
  if (product.specs["Greutate"]) {
    weightText += " (" + product.specs["Greutate"] + ")";
  }
  rows.push(["Greutate", weightText]);

  Object.entries(product.specs).forEach(([name, value]) => {
    if (name !== "Greutate") rows.push([name, value]);
  });

  return rows.map(([name, value]) =>
    `<tr><th scope="row">${name}</th><td>${value}</td></tr>`
  ).join("");
}

// 4 produse: întâi din aceeași categorie, apoi altele (în stoc)
function getRelatedProducts(product) {
  const sameCategory = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id);
  const others = PRODUCTS.filter(p => p.category !== product.category && p.inStock);
  return sameCategory.concat(others).slice(0, 4);
}

function productNotFoundHTML() {
  return `
    <div class="container not-found">
      <p class="eyebrow">Produs inexistent</p>
      <h1>Produsul nu a fost găsit</h1>
      <p class="text-muted">Linkul poate fi greșit sau produsul nu mai există.</p>
      <a class="btn btn-primary" href="catalog.html">Mergi la catalog</a>
    </div>`;
}

// Miniaturile schimbă poza mare
function setupGallery() {
  const mainImage = document.getElementById("main-image");
  const thumbs = document.querySelectorAll(".thumb");

  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      const { product, color } = productState;
      productState.imageIndex = Number(thumb.dataset.index);
      swapImage(mainImage, getProductImages(product, color && color.id)[productState.imageIndex]);
      thumbs.forEach(t => t.setAttribute("aria-pressed", t === thumb));
    });
  });
}

// La alegerea unei culori: toate miniaturile, poza mare și miniatura din bara
// de jos trec pe pozele culorii. Miniatura selectată rămâne aceeași
// (dacă erai pe poza 2 și alegi Grafit, vezi poza 2 în grafit).
function showColorImages() {
  const { product, color, imageIndex } = productState;
  const images = getProductImages(product, color && color.id);

  swapImage(document.getElementById("main-image"), images[imageIndex]);
  document.getElementById("buy-bar-image").src = images[0];
  document.querySelectorAll(".thumb img").forEach((img, i) => {
    img.src = images[i];
  });
}

// Preîncarcă toate pozele culorilor, ca schimbarea culorii să fie instantă
function preloadColorImages(product) {
  product.colors.forEach(color => {
    if (hasColorImages(color)) color.images.forEach(src => { new Image().src = src; });
  });
}

// Click pe o variantă sau o culoare
function setupOptionButtons() {
  document.querySelectorAll("[data-variant]").forEach(button => {
    button.addEventListener("click", () => {
      productState.variant = getVariant(productState.product, button.dataset.variant);
      updateProductDetails();
    });
  });

  document.querySelectorAll("[data-color]").forEach(button => {
    button.addEventListener("click", () => {
      productState.color = productState.product.colors.find(c => c.id === button.dataset.color);
      showColorImages();
      updateProductDetails();
    });
  });
}

// „Adaugă în coș” (butonul principal și cel din bara de jos fac același lucru)
function setupAddToCart() {
  setupBuyBar();
  if (!productState.product.inStock) return; // butoanele sunt dezactivate

  document.getElementById("add-to-cart").addEventListener("click", event => addCurrentProductToCart(event.currentTarget));
  document.getElementById("buy-bar-button").addEventListener("click", event => addCurrentProductToCart(event.currentTarget));
}

// Salvează varianta, culoarea și cantitatea alese, apoi deschide sertarul
function addCurrentProductToCart(button) {
  if (isButtonBusy(button)) return; // „Adăugat” încă se vede: ignorăm al doilea click
  const { product, variant, color, quantity } = productState;
  const key = addProductToCart(product.id, variant.id, color ? color.id : null, quantity);
  updateCartCount();
  // după 1,2s, butonul principal își recapătă textul cu prețul actual
  showAddedFeedback(button, updateProductDetails);
  pulseCartCount();
  openCartDrawer(key);
}

// Bara de jos apare doar după ce ai derulat DINCOLO de butonul principal
// (butonul a ieșit din ecran pe sus). Atunci titlul și prețul sunt deja
// deasupra, deci bara nu le poate acoperi. La încărcare bara e ascunsă.
// Verificăm la fiecare derulare (cel mult o dată pe cadru, cu requestAnimationFrame),
// ca bara să apară corect și când pagina sare direct peste buton (ex: tasta End).
function setupBuyBar() {
  const bar = document.getElementById("buy-bar");
  const mainButton = document.getElementById("add-to-cart");
  let pending = false;

  const update = () => {
    pending = false;
    bar.classList.toggle("is-visible", mainButton.getBoundingClientRect().bottom < 0);
  };

  window.addEventListener("scroll", () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

// Butoanele − / + și câmpul de cantitate
function setupQuantity() {
  const input = document.getElementById("qty-input");
  if (!input) return; // produs care nu e în stoc

  document.querySelectorAll(".qty-btn").forEach(button => {
    button.addEventListener("click", () => {
      setQuantity(productState.quantity + Number(button.dataset.step));
    });
  });

  input.addEventListener("change", () => {
    setQuantity(Number(input.value));
  });
}

// Păstrează cantitatea între 1 și MAX_QUANTITY
function setQuantity(value) {
  if (!Number.isInteger(value) || value < 1) value = 1;
  if (value > MAX_QUANTITY) value = MAX_QUANTITY;
  productState.quantity = value;
  updateProductDetails();
}

// Actualizează tot ce depinde de variantă, culoare și cantitate
function updateProductDetails() {
  const { product, variant, color, quantity } = productState;

  setTextWithFade(document.getElementById("product-price"), showPrice(variant.price));
  setTextWithFade(document.getElementById("product-weight"), showWeight(variant.weight));
  document.getElementById("buy-bar-price").textContent = showPrice(variant.price);
  document.getElementById("spec-rows").innerHTML = specRowsHTML(product, variant);

  // Numele variantei și al culorii de lângă etichete
  const variantName = document.getElementById("variant-name");
  if (variantName) variantName.textContent = variant.label;

  const colorName = document.getElementById("color-name");
  if (colorName) colorName.textContent = color.name;

  // Butonul ales primește aria-pressed="true"
  document.querySelectorAll("[data-variant]").forEach(button => {
    button.setAttribute("aria-pressed", button.dataset.variant === variant.id);
  });
  document.querySelectorAll("[data-color]").forEach(button => {
    button.setAttribute("aria-pressed", button.dataset.color === color.id);
  });

  // Textul alternativ al pozei: numele + varianta + culoarea din poză
  // (dacă o culoare nu are poză proprie, poza arată culoarea implicită)
  let alt = product.name;
  if (product.variants.length > 1) alt += ", " + variant.label;
  if (product.colors.length > 0) alt += ", " + getShownColor(product, color && color.id).name;
  document.getElementById("main-image").alt = alt;

  // Cantitatea și prețul de pe buton (doar dacă produsul e în stoc)
  if (!product.inStock) return;

  document.getElementById("qty-input").value = quantity;
  document.querySelector('[data-step="-1"]').disabled = quantity <= 1;
  document.querySelector('[data-step="1"]').disabled = quantity >= MAX_QUANTITY;
  const addButton = document.getElementById("add-to-cart");
  if (!isButtonBusy(addButton)) {
    addButton.textContent = "Adaugă în coș · " + showPrice(variant.price * quantity);
  }
}


/* ---------- 9. Coșul: afișare comună ---------- */
// Datele și calculele coșului sunt în cart.js (loadCart, getCartLines, getCartTotals...)

// Textul de sub nume: „30 L · Grafit” pentru produse, „4 produse · −10%” pentru kit-uri
function lineOptionsText(line) {
  if (line.type === "kit") {
    return countLabel(line.kit.items.length, "produs", "produse") + " · −" + Math.round(line.kit.discount * 100) + "%";
  }

  const parts = [];
  if (line.product.variants.length > 1) parts.push(line.variant.label);
  if (line.color) parts.push(line.color.name);
  return parts.join(" · ");
}

// Miniatura unui rând: o poză (produs) sau un mozaic 2×2 (kit).
// item.images = pozele (la kit: câte una pentru fiecare produs, maxim 4).
function thumbHTML(item) {
  const images = item.images || [item.image];

  if (images.length < 2) {
    return `<img src="${images[0]}" alt="" width="1200" height="1500">`;
  }

  const cells = images.slice(0, 4).map(src => `<img src="${src}" alt="" width="1200" height="1500">`);
  while (cells.length < 4) cells.push("<span></span>"); // căsuță goală
  return `<span class="thumb-mosaic">${cells.join("")}</span>`;
}

// Rândurile Subtotal / Livrare / Total (coș și checkout)
function summaryRowsHTML(totals) {
  const shippingText = totals.shipping === 0 ? "Gratuită" : showPrice(totals.shipping);

  return `
    <dl class="summary-list">
      <div><dt>Subtotal</dt><dd>${showPrice(totals.subtotal)}</dd></div>
      <div><dt>Livrare</dt><dd>${shippingText}</dd></div>
      <div class="summary-total"><dt>Total</dt><dd>${showPrice(totals.total)}</dd></div>
    </dl>`;
}

// Bara „Mai adaugă X lei pentru livrare gratuită”
function freeShippingHTML(subtotal) {
  const left = SHOP.freeShippingFrom - subtotal;
  const percent = Math.min(100, Math.round((subtotal / SHOP.freeShippingFrom) * 100));

  const text = left > 0
    ? `Mai adaugă <strong>${showPrice(left)}</strong> pentru livrare gratuită.`
    : "<strong>Ai livrare gratuită.</strong>";

  return `
    <p>${text}</p>
    <div class="progress" aria-hidden="true">
      <div class="progress-fill" data-bar="shipping" style="width: ${percent}%"></div>
    </div>`;
}

// Click pe „Adaugă kitul” (pe Acasă și în catalog): un singur ascultător pentru toată pagina
function setupKitButtons() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-add-kit]");
    if (!button || isButtonBusy(button)) return;

    const key = addKitToCart(button.dataset.addKit);
    updateCartCount();
    showAddedFeedback(button);
    pulseCartCount();
    openCartDrawer(key);
  });
}


/* ---------- 10. Sertarul „Adăugat în coș” ---------- */

// Folosim <dialog>: browserul se ocupă de Esc, de focus și de fundalul întunecat
function createCartDrawer() {
  const drawer = document.createElement("dialog");
  drawer.className = "drawer";
  drawer.id = "cart-drawer";
  drawer.setAttribute("aria-labelledby", "drawer-title");

  drawer.innerHTML = `
    <div class="drawer-inner">
      <div class="drawer-head">
        <h2 id="drawer-title">Adăugat în coș</h2>
        <button class="icon-btn" type="button" data-close-drawer aria-label="Închide">${icon("close")}</button>
      </div>
      <div class="drawer-body" id="drawer-body"></div>
      <div class="drawer-actions">
        <a class="btn btn-primary btn-block" href="cos.html">Vezi coșul</a>
        <button class="btn btn-secondary btn-block" type="button" data-close-drawer>Continuă cumpărăturile</button>
      </div>
    </div>`;

  // Se închide la click pe fundal (în afara panoului) sau pe un buton „închide”
  drawer.addEventListener("click", event => {
    if (event.target === drawer || event.target.closest("[data-close-drawer]")) {
      closeDrawer(drawer);
    }
  });

  // Escape: în loc de închiderea bruscă a browserului, folosim animația de ieșire
  drawer.addEventListener("cancel", event => {
    event.preventDefault();
    closeDrawer(drawer);
  });

  document.body.appendChild(drawer);
  return drawer;
}

// Deschide sertarul și arată rândul din coș cu cheia `key`
// Închide sertarul cu animația de ieșire (clasa is-closing din CSS), apoi de tot
function closeDrawer(drawer) {
  if (!drawer.open || drawer.classList.contains("is-closing")) return;
  if (prefersReducedMotion()) {
    drawer.close();
    return;
  }
  drawer.classList.add("is-closing");
  setTimeout(() => {
    drawer.classList.remove("is-closing");
    drawer.close();
  }, cssMs("--dur-fast"));
}

// Deschide sertarul și arată rândul (sau rândurile) din coș cu cheile date.
// keys = o cheie (de pe pagina de produs) sau o listă de chei (din ghid).
function openCartDrawer(keys) {
  const drawer = document.getElementById("cart-drawer") || createCartDrawer();
  const keyList = Array.isArray(keys) ? keys : [keys];
  const lines = getCartLines(loadCart());
  const added = keyList.map(key => lines.find(l => l.key === key)).filter(Boolean);
  const totals = getCartTotals(lines);

  // Titlul: „Adăugat în coș” sau „Adăugate în coș (5)”
  document.getElementById("drawer-title").textContent =
    added.length > 1 ? `Adăugate în coș (${added.length})` : "Adăugat în coș";

  const items = added.map(line => {
    const options = lineOptionsText(line);
    return `
      <li class="drawer-item">
        ${thumbHTML(line)}
        <div>
          <p class="drawer-item-name">${line.name}</p>
          ${options ? `<p class="drawer-item-meta">${options}</p>` : ""}
          <p class="drawer-item-meta">În coș: ${line.quantity} buc.</p>
          <p class="drawer-item-price">${line.type === "kit"
            ? salePriceHTML(line.lineTotal, line.unitFullPrice * line.quantity)
            : showPrice(line.lineTotal)}</p>
        </div>
      </li>`;
  }).join("");

  const maxNote = added.some(line => line.quantity >= MAX_QUANTITY)
    ? `<p class="drawer-note">Poți avea maximum ${MAX_QUANTITY} bucăți din același produs.</p>`
    : "";

  document.getElementById("drawer-body").innerHTML = `
    <ul class="drawer-items">${items}</ul>
    ${maxNote}
    <dl class="summary-list">
      <div><dt>Coșul tău</dt><dd>${countLabel(totals.count, "articol", "articole")}</dd></div>
      <div><dt>Greutate totală</dt><dd class="mono">${showWeight(totals.weight)}</dd></div>
      <div><dt>Subtotal</dt><dd>${showPrice(totals.subtotal)}</dd></div>
    </dl>
    <div class="drawer-shipping">${freeShippingHTML(totals.subtotal)}</div>`;

  drawer.showModal();
}


/* ---------- 11. Pagina Coș ---------- */

function initCart() {
  renderCart();

  // Un singur ascultător pentru toate butoanele din coș (−, +, Șterge, Adaugă kitul)
  document.getElementById("cart-content").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const key = button.dataset.key;
    const action = button.dataset.action;
    const line = getCartLines(loadCart()).find(l => l.key === key);

    if (action === "increase") {
      setCartQuantity(key, line.quantity + 1);
      announce(line.name + ": " + Math.min(MAX_QUANTITY, line.quantity + 1) + " buc.");
    } else if (action === "decrease") {
      setCartQuantity(key, line.quantity - 1);
      announce(line.name + ": " + Math.max(1, line.quantity - 1) + " buc.");
    } else if (action === "remove") {
      // Rândul dispare cu fade + mică alunecare, abia apoi îl scoatem din coș
      const row = button.closest(".cart-row");
      if (row.dataset.removing) return;
      row.dataset.removing = "true";
      animate(row, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(16px)" }],
        { duration: cssMs("--dur"), easing: "ease-in", fill: "forwards" })
        .then(() => {
          removeFromCart(key);
          announce(line.name + " a fost șters din coș.");
          updateCartCount();
          renderCart({ key, action });
        });
      return;
    } else if (action === "add-kit") {
      addKitToCart(button.dataset.kit);
      announce("Kitul a fost adăugat în coș.");
      pulseCartCount();
    }

    updateCartCount();
    renderCart({ key, action });
  });
}

// Desenează tot coșul din nou, din localStorage.
// focusTarget = butonul apăsat, ca să-i putem da focusul înapoi după redesenare.
function renderCart(focusTarget) {
  const oldBarWidths = readBarWidths(); // pentru animația barelor
  const lines = getCartLines(loadCart());
  const totals = getCartTotals(lines);
  const isEmpty = lines.length === 0;

  document.getElementById("cart-content").hidden = isEmpty;
  document.getElementById("cart-empty").hidden = !isEmpty;
  // „articole”: un kit se numără ca 1 articol, chiar dacă are mai multe produse
  document.getElementById("cart-count").textContent = isEmpty ? "" : countLabel(totals.count, "articol", "articole");

  if (isEmpty) {
    if (focusTarget) document.getElementById("cart-empty-title").focus();
    return;
  }

  document.getElementById("cart-shipping").innerHTML = freeShippingHTML(totals.subtotal);
  document.getElementById("cart-items").innerHTML = lines.map(cartRowHTML).join("");
  document.getElementById("cart-weight").innerHTML = weightBoxHTML(lines, totals.weight);
  document.getElementById("cart-summary-rows").innerHTML = summaryRowsHTML(totals);

  // Kitul recomandat (ascuns dacă toate kit-urile sunt deja în coș)
  const kitBox = document.getElementById("cart-kit");
  const kitHTML = kitSuggestionHTML(lines);
  kitBox.hidden = !kitHTML;
  kitBox.innerHTML = kitHTML;

  // Doar după o schimbare (nu la prima afișare) barele își animă lățimea
  if (focusTarget) {
    animateBarsFrom(oldBarWidths);
    restoreCartFocus(focusTarget);
  }
}

// După redesenare, punem focusul înapoi pe butonul apăsat (sau pe ceva apropiat)
function restoreCartFocus(target) {
  let element = document.querySelector(`[data-key="${target.key}"][data-action="${target.action}"]`);

  // Butonul − devine inactiv la 1 bucată → mergem pe „+”
  if (!element || element.disabled) {
    element = document.querySelector(`[data-key="${target.key}"][data-action="increase"]`);
  }
  // Rândul a fost șters (sau kitul adăugat) → mergem pe titlul paginii
  if (!element) element = document.getElementById("cart-title");

  element.focus();
}

// Mesaj pentru cititoarele de ecran (zona aria-live din cos.html)
function announce(message) {
  const status = document.getElementById("cart-status");
  if (status) status.textContent = message;
}

// Un rând din coș (produs sau kit)
function cartRowHTML(line) {
  const options = lineOptionsText(line);
  const unit = line.type === "kit" ? "kit" : "buc.";

  // La kit: lista produselor din el și prețul întreg, tăiat
  let kitItems = "";
  let oldPrice = "";
  if (line.type === "kit") {
    kitItems = '<ul class="cart-kit-items">' + line.kit.items.map(item => {
      const product = getProduct(item.productId);
      const variant = getVariant(product, item.variantId);
      const label = product.variants.length > 1 ? product.name + " · " + variant.label : product.name;
      return `<li>${label}</li>`;
    }).join("") + "</ul>";
    oldPrice = "kit"; // prețul redus se scrie mai jos, cu salePriceHTML()
  }

  return `
    <li class="cart-row">
      <a class="cart-row-img" href="${line.link}" tabindex="-1" aria-hidden="true">
        ${thumbHTML(line)}
      </a>
      <div class="cart-row-info">
        <h3 class="cart-row-name"><a href="${line.link}">${line.name}</a></h3>
        ${options ? `<p class="cart-row-options">${options}</p>` : ""}
        ${kitItems}
        <p class="cart-row-weight">${showWeight(line.unitWeight)} / ${unit}</p>
      </div>
      <div class="cart-row-actions">
        <div class="qty qty-small">
          <button class="qty-btn" type="button" data-key="${line.key}" data-action="decrease"
            aria-label="Scade cantitatea: ${line.name}"${line.quantity <= 1 ? " disabled" : ""}>−</button>
          <span class="qty-value"><span class="visually-hidden">Cantitate: </span>${line.quantity}</span>
          <button class="qty-btn" type="button" data-key="${line.key}" data-action="increase"
            aria-label="Crește cantitatea: ${line.name}"${line.quantity >= MAX_QUANTITY ? " disabled" : ""}>+</button>
        </div>
        <button class="text-btn" type="button" data-key="${line.key}" data-action="remove">Șterge<span class="visually-hidden"> ${line.name}</span></button>
        <p class="cart-row-total">${oldPrice ? salePriceHTML(line.lineTotal, line.unitFullPrice * line.quantity) : showPrice(line.lineTotal)}</p>
      </div>
    </li>`;
}

// Caseta „Greutatea echipamentului”: total + bară împărțită pe rânduri
function weightBoxHTML(lines, totalWeight) {
  const segments = lines.map((line, i) => {
    const percent = (line.lineWeight / totalWeight) * 100;
    return `<span class="weight-segment seg-${i % 4}" data-bar="${line.key}" style="width: ${percent}%"></span>`;
  }).join("");

  const legend = lines.map((line, i) => {
    const amount = line.quantity > 1
      ? line.quantity + " × " + showWeight(line.unitWeight)
      : showWeight(line.lineWeight);
    return `
      <li>
        <span class="legend-swatch seg-${i % 4}" aria-hidden="true"></span>
        <span class="legend-name">${line.name}</span>
        <span class="legend-weight">${amount}</span>
      </li>`;
  }).join("");

  return `
    <h2 class="eyebrow">Greutatea echipamentului</h2>
    <p class="weight-total">${showWeight(totalWeight)}</p>
    <div class="weight-bar" aria-hidden="true">${segments}</div>
    <ul class="weight-legend">${legend}</ul>`;
}

// Kitul recomandat: un kit care NU e deja în coș, de preferat unul care
// conține un produs din coș. Întoarce "" dacă nu avem ce recomanda.
function kitSuggestionHTML(lines) {
  const productInCart = id => lines.some(line => line.type === "product" && line.product.id === id);
  const kitInCart = id => lines.some(line => line.type === "kit" && line.kit.id === id);
  const available = KITS.filter(k => !kitInCart(k.id));

  const kit = available.find(k => k.items.some(item => productInCart(item.productId))) || available[0];
  if (!kit) return "";

  const totals = getKitTotals(kit);
  const shared = kit.items
    .filter(item => productInCart(item.productId))
    .map(item => "«" + getProduct(item.productId).name + "»");

  const intro = shared.length > 0
    ? `Ai deja în coș ${shared.join(", ")}. Kitul are tot ce-ți trebuie, cu ${Math.round(kit.discount * 100)}% reducere.`
    : kit.short;

  return `
    <p class="eyebrow">Kit recomandat</p>
    <h2 class="kit-suggestion-title">${kit.name}</h2>
    <p class="kit-suggestion-text">${intro}</p>
    <div class="kit-totals">
      <p class="kit-weight">Greutate totală <strong>${showWeight(totals.weight)}</strong></p>
      <p class="kit-price">${salePriceHTML(totals.price, totals.fullPrice)}</p>
    </div>
    <button class="btn btn-secondary btn-block" type="button" data-action="add-kit" data-kit="${kit.id}">Adaugă kitul</button>
    <a class="text-link kit-suggestion-link" href="catalog.html?cat=kituri#${kit.id}">Vezi ce conține kitul</a>`;
}


/* ---------- 12. Pagina Checkout ---------- */

// Regulile pentru fiecare câmp. check() întoarce mesajul de eroare sau "" dacă e corect.
// courierOnly: câmpul contează doar la livrarea prin curier.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL_PATTERN = /^(MD-?)?\d{4}$/i; // Moldova: 2001 sau MD-2001

const CHECKOUT_FIELDS = [
  {
    id: "email",
    check: value => {
      if (!value) return "Scrie adresa de e-mail.";
      if (!EMAIL_PATTERN.test(value)) return "Adresa de e-mail nu pare corectă (ex: nume@exemplu.md).";
      return "";
    }
  },
  {
    id: "phone",
    check: value => {
      if (!value) return ""; // opțional
      const digits = value.replace(/\D/g, "");
      if (!/^[\d\s+()-]+$/.test(value) || digits.length < 8 || digits.length > 15) {
        return "Numărul de telefon nu pare corect. Scrie doar cifre (minim 8).";
      }
      return "";
    }
  },
  { id: "family-name", check: value => value.length >= 2 ? "" : "Scrie numele de familie." },
  { id: "given-name", check: value => value.length >= 2 ? "" : "Scrie prenumele." },
  { id: "city", check: value => value.length >= 2 ? "" : "Scrie orașul." },
  {
    id: "address",
    courierOnly: true,
    check: value => value.length >= 5 ? "" : "Scrie strada și numărul."
  },
  {
    id: "postal-code",
    courierOnly: true,
    check: value => {
      if (!value) return "Scrie codul poștal.";
      if (!POSTAL_PATTERN.test(value)) return "Codul poștal are 4 cifre (ex: MD-2001 sau 2001).";
      return "";
    }
  }
];

function initCheckout() {
  const lines = getCartLines(loadCart());

  // Coș gol → nu avem ce comanda, ne întoarcem la coș
  if (lines.length === 0) {
    window.location.replace("cos.html");
    return;
  }

  const totals = getCartTotals(lines);
  const summary = orderSummaryHTML(toOrderItems(lines), totals);

  // Același sumar în două locuri: pliabil sus (mobil) și în dreapta (desktop)
  document.getElementById("summary-mobile-body").innerHTML = summary;
  document.getElementById("summary-desktop-body").innerHTML = summary;
  document.getElementById("summary-mobile-total").textContent = showPrice(totals.total);

  setupDeliveryToggle();
  setupLiveValidation();

  document.getElementById("checkout-form").addEventListener("submit", event => {
    event.preventDefault(); // nu trimitem nicăieri; verificăm și salvăm comanda local
    placeOrder(lines, totals);
  });
}

// „Ridicare din oficiu” → nu mai cerem adresa și codul poștal
function setupDeliveryToggle() {
  const addressFields = document.getElementById("address-fields");

  document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener("change", () => {
      addressFields.hidden = getDeliveryMethod() === "oficiu";

      // Ștergem erorile vechi ale adresei; se verifică din nou la trimitere
      CHECKOUT_FIELDS.filter(field => field.courierOnly).forEach(field => {
        document.getElementById(field.id).setAttribute("aria-invalid", "false");
        document.getElementById(field.id + "-error").hidden = true;
      });
    });
  });
}

function getDeliveryMethod() {
  return document.querySelector('input[name="delivery"]:checked').value;
}

// Un câmp contează dacă nu e doar pentru curier, sau dacă s-a ales curierul
function isFieldActive(field) {
  return !field.courierOnly || getDeliveryMethod() === "curier";
}

// Verifică un câmp și arată / ascunde mesajul de sub el. Întoarce true dacă e corect.
function validateField(field) {
  const input = document.getElementById(field.id);
  const error = document.getElementById(field.id + "-error");
  const message = field.check(input.value.trim());

  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
  error.hidden = !message;
  return !message;
}

// Mesajele apar abia la trimitere; după aceea, câmpul cu eroare
// se reverifică pe măsură ce scrii, ca eroarea să dispară când e reparat.
function setupLiveValidation() {
  CHECKOUT_FIELDS.forEach(field => {
    const input = document.getElementById(field.id);
    const recheck = () => {
      if (input.getAttribute("aria-invalid") === "true") validateField(field);
    };
    input.addEventListener("input", recheck);
    input.addEventListener("blur", recheck);
  });
}

// „Plasează comanda de test”: verifică tot, salvează comanda, golește coșul
function placeOrder(lines, totals) {
  const invalid = CHECKOUT_FIELDS.filter(field => isFieldActive(field) && !validateField(field));
  const status = document.getElementById("form-status");

  if (invalid.length > 0) {
    status.textContent = "Verifică " + countLabel(invalid.length, "câmp marcat", "câmpuri marcate") + " mai sus.";
    document.getElementById(invalid[0].id).focus(); // primul câmp greșit
    return;
  }

  status.textContent = "";

  // Păstrăm doar ce trebuie pentru pagina de confirmare
  saveLastOrder({
    number: nextOrderNumber(),
    email: document.getElementById("email").value.trim(),
    city: document.getElementById("city").value.trim(),
    delivery: getDeliveryMethod() === "oficiu" ? "Ridicare din oficiu" : "Curier",
    items: toOrderItems(lines),
    totals
  });

  clearCart();
  window.location.href = "confirmare.html";
}

// Rândurile comenzii, ca text simplu (rămân valabile și după ce golim coșul)
function toOrderItems(lines) {
  return lines.map(line => ({
    name: line.name,
    image: line.image,
    images: line.images,
    options: lineOptionsText(line),
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    // la kit-uri: prețul întreg, ca reducerea să se vadă și pe confirmare
    lineFullTotal: line.type === "kit" ? line.unitFullPrice * line.quantity : null
  }));
}

// Produsele comenzii + greutate + subtotal / livrare / total
function orderSummaryHTML(items, totals) {
  const rows = items.map(item => `
    <li class="order-item">
      ${thumbHTML(item)}
      <div>
        <p class="order-item-name">${item.name}</p>
        <p class="order-item-meta">${item.options ? item.options + " · " : ""}${item.quantity} buc.</p>
      </div>
      <p class="order-item-price">${item.lineFullTotal
        ? salePriceHTML(item.lineTotal, item.lineFullTotal)
        : showPrice(item.lineTotal)}</p>
    </li>`).join("");

  return `
    <ul class="order-items">${rows}</ul>
    <p class="order-weight"><span>Greutate totală</span><span>${showWeight(totals.weight)}</span></p>
    ${summaryRowsHTML(totals)}`;
}


/* ---------- 13. Pagina Confirmare ---------- */

// Dacă vii din checkout, arătăm comanda ta. Dacă deschizi pagina direct,
// rămâne textul general din HTML (#DEMO-0001).
function initConfirmation() {
  const order = loadLastOrder();
  if (!order) return;

  document.getElementById("order-number").textContent = "#" + order.number;
  setPageTitle("Comanda #" + order.number + " a fost plasată");

  // E-mailul și orașul sunt scrise de utilizator → textContent, nu innerHTML
  document.getElementById("order-email").textContent = order.email;
  document.getElementById("order-delivery").textContent = order.delivery + " · " + order.city;
  document.getElementById("order-details").hidden = false;
  document.getElementById("order-summary").innerHTML = orderSummaryHTML(order.items, order.totals);
}


/* ---------- 14. Pagina „Ghid de echipament” ---------- */

// Cele două liste. Produsele vin din products.js (nimic nou inventat);
// „what” = ce iei, „why” = un sfat scurt și general.
const GUIDE_LISTS = [
  {
    id: "o-zi",
    name: "Tură de o zi",
    items: [
      { productId: "rucsac-creasta", what: "Rucsac", why: "Încape tot ce ai nevoie pentru o zi, iar mâinile rămân libere." },
      { productId: "filtru-izvor", what: "Apă", why: "Poți umple apa la izvoare, fără să cari toată cantitatea de acasă." },
      { productId: "frontala-licar", what: "Lumină", why: "Lumina naturală se termină mai devreme decât crezi." },
      { productId: "trusa-prim-ajutor", what: "Prim ajutor", why: "O bășică sau o zgârietură se rezolvă mai ușor pe loc." },
      { productId: "busola-nord", what: "Orientare", why: "Telefonul se poate descărca sau poate rămâne fără semnal." },
      { productId: "set-urgenta", what: "Urgență", why: "Un fluier se aude mai departe decât vocea, iar pătura te ajută să-ți păstrezi căldura." }
    ]
  },
  {
    id: "mai-multe-zile",
    name: "Mai multe zile",
    items: [
      { productId: "rucsac-popas", what: "Rucsac mare", why: "Încap hainele, mâncarea și echipamentul pentru câteva zile." },
      { productId: "filtru-izvor", what: "Apă — filtru", why: "Pe mai multe zile nu poți căra toată apa de la început." },
      { productId: "rezervor-hidratare", what: "Apă — rezervor", why: "Ai o rezervă de apă la îndemână, direct din rucsac." },
      { productId: "frontala-licar", what: "Lumină pe traseu", why: "Lumina naturală se termină mai devreme decât crezi." },
      { productId: "felinar-vatra", what: "Lumină în tabără", why: "Luminează cortul fără să-ți ocupe mâinile." },
      { productId: "arzator-flacara", what: "Gătit — arzător", why: "O masă caldă ajută după o zi lungă de mers." },
      { productId: "cana-titan", what: "Gătit — cană", why: "Încălzești apa și mănânci din același vas." },
      { productId: "spork-titan", what: "Tacâm", why: "Un singur obiect în loc de lingură și furculiță." },
      { productId: "trusa-prim-ajutor", what: "Prim ajutor", why: "Pe mai multe zile, ajutorul poate fi mai departe." },
      { productId: "busola-nord", what: "Orientare", why: "Telefonul se poate descărca sau poate rămâne fără semnal." },
      { productId: "set-urgenta", what: "Urgență", why: "Un fluier se aude mai departe decât vocea, iar pătura te ajută să-ți păstrezi căldura." },
      { productId: "bete-carbon-duo", what: "Bețe", why: "Te ajută la echilibru și la coborâri, mai ales cu rucsac greu." }
    ]
  }
];

const GUIDE_KEY = "gram-ghid"; // bifele, salvate în localStorage

// Varianta cea mai ușoară a unui produs
function getLightestVariant(product) {
  return product.variants.reduce((min, v) => (v.weight < min.weight ? v : min));
}

// Bifele salvate: { "o-zi": { "rucsac-creasta": true, ... }, ... }
function loadGuideChecks() {
  try {
    return JSON.parse(localStorage.getItem(GUIDE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveGuideChecks(checks) {
  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(checks));
  } catch (error) {
    // fără stocare, bifele țin doar până la reîncărcare
  }
}

// Un produs e bifat dacă nu a fost debifat (la prima vizită, totul e bifat)
function isGuideChecked(checks, listId, productId) {
  return !checks[listId] || checks[listId][productId] !== false;
}

function initGuide() {
  const checks = loadGuideChecks();

  document.getElementById("guide-tabs").innerHTML = GUIDE_LISTS.map((list, i) => `
    <button class="guide-tab" type="button" role="tab" id="tab-${list.id}"
      aria-controls="panel-${list.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
      ${list.name}
    </button>`).join("");

  document.getElementById("guide-panels").innerHTML = GUIDE_LISTS.map((list, i) =>
    guidePanelHTML(list, checks, i === 0)
  ).join("");

  GUIDE_LISTS.forEach(list => updateGuideTotal(list));
  setupGuideTabs();

  const panels = document.getElementById("guide-panels");

  // Bifă / debifă → salvăm și recalculăm totalul
  panels.addEventListener("change", event => {
    const box = event.target.closest("input[data-product]");
    if (!box) return;
    const current = loadGuideChecks();
    current[box.dataset.list] = current[box.dataset.list] || {};
    current[box.dataset.list][box.dataset.product] = box.checked;
    saveGuideChecks(current);
    if (box.checked) {
      animate(box, [{ transform: "scale(0.6)" }, { transform: "scale(1)" }], { duration: cssMs("--dur-fast"), easing: cssEase() });
    }
    updateGuideTotal(GUIDE_LISTS.find(l => l.id === box.dataset.list), true);
  });

  // „Adaugă produsele bifate în coș”
  panels.addEventListener("click", event => {
    const button = event.target.closest("[data-add-list]");
    if (button && !isButtonBusy(button)) addGuideListToCart(GUIDE_LISTS.find(l => l.id === button.dataset.addList), button);
  });
}

// Un tab: tabelul-checklist + totalul + butonul
function guidePanelHTML(list, checks, isActive) {
  const rows = list.items.map(item => {
    const product = getProduct(item.productId);
    const variant = getLightestVariant(product);
    const boxId = `g-${list.id}-${product.id}`;
    const label = product.variants.length > 1 ? product.name + " · " + variant.label : product.name;
    const soldOut = product.inStock ? "" : ' <span class="badge badge-dark">Stoc epuizat</span>';

    return `
      <tr>
        <td class="guide-check">
          <input type="checkbox" id="${boxId}" data-list="${list.id}" data-product="${product.id}"
            ${isGuideChecked(checks, list.id, product.id) ? "checked" : ""}>
        </td>
        <th class="guide-what" scope="row"><label for="${boxId}">${item.what}</label></th>
        <td class="guide-why"><span class="guide-why-text">${item.why}</span></td>
        <td class="guide-product"><a href="produs.html?id=${product.id}">${label}</a>${soldOut}</td>
        <td class="guide-weight">${showWeight(variant.weight)}</td>
      </tr>`;
  }).join("");

  return `
    <div class="guide-panel" role="tabpanel" id="panel-${list.id}" aria-labelledby="tab-${list.id}"${isActive ? "" : " hidden"}>
      <table class="guide-table">
        <caption class="visually-hidden">Lista pentru: ${list.name}</caption>
        <thead>
          <tr>
            <th scope="col"><span class="visually-hidden">Iau</span></th>
            <th scope="col">Ce iei</th>
            <th scope="col">De ce</th>
            <th scope="col">Produsul recomandat</th>
            <th scope="col" class="guide-weight">Greutate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="guide-summary">
        <p class="guide-total">
          <span class="eyebrow">Greutate totală</span>
          <strong id="guide-total-${list.id}"></strong>
          <span class="guide-count" id="guide-count-${list.id}"></span>
        </p>
        <button class="btn btn-primary" type="button" data-add-list="${list.id}">Adaugă produsele bifate în coș</button>
      </div>
      <p class="guide-status" id="guide-status-${list.id}" aria-live="polite"></p>
    </div>`;
}

// Totalul se calculează doar din rândurile bifate
// animated = true doar la bifare (la încărcarea paginii totalul apare direct)
function updateGuideTotal(list, animated) {
  const checks = loadGuideChecks();
  const checked = list.items.filter(item => isGuideChecked(checks, list.id, item.productId));
  const weight = checked.reduce((sum, item) => sum + getLightestVariant(getProduct(item.productId)).weight, 0);

  const total = document.getElementById("guide-total-" + list.id);
  const previous = Number(total.dataset.grams || weight);
  total.dataset.grams = weight;
  if (animated) {
    countUpWeight(total, previous, weight);
  } else {
    total.textContent = showWeight(weight);
  }
  document.getElementById("guide-count-" + list.id).textContent =
    `${checked.length} din ${list.items.length} bifate`;
}

// Adaugă în coș produsele bifate care sunt în stoc, apoi deschide sertarul
function addGuideListToCart(list, button) {
  const checks = loadGuideChecks();
  const status = document.getElementById("guide-status-" + list.id);
  const checked = list.items.filter(item => isGuideChecked(checks, list.id, item.productId));
  const keys = [];
  const skipped = [];

  checked.forEach(item => {
    const product = getProduct(item.productId);
    if (!product.inStock) {
      skipped.push(product.name);
      return;
    }
    const color = product.colors.length > 0 ? product.colors[0].id : null;
    keys.push(addProductToCart(product.id, getLightestVariant(product).id, color, 1));
  });

  status.textContent = skipped.length > 0
    ? "Nu sunt în stoc și nu au fost adăugate: " + skipped.join(", ") + "."
    : "";

  if (keys.length === 0) {
    if (!status.textContent) status.textContent = "Bifează cel puțin un produs.";
    return;
  }

  updateCartCount();
  showAddedFeedback(button);
  pulseCartCount();
  openCartDrawer(keys);
}

// Tab-urile: click, săgețile ← →, Home și End
function setupGuideTabs() {
  const tabs = [...document.querySelectorAll(".guide-tab")];

  const select = tab => {
    tabs.forEach(t => {
      const active = t === tab;
      t.setAttribute("aria-selected", active);
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
    });
    tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      let next = null;
      if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (event.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        event.preventDefault();
        select(next);
      }
    });
  });
}


/* ---------- 15. Pornire ---------- */

// Scripturile sunt la finalul <body>, deci pagina e deja încărcată.
setupImageFade();
renderHeader();
renderFooter();

// Fiecare pagină are pe <body> un data-page="..." care spune ce rulăm
const page = document.body.dataset.page;
setupKitButtons();

if (page === "home") initHome();
if (page === "catalog") initCatalog();
if (page === "product") initProduct();
if (page === "cart") initCart();
if (page === "checkout") initCheckout();
if (page === "confirmation") initConfirmation();
if (page === "guide") initGuide();

// Pozele care erau deja încărcate (din cache) apar imediat
markLoadedImages();
window.addEventListener("load", markLoadedImages);
