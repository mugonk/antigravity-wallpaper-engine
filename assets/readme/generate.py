#!/usr/bin/env python3
"""
Generate high-DPI (2x supersampled) light & dark README visual assets
for Antigravity Wallpaper Engine.
"""
from __future__ import annotations

import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "readme"
ROPE_DIR = ROOT / "assets" / "rope"
FONT_PIXEL = OUT_DIR / "Jersey20-Regular.ttf"
FONT_ZH_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_ZH_REG = Path(r"C:\Windows\Fonts\msyh.ttc")

SCALE = 2  # 2x supersampling for crisp anti-aliased edges and text


def S(val: float) -> int:
    return int(round(val * SCALE))


THEMES = {
    "light": {
        "frame": (232, 240, 250, 255),
        "paper": (248, 251, 255, 255),
        "line": (42, 58, 82, 255),
        "bright": (255, 255, 255, 255),
        "low": (184, 200, 222, 255),
        "shadow": (140, 160, 188, 255),
        "ink": (17, 28, 45, 255),
        "muted": (78, 98, 125, 255),
        "vent": (156, 176, 202, 255),
        "dots": (42, 58, 82, 24),
        "cyan": (56, 189, 248, 255),
        "cyan_soft": (186, 230, 253, 255),
        "indigo": (99, 102, 241, 255),
        "pink": (236, 72, 153, 255),
        "green": (34, 197, 94, 255),
        "amber": (245, 158, 11, 255),
        "primary_bg": (56, 189, 248, 255),
        "primary_ink": (12, 24, 42, 255),
        "primary_sub": (22, 46, 74, 255),
        "primary_bright": (165, 232, 255, 255),
        "primary_low": (24, 140, 204, 255),
        "chip_dark_bg": (30, 45, 68, 255),
        "chip_dark_fg": (240, 248, 255, 255),
        "chip_light_bg": (255, 255, 255, 255),
        "chip_light_fg": (36, 52, 76, 255),
        "code_bg": (34, 49, 72, 255),
        "code_fg": (244, 249, 255, 255),
        "glass_fill": (255, 255, 255, 148),
        "glass_border": (255, 255, 255, 225),
        "glass_pill_bg": (255, 255, 255, 210),
        "glass_pill_fg": (30, 48, 74, 255),
        "orb1": (56, 189, 248, 125),
        "orb2": (129, 140, 248, 110),
        "orb3": (244, 114, 182, 95),
        "pane_grad_top": (235, 246, 255, 255),
        "pane_grad_bot": (244, 238, 255, 255),
    },
    "dark": {
        "frame": (26, 36, 56, 255),
        "paper": (14, 21, 36, 255),
        "line": (122, 152, 190, 255),
        "bright": (52, 72, 104, 255),
        "low": (10, 15, 26, 255),
        "shadow": (5, 8, 15, 255),
        "ink": (238, 246, 255, 255),
        "muted": (152, 178, 210, 255),
        "vent": (72, 98, 134, 255),
        "dots": (148, 197, 255, 28),
        "cyan": (56, 189, 248, 255),
        "cyan_soft": (117, 230, 245, 255),
        "indigo": (129, 140, 248, 255),
        "pink": (244, 114, 182, 255),
        "green": (52, 211, 153, 255),
        "amber": (251, 191, 36, 255),
        "primary_bg": (56, 189, 248, 255),
        "primary_ink": (9, 17, 30, 255),
        "primary_sub": (18, 40, 66, 255),
        "primary_bright": (162, 230, 255, 255),
        "primary_low": (20, 136, 198, 255),
        "chip_dark_bg": (117, 230, 245, 255),
        "chip_dark_fg": (11, 19, 34, 255),
        "chip_light_bg": (22, 33, 52, 255),
        "chip_light_fg": (194, 218, 244, 255),
        "code_bg": (117, 230, 245, 255),
        "code_fg": (11, 19, 34, 255),
        "glass_fill": (24, 38, 62, 162),
        "glass_border": (148, 215, 255, 135),
        "glass_pill_bg": (15, 25, 44, 215),
        "glass_pill_fg": (186, 234, 255, 255),
        "orb1": (56, 189, 248, 110),
        "orb2": (99, 102, 241, 115),
        "orb3": (236, 72, 153, 95),
        "pane_grad_top": (15, 28, 48, 255),
        "pane_grad_bot": (26, 20, 48, 255),
    },
}


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), S(size))


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int, int, int]:
    """Return (width, height, x_offset, y_offset) from exact glyph bounding box."""
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    return (r - l, b - t, l, t)


