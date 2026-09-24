from playwright.sync_api import sync_playwright
import shot
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={"width":1000,"height":640}); errs=[]
    pg.on("pageerror",lambda e: errs.append(str(e)[:200])); pg.on("console",lambda m: errs.append(m.text[:200]) if m.type=="error" else None)
    pg.route("**/*",shot.route); pg.goto(shot.BASE)
    pg.wait_for_function("!document.getElementById('btnBegin').disabled",timeout=180000)
    pg.click("#btnBegin"); pg.wait_for_timeout(8000)
    pg.click("#btnMusic"); pg.wait_for_timeout(1500)
    pg.click("#btnPause"); a=pg.evaluate("state.t"); pg.wait_for_timeout(1500); b2=pg.evaluate("state.t")
    pg.click("#btnRestart"); pg.wait_for_timeout(800)
    print("t after 8s:",round(a,1),"paused delta:",round(b2-a,3),"restart t:",round(pg.evaluate("state.t"),2),"music:",pg.evaluate("music.on"),"pixelRatio:",pg.evaluate("pixelRatio"))
    print("errors:",[e for e in errs if 'ERR_FAILED' not in e][:5]); b.close()
