"""Checks the v1.4 fixes:
  1. Pause: the diver hovers (dive time and position stay) while the sea keeps moving (schools, sharks, jellyfish).
  2. Variety: each dive is a little different (reshuffle), and no version of any animal's path goes through rock
     while it is within 50 m of the dive path (farther, the water hides it).
  3. Keyboard: holding an arrow key turns smoothly (speeds up, steady, slows down), with no jumps.
  4. Schools: a circling school's speed rises and falls (surges) instead of staying constant.
Usage: python tests/life.py        (exit code 1 if something is wrong)"""
import sys
from playwright.sync_api import sync_playwright
import shot

PAUSE = r"""() => {
  window.__noRender = true; state.t = 20; state.playing = true; for (let i = 0; i < 40; i++) step(0.05);
  state.playing = false;
  const cam = camera.position.clone(), t0 = state.t;
  const schools = scene.children.filter(c => c.isInstancedMesh && c.geometry.attributes.aPhase && c.visible);
  const m = new THREE.Matrix4(), fish0 = schools.map(s => { s.getMatrixAt(0, m); return new THREE.Vector3().setFromMatrixPosition(m); });
  const movers = ACTORS.filter(a => a.obj && a.obj.visible && a.cyclic && a.obj.position.distanceTo(cam) < 150);
  const start = movers.map(a => a.obj.position.clone());
  for (let i = 0; i < 60; i++) step(0.05);   // 3 seconds paused
  const fishMoved = schools.map((s, k) => { s.getMatrixAt(0, m); return new THREE.Vector3().setFromMatrixPosition(m).distanceTo(fish0[k]); });
  const res = { diverMoved: +camera.position.distanceTo(cam).toFixed(2), diveTimeMoved: +(state.t - t0).toFixed(2),
    schools: schools.length, schoolsMoving: fishMoved.filter(d => d > 0.5).length,
    animals: movers.length, animalsMoving: movers.filter((a, k) => a.obj.position.distanceTo(start[k]) > 0.05).length };
  state.playing = true; window.__noRender = false; return res;
}"""

VARIETY = r"""() => {
  window.__noRender = true;
  const scripted = ACTORS.filter(a => a.obj && a.name && !PASSERS.indiv.includes(a) && a.update.toString().length > 20);
  const at = [60, 150, 250];
  const snap = () => scripted.map(a => at.map(t => { a.update(t); return a.obj.position.clone(); }));
  const dives = [], absent = [];
  for (let k = 0; k < 5; k++) { reshuffle(); dives.push(snap()); absent.push(scripted.filter(a => a.active === false).length); }
  let changed = 0;
  scripted.forEach((a, i) => { if (dives.some(d => d[i].some((p, j) => p.distanceTo(dives[0][i][j]) > 1))) changed++; });
  // every version's path must stay out of rock: sample each active animal over the whole dive
  let rock = 0; const where = [];
  for (let k = 0; k < 5; k++) { reshuffle();
    for (const a of scripted) { if (a.active === false) continue;
      for (let t = 0; t < TOTAL; t += 4) { a.update(t); if (inRock(a.obj.position) && a.obj.position.distanceTo(pathAt(t).pos) < 50) { rock++; if (where.length < 6) where.push(a.name + ' @' + t); break; } } } }
  window.__noRender = false;
  return { scripted: scripted.length, changed, absentPerDive: absent, inRock: rock, where };
}"""

def keys(pg):
    pg.evaluate("window.__noRender = true; state.playing = false; look.yaw = 0; look.pitch = 0; step(0.016)")
    pg.keyboard.down("ArrowLeft")
    held = [pg.evaluate("(() => { const y = look.yaw; step(1 / 60); return look.yaw - y; })()") for _ in range(60)]
    pg.keyboard.up("ArrowLeft")
    after = [pg.evaluate("(() => { const y = look.yaw; step(1 / 60); return look.yaw - y; })()") for _ in range(40)]
    pg.evaluate("window.__noRender = false")
    steps = held + after
    jumps = max(abs(b - a) for a, b in zip(steps, steps[1:]))
    return {"rate after 1 s (rad/s)": round(held[-1] * 60, 2), "biggest change between frames (rad)": round(jumps, 4),
            "turn left after letting go (rad)": round(sum(after), 3), "last step (rad)": round(after[-1], 5)}

SURGE = r"""() => {
  window.__noRender = true; state.t = 25; state.playing = false;
  const s = scene.children.find(c => c.isInstancedMesh && c.geometry.attributes.aPhase && c.count > 60 && c.visible);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), prev = new THREE.Vector3(); const speeds = [];
  s.getMatrixAt(0, m); prev.setFromMatrixPosition(m);
  for (let k = 0; k < 40; k++) { for (let i = 0; i < 20; i++) step(0.05); s.getMatrixAt(0, m); p.setFromMatrixPosition(m); speeds.push(p.distanceTo(prev)); prev.copy(p); }
  window.__noRender = false; state.playing = true;
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  return { avg: +avg.toFixed(2), slowest: +(Math.min(...speeds) / avg).toFixed(2), fastest: +(Math.max(...speeds) / avg).toFixed(2) };
}"""

def main():
    bad = []
    with sync_playwright() as p:
        b, pg, errs = shot.open_page(p, 1000, 640)
        r = pg.evaluate(f"({PAUSE})()"); print("1. pause:", r)
        if r["diverMoved"] > 0.2 or r["diveTimeMoved"] != 0: bad.append("the diver moved while paused")
        if r["schoolsMoving"] < max(1, r["schools"] // 2) or r["animalsMoving"] < r["animals"] * 0.7: bad.append("the sea stopped while paused")
        r = pg.evaluate(f"({VARIETY})()"); print("2. variety:", r)
        if r["changed"] < r["scripted"] * 0.6: bad.append("too few animals change between dives")
        if r["inRock"]: bad.append("an animal path goes through rock")
        r = keys(pg); print("3. keyboard:", r)
        if r["biggest change between frames (rad)"] > 0.004 or not (1.0 < r["rate after 1 s (rad/s)"] < 1.5) or abs(r["last step (rad)"]) > 0.002: bad.append("keyboard turning is not smooth")
        r = pg.evaluate(f"({SURGE})()"); print("4. school speed over 40 s (m per second, and slowest/fastest compared with the average):", r)
        if r["fastest"] - r["slowest"] < 0.3: bad.append("schools do not surge")
        print("ERRORS:", [e for e in errs if "GPU stall" not in e][:6])
        b.close()
    print("RESULT:", "all good" if not bad else "; ".join(bad))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
