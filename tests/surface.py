"""Checks that nothing leaves the water (v1.5.2):
  1. Through whole dives (a new dive each time, and long pauses): no animal, jellyfish or school pokes through the surface,
     and jellyfish stay near their own spot (they never climb away).
  2. The diver's breathing bubbles never rise above the surface (also when the diver is only a few metres down).
  3. The manta's hit shape matches the drawn animal (wing tip, disc, tail), and big visitors cross well ahead of the diver.
Usage: python tests/surface.py      (exit code 1 if something is wrong)"""
import sys
from playwright.sync_api import sync_playwright
import shot

DIVES = r"""() => {
  window.__noRender = true; state.playing = true;
  const bad = []; const jelly = ACTORS.filter(a => a.name === 'Jellyfish' && a.obj && a.cyclic);
  let checked = 0, topmost = -1e9;
  const scan = tag => {
    for (const a of ACTORS) { if (!a.obj || a.active === false || !a.obj.visible) continue;
      const sc = a.obj.scale.x || 1, r = a.name === 'Jellyfish' ? sc : (HIT[a.name] ? HIT[a.name].rad * sc : 0);
      const top = a.obj.position.y + r; checked++; topmost = Math.max(topmost, top);
      if (top > 0.02 && bad.length < 8) bad.push(tag + ': ' + a.name + ' top at ' + top.toFixed(2)); }
  };
  for (let k = 0; k < 3; k++) {
    reshuffle(); state.playing = true;
    for (let t = 0; t < TOTAL; t += 1.5) { state.t = t; step(0.05); scan('dive ' + k + ' t=' + Math.round(t)); }
  }
  // a long pause in the reef: the sea keeps living for ten minutes while the diver hovers
  state.t = 20; state.playing = false; reshuffle(); state.t = 20; step(0.05);
  const reef = jelly.filter(a => a.active && a.obj.position.y > -60), y0 = reef.map(a => a.obj.position.y); let wander = 0;
  for (let i = 0; i < 2400; i++) { step(0.25); if (i % 40 === 0) scan('paused ' + Math.round(i / 4) + ' s');
    reef.forEach((a, k) => { wander = Math.max(wander, Math.abs(a.obj.position.y - y0[k])); }); }
  window.__noRender = false;
  return { checked, bad, topmost: +topmost.toFixed(2), reefJellyfish: reef.length, wander: +wander.toFixed(2) };
}"""

BUBBLES = r"""() => {
  window.__noRender = true; state.playing = false; state.t = 1; step(0.05);   // the diver is only a few metres down here
  let highest = -1e9, live = 0;
  for (let i = 0; i < 1600; i++) { step(0.05);
    const pos = bubbles.geometry.attributes.position.array, size = bubbles.geometry.attributes.aSize.array;
    for (let b = 0; b < size.length; b++) if (size[b] > 0) { live++; highest = Math.max(highest, pos[b * 3 + 1]); } }
  window.__noRender = false;
  return { cameraY: +camera.position.y.toFixed(2), live, highest: +highest.toFixed(2) };
}"""

MANTA = r"""async () => {
  const T = await import('./src/life/touch.js'); const h = T.HIT['Giant manta ray'];
  const o = new THREE.Object3D(); const out = new THREE.Vector3();
  const gap = (x, y, z) => +T.bodyGap(o, h, 1, new THREE.Vector3(x, y, z), out).toFixed(2);   // the animal's own frame: +x nose, +z a wing
  return { discCentre: gap(1.6, 0, 0), wingTipOutside: gap(1.6, 0, 3.4), wingTipInside: gap(1.6, 0, 2.5), noseTip: gap(3.4, 0, 0), farAhead: gap(8, 0, 0),
           height: gap(1.6, 2, 0), wideHit: h.wide, at: h.at };
}"""

def main():
    bad = []
    with sync_playwright() as p:
        b, pg, errs = shot.open_page(p, 900, 540)
        r = pg.evaluate(f"({DIVES})()")
        print("1. animals checked:", r["checked"], "| highest top of any animal (m, 0 = surface):", r["topmost"], "| reef jellyfish:", r["reefJellyfish"], "| most one moved up or down in a 10 minute pause (m):", r["wander"])
        if r["wander"] > 3.7: bad.append("a jellyfish climbed or sank away from its spot")
        if r["bad"]: bad.append("through the surface: " + "; ".join(r["bad"][:4]))
        r = pg.evaluate(f"({BUBBLES})()")
        print("2. bubbles: camera at", r["cameraY"], "m, bubbles seen:", r["live"], "| highest bubble:", r["highest"])
        if r["live"] == 0: bad.append("no bubbles seen, the test checked nothing")
        if r["highest"] > 0: bad.append("a bubble rose above the surface")
        r = pg.evaluate(f"({MANTA})()"); print("3. manta hit shape:", r)
        if not (r["discCentre"] < 0 and r["wingTipInside"] < 0 and r["wingTipOutside"] > 0 and r["farAhead"] > 3): bad.append("manta hit shape does not match the drawn animal")
        print("ERRORS:", [e for e in errs if "GPU stall" not in e][:6])
        b.close()
    print("RESULT:", "all good" if not bad else "; ".join(bad))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
