#!/usr/bin/env python3
"""
Generate favicons from Unicode U+2726 (✦ BLACK FOUR POINTED STAR) — glyph only, transparent PNG/ICO.
Requires Pillow. Prefers Arial Unicode MS on macOS for correct ✦ shape.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

# Unicode BLACK FOUR POINTED STAR (must match desired tab icon)
GLYPH = "\u2726"

# Target: glyph fits within ~65% of canvas width/height (generous padding)
TARGET_FRAC = 0.65

FONT_CANDIDATES: list[tuple[str, int | None]] = [
    ("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", None),
    ("/Library/Fonts/Arial Unicode.ttf", None),
    ("/System/Library/Fonts/Helvetica.ttc", 0),
    ("/System/Library/Fonts/Supplemental/DejaVuSans.ttf", None),
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    last_err: Exception | None = None
    for path, index in FONT_CANDIDATES:
        p = Path(path)
        if not p.exists():
            continue
        try:
            if index is not None:
                return ImageFont.truetype(path, size, index=index)
            return ImageFont.truetype(path, size)
        except OSError as e:
            last_err = e
            continue
    raise RuntimeError(f"No usable font for {GLYPH!r}; install Arial Unicode or DejaVu. Last error: {last_err}")


def render_master(canvas: int = 2048) -> Image.Image:
    """High-res RGBA: black ✦ on transparent, optically centered."""
    im = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    max_dim = int(canvas * TARGET_FRAC)

    lo, hi = 10, int(canvas * 1.2)
    chosen: tuple[ImageFont.FreeTypeFont, tuple[int, int, int, int]] | None = None
    while lo <= hi:
        mid = (lo + hi) // 2
        font = load_font(mid)
        bbox = draw.textbbox((0, 0), GLYPH, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        if w <= max_dim and h <= max_dim and w > 0 and h > 0:
            chosen = (font, bbox)
            lo = mid + 1
        else:
            hi = mid - 1

    if not chosen:
        font = load_font(max(24, max_dim // 2))
        bbox = draw.textbbox((0, 0), GLYPH, font=font)
        chosen = (font, bbox)

    font, bbox = chosen
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (canvas - tw) / 2 - bbox[0]
    y = (canvas - th) / 2 - bbox[1]
    draw.text((x, y), GLYPH, font=font, fill=(0, 0, 0, 255))
    return im


def main() -> None:
    master = render_master(2048)

    out_png = master.resize((512, 512), Image.Resampling.LANCZOS)
    out_png.save(ROOT / "favicon.png", "PNG", optimize=True)

    im32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    im16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    im180 = master.resize((180, 180), Image.Resampling.LANCZOS)

    im32.save(ROOT / "favicon-32x32.png", "PNG", optimize=True)
    im16.save(ROOT / "favicon-16x16.png", "PNG", optimize=True)
    im180.save(ROOT / "apple-touch-icon.png", "PNG", optimize=True)
    im32.save(ROOT / "favicon.ico", format="ICO", sizes=[(32, 32), (16, 16)])

    # Remove vector favicon if present (single source of truth: raster ✦)
    svg = ROOT / "favicon.svg"
    if svg.exists():
        svg.unlink()

    print("Wrote favicon.png, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png, favicon.ico")
    if not any(Path(p).exists() for p, _ in FONT_CANDIDATES):
        print("Warning: expected system fonts missing.")


if __name__ == "__main__":
    main()
