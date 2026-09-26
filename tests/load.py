"""Measures how the page loads over a real-world connection, as a first-time visitor sees it:
when something first appears on screen, when the title is readable, when Begin can be pressed, and how much is
downloaded in how many requests. The connection is slowed to a typical mobile/home speed (like "Fast 4G").
Usage: python tests/load.py [--dist | --cloudlike]
  --dist: the publish folder dist/ through the plain local server (no compression)
  --cloudlike: dist/ compressed like Cloudflare does (start node tests/cloudlike_server.mjs first)
Needs the local server running (npm start): the page must come over a real connection for the slow-down to apply.
Note: the local server does not compress files; Cloudflare does (text files shrink to about a quarter), so real
downloads are smaller than shown here."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright
import shot

DIST = "--dist" in sys.argv
CLOUDLIKE = "--cloudlike" in sys.argv   # dist/ served compressed by tests/cloudlike_server.mjs (start it first)
URL = "http://localhost:8091/index.html" if CLOUDLIKE else "http://localhost:8080/" + ("dist/index.html" if DIST else "index.html")
# about 9 Mbit/s down, 1.5 Mbit/s up, 150 ms round trip
NET = dict(offline=False, latency=150, downloadThroughput=9e6 / 8, uploadThroughput=1.5e6 / 8)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(args=shot.GL_ARGS)
        pg = b.new_page(viewport={"width": 1280, "height": 760}); errs = []; sizes = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.on("response", lambda r: sizes.append(r.url))
        cdp = pg.context.new_cdp_session(pg)
        cdp.send("Network.enable"); cdp.send("Network.emulateNetworkConditions", NET)
        got = {"bytes": 0}
        cdp.on("Network.loadingFinished", lambda e: got.__setitem__("bytes", got["bytes"] + e.get("encodedDataLength", 0)))
        t0 = time.time(); pg.goto(URL, wait_until="commit")
        pg.wait_for_selector("#siteName", state="visible", timeout=120000)
        title_s = None
        while time.time() - t0 < 120:   # the title counts as readable once it has text and the font is ready
            if pg.evaluate("document.getElementById('siteName').textContent.trim().length > 0 && document.fonts.status === 'loaded'"):
                title_s = time.time() - t0; break
            pg.wait_for_timeout(50)
        pg.wait_for_selector("#btnBegin:not([disabled])", timeout=300000)
        ready_s = time.time() - t0
        fcp = pg.evaluate("(performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || -1")
        print(("dist/ compressed like Cloudflare" if CLOUDLIKE else "dist/ (publish folder)" if DIST else "project folder (development)") + ", slowed to about 9 Mbit/s, 150 ms")
        print(f"  first thing on screen:   {fcp / 1000:.2f} s")
        print(f"  title readable:          {title_s:.2f} s")
        print(f"  Begin can be pressed:    {ready_s:.2f} s")
        boot = pg.evaluate("STARTUP.bootAt") / 1000
        print(f"  code downloaded, started: {boot:.2f} s   (the rest is building the world and preparing the graphics card)")
        print("  building steps (ms):", ", ".join(f"{a.strip()} {b}" for a, b in pg.evaluate("STARTUP.steps")))
        print(f"  requests: {len(sizes)}, downloaded about {got['bytes'] / 1024:.0f} KB")
        print("  errors:", errs[:4])
        b.close()

if __name__ == "__main__":
    main()
