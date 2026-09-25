/* The diver's hand, how big each animal is, and how animals keep out of the diver's way.
   Nothing passes through the diver: a small animal speeds up smoothly and swims aside when the diver comes too
   close, and is pushed aside if it is still in the way; a big, heavy animal (a whale, the whale shark, a manta)
   moves slowly, so on contact it pushes the diver aside instead. */
import * as THREE from '../lib/three.js';
import { camera } from '../engine/renderer.js';
import { BODY, groundAt } from '../diver/collision.js';
import { shoveDiver } from '../diver/glide.js';
import { clamp, rand } from '../util/math.js';

/* ---- the diver's hand: anything inside this small ball (in front of the mask) is "touched" ---- */
const TOUCH = { point: new THREE.Vector3(), r: 0.75, hit: () => {} };
/* How big each animal is: len = body length, rad = body thickness (radius), wide = half its width if it is flat and
   wide (a manta's wings). flee = how fast it swims aside, k = how quickly it calms down afterwards.
   shy = how close (m) it lets the diver come before it moves off. heavy = pushes the diver instead of being pushed. */
const HIT = {
  'Blacktip reef shark': { len: 1.7, rad: 0.3, flee: 2.4, k: 1.3, shy: 2.0 }, 'Green sea turtle': { len: 0.9, rad: 0.45, flee: 1.4, k: 1.5, shy: 1.0 },
  'Giant manta ray': { len: 2.5, rad: 0.5, wide: 2.3, flee: 1.8, k: 1.0, shy: 1.2, heavy: true },
  'Whale shark': { len: 7, rad: 1.1, flee: 0.9, k: 0.7, shy: 0.8, heavy: true }, 'Great white shark': { len: 3.6, rad: 0.6, flee: 2.0, k: 1.0, shy: 2.5 },
  'Humpback whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6, shy: 1.0, heavy: true }, 'Sperm whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6, shy: 1.0, heavy: true },
  'Dolphin': { len: 2, rad: 0.35, flee: 3.2, k: 1.2, shy: 1.5 }, 'Jellyfish': { len: 0, rad: 0.75, flee: 0.9, k: 1.2, shy: 0 },
  'Giant squid': { len: 5, rad: 0.4, flee: 2.6, k: 1.0, shy: 2.5 }, 'Anglerfish': { len: 0.9, rad: 0.35, flee: 1.4, k: 1.5, shy: 0.8 },
  'Dumbo octopus': { len: 0.4, rad: 0.25, flee: 1.3, k: 1.5, shy: 1.0 },
  'Mariana snailfish': { len: 0.3, rad: 0.15, flee: 1.2, k: 1.5, shy: 1.0 }, 'Vampire squid': { len: 0.3, rad: 0.15, flee: 1.4, k: 1.5, shy: 1.2 },
  'Gulper eel': { len: 0.75, rad: 0.1, flee: 1.2, k: 1.5, shy: 1.0 }, 'Grenadier fish': { len: 0.8, rad: 0.15, flee: 1.6, k: 1.3, shy: 1.5 },
  'Tripod fish': { len: 0.3, rad: 0.12, flee: 1.5, k: 1.4, shy: 1.2 }
};
const rA = new THREE.Vector3(), rP1 = new THREE.Vector3(), rD = new THREE.Vector3(), rN = new THREE.Vector3(), rQ = new THREE.Quaternion(), rE = new THREE.Euler(0, 0, 0, 'YZX');
const inv = new THREE.Quaternion(), rel = new THREE.Vector3(), away = new THREE.Vector3(), shove = new THREE.Vector3();

