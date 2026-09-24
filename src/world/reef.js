/* The reef: a shallow shelf that drops off as a steep wall into deep water. */
import * as THREE from '../lib/three.js';
import { SMALL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { clamp, lerp, seeded, smooth } from '../util/math.js';
import { fbm2 } from '../util/noise.js';
import { WALL_SETS, scatterCorals } from './corals.js';
import { wg } from './layout.js';

/* ---- the reef wall: a shallow shelf that drops off into deep water ---- */
function buildReef() {
  const G = wg(0), R = seeded(2);
  const prof = [[110, -9], [48, -9], [32, -9.4], [28, -11], [26.4, -16], [26, -28], [26.5, -45], [27.5, -62], [29.5, -90], [33, -130], [38, -190]];
  const pts = [], step = SMALL ? 0.9 : 0.55;
  for (let i = 0; i < prof.length - 1; i++) {
    const [x0, y0] = prof[i], [x1, y1] = prof[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (y0 > -70 ? step : 2.5)));
    for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  pts.push(prof[prof.length - 1]);
  const NZ = SMALL ? 130 : 220, ZR = 65, pos = [], colr = [], idx = [], cand = [], wallCand = [], sizes = [];
  const ridged = (x, y) => 1 - Math.abs(fbm2(x, y, 3) * 2 - 1);   // sharp creases, for cracks in the rock
  const wallMax = new Float32Array(100 * 66).fill(-1e9), shelfTop = new Float32Array(60 * 66).fill(-1e9);   // where the rock is, so the diver cannot swim into it
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = ty, ny = -tx;
    for (let k = 0; k <= NZ; k++) {
      const z = -ZR + (2 * ZR) * k / NZ, [x, y] = pts[i];
      let d;
      if (ny > 0.7) d = (fbm2(x * 0.09 + 5, z * 0.09) - 0.45) * 2.4 + (fbm2(x * 0.6, z * 0.6) - 0.5) * 0.5 + Math.max(0, fbm2(z * 0.05 + 3, x * 0.05) - 0.56) * 22;   // shelf with coral heads
      else {   // rugged wall: bays and buttresses, ledges that come and go, vertical cracks, lumpy rock
        const yy = y + fbm2(z * 0.03, y * 0.02) * 6, per = 5.5, s = ((yy / per) % 1 + 1) % 1;
        const ledge = smooth(clamp((fbm2(z * 0.05 + 3, Math.floor(yy / per) * 1.7) - 0.45) / 0.17)) * 1.7 * smooth(clamp((s - 0.5) / 0.45));
        d = (fbm2(z * 0.11, y * 0.11) - 0.5) * 3.4 + Math.sin(z * 0.09 + y * 0.04) * 1.3 + ledge - 0.5
          - Math.pow(ridged(z * 0.18 + 7, y * 0.06), 6) * 1.8
          + (fbm2(z * 0.35 + 3, y * 0.35) - 0.5) * 2.0 + (fbm2(z * 1.1, y * 1.1) - 0.5) * 0.7;
      }
      pos.push(-(x + nx * d), y + ny * d, z);
      { const X = -(x + nx * d), Y = y + ny * d, iz = Math.min(65, Math.max(0, Math.floor((z + 65) / 2)));
        if (ny > 0.7) { const bx = Math.floor(-X / 2); if (bx >= 0 && bx < 60) shelfTop[bx * 66 + iz] = Math.max(shelfTop[bx * 66 + iz], Y); }
        else { const by = Math.floor(-Y / 2); if (by >= 0 && by < 100) wallMax[by * 66 + iz] = Math.max(wallMax[by * 66 + iz], X); } }
      const crev = clamp(0.5 + d * 0.22), sand = ny > 0.7 ? 1 : 0, alg = fbm2(x * 0.3 + z * 0.2, y * 0.3 + z * 0.1);
      let c;
      if (sand) c = mixc('#d5c8a4', '#b9aa86', fbm2(x * 0.4, z * 0.4));
      else {
        c = mixc('#4a4036', alg > 0.5 ? '#3f4f2c' : '#6a5a48', clamp(alg));
        // encrusting sponges, coralline algae and small corals cover much of a real reef wall
        const b = fbm2(z * 0.22 + 7, y * 0.22 + 3), pal = ['#c9578c', '#d9a03a', '#7d5ba6', '#4fae9e', '#c46a3a', '#8fa85a', '#b0678e', '#e07a5f', '#9a4f86'];
        if (b > 0.46) c = c.clone().lerp(col(pal[Math.floor(fbm2(z * 0.05, y * 0.05 + 9) * 9) % 9]), clamp((b - 0.46) * 6) * 0.85);
        const b2 = fbm2(z * 0.8 + 5, y * 0.8 + 1);
        if (b2 > 0.6) c = c.clone().lerp(col(['#b87aa0', '#d88a6a', '#c7b25a'][Math.floor(b * 30) % 3]), clamp((b2 - 0.6) * 8) * 0.7);
      }
      c = c.clone().multiplyScalar(0.5 + 0.7 * crev);
      if (y < -60) c = c.clone().lerp(col('#26231f'), clamp((-y - 60) / 90));
      colr.push(c.r, c.g, c.b);
      if ((y > -58 && y < -8.5 && Math.abs(z) < 60) || (sand && x > 26 && x < 75 && Math.abs(z) < 60)) { cand.push(i * (NZ + 1) + k); }
      if (!sand && y > -56 && y < -10 && Math.abs(z) < 55) wallCand.push(i * (NZ + 1) + k);
      sizes.push(fbm2(x * 0.2, z * 0.2 + y * 0.2));
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < NZ; k++) {
    const a = i * (NZ + 1) + k, b = a + NZ + 1; idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, bump: 2.2 }));
  G.add(terrain);
  G.userData.bins = { wallMax, shelfTop };
  scatterCorals(G, { pos: g.attributes.position.array, nor: g.attributes.normal.array, candidates: cand, size: sizes });
  scatterCorals(G, { pos: g.attributes.position.array, nor: g.attributes.normal.array, candidates: wallCand, size: sizes }, WALL_SETS, 0.12, 321);
  return G;
}

export { buildReef };