def draw_text_centered(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    dy: int = 0,
) -> None:
    x0, y0, x1, y1 = box
    w, h, l, t = text_size(draw, text, font)
    tx = x0 + (x1 - x0 - w) // 2 - l
    ty = y0 + (y1 - y0 - h) // 2 - t + dy
    draw.text((tx, ty), text, font=font, fill=fill)


def draw_text_vcenter(
    draw: ImageDraw.ImageDraw,
    x: int,
    y0: int,
    y1: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    dy: int = 0,
) -> int:
    w, h, l, t = text_size(draw, text, font)
    ty = y0 + (y1 - y0 - h) // 2 - t + dy
    draw.text((x - l, ty), text, font=font, fill=fill)
    return w


def draw_bevel_frame(
    draw: ImageDraw.ImageDraw,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    bg: tuple[int, int, int, int],
    line: tuple[int, int, int, int],
    bright: tuple[int, int, int, int],
    low: tuple[int, int, int, int],
    shadow: tuple[int, int, int, int],
    border_px: int = 3,
    bevel_px: int = 3,
    shadow_y: int = 7,
) -> None:
    b = S(border_px)
    bv = S(bevel_px)
    sy = S(shadow_y)
    # Hard bottom drop shadow
    if sy > 0:
        draw.rectangle([x0, y0 + sy, x1, y1 + sy], fill=shadow)
    # Outer border
    draw.rectangle([x0, y0, x1, y1], fill=line)
    # Main fill
    ix0, iy0, ix1, iy1 = x0 + b, y0 + b, x1 - b, y1 - b
    draw.rectangle([ix0, iy0, ix1, iy1], fill=bg)
    # Inner bevel: top & left bright, bottom & right low
    draw.rectangle([ix0, iy0, ix1, iy0 + bv - 1], fill=bright)
    draw.rectangle([ix0, iy0, ix0 + bv - 1, iy1], fill=bright)
    draw.rectangle([ix0, iy1 - bv + 1, ix1, iy1], fill=low)
    draw.rectangle([ix1 - bv + 1, iy0, ix1, iy1], fill=low)


def draw_recessed_pane(
    img: Image.Image,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    t: dict,
    with_dots: bool = True,
) -> None:
    draw = ImageDraw.Draw(img)
    b = S(3)
    bv = S(3)
    draw.rectangle([x0, y0, x1, y1], fill=t["line"])
    ix0, iy0, ix1, iy1 = x0 + b, y0 + b, x1 - b, y1 - b
    draw.rectangle([ix0, iy0, ix1, iy1], fill=t["paper"])
    # Subtle dot matrix
    if with_dots:
        overlay = Image.new("RGBA", (ix1 - ix0 + 1, iy1 - iy0 + 1), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        step = S(8)
        r = max(1, S(0.8))
        dot_c = t["dots"]
        for py in range(S(4), iy1 - iy0, step):
            for px in range(S(4), ix1 - ix0, step):
                od.rectangle([px, py, px + r, py + r], fill=dot_c)
        img.alpha_composite(overlay, (ix0, iy0))
    # Recessed shadow top & left
    draw = ImageDraw.Draw(img)
    draw.rectangle([ix0, iy0, ix1, iy0 + bv - 1], fill=t["low"])
    draw.rectangle([ix0, iy0, ix0 + bv - 1, iy1], fill=t["low"])


def draw_vent(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
    bar_w = S(3)
    step = S(10)
    x = x0
    while x + bar_w <= x1:
        draw.rectangle([x, y0, x + bar_w - 1, y1], fill=color)
        x += step


def draw_lamp(
    img: Image.Image,
    x0: int,
    y0: int,
    size: int,
    color: tuple[int, int, int, int],
    line: tuple[int, int, int, int],
    is_dark: bool,
) -> None:
    # Subtle glow in dark mode
    if is_dark:
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        pad = S(4)
        gd.rectangle([x0 - pad, y0 - pad, x0 + size + pad, y0 + size + pad], fill=(color[0], color[1], color[2], 120))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=S(5)))
        img.alpha_composite(glow)
    draw = ImageDraw.Draw(img)
    b = S(2)
    draw.rectangle([x0, y0, x0 + size, y0 + size], fill=line)
    draw.rectangle([x0 + b, y0 + b, x0 + size - b, y0 + size - b], fill=color)
    # Specular pixel glint
    g = S(3)
    draw.rectangle([x0 + b + S(2), y0 + b + S(2), x0 + b + S(2) + g, y0 + b + S(2) + g], fill=(255, 255, 255, 185))


