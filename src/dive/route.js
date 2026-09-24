/* The dive route: one continuous path from the surface to the floor of the Challenger Deep.
   pathAt(t) says where the current carries the diver at time t (before any swimming of their own), which way
   they face, and the depth. The parts of the dive (LEGS) are only names and times: there are no jumps between them. */
import * as THREE from '../lib/three.js';
import { SETTINGS } from '../config.js';
import { REDUCED } from '../engine/device.js';
import { clamp, lerp, smooth } from '../util/math.js';
import { worldY, depthAt } from './depth.js';
import { seafloorY } from '../world/terrain.js';
import { trenchFloorY } from '../world/trench.js';
import { TRENCH } from '../world/sites.js';

if (REDUCED) SETTINGS.speed *= 0.5;

// The parts of the dive. start = seconds from the beginning at normal speed.
const LEGS = [
  { id: 'reef', place: 'Coral reef', start: 0 },
  { id: 'dropoff', place: 'Reef drop-off', start: 80 },
  { id: 'twilight', place: 'Open ocean', start: 125 },
  { id: 'midnight', place: 'Open ocean', start: 170 },
  { id: 'vents', place: 'Hydrothermal vents', start: 200 },
  { id: 'slope', place: 'Volcano slope', start: 240 },
  { id: 'plain', place: 'Abyssal plain', start: 285 },
  { id: 'trench', place: 'Trench wall', start: 355 },
  { id: 'deep', place: 'Challenger Deep', start: 405 }
];
const END = 420;   // about 7 minutes
const TOTAL = END / SETTINGS.speed;
LEGS.forEach((L, i) => { L.t0 = L.start / SETTINGS.speed; L.t1 = (i + 1 < LEGS.length ? LEGS[i + 1].start : END) / SETTINGS.speed; });
const legIndex = t => { for (let i = LEGS.length - 1; i > 0; i--) if (t >= LEGS[i].t0) return i; return 0; };
const tu = (leg, u) => LEGS[leg].t0 + (LEGS[leg].t1 - LEGS[leg].t0) * u;   // the time a fraction u through a part of the dive

const facing = (yaw, pitch, out) => out.set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
const groundY = (x, z) => (x > TRENCH.landTop && x < TRENCH.farTop ? trenchFloorY(x, z) : seafloorY(x, z));

// ---- the reef (first 80 s): drop in under the boat, turn to face the wall, sink along it to 55 m ----
const REEF_END = 80;
function reefAt(T, pos, fwd) {
  const u = T / REEF_END, uu = clamp((u - 0.025) / 0.975), e = 0.85 * smooth(uu) + 0.15 * uu;
  pos.set(-(lerp(14, 21, e) + 0.9 * Math.sin(u * 17)), worldY(55 * e) - 2.6, 3.5 * Math.sin(u * 6));
  facing(lerp(0, Math.PI, smooth(clamp((u - 0.03) / 0.1))) + 0.12 * Math.sin(u * 5), u < 0.05 ? 1.25 : lerp(1.25, -0.3, smooth(clamp((u - 0.05) / 0.09))) + 0.08 * Math.sin(u * 9), fwd);
}

