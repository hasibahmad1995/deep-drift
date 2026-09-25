"""Checks the three v1.3 promises over the whole dive, simulated fast without drawing (window.__noRender):
  1. the diver never ends up inside anything solid (corals, rocks, sponges, tube worms, wreck parts, bones),
  2. no animal and no school fish overlaps the diver (they move aside, or push the diver),
  3. nothing appears or disappears while it is on screen and not yet lost in the water ("pops"),
  4. the diver never jumps (moves more than a swimmer or the current could in one step).
Usage: python tests/solid.py            (prints a report; exit code 1 if a promise is broken)"""
import sys
from playwright.sync_api import sync_playwright
import shot

SIM = r"""(o) => {
  const out = { steps: 0, solids: SOLIDS.count, inside: [], animals: {}, fish: 0, fishWorst: 0, pops: [], worldPops: [], near: {}, jumps: [] };
  const prev = new THREE.Vector3(); let first = true;
  const tmp = new THREE.Vector3(), q = new THREE.Vector3(), m = new THREE.Matrix4(), box = new THREE.Box3(), sph = new THREE.Sphere();
  const size = new Map(), was = new Map();
  const sizeOf = obj => { if (!size.has(obj)) size.set(obj, obj.userData.reach || box.setFromObject(obj).getBoundingSphere(sph).radius); return size.get(obj); };
  const schools = scene.children.filter(c => c.isInstancedMesh && c.boundingSphere && c.geometry.attributes.aPhase);
  const world = []; Object.values(groups).forEach(g => { if (g.userData.cull) world.push(g); (g.userData.cullKids || []).forEach(k => world.push(k)); });
  window.__noRender = true; state.t = o.t0; state.playing = true;
  for (let n = 0; state.t < o.t1 && n < 20000; n++) {
    look.yaw = o.yaw(state.t); look.pitch = o.pitch(state.t);
    step(o.dt); out.steps++;
    const t = +state.t.toFixed(2), E = camera.position;
    // 4. a jump: faster than 40 m/s (the fastest the current ever carries you is about 15 m/s)
    if (!first && E.distanceTo(prev) > 40 * o.dt && out.jumps.length < 10) out.jumps.push([t, +E.distanceTo(prev).toFixed(1)]);
    prev.copy(E); first = false;
    // 1. inside something solid? (a little slack for the camera bob)
    tmp.copy(E); if (pushOutOfSolids(tmp, BODY - 0.1) && out.inside.length < 20) out.inside.push([t, E.x.toFixed(1), E.y.toFixed(1), E.z.toFixed(1)]);
    // 2. animals overlapping the diver
    for (const a of ACTORS) {
      if (!a.obj || !a.hit || !a.obj.visible || a.active === false) continue;
      const g = bodyGap(a.obj, a.hit, a.obj.scale.x || 1, E, q) - BODY;
      if (g < (out.near[a.name] ?? 1e9)) out.near[a.name] = +g.toFixed(2);
      if (g < -0.05) { const r = out.animals[a.name] || (out.animals[a.name] = { n: 0, worst: 0, at: t }); r.n++; if (g < r.worst) { r.worst = +g.toFixed(2); r.at = t; } }
    }
    if (n % 2 === 0) for (const s of schools) {
      if (!s.visible) continue;
      for (let i = 0; i < s.count; i++) { s.getMatrixAt(i, m); q.setFromMatrixPosition(m); const d = q.distanceTo(E); if (d < BODY - 0.05) { out.fish++; out.fishWorst = Math.min(out.fishWorst, +(d - BODY).toFixed(2)); } }
    }
    // 3. pops: something switched on or off while it could be seen
    const check = (key, obj, vis, pos, r, name) => {
      const before = was.get(key); was.set(key, vis);
      if (before === undefined || before === vis || state.t < o.t0 + 1) return;   // the first second after the test jumps the clock does not count
      // (at the very edge of sight it has already faded, so switching there is fine)
      if (inSight(pos, r) && pos.distanceTo(E) - r < sightRange() - 3 && out.pops.length < 30) out.pops.push([t, name, vis ? 'appeared' : 'vanished', +pos.distanceTo(E).toFixed(1)]);
    };
    for (const a of ACTORS) if (a.obj) check(a.obj, a.obj, a.obj.visible, a.obj.position, sizeOf(a.obj), a.name);
    for (const s of schools) check(s, s, s.visible, s.boundingSphere.center, s.boundingSphere.radius, s.name || 'school');
    const see = sightRange();
    for (const w of world) {
      const before = was.get(w); was.set(w, w.visible);
      if (before === undefined || before === w.visible) continue;
      const c = w.userData.cull, gap = E.distanceTo(c.center) - c.radius, lim = c.far ? Math.min(see, c.far) : see;
      if (gap < lim - 1 && out.worldPops.length < 30) out.worldPops.push([t, w.name || w.type, w.visible ? 'shown' : 'hidden', +gap.toFixed(1), +lim.toFixed(1)]);
    }
  }
  window.__noRender = false;
  return out;
}"""

