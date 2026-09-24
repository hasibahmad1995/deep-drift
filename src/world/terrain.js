/* The one continuous sea floor: the island's cliff below the reef, the vent terrace, the volcano slope and the
   abyssal plain, as a height map y = seafloorY(x, z). (The reef wall above and the trench are built separately,
   because they are too steep for a height map.) The floor is built in chunks so far parts can be skipped. */
import * as THREE from '../lib/three.js';
import { SMALL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { worldY } from '../dive/depth.js';
import { FLOOR_PROFILE, VENTS, WRECK, TRENCH } from './sites.js';
import { fbm2 } from '../util/noise.js';
import { mixc, col } from '../util/color.js';
import { clamp, smooth } from '../util/math.js';
import { paintGeo } from '../util/geometry.js';

// ---- the floor's height along x: a smooth curve through FLOOR_PROFILE that never goes back up (monotone cubic) ----
const PX = FLOOR_PROFILE.map(p => p[0]), PY = FLOOR_PROFILE.map(p => worldY(p[1]));
const SLOPE = (() => {
  const n = PX.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((PY[i + 1] - PY[i]) / (PX[i + 1] - PX[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);   // keeps the curve monotone
  return m;
})();
function profileY(x) {
  if (x <= PX[0]) return PY[0];
  if (x >= PX[PX.length - 1]) return PY[PY.length - 1];
  let i = 0; while (x > PX[i + 1]) i++;
  const h = PX[i + 1] - PX[i], t = (x - PX[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * PY[i] + (t3 - 2 * t2 + t) * h * SLOPE[i] + (-2 * t3 + 3 * t2) * PY[i + 1] + (t3 - t2) * h * SLOPE[i + 1];
}

// ---- how much each kind of ground is present at x (they blend into each other) ----
const zone = x => {
  const cliff = 1 - smooth(clamp((x - 70) / 35)), slope = smooth(clamp((x - 200) / 16)) * (1 - smooth(clamp((x - 335) / 25)));
  const plain = smooth(clamp((x - 335) / 25)), terrace = clamp(1 - cliff - slope - plain);
  return { cliff, terrace, slope, plain };
};

// Sediment heaped up against the buried wreck (in the wreck's own frame: along the hull and across it)
const WC = Math.cos(WRECK.yaw), WS = Math.sin(WRECK.yaw);
function wreckBerm(x, z) {
  const dx = x - WRECK.x, dz = z - WRECK.z, lx = dx * WC - dz * WS, lz = dx * WS + dz * WC;
  return 1.7 * Math.exp(-Math.pow(Math.max(0, Math.abs(lx) - 19) / 6, 2)) * Math.exp(-Math.pow(Math.max(0, Math.abs(lz) - 4.2) / 4, 2));
}
// Low mounds of mineral around each vent chimney
function ventMounds(x, z) {
  let h = 0;
  for (const [vx, vz] of VENTS) { const d2 = (x - vx) * (x - vx) + (z - vz) * (z - vz); h += 2.4 * Math.exp(-d2 / 45); }
  return h;
}

// The height of the sea floor at (x, z)
function seafloorY(x, z) {
  const w = zone(x), joint = smooth(clamp((x + 38) / 14));   // 0 where the floor meets the foot of the reef wall, so they join exactly
  // spurs and gullies: the contour lines wander along z (more on the cliff and slope, less on the plain)
  const wander = joint * (w.cliff * 12 + w.slope * 9 + w.terrace * 3 + w.plain * 2) * (fbm2(z * 0.025 + 3, x * 0.004) - 0.5) * 2;
  let y = profileY(x + wander);
  const ridged = 1 - Math.abs(fbm2(x * 0.06 + 7, z * 0.06, 3) * 2 - 1);
  y += joint * (w.cliff + w.slope) * ((fbm2(x * 0.08, z * 0.08) - 0.5) * 6 + (fbm2(x * 0.35 + 1, z * 0.35) - 0.5) * 1.6 - Math.pow(ridged, 5) * 2.5);
  y += w.terrace * ((fbm2(x * 0.1 + 3, z * 0.1) - 0.5) * 2.4 + (fbm2(x * 0.55, z * 0.55 + 4) - 0.5) * 0.9 + ventMounds(x, z));   // lumpy pillow lava
  y += w.plain * ((fbm2(x * 0.03, z * 0.03) - 0.5) * 1.6 + (fbm2(x * 0.45, z * 0.45) - 0.5) * 0.22 + wreckBerm(x, z));             // soft mud
  return y;
}

// ---- colour of the ground ----
function groundColor(p, n) {
  const w = zone(p.x), flat = smooth(clamp((n.y - 0.55) / 0.35));
  // real basalt and deep-sea mud reflect roughly 5 to 20 % of light, which is why they look grey-brown under a submersible's lights
  const basalt = mixc('#3e3730', '#5e544a', fbm2(p.x * 0.12, p.z * 0.12 + p.y * 0.05));
  const ooze = mixc('#7a705f', '#9a8e78', fbm2(p.x * 0.07 + 5, p.z * 0.07));          // pale deep-sea mud
  let c = basalt.clone().lerp(ooze, clamp(flat * (0.35 + w.slope * 0.3 + w.cliff * 0.2)));
  c.lerp(ooze, w.plain * 0.92);
  if (w.terrace > 0.05) {                                                              // near the vents: white bacterial mats and rusty iron oxide
    let near = 0; for (const [vx, vz] of VENTS) near = Math.max(near, clamp(1 - Math.hypot(p.x - vx, p.z - vz) / 11));
    const mat = fbm2(p.x * 0.6, p.z * 0.6) > 0.5 ? col('#d8d0aa') : col('#8a4a22');
    c.lerp(mat, near * near * 0.75 * w.terrace);
  }
  return c;
}

// Sample positions across the slope (z): close together near the dive, wider apart far to the sides.
function zSamples(half, fine, step) {
  const zs = [];
  for (let z = -half; z <= half + 0.01;) { zs.push(z); const a = Math.abs(z); z += a < fine ? step : Math.min(8, step + (a - fine) * 0.12); }
  return zs;
}

// One chunk of floor between x0 and x1
function makeChunk(x0, x1, dx, zs, material) {
  const nx = Math.max(1, Math.round((x1 - x0) / dx)), pos = [], idx = [], nz = zs.length;
  for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx; for (const z of zs) pos.push(x, seafloorY(x, z), z); }
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz - 1; k++) { const a = i * nz + k, b = a + nz; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  paintGeo(g, groundColor);
  const mesh = new THREE.Mesh(g, material);
  g.computeBoundingSphere(); mesh.userData.cull = { center: g.boundingSphere.center.clone(), radius: g.boundingSphere.radius };
  return mesh;
}

// Builds the whole floor (except the reef and the trench) as chunks in one group.
function buildTerrain() {
  const G = new THREE.Group(); G.name = 'terrain';
  const material = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, bump: 1.6, caust: false });
  const zs = zSamples(120, 45, SMALL ? 2 : 1.2), dx = SMALL ? 1.8 : 1.1;
  const cuts = [-38, 20, 90, 160, 230, 300, 370, 440, 510, TRENCH.landTop];
  for (let i = 0; i < cuts.length - 1; i++) G.add(makeChunk(cuts[i], cuts[i + 1], dx, zs, material));
  G.add(makeChunk(TRENCH.farTop, 760, dx * 2, zSamples(120, 45, SMALL ? 3 : 2), material));   // the far rim of the trench
  return G;
}

export { profileY, seafloorY, buildTerrain };
