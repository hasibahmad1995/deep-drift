/* More to see: dolphins, moon jellies, swirling schools, the siphonophore, vent shrimp, named spots. */
import * as THREE from '../lib/three.js';
import { pathAt, tu } from '../dive/route.js';
import { DETAIL } from '../engine/device.js';
import { scene } from '../engine/renderer.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { makeCreature } from './creature.js';
import { makeJelly } from './jelly.js';
import { passBy, view } from './motion.js';
import { initPassers } from './passers.js';
import { School } from './school.js';
import { shrimpGeo, smallFishGeo } from './small-shapes.js';
import { SPECIES } from './species.js';
import { col } from '../util/color.js';
import { rand } from '../util/math.js';
import { buildBoat } from '../world/boat.js';
import { VENTS, WRECK, WHALE } from '../world/sites.js';
import { seafloorY } from '../world/terrain.js';

// A named spot (no animal) so the caption and fact can show when you are near.
function pseudo(name, pos, range) { const o = new THREE.Object3D(); o.position.copy(pos); ACTORS.push({ obj: o, name, range, update() {} }); }
function buildExtras() {
  buildBoat();
  // dolphins pass overhead at the start
  [[0, 0], [2.4, 1.6], [-2.2, 2.6]].forEach(([s, f], i) => {
    const d = makeCreature(SPECIES.dolphin);
    passBy(d, tu(0, 0.16), view(tu(0, 0.16), 9 + f, 3 + s, 1.5 - i * 0.3), view(tu(0, 0.16), 0, -2.4, 0.1), 'Dolphin', 20);
  });
  // moon jellies drift near the reef
  for (let i = 0; i < 9; i++) {
    const j = makeJelly(0.56 + rand(-0.05, 0.05), 0.05), s = rand(0.35, 0.8), tm = tu(0, rand(0.1, 0.7)), meet = pathAt(tm).pos.clone().add(view(tm, rand(3, 9), rand(-6, 6), rand(-2, 3)));
    j.scale.setScalar(s); scene.add(j);
    ACTORS.push({ obj: j, name: 'Jellyfish', range: 8, update(t) { j.position.set(meet.x + Math.sin(t * 0.13 + i) * 0.5, meet.y + (t - tm) * 0.1, meet.z + Math.cos(t * 0.11 + i) * 0.5); } });
  }
  // schools that swirl: silver jacks in the open blue, glowing lanternfish in the dark
  const silverMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.45, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const glowMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: new THREE.Color(0.06, 0.5, 0.8), emissiveIntensity: 1.0, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const swirl = (mat, n, tm, f, s, u, radius, om, spread, scale, colors, name) => {
    const c = pathAt(tm).pos.clone().add(view(tm, f, s, u));
    const sch = new School(smallFishGeo(), mat, n, { center: [c.x, c.y, c.z], radius, omega: om, phase: rand(0, 6), spread, scale, colors, rise: 1.2, name: name || 'Silver jacks' });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); if (name) pseudo(name, c, radius + 9);
  };
  swirl(silverMat, Math.round(220 * Math.max(DETAIL, 0.5)), tu(1, 0.2), 7, 12, 0, 5.5, 0.32, 3, 1.6, ['#c9d3d8', '#b5c2c9', '#dfe6e9'], null);   // beside you at the drop-off
  swirl(glowMat, 90, tu(2, 0.35), 10, 3, -1, 4, 0.25, 2.5, 1.5, ['#9fe8ff', '#7fd6ff'], 'Lanternfish');
  swirl(glowMat, 80, tu(2, 0.9), 9, -3, 0, 4, -0.22, 2.5, 1.5, ['#8fe0ff', '#b0f0ff'], 'Lanternfish');
  // a sperm whale hunting squid in the twilight zone
  passBy(makeCreature(SPECIES.sperm), tu(2, 0.75), view(tu(2, 0.75), 15, -8, -3), view(tu(2, 0.75), 0.2, 1.1, 0), 'Sperm whale', 40, null, true);
  // a siphonophore: a glowing chain of animals
  const N = 70, sm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), wet(new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, emissive: new THREE.Color(0.5, 0.15, 0.45), emissiveIntensity: 1.0 }), { caust: false }), N);
  const sg = new THREE.Group(); sg.add(sm); scene.add(sg); sm.frustumCulled = false;
  for (let i = 0; i < N; i++) sm.setColorAt(i, col(i % 7 === 0 ? '#ffb070' : '#ff7ad0'));
  const tS = tu(2, 0.6), mS = pathAt(tS).pos.clone().add(view(tS, 9, 2, 1)), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3();
  ACTORS.push({ obj: sg, name: 'Siphonophore', range: 16, update(t) {
    sg.position.copy(mS).add(pp.set((t - tS) * 0.15, (t - tS) * 0.05, 0));
    for (let i = 0; i < N; i++) { const u = i / (N - 1), r = (0.09 + 0.09 * Math.pow(Math.sin(i * 0.9), 2)) * (i % 7 === 0 ? 1.6 : 1);
      pp.set((u - 0.5) * 14, Math.sin(u * 6 + t * 0.7) * 1.3, Math.cos(u * 5 + t * 0.55) * 1.3); ss.setScalar(r); mm.compose(pp, qq, ss); sm.setMatrixAt(i, mm); }
    sm.instanceMatrix.needsUpdate = true;
  } });
  // vents: shrimp swarms, and named spots for captions
  const fh = seafloorY;
  const whiteMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color(0.25, 0.12, 0.05), emissiveIntensity: 1.0, side: THREE.DoubleSide }), { caust: false, bend: { mode: 1, amp: 0.14, speed: 14, wave: 6, len: 0.18 } });
  [0, 3].forEach(k => {
    const v = VENTS[k], c = new THREE.Vector3(v[0], fh(v[0], v[1]) + 5, v[1]);
    const sch = new School(shrimpGeo(), whiteMat, 90, { center: [c.x, c.y, c.z], radius: 2, omega: 0.7, phase: k, spread: 1.2, scale: 0.5, colors: ['#f3ede0', '#ffe9d0'], rise: 1 });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); pseudo('Vent shrimp', c, 14);
  });
  VENTS.forEach((v, i) => { pseudo('Hydrothermal vent', new THREE.Vector3(v[0], fh(v[0], v[1]) + 5, v[1]), 14); if (i < 3) pseudo('Giant tube worms', new THREE.Vector3(v[0] + 2, fh(v[0], v[1]) + 1, v[1] + 2), 9); });
  // amphipods swarm on the floor of the Challenger Deep
  { const tt = tu(8, 0.5), c = pathAt(tt).pos.clone().add(view(tt, 6, 1, -0.5));
    const sch = new School(shrimpGeo(), whiteMat, 70, { center: [c.x, c.y, c.z], radius: 2.5, omega: 0.5, phase: 1, spread: 1.6, scale: 0.4, colors: ['#f5e6dc', '#ffd9c0'], rise: 1 });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); pseudo('Amphipods', c, 12); }
  // the abyssal plain: the imagined wreck and a whale skeleton
  pseudo('Shipwreck', new THREE.Vector3(WRECK.x, seafloorY(WRECK.x, WRECK.z) + 8, WRECK.z), 30);
  pseudo('Whale skeleton', new THREE.Vector3(WHALE.x + 8, seafloorY(WHALE.x + 8, WHALE.z) + 1, WHALE.z), 20);
  initPassers({ silverMat, glowMat, whiteMat });
  // real barramundi name for the reef schools
  [[13, -7, 2], [15, -25, 5], [16, -46, -3]].forEach(c => pseudo('Barramundi', new THREE.Vector3(-c[0], c[1], c[2]), 12));
}

export { pseudo, buildExtras };
