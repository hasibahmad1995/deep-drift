"""Screenshot and test harness (Playwright + software WebGL).
The site is served from a made-up web address (BASE) that this script answers itself from the project folder,
with a strict page policy like a careful real host: only our own files may run or load.
Usage: python tests/shot.py 3 30 90     (takes screenshots at those dive times in seconds, into tests/out/)"""
import sys, pathlib, mimetypes
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / "out"          # screenshots go here (ignored by git)
OUT.mkdir(exist_ok=True)
SITE = "https://deep-drift.test/"
BASE = SITE + "index.html"
URL = BASE + "?still"
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; "
       "img-src 'self' data: blob:; connect-src 'self' data: blob:")
TYPES = {".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".webp": "image/webp"}
GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]

def route(r):
    u = r.request.url
    if not u.startswith(SITE):
        r.abort(); return   # nothing from other sites may load
    rel = u[len(SITE):].split("?")[0].split("#")[0] or "index.html"
    f = (ROOT / rel).resolve()
    if ROOT not in f.parents or not f.is_file():
        r.fulfill(status=404, body="not found"); return
    ctype = TYPES.get(f.suffix) or mimetypes.guess_type(f.name)[0] or "application/octet-stream"
    headers = {"Content-Security-Policy": CSP} if f.suffix == ".html" else {}
    r.fulfill(path=str(f), content_type=ctype, headers=headers)

def open_page(p, w=900, h=540, url=URL):
    """Launches the browser, opens the dive and presses Begin. Returns (browser, page, errors)."""
    b = p.chromium.launch(args=GL_ARGS)
    pg = b.new_page(viewport={"width": w, "height": h}); errs = []
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text[:300]) if m.type in ("error", "warning") and "ERR_FAILED" not in m.text else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERR " + str(e)[:400]))
    pg.route("**/*", route)
    pg.goto(url)
    try:
        pg.wait_for_selector("#btnBegin:not([disabled])", timeout=60000)   # wait_for_function would need eval, which the page policy blocks
    except Exception:
        b.close()
        raise SystemExit("The page never became ready. Page errors:\n  " + "\n  ".join(errs[:15]))
    pg.click("#btnBegin"); pg.evaluate("state.playing=false; window.__hold=true")
    return b, pg, errs

def run(times, w=900, h=540, out=str(OUT / "dd_shot_"), extra=None):
    with sync_playwright() as p:
        b, pg, errs = open_page(p, w, h)
        for i, t in enumerate(times):
            pg.evaluate(f"state.t={t}; U.time.value=5; for(let i=0;i<3;i++) step(0.03)"); pg.wait_for_timeout(300)
            pg.locator("#gl").screenshot(path=f"{out}{i}.png", timeout=200000)
        if extra: print(extra(pg))
        print("ERRORS:", errs[:12])
        b.close()

if __name__ == "__main__":
    run([float(x) for x in sys.argv[1:]])
