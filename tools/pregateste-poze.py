#!/usr/bin/env python3
"""
Pregătește pozele magazinului din originalele Gemini.

Citește din  _originale-gemini/   (nu intră în git)
Scrie în     images/              (înlocuiește pozele cu același nume)

Rulare (din folderul proiectului):
    python3 tools/pregateste-poze.py

Ce face:
- pozele „produs”: găsește produsul pe fundal, adaugă o margine de ~14%,
  decupează la 4:5 și salvează la 960×1200. Dacă produsul e prea lat
  pentru 4:5, NU îl taie: extinde pânza cu culoarea fundalului.
- pozele recolorate folosesc exact același dreptunghi ca poza lor de bază,
  ca produsul să nu „sară” când schimbi culoarea pe site;
- „scena” (frontala pe munte): 4:5 pe toată înălțimea, centrată pe om;
- „late”: hero.jpg rămâne lat (doar recomprimat), og-gram.jpg = 1200×630;
- la final: o planșă de control _originale-gemini/control.jpg.

Are nevoie de Pillow:  python3 -m pip install --user pillow
"""

import glob
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_originale-gemini")
OUT = os.path.join(ROOT, "images")

FINAL_SIZE = (960, 1200)   # 4:5
QUALITY = 82
MARGIN = 0.14              # margine în jurul produsului
THRESHOLD = 30             # distanța RGB față de fundal ca pixelul să fie „produs”
FEATHER = 48               # trecerea treptată spre pânza extinsă (px)

# început de nume original → (fișier final, tip). Tipuri: produs, scena, hero, og
MAPPING = [
    ("r93yje", "rucsac-creasta-1.jpg", "produs"),
    ("mdiioc", "rucsac-creasta-2.jpg", "produs"),
    ("q4lhdq", "rucsac-creasta-3.jpg", "produs"),
    ("ww9y9p", "rucsac-popas-1.jpg", "produs"),
    ("4ohimd", "rucsac-popas-2.jpg", "produs"),
    ("lt2rks", "rucsac-sprint-1.jpg", "produs"),
    ("bjnm1m", "frontala-licar-1.jpg", "produs"),
    ("voqufj", "frontala-licar-2.jpg", "scena"),
    ("f8byw7", "felinar-vatra-1.jpg", "produs"),
    ("q08ohi", "bete-carbon-1.jpg", "produs"),
    ("7xvcoz", "bete-carbon-2.jpg", "produs"),
    ("8oneys", "bete-aluminiu-1.jpg", "produs"),
    ("vrjnqb", "filtru-izvor-1.jpg", "produs"),
    ("ly9eza", "termos-parau-1.jpg", "produs"),
    ("mxa22n", "rezervor-1.jpg", "produs"),
    ("yss49b", "busola-nord-1.jpg", "produs"),
    ("w3opjd", "trusa-1.jpg", "produs"),
    ("kxdo53", "set-urgenta-1.jpg", "produs"),
    ("buo61v", "arzator-1.jpg", "produs"),
    ("b22yay", "cana-titan-1.jpg", "produs"),
    ("tgsbxy", "spork-1.jpg", "produs"),
    ("modlfk", "hero.jpg", "hero"),
    ("c7m9vn", "og-gram.jpg", "og"),
]

# poză recolorată → (fișier final, poza de bază al cărei dreptunghi îl folosim)
RECOLORS = [
    ("recolor-creasta-grafit", "rucsac-creasta-grafit-1.jpg", "r93yje"),
    ("recolor-creasta-oliv", "rucsac-creasta-oliv-1.jpg", "r93yje"),
    ("recolor-termos-grafit", "termos-parau-grafit-1.jpg", "ly9eza"),
    ("recolor-sprint-negru", "rucsac-sprint-negru-1.jpg", "lt2rks"),
]

SCENE_CENTER_X = 0.375  # omul cu frontala e la ~35–40% din lățime


def find_source(prefix):
    """Fișierul original care începe cu prefixul dat (exact unul)."""
    matches = glob.glob(os.path.join(SRC, "Gemini_Generated_Image_" + prefix + "*.jpg"))
    matches += glob.glob(os.path.join(SRC, prefix + "*.jpg"))
    if len(matches) != 1:
        sys.exit(f"Nu găsesc exact un fișier pentru „{prefix}”: {matches}")
    return matches[0]


def background_color(img):
    """Media a patru pătrate de 24×24 din colțuri."""
    w, h = img.size
    boxes = [(0, 0, 24, 24), (w - 24, 0, w, 24), (0, h - 24, 24, h), (w - 24, h - 24, w, h)]
    pixels = []
    for box in boxes:
        pixels.extend(img.crop(box).getdata())
    n = len(pixels)
    return tuple(round(sum(p[i] for p in pixels) / n) for i in range(3))