def draw_mini_logo(img: Image.Image, x0: int, y0: int, size: int) -> None:
    """Render a crisp 2x version of assets/logo.svg."""
    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Diagonal 3-stop gradient (#38bdf8 -> #6366f1 -> #ec4899)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = grad.load()
    c0 = (56, 189, 248)
    c1 = (99, 102, 241)
    c2 = (236, 72, 153)
    denom = max(1, (size - 1) * 2)
    for y in range(size):
        for x in range(size):
            u = (x + y) / denom
            if u < 0.5:
                k = u * 2.0
                r = int(c0[0] + (c1[0] - c0[0]) * k)
                g = int(c0[1] + (c1[1] - c0[1]) * k)
                b = int(c0[2] + (c1[2] - c0[2]) * k)
            else:
                k = (u - 0.5) * 2.0
                r = int(c1[0] + (c2[0] - c1[0]) * k)
                g = int(c1[1] + (c2[1] - c1[1]) * k)
                b = int(c1[2] + (c2[2] - c1[2]) * k)
            px[x, y] = (r, g, b, 255)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    rad = int(size * 0.24)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=rad, fill=255)
    card.paste(grad, (0, 0), mask)

    # Frosted inner tile
    ov = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    pad = max(2, int(size * 0.06))
    od.rounded_rectangle(
        [pad, pad, size - 1 - pad, size - 1 - pad],
        radius=int(size * 0.20),
        fill=(255, 255, 255, 72),
        outline=(255, 255, 255, 175),
        width=max(2, int(size * 0.025)),
    )
    # Sun + mountains + stars
    sx, sy, sr = int(size * 0.34), int(size * 0.34), int(size * 0.10)
    od.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(253, 224, 71, 245))
    pts = [
        (int(size * 0.14), int(size * 0.78)),
        (int(size * 0.39), int(size * 0.50)),
        (int(size * 0.55), int(size * 0.67)),
        (int(size * 0.70), int(size * 0.44)),
        (int(size * 0.87), int(size * 0.78)),
    ]
    od.polygon(pts, fill=(255, 255, 255, 232))
    r1 = max(2, int(size * 0.04))
    od.ellipse([int(size * 0.74) - r1, int(size * 0.28) - r1, int(size * 0.74) + r1, int(size * 0.28) + r1], fill=(255, 255, 255, 235))
    r2 = max(1, int(size * 0.026))
    od.ellipse([int(size * 0.82) - r2, int(size * 0.38) - r2, int(size * 0.82) + r2, int(size * 0.38) + r2], fill=(255, 255, 255, 200))
    card.alpha_composite(ov)
    img.alpha_composite(card, (x0, y0))


