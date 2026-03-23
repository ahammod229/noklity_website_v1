from pathlib import Path
import json

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TENANT_PATH = PROJECT_ROOT / "config" / "tenant.json"
OUTPUT_PATH = PROJECT_ROOT / "public" / "og-image.png"


def load_tenant():
    try:
      return json.loads(TENANT_PATH.read_text())
    except Exception:
      return {
          "brandName": "Noklity",
          "primaryColor": "#e11d48",
          "secondaryColor": "#0f172a",
          "domain": "noklity.com"
      }


def load_font(size: int, bold: bool = False):
    candidates = []
    if bold:
        candidates.extend([
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc"
        ])
    else:
        candidates.extend([
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc"
        ])

    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except Exception:
                continue
    return ImageFont.load_default()


def hex_to_rgb(value: str):
    value = value.strip().lstrip("#")
    if len(value) != 6:
        return (225, 29, 72)
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


tenant = load_tenant()
brand = tenant.get("brandName", "Noklity")
primary = hex_to_rgb(tenant.get("primaryColor", "#e11d48"))
secondary = hex_to_rgb(tenant.get("secondaryColor", "#0f172a"))

width, height = 1200, 630
image = Image.new("RGB", (width, height), "#fffafb")
draw = ImageDraw.Draw(image)

# Background accents
draw.ellipse((880, -60, 1220, 260), fill=(255, 231, 235))
draw.ellipse((-120, 430, 280, 830), fill=(255, 237, 240))
draw.rounded_rectangle((70, 70, 1130, 560), radius=46, fill="white", outline=(249, 168, 180), width=2)

# Brand block
font_brand = load_font(52, bold=True)
font_badge = load_font(24, bold=True)
font_heading = load_font(66, bold=True)
font_heading_2 = load_font(66, bold=True)
font_body = load_font(28, bold=False)
font_button = load_font(24, bold=True)

draw.text((118, 150), brand.upper(), font=font_brand, fill=primary)
draw.rounded_rectangle((118, 238, 398, 286), radius=24, fill=primary)
draw.text((144, 248), "IMPORTED IN BANGLADESH", font=font_badge, fill="white")

draw.text((118, 340), "Electronics, Tools,", font=font_heading, fill=secondary)
draw.text((118, 420), "Tyres & Parts", font=font_heading_2, fill=primary)
draw.text(
    (118, 505),
    "Quality products. Trusted sourcing. Delivery across Bangladesh.",
    font=font_body,
    fill=(71, 85, 105)
)

# Product card illustration
card_x, card_y = 760, 132
draw.rounded_rectangle((card_x, card_y, card_x + 290, card_y + 360), radius=38, fill=(255, 247, 248), outline=(254, 205, 211), width=2)
draw.rounded_rectangle((card_x + 34, card_y + 36, card_x + 256, card_y + 200), radius=28, fill="white")
draw.rounded_rectangle((card_x + 50, card_y + 300, card_x + 180, card_y + 340), radius=20, fill=primary)
draw.text((card_x + 78, card_y + 307), "Shop Now", font=font_button, fill="white")
draw.rounded_rectangle((card_x + 54, card_y + 224, card_x + 236, card_y + 242), radius=9, fill=(15, 23, 42, 35))
draw.rounded_rectangle((card_x + 54, card_y + 256, card_x + 192, card_y + 274), radius=9, fill=(15, 23, 42, 25))

# Stylized imported product silhouette
ix, iy = card_x + 60, card_y + 44
draw.rounded_rectangle((ix + 48, iy, ix + 92, iy + 46), radius=14, fill=secondary)
draw.line((ix + 22, iy + 30, ix + 22, iy + 94), fill=secondary, width=10)
draw.line((ix + 118, iy + 30, ix + 118, iy + 94), fill=secondary, width=10)
draw.line((ix + 22, iy + 94, ix + 8, iy + 114), fill=secondary, width=10)
draw.line((ix + 118, iy + 94, ix + 132, iy + 114), fill=secondary, width=10)
draw.rounded_rectangle((ix + 36, iy + 54, ix + 104, iy + 118), radius=18, fill=secondary)
draw.ellipse((ix + 52, iy + 58, ix + 88, iy + 94), fill=secondary)
draw.rounded_rectangle((ix + 6, iy + 30, ix + 144, iy + 62), radius=16, fill=primary)

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT_PATH, format="PNG", optimize=True)
print(f"Generated {OUTPUT_PATH}")
