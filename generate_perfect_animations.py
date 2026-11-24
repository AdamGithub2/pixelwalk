import os
import math
import json
import base64
import sys
from pathlib import Path
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
hero = Image.open(ROOT / 'hero_tight.png').convert('RGBA')
hw, hh = hero.size

FW, FH = 48, 56
GROUND_Y = 51
BASE_H = 46
scale = BASE_H / float(hh)

# Upper body: Head, neck, torso, hoodie, jacket as ONE SOLID UNBROKEN PIECE
upper_body = hero.crop((0, 0, hw, 840))

# The near sleeve and pocketed hand must leave the torso before the arm moves.
attack_body = upper_body.copy()
arm_mask = Image.new('L', attack_body.size)
ImageDraw.Draw(arm_mask).polygon(
    [(80, 345), (139, 358), (179, 449), (174, 532),
     (173, 583), (215, 688), (152, 729), (76, 638), (37, 523)], fill=255)
attack_body.paste((0, 0, 0, 0), (0, 0, hw, 840), arm_mask)
# Fill the jacket behind the removed arm; keep the backpack outside this patch.
ImageDraw.Draw(attack_body).polygon(
    [(130, 365), (180, 395), (204, 565), (221, 690),
     (149, 710), (110, 643), (100, 490)], fill='#393541')


def draw_attack_arm(body, origin, pose):
    """Two connected sleeve segments with a visible closed fist (source pixels)."""
    shoulder = (origin[0] + 123, origin[1] + 387)
    elbow = (shoulder[0] + pose[0], shoulder[1] + pose[1])
    wrist = (elbow[0] + pose[2], elbow[1] + pose[3])
    draw = ImageDraw.Draw(body)

    def segment(a, b, width):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy)
        nx, ny = -dy / length, dx / length
        points = [(a[0] + nx * width, a[1] + ny * width),
                  (b[0] + nx * width * .8, b[1] + ny * width * .8),
                  (b[0] - nx * width * .8, b[1] - ny * width * .8),
                  (a[0] - nx * width, a[1] - ny * width)]
        draw.polygon(points, fill='#181722')
        draw.line([a, b], fill='#48424f', width=int(width * 1.6))
        draw.line([(a[0] - 10, a[1]), (b[0] - 10, b[1])],
                  fill='#5c5360', width=12)

    segment(shoulder, elbow, 48)
    draw.ellipse((elbow[0]-35, elbow[1]-35, elbow[0]+35, elbow[1]+35), fill='#48424f')
    segment(elbow, wrist, 40)
    dx, dy = pose[2], pose[3]
    length = math.hypot(dx, dy)
    ux, uy = dx / length, dy / length
    fist = (wrist[0] + ux * 38, wrist[1] + uy * 38)
    draw.ellipse((wrist[0]-33, wrist[1]-33, wrist[0]+33, wrist[1]+33), fill='#292530')
    draw.ellipse((fist[0]-39, fist[1]-37, fist[0]+39, fist[1]+37),
                 fill='#f0b48c', outline='#392832', width=8)
    draw.line([(fist[0]+5, fist[1]-17), (fist[0]+20, fist[1]-6)], fill='#cf835d', width=7)

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
overlap = 50 # Duży 50px zapas materiału na kolanie zapobiegający jakiemukolwiek rozjeżdżaniu

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

    # 1. Obrót uda wokół biodra (hip_px, hip_py)
    t_c = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    t_c.paste(thigh, (top_x, top_y), thigh)
    t_rot = t_c.rotate(-thigh_rot, center=(hip_px, hip_py), resample=Image.Resampling.BICUBIC)

    # 2. Dokładna, bezbłędna pozycja kolana po rotacji w przestrzeni PIL (kierunek Y w dół)
    rad = math.radians(-thigh_rot)
    dx = 0
    dy = knee_split
    actual_knee_px = round(hip_px + dx * math.cos(rad) + dy * math.sin(rad))
    actual_knee_py = round(hip_py - dx * math.sin(rad) + dy * math.cos(rad))

    # 3. Wklejenie łydki tak, by jej punkt obrotu kolana pokrył się co do piksela z actual_knee
    c_c = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    paste_x = actual_knee_px - hip_cx
    paste_y = actual_knee_py - overlap
    c_c.paste(calf, (paste_x, paste_y), calf)

    # 4. Obrót łydki wokół DOKŁADNIE TEGO SAMEGO punktu kolana
    total_rot = -thigh_rot - knee_bend
    c_rot = c_c.rotate(total_rot, center=(actual_knee_px, actual_knee_py), resample=Image.Resampling.BICUBIC)

    return Image.alpha_composite(t_rot, c_rot), hip_px, hip_py

