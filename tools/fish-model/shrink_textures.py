"""Turns the three fish pictures (kept in barra_tex_source.json as 1024 x 1024 JPEGs) into small real image files in assets/.
Real files (not text inside a JSON file) are smaller and can be fetched by the browser while the code is still arriving.
Run:  python tools/fish-model/shrink_textures.py [size]      (default 512; needs Pillow: python -m pip install pillow)
The pictures are: colour (the skin), normal (the small bumps), orm (occlusion, roughness, metal packed in one picture)."""
import base64, io, json, pathlib, re, sys
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent.parent / "assets"
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 512
QUALITY = {"color": 84, "normal": 92, "orm": 88}   # the bump picture is the most sensitive to compression

def main():
    data = json.loads((HERE / "barra_tex_source.json").read_text())
    total = 0
    for name, uri in data.items():
        raw = base64.b64decode(re.match(r"data:image/\w+;base64,(.*)", uri, re.S).group(1))
        im = Image.open(io.BytesIO(raw)).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
        out = ASSETS / f"barra_{name}.webp"
        im.save(out, "WEBP", quality=QUALITY[name], method=6)
        total += out.stat().st_size
        print(f"{out.name}: {out.stat().st_size // 1024} KB")
    print(f"total {total // 1024} KB (was {sum(len(v) for v in data.values()) // 1024} KB as text)")

if __name__ == "__main__":
    main()
