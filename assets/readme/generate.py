#!/usr/bin/env python3
"""
Generate original Spatial Liquid Glass (light & dark) README visual assets
for Antigravity Wallpaper Engine using NumPy mesh gradients + real Gaussian
backdrop-blur frosted glass compositing (2x supersampled).
"""
from __future__ import annotations

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "readme"
ROPE_DIR = ROOT / "assets" / "rope"

FONT_LATIN_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")
FONT_LATIN_SEMI = Path(r"C:\Windows\Fonts\segoeuisl.ttf")
FONT_LATIN_REG = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_ZH_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_ZH_REG = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_MONO_BOLD = Path(r"C:\Windows\Fonts\consolab.ttf")

SCALE = 2


def S(v: float) -> int:
    return int(round(v * SCALE))


def font_zh(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_ZH_BOLD if bold else FONT_ZH_REG), S(size))


def font_en(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_LATIN_BOLD if bold else FONT_LATIN_REG), S(size))


def font_mono(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_MONO_BOLD), S(size))


THEMES = {
    "light": {
        "is_dark": False,
        "bg_base": (236, 244, 255),
        "hero_blobs": [
            (0.14, 0.18, 0.56, (125, 226, 255), 0.78),
            (0.76, 0.16, 0.62, (165, 178, 255), 0.72),
            (0.86, 0.84, 0.58, (248, 178, 224), 0.72),
            (0.42, 0.86, 0.54, (152, 238, 250), 0.65),
            (0.56, 0.42, 0.44, (255, 255, 255), 0.55),
        ],
        "bento_bg": (244, 248, 255),
        "bento_blobs": [
            (0.10, 0.15, 0.45, (186, 234, 255), 0.65),
            (0.52, 0.12, 0.45, (206, 208, 255), 0.55),
            (0.90, 0.85, 0.50, (252, 204, 232), 0.58),
            (0.22, 0.90, 0.45, (176, 240, 235), 0.50),
        ],
        "ink": (15, 23, 42, 255),
        "ink_sub": (51, 68, 96, 255),
        "muted": (94, 114, 144, 255),
        "cyan": (14, 165, 233, 255),
        "cyan_bright": (56, 189, 248, 255),
        "ice": (117, 230, 245, 255),
        "indigo": (99, 102, 241, 255),
        "pink": (236, 72, 153, 255),
        "emerald": (16, 185, 129, 255),
        "amber": (245, 158, 11, 255),
        "glass_tint": (255, 255, 255, 148),
        "glass_tint_strong": (255, 255, 255, 196),
        "glass_tint_soft": (255, 255, 255, 108),
        "glass_rim_top": (255, 255, 255, 242),
        "glass_rim_bot": (148, 184, 224, 145),
        "glass_shadow": (48, 78, 122, 34),
        "canvas_border": (176, 202, 234, 195),
        "orbit_col": (72, 118, 184, 52),
        "grad_title": ((14, 145, 224), (92, 92, 235), (218, 66, 148)),
        "grad_beam": ((14, 165, 233), (99, 102, 241), (236, 72, 153)),
        "pill_bg": (255, 255, 255, 215),
        "pill_border": (182, 208, 238, 220),
        "primary_grad": ((14, 165, 233), (99, 102, 241)),
        "primary_fg": (255, 255, 255, 255),
        "win_bg": (248, 252, 255, 138),
        "win_side": (255, 255, 255, 178),
        "win_card": (255, 255, 255, 196),
        "win_pop": (255, 255, 255, 226),
        "win_line": (152, 184, 222, 150),
        "wave_col1": (124, 218, 255, 58),
        "wave_col2": (164, 168, 255, 48),
    },
    "dark": {
        "is_dark": True,
        "bg_base": (9, 14, 26),
        "hero_blobs": [
            (0.14, 0.16, 0.54, (14, 148, 222), 0.56),
            (0.76, 0.18, 0.60, (88, 80, 224), 0.58),
            (0.84, 0.84, 0.54, (214, 58, 142), 0.48),
            (0.40, 0.88, 0.52, (20, 184, 212), 0.42),
            (0.58, 0.46, 0.42, (52, 92, 184), 0.36),
        ],
        "bento_bg": (11, 17, 30),
        "bento_blobs": [
            (0.10, 0.15, 0.46, (18, 138, 210), 0.34),
            (0.52, 0.12, 0.46, (94, 86, 226), 0.32),
            (0.88, 0.85, 0.50, (204, 58, 138), 0.28),
            (0.24, 0.90, 0.44, (18, 168, 184), 0.24),
        ],
        "ink": (244, 249, 255, 255),
        "ink_sub": (192, 212, 238, 255),
        "muted": (136, 162, 198, 255),
        "cyan": (56, 189, 248, 255),
        "cyan_bright": (117, 230, 245, 255),
        "ice": (117, 230, 245, 255),
        "indigo": (129, 140, 248, 255),
        "pink": (244, 114, 182, 255),
        "emerald": (52, 211, 153, 255),
        "amber": (251, 191, 36, 255),
        "glass_tint": (18, 30, 52, 142),
        "glass_tint_strong": (18, 29, 50, 184),
        "glass_tint_soft": (22, 36, 62, 108),
        "glass_rim_top": (196, 234, 255, 138),
        "glass_rim_bot": (92, 128, 182, 74),
        "glass_shadow": (2, 5, 14, 118),
        "canvas_border": (96, 136, 188, 115),
        "orbit_col": (136, 198, 255, 48),
        "grad_title": ((117, 230, 245), (146, 158, 255), (248, 134, 198)),
        "grad_beam": ((117, 230, 245), (129, 140, 248), (244, 114, 182)),
        "pill_bg": (20, 32, 54, 215),
        "pill_border": (98, 142, 196, 132),
        "primary_grad": ((28, 180, 245), (112, 104, 245)),
        "primary_fg": (255, 255, 255, 255),
        "win_bg": (14, 24, 42, 142),
        "win_side": (18, 30, 52, 178),
        "win_card": (24, 40, 68, 172),
        "win_pop": (14, 24, 44, 224),
        "win_line": (124, 178, 236, 92),
        "wave_col1": (56, 189, 248, 42),
        "wave_col2": (129, 140, 248, 36),
    },
}


