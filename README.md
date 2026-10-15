# Gram — magazin demo de accesorii pentru hiking

**Gram** este un magazin online demonstrativ, făcut ca proiect de portofoliu. Produsele, prețurile și greutățile sunt inventate, nu se vinde nimic real și nu se fac plăți. Ideea magazinului: la echipamentul de munte contează fiecare gram, așa că greutatea apare peste tot — pe card, pe variantă, în coș.

**Site live:** https://ionblg.github.io/gram-magazin-demo/

Proiect realizat de Ion Beșleaga.

## Ce poți face pe site

- **Catalog cu filtre și sortare** — categorie, tip de tură, „doar în stoc”, „sub 100 g”, sortare după preț sau greutate. Filtrele se păstrează în adresă, deci un link filtrat poate fi trimis cuiva (ex: `catalog.html?light=1&sort=usoare`).
- **Căutare** după nume, fără să conteze diacriticele („frontala” găsește „Frontală”).
- **Variante** pe pagina de produs: fiecare variantă (ex: 20 L / 30 L / 40 L) are propriul preț și propria greutate.
- **Coș salvat în `localStorage`** — rămâne după reîncărcarea paginii; cantități, ștergere, livrare gratuită de la un prag.
- **Sertar de coș** care se deschide după „Adaugă în coș” (element `<dialog>`).
- **Greutatea totală a echipamentului** în coș, cu o bară împărțită pe produse.
- **Kit-uri cu reducere** (ex: „Cafea pe munte”: arzător, cană, spork), adăugate în coș ca un singur rând.
- **Checkout demo cu validare** — mesaje de eroare în română sub fiecare câmp, număr de comandă de test, pagină de confirmare cu rezumatul comenzii.
- **Mobile-first** — gândit întâi pentru telefon; pe pagina de produs, o bară fixă jos cu prețul și butonul de cumpărare.
- Atenție la accesibilitate: HTML semantic, navigare cu tastatura, focus vizibil, etichete pentru cititoare de ecran, `prefers-reduced-motion`.

## Tehnologii

HTML, CSS și JavaScript **vanilla** — fără framework-uri, fără npm, fără pas de build. Fonturi: Archivo, IBM Plex Sans și IBM Plex Mono (Google Fonts).

## Structura

```
├── index.html        Acasă
├── catalog.html      Catalog, filtre, căutare, kit-uri (?cat=kituri)
├── produs.html       Pagina unui produs (?id=...)
├── cos.html          Coșul
├── checkout.html     Checkout demo
├── confirmare.html   Comanda plasată
├── ghid.html         Ghid de echipament (listă cu bife, greutate totală)
├── credite.html      Autorii pozelor
├── 404.html          Pagina „nu există”
├── css/style.css     Tot stilul, un singur fișier
├── js/products.js    „Baza de date”: produse, categorii, kit-uri
├── js/cart.js        Coșul (localStorage) și comanda de test
├── js/main.js        Header, footer, afișarea paginilor, filtre, checkout
├── images/           Pozele produselor
└── tools/            Scriptul care pregătește pozele (Python + Pillow)
```

## Cum îl rulezi local

Descarcă proiectul și deschide folderul cu un server local simplu, de exemplu extensia **Live Server** din VS Code sau:

```
python3 -m http.server
```

apoi deschide `http://localhost:8000`.

## Versiunea fișierelor (contra cache-ului)

În toate paginile, `css/style.css` și fișierele din `js/` sunt încărcate cu un număr de versiune, de exemplu `css/style.css?v=2026101503`. **La fiecare schimbare de CSS sau JS, numărul se mărește** (pe toate paginile), ca browserele vizitatorilor să descarce fișierele noi în loc să le folosească pe cele vechi din cache. Formatul folosit: anul, luna, ziua + un număr de ordine (`2026101503`).

## Limitări (e un demo)

- Nu există server: produsele stau în `js/products.js`, iar coșul doar în browserul vizitatorului.
- Comanda nu se trimite nicăieri; plata cu cardul este dezactivată.
- Pozele sunt generate cu inteligență artificială; produsele nu există în realitate.

## Credite

Pozele produselor și ale paginilor sunt generate cu inteligență artificială (Google Gemini); unele variante de culoare sunt aceeași poză recolorată digital. Produsele din magazin sunt inventate și nu există în realitate. Detalii: [credite.html](https://ionblg.github.io/gram-magazin-demo/credite.html).
