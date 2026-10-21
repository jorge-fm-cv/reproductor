#!/usr/bin/env python3
"""
Genera todos los iconos de la app ("jfmMusic") con Pillow.

Salida (carpeta assets/):
  icon.png                      1024x1024  icono principal a sangre
  android-icon-background.png    512x512   fondo del icono adaptativo
  android-icon-foreground.png    512x512   logo con transparencia (icono adaptativo)
  android-icon-monochrome.png    432x432   logo en blanco (iconos temáticos Android 13+)
  favicon.png                    48x48    favicon web
  splash-icon.png               1024x1024  logo con transparencia (pantalla de inicio)

Uso:  python3 scripts/generate-logo.py
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')

# Paleta de la app (src/theme/index.js)
BG_TOP = (26, 16, 51)  # #1A1033
BG_BOTTOM = (14, 17, 22)  # #0E1116
GLOW = (139, 92, 246)  # #8B5CF6 (primary)
ACCENT = (167, 139, 250)  # #A78BFA
TEXT = (245, 245, 247)  # #F5F5F7
WHITE = (255, 255, 255)

FONT_PATH = '/System/Library/Fonts/Avenir Next.ttc'
FONT_HEAVY = 8  # 'Avenir Next Heavy'
FONT_DEMI = 2  # 'Avenir Next Demi Bold'


# --------------------------------------------------------------------------- utilidades


def gradient(size, top=BG_TOP, bottom=BG_BOTTOM):
    """Degradado vertical."""
    t = np.linspace(0, 1, size, dtype=np.float32)[:, None, None]
    top_a = np.array(top, dtype=np.float32)[None, None, :]
    bottom_a = np.array(bottom, dtype=np.float32)[None, None, :]
    img = top_a * (1 - t) + bottom_a * t
    return Image.fromarray(np.repeat(img, size, axis=1).astype(np.uint8), 'RGB').convert('RGBA')


def add_glow(img, center, radius, color=GLOW, strength=0.5):
    """Resplandor radial (viñeta de luz) en el fondo."""
    w, h = img.size
    ys, xs = np.mgrid[0:h, 0:w]
    dist = np.sqrt((xs - center[0]) ** 2 + (ys - center[1]) ** 2) / radius
    mask = np.clip(1 - dist, 0, 1) ** 2
    layer = Image.new('RGBA', (w, h), color + (0,))
    layer.putalpha(Image.fromarray((mask * strength * 255).astype(np.uint8), 'L'))
    return Image.alpha_composite(img, layer)


def tracked_width(draw, text, font, tracking):
    return sum(draw.textlength(ch, font=font) for ch in text) + tracking * (len(text) - 1)


def draw_tracked(draw, cx, baseline, text, font, fill, tracking):
    """Escribe texto con espaciado entre letras, centrado en `cx`."""
    x = cx - tracked_width(draw, text, font, tracking) / 2
    for ch in text:
        draw.text((x, baseline), ch, font=font, fill=fill, anchor='ls')
        x += draw.textlength(ch, font=font) + tracking
    return x


# --------------------------------------------------------------------------- logotipo


def render_lockup(size, color_text=TEXT, color_accent=ACCENT, mono=False):
    """
    Dibuja el logotipo 'jfmMusic' (jfm + Music + ecualizador) sobre fondo
    transparente. `size` es el lado del lienzo; devuelve la imagen ya recortada
    al contenido (bbox) para poder reescalarla sin problemas.
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_jfm = ImageFont.truetype(FONT_PATH, int(size * 0.30), index=FONT_HEAVY)
    font_music = ImageFont.truetype(FONT_PATH, int(size * 0.165), index=FONT_DEMI)

    cx = size / 2
    baseline_jfm = size * 0.40
    baseline_music = size * 0.62

    # "jfm" en blanco, "Music" en morado (ligeramente más pequeña y espaciada)
    draw_tracked(draw, cx, baseline_jfm, 'jfm', font_jfm, color_text, -size * 0.004)
    draw_tracked(draw, cx, baseline_music, 'Music', font_music, color_accent, size * 0.018)

    # Ecualizador: 5 barras redondeadas sobre una línea base común
    bar_w = size * 0.026
    gap = size * 0.018
    heights = [0.055, 0.090, 0.120, 0.085, 0.050]
    base_y = size * 0.815
    total_w = len(heights) * bar_w + (len(heights) - 1) * gap
    x = cx - total_w / 2
    for i, h in enumerate(heights):
        h = size * h
        color = color_accent if mono else tuple(
            int(GLOW[c] + (ACCENT[c] - GLOW[c]) * (i / (len(heights) - 1)))
            for c in range(3)
        )
        draw.rounded_rectangle(
            [x, base_y - h, x + bar_w, base_y], radius=bar_w / 2, fill=color + (255,)
        )
        x += bar_w + gap

    return img.crop(img.getbbox())


