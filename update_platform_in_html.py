import json
import base64
from io import BytesIO
from PIL import Image

plat = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_transparent_640x72.png').convert('RGBA')
buf = BytesIO()
plat.save(buf, format='PNG', optimize=True)
b64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')

with open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_data_clean.js', 'w', encoding='utf-8') as f:
    f.write('const PLATFORM_SEAMLESS_BG = ' + json.dumps(b64) + ';\n')

# Now update index.html
html_path = 'c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

import re
replacement = 'const PLATFORM_SEAMLESS_BG = ' + json.dumps(b64) + ';'
html = re.sub(r'const PLATFORM_SEAMLESS_BG = "data:image/png;base64,[\s\S]*?";', replacement, html, count=1)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: index.html updated with transparent railing platform!")
