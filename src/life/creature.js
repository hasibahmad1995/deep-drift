/* Builds one animal from a recipe (see species.js). */
import * as THREE from '../lib/three.js';
import { wet } from '../engine/wet.js';
import { skin } from './skins.js';
import { flat, loft, mergeGeo, paintGeo, place, sphereAt } from '../util/geometry.js';

/* Builds one animal from a recipe:
   L = length in metres, rows = body shape, paint = colour function,
   fins = extra flat parts, eyes = [x, y, z, radius] as fractions of L. */
function buildCreature(o) {
  const L = o.L, parts = [];
  const body = loft(L, o.rows, o.rings || 48, o.radial || 22);
  paintGeo(body, o.paint || (() => '#888888'));
  parts.push(body);
  (o.fins || []).forEach(f => {
    const g = flat(f.pts, L);
    place(g, f.at[0] * L, f.at[1] * L, f.at[2] * L, f.rot ? f.rot[0] : 0, f.rot ? f.rot[1] : 0, f.rot ? f.rot[2] : 0);
    paintGeo(g, (p, n) => (typeof f.color === 'function' ? f.color(p, n, L) : f.color));
    parts.push(g);
  });
  (o.eyes || []).forEach(e => {
    const g = sphereAt(e[3] * L, e[0] * L, e[1] * L, e[2] * L, 10); g.computeVertexNormals();
    paintGeo(g, () => o.eyeColor || '#0a0a0a'); parts.push(g);
  });
  (o.extra || []).forEach(g => parts.push(g));
  const geo = mergeGeo(parts);
  const mat = wet(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: o.rough == null ? 0.5 : o.rough, metalness: 0.04, side: THREE.DoubleSide, map: o.map ? skin(o.map) : null,
    transparent: !!o.alpha, opacity: o.alpha || 1,
    emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0), emissiveIntensity: 1
  }), { bend: o.bend });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.len = L; mesh.frustumCulled = false;
  return mesh;
}
function makeCreature(spec) { return buildCreature(spec); }

export { buildCreature, makeCreature };