def save_downsampled(img: Image.Image, out_path: Path) -> None:
    target = (img.width // SCALE, img.height // SCALE)
    final = img.resize(target, Image.Resampling.LANCZOS)
    final.save(out_path, format="PNG", optimize=True)


def generate_hero(theme_name: str) -> None:
    t = THEMES[theme_name]
    is_dark = theme_name == "dark"
    W, H = 1440, 560
    img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer tactile studio window frame
    draw_bevel_frame(
        draw,
        0,
        0,
        S(W) - 1,
        S(550) - 1,
        bg=t["frame"],
        line=t["line"],
        bright=t["bright"],
        low=t["low"],
        shadow=t["shadow"],
        border_px=3,
        bevel_px=3,
        shadow_y=8,
    )

    # Titlebar divider line
    tb_h = S(70)
    draw.rectangle([S(3), tb_h, S(W - 3) - 1, tb_h + S(3) - 1], fill=t["line"])

    # 3-segment aurora lights in titlebar
    lx, ly, lw, lh = S(24), S(18), S(22), S(35)
    b2 = S(2)
    draw.rectangle([lx, ly, lx + lw * 3 + b2 * 4, ly + lh], fill=t["line"])
    for idx, col in enumerate([t["cyan"], t["indigo"], t["pink"]]):
        sx = lx + b2 + idx * (lw + b2)
        draw.rectangle([sx, ly + b2, sx + lw - 1, ly + lh - b2 - 1], fill=col)

    # Titlebar system name
    f_sys = load_font(FONT_PIXEL, 28)
    sys_x = lx + lw * 3 + b2 * 4 + S(24)
    sys_w = draw_text_vcenter(draw, sys_x, S(4), tb_h, "ANTIGRAVITY // WALLPAPER ENGINE", f_sys, t["muted"])

    # Titlebar vent
    vent_x0 = sys_x + sys_w + S(24)
    vent_x1 = S(W - 72)
    draw_vent(draw, vent_x0, S(20), vent_x1, S(50), t["vent"])

    # Titlebar status lamp
    draw_lamp(img, S(W - 48), S(24), S(23), t["green"], t["line"], is_dark)

    # Two inner panes
    pane_y0 = S(98)
    pane_y1 = S(524)
    left_x0, left_x1 = S(26), S(940)
    right_x0, right_x1 = S(966), S(W - 26)

    # Left main copy pane
    draw_recessed_pane(img, left_x0, pane_y0, left_x1, pane_y1, t, with_dots=True)
    draw = ImageDraw.Draw(img)

    cx = left_x0 + S(38)
    # Kicker
    ky = pane_y0 + S(28)
    draw.rectangle([cx, ky + S(4), cx + S(16), ky + S(20)], fill=t["cyan"])
    draw.rectangle([cx + S(8), ky + S(12), cx + S(16), ky + S(20)], fill=t["pink"])
    f_kicker_zh = load_font(FONT_ZH_BOLD, 21)
    f_kicker_en = load_font(FONT_PIXEL, 25)
    kw = draw_text_vcenter(draw, cx + S(28), ky, ky + S(26), "桌面壁纸引擎", f_kicker_zh, t["muted"])
    draw_text_vcenter(draw, cx + S(28) + kw + S(16), ky, ky + S(26), "ANTIGRAVITY 2.0 PLUGIN", f_kicker_en, t["muted"], dy=S(1))

    # Giant Title
    f_title = load_font(FONT_PIXEL, 134)
    f_product = load_font(FONT_PIXEL, 50)
    draw_text_vcenter(draw, cx, pane_y0 + S(58), pane_y0 + S(178), "ANTIGRAVITY", f_title, t["ink"])
    draw_text_vcenter(draw, cx + S(2), pane_y0 + S(182), pane_y0 + S(228), "WALLPAPER ENGINE", f_product, t["cyan"] if is_dark else t["indigo"])

    # Tri-color aurora rule
    ry = pane_y0 + S(246)
    rw = S(650)
    rh = S(9)
    w1 = int(rw * 0.56)
    w2 = int(rw * 0.26)
    draw.rectangle([cx, ry, cx + w1, ry + rh], fill=t["cyan"])
    draw.rectangle([cx + w1, ry, cx + w1 + w2, ry + rh], fill=t["indigo"])
    draw.rectangle([cx + w1 + w2, ry, cx + rw, ry + rh], fill=t["pink"])

    # Tagline + English subtitle
    f_tag = load_font(FONT_ZH_BOLD, 26)
    f_sub = load_font(FONT_PIXEL, 25)
    draw_text_vcenter(draw, cx, pane_y0 + S(272), pane_y0 + S(312), "把动态壁纸与 iOS 液态玻璃，无感带入 Antigravity 2.0", f_tag, t["ink"])
    draw_text_vcenter(draw, cx, pane_y0 + S(316), pane_y0 + S(346), "Your wallpapers. Your liquid glass. Zero agent token overhead.", f_sub, t["muted"])

    # Chips row
    f_chip = load_font(FONT_PIXEL, 24)
    chips = [
        ("NODE.JS 20+", True),
        ("WINDOWS 10/11", False),
        ("ZERO TOKEN", False),
        ("MIT LICENSE", False),
    ]
    chip_x = cx
    chip_y0 = pane_y0 + S(360)
    chip_y1 = chip_y0 + S(36)
    for label, filled in chips:
        tw, _, _, _ = text_size(draw, label, f_chip)
        cw = tw + S(26)
        bg_c = t["chip_dark_bg"] if filled else t["chip_light_bg"]
        fg_c = t["chip_dark_fg"] if filled else t["chip_light_fg"]
        draw.rectangle([chip_x, chip_y0, chip_x + cw, chip_y1], fill=t["line"])
        draw.rectangle([chip_x + S(2), chip_y0 + S(2), chip_x + cw - S(2), chip_y1 - S(2)], fill=bg_c)
        draw_text_centered(draw, (chip_x, chip_y0, chip_x + cw, chip_y1), label, f_chip, fg_c)
        chip_x += cw + S(12)

    # Right showcase pane (Ice-Crystal Liquid Glass + Gemini Mascot)
    draw_recessed_pane(img, right_x0, pane_y0, right_x1, pane_y1, t, with_dots=False)
    rx0, ry0, rx1, ry1 = right_x0 + S(3), pane_y0 + S(3), right_x1 - S(3), pane_y1 - S(3)
    pw, ph = rx1 - rx0, ry1 - ry0

    # Soft vertical ice-aurora backdrop inside right pane
    pane_bg = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    px = pane_bg.load()
    gt, gb = t["pane_grad_top"], t["pane_grad_bot"]
    for y in range(ph):
        u = y / max(1, ph - 1)
        col = (
            int(gt[0] + (gb[0] - gt[0]) * u),
            int(gt[1] + (gb[1] - gt[1]) * u),
            int(gt[2] + (gb[2] - gt[2]) * u),
            255,
        )
        for x in range(pw):
            px[x, y] = col

    # Glowing blurred aurora orbs inside right pane
    orbs = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    od = ImageDraw.Draw(orbs)
    od.ellipse([S(-20), S(20), S(240), S(260)], fill=t["orb1"])
    od.ellipse([S(170), S(110), S(450), S(380)], fill=t["orb2"])
    od.ellipse([S(40), S(230), S(310), S(460)], fill=t["orb3"])
    orbs = orbs.filter(ImageFilter.GaussianBlur(radius=S(42)))
    pane_bg.alpha_composite(orbs)

    # Frosted Liquid Glass inner card
    glass = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glass)
    pad = S(22)
    gd.rounded_rectangle(
        [pad, pad, pw - pad, ph - pad],
        radius=S(24),
        fill=t["glass_fill"],
        outline=t["glass_border"],
        width=S(2),
    )
    # Subtle top specular reflection highlight on glass card
    gd.rounded_rectangle(
        [pad + S(8), pad + S(6), pw - pad - S(8), pad + S(14)],
        radius=S(4),
        fill=(255, 255, 255, 90 if not is_dark else 45),
    )
    pane_bg.alpha_composite(glass)

    # Mini logo emblem in top-left of glass card
    draw_mini_logo(pane_bg, pad + S(16), pad + S(16), S(54))

    # Subtle dot grid overlay at edges of right pane
    img.alpha_composite(pane_bg, (rx0, ry0))

    # Re-apply top/left recessed shadow on right pane
    draw = ImageDraw.Draw(img)
    draw.rectangle([rx0, ry0, rx1, ry0 + S(3) - 1], fill=t["low"])
    draw.rectangle([rx0, ry0, rx0 + S(3) - 1, ry1], fill=t["low"])

    # Gemini Mascot hanging cleanly from the top edge of the right pane!
    gemini = Image.open(ROPE_DIR / "gemini.png").convert("RGBA")
    target_h = S(358)
    target_w = int(round(gemini.width * (target_h / gemini.height)))
    gemini_resized = gemini.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Soft drop shadow behind mascot
    m_shadow = Image.new("RGBA", gemini_resized.size, (0, 0, 0, 0))
    alpha_ch = gemini_resized.getchannel("A")
    shadow_col = (15, 30, 55, 65) if not is_dark else (0, 0, 0, 110)
    m_shadow.paste(shadow_col, (0, 0), alpha_ch)
    m_shadow = m_shadow.filter(ImageFilter.GaussianBlur(radius=S(8)))

    mx = rx0 + (pw - target_w) // 2 + S(16)
    my = pane_y0 - S(26)  # Rope rises slightly over the pane top frame just like hanging from the titlebar!
    img.alpha_composite(m_shadow, (mx + S(4), my + S(8)))
    img.alpha_composite(gemini_resized, (mx, my))

    # Floating frosted pill badge at bottom of right pane
    pill_text = "ICE CRYSTAL // WEBWALLGL"
    f_pill = load_font(FONT_PIXEL, 22)
    pill_box = (rx0 + S(34), ry1 - S(62), rx1 - S(34), ry1 - S(26))
    pill_ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill_ov)
    pd.rounded_rectangle(
        pill_box,
        radius=S(18),
        fill=t["glass_pill_bg"],
        outline=t["cyan"] if is_dark else t["line"],
        width=S(2),
    )
    img.alpha_composite(pill_ov)
    draw = ImageDraw.Draw(img)
    draw_text_centered(draw, pill_box, pill_text, f_pill, t["glass_pill_fg"])

    save_downsampled(img, OUT_DIR / f"hero-{theme_name}.png")


