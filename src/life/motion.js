/* Simple ways animals move: pass by the diver, or circle a point. */
import * as THREE from '../lib/three.js';
import { pathAt } from '../dive/route.js';
import { scene } from '../engine/renderer.js';
import { ACTORS } from './actors.js';
import { UP } from '../world/layout.js';

function orient(obj, vx, vy, vz) {
  const l = Math.hypot(vx, vy, vz) || 1;
  obj.rotation.order = 'YZX'; obj.rotation.set(0, Math.atan2(-vz, vx), Math.asin(vy / l));
}
// An animal that swims in a straight line and passes the diver at time tMeet.
// follow = also move with the diver (for the deep, where the diver sinks fast and a still animal would flash past in half a second).
function passBy(obj, tMeet, offset, vel, name, range, tick, follow) {
  const meet = pathAt(tMeet).pos.clone().add(offset), swimVel = vel;   // it faces the way it swims
  if (follow) vel = vel.clone().add(pathAt(tMeet + 0.5).pos.sub(pathAt(tMeet - 0.5).pos));
  scene.add(obj); orient(obj, swimVel.x, swimVel.y, swimVel.z);
  ACTORS.push({ obj, name, range: range || 22, update(t) {
    // a following animal keeps pace with the diver around the meeting, then slows down gently (no sudden stop),
    // so it never drifts far from the dive path
    obj.position.copy(meet).addScaledVector(vel, follow ? 10 * Math.tanh((t - tMeet) / 10) : t - tMeet);
    orient(obj, swimVel.x, swimVel.y, swimVel.z); if (tick) tick(t);
  } });
}
// An animal that swims in circles around a point.
function orbit(obj, centre, radius, omega, phase, rise, name, range) {
  scene.add(obj);
  ACTORS.push({ obj, name, range: range || 22, update(t) {
    const a = omega * t + phase, d = omega > 0 ? 1 : -1;
    obj.position.set(centre.x + Math.cos(a) * radius, centre.y + rise * Math.sin(a * 0.6), centre.z + Math.sin(a) * radius);
    orient(obj, -Math.sin(a) * d, rise * 0.6 * omega * Math.cos(a * 0.6) / Math.max(radius * omega, 0.01), Math.cos(a) * d);
  } });
}
// A direction or place described from the diver's point of view: f = ahead, s = to the right, u = up.
function view(tm, f, s, u) {
  const p = pathAt(tm), right = new THREE.Vector3().crossVectors(p.fwd, UP).normalize();
  return new THREE.Vector3().addScaledVector(p.fwd, f).addScaledVector(right, s).addScaledVector(UP, u);
}

export { orient, passBy, orbit, view };
