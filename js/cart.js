/* =========================================================
   GRAM — cart.js
   Coșul de cumpărături. Îl salvăm în localStorage, ca să
   rămână și după ce închizi sau reîncarci pagina.

   Se încarcă DUPĂ products.js și ÎNAINTE de main.js.
   Aici sunt doar datele și calculele; afișarea e în main.js.
   ========================================================= */

const CART_KEY = "gram-cart"; // numele sub care salvăm coșul în localStorage
const MAX_QUANTITY = 10;      // maxim 10 bucăți pe un rând din coș

/* Un element din coș arată așa:
   produs → { type: "product", productId: "rucsac-creasta", variantId: "20l", colorId: "grafit", quantity: 1 }
   kit    → { type: "kit", kitId: "kit-tura-o-zi", quantity: 1 }
*/


/* ---------- 1. Citire și salvare ---------- */

// Citește coșul din localStorage. Dacă nu există sau e stricat → coș gol.
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(saved)) return [];
    // Păstrăm doar ce mai există în products.js (un produs poate fi șters între timp)
    return saved.filter(isValidItem);
  } catch (error) {
    return [];
  }
}

// Salvează coșul în localStorage
function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    // Ex: stocarea e blocată în browser. Coșul merge până la reîncărcarea paginii.
  }
}

// Verifică dacă un element salvat e încă valid
function isValidItem(item) {
  if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) return false;

  if (item.type === "kit") {
    return Boolean(getKit(item.kitId));
  }

  const product = getProduct(item.productId);
  return Boolean(product && getVariant(product, item.variantId));
}

// Găsește un kit după id
function getKit(id) {
  return KITS.find(k => k.id === id);
}

// Cheia unui rând: același produs + aceeași variantă + aceeași culoare = același rând
function itemKey(item) {
  if (item.type === "kit") return "kit:" + item.kitId;
  return item.productId + ":" + item.variantId + ":" + (item.colorId || "-");
}


/* ---------- 2. Modificarea coșului ---------- */

// Adaugă un element; dacă există deja, crește cantitatea. Întoarce cheia rândului.
function addItem(newItem) {
  const items = loadCart();
  const key = itemKey(newItem);
  const existing = items.find(item => itemKey(item) === key);

  if (existing) {
    existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + newItem.quantity);
  } else {
    newItem.quantity = Math.min(MAX_QUANTITY, newItem.quantity);
    items.push(newItem);
  }

  saveCart(items);
  return key;
}

function addProductToCart(productId, variantId, colorId, quantity) {
  return addItem({ type: "product", productId, variantId, colorId: colorId || null, quantity });
}

function addKitToCart(kitId) {
  return addItem({ type: "kit", kitId, quantity: 1 });
}

// Schimbă cantitatea unui rând (între 1 și MAX_QUANTITY)
function setCartQuantity(key, quantity) {
  const items = loadCart();
  const item = items.find(i => itemKey(i) === key);
  if (!item) return;

  item.quantity = Math.max(1, Math.min(MAX_QUANTITY, quantity));
  saveCart(items);
}

// Șterge un rând
function removeFromCart(key) {
  const items = loadCart().filter(item => itemKey(item) !== key);
  saveCart(items);
}

// Golește tot coșul (folosit în Faza 5, după comanda de test)
function clearCart() {
  saveCart([]);
}

// Câte articole sunt în coș (un kit = 1 articol)
function getCartCount() {
  return loadCart().reduce((sum, item) => sum + item.quantity, 0);
}


/* ---------- 3. Calcule pentru afișare ---------- */

// Transformă elementele salvate în rânduri complete pentru afișare.
// Produsele și kit-urile primesc aceleași câmpuri (name, image, link,
// unitPrice, unitWeight...), ca să le putem afișa cu același cod.
function getCartLines(items) {
  return items.map(item => {
    if (item.type === "kit") {
      const kit = getKit(item.kitId);
      const totals = getKitTotals(kit);

      return {
        type: "kit",
        key: itemKey(item),
        kit,
        name: "Kit «" + kit.name + "»",
        image: getProduct(kit.items[0].productId).images[0],
        images: kit.items.slice(0, 4).map(item => getProduct(item.productId).images[0]), // pentru mozaic
        link: "catalog.html?cat=kituri#" + kit.id,
        quantity: item.quantity,
        unitPrice: totals.price,
        unitFullPrice: totals.fullPrice,
        unitWeight: totals.weight,
        lineTotal: totals.price * item.quantity,
        lineWeight: totals.weight * item.quantity
      };
    }

    const product = getProduct(item.productId);
    const variant = getVariant(product, item.variantId);
    // Culoarea salvată; dacă nu mai există (ex: Popas Oliv, scos din magazin),
    // folosim culoarea implicită a produsului
    const color = product.colors.find(c => c.id === item.colorId) || product.colors[0] || null;
    // getProductImage() e în main.js: se încarcă după acest fișier, dar e gata
    // înainte ca getCartLines() să fie apelată (doar din main.js)
    const image = getProductImage(product, color && color.id);

    return {
      type: "product",
      key: itemKey(item),
      product,
      variant,
      color,
      name: product.name,
      image,
      images: [image],
      link: "produs.html?id=" + product.id,
      quantity: item.quantity,
      unitPrice: variant.price,
      unitWeight: variant.weight,
      lineTotal: variant.price * item.quantity,
      lineWeight: variant.weight * item.quantity
    };
  });
}

// Subtotal, livrare, total, greutate și numărul de bucăți
function getCartTotals(lines) {
  let subtotal = 0;
  let weight = 0;
  let count = 0;

  lines.forEach(line => {
    subtotal += line.lineTotal;
    weight += line.lineWeight;
    count += line.quantity;
  });

  const shipping = subtotal >= SHOP.freeShippingFrom ? 0 : SHOP.shippingCost;
  return { subtotal, weight, count, shipping, total: subtotal + shipping };
}


/* ---------- 4. Comanda de test (Faza 5) ---------- */

const ORDER_COUNT_KEY = "gram-order-count"; // câte comenzi de test s-au plasat
const LAST_ORDER_KEY = "gram-last-order";   // ultima comandă, pentru confirmare.html

// Următorul număr de comandă: DEMO-0001, DEMO-0002...
function nextOrderNumber() {
  let count = 0;
  try {
    count = Number(localStorage.getItem(ORDER_COUNT_KEY)) || 0;
    localStorage.setItem(ORDER_COUNT_KEY, count + 1);
  } catch (error) {
    // stocarea e blocată: rămânem la DEMO-0001
  }
  return "DEMO-" + String(count + 1).padStart(4, "0");
}

// Ultima comandă stă în sessionStorage: dispare când închizi fila
function saveLastOrder(order) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch (error) {
    // fără stocare, confirmarea arată textul general
  }
}

function loadLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY));
  } catch (error) {
    return null;
  }
}
