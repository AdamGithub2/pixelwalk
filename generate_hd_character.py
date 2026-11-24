import os
import math
import base64
import json
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# Load tight high-res hero
hero = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/hero_tight.png').convert('RGBA')
hw, hh = hero.size

# Frame dimensions: 48 x 56 px
FW, FH = 48, 56
GROUND_Y = 52 # feet touch ground at Y=52 inside frame
BASE_H = 46   # character height ~46px
scale = BASE_H / float(hh)
BASE_W = int(hw * scale) # ~15px

# Extract native parts
head_orig = hero.crop((0, 0, hw, 380))
torso_orig = hero.crop((0, 360, hw, 820))
legs_orig = hero.crop((0, 800, hw, hh))

# Split legs
l_arr = np.array(legs_orig)
r_arr = np.array(legs_orig)
mid = hw // 2
l_arr[:, mid:] = 0
r_arr[:, :mid] = 0
left_leg_orig = Image.fromarray(l_arr)
right_leg_orig = Image.fromarray(r_arr)

# Scaled base parts
def get_scaled_parts():
    h_w = int(head_orig.width * scale)
    h_h = int(head_orig.height * scale)
    t_w = int(torso_orig.width * scale)
    t_h = int(torso_orig.height * scale)
    ll_w = int(left_leg_orig.width * scale)
    ll_h = int(left_leg_orig.height * scale)
    rl_w = int(right_leg_orig.width * scale)
    rl_h = int(right_leg_orig.height * scale)

    return {
        'head': head_orig.resize((h_w, h_h), Image.Resampling.LANCZOS),
        'torso': torso_orig.resize((t_w, t_h), Image.Resampling.LANCZOS),
        'left_leg': left_leg_orig.resize((ll_w, ll_h), Image.Resampling.LANCZOS),
        'right_leg': right_leg_orig.resize((rl_w, rl_h), Image.Resampling.LANCZOS),
        'full': hero.resize((BASE_W, BASE_H), Image.Resampling.LANCZOS)
    }

parts = get_scaled_parts()
print(f"Base scaled parts ready: full size = {parts['full'].size}")

