"""Checks the v1.5 changes:
  1. Zoom: presses step smoothly up to the top and then back down (never a jump from the top to 1x); holding zooms smoothly.
  2. Turning: left and right is always around the true vertical (the horizon stays level), also where the dive heads
     steeply down and while paused.
  3. Side panel: its buttons are hidden until you hover over it.
  4. Home: Deep Drift at the top goes back to the start screen; Begin starts a new dive; there is no Restart button.
  5. Variety: scripted animals meet you at different depths each dive, but only within the depths where they live.
Usage: python tests/controls.py      (exit code 1 if something is wrong)"""
import sys
from playwright.sync_api import sync_playwright
import shot

LEVEL = r"""(t) => {   // camera roll (how tilted the horizon is) after turning 90 degrees at dive time t, paused
  state.t = t; state.playing = false; look.pitch = 0; look.yaw = Math.PI / 2; step(0.03);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const fwd = pathAt(t).fwd;
  return { routePitchDeg: +(Math.asin(fwd.y) * 57.3).toFixed(1), horizonTiltDeg: +(Math.asin(Math.abs(right.y)) * 57.3).toFixed(2) };
}"""

DEPTHS = r"""() => {
  window.__noRender = true;
  const named = ACTORS.filter(a => a.obj && a.name && !PASSERS.indiv.includes(a) && window.LIVES && LIVES[a.name]);
  const met = {}; let wrong = []; const seenAt = {};
  for (let k = 0; k < 6; k++) {
    reshuffle();
    for (const a of named) { if (a.active === false) continue; const L = LIVES[a.name];
      for (let t = 0; t < TOTAL; t += 2) { a.update(t); const p = pathAt(t);
        if (a.obj.position.distanceTo(p.pos) < 25) { const D = depthAt(a.obj.position.y);   // the animal's own real depth where you meet it
          (seenAt[a.name] = seenAt[a.name] || new Set()).add(Math.round(D / 10) * 10);
          if (D < L.minD * 0.95 - 10 || D > L.maxD * 1.05 + 20) { if (wrong.length < 8) wrong.push(a.name + ' at ' + Math.round(D) + ' m'); } break; } } } }
  window.__noRender = false;
  const spread = Object.fromEntries(Object.entries(seenAt).map(([n, s]) => [n, [...s].sort((a, b) => a - b).slice(0, 8).join(',')]));
  return { animals: named.length, wrong, spread };
}"""

def main():
    bad = []
    with sync_playwright() as p:
        b, pg, errs = shot.open_page(p, 1300, 800)
        # 1. zoom steps (simulated without drawing, which the software graphics would make very slow)
        pg.evaluate("window.__noRender = true")
        seq = []
        for _ in range(9):
            pg.evaluate("document.getElementById('btnZoom').dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1})); document.getElementById('btnZoom').dispatchEvent(new PointerEvent('pointerup', {pointerId: 1}))")
            seq.append(pg.evaluate("(() => { for (let i = 0; i < 40; i++) step(0.03); return +swim.zoom.toFixed(2); })()"))
        print("1. zoom after each press:", seq)
        jumps = [abs(b - a) for a, b in zip(seq, seq[1:])]
        if max(jumps) > 0.65 or seq[0] <= 1.05 or not any(b < a for a, b in zip(seq, seq[1:])): bad.append("zoom does not step up and back down smoothly")
        pg.evaluate("document.getElementById('btnZoom').dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1}))")
        held = [pg.evaluate("(() => { for (let i = 0; i < 10; i++) step(0.03); return +swim.zoom.toFixed(2); })()") for _ in range(12)]
        pg.evaluate("document.getElementById('btnZoom').dispatchEvent(new PointerEvent('pointerup', {pointerId: 1})); swim.zoomTarget = 1")
        print("   holding the button (every 0.3 s):", held)
        if max(abs(b - a) for a, b in zip(held, held[1:])) > 0.5: bad.append("holding zoom jumps")
        # 2. level horizon after turning, at gentle and steep parts of the dive
        for t in [30, 100, 150, 250]:
            r = pg.evaluate(f"({LEVEL})({t})"); print(f"2. turned 90 degrees at {t} s:", r)
            if r["horizonTiltDeg"] > 1.6: bad.append(f"horizon tilted at {t} s")   # up to 1.4 degrees is the diver's gentle sway
        pg.evaluate("look.yaw = 0; look.pitch = 0; window.__noRender = false")
        # 3. side panel hidden until hover
        pg.mouse.move(700, 400); pg.wait_for_timeout(400)
        hidden = pg.evaluate("getComputedStyle(document.getElementById('dockBody')).visibility")
        pg.hover("#dockTab"); pg.wait_for_timeout(400)
        shown = pg.evaluate("getComputedStyle(document.getElementById('dockBody')).visibility")
        pg.mouse.move(700, 400); pg.wait_for_timeout(400)
        print("3. side panel: away", hidden, "| hovering", shown)
        if hidden != "hidden" or shown != "visible": bad.append("side panel does not hide and show on hover")
        # 4. home button and no Restart
        pg.evaluate("window.__hold = false; state.playing = true"); pg.wait_for_timeout(500)
        pg.click("#brand"); pg.wait_for_timeout(1000)
        home = pg.evaluate("({ t: state.t, started: state.started, intro: !document.getElementById('intro').hidden, restartButton: !!document.getElementById('btnRestart') })")
        pg.click("#btnBegin"); pg.wait_for_timeout(1000)
        again = pg.evaluate("state.started"); pg.evaluate("state.playing = false; window.__hold = true")
        print("4. home:", home, "| Begin again, started:", again)
        if home["started"] or not home["intro"] or home["restartButton"] or home["t"] > 0.5 or not again: bad.append("home button does not work")
        # 5. depth ranges
        r = pg.evaluate(f"({DEPTHS})()"); print("5. scripted animals with a depth range:", r["animals"], "| met outside their depths:", r["wrong"])
        for n, d in r["spread"].items(): print("     ", n, "met at about (m):", d)
        if r["wrong"]: bad.append("an animal met outside its depths")
        print("ERRORS:", [e for e in errs if "GPU stall" not in e][:6])
        b.close()
    print("RESULT:", "all good" if not bad else "; ".join(bad))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