// The point of the animal's body closest to p (its body is a line along its length, see HIT), into out.
// Returns how far p is from the body's surface, measured in the animal's thickness (a flat, wide animal is squashed sideways).
function bodyGap(o, h, sc, p, out) {
  if (h.len > 0) {
    rA.set(1, 0, 0).applyQuaternion(o.quaternion).multiplyScalar(h.len * 0.5 * sc); rP1.copy(o.position).sub(rA);
    rD.copy(rA).multiplyScalar(2); const t = clamp(rN.copy(p).sub(rP1).dot(rD) / rD.lengthSq()); out.copy(rP1).addScaledVector(rD, t);
  } else out.copy(o.position);
  if (!h.wide) return out.distanceTo(p) - h.rad * sc;
  // flat and wide: measure across the wings in the animal's own frame, squashed so its width counts like its thickness
  inv.copy(o.quaternion).invert(); rel.copy(p).sub(out).applyQuaternion(inv); rel.z *= h.rad / h.wide;
  return rel.length() - h.rad * sc;
}

/* The smallest move of the diver's centre p (world space, into out) that brings the diver's body just onto the
   animal's surface. c = the closest point on the animal's body line (from bodyGap). For a flat, wide animal the move
   is worked out in its own squashed frame, so a manta's wide wings push as far as they reach. */
const sq = new THREE.Vector3();
function separation(o, h, sc, p, c, out) {
  inv.copy(o.quaternion).invert(); rel.copy(p).sub(c).applyQuaternion(inv);
  const k = h.wide ? h.rad / h.wide : 1;
  sq.set(rel.x, rel.y, rel.z * k); let len = sq.length();
  if (len < 1e-4) { sq.set(0, 1, 0); len = 1; }
  sq.multiplyScalar((h.rad * sc + BODY) / len); sq.z /= k;   // onto the (grown) surface, back to the real shape
  return out.copy(sq).sub(rel).applyQuaternion(o.quaternion);
}

function reactActor(a, dt) {
  const o = a.obj, h = a.hit, r = a.react || (a.react = { off: new THREE.Vector3(), vel: new THREE.Vector3() }), sc = o.scale.x || 1;
  o.position.add(r.off);
  // the hand touched it: a jolt, a caption and a sound (ui/touch-feedback.js)
  if (bodyGap(o, h, sc, TOUCH.point, rN) < TOUCH.r) TOUCH.hit(a.name);
  // the diver's body is close: swim aside, faster the closer the diver is (a smooth speed-up, not a jump)
  const gap = bodyGap(o, h, sc, camera.position, rN) - BODY;
  away.copy(rN).sub(camera.position); if (away.lengthSq() < 1e-6) away.set(rand(-1, 1), 0.2, rand(-1, 1)); away.y *= 0.5; away.normalize();
  if (h.shy > 0 && gap < h.shy) {
    const urge = 1 - Math.max(gap, 0) / h.shy;
    r.vel.addScaledVector(away, h.flee * 4 * urge * dt);
    const s = r.vel.length(); if (s > h.flee) r.vel.multiplyScalar(h.flee / s);
  }
  if (r.vel.lengthSq() > 0.002) {
    r.off.addScaledVector(r.vel, dt); o.position.addScaledVector(r.vel, dt); r.vel.multiplyScalar(Math.exp(-dt * h.k));
    const s = r.vel.length();
    if (s > 0.25 && h.len > 0) { rE.set(0, Math.atan2(-r.vel.z, r.vel.x), Math.asin(clamp(r.vel.y / s, -1, 1))); rQ.setFromEuler(rE); o.quaternion.slerp(rQ, clamp(s / h.flee) * 0.85); }
  }
  // still touching the diver: something has to give
  const still = bodyGap(o, h, sc, camera.position, rN) - BODY;
  if (still < 0) {
    separation(o, h, sc, camera.position, rN, shove);   // how far the diver must move (from the animal) to just touch it
    if (h.heavy) { shoveDiver(shove); TOUCH.hit(a.name); }   // the diver is pushed back, away from it
    else { r.off.sub(shove); o.position.sub(shove); }      // it is pushed aside
  }
  // never pushed into the sea floor
  const floor = groundAt(o.position.x, o.position.z) + h.rad * sc;
  if (o.position.y < floor) { r.off.y += floor - o.position.y; o.position.y = floor; }
  r.off.multiplyScalar(Math.exp(-dt * 0.03));
}

export { TOUCH, HIT, reactActor, bodyGap };
