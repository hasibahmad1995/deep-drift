from playwright.sync_api import sync_playwright
import shot
def go(p, name, **ctx):
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    c=b.new_context(**ctx); pg=c.new_page(); errs=[]
    pg.on("pageerror",lambda e: errs.append(str(e)[:200])); pg.on("console",lambda m: errs.append(m.text[:200]) if m.type=="error" and "ERR_FAILED" not in m.text else None)
    pg.route("**/*",shot.route); pg.goto("file://"+shot.DIST+"?still")
    pg.wait_for_function("!document.getElementById('btnBegin').disabled",timeout=90000)
    pg.click("#btnBegin"); pg.evaluate("state.playing=false; window.__hold=true; state.t=30; step(0.03)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"/tmp/dd_{name}_a.png",timeout=200000)
    if not pg.locator("#btnMenu").is_hidden():
        pg.click("#btnMenu"); pg.wait_for_timeout(300); pg.screenshot(path=f"/tmp/dd_{name}_b.png",timeout=200000)
        pg.click("#btnBlog")
    else:
        pg.click("#btnBlog")
    pg.wait_for_timeout(300); pg.click("#cards .card:nth-child(2) button"); pg.screenshot(path=f"/tmp/dd_{name}_c.png",timeout=200000)
    print(name,"errors:",errs[:4]); b.close()
with sync_playwright() as p:
    go(p,"phone",viewport={"width":390,"height":800},has_touch=True,is_mobile=True,device_scale_factor=2)
    go(p,"desk",viewport={"width":1100,"height":650})
