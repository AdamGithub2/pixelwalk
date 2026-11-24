"""Pack generated PRL artwork into pixel-sized layers for file:// and HTTP use."""
import base64
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets' / 'prl'
data = {}


def front_panorama():
    # Each segment has its own height, with every entrance on one baseline.
    # Do not mirror shop signs or stretch the low market to apartment height.
    segments = [('front', (384, 120)), ('cinema', (384, 120)),
                ('market', (320, 72)), ('blocks', (576, 120))]
    panorama = Image.new('RGBA', (sum(size[0] for _, size in segments), 120))
    x = 0
    for name, size in segments:
        image = Image.open(ASSETS / f'{name}_source.png').convert('RGBA')
        image = image.crop(image.getbbox()).resize(size, Image.Resampling.LANCZOS)
        # The market artwork has extra space beneath its stalls and frame.
        offset_y = 3 if name == 'market' else 0
        panorama.alpha_composite(image, (x, 120 - size[1] + offset_y))
        x += size[0]
    return panorama


for name, size in [('sky', (320, 180)), ('far', (384, 105)),
                   ('front', (384, 120)), ('floor', (320, 55))]:
    source = Image.open(ASSETS / f'{name}_source.png').convert('RGBA')
    if name in ('far', 'front'):
        source = source.crop(source.getbbox())
    elif name == 'floor':
        # The generated strip includes presentation whitespace above the curb.
        source = source.crop((0, 210, source.width, source.height))
    # Raster preparation only: preserve generated artwork and alpha.
    source = source.resize(size, Image.Resampling.LANCZOS)
    if name == 'front':
        # Repeat normally so Polish shop signs stay readable in every section.
        layer = front_panorama()
    else:
        layer = Image.new('RGBA', (size[0] * 2, size[1]))
        layer.paste(source, (0, 0))
        layer.paste(ImageOps.mirror(source), (size[0], 0))
    path = ASSETS / f'{name}.png'
    layer.save(path, optimize=True)
    data[name] = 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

(ROOT / 'prl_assets.js').write_text(
    'globalThis.PRL_ASSETS = ' + json.dumps(data) + ';\n', encoding='utf-8')
print('Packed four PRL layers into prl_assets.js')