// ---- after the reef: key points. Each has either a depth D (open water) or a height above the floor (clear). ----
// yaw 0 faces away from the island (+x), PI faces back toward it, -PI/2 faces along the trench (+z).
const KEYS = [
  { T: 95, x: -22, z: 6, D: 110, yaw: Math.PI - 0.05, pitch: -0.35 },          // down the reef wall
  { T: 125, x: -24, z: 14, D: 200, yaw: Math.PI + 0.3, pitch: -0.45 },         // the last corals at the drop-off
  { T: 150, x: 10, z: 12, D: 600, yaw: 1.9, pitch: -0.25 },                    // drifting out into the twilight
  { T: 170, x: 50, z: 6, D: 1000, yaw: 0.25, pitch: -0.25 },
  { T: 190, x: 90, z: 2, D: 1450, yaw: 0.1, pitch: -0.45 },                    // the volcano terrace appears below
  { T: 200, x: 108, z: 0, clear: 7, yaw: 0.05, pitch: -0.35 },
  { T: 215, x: 135, z: 5, clear: 6, yaw: -0.1, pitch: -0.3 },                  // over the vents
  { T: 230, x: 165, z: -3, clear: 6, yaw: 0.15, pitch: -0.3 },
  { T: 240, x: 200, z: 2, clear: 7, yaw: 0, pitch: -0.55 },                    // the edge of the terrace
  { T: 246, x: 213, z: 0, clear: 8, yaw: 0.05, pitch: -0.9 },                  // looking down over the edge
  { T: 252, x: 224, z: -3, clear: 10, yaw: 1.6, pitch: -0.7 },                 // turning to face the slope as you sink down it
  { T: 260, x: 242, z: -4, clear: 10, yaw: 2.6, pitch: -0.5 },                 // facing the rock, like on the reef wall
  { T: 268, x: 262, z: -1, clear: 10, yaw: 2.8, pitch: -0.45 },
  { T: 276, x: 290, z: 2, clear: 10, yaw: 2.4, pitch: -0.5 },
  { T: 285, x: 330, z: 0, clear: 9, yaw: 1.2, pitch: -0.45 },                 // turning back out toward the plain
  { T: 305, x: 375, z: 4, clear: 5, yaw: 0.2, pitch: -0.3 },                   // the abyssal plain
  { T: 325, x: 410, z: -12, clear: 9, yaw: -0.7, pitch: -0.35 },               // past the bow of the wreck
  { T: 345, x: 470, z: -8, clear: 6, yaw: 0.5, pitch: -0.35 },                 // the whale skeleton
  { T: 355, x: 548, z: 0, clear: 6, yaw: 0, pitch: -0.6 },                     // the edge of the trench
  { T: 365, x: 574, z: 2, D: 6300, yaw: -1.6, pitch: -0.75 },                  // over the edge, looking down into the trench
  { T: 380, x: 577, z: 12, D: 7800, yaw: -2.35, pitch: -0.35 },                // down the landward wall, about 10 m from it (facing it at an angle)
  { T: 395, x: 581, z: 24, D: 9200, yaw: -2.2, pitch: -0.35 },
  { T: 405, x: 588, z: 32, D: 10400, yaw: -2.0, pitch: -0.5 },
  { T: 415, x: 598, z: 38, clear: 3.5, yaw: -1.8, pitch: -0.5 },               // settling onto the floor of the Challenger Deep
  { T: 420, x: 600, z: 40, clear: 2.5, yaw: -1.8, pitch: -0.5 }
];
// The first key is where the reef part ends, so the two join without a jump.
{ const p = new THREE.Vector3(), f = new THREE.Vector3(); reefAt(REEF_END, p, f);
  KEYS.unshift({ T: REEF_END, x: p.x, z: p.z, y: p.y, yaw: Math.atan2(-f.z, f.x), pitch: Math.asin(f.y) }); }
KEYS.forEach(k => { if (k.y == null) k.y = k.clear != null ? groundY(k.x, k.z) + k.clear : worldY(k.D); });
const CURVE = new THREE.CatmullRomCurve3(KEYS.map(k => new THREE.Vector3(k.x, k.y, k.z)), false, 'centripetal');

function pathAt(t) {
  const T = clamp(t * SETTINGS.speed, 0, END), pos = new THREE.Vector3(), fwd = new THREE.Vector3();
  if (T <= REEF_END) reefAt(T, pos, fwd);
  else {
    let i = 0; while (i < KEYS.length - 2 && T > KEYS[i + 1].T) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = clamp((T - a.T) / (b.T - a.T));
    CURVE.getPoint((i + f) / (KEYS.length - 1), pos);
    const s = smooth(f); facing(lerp(a.yaw, b.yaw, s), lerp(a.pitch, b.pitch, s), fwd);
  }
  const si = legIndex(t), L = LEGS[si];
  return { pos, fwd, D: depthAt(pos.y), si, u: clamp((t - L.t0) / (L.t1 - L.t0)) };
}

export { LEGS, TOTAL, legIndex, tu, facing, pathAt };
