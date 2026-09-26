"""Makes the folder to publish: dist/ holds only the files a visitor needs.
Run:  python tools/build.py          (Cloudflare Pages runs this too, then publishes dist/)

It also writes _headers, which tells Cloudflare and browsers what returning visitors may keep for a day: the 3D
library, the fish model and the fonts, so a second visit loads mostly from the visitor's own computer. The page and our
own code are always checked for a newer version.
(A list of early downloads, <link rel="modulepreload">, was tried and measured with tests/load.py --cloudlike: no gain,
because the files are already found quickly. So it was left out to keep this simple.)"""
import pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SITE = ["index.html", "styles", "src", "vendor", "assets"]   # everything else (tests, tools, docs) stays out
HEADERS = """/vendor/*
  Cache-Control: public, max-age=86400
/assets/*
  Cache-Control: public, max-age=86400
"""   # one rule per folder: when two rules match a file, Cloudflare joins their headers

def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for name in SITE:
        src = ROOT / name
        (shutil.copytree if src.is_dir() else shutil.copy)(src, DIST / name)
    (DIST / "_headers").write_bytes(HEADERS.encode("utf-8"))
    size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    print("wrote", DIST, round(size / 1024), "KB")

if __name__ == "__main__":
    main()
