import os
import json
import base64
from io import BytesIO
import numpy as np
from PIL import Image

plat = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_seamless_clean_640x72.png').convert('RGBA')
w, h = plat.size
arr = np.array(plat)

# Palette of the metal railing (sampled from the original platform)
c_top_high = [82, 68, 112, 255]   # row 3
c_top_body = [40, 32, 60, 255]    # row 4
c_mid_high = [64, 52, 92, 255]    # row 8
c_mid_body = [32, 25, 50, 255]    # row 9
c_bot_high = [70, 58, 100, 255]   # row 14
c_bot_body = [24, 19, 38, 255]    # row 15

c_post_cap  = [90, 75, 125, 255]
c_post_high = [72, 60, 104, 255]
c_post_mid  = [42, 34, 65, 255]
c_post_dark = [22, 18, 36, 255]

# Post spacing: every 20 pixels
# 640 / 20 = 32 posts perfectly repeating across 640 width!
post_spacing = 20

# 1. Clear rows 0 to 15 to completely transparent
arr[:16, :, 3] = 0

# 2. Draw horizontal rails
for x in range(w):
    # Top rail
    arr[3, x] = c_top_high
    arr[4, x] = c_top_body
    
    # Mid rail
    arr[8, x] = c_mid_high
    arr[9, x] = c_mid_body
    
    # Bottom rail
    arr[14, x] = c_bot_high
    arr[15, x] = c_bot_body

# 3. Draw vertical posts every 20px
for px in range(0, w, post_spacing):
    # Post cap at top (rows 1 and 2)
    for cap_x in range(px - 1, px + 3):
        if 0 <= cap_x < w:
            arr[1, cap_x] = c_post_cap
            arr[2, cap_x] = c_post_mid

    # Vertical post body (rows 3 to 15)
    # 3 pixels wide
    x0 = px
    x1 = (px + 1) % w
    x2 = (px + 2) % w
    
    for y in range(3, 16):
        arr[y, x0] = c_post_high
        arr[y, x1] = c_post_mid
        arr[y, x2] = c_post_dark

    # Also add a delicate intermediate baluster at px + 10 (1px wide)
    bx = (px + 10) % w
    for y in range(3, 15):
        if y not in [3, 4, 8, 9, 14, 15]:
            arr[y, bx] = c_post_mid

# Rows 16 to 71 remain the authentic, untouched cyberpunk platform deck & girders!
clean_plat = Image.fromarray(arr)
clean_plat.save('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/platform_transparent_640x72.png')

print("Clean transparent railing platform generated successfully!")
