/* =========================================================
   GRAM — magazin demo de accesorii pentru hiking
   products.js = "baza de date" a magazinului

   IMPORTANT: Toate produsele, prețurile și greutățile sunt
   INVENTATE pentru un proiect demo de portofoliu.
   Nu se vinde nimic real și nu se fac plăți.

   Unități:
   - price  = preț în lei (MDL), număr întreg
   - weight = greutate în grame, număr întreg
   ========================================================= */


/* ---------- 1. Setări generale ---------- */

const SHOP = {
  name: "Gram",
  slogan: "Fiecare gram contează",
  currency: "lei",
  freeShippingFrom: 3000, // livrare gratuită de la 3 000 lei
  shippingCost: 60,       // altfel, livrarea costă 60 lei
  returnDays: 30
};


/* ---------- 2. Categorii (meniul de sus + filtre) ---------- */

const CATEGORIES = [
  { id: "rucsacuri",  name: "Rucsacuri" },
  { id: "lumina",     name: "Lumină" },
  { id: "bete",       name: "Bețe" },
  { id: "apa",        name: "Apă" },
  { id: "siguranta",  name: "Siguranță" },
  { id: "gatit",      name: "Gătit" }
];


/* ---------- 3. Tipuri de tură (pentru filtru) ---------- */

const TRIP_TYPES = [
  { id: "o-zi",          name: "Tură de o zi" },
  { id: "mai-multe-zile", name: "Mai multe zile" }
];


/* ---------- 4. Produsele ----------
   Fiecare produs are:
   - id          → nume unic, folosit în link (produs.html?id=...)
   - name        → numele afișat
   - category    → id-ul categoriei de mai sus
   - tripTypes   → la ce fel de tură se potrivește
   - tags        → etichete mici pe card ("nou", "sub-100g")
   - short       → o propoziție pentru card
   - description → textul de pe pagina produsului
   - images      → lista de poze (prima = poza principală)
   - variants    → variantele: fiecare are PREȚUL și GREUTATEA ei
   - colors      → culorile disponibile (pot lipsi). Prima culoare din
                   listă e cea implicită și folosește poza images[0].
                   O culoare poate avea câmpul opțional `images` = pozele
                   produsului în acea culoare, în ACEEAȘI ordine ca `images`
                   de mai sus (poza 1, poza 2, ...). Exemplu:
                     images: ["images/rucsac-creasta-grafit-1.jpg", "images/rucsac-creasta-grafit-2.jpg"]
                   Pe site, la alegerea culorii se schimbă galeria: pentru
                   fiecare poziție se folosește poza culorii, iar dacă
                   lipsește, poza implicită de pe aceeași poziție.
                   O culoare fără `images` folosește pozele implicite.
                   Adaugă doar poze care există în images/.
   - specs       → fișa tehnică
   - inStock     → true = în stoc
   ---------------------------------------------------------- */

