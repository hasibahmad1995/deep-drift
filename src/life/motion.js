/* Simple ways animals move: pass by the diver, or circle a point. Both vary from dive to dive (variety.js). */
import * as THREE from '../lib/three.js';
import { TOTAL, pathAt } from '../dive/route.js';
import { groundAt, inRock } from '../diver/collision.js';
import { scene } from '../engine/renderer.js';
import { ACTORS } from './actors.js';
import { LIVES } from './depths.js';
import { chance, vary } from './variety.js';
import { rand, TAU } from '../util/math.js';
import { UP } from '../world/layout.js';

function orient(obj, vx, vy, vz) {
  const l = Math.hypot(vx, vy, vz) || 1;
  obj.rotation.order = 'YZX'; obj.rotation.set(0, Math.atan2(-vz, vx), Math.asin(vy / l));
}
// Mirrors v to the other side of the dive path (right = the path's sideways direction).
const mirrorSide = (v, right) => v.addScaledVector(right, -2 * v.dot(right));
const probe = new THREE.Vector3();
/* True if an animal's path stays out of rock whenever it could be seen: at each moment from t0 to t1 where it is
   within SEEN metres of the dive path. where(t, out) puts the animal's position at time t into out.
   (Farther away the water hides it, and an animal inside rock is hidden by the rock.) */
const SEEN = 50;
// gap = how far from rock it must stay (more for animals that wobble about their path, like jellyfish)
function clearPath(where, t0, t1, step = 1, gap = 0.5) {
  for (let t = t0; t <= t1; t += step) {
    where(t, probe);
    if (probe.distanceTo(pathAt(Math.max(0, t)).pos) < SEEN && inRock(probe, gap)) return false;
  }
  return true;
}

/* The dive's depth every half second, to find the moments when the diver is at a given depth. */
let ROUTE_DEPTHS = null;
// pad = seconds either side that must also be inside the depths (an animal that sinks with you stays near you that long)
function timesAtDepth(minD, maxD, pad = 0) {
  if (!ROUTE_DEPTHS) { ROUTE_DEPTHS = []; for (let t = 0; t < TOTAL - 5; t += 0.5) ROUTE_DEPTHS.push([t, pathAt(t).D]); }
  const inside = t => { const D = pathAt(Math.max(0, t)).D; return D >= minD && D <= maxD; };
  return ROUTE_DEPTHS.filter(([t, D]) => D >= minD && D <= maxD && (!pad || (inside(t - pad) && inside(t + pad)))).map(([t]) => t);
}

/* An animal that swims in a straight line and passes the diver at time tMeet.
   offset and vel come from view() (ahead, right, up as seen from the dive path), so they can be worked out again at
   another moment of the dive.
   follow = also move with the diver (for the deep, where the diver sinks fast and a still animal would flash past in half a second).
   pod = shared dice (variety.js) for animals that travel together; otherwise each animal rolls its own.
   Each dive it meets you at a different moment: anywhere the dive is inside the depths where it really lives (LIVES in
   depths.js), or a few seconds from its hand-placed moment if it has no range. It also comes nearer or farther, on
   either side, a little faster or slower, and about one dive in five it is not there at all. A version whose path
   would cross rock is not used; if no version is clear, the animal stays away that dive. */
