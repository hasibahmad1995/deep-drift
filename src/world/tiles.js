/* Splits one big batch of copies (an InstancedMesh, like 800 corals of one kind) into small square tiles.
   A single batch is drawn whole, even the copies behind you. Tiles let the computer skip the ones
   that are off screen (frustum culling) or too far away to see (culling.js).
   Works for places whose group sits at the world origin (all of ours do). */
import * as THREE from '../lib/three.js';

const m = new THREE.Matrix4(), p = new THREE.Vector3(), c = new THREE.Color();

// Adds mesh to group as tiles of about `size` metres. Returns the tiles.
// far (optional): a tile is never drawn beyond this distance, even in clear water (for small things; see wet() shrink).
function addTiled(group, mesh, size = 20, far = 0) {
  const n = mesh.count, buckets = new Map();
  for (let i = 0; i < n; i++) {
    mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m);
    const key = `${Math.floor(p.x / size)},${Math.floor(p.y / size)},${Math.floor(p.z / size)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  }
  const geo = mesh.geometry, perCopy = Object.keys(geo.attributes).filter(k => geo.attributes[k].isInstancedBufferAttribute);
  const tiles = [];
  for (const ids of buckets.values()) {
    // shared shape; only values stored per copy (like a swaying phase) are cut to this tile
    let g = geo;
    if (perCopy.length) {
      g = new THREE.BufferGeometry(); g.index = geo.index;
      for (const k of Object.keys(geo.attributes)) g.setAttribute(k, geo.attributes[k]);
      for (const k of perCopy) {
        const src = geo.attributes[k], sz = src.itemSize, arr = new Float32Array(ids.length * sz);
        ids.forEach((id, j) => { for (let e = 0; e < sz; e++) arr[j * sz + e] = src.array[id * sz + e]; });
        g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, sz));
      }
    }
    const t = new THREE.InstancedMesh(g, mesh.material, ids.length);
    ids.forEach((id, j) => {
      mesh.getMatrixAt(id, m); t.setMatrixAt(j, m);
      if (mesh.instanceColor) { mesh.getColorAt(id, c); t.setColorAt(j, c); }
    });
    t.computeBoundingSphere();
    t.userData.cull = { center: t.boundingSphere.center.clone(), radius: t.boundingSphere.radius, far };
    t.name = mesh.name; group.add(t); tiles.push(t);
  }
  return tiles;
}

export { addTiled };
