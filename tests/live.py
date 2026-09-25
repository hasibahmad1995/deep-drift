from playwright.sync_api import sync_playwright
import shot
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={"width":1000,"height":640}); errs=[]
    pg.set_default_timeout(90000)   # the software renderer used in tests can be slow to answer clicks while the dive plays
    pg.on("pageerror",lambda e: errs.append(str(e)[:200])); pg.on("console",lambda m: errs.append(m.text[:200]) if m.type=="error" else None)
    pg.route("**/*",shot.route); pg.goto(shot.BASE)
    pg.wait_for_selector("#btnBegin:not([disabled])",timeout=180000)
    pg.click("#btnBegin"); pg.wait_for_timeout(8000)
    pg.hover("#dockTab"); pg.wait_for_timeout(400)   # the side panel opens on hover
    pg.click("#btnMusic"); pg.wait_for_timeout(1500)
    pg.click("#btnPause"); a=pg.evaluate("state.t"); pg.wait_for_timeout(1500); b2=pg.evaluate("state.t")
    pg.click("#brand"); pg.wait_for_timeout(1200)   # home: back to the start screen
    home = pg.evaluate("[state.t, state.started, !document.getElementById('intro').hidden]")
    pg.click("#btnBegin"); pg.wait_for_timeout(1500)
    print("t after 8s:",round(a,1),"paused delta:",round(b2-a,3),"home (t, started, intro shown):",home,"started again:",pg.evaluate("state.started"),"music:",pg.evaluate("music.on"),"pixelRatio:",pg.evaluate("display.pixelRatio"))
    print("errors:",[e for e in errs if 'ERR_FAILED' not in e][:5]); b.close()
