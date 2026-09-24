/* The abyss: the sea floor around the wreck, the debris field and the whale skeleton. */
import * as THREE from '../lib/three.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { mergeGeo, paintGeo } from '../util/geometry.js';
import { TAU, clamp, seeded } from '../util/math.js';
import { fbm2 } from '../util/noise.js';
import { makeFloor, scatterRocks } from './floor.js';
import { wg } from './layout.js';
import { addRusticles, buildShip } from './ship.js';

const WRECK_FLOOR_Y = -560;
function buildWreck() {
  const G = wg(4), floorH = (x, z) => WRECK_FLOOR_Y + (fbm2(x * 0.02, z * 0.02) - 0.4) * 6 + fbm2(x * 0.15, z * 0.15) * 0.4;
  // the ship lies on its keel with a list to starboard; sediment is heaped up against the buried hull
  const YAW = 0.5, cyw = Math.cos(YAW), syw = Math.sin(YAW);
  const toShip = (x, z) => [x * cyw - z * syw, x * syw + z * cyw];   // sea floor position to ship position (length, beam)
  const berm = (x, z) => { const [lx, lz] = toShip(x, z); return 1.7 * Math.exp(-Math.pow(Math.max(0, Math.abs(lx) - 19) / 6, 2)) * Math.exp(-Math.pow(Math.max(0, Math.abs(lz) - 4.2) / 4, 2)); };
  G.add(makeFloor(320, 150, (x, z) => floorH(x, z) + berm(x, z), (x, z) => mixc('#3a3d40', '#2a2a2b', fbm2(x * 0.1, z * 0.1)).lerp(col('#4a3a2e'), clamp(berm(x, z) * 0.4))));
  scatterRocks(G, 120, 220, floorH, '#3d3f42');
  const ship = buildShip();
  ship.position.set(0, floorH(0, 0) + 3.0, 0); ship.rotation.order = 'YXZ'; ship.rotation.set(0.27, YAW, 0.035); G.add(ship); G.userData.ship = ship;
  ship.updateMatrixWorld(true);
  addRusticles(ship);
  // the debris field: a funnel that fell off, torn plates and a boiler
  {
    const parts = [], R = seeded(66), base = floorH(0, 0), onFloor = (x, z) => floorH(x, z) - base;
    const fun = new THREE.CylinderGeometry(1.25, 1.35, 6.5, 20, 1, true); fun.scale(1, 1, 0.8); fun.computeVertexNormals();
    paintGeo(fun, p => mixc('#2a211c', '#5a3d28', fbm2(p.y * 0.8, Math.atan2(p.z, p.x))).multiplyScalar(p.y > 2.3 ? 0.55 : 1));
    fun.rotateZ(Math.PI / 2 - 0.12); fun.rotateY(1.1); fun.translate(-14, onFloor(-14, 16) + 0.9, 16); parts.push(fun);
    const boiler = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 18); boiler.rotateZ(Math.PI / 2); boiler.rotateY(-0.4); boiler.translate(13, onFloor(13, -15) + 0.9, -15);
    boiler.computeVertexNormals(); paintGeo(boiler, p => mixc('#3a2418', '#6a3a1e', fbm2(p.x, p.z))); parts.push(boiler);
    for (let i = 0; i < 26; i++) {
      const w = 0.8 + R() * 2.6, g = new THREE.BoxGeometry(w, 0.08, 0.6 + R() * 1.6, 3, 1, 2), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) + Math.sin(p.getX(k) * 2.1 + i) * 0.12);   // bent plates
      g.computeVertexNormals(); paintGeo(g, () => ['#4a2e1e', '#3a2a22', '#5a3a24'][i % 3]);
      const a = R() * TAU, r = 12 + R() * 22, x = Math.cos(a) * r, z = Math.sin(a) * r;
      g.rotateX((R() - 0.5) * 0.5); g.rotateY(R() * TAU); g.translate(x, onFloor(x, z) + 0.15, z); parts.push(g);
    }
    const dm = new THREE.Mesh(mergeGeo(parts), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), { detail: true, rust: true, caust: false }));
    dm.position.y = base - 0.25; G.add(dm);   // pieces were placed relative to the floor height at the ship
  }

  // a whale skeleton on the sea floor (a "whale fall")
  {
    const parts = [];
    for (let i = 0; i < 30; i++) { const r = 0.26 * (1 - i / 60) + 0.06, g = new THREE.CylinderGeometry(r, r * 1.05, 0.55, 10); g.rotateZ(Math.PI / 2); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
    for (let i = 3; i < 19; i++) { const rr = 0.5 + 1.4 * Math.sin((i - 3) / 16 * Math.PI) + 0.2, g = new THREE.TorusGeometry(rr, 0.075, 6, 16, Math.PI); g.rotateY(Math.PI / 2); g.scale(1, 0.8, 1); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
    const skull = new THREE.SphereGeometry(1, 16, 12); skull.scale(2.6, 0.9, 1.1); skull.translate(-2.6, 0.6, 0); parts.push(skull);
    const jaw = new THREE.BoxGeometry(4.2, 0.2, 0.35); jaw.translate(-4.2, 0.1, 0.5); parts.push(jaw);
    const bg = mergeGeo(parts); paintGeo(bg, p => mixc('#b3ab95', '#e6dfcc', fbm2(p.x * 2, p.z * 2)));
    const bones = new THREE.Mesh(bg, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), { detail: true, caust: false }));
    const bx = Math.cos(-0.8) * 31, bz = Math.sin(-0.8) * 31;
    bones.position.set(bx - 8, floorH(bx, bz) + 0.2, bz + 6); bones.rotation.y = 0.55; G.add(bones); G.userData.bones = bones;
  }
  G.userData.floorH = floorH; return G;
}

export { WRECK_FLOOR_Y, buildWreck };
