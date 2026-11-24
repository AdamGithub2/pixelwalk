import os
import math
import numpy as np
from PIL import Image, ImageDraw

hero = Image.open('c:/Aplikacje/Komponenty JS imponujace/pixel_animacja/hero_tight.png').convert('RGBA')
hw, hh = hero.size

# Frame dimensions: 48 x 56 px
FW, FH = 48, 56
GROUND_Y = 51 # feet touch ground at Y=51 inside frame
BASE_H = 46   # character height ~46px
scale = BASE_H / float(hh)
BASE_W = int(hw * scale)

# Extract native parts
head_orig = hero.crop((0, 0, hw, 380))
torso_orig = hero.crop((0, 360, hw, 840)) # generous overlap down past hips
legs_orig = hero.crop((0, 800, hw, hh))

mid = hw // 2
l_arr = np.array(legs_orig)
r_arr = np.array(legs_orig)
l_arr[:, mid:] = 0
r_arr[:, :mid] = 0
left_leg_orig = Image.fromarray(l_arr)
right_leg_orig = Image.fromarray(r_arr)

# Split legs into thigh and calf
# Legs height is 578. Knee is around 260.
knee_split = 260
overlap = 35

ll_thigh_orig = left_leg_orig.crop((0, 0, hw, knee_split + overlap))
ll_calf_orig = left_leg_orig.crop((0, knee_split - overlap, hw, legs_orig.height))

rl_thigh_orig = right_leg_orig.crop((0, 0, hw, knee_split + overlap))
rl_calf_orig = right_leg_orig.crop((0, knee_split - overlap, hw, legs_orig.height))

def render_leg(is_left, thigh_angle=0, knee_bend=0, hip_dx=0, hip_dy=0):
    """
    Renders an articulated leg into a canvas of size (hw, legs_orig.height).
    thigh_angle: rotation of the thigh around hip (degrees, positive = forward/counter-clockwise in screen coordinates)
    knee_bend: rotation of calf relative to thigh (degrees, positive = bent back/up)
    """
    thigh = ll_thigh_orig if is_left else rl_thigh_orig
    calf = ll_calf_orig if is_left else rl_calf_orig

    leg_canvas = Image.new('RGBA', (hw * 2, int(legs_orig.height * 1.5)), (0, 0, 0, 0))
    hip_x = hw // 2 + (mid // 2 if not is_left else -mid // 2) + hw // 2
    hip_y = 30 # slight margin

    # Thigh pivot is hip
    t_w, t_h = thigh.size
    # Place thigh onto intermediate
    t_canvas = Image.new('RGBA', leg_canvas.size, (0, 0, 0, 0))
    t_top_left_x = hw // 2
    t_top_left_y = hip_y
    t_canvas.paste(thigh, (t_top_left_x, t_top_left_y), thigh)

    # Rotate thigh around hip
    # Screen coord rotation in PIL: positive angle is counter-clockwise.
    # We want positive angle to swing leg forward (to the right in 2D profile / screen).
    # Since character faces right, forward = right = negative rotation in standard math, or positive if clockwise.
    # In PIL rotate: positive angle is counter-clockwise (swings to the left).
    # So forward swing (to right) is -thigh_angle.
    t_rot = t_canvas.rotate(-thigh_angle, center=(hip_x, hip_y), resample=Image.Resampling.BICUBIC)

    # Calculate actual knee position after thigh rotation
    # Unrotated knee is at (hip_x, hip_y + knee_split)
    thigh_rad = math.radians(-thigh_angle)
    dx = 0
    dy = knee_split
    rot_dx = dx * math.cos(thigh_rad) - dy * math.sin(thigh_rad)
    rot_dy = dx * math.sin(thigh_rad) + dy * math.cos(thigh_rad)
    actual_knee_x = hip_x + rot_dx
    actual_knee_y = hip_y + rot_dy

    # Calf rotation
    # Calf pivot is knee
    total_calf_angle = -thigh_angle - knee_bend
    c_canvas = Image.new('RGBA', leg_canvas.size, (0, 0, 0, 0))
    # In original calf, knee is at y = overlap inside calf
    c_top_left_x = hw // 2
    c_top_left_y = int(actual_knee_y - overlap)
    # Paste calf shifted so its knee aligns with actual_knee
    c_canvas.paste(calf, (int(actual_knee_x - (hip_x - t_top_left_x)), int(actual_knee_y - overlap)), calf)

    c_rot = c_canvas.rotate(total_calf_angle, center=(int(actual_knee_x), int(actual_knee_y)), resample=Image.Resampling.BICUBIC)

    # Combine thigh and calf
    combined = Image.alpha_composite(t_rot, c_rot)
    return combined, hip_x, hip_y

print('render_leg defined successfully!')
