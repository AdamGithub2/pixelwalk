"""Pack the generated movement atlas and dedicated downed poses for the game.

Only crops, scales and packs the generated artwork; keeps the original atlas
and alpha. No procedural character drawing or recolouring is used.
"""
import base64
import json
from pathlib import Path
from statistics import median

from PIL import Image

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets' / 'pedestrians'
SOURCE = ASSETS / 'tracksuit-atlas-v2.png'
DOWN_SOURCE = ASSETS / 'tracksuit-downed-source.png'
FRAME_W, FRAME_H, FOOT_Y = 48, 56, 51


def build():
    source = Image.open(SOURCE).convert('RGBA')
    cells = []
    for row in range(4):
        cells.append([])
        for col in range(4):
            cell = source.crop((col * source.width // 4, row * source.height // 4,
                                (col + 1) * source.width // 4, (row + 1) * source.height // 4))
            # Ignore near-transparent edge pixels when measuring the silhouette.
            bounds = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Empty sprite at row {row}, column {col}')
            cells[-1].append(cell.crop(bounds))

    # Shared scale across each cycle keeps knees/strides from changing body size.
    # Running bends the knees; use the standing walk height for both cycles.
    sheet = Image.new('RGBA', (4 * FRAME_W, 4 * FRAME_H))
    for row, frames in enumerate(cells):
        walk_row = 0 if row < 2 else 2
        scale = 46 / median(frame.height for frame in cells[walk_row])
        scale = min(scale, (FRAME_W - 4) / max(frame.width for frame in frames),
                    49 / max(frame.height for frame in frames))
        for col, cell in enumerate(frames):
            size = (max(1, round(cell.width * scale)), max(1, round(cell.height * scale)))
            small = cell.resize(size, Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (FRAME_W, FRAME_H))
            frame.alpha_composite(small, ((FRAME_W - small.width) // 2, FOOT_Y - small.height))
            frame.save(ASSETS / f'frame-{row}-{col}.png')
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))
    path = ASSETS / 'tracksuit-sprites-v2.png'
    sheet.save(path, optimize=True)
    down_source = Image.open(DOWN_SOURCE).convert('RGBA')
    down_cells = []
    for col in range(2):
        cell = down_source.crop((col * down_source.width // 2, 0,
                                 (col + 1) * down_source.width // 2, down_source.height))
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Empty downed sprite in column {col}')
        down_cells.append(cell.crop(bounds))
    # Match the standing character's body scale, with a grounded bent-leg pose.
    down_scale = min(52 / median(cell.width for cell in down_cells),
                     25 / max(cell.height for cell in down_cells))
    down_sheet = Image.new('RGBA', (200, 76))
    for col, cell in enumerate(down_cells):
        small = cell.resize((round(cell.width * down_scale), round(cell.height * down_scale)),
                            Image.Resampling.LANCZOS)
        down_sheet.alpha_composite(small, (col * 100 + 34 - small.width // 2,
                                          54 - small.height))
    down_path = ASSETS / 'tracksuit-downed-sprites.png'
    down_sheet.save(down_path, optimize=True)
    data = {
        'frameWidth': FRAME_W, 'frameHeight': FRAME_H, 'frames': 4,
        'sheet': 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode('ascii'),
        'downFrameWidth': 100, 'downFrameHeight': 76,
        'downSheet': 'data:image/png;base64,' + base64.b64encode(down_path.read_bytes()).decode('ascii')
    }
    (ROOT / 'pedestrian_assets.js').write_text(
        '/* Generated from the movement and downed source atlases in assets/pedestrians/. */\n'
        'globalThis.PEDESTRIAN_ASSETS = ' + json.dumps(data) + ';\n', encoding='utf-8')
    print(f'Packed 16 movement frames and 2 dedicated downed poses: {path.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