def product_bbox(img, bg):
    """Dreptunghiul care cuprinde pixelii care diferă de fundal cu > THRESHOLD."""
    # Lucrăm pe o copie micșorată de 4 ori: mai rapid și fără „purici” de zgomot
    small = img.resize((img.width // 4, img.height // 4), Image.BOX)
    mask = Image.new("L", small.size, 0)
    mask.putdata([
        255 if (r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2 > THRESHOLD ** 2 else 0
        for r, g, b in small.getdata()
    ])
    mask = mask.filter(ImageFilter.MinFilter(3))  # scoate punctele izolate
    box = mask.getbbox()
    if not box:
        return (0, 0, img.width, img.height)
    return tuple(v * 4 for v in box)


def product_rect(img, bg):
    """Dreptunghiul final 4:5 (poate ieși din imagine → pânza se extinde)."""
    x0, y0, x1, y1 = product_bbox(img, bg)
    w, h = img.size

    # Produs care umple cadrul (ex: detaliul centurii): decupare de tip „scenă”
    touches = sum([x0 <= 8, y0 <= 8, x1 >= w - 8, y1 >= h - 8])
    if touches >= 3:
        return scene_rect(img, center_x=(x0 + x1) / 2 / w), True

    pad = MARGIN * max(x1 - x0, y1 - y0)
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rw, rh = x1 - x0, y1 - y0
    if rw / rh > 4 / 5:
        rh = rw * 5 / 4
    else:
        rw = rh * 4 / 5
    return (round(cx - rw / 2), round(cy - rh / 2), round(cx + rw / 2), round(cy + rh / 2)), False


def scene_rect(img, center_x):
    """4:5 pe toată înălțimea, centrat orizontal la center_x (0–1)."""
    w, h = img.size
    rw = round(h * 4 / 5)
    x0 = round(center_x * w - rw / 2)
    x0 = max(0, min(w - rw, x0))
    return (x0, 0, x0 + rw, h)


def crop_on_canvas(img, rect, bg):
    """Decupează rect; unde iese din imagine, completează cu culoarea fundalului,
    cu o trecere treptată ca să nu se vadă o „cusătură”."""
    x0, y0, x1, y1 = rect
    w, h = img.size
    if x0 >= 0 and y0 >= 0 and x1 <= w and y1 <= h:
        return img.crop(rect)

    canvas = Image.new("RGB", (x1 - x0, y1 - y0), bg)
    # Masca: opacă în interior, se estompează spre laturile unde pânza e extinsă.
    # O mască pentru fiecare latură, apoi le combinăm (la colțuri câștigă minimul).
    mask = Image.new("L", (w, h), 255)
    sides = [x0 < 0, x1 > w, y0 < 0, y1 > h]  # stânga, dreapta, sus, jos
    for side, extended in enumerate(sides):
        if not extended:
            continue
        edge = Image.new("L", (w, h), 255)
        draw = ImageDraw.Draw(edge)
        for i in range(FEATHER):
            value = round(255 * i / FEATHER)
            if side == 0:
                draw.line([(i, 0), (i, h)], fill=value)
            elif side == 1:
                draw.line([(w - 1 - i, 0), (w - 1 - i, h)], fill=value)
            elif side == 2:
                draw.line([(0, i), (w, i)], fill=value)
            else:
                draw.line([(0, h - 1 - i), (w, h - 1 - i)], fill=value)
        mask = ImageChops.darker(mask, edge)
    canvas.paste(img, (-x0, -y0), mask)
    return canvas


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)  # fără EXIF
    return path


def main():
    rects = {}
    report = []

    for prefix, name, kind in MAPPING:
        img = Image.open(find_source(prefix)).convert("RGB")
        bg = background_color(img)

        if kind == "produs":
            rect, full_frame = product_rect(img, bg)
            rects[prefix] = (rect, bg)
            out = crop_on_canvas(img, rect, bg).resize(FINAL_SIZE, Image.LANCZOS)
            extended = rect[0] < 0 or rect[1] < 0 or rect[2] > img.width or rect[3] > img.height
            note = "umple cadrul → decupare tip scenă" if full_frame else ("pânză extinsă" if extended else "decupată")
        elif kind == "scena":
            out = img.crop(scene_rect(img, SCENE_CENTER_X)).resize(FINAL_SIZE, Image.LANCZOS)
            note = "scenă 4:5"
        elif kind == "hero":
            out = img
            note = "lată, doar recomprimată"
        else:  # og
            resized = img.resize((1200, round(img.height * 1200 / img.width)), Image.LANCZOS)
            top = (resized.height - 630) // 2
            out = resized.crop((0, top, 1200, top + 630))
            note = "1200×630"

        save(out, name)
        report.append((name, out.size, note))

    for prefix, name, base in RECOLORS:
        img = Image.open(find_source(prefix)).convert("RGB")
        rect, base_bg = rects[base]
        bg = background_color(img)
        out = crop_on_canvas(img, rect, bg).resize(FINAL_SIZE, Image.LANCZOS)
        save(out, name)
        report.append((name, out.size, f"același dreptunghi ca {base}"))

    for name, size, note in report:
        print(f"{name:32} {size[0]}×{size[1]}  {note}")

    make_control_sheet([name for name, _, _ in report])


def make_control_sheet(names):
    """Toate pozele finale mici, cu numele sub fiecare."""
    cell_w, cell_h, label_h, cols = 192, 240, 18, 7
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * (cell_h + label_h)), "white")
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(names):
        img = Image.open(os.path.join(OUT, name))
        img.thumbnail((cell_w - 6, cell_h - 6))
        x = (i % cols) * cell_w
        y = (i // cols) * (cell_h + label_h)
        sheet.paste(img, (x + (cell_w - img.width) // 2, y + (cell_h - img.height) // 2))
        draw.text((x + 4, y + cell_h + 2), name, fill="black")
    path = os.path.join(SRC, "control.jpg")
    sheet.save(path, quality=85)
    print("Planșa de control:", path)


if __name__ == "__main__":
    main()