def render_mark(size, color=TEXT):
    """Versión reducida del logotipo (solo 'jfm') para tamaños muy pequeños."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, int(size * 0.46), index=FONT_HEAVY)
    draw_tracked(draw, size / 2, size * 0.74, 'jfm', font, color, -size * 0.01)
    return img.crop(img.getbbox())


def paste_centered(bg, logo, box):
    """Pega el logo (ya recortado) centrado en `bg`, ajustándolo a `box`."""
    logo = logo.copy()
    logo.thumbnail(box, Image.LANCZOS)
    x = (bg.width - logo.width) // 2
    y = (bg.height - logo.height) // 2
    bg.alpha_composite(logo, (x, y))
    return bg


# --------------------------------------------------------------------------- generación


def main():
    os.makedirs(ASSETS, exist_ok=True)

    # Logo maestro (se recorta y se reescala para cada destino)
    lockup = render_lockup(2048)
    lockup_mono = render_lockup(2048, color_text=WHITE, color_accent=WHITE, mono=True)

    # 1. Icono principal 1024x1024 (fondo + logo a sangre)
    icon = gradient(1024)
    icon = add_glow(icon, (512, 380), 620, GLOW, 0.45)
    icon = paste_centered(icon, lockup, (660, 660))
    icon.convert('RGB').save(os.path.join(ASSETS, 'icon.png'))

    # 2. Fondo del icono adaptativo 512x512 (sin logo)
    bg = gradient(512)
    bg = add_glow(bg, (256, 190), 310, GLOW, 0.45)
    bg.save(os.path.join(ASSETS, 'android-icon-background.png'))

    # 3. Primer plano del icono adaptativo 512x512 (solo el logo, con transparencia).
    #    El contenido debe caber en la zona segura central (66% = 340 px).
    fg = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    fg = paste_centered(fg, lockup, (300, 300))
    fg.save(os.path.join(ASSETS, 'android-icon-foreground.png'))

    # 4. Icono monocromo 432x432 (Android 13+ lo tinta con el color del tema)
    mono = Image.new('RGBA', (432, 432), (0, 0, 0, 0))
    mono = paste_centered(mono, lockup_mono, (250, 250))
    mono.save(os.path.join(ASSETS, 'android-icon-monochrome.png'))

    # 5. Favicon 48x48 (solo 'jfm', el resto no se lee a ese tamaño)
    fav = gradient(48)
    fav = add_glow(fav, (24, 18), 30, GLOW, 0.4)
    fav = paste_centered(fav, render_mark(256), (34, 34))
    fav.save(os.path.join(ASSETS, 'favicon.png'))

    # 6. Splash 1024x1024 (logo con transparencia; el fondo lo pone app.json)
    splash = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    splash = paste_centered(splash, lockup, (620, 620))
    splash.save(os.path.join(ASSETS, 'splash-icon.png'))

    for name in [
        'icon.png',
        'android-icon-background.png',
        'android-icon-foreground.png',
        'android-icon-monochrome.png',
        'favicon.png',
        'splash-icon.png',
    ]:
        path = os.path.join(ASSETS, name)
        im = Image.open(path)
        print(f'{name:34} {im.size[0]}x{im.size[1]}  {im.mode}  {os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    main()
