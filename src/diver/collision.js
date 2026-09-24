/* Keeps the diver out of rock, sand, vent chimneys and the wreck, anywhere in the one continuous world. */
import * as THREE from '../lib/three.js';
import { clamp } from '../util/math.js';
import { groups } from '../world/layout.js';
import { TRENCH, VENTS } from '../world/sites.js';
import { seafloorY } from '../world/terrain.js';
import { landWallX, farWallX, trenchFloorY } from '../world/trench.js';

const CLEAR = 1.6;   // how close the diver may come to the ground (m)
const local = new THREE.Vector3();

// The reef shelf and wall (collision maps made by reef.js)
function reef(pos) {
  const B = groups.reef && groups.reef.userData.bins;
  if (!B || pos.y < -200 || Math.abs(pos.z) >= 66 || pos.x > -15) return;
  const iz = clamp(Math.floor((pos.z + 65) / 2), 0, 65);
  if (pos.y < -9.2) {
    const iy = clamp(Math.floor(-pos.y / 2), 0, 99); let m = -1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.wallMax[clamp(iy + dy, 0, 99) * 66 + clamp(iz + dz, 0, 65)]);
    if (m > -1e8) pos.x = Math.max(pos.x, m + (pos.y > -62 ? 3.0 : 2.0));
  }
  if (pos.x < -24) {
    const bx = clamp(Math.floor(-pos.x / 2), 0, 59); let m = -1e9;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.shelfTop[clamp(bx + dx, 0, 59) * 66 + clamp(iz + dz, 0, 65)]);
    if (m > -1e8) pos.y = Math.max(pos.y, m + CLEAR);
  }
}

// Inside the trench: stay between the two walls and above its floor
function trench(pos) {
  const rim = Math.max(seafloorY(TRENCH.landTop, pos.z), seafloorY(TRENCH.farTop, pos.z));
  if (pos.y < rim) pos.x = clamp(pos.x, landWallX(pos.y, pos.z) + 2.5, farWallX(pos.y, pos.z) - 2.5);
  pos.y = Math.max(pos.y, trenchFloorY(pos.x, pos.z) + CLEAR);
}

// Vent chimneys: round columns you cannot pass through
function vents(pos) {
  for (const [vx, vz, h] of VENTS) {
    const dx = pos.x - vx, dz = pos.z - vz, d = Math.hypot(dx, dz), R = 3.8;
    if (d < R && pos.y < seafloorY(vx, vz) + h + 1.2) { const k = d > 0.01 ? R / d : 1; pos.x = vx + (d > 0.01 ? dx * k : R); pos.z = vz + (d > 0.01 ? dz * k : 0); }
  }
}

// The shipwreck: a box around the hull (in the ship's own frame)
function ship(pos) {
  const s = groups.plain && groups.plain.userData.ship; if (!s) return;
  s.updateWorldMatrix(true, false); local.copy(pos); s.worldToLocal(local);
  const hx = 25, hz = 7.5, yTop = 15, yBot = -8;
  if (Math.abs(local.x) < hx && Math.abs(local.z) < hz && local.y > yBot && local.y < yTop) {
    const px = hx - Math.abs(local.x), pz = hz - Math.abs(local.z), pt = yTop - local.y, pb = local.y - yBot, m = Math.min(px, pz, pt, pb);
    if (m === pz) local.z = Math.sign(local.z || 1) * hz; else if (m === px) local.x = Math.sign(local.x || 1) * hx; else if (m === pt) local.y = yTop; else local.y = yBot;
    pos.copy(s.localToWorld(local));
  }
}

// The height of the ground under (x, z), or -Infinity where there is none (open water above the reef, for example).
function groundAt(x, z) {
  if (x > TRENCH.landTop && x < TRENCH.farTop) return trenchFloorY(x, z);
  return x >= -38 ? seafloorY(x, z) : -Infinity;
}

function constrain(pos) {
  pos.y = Math.min(pos.y, -0.8);                                          // stay below the surface
  reef(pos);
  const inTrench = pos.x > TRENCH.landTop && pos.x < TRENCH.farTop;
  if (inTrench) trench(pos);
  else if (pos.x >= -38) pos.y = Math.max(pos.y, seafloorY(pos.x, pos.z) + CLEAR);
  if (pos.x > 95 && pos.x < 200) vents(pos);
  if (pos.x > 380 && pos.x < 470) ship(pos);
}

export { constrain, groundAt };
