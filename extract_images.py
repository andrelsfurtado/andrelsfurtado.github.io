import re
import base64
import os
import sys
from io import BytesIO
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

HTML_FILE = "index.html"
IMG_DIR = "imagens"

os.makedirs(IMG_DIR, exist_ok=True)

with open(HTML_FILE, "r", encoding="utf-8") as f:
    html = f.read()

pattern = re.compile(r'data:image/(png|jpeg|jpg|gif|svg\+xml|webp);base64,([A-Za-z0-9+/=]+)')
matches = list(pattern.finditer(html))

print(f"Encontradas {len(matches)} imagens base64")

replacements = []
counters = {}

for match in matches:
    mime_type = match.group(1)
    b64_data = match.group(2)
    full_data_uri = match.group(0)

    ext_map = {"png": "png", "jpeg": "jpg", "jpg": "jpg", "gif": "gif", "webp": "webp", "svg+xml": "svg"}
    original_ext = ext_map.get(mime_type, "png")

    counters[original_ext] = counters.get(original_ext, 0) + 1
    img_name = f"img_{original_ext}_{counters[original_ext]:02d}.webp"

    if mime_type == "svg+xml":
        svg_name = f"img_svg_{counters.get('svg+xml', 1):02d}.svg"
        img_path = os.path.join(IMG_DIR, svg_name)
        with open(img_path, "wb") as f:
            f.write(base64.b64decode(b64_data))
        print(f"  SVG salvo: {img_path}")
        replacements.append((full_data_uri, f"imagens/{svg_name}"))
        continue

    try:
        img_data = base64.b64decode(b64_data)
        img = Image.open(BytesIO(img_data))
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        img_path = os.path.join(IMG_DIR, img_name)
        img.save(img_path, "WEBP", quality=85)
        size_kb = os.path.getsize(img_path) / 1024
        orig_kb = len(b64_data) * 3 / 4 / 1024
        print(f"  {img_name}: {orig_kb:.0f}KB -> {size_kb:.0f}KB WebP")
        replacements.append((full_data_uri, f"imagens/{img_name}"))
    except Exception as e:
        print(f"  Erro ao converter imagem: {e}")

for old, new in replacements:
    html = html.replace(old, new)

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\nHTML atualizado. {len(replacements)} imagens substituidas.")