const PRODUCTS = [

  /* ===== RUCSACURI ===== */
  {
    id: "rucsac-creasta",
    name: "Rucsac Creasta",
    category: "rucsacuri",
    tripTypes: ["o-zi"],
    tags: ["nou"],
    short: "Rucsac pentru ture de o zi, cu spate ventilat.",
    description: "Spate ventilat, centură șoldieră cu buzunare și compartiment pentru hidratare. Construit pentru ture de o zi pe munte.",
    images: ["images/rucsac-creasta-1.jpg", "images/rucsac-creasta-2.jpg", "images/rucsac-creasta-3.jpg"],
    variants: [
      { id: "20l", label: "20 L", price: 1950, weight: 890 },
      { id: "30l", label: "30 L", price: 2450, weight: 1120 },
      { id: "40l", label: "40 L", price: 2890, weight: 1380 }
    ],
    colors: [
      { id: "portocaliu", name: "Portocaliu", hex: "#C2410C" },
      { id: "grafit",     name: "Grafit",     hex: "#3A3B3C",
        images: ["images/rucsac-creasta-grafit-1.jpg", "images/rucsac-creasta-grafit-2.jpg", "images/rucsac-creasta-grafit-3.jpg"] },
      { id: "oliv",       name: "Oliv",       hex: "#5B6236",
        images: ["images/rucsac-creasta-oliv-1.jpg", "images/rucsac-creasta-oliv-2.jpg", "images/rucsac-creasta-oliv-3.jpg"] }
    ],
    specs: {
      "Material": "Nailon ripstop 210D",
      "Spate": "Plasă ventilată",
      "Hidratare": "Compatibil, până la 2 L",
      "Husă de ploaie": "Inclusă"
    },
    inStock: true
  },
  {
    id: "rucsac-popas",
    name: "Rucsac Popas 45+10",
    category: "rucsacuri",
    tripTypes: ["mai-multe-zile"],
    tags: [],
    short: "Rucsac mare, cu extensie de 10 L, pentru 2–4 zile.",
    description: "Sistem de spate reglabil, extensie de 10 litri în partea de sus și acces la compartimentul principal din față. Pentru ture de mai multe zile.",
    images: ["images/rucsac-popas-1.jpg", "images/rucsac-popas-2.jpg"],
    variants: [
      { id: "m", label: "Spate M", price: 3290, weight: 1750 },
      { id: "l", label: "Spate L", price: 3290, weight: 1810 }
    ],
    colors: [
      { id: "grafit", name: "Grafit", hex: "#3A3B3C" }
    ],
    specs: {
      "Volum": "45 L + 10 L extensie",
      "Material": "Nailon 420D",
      "Sistem de spate": "Reglabil",
      "Husă de ploaie": "Inclusă"
    },
    inStock: true
  },
  {
    id: "rucsac-sprint",
    name: "Rucsac Sprint 15",
    category: "rucsacuri",
    tripTypes: ["o-zi"],
    tags: ["usor"],
    short: "Rucsac mic și ușor pentru ture rapide.",
    description: "Rucsac de 15 litri, fără cadru, cu bretele late și două buzunare pentru sticle. Bun pentru ture scurte și alergare pe munte.",
    images: ["images/rucsac-sprint-1.jpg"],
    variants: [
      { id: "15l", label: "15 L", price: 1290, weight: 520 }
    ],
    colors: [
      { id: "portocaliu", name: "Portocaliu", hex: "#C2410C" },
      { id: "negru",      name: "Negru",      hex: "#1A1A17", images: ["images/rucsac-sprint-negru-1.jpg"] }
    ],
    specs: {
      "Volum": "15 L",
      "Material": "Nailon ripstop 100D",
      "Buzunare": "2 laterale pentru sticle"
    },
    inStock: true
  },

  /* ===== LUMINĂ ===== */
  {
    id: "frontala-licar",
    name: "Frontală Licăr",
    category: "lumina",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Lanternă frontală reîncărcabilă prin USB-C.",
    description: "Lanternă frontală cu lumină albă și roșie, baterie reîncărcabilă prin USB-C și bandă elastică reglabilă.",
    images: ["images/frontala-licar-1.jpg", "images/frontala-licar-2.jpg"],
    variants: [
      { id: "400", label: "400 lm", price: 690, weight: 86 },
      { id: "800", label: "800 lm", price: 990, weight: 112 }
    ],
    colors: [],
    specs: {
      "Încărcare": "USB-C",
      "Moduri": "Albă, roșie, intermitentă",
      "Rezistență la apă": "IPX4"
    },
    inStock: true
  },
  {
    id: "felinar-vatra",
    name: "Felinar Vatră",
    category: "lumina",
    tripTypes: ["mai-multe-zile"],
    tags: [],
    short: "Felinar mic pentru cort sau tabără.",
    description: "Felinar pliabil cu lumină caldă, cârlig pentru agățat în cort și trei niveluri de intensitate.",
    images: ["images/felinar-vatra-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 450, weight: 140 }
    ],
    colors: [],
    specs: {
      "Încărcare": "USB-C",
      "Lumină": "Caldă, 3 niveluri",
      "Prindere": "Cârlig + magnet"
    },
    inStock: true
  },

  /* ===== BEȚE ===== */
  {
    id: "bete-carbon-duo",
    name: "Bețe Carbon Duo",
    category: "bete",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["usor"],
    short: "Pereche de bețe din carbon, pliabile.",
    description: "Bețe de trekking din carbon, pliabile în trei segmente, cu mâner din plută și vârfuri de schimb incluse. Prețul este pentru o pereche.",
    images: ["images/bete-carbon-1.jpg", "images/bete-carbon-2.jpg"],
    variants: [
      { id: "115-135", label: "115–135 cm", price: 1290, weight: 410 },
      { id: "125-145", label: "125–145 cm", price: 1290, weight: 430 }
    ],
    colors: [],
    specs: {
      "Material": "Carbon",
      "Mâner": "Plută",
      "Pliere": "3 segmente",
      "Greutate": "pentru o pereche"
    },
    inStock: true
  },
  {
    id: "bete-aluminiu-trio",
    name: "Bețe Aluminiu Trio",
    category: "bete",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: [],
    short: "Bețe rezistente din aluminiu, telescopice.",
    description: "Bețe telescopice din aluminiu, cu sistem de blocare rapid și rondele pentru zăpadă. Prețul este pentru o pereche.",
    images: ["images/bete-aluminiu-1.jpg"],
    variants: [
      { id: "std", label: "105–140 cm", price: 690, weight: 560 }
    ],
    colors: [],
    specs: {
      "Material": "Aluminiu",
      "Blocare": "Rapidă, cu clemă",
      "Inclus": "Rondele pentru zăpadă"
    },
    inStock: false // un produs care NU e în stoc, ca să testăm acest caz
  },

  /* ===== APĂ ===== */
  {
    id: "filtru-izvor",
    name: "Filtru Izvor",
    category: "apa",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Sticlă moale cu filtru de apă.",
    description: "Sticlă pliabilă de 0,5 L cu filtru integrat. Umpli din izvor și bei direct prin filtru.",
    images: ["images/filtru-izvor-1.jpg"],
    variants: [
      { id: "05l", label: "0,5 L", price: 790, weight: 64 }
    ],
    colors: [],
    specs: {
      "Volum": "0,5 L",
      "Tip": "Sticlă moale pliabilă",
      "Filtru": "Înlocuibil"
    },
    inStock: true
  },
  {
    id: "termos-parau",
    name: "Termos Pârâu",
    category: "apa",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: [],
    short: "Termos din oțel, ține cald sau rece.",
    description: "Termos cu pereți dubli din oțel inoxidabil și capac care se închide etanș.",
    images: ["images/termos-parau-1.jpg"],
    variants: [
      { id: "500", label: "500 ml", price: 450, weight: 290 },
      { id: "750", label: "750 ml", price: 520, weight: 360 }
    ],
    colors: [
      { id: "portocaliu", name: "Portocaliu", hex: "#C2410C" },
      { id: "grafit",     name: "Grafit",     hex: "#3A3B3C", images: ["images/termos-parau-grafit-1.jpg"] }
    ],
    specs: {
      "Material": "Oțel inoxidabil",
      "Izolație": "Pereți dubli"
    },
    inStock: true
  },
  {
    id: "rezervor-hidratare",
    name: "Rezervor de hidratare 2L",
    category: "apa",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: [],
    short: "Pungă de apă cu tub, se pune în rucsac.",
    description: "Rezervor de 2 litri cu tub și valvă, se pune în compartimentul de hidratare al rucsacului.",
    images: ["images/rezervor-1.jpg"],
    variants: [
      { id: "2l", label: "2 L", price: 390, weight: 180 }
    ],
    colors: [],
    specs: {
      "Volum": "2 L",
      "Deschidere": "Largă, ușor de spălat"
    },
    inStock: true
  },

  /* ===== SIGURANȚĂ ===== */
  {
    id: "busola-nord",
    name: "Busolă Nord",
    category: "siguranta",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Busolă cu oglindă pentru orientare.",
    description: "Busolă cu oglindă de vizare, riglă pentru hartă și șnur de prindere.",
    images: ["images/busola-nord-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 420, weight: 48 }
    ],
    colors: [],
    specs: {
      "Tip": "Cu oglindă",
      "Riglă": "Pentru hartă"
    },
    inStock: true
  },
  {
    id: "trusa-prim-ajutor",
    name: "Trusă de prim ajutor",
    category: "siguranta",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: [],
    short: "Trusă compactă pentru traseu.",
    description: "Trusă mică, impermeabilă, cu pansamente, bandaj elastic și foarfecă. Se poate completa cu ce ai nevoie.",
    images: ["images/trusa-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 350, weight: 180 }
    ],
    colors: [],
    specs: {
      "Husă": "Impermeabilă",
      "Conținut": "Pansamente, bandaj, foarfecă"
    },
    inStock: true
  },
  {
    id: "set-urgenta",
    name: "Set de urgență",
    category: "siguranta",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Fluier și pătură de urgență.",
    description: "Fluier puternic și pătură termică de urgență, într-o pungă mică.",
    images: ["images/set-urgenta-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 190, weight: 62 }
    ],
    colors: [],
    specs: {
      "Conținut": "Fluier + pătură termică"
    },
    inStock: true
  },

  /* ===== GĂTIT ===== */
  {
    id: "arzator-flacara",
    name: "Arzător Flacăra",
    category: "gatit",
    tripTypes: ["mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Arzător mic pe gaz, pliabil.",
    description: "Arzător compact care se înșurubează pe cartușul de gaz. Se pliază și încape într-o cană. Cartușul nu este inclus.",
    images: ["images/arzator-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 590, weight: 79 }
    ],
    colors: [],
    specs: {
      "Combustibil": "Cartuș de gaz (nu e inclus)",
      "Aprindere": "Piezo"
    },
    inStock: true
  },
  {
    id: "cana-titan",
    name: "Cană titan 450",
    category: "gatit",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Cană din titan, se poate pune pe foc.",
    description: "Cană din titan de 450 ml cu mânere pliabile. Se poate încălzi direct pe arzător.",
    images: ["images/cana-titan-1.jpg"],
    variants: [
      { id: "450", label: "450 ml", price: 480, weight: 68 }
    ],
    colors: [],
    specs: {
      "Material": "Titan",
      "Volum": "450 ml"
    },
    inStock: true
  },
  {
    id: "spork-titan",
    name: "Spork titan",
    category: "gatit",
    tripTypes: ["o-zi", "mai-multe-zile"],
    tags: ["sub-100g"],
    short: "Lingură și furculiță într-unul.",
    description: "Tacâm din titan: lingură la un capăt, furculiță la celălalt.",
    images: ["images/spork-1.jpg"],
    variants: [
      { id: "std", label: "Standard", price: 160, weight: 18 }
    ],
    colors: [],
    specs: {
      "Material": "Titan"
    },
    inStock: true
  }
];


/* ---------- 5. Kit-uri ----------
   Un kit = mai multe produse vândute împreună, cu reducere.
   - items    → ce produse și ce variantă intră în kit
   - discount → reducerea (0.10 = 10%)
   Prețul și greutatea kitului NU le scriem de mână:
   le calculează funcția getKitTotals() de mai jos.
   -------------------------------------------- */

const KITS = [
  {
    id: "kit-tura-o-zi",
    name: "Tura de o zi",
    short: "Tot ce îți trebuie pentru o tură de o zi.",
    discount: 0.10,
    items: [
      { productId: "rucsac-creasta",    variantId: "20l" },
      { productId: "frontala-licar",    variantId: "400" },
      { productId: "filtru-izvor",      variantId: "05l" },
      { productId: "trusa-prim-ajutor", variantId: "std" }
    ]
  },
  {
    id: "kit-cafea-pe-munte",
    name: "Cafea pe munte",
    short: "Arzător, cană și spork — totul sub 200 g.",
    discount: 0.10,
    items: [
      { productId: "arzator-flacara", variantId: "std" },
      { productId: "cana-titan",      variantId: "450" },
      { productId: "spork-titan",     variantId: "std" }
    ]
  }
];


/* ---------- 6. Funcții ajutătoare ---------- */

// Găsește un produs după id
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

// Găsește o variantă a unui produs
function getVariant(product, variantId) {
  return product.variants.find(v => v.id === variantId);
}

// Prețul "de la" (cea mai ieftină variantă) — pentru cardul de produs
function getMinPrice(product) {
  return Math.min(...product.variants.map(v => v.price));
}

// Calculează prețul și greutatea unui kit
function getKitTotals(kit) {
  let fullPrice = 0;
  let weight = 0;

  kit.items.forEach(item => {
    const variant = getVariant(getProduct(item.productId), item.variantId);
    fullPrice += variant.price;
    weight += variant.weight;
  });

  const price = Math.round(fullPrice * (1 - kit.discount));
  return { fullPrice, price, weight };
}

// 2450 → "2 450 lei"
function formatPrice(n) {
  // pune un spațiu la fiecare 3 cifre, de la dreapta: 12450 → "12 450"
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + SHOP.currency;
}

// 1616 → "1,62 kg"   |   86 → "86 g"
function formatWeight(grams) {
  if (grams < 1000) return grams + " g";
  return (grams / 1000).toFixed(2).replace(".", ",") + " kg";
}
