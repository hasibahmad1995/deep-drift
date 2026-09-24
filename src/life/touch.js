/* The diver's hand, how big each animal is to touch, and how a touched animal darts away. */
import * as THREE from '../lib/three.js';
import { clamp, rand } from '../util/math.js';

/* ---- the diver's hand: anything inside this small ball (in front of the mask) is "touched" ---- */
const TOUCH = { point: new THREE.Vector3(), r: 0.75, hit: () => {} };
// How big each animal is for touching: len = body length, rad = body thickness, flee = how fast it darts away, k = how quickly it calms down.
const HIT = {
  'Blacktip reef shark': { len: 1.7, rad: 0.3, flee: 2.4, k: 1.3 }, 'Green sea turtle': { len: 0.9, rad: 0.45, flee: 1.4, k: 1.5 }, 'Giant manta ray': { len: 2.5, rad: 1.2, flee: 1.8, k: 1.0 },
  'Whale shark': { len: 7, rad: 1.1, flee: 0.9, k: 0.7 }, 'Great white shark': { len: 3.6, rad: 0.6, flee: 2.0, k: 1.0 }, 'Humpback whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6 },
  'Sperm whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6 }, 'Dolphin': { len: 2, rad: 0.35, flee: 3.2, k: 1.2 }, 'Jellyfish': { len: 0, rad: 0.75, flee: 0.9, k: 1.2 },
  'Giant squid': { len: 5, rad: 0.4, flee: 2.6, k: 1.0 }, 'Anglerfish': { len: 0.9, rad: 0.35, flee: 1.4, k: 1.5 }, 'Dumbo octopus': { len: 0.4, rad: 0.25, flee: 1.3, k: 1.5 },
  'Mariana snailfish': { len: 0.3, rad: 0.15, flee: 1.2, k: 1.5 }, 'Vampire squid': { len: 0.3, rad: 0.15, flee: 1.4, k: 1.5 },
  'Gulper eel': { len: 0.75, rad: 0.1, flee: 1.2, k: 1.5 }, 'Grenadier fish': { len: 0.8, rad: 0.15, flee: 1.6, k: 1.3 }, 'Tripod fish': { len: 0.3, rad: 0.12, flee: 1.5, k: 1.4 }
};
const rA = new THREE.Vector3(), rP1 = new THREE.Vector3(), rP2 = new THREE.Vector3(), rN = new THREE.Vector3(), rD = new THREE.Vector3(), rQ = new THREE.Quaternion(), rE = new THREE.Euler(0, 0, 0, 'YZX');
// If the diver touches this animal it darts away from the hand, turns to face where it is going, and slowly calms down.
function reactActor(a, dt) {
  const o = a.obj, h = a.hit, r = a.react || (a.react = { off: new THREE.Vector3(), vel: new THREE.Vector3() }), sc = o.scale.x || 1;
  o.position.add(r.off);
  if (h.len > 0) {
    rA.set(1, 0, 0).applyQuaternion(o.quaternion).multiplyScalar(h.len * 0.5 * sc); rP1.copy(o.position).sub(rA); rP2.copy(o.position).add(rA);
    rD.copy(rP2).sub(rP1); const l2 = rD.lengthSq(), t = l2 > 0 ? clamp(rN.copy(TOUCH.point).sub(rP1).dot(rD) / l2) : 0; rN.copy(rP1).addScaledVector(rD, t);
  } else rN.copy(o.position);
  if (rN.distanceTo(TOUCH.point) < TOUCH.r + h.rad * sc) {
    rD.copy(rN).sub(TOUCH.point); if (rD.lengthSq() < 1e-4) rD.set(rand(-1, 1), 0.2, rand(-1, 1)); rD.y *= 0.5; rD.normalize();
    r.vel.copy(rD).multiplyScalar(h.flee); TOUCH.hit(a.name);
  }
  if (r.vel.lengthSq() > 0.002) {
    r.off.addScaledVector(r.vel, dt); r.vel.multiplyScalar(Math.exp(-dt * h.k));
    const s = r.vel.length();
    if (s > 0.25 && h.len > 0) { rE.set(0, Math.atan2(-r.vel.z, r.vel.x), Math.asin(clamp(r.vel.y / s, -1, 1))); rQ.setFromEuler(rE); o.quaternion.slerp(rQ, clamp(s / h.flee) * 0.85); }
  }
  r.off.multiplyScalar(Math.exp(-dt * 0.03));
}

export { TOUCH, HIT, reactActor };