def make_mesh_backdrop(w: int, h: int, base_rgb: tuple[int, int, int], blobs: list) -> Image.Image:
    """Render a smooth, banding-free aurora mesh gradient using NumPy."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xn = xx / max(1, w - 1)
    yn = yy / max(1, h - 1)
    canvas = np.zeros((h, w, 3), dtype=np.float32)
    canvas[:, :, 0] = base_rgb[0]
    canvas[:, :, 1] = base_rgb[1]
    canvas[:, :, 2] = base_rgb[2]

    aspect = w / max(1.0, float(h))
    for cx, cy, rad, col, alpha in blobs:
        dx = (xn - cx) * (aspect * 0.62)
        dy = (yn - cy)
        d2 = (dx * dx + dy * dy) / max(1e-4, rad * rad)
        weight = np.exp(-d2 * 2.15) * alpha
        for c in range(3):
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - weight) + col[c] * weight

    out = np.clip(canvas, 0, 255).astype(np.uint8)
    rgba = np.dstack([out, np.full((h, w), 255, dtype=np.uint8)])
    return Image.fromarray(rgba, mode="RGBA")


def clip_rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def make_linear_gradient_img(w: int, h: int, c0: tuple[int, int, int], c1: tuple[int, int, int], c2: tuple[int, int, int] | None = None, horizontal: bool = True) -> Image.Image:
    t = np.linspace(0.0, 1.0, w if horizontal else h, dtype=np.float32)
    if c2 is None:
        arr = np.outer(1.0 - t, c0) + np.outer(t, c1)
    else:
        lo = np.clip(t * 2.0, 0.0, 1.0)
        hi = np.clip((t - 0.5) * 2.0, 0.0, 1.0)
        m = (t < 0.5).astype(np.float32)[:, None]
        part1 = (1.0 - lo[:, None]) * np.array(c0) + lo[:, None] * np.array(c1)
        part2 = (1.0 - hi[:, None]) * np.array(c1) + hi[:, None] * np.array(c2)
        arr = m * part1 + (1.0 - m) * part2
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    if horizontal:
        rgb = np.broadcast_to(arr[None, :, :], (h, w, 3))
    else:
        rgb = np.broadcast_to(arr[:, None, :], (h, w, 3))
    rgba = np.dstack([rgb, np.full((h, w), 255, dtype=np.uint8)])
    return Image.fromarray(rgba, mode="RGBA")


def draw_gradient_text(
    img: Image.Image,
    pos: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    colors: tuple,
) -> tuple[int, int]:
    tmp = ImageDraw.Draw(img)
    l, t, r, b = tmp.textbbox((0, 0), text, font=font)
    tw, th = max(1, r - l), max(1, b - t)
    mask = Image.new("L", (tw + 4, th + 4), 0)
    md = ImageDraw.Draw(mask)
    md.text((-l + 2, -t + 2), text, font=font, fill=255)
    c0, c1 = colors[0], colors[1]
    c2 = colors[2] if len(colors) > 2 else None
    grad = make_linear_gradient_img(tw + 4, th + 4, c0, c1, c2, horizontal=True)
    grad.putalpha(mask)
    img.alpha_composite(grad, (pos[0] - 2, pos[1] - 2))
    return (tw, th)


def text_metrics(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int, int, int]:
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
    w, h, l, t = text_metrics(draw, text, font)
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
    w, h, l, t = text_metrics(draw, text, font)
    ty = y0 + (y1 - y0 - h) // 2 - t + dy
    draw.text((x - l, ty), text, font=font, fill=fill)
    return w


def composite_liquid_glass_panel(
    base: Image.Image,
    box: tuple[int, int, int, int],
    radius: int,
    tint: tuple[int, int, int, int],
    rim_top: tuple[int, int, int, int],
    rim_bot: tuple[int, int, int, int],
    shadow_col: tuple[int, int, int, int] | None = None,
    blur_radius: float = 16.0,
    specular_strength: int = 62,
    border_w: float = 1.6,
) -> None:
    """
    True physical Liquid Glass panel:
    1. Soft diffused drop shadow behind glass
    2. Real Gaussian blur of underlying pixels inside the rounded region
    3. Translucent tint absorption + subtle diagonal top-left specular glass sheen
    4. Crisp vertical-gradient Fresnel specular rim border
    """
    x0, y0, x1, y1 = box
    pw, ph = x1 - x0, y1 - y0
    if pw <= 4 or ph <= 4:
        return

    # 1. Soft diffused drop shadow
    if shadow_col is not None and shadow_col[3] > 0:
        pad = S(26)
        sh = Image.new("RGBA", (pw + pad * 2, ph + pad * 2), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle([pad, pad + S(6), pad + pw - 1, pad + ph + S(5)], radius=radius, fill=shadow_col)
        sh = sh.filter(ImageFilter.GaussianBlur(radius=S(12)))
        base.alpha_composite(sh, (x0 - pad, y0 - pad))

    # 2. Crop & blur underlying backdrop
    margin = S(24)
    cx0 = max(0, x0 - margin)
    cy0 = max(0, y0 - margin)
    cx1 = min(base.width, x1 + margin)
    cy1 = min(base.height, y1 + margin)
    crop = base.crop((cx0, cy0, cx1, cy1)).filter(ImageFilter.GaussianBlur(radius=S(blur_radius)))
    local = crop.crop((x0 - cx0, y0 - cy0, x1 - cx0, y1 - cy0))

    # 3. Tint absorption + diagonal top specular highlight
    tint_layer = Image.new("RGBA", (pw, ph), tint)
    local.alpha_composite(tint_layer)

    if specular_strength > 0:
        yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
        u = 1.0 - (0.35 * (xx / max(1, pw - 1)) + 0.65 * (yy / max(1, ph - 1)))
        sheen_a = np.clip(np.power(np.clip(u, 0.0, 1.0), 2.4) * specular_strength, 0, 255).astype(np.uint8)
        sheen = np.zeros((ph, pw, 4), dtype=np.uint8)
        sheen[:, :, :3] = 255
        sheen[:, :, 3] = sheen_a
        local.alpha_composite(Image.fromarray(sheen, mode="RGBA"))

    # Rounded clip mask
    mask = Image.new("L", (pw, ph), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=radius, fill=255)
    glass_tile = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    glass_tile.paste(local, (0, 0), mask)

    # 4. Crisp Fresnel gradient rim border (brighter at top, softer at bottom)
    bw = max(2, int(round(border_w * SCALE)))
    outer_m = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(outer_m).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=radius, fill=255)
    inner_m = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(inner_m).rounded_rectangle([bw, bw, pw - 1 - bw, ph - 1 - bw], radius=max(1, radius - bw), fill=255)
    rim_mask = np.clip(np.array(outer_m, dtype=np.int16) - np.array(inner_m, dtype=np.int16), 0, 255).astype(np.uint8)

    t_v = np.linspace(0.0, 1.0, ph, dtype=np.float32)[:, None]
    rim_rgba = np.zeros((ph, pw, 4), dtype=np.uint8)
    for c in range(4):
        col_v = (1.0 - t_v) * rim_top[c] + t_v * rim_bot[c]
        rim_rgba[:, :, c] = np.broadcast_to(np.clip(col_v, 0, 255).astype(np.uint8), (ph, pw))
    rim_rgba[:, :, 3] = ((rim_rgba[:, :, 3].astype(np.float32) * rim_mask.astype(np.float32)) / 255.0).astype(np.uint8)
    glass_tile.alpha_composite(Image.fromarray(rim_rgba, mode="RGBA"))

    base.alpha_composite(glass_tile, (x0, y0))


def draw_glow_dot(img: Image.Image, cx: int, cy: int, r: int, color: tuple[int, int, int, int]) -> None:
    pad = r * 4
    ov = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.ellipse([pad - r * 2, pad - r * 2, pad + r * 2, pad + r * 2], fill=(color[0], color[1], color[2], 145))
    ov = ov.filter(ImageFilter.GaussianBlur(radius=max(2, r)))
    img.alpha_composite(ov, (cx - pad, cy - pad))
    draw = ImageDraw.Draw(img)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    # Specular white pinpoint
    sr = max(1, r // 3)
    draw.ellipse([cx - sr - r // 4, cy - sr - r // 4, cx + sr - r // 4, cy + sr - r // 4], fill=(255, 255, 255, 220))


def draw_sparkle(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, color: tuple[int, int, int, int]) -> None:
    """Draw a delicate 4-point star sparkle."""
    s = size
    m = max(1, int(size * 0.24))
    pts = [
        (cx, cy - s),
        (cx + m, cy - m),
        (cx + s, cy),
        (cx + m, cy + m),
        (cx, cy + s),
        (cx - m, cy + m),
        (cx - s, cy),
        (cx - m, cy - m),
    ]
    draw.polygon(pts, fill=color)


def draw_aurora_waves(img: Image.Image, t: dict) -> None:
    """Draw delicate translucent zero-gravity light ribbons & orbital arcs."""
    w, h = img.size
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)

    # Sweeping soft horizon light waves along the lower half
    pts1 = []
    pts2 = []
    for x in range(0, w + S(20), S(20)):
        u = x / max(1, w)
        y1 = int(h * (0.76 - 0.14 * math.sin(u * math.pi * 1.45 + 0.35)))
        y2 = int(h * (0.84 - 0.12 * math.cos(u * math.pi * 1.7 - 0.2)))
        pts1.append((x, y1))
        pts2.append((x, y2))
    poly1 = pts1 + [(w, h), (0, h)]
    poly2 = pts2 + [(w, h), (0, h)]
    od.polygon(poly1, fill=t["wave_col1"])
    od.polygon(poly2, fill=t["wave_col2"])
    ov = ov.filter(ImageFilter.GaussianBlur(radius=S(18)))
    img.alpha_composite(ov)

    # Crisp thin zero-gravity orbital rings
    orb = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(orb)
    rd.arc([S(520), S(-180), S(1560), S(620)], start=110, end=270, fill=t["orbit_col"], width=S(1.5))
    rd.arc([S(640), S(-110), S(1480), S(540)], start=125, end=260, fill=t["orbit_col"], width=S(1.2))
    rd.arc([S(-220), S(290), S(620), S(960)], start=250, end=360, fill=t["orbit_col"], width=S(1.3))
    # Subtle starlight sparkles (kept clear of text areas)
    sp_col = (255, 255, 255, 190 if t["is_dark"] else 235)
    for sx, sy, sz in [(630, 82, 9), (668, 128, 5), (1398, 118, 8), (1395, 545, 7), (656, 558, 6), (570, 520, 5)]:
        draw_sparkle(rd, S(sx), S(sy), S(sz), sp_col)
    img.alpha_composite(orb)


def save_downsampled(img: Image.Image, out_path: Path) -> None:
    target = (img.width // SCALE, img.height // SCALE)
    final = img.resize(target, Image.Resampling.LANCZOS)
    final.save(out_path, format="PNG", optimize=True)


def generate_hero(theme_name: str) -> None:
    t = THEMES[theme_name]
    is_dark = t["is_dark"]
    W, H = 1440, 620
    canvas = make_mesh_backdrop(S(W), S(H), t["bg_base"], t["hero_blobs"])
    draw_aurora_waves(canvas, t)

    # Subtle outer frame rounding
    rad_outer = S(32)

    # === LEFT EDITORIAL COLUMN ===
    lx = S(66)

    # Top floating frosted pill badge
    pill_box = (lx, S(64), lx + S(396), S(106))
    composite_liquid_glass_panel(
        canvas,
        pill_box,
        radius=S(21),
        tint=t["glass_tint_strong"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=t["glass_shadow"],
        blur_radius=14,
        specular_strength=55,
    )
    draw_glow_dot(canvas, lx + S(24), S(85), S(5), t["cyan_bright"] if is_dark else t["cyan"])
    draw = ImageDraw.Draw(canvas)
    f_badge = font_en(15, bold=True)
    draw_text_vcenter(draw, lx + S(42), pill_box[1], pill_box[3], "ANTIGRAVITY 2.0  ·  LIQUID GLASS", f_badge, t["ink_sub"])

    # Sleek modern Editorial Display Title
    f_hero_1 = font_en(76, bold=True)
    f_hero_2 = font_en(64, bold=True)
    draw.text((lx - S(3), S(136)), "Antigravity", font=f_hero_1, fill=t["ink"])
    draw_gradient_text(canvas, (lx - S(2), S(236)), "Wallpaper Engine", f_hero_2, t["grad_title"])

    # Chinese Subtitle (two crisp airy lines, kept strictly clear of right preview)
    f_sub = font_zh(24, bold=True)
    f_sub2 = font_zh(17, bold=False)
    draw = ImageDraw.Draw(canvas)
    draw.text((lx, S(332)), "让本机动态壁纸与 iOS 液态玻璃，失重悬浮于桌面端", font=f_sub, fill=t["ink"])
    draw.text((lx, S(374)), "直连 Steam / WE 壁纸库 · WebWallGL 实时渲染 · 零 Token 开销", font=f_sub2, fill=t["ink_sub"])

    # 3 Frosted Liquid Glass Feature Pills
    pills = [
        ("Scene · Web · Video · 图片", t["cyan_bright"] if is_dark else t["cyan"]),
        ("零 Token 消耗", t["emerald"]),
        ("与汉化插件安全共存", t["pink"]),
    ]
    f_chip = font_zh(15, bold=True)
    px = lx
    py0, py1 = S(442), S(486)
    tmp_d = ImageDraw.Draw(canvas)
    for label, dot_col in pills:
        tw, _, _, _ = text_metrics(tmp_d, label, f_chip)
        pw = tw + S(52)
        pbox = (px, py0, px + pw, py1)
        composite_liquid_glass_panel(
            canvas,
            pbox,
            radius=S(22),
            tint=t["glass_tint"],
            rim_top=t["glass_rim_top"],
            rim_bot=t["glass_rim_bot"],
            shadow_col=t["glass_shadow"],
            blur_radius=12,
            specular_strength=48,
        )
        draw_glow_dot(canvas, px + S(20), (py0 + py1) // 2, S(4.5), dot_col)
        d = ImageDraw.Draw(canvas)
        draw_text_vcenter(d, px + S(34), py0, py1, label, f_chip, t["ink"])
        px += pw + S(14)

    # Bottom subtle metadata strip
    f_meta = font_mono(14)
    d = ImageDraw.Draw(canvas)
    d.text((lx + S(2), S(536)), "v1.0.0   //   Windows 10/11   //   Node.js >= 20   //   MIT License", font=f_meta, fill=t["muted"])

    # === RIGHT SPATIAL LIQUID GLASS DESKTOP PREVIEW ===
    # A sleek miniature Antigravity 2.0 window floating right over the live aurora wallpaper!
    wx0, wy0, wx1, wy1 = S(752), S(56), S(1386), S(504)
    composite_liquid_glass_panel(
        canvas,
        (wx0, wy0, wx1, wy1),
        radius=S(26),
        tint=t["win_bg"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=(6, 12, 28, 95 if is_dark else 42),
        blur_radius=14,
        specular_strength=58,
        border_w=1.8,
    )

    # Window top header bar (subtle traffic dots + title)
    d = ImageDraw.Draw(canvas)
    for idx, col in enumerate([(255, 95, 87, 235), (254, 188, 46, 235), (40, 200, 64, 235)]):
        cx = wx0 + S(24 + idx * 18)
        cy = wy0 + S(22)
        d.ellipse([cx - S(5), cy - S(5), cx + S(5), cy + S(5)], fill=col)
    f_win_hdr = font_en(13, bold=True)
    draw_text_vcenter(d, wx0 + S(84), wy0 + S(10), wy0 + S(34), "Antigravity 2.0  ·  Live Wallpaper Active", f_win_hdr, t["muted"])
    # Subtle header divider
    d.line([(wx0 + S(14), wy0 + S(44)), (wx1 - S(14), wy0 + S(44))], fill=t["win_line"], width=S(1))

    # Miniature Left Liquid Glass Sidebar (rounded 20px just like the real preset!)
    sb_box = (wx0 + S(14), wy0 + S(56), wx0 + S(186), wy1 - S(14))
    composite_liquid_glass_panel(
        canvas,
        sb_box,
        radius=S(18),
        tint=t["win_side"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=None,
        blur_radius=18,
        specular_strength=45,
        border_w=1.3,
    )
    # Sidebar skeleton items
    d = ImageDraw.Draw(canvas)
    f_sb = font_zh(12, bold=True)
    d.text((sb_box[0] + S(14), sb_box[1] + S(14)), "对话工作区", font=f_sb, fill=t["muted"])
    # Active glowing thread item
    act_box = (sb_box[0] + S(10), sb_box[1] + S(42), sb_box[2] - S(10), sb_box[1] + S(74))
    ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.rounded_rectangle(act_box, radius=S(10), fill=(56, 189, 248, 52 if is_dark else 42), outline=(56, 189, 248, 165), width=S(1.2))
    # Inactive skeleton pills
    for row in range(3):
        ry = sb_box[1] + S(88 + row * 34)
        od.rounded_rectangle([sb_box[0] + S(14), ry, sb_box[2] - S(26 + row * 12), ry + S(12)], radius=S(6), fill=(255, 255, 255, 42) if is_dark else (80, 110, 150, 38))
        od.rounded_rectangle([sb_box[0] + S(14), ry + S(18), sb_box[2] - S(48), ry + S(25)], radius=S(4), fill=(255, 255, 255, 22) if is_dark else (80, 110, 150, 22))
    canvas.alpha_composite(ov)
    d = ImageDraw.Draw(canvas)
    act_col = t["cyan_bright"] if is_dark else t["cyan"]
    draw_sparkle(d, act_box[0] + S(16), (act_box[1] + act_box[3]) // 2, S(5.5), act_col)
    draw_text_vcenter(d, act_box[0] + S(28), act_box[1], act_box[3], "冰透晶玻方案", font_zh(12, bold=True), act_col)

    # Miniature Chat Bubbles floating in the transparent middle viewport
    chat_x0 = sb_box[2] + S(18)
    chat_x1 = wx1 - S(20)

    # Assistant frosted glass card
    bub1 = (chat_x0, wy0 + S(64), chat_x0 + S(276), wy0 + S(156))
    composite_liquid_glass_panel(
        canvas,
        bub1,
        radius=S(16),
        tint=t["win_card"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=None,
        blur_radius=14,
        specular_strength=40,
        border_w=1.2,
    )
    d = ImageDraw.Draw(canvas)
    d.text((bub1[0] + S(16), bub1[1] + S(14)), "WebWallGL · Scene 实时渲染中", font=font_zh(13, bold=True), fill=t["ink"])
    d.text((bub1[0] + S(16), bub1[1] + S(40)), "已加载冰透晶玻预设 · 60 FPS", font=font_zh(12, bold=False), fill=t["ink_sub"])
    # Subtle waveform/bar preview inside bubble
    ov2 = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od2 = ImageDraw.Draw(ov2)
    od2.rounded_rectangle([bub1[0] + S(16), bub1[1] + S(66), bub1[2] - S(20), bub1[1] + S(76)], radius=S(5), fill=(117, 230, 245, 75))
    od2.rounded_rectangle([bub1[0] + S(16), bub1[1] + S(66), bub1[0] + S(178), bub1[1] + S(76)], radius=S(5), fill=t["cyan_bright"])
    canvas.alpha_composite(ov2)

    # Miniature Floating Glass Composer Input (placed cleanly to the right of the popover)
    comp_box = (S(1024), wy1 - S(68), chat_x1, wy1 - S(16))
    composite_liquid_glass_panel(
        canvas,
        comp_box,
        radius=S(18),
        tint=t["win_side"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=None,
        blur_radius=16,
        specular_strength=48,
        border_w=1.3,
    )
    d = ImageDraw.Draw(canvas)
    draw_text_vcenter(d, comp_box[0] + S(16), comp_box[1], comp_box[3], "Ctrl + Alt + W 唤起设置面板...", font_zh(12, bold=False), t["muted"])
    # Glowing send orb inside composer
    draw_glow_dot(canvas, comp_box[2] - S(24), (comp_box[1] + comp_box[3]) // 2, S(8.5), t["cyan_bright"] if is_dark else t["cyan"])

    # === FLOATING LIQUID GLASS TUNER POPOVER (Overlaps only lower-left empty sidebar area!) ===
    pop_box = (S(708), S(392), S(1008), S(576))
    composite_liquid_glass_panel(
        canvas,
        pop_box,
        radius=S(22),
        tint=t["win_pop"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=(4, 10, 24, 130 if is_dark else 58),
        blur_radius=20,
        specular_strength=65,
        border_w=1.6,
    )
    d = ImageDraw.Draw(canvas)
    d.text((pop_box[0] + S(20), pop_box[1] + S(15)), "液态玻璃实时调节", font=font_zh(14, bold=True), fill=t["ink"])
    # Mini preset badge top-right of popover
    d.text((pop_box[2] - S(86), pop_box[1] + S(16)), "#75e6f5", font=font_mono(13), fill=t["cyan_bright"] if is_dark else t["cyan"])

    sliders = [
        ("雾化模糊", "9 px", 0.34, t["cyan_bright"] if is_dark else t["cyan"]),
        ("透光强度", "40 %", 0.56, t["indigo"]),
        ("场景帧率", "60 FPS", 0.88, t["pink"]),
    ]
    for idx, (lbl, val, ratio, col) in enumerate(sliders):
        sy = pop_box[1] + S(50 + idx * 42)
        d = ImageDraw.Draw(canvas)
        d.text((pop_box[0] + S(20), sy), lbl, font=font_zh(12, bold=False), fill=t["ink_sub"])
        vw, _, vl, _ = text_metrics(d, val, font_mono(12))
        d.text((pop_box[2] - S(20) - vw - vl, sy + S(1)), val, font=font_mono(12), fill=t["ink"])
        # Slider track
        tx0, tx1 = pop_box[0] + S(20), pop_box[2] - S(20)
        ty = sy + S(24)
        d.rounded_rectangle([tx0, ty - S(3), tx1, ty + S(3)], radius=S(3), fill=(255, 255, 255, 34) if is_dark else (120, 148, 185, 58))
        kx = int(tx0 + (tx1 - tx0) * ratio)
        d.rounded_rectangle([tx0, ty - S(3), kx, ty + S(3)], radius=S(3), fill=col)
        # Glowing thumb knob
        d.ellipse([kx - S(7), ty - S(7), kx + S(7), ty + S(7)], fill=(255, 255, 255, 255), outline=col, width=S(2))

    # === GEMINI MASCOT HANGING FROM TOP-RIGHT OF THE FLOATING WINDOW ===
    gemini = Image.open(ROPE_DIR / "gemini.png").convert("RGBA")
    gh = S(308)
    gw = int(round(gemini.width * (gh / gemini.height)))
    gem_img = gemini.resize((gw, gh), Image.Resampling.LANCZOS)

    # Ambient glowing halo behind mascot
    halo = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    mx = wx1 - gw - S(18)
    my = wy0 + S(44)  # Rope seamlessly hangs from the window titlebar!
    hd.ellipse([mx + S(10), my + S(55), mx + gw - S(10), my + gh - S(10)], fill=(117, 230, 245, 78 if is_dark else 62))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=S(26)))
    canvas.alpha_composite(halo)

    # Soft shadow + mascot
    m_sh = Image.new("RGBA", gem_img.size, (0, 0, 0, 0))
    m_sh.paste((8, 16, 36, 95 if is_dark else 52), (0, 0), gem_img.getchannel("A"))
    m_sh = m_sh.filter(ImageFilter.GaussianBlur(radius=S(9)))
    canvas.alpha_composite(m_sh, (mx + S(4), my + S(8)))
    canvas.alpha_composite(gem_img, (mx, my))

    # Clip full Hero canvas to super-rounded 32px corners + subtle crisp outer glass rim
    final_hero = clip_rounded(canvas, rad_outer)
    rim = Image.new("RGBA", final_hero.size, (0, 0, 0, 0))
    ImageDraw.Draw(rim).rounded_rectangle([S(1), S(1), S(W) - S(2), S(H) - S(2)], radius=rad_outer, outline=t["canvas_border"], width=S(1.8))
    final_hero.alpha_composite(rim)

    save_downsampled(final_hero, OUT_DIR / f"hero-{theme_name}.png")


def generate_bento(theme_name: str) -> None:
    """Original 6-card Apple-style Liquid Glass Bento Grid."""
    t = THEMES[theme_name]
    is_dark = t["is_dark"]
    W, H = 1440, 476
    canvas = make_mesh_backdrop(S(W), S(H), t["bento_bg"], t["bento_blobs"])

    gap = S(18)
    pad = S(20)
    r1_y0, r1_y1 = pad, S(230)
    r2_y0, r2_y1 = r1_y1 + gap, S(H) - pad
    inner_w = S(W) - pad * 2 - gap * 2

    # Asymmetric widths: Row 1 = [520, 422, 422], Row 2 = [422, 422, 520]
    w_wide = int(inner_w * 0.382)
    w_med = (inner_w - w_wide) // 2

    c1 = (pad, r1_y0, pad + w_wide, r1_y1)
    c2 = (c1[2] + gap, r1_y0, c1[2] + gap + w_med, r1_y1)
    c3 = (c2[2] + gap, r1_y0, S(W) - pad, r1_y1)

    c4 = (pad, r2_y0, pad + w_med, r2_y1)
    c5 = (c4[2] + gap, r2_y0, c4[2] + gap + w_med, r2_y1)
    c6 = (c5[2] + gap, r2_y0, S(W) - pad, r2_y1)

    rad = S(24)
    for box in (c1, c2, c3, c4, c5, c6):
        composite_liquid_glass_panel(
            canvas,
            box,
            radius=rad,
            tint=t["glass_tint_strong"],
            rim_top=t["glass_rim_top"],
            rim_bot=t["glass_rim_bot"],
            shadow_col=t["glass_shadow"],
            blur_radius=16,
            specular_strength=50,
            border_w=1.5,
        )

    f_kicker = font_en(12, bold=True)
    f_h = font_zh(21, bold=True)
    f_p = font_zh(14, bold=False)

    # --- CARD 1: 全格式本地直连 ---
    d = ImageDraw.Draw(canvas)
    d.text((c1[0] + S(26), c1[1] + S(22)), "ALL-FORMAT ENGINE", font=f_kicker, fill=t["cyan_bright"] if is_dark else t["cyan"])
    d.text((c1[0] + S(26), c1[1] + S(42)), "全格式壁纸直连 · 无需启动 WE", font=f_h, fill=t["ink"])
    d.text((c1[0] + S(26), c1[1] + S(76)), "自动扫描本机创意工坊与自定义目录，WebWallGL 实时渲染", font=f_p, fill=t["muted"])

    fmt_pills = [
        ("Scene · WebGL", t["cyan_bright"] if is_dark else t["cyan"]),
        ("Web · Sandbox", t["indigo"]),
        ("Video · Stream", t["pink"]),
        ("Picture · Slide", t["emerald"]),
    ]
    fx = c1[0] + S(26)
    fy = c1[1] + S(124)
    f_fp = font_en(14, bold=True)
    for idx, (lbl, col) in enumerate(fmt_pills):
        col_x = c1[0] + S(26) + (idx % 2) * S(236)
        row_y = fy + (idx // 2) * S(40)
        ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.rounded_rectangle([col_x, row_y, col_x + S(220), row_y + S(32)], radius=S(12), fill=(col[0], col[1], col[2], 32 if is_dark else 26), outline=(col[0], col[1], col[2], 140), width=S(1.2))
        canvas.alpha_composite(ov)
        draw_glow_dot(canvas, col_x + S(16), row_y + S(16), S(4), col)
        d = ImageDraw.Draw(canvas)
        draw_text_vcenter(d, col_x + S(30), row_y, row_y + S(32), lbl, f_fp, t["ink"])

    # --- CARD 2: iOS 液态玻璃引擎 (Visual layered frosted discs!) ---
    d = ImageDraw.Draw(canvas)
    d.text((c2[0] + S(24), c2[1] + S(22)), "LIQUID GLASS", font=f_kicker, fill=t["indigo"])
    d.text((c2[0] + S(24), c2[1] + S(42)), "iOS 级液态玻璃材质", font=f_h, fill=t["ink"])
    d.text((c2[0] + S(24), c2[1] + S(76)), "独立调校侧栏 / 卡片 / 输入框模糊与高光", font=f_p, fill=t["muted"])

    # Colorful vivid orbs behind mini stacked glass cards to prove frosted refraction!
    orb_ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(orb_ov)
    gx0 = c2[0] + ((c2[2] - c2[0]) - S(336)) // 2
    gy0 = c2[1] + S(114)
    od.ellipse([gx0 + S(10), gy0 + S(4), gx0 + S(96), gy0 + S(90)], fill=(56, 189, 248, 210))
    od.ellipse([gx0 + S(118), gy0 - S(4), gx0 + S(210), gy0 + S(88)], fill=(129, 140, 248, 210))
    od.ellipse([gx0 + S(226), gy0 + S(8), gx0 + S(312), gy0 + S(88)], fill=(236, 72, 153, 200))
    orb_ov = orb_ov.filter(ImageFilter.GaussianBlur(radius=S(10)))
    canvas.alpha_composite(orb_ov)

    for idx, (ox, lbl) in enumerate([(0, "Blur 9px"), (108, "Alpha 40%"), (216, "Radius 20")]):
        tile = (gx0 + S(ox), gy0 + S(14), gx0 + S(ox + 120), gy0 + S(76))
        composite_liquid_glass_panel(
            canvas,
            tile,
            radius=S(16),
            tint=t["glass_tint"],
            rim_top=t["glass_rim_top"],
            rim_bot=t["glass_rim_bot"],
            shadow_col=t["glass_shadow"],
            blur_radius=12,
            specular_strength=70,
            border_w=1.5,
        )
        d = ImageDraw.Draw(canvas)
        draw_text_centered(d, tile, lbl, font_mono(13), t["ink"])

    # --- CARD 3: 0 Agent Token 开销 ---
    d = ImageDraw.Draw(canvas)
    d.text((c3[0] + S(24), c3[1] + S(22)), "ZERO OVERHEAD", font=f_kicker, fill=t["emerald"])
    d.text((c3[0] + S(24), c3[1] + S(42)), "零 Agent Token 消耗", font=f_h, fill=t["ink"])
    d.text((c3[0] + S(24), c3[1] + S(76)), "不注册 MCP 工具 · 不注入额外提示词", font=f_p, fill=t["muted"])

    # Concentric orbital rings + giant gradient "0" centered cleanly
    ocx, ocy = c3[0] + S(100), c3[1] + S(150)
    ring_ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_ov)
    rd.ellipse([ocx - S(58), ocy - S(38), ocx + S(58), ocy + S(38)], outline=(52, 211, 153, 125), width=S(1.5))
    rd.ellipse([ocx - S(80), ocy - S(46), ocx + S(80), ocy + S(46)], outline=(56, 189, 248, 72), width=S(1.2))
    canvas.alpha_composite(ring_ov)
    f_zero = font_en(68, bold=True)
    zw, zh, _, _ = text_metrics(ImageDraw.Draw(canvas), "0", f_zero)
    draw_gradient_text(canvas, (ocx - zw // 2, ocy - zh // 2), "0", f_zero, ((52, 211, 153), (56, 189, 248)))
    d = ImageDraw.Draw(canvas)
    d.text((c3[0] + S(194), c3[1] + S(124)), "Token / 对话损耗", font=font_zh(16, bold=True), fill=t["ink"])
    d.text((c3[0] + S(194), c3[1] + S(152)), "纯本地 127.0.0.1 渲染层", font=font_zh(13, bold=False), fill=t["muted"])

    # --- CARD 4: 11 套开箱外观预设 (Color Swatch Fan!) ---
    d = ImageDraw.Draw(canvas)
    d.text((c4[0] + S(24), c4[1] + S(22)), "CURATED PRESETS", font=f_kicker, fill=t["pink"])
    d.text((c4[0] + S(24), c4[1] + S(42)), "11 套开箱即用预设", font=f_h, fill=t["ink"])
    d.text((c4[0] + S(24), c4[1] + S(76)), "内置冰透晶玻与上游经典方案，支持 JSON 分享", font=f_p, fill=t["muted"])

    swatches = [
        ("冰透晶玻", (117, 230, 245), (14, 116, 180)),
        ("深空冷霜", (99, 102, 241), (30, 41, 82)),
        ("极简轻霜", (226, 238, 252), (148, 178, 212)),
        ("星云紫韵", (236, 72, 153), (124, 58, 237)),
    ]
    sx0 = c4[0] + S(24)
    sy0 = c4[1] + S(116)
    sw_w = S(86)
    sw_h = S(88)
    for idx, (sname, c_top, c_bot) in enumerate(swatches):
        bx = sx0 + idx * S(94)
        sw_img = make_linear_gradient_img(sw_w, sw_h, c_top, c_bot, horizontal=False)
        sw_img = clip_rounded(sw_img, S(14))
        canvas.alpha_composite(sw_img, (bx, sy0))
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle([bx, sy0, bx + sw_w - 1, sy0 + sw_h - 1], radius=S(14), outline=t["glass_rim_top"], width=S(1.4))
        # Bottom dark/frosted label bar
        ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle([bx + S(4), sy0 + sw_h - S(26), bx + sw_w - S(5), sy0 + sw_h - S(4)], radius=S(8), fill=(10, 18, 34, 165))
        canvas.alpha_composite(ov)
        d = ImageDraw.Draw(canvas)
        draw_text_centered(d, (bx + S(4), sy0 + sw_h - S(26), bx + sw_w - S(5), sy0 + sw_h - S(4)), sname, font_zh(11, bold=True), (245, 250, 255, 255))

    # --- CARD 5: 多插件安全共存 (Dual-Track ASAR Diagram) ---
    d = ImageDraw.Draw(canvas)
    d.text((c5[0] + S(24), c5[1] + S(22)), "SAFE COEXISTENCE", font=f_kicker, fill=t["amber"])
    d.text((c5[0] + S(24), c5[1] + S(42)), "多插件无损共存 & 精准卸载", font=f_h, fill=t["ink"])
    d.text((c5[0] + S(24), c5[1] + S(76)), "独立单行 ASAR 标记 + 自动刷新 SHA256 校验", font=f_p, fill=t["muted"])

    tracks = [
        ("/* AGY_ZH_CN */", "简体中文汉化插件", t["emerald"]),
        ("/* AGY_WE_HOOK_V1 */", "壁纸与液态玻璃引擎", t["cyan_bright"] if is_dark else t["cyan"]),
    ]
    for idx, (code_tag, desc, col) in enumerate(tracks):
        ty0 = c5[1] + S(116 + idx * 46)
        tbox = (c5[0] + S(24), ty0, c5[2] - S(24), ty0 + S(38))
        ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle(tbox, radius=S(12), fill=(col[0], col[1], col[2], 28 if is_dark else 24), outline=(col[0], col[1], col[2], 145), width=S(1.2))
        canvas.alpha_composite(ov)
        draw_glow_dot(canvas, tbox[0] + S(16), (tbox[1] + tbox[3]) // 2, S(4.5), col)
        d = ImageDraw.Draw(canvas)
        draw_text_vcenter(d, tbox[0] + S(30), tbox[1], tbox[3], code_tag, font_mono(12), t["ink"])
        dw, _, dl, _ = text_metrics(d, desc, font_zh(12, bold=False))
        draw_text_vcenter(d, tbox[2] - S(14) - dw, tbox[1], tbox[3], desc, font_zh(12, bold=False), t["muted"])

    # --- CARD 6: 快捷唤醒 & 交互特效 ---
    d = ImageDraw.Draw(canvas)
    d.text((c6[0] + S(26), c6[1] + S(22)), "INSTANT CONTROL & FX", font=f_kicker, fill=t["cyan_bright"] if is_dark else t["cyan"])
    d.text((c6[0] + S(26), c6[1] + S(42)), "一拉即达 · 波纹 / 彗星拖尾 / 3D 视差", font=f_h, fill=t["ink"])
    d.text((c6[0] + S(26), c6[1] + S(76)), "快捷键或右上角吉祥物拉绳随时唤起设置，调整即时生效", font=f_p, fill=t["muted"])

    # Sleek translucent glass keyboard shortcut caps: Ctrl + Alt + W
    kx = c6[0] + S(26)
    ky0, ky1 = c6[1] + S(130), c6[1] + S(178)
    for idx, (ktxt, kw) in enumerate([("Ctrl", 72), ("Alt", 64), ("W", 54)]):
        kbox = (kx, ky0, kx + S(kw), ky1)
        composite_liquid_glass_panel(
            canvas,
            kbox,
            radius=S(13),
            tint=t["glass_tint_strong"],
            rim_top=t["glass_rim_top"],
            rim_bot=t["glass_rim_bot"],
            shadow_col=t["glass_shadow"],
            blur_radius=10,
            specular_strength=65,
            border_w=1.5,
        )
        d = ImageDraw.Draw(canvas)
        draw_text_centered(d, kbox, ktxt, font_mono(17), t["cyan_bright"] if (ktxt == "W" and is_dark) else (t["cyan"] if ktxt == "W" else t["ink"]))
        kx += S(kw)
        if idx < 2:
            draw_text_centered(d, (kx, ky0, kx + S(22), ky1), "+", font_en(18, bold=True), t["muted"])
            kx += S(22)

    # Interactive ripple & glowing comet trail graphic on the right side of Card 6
    fx_ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(fx_ov)
    rcx, rcy = c6[2] - S(86), c6[1] + S(154)
    for rr, aa in [(46, 55), (32, 110), (18, 175)]:
        fd.ellipse([rcx - S(rr), rcy - S(rr), rcx + S(rr), rcy + S(rr)], outline=(56, 189, 248, aa), width=S(2))
    # Smooth curved comet trail leading into the ripple
    pts = []
    for step in range(28):
        u = step / 27.0
        px_c = int((c6[0] + S(286)) + (rcx - (c6[0] + S(286))) * u)
        py_c = int(rcy + math.sin(u * math.pi * 1.15) * S(-26))
        pts.append((px_c, py_c))
    for i in range(len(pts) - 1):
        u = i / max(1, len(pts) - 1)
        w_seg = max(2, int(S(1.5 + 4.5 * u)))
        col_seg = (
            int(236 * (1 - u) + 56 * u),
            int(72 * (1 - u) + 189 * u),
            int(153 * (1 - u) + 248 * u),
            int(40 + 205 * u),
        )
        fd.line([pts[i], pts[i + 1]], fill=col_seg, width=w_seg)
    canvas.alpha_composite(fx_ov)
    draw_glow_dot(canvas, rcx, rcy, S(6), t["cyan_bright"] if is_dark else t["cyan"])

    final_bento = clip_rounded(canvas, S(28))
    rim = Image.new("RGBA", final_bento.size, (0, 0, 0, 0))
    ImageDraw.Draw(rim).rounded_rectangle([S(1), S(1), S(W) - S(2), S(H) - S(2)], radius=S(28), outline=t["canvas_border"], width=S(1.6))
    final_bento.alpha_composite(rim)

    save_downsampled(final_bento, OUT_DIR / f"bento-{theme_name}.png")


def generate_nav_pills(theme_name: str) -> None:
    """Sleek frosted Liquid Glass capsule navigation pills."""
    t = THEMES[theme_name]
    is_dark = t["is_dark"]
    f_lbl = font_zh(17, bold=True)

    items = [
        ("get", "快速安装", t["primary_fg"], True),
        ("presets", "液态玻璃预设", t["pink"], False),
        ("formats", "支持格式", t["cyan_bright"] if is_dark else t["cyan"], False),
        ("faq", "常见问题", t["indigo"], False),
        ("credits", "原项目致谢", t["emerald"], False),
    ]

    tmp = Image.new("RGBA", (10, 10))
    td = ImageDraw.Draw(tmp)

    for nav_id, label, accent, is_primary in items:
        tw, _, _, _ = text_metrics(td, label, f_lbl)
        W_px = int(math.ceil((tw + S(66 if is_primary else 72)) / SCALE))
        H_px = 54
        img = Image.new("RGBA", (S(W_px), S(H_px)), (0, 0, 0, 0))
        box = (S(2), S(2), S(W_px - 2), S(H_px - 6))
        rad = S(23)

        if is_primary:
            # Vibrant aurora glass primary CTA pill with vector 4-point sparkle
            pw, ph = box[2] - box[0], box[3] - box[1]
            grad = make_linear_gradient_img(pw, ph, t["primary_grad"][0], t["primary_grad"][1], horizontal=True)
            yy = np.linspace(0.0, 1.0, ph, dtype=np.float32)[:, None]
            sheen = np.zeros((ph, pw, 4), dtype=np.uint8)
            sheen[:, :, :3] = 255
            sheen[:, :, 3] = np.broadcast_to(np.clip(np.power(1.0 - yy, 2.2) * 85, 0, 255).astype(np.uint8), (ph, pw))
            grad.alpha_composite(Image.fromarray(sheen, mode="RGBA"))
            pill = clip_rounded(grad, rad)
            img.alpha_composite(pill, (box[0], box[1]))
            d = ImageDraw.Draw(img)
            d.rounded_rectangle(box, radius=rad, outline=(255, 255, 255, 175), width=S(1.4))
            draw_sparkle(d, box[0] + S(24), (box[1] + box[3]) // 2, S(7), (255, 255, 255, 245))
            draw_text_vcenter(d, box[0] + S(40), box[1], box[3], label, f_lbl, t["primary_fg"])
        else:
            # Frosted neutral glass pill with true alpha-composited sheen
            pw, ph = box[2] - box[0], box[3] - box[1]
            base_tile = Image.new("RGBA", (pw, ph), t["pill_bg"])
            yy = np.linspace(0.0, 1.0, ph, dtype=np.float32)[:, None]
            sheen = np.zeros((ph, pw, 4), dtype=np.uint8)
            sheen[:, :, :3] = 255
            sheen[:, :, 3] = np.broadcast_to(np.clip(np.power(1.0 - yy, 2.8) * (75 if not is_dark else 36), 0, 255).astype(np.uint8), (ph, pw))
            base_tile.alpha_composite(Image.fromarray(sheen, mode="RGBA"))
            pill = clip_rounded(base_tile, rad)
            img.alpha_composite(pill, (box[0], box[1]))
            d = ImageDraw.Draw(img)
            d.rounded_rectangle(box, radius=rad, outline=t["pill_border"], width=S(1.5))
            draw_glow_dot(img, box[0] + S(22), (box[1] + box[3]) // 2, S(4.5), accent)
            d = ImageDraw.Draw(img)
            draw_text_vcenter(d, box[0] + S(36), box[1], box[3], label, f_lbl, t["ink"])

        save_downsampled(img, OUT_DIR / f"nav-{nav_id}-{theme_name}.png")


def generate_sections(theme_name: str) -> None:
    """Minimalist Spatial Glass pill + fading aurora hairline beam."""
    t = THEMES[theme_name]
    is_dark = t["is_dark"]
    W, H = 1440, 62
    f_tag = font_en(13, bold=True)
    f_title = font_zh(24, bold=True)

    sections = [
        ("formats", "FORMATS", "支持的壁纸类型", t["cyan_bright"] if is_dark else t["cyan"]),
        ("presets", "PRESETS", "液态玻璃预设与外观分享", t["pink"]),
        ("start", "QUICK START", "快速开始与安装", t["emerald"]),
        ("maintain", "MAINTAIN", "常用维护与安全卸载", t["amber"]),
        ("arch", "ARCHITECTURE", "目录结构与实现原理", t["indigo"]),
        ("faq", "FAQ", "常见问题", t["cyan_bright"] if is_dark else t["cyan"]),
        ("credits", "CREDITS", "原项目出处与致谢", t["pink"]),
    ]

    for sec_id, tag, title, accent in sections:
        img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)

        # Left frosted glass tag pill
        tw_tag, _, _, _ = text_metrics(d, tag, f_tag)
        pill_w = max(S(118), tw_tag + S(46))
        pbox = (S(2), S(11), S(2) + pill_w, S(51))
        ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle(
            pbox,
            radius=S(20),
            fill=(accent[0], accent[1], accent[2], 34 if is_dark else 26),
            outline=(accent[0], accent[1], accent[2], 160),
            width=S(1.4),
        )
        img.alpha_composite(ov)
        draw_glow_dot(img, pbox[0] + S(18), (pbox[1] + pbox[3]) // 2, S(4.5), accent)
        d = ImageDraw.Draw(img)
        draw_text_vcenter(d, pbox[0] + S(32), pbox[1], pbox[3], tag, f_tag, accent)

        # Crisp Chinese section title
        tx = pbox[2] + S(20)
        tw_zh = draw_text_vcenter(d, tx, S(6), S(54), title, f_title, t["ink"])

        # Fading aurora hairline beam stretching smoothly to the right
        bx0 = tx + tw_zh + S(24)
        bx1 = S(W - 32)
        bw = max(10, bx1 - bx0)
        bh = S(3)
        beam = make_linear_gradient_img(bw, bh, accent[:3], t["grad_beam"][1], t["grad_beam"][2], horizontal=True)
        # Smooth alpha fadeout from 210 on left to 0 on right
        fade = np.linspace(1.0, 0.0, bw, dtype=np.float32)
        alpha_row = np.clip(np.power(fade, 1.35) * 210, 0, 255).astype(np.uint8)
        alpha_2d = np.broadcast_to(alpha_row[None, :], (bh, bw))
        beam.putalpha(Image.fromarray(alpha_2d, mode="L"))
        img.alpha_composite(beam, (bx0, S(30)))

        # Tiny crystal star at beam origin
        draw_sparkle(ImageDraw.Draw(img), bx0 - S(2), S(31), S(6), accent)

        save_downsampled(img, OUT_DIR / f"sec-{sec_id}-{theme_name}.png")


def generate_mascots_stage(theme_name: str) -> None:
    """Zero-Gravity Constellation Stage for all 10 built-in rope mascots."""
    t = THEMES[theme_name]
    is_dark = t["is_dark"]
    W, H = 1440, 250
    canvas = make_mesh_backdrop(S(W), S(H), t["bento_bg"], t["bento_blobs"])

    # Outer frosted glass stage card
    pad = S(16)
    stage_box = (pad, pad, S(W) - pad, S(H) - pad)
    composite_liquid_glass_panel(
        canvas,
        stage_box,
        radius=S(26),
        tint=t["glass_tint"],
        rim_top=t["glass_rim_top"],
        rim_bot=t["glass_rim_bot"],
        shadow_col=t["glass_shadow"],
        blur_radius=16,
        specular_strength=48,
        border_w=1.6,
    )

    # Header bar inside stage
    d = ImageDraw.Draw(canvas)
    f_hdr_en = font_en(13, bold=True)
    f_hdr_zh = font_zh(16, bold=True)
    draw_glow_dot(canvas, stage_box[0] + S(26), stage_box[1] + S(26), S(4.5), t["pink"])
    d = ImageDraw.Draw(canvas)
    draw_text_vcenter(d, stage_box[0] + S(42), stage_box[1] + S(10), stage_box[1] + S(42), "MASCOT CONSTELLATION", f_hdr_en, t["pink"])
    draw_text_vcenter(d, stage_box[0] + S(220), stage_box[1] + S(10), stage_box[1] + S(42), "内置 10 款悬浮吉祥物拉绳（支持自定义上传）", f_hdr_zh, t["ink"])

    # Sleek luminous hairline suspension rail across top of mascot area
    rail_y = stage_box[1] + S(52)
    rail_x0, rail_x1 = stage_box[0] + S(24), stage_box[2] - S(24)
    rail_w = rail_x1 - rail_x0
    rail = make_linear_gradient_img(rail_w, S(2), t["grad_beam"][0], t["grad_beam"][1], t["grad_beam"][2], horizontal=True)
    rail_a = np.sin(np.linspace(0.0, math.pi, rail_w, dtype=np.float32))
    rail.putalpha(Image.fromarray(np.clip(rail_a * 210, 0, 255).astype(np.uint8)[None, :].repeat(S(2), axis=0), mode="L"))
    canvas.alpha_composite(rail, (rail_x0, rail_y))

    mascots = [
        ("gemini", "Gemini"),
        ("whale", "Whale"),
        ("deepseek", "DeepSeek"),
        ("claude", "Claude"),
        ("gpt", "GPT"),
        ("grok", "Grok"),
        ("qwen", "Qwen"),
        ("kimi", "Kimi"),
        ("glm", "GLM"),
        ("phoebe", "Phoebe"),
    ]
    col_w = rail_w / len(mascots)
    f_name = font_en(14, bold=True)

    for idx, (fname, label) in enumerate(mascots):
        cx = int(rail_x0 + (idx + 0.5) * col_w)
        # Soft spotlight pedestal behind Gemini (recommended preset)
        if fname == "gemini":
            spot = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            sd = ImageDraw.Draw(spot)
            sd.ellipse([cx - S(50), rail_y + S(18), cx + S(50), stage_box[3] - S(16)], fill=(56, 189, 248, 72 if is_dark else 58))
            spot = spot.filter(ImageFilter.GaussianBlur(radius=S(14)))
            canvas.alpha_composite(spot)

        m = Image.open(ROPE_DIR / f"{fname}.png").convert("RGBA")
        max_h = S(112)
        max_w = int(col_w * 0.80)
        sc = min(max_h / m.height, max_w / m.width)
        mw, mh = int(round(m.width * sc)), int(round(m.height * sc))
        m_img = m.resize((mw, mh), Image.Resampling.LANCZOS)

        # Rope attaches directly to the glowing suspension rail!
        mx = cx - mw // 2
        my = rail_y + S(1)
        canvas.alpha_composite(m_img, (mx, my))

        # Modern clean label pill at bottom
        d = ImageDraw.Draw(canvas)
        lbl_y0 = stage_box[3] - S(38)
        lbl_y1 = stage_box[3] - S(12)
        if fname == "gemini":
            ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            ImageDraw.Draw(ov).rounded_rectangle(
                [cx - S(48), lbl_y0, cx + S(48), lbl_y1],
                radius=S(13),
                fill=(56, 189, 248, 48 if is_dark else 34),
                outline=(56, 189, 248, 175),
                width=S(1.2),
            )
            canvas.alpha_composite(ov)
            d = ImageDraw.Draw(canvas)
            gcol = t["cyan_bright"] if is_dark else t["cyan"]
            draw_sparkle(d, cx - S(30), (lbl_y0 + lbl_y1) // 2, S(5.5), gcol)
            draw_text_vcenter(d, cx - S(18), lbl_y0, lbl_y1, "Gemini", f_name, gcol)
        else:
            draw_text_centered(d, (int(cx - col_w / 2), lbl_y0, int(cx + col_w / 2), lbl_y1), label, f_name, t["muted"])

    final_stage = clip_rounded(canvas, S(28))
    rim = Image.new("RGBA", final_stage.size, (0, 0, 0, 0))
    ImageDraw.Draw(rim).rounded_rectangle([S(1), S(1), S(W) - S(2), S(H) - S(2)], radius=S(28), outline=t["canvas_border"], width=S(1.6))
    final_stage.alpha_composite(rim)

    save_downsampled(final_stage, OUT_DIR / f"mascots-{theme_name}.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for theme in ("light", "dark"):
        generate_hero(theme)
        generate_bento(theme)
        generate_nav_pills(theme)
        generate_sections(theme)
        generate_mascots_stage(theme)
    print(f"[spatial-glass] generated all original light/dark assets in {OUT_DIR}")


if __name__ == "__main__":
    main()
