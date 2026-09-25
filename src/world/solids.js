/* Solid things the diver cannot pass through: corals, rocks, sponges, tube worms, parts of the wreck.
   Each one is a ball or a "pill" (a line with a thickness, like an upright coral). The builders add them while the
   world is built; diver/collision.js pushes the diver out of them. They are kept in a grid of 8 m cubes, so only the
   few close to the diver are checked each frame. Big smooth shapes (the reef wall, the sea floor, the trench walls)
   have their own checks in collision.js. */
import * as THREE from '../lib/three.js';
import { UP } from './layout.js';

const CELL = 8;          // metres
const REACH = 1;         // the largest body (radius, m) that will ever be checked against the solids
const grid = new Map();
const SOLIDS = { count: 0, list: [] };   // list: for the tests
const cellKey = (i, j, k) => ((i + 4096) * 8192 + (j + 4096)) * 8192 + (k + 4096);

// A pill from a to b (world points) with radius r. For a ball, a and b are the same point.
function addSolid(a, b, r) {
  const s = { ax: a.x, ay: a.y, az: a.z, dx: b.x - a.x, dy: b.y - a.y, dz: b.z - a.z, r };
  s.l2 = s.dx * s.dx + s.dy * s.dy + s.dz * s.dz;
  const pad = r + REACH;
  const i0 = Math.floor((Math.min(a.x, b.x) - pad) / CELL), i1 = Math.floor((Math.max(a.x, b.x) + pad) / CELL);
  const j0 = Math.floor((Math.min(a.y, b.y) - pad) / CELL), j1 = Math.floor((Math.max(a.y, b.y) + pad) / CELL);
  const k0 = Math.floor((Math.min(a.z, b.z) - pad) / CELL), k1 = Math.floor((Math.max(a.z, b.z) + pad) / CELL);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
    const key = cellKey(i, j, k); let list = grid.get(key);
    if (!list) grid.set(key, list = []);
    list.push(s);
  }
  SOLIDS.count++; SOLIDS.list.push(s);
}
const addBall = (c, r) => addSolid(c, c, r);

const pA = new THREE.Vector3(), pB = new THREE.Vector3(), axis = new THREE.Vector3();
/* Something that grows from base along the direction up (a unit vector), height h tall and r thick (radius).
   Short, wide things (a brain coral dome) become one ball; tall ones (a sea fan, a sponge) become a pill. */
function addGrowth(base, up, h, r) {
  if (h > 2 * r) addSolid(pA.copy(base).addScaledVector(up, r), pB.copy(base).addScaledVector(up, h - r), r);
  else addBall(pA.copy(base).addScaledVector(up, h - r), r);
}

/* Adds one solid for every copy in an InstancedMesh (corals, sponges, tube worms...).
   The shape's own size comes from its bounding box: height = top of the box, thickness = its widest part times
   `thick` (0 to 1; lower for airy shapes like branching corals and fans). Copies shorter than minH are skipped. */
const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
function addSolidsFor(mesh, thick = 0.7, minH = 0.4) {
  const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox, h0 = bb.max.y, w0 = Math.max(bb.max.x, -bb.min.x, bb.max.z, -bb.min.z);
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m); m.decompose(pos, q, sc);
    const s = Math.max(sc.x, sc.z), h = h0 * sc.y, r = w0 * s * thick;
    if (h < minH) continue;
    addGrowth(pos, axis.copy(UP).applyQuaternion(q), h, Math.max(0.1, Math.min(r, h * 0.6)));
  }
}

const c = new THREE.Vector3();
// Pushes a ball (centre p, radius body) out of every solid it overlaps. Returns true if it had to move.
function pushOutOfSolids(p, body) {
  const list = grid.get(cellKey(Math.floor(p.x / CELL), Math.floor(p.y / CELL), Math.floor(p.z / CELL)));
  if (!list) return false;
  let moved = false;
  for (let n = 0; n < list.length; n++) {
    const s = list[n];
    let t = s.l2 > 0 ? ((p.x - s.ax) * s.dx + (p.y - s.ay) * s.dy + (p.z - s.az) * s.dz) / s.l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    c.set(s.ax + s.dx * t, s.ay + s.dy * t, s.az + s.dz * t);
    const ex = p.x - c.x, ey = p.y - c.y, ez = p.z - c.z, d2 = ex * ex + ey * ey + ez * ez, min = s.r + body;
    if (d2 >= min * min) continue;
    const d = Math.sqrt(d2);
    if (d < 1e-5) p.y = c.y + min;   // exactly at the centre: out over the top
    else { const k = (min - d) / d; p.x += ex * k; p.y += ey * k; p.z += ez * k; }
    moved = true;
  }
  return moved;
}

export { SOLIDS, addSolid, addBall, addGrowth, addSolidsFor, pushOutOfSolids };
