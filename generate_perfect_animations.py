import os
import math
import json
import base64
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw

hero = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/hero_tight.png').convert('RGBA')
hw, hh = hero.size

FW, FH = 48, 56
GROUND_Y = 51
BASE_H = 46
scale = BASE_H / float(hh)

# Upper body: Head, neck, torso, hoodie, jacket as ONE SOLID UNBROKEN PIECE
# So head can NEVER be cut off, detached, or misaligned
upper_body = hero.crop((0, 0, hw, 840))

# Legs for natural knee articulation
legs = hero.crop((0, 800, hw, hh))
mid = hw // 2
l_arr = np.array(legs)
r_arr = np.array(legs)
l_arr[:, mid:] = 0
r_arr[:, :mid] = 0

ll_orig = Image.fromarray(l_arr)
rl_orig = Image.fromarray(r_arr)

knee_split = 260
overlap = 40

ll_thigh = ll_orig.crop((0, 0, hw, knee_split + overlap))
ll_calf = ll_orig.crop((0, knee_split - overlap, hw, legs.height))
rl_thigh = rl_orig.crop((0, 0, hw, knee_split + overlap))
rl_calf = rl_orig.crop((0, knee_split - overlap, hw, legs.height))

def build_leg(thigh, calf, hip_cx, thigh_rot=0, knee_bend=0):
    cw, ch = hw * 2, int(legs.height * 1.5)
    top_x = cw // 2 - hw // 2
    top_y = 50

    hip_px = top_x + hip_cx
    hip_py = top_y

    t_c = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    t_c.paste(thigh, (top_x, top_y), thigh)
    t_rot = t_c.rotate(-thigh_rot, center=(hip_px, hip_py), resample=Image.Resampling.BICUBIC)

    rad = math.radians(-thigh_rot)
    knee_px = hip_px - math.sin(rad) * knee_split
    knee_py = hip_py + math.cos(rad) * knee_split

    total_rot = -thigh_rot - knee_bend
    c_c = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    c_paste_x = int(knee_px - hip_cx)
    c_paste_y = int(knee_py - overlap)
    c_c.paste(calf, (c_paste_x, c_paste_y), calf)
    c_rot = c_c.rotate(total_rot, center=(int(knee_px), int(knee_py)), resample=Image.Resampling.BICUBIC)

    return Image.alpha_composite(t_rot, c_rot), hip_px, hip_py

