/* The dive boat seen from below at the start. */
import * as THREE from '../lib/three.js';
import { scene } from '../engine/renderer.js';
import { wet } from '../engine/wet.js';
import { col } from '../util/color.js';
import { loft, mergeGeo, paintGeo } from '../util/geometry.js';
import { UP } from './layout.js';

/* ---- a dive boat, seen from below at the start ---- */
function buildBoat() {
  const G = new THREE.Group(), O = new THREE.Vector3();   // the boat floats above the reef
  const hull = loft(9, [[0, 0.002, 0.002, 0.03, 0], [0.08, 0.07, 0.002, 0.055, 0], [0.25, 0.15, 0.002, 0.085, 0], [0.7, 0.16, 0.002, 0.09, 0], [0.95, 0.11, 0.002, 0.06, 0], [1, 0.09, 0.002, 0.05, 0]], 30, 20);
  paintGeo(hull, p => (p.y < -0.28 ? '#1d3a63' : '#e9eef0'));
  const motor = new THREE.BoxGeometry(0.4, 0.9, 0.3); motor.translate(-4.6, -0.5, 0); paintGeo(motor, () => '#2a2d31');
  const prop = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12); prop.rotateZ(Math.PI / 2); prop.translate(-4.85, -0.95, 0); paintGeo(prop, () => '#8b939a');
  const mesh = new THREE.Mesh(mergeGeo([hull, motor, prop]), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }), { caust: false }));
  mesh.rotation.y = Math.PI; G.add(mesh);
  const a = new THREE.Vector3(-4.5, -0.3, 0), b = new THREE.Vector3(-30, -9, 2), len = a.distanceTo(b);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), wet(new THREE.MeshStandardMaterial({ color: col('#8a7f68'), roughness: 0.9 }), {}));
  rope.position.copy(a).add(b).multiplyScalar(0.5); rope.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize()); G.add(rope);
  const anchor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), wet(new THREE.MeshStandardMaterial({ color: col('#3a3d40'), roughness: 0.6 }), {})); anchor.position.copy(b).add(new THREE.Vector3(0, 0.1, 0)); G.add(anchor);
  G.position.set(O.x - 14, 0, O.z - 6.5); scene.add(G); return G;
}

export { buildBoat };
