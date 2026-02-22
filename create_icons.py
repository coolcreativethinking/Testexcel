from PIL import Image, ImageDraw, ImageFont
import math

def create_azan_icon(size, filename):
    """Create a mosque-themed Azan skill icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background - deep teal/green gradient effect
    for y in range(size):
        r = int(0 + (20 * y / size))
        g = int(77 + (43 * y / size))
        b = int(64 + (56 * y / size))
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # Scale factor
    s = size / 512.0

    # Draw crescent moon (top area)
    moon_cx = int(size * 0.7)
    moon_cy = int(size * 0.18)
    moon_r = int(38 * s)
    # Outer circle (moon)
    draw.ellipse(
        [moon_cx - moon_r, moon_cy - moon_r, moon_cx + moon_r, moon_cy + moon_r],
        fill=(255, 215, 0)  # Gold
    )
    # Inner circle (to create crescent shape)
    offset = int(14 * s)
    inner_r = int(34 * s)
    # Get the background color at this position for the cutout
    draw.ellipse(
        [moon_cx - inner_r + offset, moon_cy - inner_r - int(4*s),
         moon_cx + inner_r + offset, moon_cy + inner_r - int(4*s)],
        fill=(int(0 + (20 * moon_cy / size)), int(77 + (43 * moon_cy / size)), int(64 + (56 * moon_cy / size)))
    )

    # Star near crescent
    star_cx = int(size * 0.62)
    star_cy = int(size * 0.12)
    star_r = int(8 * s)
    # Simple 4-point star
    draw.ellipse(
        [star_cx - star_r, star_cy - star_r, star_cx + star_r, star_cy + star_r],
        fill=(255, 215, 0)
    )

    # Mosque dome (center)
    dome_cx = int(size * 0.5)
    dome_base_y = int(size * 0.52)
    dome_r = int(90 * s)

    # Main dome - semicircle
    draw.ellipse(
        [dome_cx - dome_r, dome_base_y - dome_r, dome_cx + dome_r, dome_base_y + dome_r],
        fill=(255, 255, 255, 230)
    )
    # Cut bottom of dome
    draw.rectangle(
        [dome_cx - dome_r - 5, dome_base_y, dome_cx + dome_r + 5, dome_base_y + dome_r + 5],
        fill=(int(0 + (20 * dome_base_y / size)), int(77 + (43 * dome_base_y / size)), int(64 + (56 * dome_base_y / size)))
    )

    # Dome finial (small circle on top)
    finial_r = int(8 * s)
    draw.ellipse(
        [dome_cx - finial_r, dome_base_y - dome_r - finial_r + int(4*s),
         dome_cx + finial_r, dome_base_y - dome_r + finial_r + int(4*s)],
        fill=(255, 215, 0)
    )

    # Left minaret
    min_w = int(18 * s)
    min_h = int(120 * s)
    left_min_x = int(size * 0.22)
    min_top = dome_base_y - min_h
    draw.rectangle(
        [left_min_x - min_w//2, min_top, left_min_x + min_w//2, dome_base_y],
        fill=(255, 255, 255, 200)
    )
    # Left minaret top (pointed)
    draw.polygon(
        [(left_min_x - min_w, min_top), (left_min_x, min_top - int(30*s)), (left_min_x + min_w, min_top)],
        fill=(255, 255, 255, 200)
    )
    # Left minaret finial
    draw.ellipse(
        [left_min_x - int(5*s), min_top - int(35*s), left_min_x + int(5*s), min_top - int(25*s)],
        fill=(255, 215, 0)
    )

    # Right minaret
    right_min_x = int(size * 0.78)
    draw.rectangle(
        [right_min_x - min_w//2, min_top, right_min_x + min_w//2, dome_base_y],
        fill=(255, 255, 255, 200)
    )
    draw.polygon(
        [(right_min_x - min_w, min_top), (right_min_x, min_top - int(30*s)), (right_min_x + min_w, min_top)],
        fill=(255, 255, 255, 200)
    )
    draw.ellipse(
        [right_min_x - int(5*s), min_top - int(35*s), right_min_x + int(5*s), min_top - int(25*s)],
        fill=(255, 215, 0)
    )

    # Base/building
    base_top = dome_base_y
    base_bottom = int(size * 0.68)
    draw.rectangle(
        [int(size * 0.15), base_top, int(size * 0.85), base_bottom],
        fill=(255, 255, 255, 200)
    )

    # Door arch
    door_cx = int(size * 0.5)
    door_w = int(28 * s)
    door_h = int(35 * s)
    draw.rectangle(
        [door_cx - door_w, base_bottom - door_h, door_cx + door_w, base_bottom],
        fill=(0, 77, 64)
    )
    draw.ellipse(
        [door_cx - door_w, base_bottom - door_h - door_w, door_cx + door_w, base_bottom - door_h + door_w],
        fill=(0, 77, 64)
    )

    # Windows (small arches)
    for wx in [0.32, 0.68]:
        wcx = int(size * wx)
        wr = int(10 * s)
        wh = int(15 * s)
        draw.rectangle([wcx - wr, base_top + int(8*s), wcx + wr, base_top + int(8*s) + wh], fill=(0, 77, 64))
        draw.ellipse([wcx - wr, base_top + int(3*s), wcx + wr, base_top + int(8*s) + wr], fill=(0, 77, 64))

    # Sound waves (representing Azan call)
    wave_cx = int(size * 0.5)
    wave_cy = int(size * 0.35)
    for i, radius in enumerate([int(55*s), int(70*s), int(85*s)]):
        alpha = 180 - i * 50
        arc_width = max(int(3 * s), 2)
        # Draw arcs on both sides
        for angle_start, angle_end in [(-60, -20), (200, 240)]:
            draw.arc(
                [wave_cx - radius, wave_cy - radius, wave_cx + radius, wave_cy + radius],
                angle_start, angle_end,
                fill=(255, 215, 0, alpha), width=arc_width
            )

    # Text "MY AZAN" at bottom
    text = "MY AZAN"
    text_y = int(size * 0.76)

    # Try to get a nice font size
    font_size = int(48 * s)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_x = (size - text_w) // 2

    # Text shadow
    draw.text((text_x + int(2*s), text_y + int(2*s)), text, fill=(0, 40, 30), font=font)
    # Main text
    draw.text((text_x, text_y), text, fill=(255, 255, 255), font=font)

    # Subtitle
    sub_text = "Prayer Times & Azan"
    sub_font_size = int(20 * s)
    try:
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sub_font_size)
    except:
        try:
            sub_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", sub_font_size)
        except:
            sub_font = ImageFont.load_default()

    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (size - sub_w) // 2
    sub_y = text_y + int(55 * s)
    draw.text((sub_x, sub_y), sub_text, fill=(200, 230, 220), font=sub_font)

    # Round corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_r = int(size * 0.12)
    mask_draw.rounded_rectangle([0, 0, size, size], corner_r, fill=255)

    # Apply rounded corners
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, mask=mask)

    # Save as PNG
    output.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create both sizes
create_azan_icon(512, '/home/user/Testexcel/icon_512.png')
create_azan_icon(108, '/home/user/Testexcel/icon_108.png')
