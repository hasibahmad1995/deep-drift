"""Measures how the page opens: how long until Begin can be pressed, the longest freeze while loading,
and how smooth the first seconds of the dive are. Software WebGL is much slower than a real graphics card,
so compare numbers between versions on the same machine rather than reading them as real times.
Usage: python tests/startup.py [seconds of dive to watch, default 6] [--gpu]
  --gpu: use this computer's real graphics card instead of the slow software one (numbers close to what a visitor sees).
  --screen=1536x790@1.25: page size and pixel ratio (Windows scaling 125%); default 1000x640@1."""
import sys, time
from playwright.sync_api import sync_playwright
import shot

# Watches the gaps between frames from the very start (before our code runs). A long gap is a freeze.
WATCH = """
window.__gaps = []; let lastF = performance.now();
const tick = now => { const r = window.renderer; window.__gaps.push([Math.round(now), Math.round(now - lastF), r ? r.info.programs.length : 0, r ? r.info.memory.textures : 0, r ? r.info.memory.geometries : 0, window.display ? display.pixelRatio : 0, window.state ? +state.t.toFixed(2) : 0]); lastF = now; requestAnimationFrame(tick); };
requestAnimationFrame(tick);
"""

def worst(gaps, a, b):
    g = [d for (t, d, *_) in gaps if a <= t <= b]
    if not g: return "no frames"
    g.sort()
    return f"{len(g)} frames, longest freeze {g[-1]} ms, 2nd {g[-2] if len(g) > 1 else 0} ms, middle {g[len(g)//2]} ms"

FREEZE = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--freeze=")), "500"))   # ms: list hitches longer than this
REAL_GPU = ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]

def main(watch_s=6.0, gpu=False, w=1000, h=640, dpr=1.0):
    with sync_playwright() as p:
        b = p.chromium.launch(args=REAL_GPU if gpu else shot.GL_ARGS)
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=dpr); errs = []
        pg.set_default_timeout(180000)
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.on("console", lambda m: errs.append(m.text[:200]) if m.type == "error" and "ERR_FAILED" not in m.text else None)
        pg.add_init_script(WATCH)
        pg.route("**/*", shot.route)
        t0 = time.time(); pg.goto(shot.BASE)
        pg.wait_for_selector("#btnBegin:not([disabled])", timeout=300000)
        ready_s = time.time() - t0
        info = pg.evaluate("window.STARTUP ? {boot: STARTUP.bootAt, ready: STARTUP.readyAt, steps: STARTUP.steps} : null")
        begin = pg.evaluate("performance.now()")
        pg.click("#btnBegin"); pg.wait_for_timeout(int(watch_s * 1000))
        gaps = pg.evaluate("window.__gaps")
        print(f"Begin ready after {ready_s:.1f} s (wall clock)")
        if info:
            print(f"our code started at {info['boot']} ms, ready at {info['ready']} ms")
            for label, ms in info["steps"]: print(f"  {label:<28}{ms:>7} ms")
        print("while loading:", worst(gaps, 0, begin))
        print(f"first {watch_s:g} s of the dive:", worst(gaps, begin + 300, begin + watch_s * 1000))
        big = [(t - round(begin), d, f"programs {pr} textures {tx} shapes {ge} pixel ratio {px:.2f} dive t {dt}") for (t, d, pr, tx, ge, px, dt) in gaps if d > FREEZE]
        print(f"freezes over {FREEZE} ms (ms after Begin, length, graphics card counts):")
        for row in big: print("  ", row)
        print("  counts at the end:", gaps[-1][2:])
        late = pg.evaluate("renderer.info.programs.filter(p => !STARTUP.warmPrograms.includes(p.id)).map(p => p.name + ' ' + p.cacheKey.slice(-90))")
        print(f"shader programs built after the warm-up (each one is a small freeze): {len(late)}")
        for n in late: print("   ", n)
        print("dive t reached:", round(pg.evaluate("state.t"), 1), " pixel ratio:", pg.evaluate("display.pixelRatio"))
        print("errors:", errs[:6])
        b.close()

if __name__ == "__main__":
    nums = [a for a in sys.argv[1:] if not a.startswith('--')]
    scr = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--screen=')), '1000x640@1')
    size, dpr = scr.split('@'); w, h = size.split('x')
    main(float(nums[0]) if nums else 6.0, '--gpu' in sys.argv, int(w), int(h), float(dpr))
