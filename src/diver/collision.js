/* Keeps the diver out of rock, sand, chimneys and the wreck. */
import * as THREE from '../lib/three.js';
import { clamp } from '../util/math.js';
import { STAGE_ORIGIN, groups } from '../world/layout.js';

const swimLocal = new THREE.Vector3();
// Keeps the diver out of rock, sand, chimneys and the wreck.
function constrain(pos, si) {
  if (si <= 2) {
    pos.y = Math.min(pos.y, -0.8);
    const B = groups.reef && groups.reef.userData.bins;
    if (B && pos.y > -200 && Math.abs(pos.z) < 66) {
      const iz = clamp(Math.floor((pos.z + 65) / 2), 0, 65);
      if (pos.y < -9.2) {
        const iy = clamp(Math.floor(-pos.y / 2), 0, 99); let m = -1e9;
        for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.wallMax[clamp(iy + dy, 0, 99) * 66 + clamp(iz + dz, 0, 65)]);
        if (m > -1e8) pos.x = Math.max(pos.x, m + (pos.y > -62 ? 3.0 : 2.0));
      }
      if (pos.x < -24) {
        const bx = clamp(Math.floor(-pos.x / 2), 0, 59); let m = -1e9;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.shelfTop[clamp(bx + dx, 0, 59) * 66 + clamp(iz + dz, 0, 65)]);
        if (m > -1e8) pos.y = Math.max(pos.y, m + 1.6);
      }
    }
  } else if (si === 3) {
    const g = groups.vents, O = STAGE_ORIGIN(3), lx = pos.x - O.x, lz = pos.z - O.z;
    pos.y = Math.max(pos.y, g.userData.floorH(lx, lz) + 1.5);
    g.userData.vents.forEach((v, i) => {
      const dx = lx - v[0], dz = lz - v[1], d = Math.hypot(dx, dz), R = 3.8, top = g.userData.floorH(v[0], v[1]) + g.userData.ventH[i] + 1.2;
      if (d < R && pos.y < top) { const k = d > 0.01 ? R / d : 1; pos.x = O.x + v[0] + (d > 0.01 ? dx * k : R); pos.z = O.z + v[1] + (d > 0.01 ? dz * k : 0); }
    });
  } else if (si === 4) {
    const g = groups.wreck, O = STAGE_ORIGIN(4);
    pos.y = Math.max(pos.y, g.userData.floorH(pos.x - O.x, pos.z - O.z) + 1.5);
    const ship = g.userData.ship; ship.updateWorldMatrix(true, false); swimLocal.copy(pos); ship.worldToLocal(swimLocal);
    const hx = 25, hz = 10, yTop = 16, yBot = -8;
    if (Math.abs(swimLocal.x) < hx && Math.abs(swimLocal.z) < hz && swimLocal.y > yBot && swimLocal.y < yTop) {
      const px = hx - Math.abs(swimLocal.x), pz = hz - Math.abs(swimLocal.z), pt = yTop - swimLocal.y, pb = swimLocal.y - yBot, m = Math.min(px, pz, pt, pb);
      if (m === pz) swimLocal.z = Math.sign(swimLocal.z || 1) * hz; else if (m === px) swimLocal.x = Math.sign(swimLocal.x || 1) * hx; else if (m === pt) swimLocal.y = yTop; else swimLocal.y = yBot;
      pos.copy(ship.localToWorld(swimLocal));
    }
  } else {
    const g = groups.trench, O = STAGE_ORIGIN(5);
    pos.x = O.x + clamp(pos.x - O.x, -10.5, 10.5); pos.y = Math.max(pos.y, g.userData.floorY + 3);
  }
}

export { constrain };
