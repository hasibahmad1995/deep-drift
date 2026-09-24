"""Copies the three.js files the site needs from node_modules/three into vendor/three/.
Run after changing the three.js version:  python tools/vendor_three.py
Add-ons (like the model loader) normally import the bare name 'three', which needs an import map.
Here that import is rewritten to a relative path, so the site needs no import map and no inline script."""
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules" / "three"
OUT = ROOT / "vendor" / "three"
ADDONS = ["loaders/GLTFLoader.js"]   # paths inside three's examples/jsm folder

def main():
    version = json.loads((SRC / "package.json").read_text(encoding="utf-8"))["version"]
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "addons").mkdir(parents=True)
    shutil.copy(SRC / "build" / "three.module.js", OUT / "three.module.js")
    shutil.copy(SRC / "LICENSE", OUT / "LICENSE")
    for a in ADDONS:
        dst = OUT / "addons" / a
        dst.parent.mkdir(parents=True, exist_ok=True)
        depth = len(pathlib.PurePosixPath("addons/" + a).parts) - 1
        code = (SRC / "examples" / "jsm" / a).read_text(encoding="utf-8")
        code = re.sub(r"from\s+'three'", f"from '{'../' * depth}three.module.js'", code)
        dst.write_bytes(code.encode("utf-8"))
    (OUT / "VERSION").write_text(version + "\n", encoding="utf-8")
    print("vendored three", version, "into", OUT)

if __name__ == "__main__":
    main()