function passBy(obj, tMeet, offset, vel, name, range, tick, follow, pod) {
  scene.add(obj);
  const lives = LIVES[name], when = lives ? timesAtDepth(lives.minD, lives.maxD, follow ? 12 : 0) : [];
  const cur = { tMeet, meet: new THREE.Vector3(), vel: new THREE.Vector3(), swim: new THREE.Vector3() };
  const actor = { obj, name, range: range || 22, active: true, update(t) {
    // a following animal keeps pace with the diver around the meeting, then slows down gently (no sudden stop),
    // so it never drifts far from the dive path
    obj.position.copy(cur.meet).addScaledVector(cur.vel, follow ? 10 * Math.tanh((t - cur.tMeet) / 10) : t - cur.tMeet);
    const floor = groundAt(obj.position.x, obj.position.z) + 1; if (obj.position.y < floor) obj.position.y = floor;   // glides over the sea floor, never into it
    orient(obj, cur.swim.x, cur.swim.y, cur.swim.z); if (tick) tick(t);
  } };
  const where = (t, out) => { out.copy(cur.meet).addScaledVector(cur.vel, follow ? 10 * Math.tanh((t - cur.tMeet) / 10) : t - cur.tMeet); out.y = Math.max(out.y, groundAt(out.x, out.z) + 1); return out; };
  const clear = () => clearPath(where, cur.tMeet - 60, cur.tMeet + 60);   // a minute either side of the meeting
  const right = new THREE.Vector3();
  // tm = the moment it meets you; the offset and swimming direction are worked out from the dive path at that moment
  const place = (tm, mirror, far, speed, turn = 0) => {
    cur.tMeet = tm; right.crossVectors(pathAt(tm).fwd, UP).normalize();
    cur.swim.copy(vel.fsu ? view(tm, ...vel.fsu) : vel).multiplyScalar(speed); if (mirror) mirrorSide(cur.swim, right); if (turn) cur.swim.applyAxisAngle(UP, turn);
    const o = offset.fsu ? view(tm, ...offset.fsu) : offset.clone(); if (mirror) mirrorSide(o, right);
    cur.meet.copy(pathAt(tm).pos).addScaledVector(o, far);
    cur.vel.copy(cur.swim);
    if (follow) cur.vel.add(pathAt(tm + 0.5).pos.sub(pathAt(tm - 0.5).pos));
  };
  const pickTime = u => when.length ? when[Math.floor(u * when.length) % when.length] : tMeet + (u * 6 - 3) * (follow ? 0.6 : 1);
  vary(() => {
    // first a few random versions; if none is clear of rock, the hand-placed path, its mirror image, nearer versions
    // of both, the original swimming the other way, and swimming at an angle (to come in from open water)
    const Q = Math.PI / 4, tries = [[tMeet, false, 1, 1], [tMeet, true, 1, 1], [tMeet, false, 0.75, 1], [tMeet, true, 0.75, 1], [tMeet, false, 0.5, 1], [tMeet, true, 0.5, 1], [tMeet, false, 1, -1],
      [tMeet, false, 1, 1, Q], [tMeet, false, 1, 1, -Q], [tMeet, false, 1, 1, 2 * Q], [tMeet, false, 1, 1, -2 * Q], [tMeet, false, 0.6, 1, 2 * Q], [tMeet, false, 0.6, 1, -2 * Q]];
    let ok = false;
    for (let k = 0; k < 6 && !ok; k++) {
      if (pod && k === 0) place(pickTime(pod.u), pod.mirror, pod.far, pod.speed); else place(pickTime(Math.random()), chance(0.5), rand(0.85, 1.25), rand(0.85, 1.2));
      ok = clear();
    }
    for (let k = 0; k < tries.length && !ok; k++) { place(...tries[k]); ok = clear(); }
    // no clear path at all: it is simply not there this dive (better than swimming through rock)
    actor.active = ok && (pod ? pod.here : chance(0.8));
    actor.lag = 0;
  });
  ACTORS.push(actor);
}

// An animal that swims in circles around a point. Each dive it starts somewhere else on the circle and may circle the other way.
function orbit(obj, centre, radius, omega, phase, rise, name, range) {
  scene.add(obj);
  const cur = { omega, phase };
  vary(() => { cur.phase = rand(0, TAU); cur.omega = chance(0.5) ? omega : -omega; });
  // a circle that cuts through rock is moved out: away from the reef wall (toward open water), or up off the floor
  const at = (a, out) => out.set(centre.x + Math.cos(a) * radius, centre.y + rise * Math.sin(a * 0.6), centre.z + Math.sin(a) * radius);
  const cuts = () => { for (let k = 0; k < 72; k++) for (const up of [-1, -0.5, 0, 0.5, 1]) { at(k / 72 * TAU, probe).y = centre.y + up * rise; if (inRock(probe, 0.8)) return true; } return false; };   // at five heights of its bob
  const nearReef = centre.x < -15;
  for (let n = 0; n < 60 && cuts(); n++) { if (nearReef) centre.x += 0.5; else centre.y += 0.5; }
  ACTORS.push({ obj, name, range: range || 22, cyclic: true, update(t) {
    const a = cur.omega * t + cur.phase, d = cur.omega > 0 ? 1 : -1;
    obj.position.set(centre.x + Math.cos(a) * radius, centre.y + rise * Math.sin(a * 0.6), centre.z + Math.sin(a) * radius);
    orient(obj, -Math.sin(a) * d, rise * 0.6 * cur.omega * Math.cos(a * 0.6) / Math.max(radius * Math.abs(cur.omega), 0.01), Math.cos(a) * d);
  } });
}
// A direction or place described from the diver's point of view: f = ahead, s = to the right, u = up.
function view(tm, f, s, u) {
  const p = pathAt(tm), right = new THREE.Vector3().crossVectors(p.fwd, UP).normalize();
  const v = new THREE.Vector3().addScaledVector(p.fwd, f).addScaledVector(right, s).addScaledVector(UP, u);
  v.fsu = [f, s, u];   // kept, so passBy can work the same direction out again at another moment of the dive
  return v;
}

export { orient, passBy, orbit, view, clearPath };
