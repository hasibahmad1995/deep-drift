/* Small shapes used by schools: reef fish and shrimp. */
import * as THREE from '../lib/three.js';
import { mixc } from '../util/color.js';
import { flat, loft, mergeGeo, paintGeo, place } from '../util/geometry.js';
import { clamp } from '../util/math.js';

// ---- Shrimp (vent shrimp and the amphipods of the trench), the same size as the small fish so they can school ----
function shrimpGeo() {
  const L = 0.18, body = loft(L, [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.05, 0.06, 0.05, 0], [0.3, 0.08, 0.1, 0.08, 0], [0.55, 0.06, 0.07, 0.06, 0], [0.85, 0.035, 0.04, 0.03, 0], [1, 0.012, 0.012, 0.012, 0]], 16, 10);
  const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) { const b = Math.max(0, -p.getX(i) / L); p.setY(i, p.getY(i) - b * b * L * 0.55); }   // the tail curls down
  body.computeVertexNormals();
  const parts = [body, place(flat([[0, 0], [-0.08, 0.07], [-0.1, 0], [-0.08, -0.07]], L), -0.5 * L, -0.14 * L, 0, Math.PI / 2, 0, 0)];   // tail fan
  [-1, 1].forEach(sd => {   // two long feelers and five pairs of legs
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.45 * L, 0.02 * L, sd * 0.02 * L), new THREE.Vector3(0.9 * L, 0.2 * L, sd * 0.2 * L), new THREE.Vector3(1.2 * L, 0.1 * L, sd * 0.45 * L)]), 8, 0.003, 3));
    for (let k = 0; k < 5; k++) parts.push(place(new THREE.CylinderGeometry(0.002, 0.003, 0.07, 3), (0.25 - k * 0.08) * L, -0.08 * L, sd * 0.05 * L, sd * 0.5, 0, 0));
  });
  const g = mergeGeo(parts);
  paintGeo(g, (q, n) => mixc('#ffffff', '#d8c8c0', clamp(-n.y * 0.6 + 0.2)));
  return g;
}

// ---- Small reef fish, used by the big schools (colour is set for each fish) ----
function smallFishGeo() {
  const L = 0.18;
  const rows = [[0, 0.003, 0.003, 0.003, 0], [0.05, 0.05, 0.08, 0.07, 0], [0.25, 0.09, 0.16, 0.14, 0], [0.55, 0.07, 0.11, 0.1, 0], [0.85, 0.03, 0.05, 0.04, 0], [1, 0.02, 0.03, 0.02, 0]];
  const parts = [loft(L, rows, 14, 10)];
  parts.push(place(flat([[0.05, 0], [-0.05, 0.14], [-0.09, 0.0], [-0.05, -0.14]], L), -0.49 * L, 0, 0));
  parts.push(place(flat([[0.1, 0], [-0.02, 0.1], [-0.1, 0]], L), 0.0, 0.12 * L, 0));
  const g = mergeGeo(parts);
  paintGeo(g, (p, n) => mixc('#ffffff', '#c8c8c8', clamp(-n.y * 0.6 + 0.1)));
  return g;
}

/* How small schooling fish beat their tails (for wet() bend). Each tail beat moves a fish about 0.7 of its length
   (Bainbridge 1958), so an 18 cm fish cruising at 1 to 1.5 m/s beats its tail about 8 to 12 times a second:
   speed 50 is about 8 beats a second. Smaller swings than a slow fish, as in real fast swimming. */
const SMALL_FISH_SWIM = { mode: 1, amp: 0.1, speed: 50, wave: 6, len: 0.18 };

export { shrimpGeo, smallFishGeo, SMALL_FISH_SWIM };
