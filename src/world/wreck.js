/* The abyssal plain (~5,000 m): the shipwreck with its debris field, a whale skeleton, and manganese nodules
   (the dark lumps that cover large parts of the real Pacific abyssal plain). All stand on the shared sea floor. */
import * as THREE from '../lib/three.js';
import { DETAIL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { mergeGeo, paintGeo } from '../util/geometry.js';
import { TAU, lerp, seeded } from '../util/math.js';
import { fbm2 } from '../util/noise.js';
import { WRECK, WHALE } from './sites.js';
import { seafloorY } from './terrain.js';
import { addRusticles, buildShip } from './ship.js';
import { addSolid } from './solids.js';
import { addTiled } from './tiles.js';

// The debris field: a funnel that fell off, a boiler, and torn, bent plates around the ship.
function debris() {
  const parts = [], R = seeded(66), at = (dx, dz, lift) => [WRECK.x + dx, seafloorY(WRECK.x + dx, WRECK.z + dz) + lift, WRECK.z + dz];
  const fun = new THREE.CylinderGeometry(1.25, 1.35, 6.5, 20, 1, true); fun.scale(1, 1, 0.8); fun.computeVertexNormals();
  paintGeo(fun, p => mixc('#2a211c', '#5a3d28', fbm2(p.y * 0.8, Math.atan2(p.z, p.x))).multiplyScalar(p.y > 2.3 ? 0.55 : 1));
  fun.rotateZ(Math.PI / 2 - 0.12); fun.rotateY(1.1); fun.translate(...at(-14, 16, 0.65)); parts.push(fun);
  const boiler = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 18); boiler.rotateZ(Math.PI / 2); boiler.rotateY(-0.4); boiler.translate(...at(13, -15, 0.65));
  boiler.computeVertexNormals(); paintGeo(boiler, p => mixc('#3a2418', '#6a3a1e', fbm2(p.x, p.z))); parts.push(boiler);
  const lying = (c, axis, half, r) => { const v = new THREE.Vector3(...c), a = new THREE.Vector3(...axis).normalize().multiplyScalar(half); addSolid(v.clone().sub(a), v.clone().add(a), r); };
  lying(at(-14, 16, 0.65), [-0.45, 0.12, 0.885], 3.25, 1.3); lying(at(13, -15, 0.65), [-0.921, 0, -0.389], 1.6, 1.4);   // solid
  for (let i = 0; i < 26; i++) {
    const w = 0.8 + R() * 2.6, g = new THREE.BoxGeometry(w, 0.08, 0.6 + R() * 1.6, 3, 1, 2), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) + Math.sin(p.getX(k) * 2.1 + i) * 0.12);   // bent plates
    g.computeVertexNormals(); paintGeo(g, () => ['#4a2e1e', '#3a2a22', '#5a3a24'][i % 3]);
    const a = R() * TAU, r = 12 + R() * 22;
    g.rotateX((R() - 0.5) * 0.5); g.rotateY(R() * TAU); g.translate(...at(Math.cos(a) * r, Math.sin(a) * r, -0.1)); parts.push(g);
  }
  return new THREE.Mesh(mergeGeo(parts), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), { detail: true, rust: true, caust: false }));
}

// A whale skeleton on the sea floor (a "whale fall")
function whaleSkeleton() {
  const parts = [];
  for (let i = 0; i < 30; i++) { const r = 0.26 * (1 - i / 60) + 0.06, g = new THREE.CylinderGeometry(r, r * 1.05, 0.55, 10); g.rotateZ(Math.PI / 2); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
  for (let i = 3; i < 19; i++) { const rr = 0.5 + 1.4 * Math.sin((i - 3) / 16 * Math.PI) + 0.2, g = new THREE.TorusGeometry(rr, 0.075, 6, 16, Math.PI); g.rotateY(Math.PI / 2); g.scale(1, 0.8, 1); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
  const skull = new THREE.SphereGeometry(1, 16, 12); skull.scale(2.6, 0.9, 1.1); skull.translate(-2.6, 0.6, 0); parts.push(skull);
  const jaw = new THREE.BoxGeometry(4.2, 0.2, 0.35); jaw.translate(-4.2, 0.1, 0.5); parts.push(jaw);
  const bg = mergeGeo(parts); paintGeo(bg, p => mixc('#b3ab95', '#e6dfcc', fbm2(p.x * 2, p.z * 2)));
  const bones = new THREE.Mesh(bg, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), { detail: true, caust: false }));
  bones.position.set(WHALE.x, seafloorY(WHALE.x, WHALE.z) + 0.2, WHALE.z); bones.rotation.y = WHALE.yaw;
  bones.updateMatrixWorld(true); const w = (x, y, z) => bones.localToWorld(new THREE.Vector3(x, y, z));
  addSolid(w(3, 0.5, 0), w(11.5, 0.5, 0), 1.7); addSolid(w(-4.6, 0.6, 0), w(-0.6, 0.6, 0), 0.9);   // the rib cage and the skull are solid
  return bones;
}

// Manganese nodules: dark, lumpy stones a few cm across, lying on the mud
function nodules(n) {
  const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.75 + fbm2(p.getX(i) * 2 + p.getZ(i), p.getY(i) * 2, 3) * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.6, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, wet(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), { caust: false }), n);
  const R = seeded(90), m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const x = lerp(345, 552, R()), z = (R() - 0.5) * 90, sc = 0.04 + Math.pow(R(), 2) * 0.1;
    pp.set(x, seafloorY(x, z) + sc * 0.2, z); q.setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)); s.setScalar(sc);
    m.compose(pp, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(['#1c1712', '#2a2019', '#15120f'][i % 3]));
  }
  return mesh;
}

function buildWreck() {
  const G = new THREE.Group(); G.name = 'plain';
  // the ship lies on its keel with a list to starboard, half buried (terrain.js heaps sediment against the hull)
  const ship = buildShip();
  ship.position.set(WRECK.x, seafloorY(WRECK.x, WRECK.z) + 1.3, WRECK.z); ship.rotation.order = 'YXZ'; ship.rotation.set(0.27, WRECK.yaw, 0.035);
  G.add(ship); G.userData.ship = ship;
  ship.updateMatrixWorld(true);
  addRusticles(ship);
  ship.userData.pills.forEach(([a, b, r]) => addSolid(a.clone().applyMatrix4(ship.matrixWorld), b.clone().applyMatrix4(ship.matrixWorld), r));   // masts, railings, winches
  G.add(debris(), whaleSkeleton()); addTiled(G, nodules(Math.round(1400 * Math.max(DETAIL, 0.5))), 25);
  G.userData.cull = { center: new THREE.Vector3(450, seafloorY(450, 0), 0), radius: 130 };
  return G;
}

export { buildWreck };