def compose_frame(
    body_lean=0, bounce_dy=0,
    l_thigh=0, l_knee=0, r_thigh=0, r_knee=0,
    squash_y=1.0, stretch_x=1.0,
    fx_type=None, fx_phase=0
):
    sub_w, sub_h = 1000, 1600
    sub = Image.new('RGBA', (sub_w, sub_h), (0, 0, 0, 0))
    center_x = sub_w // 2
    hip_y = 800 + bounce_dy

    left_hip_cx = 115
    right_hip_cx = 345

    # 1. Right leg (back)
    rl_img, r_hpx, r_hpy = build_leg(rl_thigh, rl_calf, right_hip_cx, r_thigh, r_knee)
    sub.paste(rl_img, (center_x - r_hpx, hip_y - r_hpy), rl_img)

    # 2. Upper body (Head + Torso as ONE complete piece, smoothly rotated by body_lean around hips)
    ub_c = Image.new('RGBA', (sub_w, sub_h), (0, 0, 0, 0))
    ub_top_x = center_x - hw // 2
    ub_top_y = hip_y - 800
    ub_c.paste(upper_body, (ub_top_x, ub_top_y), upper_body)
    if body_lean != 0:
        ub_c = ub_c.rotate(-body_lean, center=(center_x, hip_y), resample=Image.Resampling.BICUBIC)
    sub.paste(ub_c, (0, 0), ub_c)

    # 3. Left leg (front)
    ll_img, l_hpx, l_hpy = build_leg(ll_thigh, ll_calf, left_hip_cx, l_thigh, l_knee)
    sub.paste(ll_img, (center_x - l_hpx, hip_y - l_hpy), ll_img)

    # Scale down to pixel frame 48x56
    scaled_w = max(1, int(sub_w * scale))
    scaled_h = max(1, int(sub_h * scale))
    scaled_sub = sub.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    foot_scaled_y = int((800 + 578) * scale)
    paste_x = (FW - scaled_w) // 2
    paste_y = GROUND_Y - foot_scaled_y

    frame.paste(scaled_sub, (paste_x, paste_y), scaled_sub)

    # Squash / Stretch
    if squash_y != 1.0 or stretch_x != 1.0:
        new_w = max(1, int(FW * stretch_x))
        new_h = max(1, int(FH * squash_y))
        rescaled = frame.resize((new_w, new_h), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
        px = (FW - new_w) // 2
        py = GROUND_Y - int(GROUND_Y * squash_y)
        frame.paste(rescaled, (px, py), rescaled)

    # Slash / Sonic FX if attack or special
    if fx_type == 'attack':
        draw = ImageDraw.Draw(frame)
        arc_cx = FW // 2 + 8
        arc_cy = GROUND_Y - 24
        if fx_phase == 1:
            draw.arc([arc_cx - 4, arc_cy - 12, arc_cx + 14, arc_cy + 12], 260, 40, fill=(0, 240, 255, 200), width=2)
        elif fx_phase == 2:
            draw.arc([arc_cx - 8, arc_cy - 16, arc_cx + 18, arc_cy + 16], 240, 60, fill=(255, 255, 255, 255), width=3)
            draw.arc([arc_cx - 9, arc_cy - 17, arc_cx + 19, arc_cy + 17], 240, 60, fill=(0, 240, 255, 180), width=1)
        elif fx_phase == 3:
            draw.arc([arc_cx - 6, arc_cy - 18, arc_cx + 20, arc_cy + 18], 220, 80, fill=(0, 240, 255, 130), width=2)
            draw.point((arc_cx + 14, arc_cy - 8), fill=(0, 255, 255, 220))
            draw.point((arc_cx + 16, arc_cy + 4), fill=(255, 255, 255, 220))

    elif fx_type == 'special':
        draw = ImageDraw.Draw(frame)
        head_y_p = GROUND_Y - 41
        ring_r = int(6 + fx_phase * 6)
        ring_box = [FW // 2 - ring_r, head_y_p - ring_r, FW // 2 + ring_r, head_y_p + ring_r]
        draw.ellipse(ring_box, outline=(0, 240, 255, max(40, 220 - fx_phase * 40)), width=1)
        note_y = head_y_p - 8 - fx_phase * 3
        draw.point((FW // 2 + 8, note_y), fill=(0, 240, 255, 240))
        draw.point((FW // 2 - 9, note_y + 4), fill=(0, 240, 255, 200))

    return frame

animations = {
    'idle': [],
    'walk': [],
    'run': [],
    'jump': [],
    'attack': [],
    'special': []
}

# 1. IDLE (CAŁKOWICIE STABILNY POSTÓJ - zero skakania, zero ruchu, postać stoi w miejscu!)
f_idle = compose_frame()
for _ in range(6):
    animations['idle'].append(f_idle.copy())

# 2. WALK (Naturalny krok bez podskakiwania)
walk_params = [
    {'l_thigh': 14, 'l_knee': 8, 'r_thigh': -14, 'r_knee': 16},
    {'l_thigh': 7, 'l_knee': 4, 'r_thigh': -7, 'r_knee': 10},
    {'l_thigh': -2, 'l_knee': 10, 'r_thigh': 8, 'r_knee': 14},
    {'l_thigh': -14, 'l_knee': 16, 'r_thigh': 14, 'r_knee': 8},
    {'l_thigh': -7, 'l_knee': 10, 'r_thigh': 7, 'r_knee': 4},
    {'l_thigh': 8, 'l_knee': 14, 'r_thigh': -2, 'r_knee': 10},
]
for p in walk_params:
    animations['walk'].append(compose_frame(**p))

# 3. RUN (Pochylenie całej sylwetki o 7.5 stopnia, dynamiczne uginanie kolan)
run_params = [
    {'body_lean': 7.5, 'l_thigh': 28, 'l_knee': 36, 'r_thigh': -22, 'r_knee': 46},
    {'body_lean': 7.5, 'l_thigh': 16, 'l_knee': 15, 'r_thigh': -10, 'r_knee': 30},
    {'body_lean': 7.5, 'l_thigh': -4, 'l_knee': 10, 'r_thigh': 14, 'r_knee': 24},
    {'body_lean': 7.5, 'l_thigh': -22, 'l_knee': 46, 'r_thigh': 28, 'r_knee': 36},
    {'body_lean': 7.5, 'l_thigh': -10, 'l_knee': 30, 'r_thigh': 16, 'r_knee': 15},
    {'body_lean': 7.5, 'l_thigh': 14, 'l_knee': 24, 'r_thigh': -4, 'r_knee': 10},
]
for p in run_params:
    animations['run'].append(compose_frame(**p))

# 4. JUMP (Naturalne ugięcie nóg: wybicie, szczyt z podkurczonymi nogami, opadanie, lądowanie)
jump_params = [
    {'body_lean': 3, 'l_thigh': 26, 'l_knee': 38, 'r_thigh': -12, 'r_knee': 24},
    {'body_lean': 2, 'l_thigh': 32, 'l_knee': 58, 'r_thigh': 20, 'r_knee': 50},
    {'body_lean': 0, 'l_thigh': -4, 'l_knee': 12, 'r_thigh': 6, 'r_knee': 16},
    {'squash_y': 0.90, 'stretch_x': 1.05, 'l_thigh': 12, 'l_knee': 28, 'r_thigh': -12, 'r_knee': 28},
]
for p in jump_params:
    animations['jump'].append(compose_frame(**p))

# 5. ATTACK (5 frames)
attack_params = [
    {'body_lean': 0, 'l_thigh': -6, 'l_knee': 12, 'r_thigh': 6, 'r_knee': 12},
    {'body_lean': 6, 'l_thigh': 16, 'l_knee': 18, 'r_thigh': -12, 'r_knee': 20, 'fx_type': 'attack', 'fx_phase': 1},
    {'body_lean': 8, 'l_thigh': 20, 'l_knee': 22, 'r_thigh': -16, 'r_knee': 24, 'fx_type': 'attack', 'fx_phase': 2},
    {'body_lean': 5, 'l_thigh': 10, 'l_knee': 14, 'r_thigh': -8, 'r_knee': 14, 'fx_type': 'attack', 'fx_phase': 3},
    {'body_lean': 0, 'l_thigh': 2, 'l_knee': 8, 'r_thigh': -2, 'r_knee': 8},
]
for p in attack_params:
    animations['attack'].append(compose_frame(**p))

# 6. SPECIAL (5 frames)
special_params = [
    {'fx_type': 'special', 'fx_phase': 0},
    {'fx_type': 'special', 'fx_phase': 1},
    {'fx_type': 'special', 'fx_phase': 2},
    {'fx_type': 'special', 'fx_phase': 3},
    {'fx_type': 'special', 'fx_phase': 4},
]
for p in special_params:
    animations['special'].append(compose_frame(**p))

print("All perfected animations generated!")

# Encode to Base64 JSON
b64_animations = {}
for anim_name, frames in animations.items():
    b64_animations[anim_name] = []
    for f in frames:
        buf = BytesIO()
        f.save(buf, format='PNG', optimize=True)
        b64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
        b64_animations[anim_name].append(b64)

with open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/hero_hd_data.js', 'w', encoding='utf-8') as f:
    f.write('const HD_HERO_ANIMATIONS = ' + json.dumps(b64_animations) + ';\n')

# Replace in index.html
html_path = 'c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

import re
replacement = 'const HD_HERO_ANIMATIONS = ' + json.dumps(b64_animations) + ';'
html = re.sub(r'const HD_HERO_ANIMATIONS = \{[\s\S]*?\};', replacement, html, count=1)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: index.html updated with perfected animations!")