# Puts an animal right on top of the diver and watches who gives way.
CONTACT = r"""(name) => {
  window.__noRender = true; state.t = 40; state.playing = false; step(0.03);
  const a = PASSERS.indiv.find(p => p.name === name), h = HIT[name], q = new THREE.Vector3();
  a.active = true; a.obj.visible = true; a.react = null; a.t0 = state.t; a.meetIn = 100;
  a.start.copy(camera.position).add(new THREE.Vector3(0.2, 0.1, 0.2)); a.vel.set(0.001, 0, 0);
  const before = camera.position.clone(); let worst = 1e9;
  for (let i = 0; i < 40; i++) { step(0.03); if (i > 0) worst = Math.min(worst, bodyGap(a.obj, h, a.obj.scale.x || 1, camera.position, q) - BODY); }
  const res = { worst: +worst.toFixed(2), diverMoved: +camera.position.distanceTo(before).toFixed(2), animalMoved: +(a.react ? a.react.off.length() : 0).toFixed(2) };
  a.active = false; a.obj.visible = false; window.__noRender = false; return res;
}"""

RUNS = [
    ("whole dive, looking around", "0.5", str(418), "t => Math.sin(t * 0.31) * 1.3", "t => Math.sin(t * 0.17) * 0.5 - 0.15"),
    ("reef, swimming at the corals and the wall", "8", "95", "t => 2.2 + Math.sin(t * 0.2) * 1.2", "t => -0.45 + Math.sin(t * 0.4) * 0.3"),
    ("wreck, swimming into it", "330", "372", "t => Math.sin(t * 0.15) * 1.6", "t => -0.35"),
]

def main():
    bad = 0
    with sync_playwright() as p:
        b, pg, errs = shot.open_page(p, 1000, 640)
        for label, t0, t1, yaw, pitch in RUNS:
            js = f"(() => {{ const f = {SIM}; return f({{ t0: {t0}, t1: {t1}, dt: 0.05, yaw: {yaw}, pitch: {pitch} }}); }})()"
            r = pg.evaluate(js)
            print(f"\n== {label}: {r['steps']} steps, {r['solids']} solid shapes in the world")
            print("  inside something solid:", len(r["inside"]), r["inside"][:5])
            print("  animals overlapping the diver:", r["animals"] or "none")
            print("  school fish overlapping the diver:", r["fish"], "(worst", r["fishWorst"], "m)")
            print("  pops (switched while on screen):", len(r["pops"]), r["pops"][:10])
            print("  world parts switched too close:", len(r["worldPops"]), r["worldPops"][:6])
            print("  jumps (m in one step):", len(r["jumps"]), r["jumps"][:6])
            closest = sorted(r["near"].items(), key=lambda kv: kv[1])[:6]
            print("  closest approach (gap to body, m):", closest)
            bad += len(r["inside"]) + len(r["animals"]) + (1 if r["fish"] else 0) + len(r["pops"]) + len(r["worldPops"]) + len(r["jumps"])
        for name, who in [("Whale shark", "diver"), ("Jellyfish", "animal")]:
            r = pg.evaluate(f"({CONTACT})('{name}')")
            ok = r["worst"] > -0.05 and (r["diverMoved"] > 0.5 if who == "diver" else r["animalMoved"] > 0.5)
            print(f"\n== contact with a {name}: the {who} should give way:", r, "OK" if ok else "PROBLEM")
            bad += 0 if ok else 1
        print("\nERRORS:", errs[:8])
        b.close()
    print("RESULT:", "all promises kept" if bad == 0 else f"{bad} problems")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
