#!/usr/bin/env python3
"""Remove solid green background from ac-logo.png."""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow required: pip install Pillow")

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ac-logo.png"
BACKUP = ROOT / "ac-logo-green-bg.png"


def is_background(r, g, b, a):
    if a < 16:
        return True
    # Olive/sage green plate used in the source asset
    return g >= 70 and g > r + 8 and g > b + 8 and r < 140 and b < 140


def main():
    img = Image.open(SRC).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if is_background(r, g, b, a):
                pixels[x, y] = (r, g, b, 0)

    if not BACKUP.exists():
        import shutil
        shutil.copy2(SRC, BACKUP)

    img.save(SRC, optimize=True)
    print(f"Updated {SRC}")


if __name__ == "__main__":
    main()
