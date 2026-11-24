import os
import math
import base64
import json
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

print("1. Preparing seamless platform...")
pingpong = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_seamless_pingpong.png')
# For 320x180: height=72, width=640 (seamless pingpong tile of exactly 640x72!)
plat_640x72 = pingpong.resize((640, 72), Image.Resampling.LANCZOS)
plat_640x72.save('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_seamless_640x72.png')

buf = BytesIO()
plat_640x72.save(buf, format='PNG', optimize=True)
plat_b64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
print(f"Platform base64 length: {len(plat_b64)}")

with open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_data.js', 'w', encoding='utf-8') as f:
    f.write('const PLATFORM_SEAMLESS_BG = ' + json.dumps(plat_b64) + ';\n')
print("platform_data.js created successfully!")
