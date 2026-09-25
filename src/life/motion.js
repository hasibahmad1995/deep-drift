/* Simple ways animals move: pass by the diver, or circle a point. Both vary from dive to dive (variety.js). */
import * as THREE from '../lib/three.js';
import { pathAt } from '../dive/route.js';
import { groundAt, inRock } from '../diver/collision.js';
import { scene } from '../engine/renderer.js';
import { ACTORS } from './actors.js';
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
function clearPath(where, t0, t1, step = 1) {
  for (let t = t0; t <= t1; t += step) {
    where(t, probe);
    if (probe.distanceTo(pathAt(Math.max(0, t)).pos) < SEEN && inRock(probe)) return false;
  }
  return true;
}

/* An animal that swims in a straight line and passes the diver at time tMeet.
   follow = also move with the diver (for the deep, where the diver sinks fast and a still animal would flash past in half a second).
   pod = shared dice (variety.js) for animals that travel together; otherwise each animal rolls its own.
   Each dive it comes a few seconds earlier or later, nearer or farther, on either side, a little faster or slower,
   and about one dive in seven it is not there at all. A version whose path would cross rock is not used; if no version
   is clear, the animal stays away that dive. */
function passBy(obj, tMeet, offset, vel, name, range, tick, follow, pod) {
  scene.add(obj);
  const right = new THREE.Vector3().crossVectors(pathAt(tMeet).fwd, UP).normalize();
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
  const place = (dt, mirror, far, speed, turn = 0) => {
    cur.tMeet = tMeet + dt * (follow ? 0.6 : 1);
    cur.swim.copy(vel).multiplyScalar(speed); if (mirror) mirrorSide(cur.swim, right); if (turn) cur.swim.applyAxisAngle(UP, turn);
    const o = offset.clone(); if (mirror) mirrorSide(o, right);
    cur.meet.copy(pathAt(cur.tMeet).pos).addScaledVector(o, far);
    cur.vel.copy(cur.swim);
    if (follow) cur.vel.add(pathAt(cur.tMeet + 0.5).pos.sub(pathAt(cur.tMeet - 0.5).pos));
  };
  vary(() => {
    // first a few random versions; if none is clear of rock, the hand-placed path, its mirror image, nearer versions
    // of both, the original swimming the other way, and swimming at an angle (to come in from open water)
    const Q = Math.PI / 4, tries = [[0, false, 1, 1], [0, true, 1, 1], [0, false, 0.75, 1], [0, true, 0.75, 1], [0, false, 0.5, 1], [0, true, 0.5, 1], [0, false, 1, -1],
      [0, false, 1, 1, Q], [0, false, 1, 1, -Q], [0, false, 1, 1, 2 * Q], [0, false, 1, 1, -2 * Q], [0, false, 0.6, 1, 2 * Q], [0, false, 0.6, 1, -2 * Q]];   // and swimming at an angle
    let ok = false;
    for (let k = 0; k < 4 && !ok; k++) {
      if (pod && k === 0) place(pod.dt, pod.mirror, pod.far, pod.speed); else place(rand(-3, 3), chance(0.5), rand(0.85, 1.25), rand(0.85, 1.2));
      ok = clear();
    }
    for (let k = 0; k < tries.length && !ok; k++) { place(...tries[k]); ok = clear(); }
    // no clear path at all: it is simply not there this dive (better than swimming through rock)
    actor.active = ok && (pod ? pod.here : chance(0.85));
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
  return new THREE.Vector3().addScaledVector(p.fwd, f).addScaledVector(right, s).addScaledVector(UP, u);
}

export { orient, passBy, orbit, view, clearPath };
