"""Makes the folder to publish: dist/ holds only the files a visitor needs.
Run:  python tools/build.py
Later this is where shrinking (minifying) the code would go. For now it copies the site files as they are."""
import pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SITE = ["index.html", "styles", "src", "vendor", "assets"]   # everything else (tests, tools, docs) stays out

def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for name in SITE:
        src = ROOT / name
        (shutil.copytree if src.is_dir() else shutil.copy)(src, DIST / name)
    size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    print("wrote", DIST, round(size / 1024), "KB")

if __name__ == "__main__":
    main()
