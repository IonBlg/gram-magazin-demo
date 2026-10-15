#!/usr/bin/env python3
"""
Face din fiecare poză de produs (960×1200) o variantă mică de 480×600,
cu sufixul -480 (ex: rucsac-creasta-1.jpg → rucsac-creasta-1-480.jpg).
Site-ul le folosește prin srcset pe carduri, miniaturi și în coș,
ca telefoanele să nu descarce pozele mari când nu e nevoie.

Rulare (din folderul proiectului):
    python3 tools/variante-480.py

Rulează-l din nou după ce adaugi sau schimbi o poză de produs.
Are nevoie de Pillow:  python3 -m pip install --user pillow
"""

import glob
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "images")

SIZE = (480, 600)
QUALITY = 80
SKIP = {"hero.jpg", "og-gram.jpg"}  # pozele late nu sunt poze de produs


def main():
    made = 0
    total_before = 0
    total_after = 0

    for path in sorted(glob.glob(os.path.join(IMAGES, "*.jpg"))):
        name = os.path.basename(path)
        if name in SKIP or name.endswith("-480.jpg"):
            continue

        img = Image.open(path).convert("RGB")
        if img.size != (960, 1200):
            print(f"Sar peste {name}: are {img.size[0]}×{img.size[1]}, nu 960×1200")
            continue

        small_path = path[:-4] + "-480.jpg"
        img.resize(SIZE, Image.LANCZOS).save(small_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)

        before = os.path.getsize(path)
        after = os.path.getsize(small_path)
        total_before += before
        total_after += after
        made += 1
        print(f"{os.path.basename(small_path):34} {before // 1024:4} KB → {after // 1024:3} KB")

    print(f"\n{made} variante de 480×600: {total_before // 1024} KB (960) → {total_after // 1024} KB (480)")


if __name__ == "__main__":
    main()
