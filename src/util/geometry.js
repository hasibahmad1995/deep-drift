/* Building tools for shapes: lofted bodies, flat fins, merging and painting shapes. */
import * as THREE from '../lib/three.js';
import { col } from './color.js';
import { TAU, lerp, smooth } from './math.js';

// Reads rows like [t, a, b, c] and blends smoothly between them.
function tab(rows, t) {
  for (let i = 1; i < rows.length; i++) {
    if (t <= rows[i][0]) {
      const p = rows[i - 1], q = rows[i], e = smooth((t - p[0]) / ((q[0] - p[0]) || 1));
      return p.slice(1).map((v, k) => lerp(v, q[k + 1], e));
    }
  }
  return rows[rows.length - 1].slice(1);
}

// Joins many shapes into one, so the computer draws them in one go.
function mergeGeo(list) {
  const geos = list.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0; geos.forEach(g => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), colr = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  geos.forEach(g => {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) colr.set(g.attributes.color.array, o * 3); else colr.fill(1, o * 3, (o + c) * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += c;
  });
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setAttribute('color', new THREE.BufferAttribute(colr, 3)); r.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return r;
}
// Colours every point of a shape using fn(position, normal) -> hex or Color.
function paintGeo(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(n, i);
    const v = fn(a, b), k = v.isColor ? v : col(v);
    c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
function place(g, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
  g.applyMatrix4(m); return g;
}
// A flat fin or flipper from a list of [x, y] points.
function flat(pts, scale = 1) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0] * scale, p[1] * scale))), 6);
  g.computeVertexNormals(); return g;
}
// A body built from rings. Nose at +x, tail at -x.
// rows: [t, halfWidth, heightTop, heightBottom, centreY], all as a fraction of the length L.
function loft(L, rows, rings = 44, radial = 22) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, s = tab(rows, t);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, c = Math.cos(a), sn = Math.sin(a);
      pos.push((0.5 - t) * L, (s[3] + (sn > 0 ? s[1] : s[2]) * sn) * L, Math.max(s[0], 0.0005) * c * L);
      uv.push(t, j / radial);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function sphereAt(r, x, y, z, seg = 10) { return place(new THREE.SphereGeometry(r, seg, seg - 2), x, y, z); }

export { tab, mergeGeo, paintGeo, place, flat, loft, sphereAt };