def generate_metrics(theme_name: str) -> None:
    t = THEMES[theme_name]
    is_dark = theme_name == "dark"
    W, H = 1440, 178
    img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))

    cards = [
        ("VERSION", "1.0.0", "当前发行版", t["green"]),
        ("WALLPAPERS", "4+", "Scene / Web / 视频 / 图", t["cyan"]),
        ("PRESETS", "11", "开箱即用液态玻璃预设", t["indigo"]),
        ("AGENT COST", "0", "零 Token 与上下文开销", t["pink"]),
    ]
    gap = S(16)
    card_w = (S(W) - gap * 3) // 4
    card_h = S(168)

    f_head = load_font(FONT_PIXEL, 26)
    f_num = load_font(FONT_PIXEL, 64)
    f_lbl = load_font(FONT_ZH_BOLD, 17)

    for i, (head, num, lbl, lamp_col) in enumerate(cards):
        x0 = i * (card_w + gap)
        x1 = x0 + card_w - 1
        y0 = 0
        y1 = card_h - 1
        draw = ImageDraw.Draw(img)
        draw_bevel_frame(
            draw,
            x0,
            y0,
            x1,
            y1,
            bg=t["frame"],
            line=t["line"],
            bright=t["bright"],
            low=t["low"],
            shadow=t["shadow"],
            border_px=3,
            bevel_px=3,
            shadow_y=7,
        )
        # Header
        draw_text_vcenter(draw, x0 + S(16), y0 + S(10), y0 + S(44), head, f_head, t["muted"])
        draw_lamp(img, x1 - S(34), y0 + S(18), S(18), lamp_col, t["line"], is_dark)

        # Recessed value well
        vx0, vy0, vx1, vy1 = x0 + S(14), y0 + S(48), x1 - S(14), y1 - S(14)
        draw_recessed_pane(img, vx0, vy0, vx1, vy1, t, with_dots=False)
        draw = ImageDraw.Draw(img)

        # Big number on left, Chinese caption on bottom-right
        draw_text_vcenter(draw, vx0 + S(18), vy0 + S(4), vy1 - S(4), num, f_num, t["ink"])
        lw, lh, ll, lt = text_size(draw, lbl, f_lbl)
        draw.text((vx1 - S(14) - lw - ll, vy1 - S(16) - lh - lt), lbl, font=f_lbl, fill=t["muted"])

    save_downsampled(img, OUT_DIR / f"metrics-{theme_name}.png")


