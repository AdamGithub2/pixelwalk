"""Measure and index the generated transparent 4x2 atlas; never redraw sprites."""
import json
from pathlib import Path
from statistics import median

from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'assets' / 'interior-hero' / 'hero-atlas-source.png'


def build():
    image = Image.open(SOURCE).convert('RGBA')
    rows = []
    for row in range(2):
        frames = []
        for col in range(4):
            x, y = col * image.width // 4, row * image.height // 2
            right, bottom = (col + 1) * image.width // 4, (row + 1) * image.height // 2
            alpha = image.getchannel('A').crop((x, y, right, bottom))
            bounds = alpha.point(lambda value: 255 if value > 24 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Empty sprite: row {row}, column {col}')
            left, top, r, b = bounds
            # One transparent pixel of padding preserves the generated soft edges.
            left, top = max(0, left - 1), max(0, top - 1)
            r, b = min(right - x, r + 1), min(bottom - y, b + 1)
            frames.append([x + left, y + top, r - left, b - top])
        rows.append(frames)
    data = {
        'src': './assets/interior-hero/hero-atlas-source.png',
        'referenceHeight': median(frame[3] for frame in rows[0]),
        'idle': rows[0], 'walk': rows[1]
    }
    (ROOT / 'interior_hero_assets.js').write_text(
        '/* Generated atlas coordinates; source artwork stays unchanged. */\n'
        'globalThis.INTERIOR_HERO_ASSETS = ' + json.dumps(data) + ';\n', encoding='utf-8')
    print(json.dumps({'size': image.size, 'frames': 8, 'referenceHeight': data['referenceHeight']}))


if __name__ == '__main__':
    build()
