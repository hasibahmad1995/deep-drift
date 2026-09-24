"""Screenshot and test harness (Playwright + software WebGL).
Serves three.js from node_modules (run `npm install` first) and applies a strict page policy like the real host.
Usage: python3 tests/shot.py 3 30 90     (takes screenshots at those dive times in seconds)"""
import sys, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = ROOT + "/dist/index.html"
url = "file://" + DIST + "?still"
NM = ROOT + "/node_modules/three/"
def route(r):
    u=r.request.url
    if u.startswith("file:") and "deep-drift-dive.html" in u:
        r.fulfill(body=open(DIST).read(),content_type="text/html",headers={"Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src 'none'"})
    elif u.endswith("build/three.min.js"): r.fulfill(path=NM+"build/three.min.js",content_type="application/javascript")
    elif u.endswith("loaders/GLTFLoader.js"): r.fulfill(path=NM+"examples/js/loaders/GLTFLoader.js",content_type="application/javascript")
    elif "fonts.g" in u: r.abort()
    else: r.continue_()
def run(times, w=900, h=540, out="/tmp/dd_shot_", wait=1500, extra=None):
    with sync_playwright() as p:
        b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
        pg=b.new_page(viewport={"width":w,"height":h}); errs=[]
        pg.on("console",lambda m: errs.append(m.type+": "+m.text[:300]) if m.type in("error","warning") else None)
        pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)[:400]))
        pg.route("**/*",route)
        pg.goto(url)
        pg.wait_for_function("document.getElementById('btnBegin') && !document.getElementById('btnBegin').disabled",timeout=90000)
        pg.click("#btnBegin"); pg.evaluate("state.playing=false; window.__hold=true")
        for i,t in enumerate(times):
            pg.evaluate(f"state.t={t}; U.time.value=5; for(let i=0;i<3;i++) step(0.03)"); pg.wait_for_timeout(300)
            pg.locator("#gl").screenshot(path=f"{out}{i}.png", timeout=200000)
        if extra: print(extra(pg))
        print("ERRORS:",errs[:12])
        b.close()
if __name__=="__main__":
    run([float(x) for x in sys.argv[1:]])
