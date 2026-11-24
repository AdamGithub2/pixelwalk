"""Crop and pack generated turn/back-walk illustrations into grounded 48x56 frames."""
import base64
import json
from pathlib import Path
from statistics import median

from PIL import Image

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets' / 'entry'


def build():
    source = Image.open(ASSETS / 'hero-entry-source.png').convert('RGBA')
    cells = []
    for row in range(2):
        cells.append([])
        for col in range(4):
            cell = source.crop((col * source.width // 4, row * source.height // 2,
                                (col + 1) * source.width // 4, (row + 1) * source.height // 2))
            bounds = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Empty entry frame: {row}, {col}')
            cells[-1].append(cell.crop(bounds))
    scale = min(46 / median(cell.height for cell in cells[0]),
                49 / max(cell.height for row in cells for cell in row),
                44 / max(cell.width for row in cells for cell in row))
    sheet = Image.new('RGBA', (192, 112))
    for row, frames in enumerate(cells):
        for col, cell in enumerate(frames):
            small = cell.resize((round(cell.width * scale), round(cell.height * scale)),
                                Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (48, 56))
            frame.alpha_composite(small, ((48 - small.width) // 2, 51 - small.height))
            sheet.alpha_composite(frame, (col * 48, row * 56))
    path = ASSETS / 'hero-entry-sprites.png'
    sheet.save(path, optimize=True)
    payload = {'frameWidth': 48, 'frameHeight': 56, 'footY': 51, 'frames': 4,
               'sheet': 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')}
    (ROOT / 'entry_assets.js').write_text('/* Generated turn and back-walk frames. */\n'
                                        'globalThis.ENTRY_HERO_ASSETS = ' + json.dumps(payload) + ';\n',
                                        encoding='utf-8')
    print('Packed 4 turn frames and 4 back-walk frames into entry_assets.js')


if __name__ == '__main__':
    build()
