/* The main cast: which animals appear where and when during the dive. */
import * as THREE from '../lib/three.js';
import { pathAt } from '../dive/path.js';
import { tu } from '../dive/timeline.js';
import { DETAIL, SMALL } from '../engine/device.js';
import { scene } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { BARRA } from './barramundi.js';
import { makeCreature } from './creature.js';
import { makeJelly } from './jelly.js';
import { orbit, passBy, view } from './motion.js';
import { School } from './school.js';
import { smallFishGeo } from './small-shapes.js';
import { SPECIES } from './species.js';
import { makeTurtle } from './turtle.js';
import { col } from '../util/color.js';
import { loft } from '../util/geometry.js';
import { TAU, lerp, rand } from '../util/math.js';
import { glowSprite } from '../world/effects.js';
import { STAGE_ORIGIN, groups } from '../world/layout.js';
import { TRENCH_TOP_Y } from '../world/trench.js';

function buildLife() {
  const schools = [];
  const addSchool = (school) => { scene.add(school.mesh); schools.push(school); };
  const fishMat = () => wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const smallMat = fishMat();
  const nb = Math.max(10, Math.round(34 * DETAIL)), nSmall = Math.max(40, Math.round(140 * DETAIL));
  const O = STAGE_ORIGIN(0);
  const cfg = (c, r, om, ph, sp, sc, colors, rise) => ({ center: [-c[0] + O.x, c[1], c[2] + O.z], radius: r, omega: om, phase: ph, spread: sp, scale: sc, colors, rise: rise == null ? 1.2 : rise });
  if (BARRA.model) {
    [[[13, -7, 2], 7, 0.16, 0], [[15, -25, 5], 8, -0.14, 2], [[16, -46, -3], 8, 0.15, 4]].forEach(([c, r, om, ph]) =>
      addSchool(Object.assign(new School(BARRA.model.geometry.clone(), BARRA.model.material, nb, cfg(c, r, om, ph, 2.4, 1.0)), { name: 'Barramundi' })));
  }
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'], yellow = ['#f2d13a', '#ffd84a', '#f0c020'];
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, nSmall, cfg([15, -15, -4], 7, 0.2, 1, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.8), cfg([16, -32, 3], 7, -0.18, 3, 3.0, 0.9, teal)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.4), cfg([15, -39, -3], 6, 0.17, 5, 2.4, 1.3, yellow)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.7), cfg([17, -52, 2], 8, -0.16, 2, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  ACTORS.push({ update: t => schools.forEach(s => s.update(t)), obj: null });

  // sharks, turtle, manta
  [[[19, -30, 0], 12, 0.12, 0], [[17, -41, 8], 10, -0.15, 2], [[20, -21, -7], 13, 0.1, 4.2]].forEach(([c, r, om, ph]) => {
    const m = makeCreature(SPECIES.blacktip); orbit(m, new THREE.Vector3(-c[0], c[1], c[2]).add(STAGE_ORIGIN(0)), r, om, ph, 1.5, 'Blacktip reef shark', 30);
  });
  const turtle = makeTurtle();
  passBy(turtle, tu(0, 0.34), view(tu(0, 0.34), 7, 3, 0.5), view(tu(0, 0.34), 0, -0.75, 0), 'Green sea turtle', 20, turtle.userData.update);
  passBy(makeCreature(SPECIES.manta), tu(0, 0.9), view(tu(0, 0.9), 14, 0, 5), view(tu(0, 0.9), 0, -1.4, 0), 'Giant manta ray', 34);
  // open ocean
  passBy(makeCreature(SPECIES.whaleshark), tu(1, 0.16), view(tu(1, 0.16), 15, 8, -1), view(tu(1, 0.16), 0, -1.3, 0), 'Whale shark', 40);
  passBy(makeCreature(SPECIES.greatwhite), tu(1, 0.34), view(tu(1, 0.34), 12, -7, -2), view(tu(1, 0.34), -0.3, 1.2, 0), 'Great white shark', 34);
  passBy(makeCreature(SPECIES.humpback), tu(1, 0.52), view(tu(1, 0.52), 32, 18, -6), view(tu(1, 0.52), 0, -1.4, 0), 'Humpback whale', 60);
  // jellyfish drift up through the twilight and midnight water
  const jelly = (si, u0, u1, n, hue, glow) => {
    for (let i = 0; i < n; i++) {
      const j = makeJelly(hue + rand(-0.05, 0.05), glow), s = rand(0.6, 1.5), tm = tu(si, lerp(u0, u1, Math.random()));
      j.scale.setScalar(s);
      const meet = pathAt(tm).pos.clone().add(view(tm, rand(4, 16), rand(-9, 9), rand(-4, 5)));
      scene.add(j);
      ACTORS.push({ obj: j, name: 'Jellyfish', range: 12, update(t) { j.position.set(meet.x + Math.sin(t * 0.13 + i) * 0.6, meet.y + (t - tm) * 0.18, meet.z + Math.cos(t * 0.11 + i) * 0.6); } });
    }
  };
  jelly(1, 0.45, 1.0, SMALL ? 9 : 16, 0.85, 0.5);
  jelly(2, 0.0, 0.6, SMALL ? 5 : 9, 0.5, 1.0);
  // midnight zone
  const squid = new THREE.Group(), sm = makeCreature(SPECIES.squid); squid.add(sm);
  const armMat = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len: 2.6 } });
  for (let i = 0; i < 10; i++) {
    const long = i >= 8, len = long ? 4.8 : 2.4 + (i % 3) * 0.3, g = loft(len, [[0, 0.004, 0.004, 0.004, 0], [0.05, 0.03, 0.03, 0.03, 0], [long ? 0.85 : 0.5, 0.012, 0.012, 0.012, 0], [long ? 0.9 : 1, long ? 0.035 : 0.004, long ? 0.03 : 0.004, 0.03, 0], [1, 0.004, 0.004, 0.004, 0]], 24, 8);
    const a = i / 10 * TAU, arm = new THREE.Mesh(g, armMat.clone()); arm.userData.len = len;
    arm.material = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len } });
    arm.position.set(2.1 + len / 2, Math.sin(a) * 0.22, Math.cos(a) * 0.22); arm.rotation.y = Math.cos(a) * 0.06; squid.add(arm);
  }
  passBy(squid, tu(2, 0.3), view(tu(2, 0.3), 12, 6, 0), view(tu(2, 0.3), -0.3, -0.55, 0), 'Giant squid', 34);
  const ang = makeCreature(SPECIES.angler), lure = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, 0.24, 0), new THREE.Vector3(0.55, 0.42, 0), new THREE.Vector3(0.8, 0.5, 0)]), 12, 0.006, 5), new THREE.MeshStandardMaterial({ color: 0x3a2d28, roughness: 0.6 }));
  const bulb = glowSprite(1.6, 0xa8f4ff); bulb.position.set(0.8, 0.5, 0); lure.add(stalk, bulb);   // the bacteria in the lure give off blue-green light
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8fcff, fog: false })); core.position.copy(bulb.position); lure.add(core);
  const lureLight = new THREE.PointLight(0x9fefff, 0.6, 2.5, 1.5); lureLight.position.copy(bulb.position); lure.add(lureLight);
  ang.add(lure);
  passBy(ang, tu(2, 0.72), view(tu(2, 0.72), 3.4, 0.7, -0.2), view(tu(2, 0.72), 0.05, -0.32, 0), 'Anglerfish', 16, () => { const k = 0.8 + 0.25 * Math.sin(U.time.value * 3); bulb.scale.setScalar(1.6 * k); lureLight.intensity = 0.6 * k; }, true);
  // the abyss and the trench
  const wc = new THREE.Vector3(0, groups.wreck.userData.floorH(0, 0) + 12, 0).add(STAGE_ORIGIN(4));   // about the height the diver circles at
  for (let i = 0; i < 3; i++) {
    const d = makeCreature(SPECIES.dumbo); d.scale.setScalar(1.3);
    orbit(d, wc.clone().add(new THREE.Vector3(0, i * 1.2 - 1, 0)), 18 + i * 2.5, 0.07 * (i % 2 ? -1 : 1), i * 2.1 - 1.2, 1.2, 'Dumbo octopus', 16);
  }
  const tc = new THREE.Vector3(0, TRENCH_TOP_Y - 60, 0).add(STAGE_ORIGIN(5));
  for (let i = 0; i < 6; i++) {
    const sfish = makeCreature(SPECIES.snailfish), tm = tu(5, 0.25 + i * 0.11);
    passBy(sfish, tm, view(tm, rand(2.2, 3.4), rand(-1, 1), rand(-0.5, 0.3)), view(tm, 0.1, Math.random() < 0.5 ? -0.12 : 0.12, 0), 'Mariana snailfish', 12, null, true);
  }
  { const te = tu(5, 0.93), p = pathAt(te), c = p.pos.clone().add(view(te, 5, 0, 0));
    c.y = Math.max(groups.trench.userData.floorH(c.x - STAGE_ORIGIN(5).x, c.z - STAGE_ORIGIN(5).z) + 2.4, p.pos.y - 2.6);   // low, but still in view
    for (let i = 0; i < 8; i++) orbit(makeCreature(SPECIES.snailfish), c.clone().add(new THREE.Vector3(rand(-0.8, 0.8), rand(-0.4, 0.6), rand(-0.8, 0.8))), rand(0.8, 2.4), rand(0.15, 0.3) * (i % 2 ? 1 : -1), rand(0, TAU), 0.3, 'Mariana snailfish', 12); }
}

export { buildLife };