def compose_frame(
    body_lean=0, bounce_dy=0,
    l_thigh=0, l_knee=0, r_thigh=0, r_knee=0,
    squash_y=1.0, stretch_x=1.0,
    fx_type=None, fx_phase=0, arm_pose=None
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
    source_body = attack_body if arm_pose else upper_body
    ub_c.paste(source_body, (ub_top_x, ub_top_y), source_body)
    if arm_pose:
        draw_attack_arm(ub_c, (ub_top_x, ub_top_y), arm_pose)
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

    # Short speed marks follow the fist rather than suggesting a sword blade.
    if fx_type == 'attack':
        draw = ImageDraw.Draw(frame)
        if fx_phase == 2:
            draw.line([(34, 21), (39, 20)], fill=(200, 225, 245, 170), width=1)
            draw.line([(35, 25), (40, 25)], fill=(200, 225, 245, 130), width=1)

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

# 1. IDLE (Całkowicie stabilny postój, zero ruchu)
f_idle = compose_frame()
for _ in range(6):
    animations['idle'].append(f_idle.copy())

# 2. WALK (Płynny krok z idealnie spójnymi, złączonymi w kolanach nogami)
walk_params = [
    {'l_thigh': 12, 'l_knee': 6, 'r_thigh': -12, 'r_knee': 8},
    {'l_thigh': 6, 'l_knee': 3, 'r_thigh': -6, 'r_knee': 8},
    {'l_thigh': 0, 'l_knee': 2, 'r_thigh': 6, 'r_knee': 10},
    {'l_thigh': -12, 'l_knee': 8, 'r_thigh': 12, 'r_knee': 6},
    {'l_thigh': -6, 'l_knee': 8, 'r_thigh': 6, 'r_knee': 3},
    {'l_thigh': 6, 'l_knee': 10, 'r_thigh': 0, 'r_knee': 2},
]
for p in walk_params:
    animations['walk'].append(compose_frame(**p))

# 3. RUN (Pochylenie w sprincie z idealnie złączonymi w kolanach nogami)
run_params = [
    {'body_lean': 7.0, 'l_thigh': 24, 'l_knee': 20, 'r_thigh': -18, 'r_knee': 26},
    {'body_lean': 7.0, 'l_thigh': 12, 'l_knee': 10, 'r_thigh': -8, 'r_knee': 18},
    {'body_lean': 7.0, 'l_thigh': -4, 'l_knee': 6, 'r_thigh': 14, 'r_knee': 16},
    {'body_lean': 7.0, 'l_thigh': -18, 'l_knee': 26, 'r_thigh': 24, 'r_knee': 20},
    {'body_lean': 7.0, 'l_thigh': -8, 'l_knee': 18, 'r_thigh': 12, 'r_knee': 10},
    {'body_lean': 7.0, 'l_thigh': 14, 'l_knee': 16, 'r_thigh': -4, 'r_knee': 6},
]
for p in run_params:
    animations['run'].append(compose_frame(**p))

# 4. JUMP: one relaxed bent-knee pose throughout flight, then landing.
airborne_pose = {'body_lean': 2, 'l_thigh': 16, 'l_knee': 32,
                 'r_thigh': 12, 'r_knee': 28}
jump_params = [
    airborne_pose, airborne_pose, airborne_pose,
    {'squash_y': 0.90, 'stretch_x': 1.05, 'l_thigh': 10, 'l_knee': 20, 'r_thigh': -10, 'r_knee': 20},
]
for p in jump_params:
    animations['jump'].append(compose_frame(**p))

# 5. ATTACK: wind-up, forward swing, full extension, recoil, hand to pocket.
attack_params = [
    {'body_lean': -3, 'arm_pose': (-90, 135, 85, -125)},
    {'body_lean': 3, 'arm_pose': (50, 90, 140, -155)},
    {'body_lean': 7, 'arm_pose': (195, -35, 185, -20), 'fx_type': 'attack', 'fx_phase': 2},
    {'body_lean': 4, 'arm_pose': (125, 90, 135, -65)},
    {'body_lean': 0},
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

print("All seamless perfected animations generated!")

# Encode to Base64 JSON
b64_animations = {}
for anim_name, frames in animations.items():
    b64_animations[anim_name] = []
    for f in frames:
        buf = BytesIO()
        f.save(buf, format='PNG', optimize=True)
        b64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
        b64_animations[anim_name].append(b64)

# A focused update preserves every other animation byte for byte.
focused_animation = 'jump' if '--jump-only' in sys.argv else 'attack' if '--attack-only' in sys.argv else None
if focused_animation:
    existing = (ROOT / 'hero_hd_data.js').read_text(encoding='utf-8')
    previous = json.loads(existing.split('=', 1)[1].strip().rstrip(';'))
    previous[focused_animation] = b64_animations[focused_animation]
    b64_animations = previous

(ROOT / 'hero_hd_data.js').write_text(
    'const HD_HERO_ANIMATIONS = ' + json.dumps(b64_animations) + ';\n', encoding='utf-8')

import re
html_path = ROOT / 'index.html'
with html_path.open('r', encoding='utf-8', newline='') as f:
    html = f.read()
replacement = 'const HD_HERO_ANIMATIONS = ' + json.dumps(b64_animations) + ';'
html, count = re.subn(r'const HD_HERO_ANIMATIONS = \{[\s\S]*?\};', replacement, html, count=1)
assert count == 1, 'Missing embedded hero animation data'
with html_path.open('w', encoding='utf-8', newline='') as f:
    f.write(html)

print('SUCCESS: hero_hd_data.js and index.html updated')
