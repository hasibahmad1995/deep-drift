"""Copies the three.js files the site needs from node_modules/three into vendor/three/.
Run after changing the three.js version:  python tools/vendor_three.py
- The core (three.module.js and, from r160 on, three.core.js which it imports).
- The add-ons listed in ADDONS, plus any add-on files they import (followed automatically).
Add-ons normally import the bare name 'three', which needs an import map. Here that import is rewritten
to a relative path, so the site needs no import map and no inline script."""
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules" / "three"
OUT = ROOT / "vendor" / "three"
ADDONS = ["loaders/GLTFLoader.js"]   # paths inside three's examples/jsm folder
IMPORT = re.compile(r"""(from\s+|import\s+)(['"])([^'"]+)\2""")

def normalise(rel):
    """utils/../loaders/x.js -> loaders/x.js"""
    parts = []
    for p in rel.replace("\\", "/").split("/"):
        if p == "..": parts.pop()
        elif p not in (".", ""): parts.append(p)
    return "/".join(parts)

def copy_addon(rel, done):
    rel = normalise(rel)
    if rel in done:
        return
    done.add(rel)
    code = (SRC / "examples" / "jsm" / rel).read_text(encoding="utf-8")
    depth = len(pathlib.PurePosixPath(rel).parts) - 1
    def fix(m):
        spec = m.group(3)
        if spec == "three":
            return f"{m.group(1)}'{'../' * (depth + 1)}three.module.js'"
        if spec.startswith("."):   # another add-on file: copy it too
            copy_addon(str(pathlib.PurePosixPath(rel).parent / spec), done)
        return m.group(0)
    code = IMPORT.sub(fix, code)
    dst = OUT / "addons" / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(code.encode("utf-8"))

def main():
    version = json.loads((SRC / "package.json").read_text(encoding="utf-8"))["version"]
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for name in ["three.module.js", "three.core.js"]:
        if (SRC / "build" / name).exists():
            shutil.copy(SRC / "build" / name, OUT / name)
    shutil.copy(SRC / "LICENSE", OUT / "LICENSE")
    done = set()
    for a in ADDONS:
        copy_addon(a, done)
    (OUT / "VERSION").write_bytes((version + "\n").encode("utf-8"))
    print("vendored three", version, "into", OUT, "with add-ons:", ", ".join(sorted(done)))

if __name__ == "__main__":
    main()