def generate_keys(theme_name: str) -> None:
    t = THEMES[theme_name]
    f_zh = load_font(FONT_ZH_BOLD, 23)
    f_en = load_font(FONT_PIXEL, 29)

    keys = [
        ("get", "快速安装", "GET", True),
        ("presets", "预设外观", "PRESETS", False),
        ("formats", "支持格式", "FORMATS", False),
        ("faq", "常见问题", "FAQ", False),
        ("credits", "出处致谢", "CREDITS", False),
    ]

    tmp = Image.new("RGBA", (10, 10))
    td = ImageDraw.Draw(tmp)

    for key_id, zh_text, en_text, is_primary in keys:
        zw, _, _, _ = text_size(td, zh_text, f_zh)
        ew, _, _, _ = text_size(td, en_text, f_en)
        pad_x = S(24)
        gap = S(13)
        inner_w = zw + gap + ew + pad_x * 2
        W_px = int(math.ceil(inner_w / SCALE))
        H_px = 74
        img = Image.new("RGBA", (S(W_px), S(H_px)), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        bg = t["primary_bg"] if is_primary else t["frame"]
        bright = t["primary_bright"] if is_primary else t["bright"]
        low = t["primary_low"] if is_primary else t["low"]
        zh_col = t["primary_ink"] if is_primary else t["ink"]
        en_col = t["primary_sub"] if is_primary else t["muted"]

        draw_bevel_frame(
            draw,
            0,
            0,
            S(W_px) - 1,
            S(65) - 1,
            bg=bg,
            line=t["line"],
            bright=bright,
            low=low,
            shadow=t["shadow"],
            border_px=3,
            bevel_px=3,
            shadow_y=7,
        )
        draw_text_vcenter(draw, pad_x, S(3), S(62), zh_text, f_zh, zh_col)
        draw_text_vcenter(draw, pad_x + zw + gap, S(3), S(62), en_text, f_en, en_col, dy=S(1))

        save_downsampled(img, OUT_DIR / f"key-{key_id}-{theme_name}.png")


def generate_sections(theme_name: str) -> None:
    t = THEMES[theme_name]
    is_dark = theme_name == "dark"
    W, H = 1440, 84
    f_code = load_font(FONT_PIXEL, 31)
    f_title = load_font(FONT_ZH_BOLD, 25)

    sections = [
        ("features", "FEATURES", "核心特性", t["cyan"]),
        ("formats", "FORMATS", "支持的壁纸类型", t["indigo"]),
        ("presets", "PRESETS", "预设与外观分享", t["pink"]),
        ("start", "GET STARTED", "快速开始与安装", t["green"]),
        ("maintain", "MAINTAIN", "常用维护与安全卸载", t["amber"]),
        ("arch", "ARCHITECTURE", "目录结构与实现原理", t["cyan"]),
        ("faq", "FAQ", "常见问题", t["indigo"]),
        ("credits", "CREDITS", "原项目出处与致谢", t["pink"]),
    ]

    for sec_id, code, title, lamp_col in sections:
        img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        draw_bevel_frame(
            draw,
            0,
            0,
            S(W) - 1,
            S(76) - 1,
            bg=t["frame"],
            line=t["line"],
            bright=t["bright"],
            low=t["low"],
            shadow=t["shadow"],
            border_px=3,
            bevel_px=3,
            shadow_y=7,
        )

        # Left inverted code block
        cw_text, _, _, _ = text_size(draw, code, f_code)
        code_w = max(S(186), cw_text + S(48))
        cb_box = (S(6), S(6), S(6) + code_w, S(70))
        draw.rectangle(cb_box, fill=t["code_bg"])
        # Thin colored accent edge on the right of code block
        draw.rectangle([cb_box[2], cb_box[1], cb_box[2] + S(5), cb_box[3]], fill=lamp_col)
        draw_text_centered(draw, cb_box, code, f_code, t["code_fg"])

        # Chinese title
        tx = cb_box[2] + S(26)
        tw = draw_text_vcenter(draw, tx, S(6), S(70), title, f_title, t["ink"])

        # Acoustic vent grille
        vx0 = tx + tw + S(24)
        vx1 = S(W - 64)
        draw_vent(draw, vx0, S(23), vx1, S(53), t["vent"])

        # Right status lamp
        draw_lamp(img, S(W - 44), S(27), S(21), lamp_col, t["line"], is_dark)

        save_downsampled(img, OUT_DIR / f"section-{sec_id}-{theme_name}.png")


def generate_mascots_banner(theme_name: str) -> None:
    """Generate a unified studio rack showcasing all 10 built-in rope mascots."""
    t = THEMES[theme_name]
    is_dark = theme_name == "dark"
    W, H = 1440, 212
    img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw_bevel_frame(
        draw,
        0,
        0,
        S(W) - 1,
        S(202) - 1,
        bg=t["frame"],
        line=t["line"],
        bright=t["bright"],
        low=t["low"],
        shadow=t["shadow"],
        border_px=3,
        bevel_px=3,
        shadow_y=7,
    )

    # Top bar header
    f_hdr_en = load_font(FONT_PIXEL, 23)
    f_hdr_zh = load_font(FONT_ZH_BOLD, 17)
    draw_text_vcenter(draw, S(22), S(6), S(42), "MASCOT ROPE GALLERY", f_hdr_en, t["muted"])
    draw_text_vcenter(draw, S(236), S(6), S(42), "内置 10 款吉祥物拉绳（亦支持自定义上传）", f_hdr_zh, t["muted"])
    draw_lamp(img, S(W - 38), S(15), S(17), t["pink"], t["line"], is_dark)

    # Recessed showcase shelf
    sx0, sy0, sx1, sy1 = S(18), S(46), S(W - 18), S(186)
    draw_recessed_pane(img, sx0, sy0, sx1, sy1, t, with_dots=True)

    mascots = [
        ("gemini", "GEMINI"),
        ("whale", "WHALE"),
        ("deepseek", "DEEPSEEK"),
        ("claude", "CLAUDE"),
        ("gpt", "GPT"),
        ("grok", "GROK"),
        ("qwen", "QWEN"),
        ("kimi", "KIMI"),
        ("glm", "GLM"),
        ("phoebe", "PHOEBE"),
    ]
    inner_w = sx1 - sx0 - S(20)
    col_w = inner_w / len(mascots)
    f_name = load_font(FONT_PIXEL, 19)

    for idx, (fname, label) in enumerate(mascots):
        cx = int(sx0 + S(10) + (idx + 0.5) * col_w)
        # Highlight Gemini slightly as recommended default (flush with shelf ceiling)
        if fname == "gemini":
            ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            hx0 = int(cx - col_w * 0.44)
            hx1 = int(cx + col_w * 0.44)
            od.rectangle(
                [hx0, sy0 + S(3), hx1, sy1 - S(6)],
                fill=(56, 189, 248, 32 if not is_dark else 40),
            )
            # Bottom glowing accent strip for recommended mascot
            od.rectangle(
                [hx0 + S(12), sy1 - S(10), hx1 - S(12), sy1 - S(6)],
                fill=t["cyan"],
            )
            img.alpha_composite(ov)

        m = Image.open(ROPE_DIR / f"{fname}.png").convert("RGBA")
        max_h = S(98)
        max_w = int(col_w * 0.78)
        scale = min(max_h / m.height, max_w / m.width)
        mw, mh = int(round(m.width * scale)), int(round(m.height * scale))
        m_resized = m.resize((mw, mh), Image.Resampling.LANCZOS)
        # Align top flush with inner recessed shelf bezel so all ropes hang from ceiling
        mx = cx - mw // 2
        my = sy0 + S(3)
        img.alpha_composite(m_resized, (mx, my))

        draw = ImageDraw.Draw(img)
        lbl_col = t["cyan"] if (fname == "gemini" and is_dark) else (t["indigo"] if fname == "gemini" else t["muted"])
        draw_text_centered(draw, (int(cx - col_w / 2), sy1 - S(32), int(cx + col_w / 2), sy1 - S(8)), label, f_name, lbl_col)

    save_downsampled(img, OUT_DIR / f"mascots-{theme_name}.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for theme in ("light", "dark"):
        generate_hero(theme)
        generate_metrics(theme)
        generate_keys(theme)
        generate_sections(theme)
        generate_mascots_banner(theme)
    print(f"[readme-assets] generated all light/dark PNGs in {OUT_DIR}")


if __name__ == "__main__":
    main()
