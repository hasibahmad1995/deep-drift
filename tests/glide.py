"""Checks the gliding swim (src/diver/glide.js) while the dive plays:
- looking to one side makes the diver drift that way,
- the diver never rises (except when the sea floor pushes them up),
- looking up slows the sinking,
- a diver who strays too far is brought back by the current.
Usage: python tests/glide.py"""
import shot
from playwright.sync_api import sync_playwright

# Plays `secs` seconds from time t0 with a fixed look direction, in small steps. Returns what happened.
RUN = r"""({ t0, yaw, pitch, secs }) => {
  state.t = t0; swim.off.set(0, 0, 0); step(0.03); step(0.03);   // start there, on the route, with no swimming yet
  look.yaw = yaw; look.pitch = pitch; state.playing = true;
  let rises = 0, maxRise = 0, prev = camera.position.y, floorPush = 0; const y0 = camera.position.y, off0 = swim.off.clone();
  for (let i = 0; i < secs / 0.05; i++) {
    step(0.05);
    const dy = camera.position.y - prev; if (dy > 0.2) { rises++; maxRise = Math.max(maxRise, dy); } prev = camera.position.y;
  }
  state.playing = false;
  const base = pathAt(state.t).pos;
  return { side: Math.hypot(swim.off.x, swim.off.z).toFixed(1), offY: swim.off.y.toFixed(1), sank: (y0 - camera.position.y).toFixed(1),
           baseSank: (pathAt(t0).pos.y - base.y).toFixed(1), rises, maxRise: maxRise.toFixed(2) };
}"""

with sync_playwright() as p:
    b, pg, errs = shot.open_page(p)
    cases = [
        ("reef, look straight ahead", 40, 0, 0, 6),
        ("vents, look 90 deg left", 205, 1.57, 0, 6),
        ("open water, look up", 150, 0, 0.9, 6),
        ("open water, look down", 150, 0, -0.9, 6),
        ("plain, look right for a long time (roam limit)", 300, -1.57, 0, 30),
    ]
    for name, t0, yaw, pitch, secs in cases:
        r = pg.evaluate(RUN, {"t0": t0, "yaw": yaw, "pitch": pitch, "secs": secs})
        print(f"{name:48s} sideways {r['side']:>5} m  above route {r['offY']:>5} m  you sank {r['sank']:>6} m (route {r['baseSank']:>6})  rises {r['rises']} (max {r['maxRise']} m)")
    print("ERRORS:", errs[:5])
    b.close()
