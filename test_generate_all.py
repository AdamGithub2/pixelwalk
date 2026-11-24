import os
import math
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
    # Unrotated neck is at (center_x, t_y)
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
    # Base height is ~46px out of 1378 -> scale = 46.0 / 1378.0
    scaled_w = max(1, int(sub_w * scale))
    scaled_h = max(1, int(sub_h * scale))
    scaled_sub = sub.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    # Place in 48x56 frame
    frame = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    # Unrotated unshifted character base foot is at hip_y + 578 = 1358
    # In scaled coords, that foot level is 1358 * scale
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
    ear_x_l = FW // 2 - 5 + int(torso_dx * scale)
    ear_x_r = FW // 2 + 5 + int(torso_dx * scale)
    head_y_p = GROUND_Y - 41 + int((head_dy + torso_dy) * scale)
    glow_a = 240 if fx_type == 'special' else 150
    draw.ellipse([ear_x_l - 1, head_y_p - 1, ear_x_l + 1, head_y_p + 1], fill=(0, 240, 255, glow_a))
    draw.ellipse([ear_x_r - 1, head_y_p - 1, ear_x_r + 1, head_y_p + 1], fill=(0, 240, 255, glow_a))

    return frame

print('compose_articulated_frame defined!')
