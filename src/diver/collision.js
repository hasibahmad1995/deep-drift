/* Keeps the diver out of rock, sand, vent chimneys, the wreck, corals and everything else solid, anywhere in the one
   continuous world. The diver is a ball BODY metres across the middle; the camera (the mask) is at its centre. */
import * as THREE from '../lib/three.js';
import { clamp } from '../util/math.js';
import { groups } from '../world/layout.js';
import { TRENCH, VENTS } from '../world/sites.js';
import { seafloorY } from '../world/terrain.js';
import { landWallX, farWallX, trenchFloorY } from '../world/trench.js';
import { SHIP_L2, shipBeam, shipDeckY, shipKeelY } from '../world/ship.js';
import { pushOutOfSolids } from '../world/solids.js';

const CLEAR = 1.6;   // how close the diver may come to the ground (m)
const BODY = 0.45;   // the diver's size for everything else: head, shoulders and tank (m, radius)
const local = new THREE.Vector3();

// The reef shelf and wall (collision maps made by reef.js: the highest rock in each 2 m square).
// Each map is first widened by one square (so a bump is felt a little early), then read smoothly between squares,
// so the diver glides up and over bumps instead of stepping up to 2 m in one frame.
function widen(src, rows) {
  const out = new Float32Array(src.length).fill(-1e9);
  for (let a = 0; a < rows; a++) for (let b = 0; b < 66; b++) {
    let m = -1e9;
    for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) m = Math.max(m, src[clamp(a + da, 0, rows - 1) * 66 + clamp(b + db, 0, 65)]);
    out[a * 66 + b] = m;
  }
  return out;
}
// Height (or reach) of a widened map at fractional square (u, v); -1e9 where there is no rock.
function smoothMap(map, rows, u, v) {
  const a0 = clamp(Math.floor(u), 0, rows - 1), b0 = clamp(Math.floor(v), 0, 65), a1 = Math.min(a0 + 1, rows - 1), b1 = Math.min(b0 + 1, 65);
  const ta = clamp(u - a0), tb = clamp(v - b0);
  const c00 = map[a0 * 66 + b0], c01 = map[a0 * 66 + b1], c10 = map[a1 * 66 + b0], c11 = map[a1 * 66 + b1];
  const top = Math.max(c00, c01, c10, c11);
  if (top < -1e8) return -1e9;
  if (Math.min(c00, c01, c10, c11) < -1e8) return top;   // at the edge of the rock: be careful
  return (c00 * (1 - tb) + c01 * tb) * (1 - ta) + (c10 * (1 - tb) + c11 * tb) * ta;
}
function smoothMaps(B) { if (!B.wallSmooth) { B.wallSmooth = widen(B.wallMax, 100); B.shelfSmooth = widen(B.shelfTop, 60); } }
function reef(pos) {
  const B = groups.reef && groups.reef.userData.bins;
  if (!B || pos.y < -200 || Math.abs(pos.z) >= 66 || pos.x > -15) return;
  smoothMaps(B);
  const v = (pos.z + 65) / 2 - 0.5;
  if (pos.y < -9.2) {
    const m = smoothMap(B.wallSmooth, 100, -pos.y / 2 - 0.5, v);
    if (m > -1e8) pos.x = Math.max(pos.x, m + 2 + clamp((pos.y + 70) / 8));   // 3 m off the wall, 2 m in the deep reef (which has fewer corals)
  }
  if (pos.x < -24) {
    const m = smoothMap(B.shelfSmooth, 60, -pos.x / 2 - 0.5, v);
    // only right at the shelf: far below its edge you are beside the wall (handled above), not under the shelf
    if (m > -1e8 && pos.y > m - 6) pos.y = Math.max(pos.y, m + CLEAR);
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

// The shipwreck, in the ship's own frame: the hull follows its real shape (narrow at bow and stern, deck rising toward
// the ends), plus the deckhouse, bridge and hatches as boxes. Masts and railings are in the solids grid (wreck.js).
function ship(pos) {
  const s = groups.plain && groups.plain.userData.ship; if (!s) return;
  s.updateWorldMatrix(true, false); local.copy(pos); s.worldToLocal(local);
  let moved = false;
  if (Math.abs(local.x) < SHIP_L2 + BODY) {
    const x = clamp(local.x, -SHIP_L2, SHIP_L2), beam = shipBeam(x) + BODY, top = shipDeckY(x) + 0.3 + BODY, bot = shipKeelY(x) - BODY, end = SHIP_L2 + BODY;
    if (Math.abs(local.z) < beam && local.y < top && local.y > bot) {
      const up = top - local.y, side = beam - Math.abs(local.z), along = end - Math.abs(local.x), m = Math.min(up, side, along);
      if (m === up) local.y = top; else if (m === side) local.z = Math.sign(local.z || 1) * beam; else local.x = Math.sign(local.x || 1) * end;
      moved = true;
    }
  }
  for (const [lo, hi] of s.userData.boxes) moved = outOfBox(local, lo, hi) || moved;
  if (moved) pos.copy(s.localToWorld(local));
}
// Pushes p out of a box (grown by the diver's size) the shortest way. Returns true if it moved.
function outOfBox(p, lo, hi) {
  const x0 = lo.x - BODY, x1 = hi.x + BODY, y0 = lo.y - BODY, y1 = hi.y + BODY, z0 = lo.z - BODY, z1 = hi.z + BODY;
  if (p.x <= x0 || p.x >= x1 || p.y <= y0 || p.y >= y1 || p.z <= z0 || p.z >= z1) return false;
  const opts = [[x0 - p.x, 'x', x0], [x1 - p.x, 'x', x1], [y1 - p.y, 'y', y1], [z0 - p.z, 'z', z0], [z1 - p.z, 'z', z1]];   // never pushed down into the deck
  let best = opts[0]; for (const o of opts) if (Math.abs(o[0]) < Math.abs(best[0])) best = o;
  p[best[1]] = best[2]; return true;
}

// The height of the ground under (x, z), or -Infinity where there is none (open water above the reef, for example).
function groundAt(x, z) {
  if (x > TRENCH.landTop && x < TRENCH.farTop) return trenchFloorY(x, z);
  return x >= -38 ? seafloorY(x, z) : -Infinity;
}

function rockAndFloor(pos) {
  reef(pos);
  const inTrench = pos.x > TRENCH.landTop && pos.x < TRENCH.farTop;
  if (inTrench) trench(pos);
  else if (pos.x >= -38) pos.y = Math.max(pos.y, seafloorY(pos.x, pos.z) + CLEAR);
}

function constrain(pos) {
  pos.y = Math.min(pos.y, -0.8);                                          // stay below the surface
  rockAndFloor(pos);
  if (pos.x > 95 && pos.x < 200) vents(pos);
  if (pos.x > 380 && pos.x < 470) ship(pos);
  // corals, rocks, sponges, bones...: slide around them. A few passes settle a squeeze between two of them, and
  // the rock and floor get the last word each time, so a push never ends up inside the reef or the ground.
  for (let i = 0; i < 3 && pushOutOfSolids(pos, BODY); i++) rockAndFloor(pos);
}

/* True if p is inside rock or the sea floor, or closer to it than gap metres. For animals (their paths are checked
   with this), so unlike the diver's checks above it has no extra room built in: gap is the only margin. */
function inRock(p, gap = 0.5) {
  const B = groups.reef && groups.reef.userData.bins;
  if (B && p.y > -200 && Math.abs(p.z) < 66 && p.x < -15) {
    smoothMaps(B);
    const v = (p.z + 65) / 2 - 0.5;
    if (p.y < -9.2) { const m = smoothMap(B.wallSmooth, 100, -p.y / 2 - 0.5, v); if (m > -1e8 && p.x < m + gap) return true; }
    if (p.x < -24) { const m = smoothMap(B.shelfSmooth, 60, -p.x / 2 - 0.5, v); if (m > -1e8 && p.y > m - 6 && p.y < m + gap) return true; }
  }
  if (p.x > TRENCH.landTop && p.x < TRENCH.farTop) {
    const rim = Math.max(seafloorY(TRENCH.landTop, p.z), seafloorY(TRENCH.farTop, p.z));
    if (p.y < rim && (p.x < landWallX(p.y, p.z) + gap || p.x > farWallX(p.y, p.z) - gap)) return true;
    return p.y < trenchFloorY(p.x, p.z) + gap;
  }
  if (p.x >= -38 && p.y < seafloorY(p.x, p.z) + gap) return true;
  if (p.x > 95 && p.x < 200) for (const [vx, vz, h] of VENTS) if (Math.hypot(p.x - vx, p.z - vz) < 2.4 + gap && p.y < seafloorY(vx, vz) + h) return true;   // chimneys are up to 2.2 m wide at the foot
  return false;
}

export { constrain, groundAt, inRock, BODY };
