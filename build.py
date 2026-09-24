"""Builds dist/index.html from the files in src/ and assets/.
Run:  python build.py
The page is one self-contained file. Order matters: head.html, then the fish data, then the scripts."""
import base64, json, pathlib
root = pathlib.Path(__file__).parent
src, assets = root / "src", root / "assets"
geo = base64.b64encode((assets / "barra_geo.glb").read_bytes()).decode()
tex = (assets / "barra_tex.json").read_text(encoding="utf-8").strip()
parts = [(src / "head.html").read_text(encoding="utf-8"),
         f"const BARRA_GEO_B64 = '{geo}'; const BARRA_TEX = {tex};\n"]
for name in ["core.js", "life.js", "world.js", "posts.js", "run.js"]:
    parts.append((src / name).read_text(encoding="utf-8"))
parts.append("\n</script>\n</body>\n</html>\n")
out = root / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_bytes("".join(parts).encode("utf-8"))   # bytes, so Windows does not change the line endings
print("wrote", out, round(out.stat().st_size / 1024), "KB")