# Helper: transform image (scale, rotate, shift)
def compose_frame(head_dy=0, torso_dy=0, l_leg_rot=0, r_leg_rot=0, l_leg_dy=0, r_leg_dy=0,
                  body_rot=0, squash_y=1.0, stretch_x=1.0, fx_type=None, fx_phase=0):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    center_x = FW // 2

    # If full body rotation/lean
    # We assemble onto a sub-canvas then paste
    sub = Image.new('RGBA', (FW * 2, FH * 2), (0, 0, 0, 0))
    sub_cx = FW
    sub_gy = FH + GROUND_Y

    # Leg anchors: top of legs is at torso bottom
    leg_top_y = sub_gy - parts['left_leg'].height + torso_dy

    # Right leg (back)
    rl = parts['right_leg']
    if r_leg_rot != 0:
        rl = rl.rotate(r_leg_rot, resample=Image.Resampling.BICUBIC, expand=True)
    rl_x = sub_cx - parts['full'].width // 2
    rl_y = leg_top_y + r_leg_dy
    sub.paste(rl, (rl_x, rl_y), rl)

    # Torso + Backpack
    t = parts['torso']
    t_x = sub_cx - parts['full'].width // 2
    t_y = leg_top_y - t.height + 4 + torso_dy
    sub.paste(t, (t_x, t_y), t)

    # Left leg (front)
    ll = parts['left_leg']
    if l_leg_rot != 0:
        ll = ll.rotate(l_leg_rot, resample=Image.Resampling.BICUBIC, expand=True)
    ll_x = sub_cx - parts['full'].width // 2
    ll_y = leg_top_y + l_leg_dy
    sub.paste(ll, (ll_x, ll_y), ll)

    # Head + Headphones
    h = parts['head']
    h_x = sub_cx - parts['full'].width // 2
    h_y = t_y - h.height + 3 + head_dy
    sub.paste(h, (h_x, h_y), h)

    # Crop sub back to FW x FH around sub_cx, sub_gy
    crop_x1 = sub_cx - FW // 2
    crop_y1 = sub_gy - GROUND_Y
    frame = sub.crop((crop_x1, crop_y1, crop_x1 + FW, crop_y1 + FH))

    # Apply Squash / Stretch if any
    if squash_y != 1.0 or stretch_x != 1.0:
        new_w = max(1, int(FW * stretch_x))
        new_h = max(1, int(FH * squash_y))
        rescaled = frame.resize((new_w, new_h), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
        paste_x = (FW - new_w) // 2
        paste_y = GROUND_Y - int((GROUND_Y) * squash_y)
        frame.paste(rescaled, (paste_x, paste_y), rescaled)

    # Apply FX overlay (Neon Cyan Headphones pulse, energy blade, cyber notes)
    draw = ImageDraw.Draw(frame)

    # Cyan headphone glow (at head ear positions)
    head_actual_y = h_y - crop_y1 + 14
    ear_x_left = center_x - 5
    ear_x_right = center_x + 5
    glow_alpha = 140
    if fx_type == 'special':
        glow_alpha = 240
    draw.ellipse([ear_x_left - 1, head_actual_y - 1, ear_x_left + 1, head_actual_y + 1], fill=(0, 240, 255, glow_alpha))
    draw.ellipse([ear_x_right - 1, head_actual_y - 1, ear_x_right + 1, head_actual_y + 1], fill=(0, 240, 255, glow_alpha))

    if fx_type == 'attack':
        # Crescent Neon Cyan Slash Arc
        arc_cx = center_x + 8
        arc_cy = GROUND_Y - 24
        if fx_phase == 1:
            draw.arc([arc_cx - 4, arc_cy - 12, arc_cx + 14, arc_cy + 12], 260, 40, fill=(0, 240, 255, 200), width=2)
        elif fx_phase == 2:
            draw.arc([arc_cx - 8, arc_cy - 16, arc_cx + 18, arc_cy + 16], 240, 60, fill=(255, 255, 255, 255), width=3)
            draw.arc([arc_cx - 9, arc_cy - 17, arc_cx + 19, arc_cy + 17], 240, 60, fill=(0, 240, 255, 180), width=1)
        elif fx_phase == 3:
            draw.arc([arc_cx - 6, arc_cy - 18, arc_cx + 20, arc_cy + 18], 220, 80, fill=(0, 240, 255, 130), width=2)
            # Sparks
            draw.point((arc_cx + 14, arc_cy - 8), fill=(0, 255, 255, 220))
            draw.point((arc_cx + 16, arc_cy + 4), fill=(255, 255, 255, 220))

    elif fx_type == 'special':
        # Concentric sonic rings & cyber aura
        ring_r = int(6 + fx_phase * 6)
        ring_box = [center_x - ring_r, head_actual_y - ring_r, center_x + ring_r, head_actual_y + ring_r]
        draw.ellipse(ring_box, outline=(0, 240, 255, max(40, 220 - fx_phase * 40)), width=1)
        # Cyber sparkle notes
        note_y = head_actual_y - 8 - fx_phase * 3
        draw.point((center_x + 8, note_y), fill=(0, 240, 255, 240))
        draw.point((center_x - 9, note_y + 4), fill=(0, 240, 255, 200))

    return frame

print("Helper compose_frame compiled!")

animations = {
    'idle': [],
    'walk': [],
    'run': [],
    'jump': [],
    'attack': [],
    'special': []
}

# 1. IDLE (6 frames, breathing, subtle bounce, blinking, cyan headphone glow)
idle_params = [
    {'head_dy': 0, 'torso_dy': 0, 'squash_y': 1.0, 'stretch_x': 1.0},
    {'head_dy': -1, 'torso_dy': -1, 'squash_y': 1.01, 'stretch_x': 0.99},
    {'head_dy': -2, 'torso_dy': -2, 'squash_y': 1.02, 'stretch_x': 0.98},
    {'head_dy': -1, 'torso_dy': -1, 'squash_y': 1.01, 'stretch_x': 0.99},
    {'head_dy': 0, 'torso_dy': 0, 'squash_y': 1.0, 'stretch_x': 1.0},
    {'head_dy': 1, 'torso_dy': 1, 'squash_y': 0.99, 'stretch_x': 1.01},
]
for p in idle_params:
    animations['idle'].append(compose_frame(**p))

# 2. WALK (6 frames, stride, arm swings, bounce)
walk_params = [
    {'head_dy': 0, 'torso_dy': 0, 'l_leg_rot': 12, 'r_leg_rot': -12, 'l_leg_dy': -1, 'r_leg_dy': 0},
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': 6, 'r_leg_rot': -6, 'l_leg_dy': 0, 'r_leg_dy': 0, 'squash_y': 0.98},
    {'head_dy': -1, 'torso_dy': -1, 'l_leg_rot': 0, 'r_leg_rot': 4, 'l_leg_dy': -2, 'r_leg_dy': 0, 'squash_y': 1.02},
    {'head_dy': 0, 'torso_dy': 0, 'l_leg_rot': -12, 'r_leg_rot': 12, 'l_leg_dy': 0, 'r_leg_dy': -1},
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': -6, 'r_leg_rot': 6, 'l_leg_dy': 0, 'r_leg_dy': 0, 'squash_y': 0.98},
    {'head_dy': -1, 'torso_dy': -1, 'l_leg_rot': 4, 'r_leg_rot': 0, 'l_leg_dy': 0, 'r_leg_dy': -2, 'squash_y': 1.02},
]
for p in walk_params:
    animations['walk'].append(compose_frame(**p))

# 3. RUN (6 frames, forward lean, high knees, dynamic stride)
run_params = [
    {'head_dy': -1, 'torso_dy': -1, 'l_leg_rot': 24, 'r_leg_rot': -20, 'l_leg_dy': -3, 'r_leg_dy': 1, 'stretch_x': 1.02},
    {'head_dy': -3, 'torso_dy': -3, 'l_leg_rot': 12, 'r_leg_rot': -10, 'l_leg_dy': -4, 'r_leg_dy': -2, 'squash_y': 1.03},
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': 2, 'r_leg_rot': 8, 'l_leg_dy': 0, 'r_leg_dy': 0, 'squash_y': 0.96},
    {'head_dy': -1, 'torso_dy': -1, 'l_leg_rot': -20, 'r_leg_rot': 24, 'l_leg_dy': 1, 'r_leg_dy': -3, 'stretch_x': 1.02},
    {'head_dy': -3, 'torso_dy': -3, 'l_leg_rot': -10, 'r_leg_rot': 12, 'l_leg_dy': -2, 'r_leg_dy': -4, 'squash_y': 1.03},
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': 8, 'r_leg_rot': 2, 'l_leg_dy': 0, 'r_leg_dy': 0, 'squash_y': 0.96},
]
for p in run_params:
    animations['run'].append(compose_frame(**p))

# 4. JUMP (4 frames, anticipation, launch, apex, descent)
jump_params = [
    {'head_dy': 3, 'torso_dy': 3, 'squash_y': 0.88, 'stretch_x': 1.08},
    {'head_dy': -4, 'torso_dy': -4, 'l_leg_dy': 1, 'r_leg_dy': 1, 'squash_y': 1.08, 'stretch_x': 0.94},
    {'head_dy': -6, 'torso_dy': -6, 'l_leg_rot': 8, 'r_leg_rot': -8, 'l_leg_dy': -3, 'r_leg_dy': -3, 'squash_y': 1.0},
    {'head_dy': -2, 'torso_dy': -2, 'l_leg_rot': -4, 'r_leg_rot': 4, 'l_leg_dy': 1, 'r_leg_dy': 1, 'squash_y': 1.04},
]
for p in jump_params:
    animations['jump'].append(compose_frame(**p))

# 5. ATTACK (5 frames, coil, lunge, crescent slash arc, spark burst, recovery)
attack_params = [
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': -6, 'r_leg_rot': 6, 'fx_type': 'attack', 'fx_phase': 0},
    {'head_dy': 0, 'torso_dy': 0, 'l_leg_rot': 14, 'r_leg_rot': -10, 'l_leg_dy': -1, 'fx_type': 'attack', 'fx_phase': 1},
    {'head_dy': -1, 'torso_dy': -1, 'l_leg_rot': 18, 'r_leg_rot': -14, 'l_leg_dy': -2, 'fx_type': 'attack', 'fx_phase': 2},
    {'head_dy': 0, 'torso_dy': 0, 'l_leg_rot': 8, 'r_leg_rot': -6, 'fx_type': 'attack', 'fx_phase': 3},
    {'head_dy': 1, 'torso_dy': 1, 'l_leg_rot': 2, 'r_leg_rot': -2, 'fx_type': 'attack', 'fx_phase': 4},
]
for p in attack_params:
    animations['attack'].append(compose_frame(**p))

# 6. SPECIAL (5 frames, channel, sonic ring pulse, resonance blast, aura, settle)
special_params = [
    {'head_dy': 0, 'torso_dy': 0, 'fx_type': 'special', 'fx_phase': 0},
    {'head_dy': -1, 'torso_dy': -1, 'fx_type': 'special', 'fx_phase': 1, 'squash_y': 1.02},
    {'head_dy': -2, 'torso_dy': -2, 'fx_type': 'special', 'fx_phase': 2, 'squash_y': 1.04},
    {'head_dy': -1, 'torso_dy': -1, 'fx_type': 'special', 'fx_phase': 3, 'squash_y': 1.02},
    {'head_dy': 0, 'torso_dy': 0, 'fx_type': 'special', 'fx_phase': 4},
]
for p in special_params:
    animations['special'].append(compose_frame(**p))

print("All animation frames generated!")

# Save preview of each anim
for anim_name, frames in animations.items():
    frames[0].save(f'c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/anim_{anim_name}_f0.png')

# Convert all frames to Base64 JSON
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

print("hero_hd_data.js written successfully! Total animations:", len(b64_animations))
