"""Screenshot and test harness (Playwright + software WebGL).
Serves three.js from node_modules (run `npm install` first) and applies a strict page policy like the real host.
The page is served from a made-up web address (BASE) that this script answers itself, because Playwright
cannot intercept file:// pages, so the policy header would never be applied to them.
Usage: python tests/shot.py 3 30 90     (takes screenshots at those dive times in seconds, into tests/out/)"""
import sys, os, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist" / "index.html"
NM = ROOT / "node_modules" / "three"
OUT = ROOT / "tests" / "out"          # screenshots go here (ignored by git)
OUT.mkdir(exist_ok=True)
BASE = "https://deep-drift.test/index.html"
URL = BASE + "?still"
CSP = ("default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src data:; connect-src 'none'")
GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]

def route(r):
    u = r.request.url
    if u.startswith(BASE):
        r.fulfill(body=DIST.read_text(encoding="utf-8"), content_type="text/html", headers={"Content-Security-Policy": CSP})
    elif u.endswith("build/three.min.js"): r.fulfill(path=str(NM / "build/three.min.js"), content_type="application/javascript")
    elif u.endswith("loaders/GLTFLoader.js"): r.fulfill(path=str(NM / "examples/js/loaders/GLTFLoader.js"), content_type="application/javascript")
    else: r.abort()   # nothing else may load (fonts are optional and fall back quietly)

def open_page(p, w=900, h=540, url=URL):
    """Launches the browser, opens the dive and presses Begin. Returns (browser, page, errors)."""
    b = p.chromium.launch(args=GL_ARGS)
    pg = b.new_page(viewport={"width": w, "height": h}); errs = []
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text[:300]) if m.type in ("error", "warning") and "ERR_FAILED" not in m.text else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERR " + str(e)[:400]))
    pg.route("**/*", route)
    pg.goto(url)
    pg.wait_for_selector("#btnBegin:not([disabled])", timeout=180000)   # wait_for_function would need eval, which the page policy blocks
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
