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
BASE_W = int(hw * scale)

# Extract parts
head_orig = hero.crop((0, 0, hw, 380))
torso_orig = hero.crop((0, 360, hw, 840)) # overlap with hips
legs_orig = hero.crop((0, 800, hw, hh))

mid = hw // 2
l_arr = np.array(legs_orig)
r_arr = np.array(legs_orig)
l_arr[:, mid:] = 0
r_arr[:, :mid] = 0

ll_orig = Image.fromarray(l_arr)
rl_orig = Image.fromarray(r_arr)

knee_split = 260
overlap = 40

ll_thigh = ll_orig.crop((0, 0, hw, knee_split + overlap))
ll_calf = ll_orig.crop((0, knee_split - overlap, hw, legs_orig.height))

rl_thigh = rl_orig.crop((0, 0, hw, knee_split + overlap))
rl_calf = rl_orig.crop((0, knee_split - overlap, hw, legs_orig.height))

def build_leg(thigh, calf, hip_cx, thigh_rot=0, knee_bend=0):
    cw, ch = hw * 2, int(legs_orig.height * 1.5)
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

def compose_articulated_frame(
    head_dy=0, torso_dy=0, body_lean=0, torso_dx=0,
    l_thigh=0, l_knee=0, r_thigh=0, r_knee=0,
    squash_y=1.0, stretch_x=1.0, fx_type=None, fx_phase=0
):
    sub_w, sub_h = 1000, 1600
    sub = Image.new('RGBA', (sub_w, sub_h), (0, 0, 0, 0))
    center_x = sub_w // 2
    hip_y = 780 + torso_dy

    left_hip_cx = 115
    right_hip_cx = 345

    # 1. Right leg (back)
    rl_img, r_hpx, r_hpy = build_leg(rl_thigh, rl_calf, right_hip_cx, r_thigh, r_knee)
    sub.paste(rl_img, (center_x - r_hpx, hip_y - r_hpy), rl_img)

    # 2. Torso (with body lean)
    t_c = Image.new('RGBA', (sub_w, sub_h), (0, 0, 0, 0))
    t_x = center_x - hw // 2 + torso_dx
    t_y = hip_y - (800 - 360)
    t_c.paste(torso_orig, (t_x, t_y), torso_orig)
    if body_lean != 0:
        # Lean forward: rotate torso around hips (center_x, hip_y)
        t_c = t_c.rotate(-body_lean, center=(center_x, hip_y), resample=Image.Resampling.BICUBIC)
    sub.paste(t_c, (0, 0), t_c)

    # 3. Left leg (front)
    ll_img, l_hpx, l_hpy = build_leg(ll_thigh, ll_calf, left_hip_cx, l_thigh, l_knee)
    sub.paste(ll_img, (center_x - l_hpx, hip_y - l_hpy), ll_img)

    # 4. Head (follows torso top / neck)
    neck_x = center_x + torso_dx
    neck_y = t_y + 10
    if body_lean != 0:
        rad = math.radians(-body_lean)
        dx = neck_x - center_x
        dy = neck_y - hip_y
        neck_x = center_x + dx * math.cos(rad) - dy * math.sin(rad)
        neck_y = hip_y + dx * math.sin(rad) + dy * math.cos(rad)

    h_c = Image.new('RGBA', (sub_w, sub_h), (0, 0, 0, 0))
    h_x = int(neck_x - hw // 2)
    h_y = int(neck_y - head_orig.height + 25 + head_dy)
    h_c.paste(head_orig, (h_x, h_y), head_orig)
    if body_lean != 0:
        h_c = h_c.rotate(-body_lean, center=(int(neck_x), int(neck_y)), resample=Image.Resampling.BICUBIC)
    sub.paste(h_c, (0, 0), h_c)

    # Scale down to pixel frame 48x56
    scaled_w = max(1, int(sub_w * scale))
    scaled_h = max(1, int(sub_h * scale))
    scaled_sub = sub.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    # Place in 48x56 frame
    frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    foot_scaled_y = int((780 + 578) * scale)
    paste_x = (FW - scaled_w) // 2
    paste_y = GROUND_Y - foot_scaled_y

    frame.paste(scaled_sub, (paste_x, paste_y), scaled_sub)

    # Apply Squash / Stretch if needed
    if squash_y != 1.0 or stretch_x != 1.0:
        new_w = max(1, int(FW * stretch_x))
        new_h = max(1, int(FH * squash_y))
        rescaled = frame.resize((new_w, new_h), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
        px = (FW - new_w) // 2
        py = GROUND_Y - int(GROUND_Y * squash_y)
        frame.paste(rescaled, (px, py), rescaled)

    # FX & Glowing Headphones
    draw = ImageDraw.Draw(frame)
    ear_x_l = FW // 2 - 5 + int(torso_dx * scale) + (1 if body_lean > 0 else 0)
    ear_x_r = FW // 2 + 5 + int(torso_dx * scale) + (1 if body_lean > 0 else 0)
    head_y_p = GROUND_Y - 41 + int((head_dy + torso_dy) * scale)
    glow_a = 240 if fx_type == 'special' else 150
    draw.ellipse([ear_x_l - 1, head_y_p - 1, ear_x_l + 1, head_y_p + 1], fill=(0, 240, 255, glow_a))
    draw.ellipse([ear_x_r - 1, head_y_p - 1, ear_x_r + 1, head_y_p + 1], fill=(0, 240, 255, glow_a))

    if fx_type == 'attack':
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

# 1. IDLE (6 frames, breathing, subtle bounce, blinking)
idle_params = [
    {'head_dy': 0, 'torso_dy': 0, 'squash_y': 1.0, 'stretch_x': 1.0},
    {'head_dy': -30, 'torso_dy': -30, 'squash_y': 1.01, 'stretch_x': 0.99},
    {'head_dy': -60, 'torso_dy': -60, 'squash_y': 1.02, 'stretch_x': 0.98},
    {'head_dy': -30, 'torso_dy': -30, 'squash_y': 1.01, 'stretch_x': 0.99},
    {'head_dy': 0, 'torso_dy': 0, 'squash_y': 1.0, 'stretch_x': 1.0},
    {'head_dy': 30, 'torso_dy': 30, 'squash_y': 0.99, 'stretch_x': 1.01},
]
for p in idle_params:
    animations['idle'].append(compose_articulated_frame(**p))

# 2. WALK (6 frames, fluid natural stride, subtle knee flex)
walk_params = [
    {'head_dy': 0, 'torso_dy': 0, 'l_thigh': 16, 'l_knee': 10, 'r_thigh': -16, 'r_knee': 20},
    {'head_dy': 25, 'torso_dy': 25, 'l_thigh': 8, 'l_knee': 5, 'r_thigh': -8, 'r_knee': 15, 'squash_y': 0.98},
    {'head_dy': -25, 'torso_dy': -25, 'l_thigh': -4, 'l_knee': 15, 'r_thigh': 10, 'r_knee': 20, 'squash_y': 1.02},
    {'head_dy': 0, 'torso_dy': 0, 'l_thigh': -16, 'l_knee': 20, 'r_thigh': 16, 'r_knee': 10},
    {'head_dy': 25, 'torso_dy': 25, 'l_thigh': -8, 'l_knee': 15, 'r_thigh': 8, 'r_knee': 5, 'squash_y': 0.98},
    {'head_dy': -25, 'torso_dy': -25, 'l_thigh': 10, 'l_knee': 20, 'r_thigh': -4, 'r_knee': 15, 'squash_y': 1.02},
]
for p in walk_params:
    animations['walk'].append(compose_articulated_frame(**p))

# 3. RUN (6 frames, athletic forward body lean ~13 deg, dynamic knee bending)
run_params = [
    # Frame 0: Right leg push-off, Left leg drives forward with high bent knee
    {'head_dy': -30, 'torso_dy': -30, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': 36, 'l_knee': 42, 'r_thigh': -28, 'r_knee': 52},
    # Frame 1: Left foot extending towards ground, right knee swinging forward
    {'head_dy': 0, 'torso_dy': 0, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': 22, 'l_knee': 16, 'r_thigh': -14, 'r_knee': 36},
    # Frame 2: Left leg under torso, right leg knee driving up
    {'head_dy': -20, 'torso_dy': -20, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': -6, 'l_knee': 12, 'r_thigh': 18, 'r_knee': 32},
    # Frame 3: Left leg push-off, Right leg drives forward with high bent knee
    {'head_dy': -30, 'torso_dy': -30, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': -28, 'l_knee': 52, 'r_thigh': 36, 'r_knee': 42},
    # Frame 4: Right foot extending towards ground, left knee swinging forward
    {'head_dy': 0, 'torso_dy': 0, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': -14, 'l_knee': 36, 'r_thigh': 22, 'r_knee': 16},
    # Frame 5: Right leg under torso, left leg knee driving up
    {'head_dy': -20, 'torso_dy': -20, 'body_lean': 13, 'torso_dx': 40, 'l_thigh': 18, 'l_knee': 32, 'r_thigh': -6, 'r_knee': 12},
]
for p in run_params:
    animations['run'].append(compose_articulated_frame(**p))

# 4. JUMP (4 frames: 0: Launch/rising, 1: Apex tucked knees, 2: Falling legs down, 3: Landing deep bend squash)
jump_params = [
    # Frame 0 (Rising / Wznoszenie, vy < -1.5): dynamic takeoff, lead knee lifted high and bent forward
    {'head_dy': -40, 'torso_dy': -40, 'body_lean': 6, 'torso_dx': 15, 'l_thigh': 32, 'l_knee': 45, 'r_thigh': -16, 'r_knee': 30, 'squash_y': 1.04},
    # Frame 1 (Apex / Szczyt skoku, -1.5 <= vy <= 1.5): athletic tucked mid-air pose! Both knees bent up towards chest!
    {'head_dy': -60, 'torso_dy': -60, 'body_lean': 4, 'torso_dx': 10, 'l_thigh': 36, 'l_knee': 62, 'r_thigh': 22, 'r_knee': 55, 'squash_y': 1.0},
    # Frame 2 (Falling / Opadanie, vy > 1.5): legs extending downwards preparing for touchdown, knees loose
    {'head_dy': -10, 'torso_dy': -10, 'body_lean': 0, 'torso_dx': 0, 'l_thigh': -4, 'l_knee': 15, 'r_thigh': 8, 'r_knee': 20, 'squash_y': 1.02},
    # Frame 3 (Landing / Lądowanie): deep impact cushion squat on the deck! Knees bent wide, squash
    {'head_dy': 80, 'torso_dy': 80, 'body_lean': 5, 'torso_dx': 10, 'l_thigh': 16, 'l_knee': 36, 'r_thigh': -16, 'r_knee': 36, 'squash_y': 0.88, 'stretch_x': 1.06},
]
for p in jump_params:
    animations['jump'].append(compose_articulated_frame(**p))

# 5. ATTACK (5 frames)
attack_params = [
    {'head_dy': 20, 'torso_dy': 20, 'l_thigh': -8, 'l_knee': 15, 'r_thigh': 8, 'r_knee': 15, 'fx_type': 'attack', 'fx_phase': 0},
    {'head_dy': 0, 'torso_dy': 0, 'body_lean': 10, 'torso_dx': 30, 'l_thigh': 18, 'l_knee': 20, 'r_thigh': -14, 'r_knee': 25, 'fx_type': 'attack', 'fx_phase': 1},
    {'head_dy': -20, 'torso_dy': -20, 'body_lean': 14, 'torso_dx': 40, 'l_thigh': 24, 'l_knee': 25, 'r_thigh': -20, 'r_knee': 30, 'fx_type': 'attack', 'fx_phase': 2},
    {'head_dy': 0, 'torso_dy': 0, 'body_lean': 8, 'torso_dx': 20, 'l_thigh': 12, 'l_knee': 15, 'r_thigh': -10, 'r_knee': 15, 'fx_type': 'attack', 'fx_phase': 3},
    {'head_dy': 20, 'torso_dy': 20, 'l_thigh': 4, 'l_knee': 10, 'r_thigh': -4, 'r_knee': 10, 'fx_type': 'attack', 'fx_phase': 4},
]
for p in attack_params:
    animations['attack'].append(compose_articulated_frame(**p))

# 6. SPECIAL (5 frames)
special_params = [
    {'head_dy': 0, 'torso_dy': 0, 'fx_type': 'special', 'fx_phase': 0},
    {'head_dy': -25, 'torso_dy': -25, 'fx_type': 'special', 'fx_phase': 1, 'squash_y': 1.02},
    {'head_dy': -50, 'torso_dy': -50, 'fx_type': 'special', 'fx_phase': 2, 'squash_y': 1.04},
    {'head_dy': -25, 'torso_dy': -25, 'fx_type': 'special', 'fx_phase': 3, 'squash_y': 1.02},
    {'head_dy': 0, 'torso_dy': 0, 'fx_type': 'special', 'fx_phase': 4},
]
for p in special_params:
    animations['special'].append(compose_articulated_frame(**p))

print("All animations generated!")

# Convert to Base64 JSON
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

print("hero_hd_data.js written!")

# Now update index.html
html_path = 'c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

import re
replacement = 'const HD_HERO_ANIMATIONS = ' + json.dumps(b64_animations) + ';'
html = re.sub(r'const HD_HERO_ANIMATIONS = \{[\s\S]*?\};', replacement, html, count=1)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("index.html updated with new HD_HERO_ANIMATIONS!")
