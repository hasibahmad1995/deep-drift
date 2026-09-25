/* The main cast: which animals appear where and when during the dive. */
import * as THREE from '../lib/three.js';
import { pathAt, tu } from '../dive/route.js';
import { DETAIL, SMALL } from '../engine/device.js';
import { scene } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { BARRA } from './barramundi.js';
import { makeCreature } from './creature.js';
import { makeJelly } from './jelly.js';
import { clearPath, orbit, passBy, view } from './motion.js';
import { vary } from './variety.js';
import { School } from './school.js';
import { SMALL_FISH_SWIM, smallFishGeo } from './small-shapes.js';
import { SPECIES } from './species.js';
import { makeTurtle } from './turtle.js';
import { col } from '../util/color.js';
import { loft } from '../util/geometry.js';
import { TAU, lerp, rand } from '../util/math.js';
import { glowSprite } from '../world/effects.js';
import { WRECK } from '../world/sites.js';
import { seafloorY } from '../world/terrain.js';
import { landWallX } from '../world/trench.js';

function buildLife() {
  const schools = [];
  const addSchool = (school) => { scene.add(school.mesh); schools.push(school); };
  const fishMat = () => wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: SMALL_FISH_SWIM });
  const smallMat = fishMat();
  const nb = Math.max(10, Math.round(34 * DETAIL)), nSmall = Math.max(40, Math.round(140 * DETAIL));
  const cfg = (c, r, om, ph, sp, sc, colors, rise) => ({ center: [-c[0], c[1], c[2]], radius: r, omega: om, phase: ph, spread: sp, scale: sc, colors, rise: rise == null ? 1.2 : rise });
  if (BARRA.model) {
    [[[13, -7, 2], 7, 0.16, 0], [[15, -25, 5], 8, -0.14, 2], [[16, -46, -3], 8, 0.15, 4]].forEach(([c, r, om, ph]) =>
      addSchool(Object.assign(new School(BARRA.model.geometry.clone(), BARRA.model.material, nb, cfg(c, r, om, ph, 2.4, 1.0)), { name: 'Barramundi' })));
  }
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'], yellow = ['#f2d13a', '#ffd84a', '#f0c020'];
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, nSmall, cfg([15, -15, -4], 7, 0.2, 1, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.8), cfg([16, -32, 3], 7, -0.18, 3, 3.0, 0.9, teal)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.4), cfg([15, -39, -3], 6, 0.17, 5, 2.4, 1.3, yellow)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.7), cfg([17, -52, 2], 8, -0.16, 2, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  ACTORS.push({ update: t => schools.forEach(s => s.update(t)), obj: null, cyclic: true });

  // sharks, turtle, manta
  [[[19, -30, 0], 12, 0.12, 0], [[17, -41, 8], 10, -0.15, 2], [[20, -21, -7], 13, 0.1, 4.2]].forEach(([c, r, om, ph]) => {
    const m = makeCreature(SPECIES.blacktip); orbit(m, new THREE.Vector3(-c[0], c[1], c[2]), r, om, ph, 1.5, 'Blacktip reef shark', 30);
  });
  const turtle = makeTurtle();
  passBy(turtle, tu(0, 0.34), view(tu(0, 0.34), 7, 3, 0.5), view(tu(0, 0.34), 0, -0.75, 0), 'Green sea turtle', 20, turtle.userData.update);
  passBy(makeCreature(SPECIES.manta), tu(0, 0.9), view(tu(0, 0.9), 3, 0, 6), view(tu(0, 0.9), 0, -1.4, 0), 'Giant manta ray', 34);   // glides over you (ahead of you is the reef wall)
  // big animals of the open ocean pass along the reef drop-off (beside you: ahead of you is the wall)
  passBy(makeCreature(SPECIES.whaleshark), tu(1, 0.35), view(tu(1, 0.35), 5, 16, -1), view(tu(1, 0.35), 0, -1.3, 0), 'Whale shark', 40);
  passBy(makeCreature(SPECIES.greatwhite), tu(1, 0.68), view(tu(1, 0.68), 6, -12, -2), view(tu(1, 0.68), -0.2, 1.2, 0), 'Great white shark', 34);
  passBy(makeCreature(SPECIES.humpback), tu(1, 0.92), view(tu(1, 0.92), 8, 26, -5), view(tu(1, 0.92), 0, -1.4, 0), 'Humpback whale', 60);
  // jellyfish drift up through the twilight and midnight water
  const jelly = (si, u0, u1, n, hue, glow) => {
    for (let i = 0; i < n; i++) {
      const j = makeJelly(hue + rand(-0.05, 0.05), glow), s = rand(0.6, 1.5), meet = new THREE.Vector3(); let tm = 0;
      j.scale.setScalar(s);
      const drift = (t, out) => out.set(meet.x, meet.y + (t - tm) * 0.18, meet.z), actor = { active: true };
      vary(() => { actor.active = false; for (let k = 0; k < 8 && !actor.active; k++) { tm = tu(si, lerp(u0, u1, Math.random())); meet.copy(pathAt(tm).pos).add(view(tm, rand(4, 16), rand(-9, 9), rand(-4, 5))); actor.active = clearPath(drift, tm - 60, tm + 60, 1, 1.3); } });   // a new spot each dive, clear of rock (or none)
      scene.add(j);
      ACTORS.push(Object.assign(actor, { obj: j, name: 'Jellyfish', range: 12, cyclic: true, update(t) { j.position.set(meet.x + Math.sin(t * 0.13 + i) * 0.6, meet.y + (t - tm) * 0.18, meet.z + Math.cos(t * 0.11 + i) * 0.6); } }));
    }
  };
  jelly(2, 0.0, 1.0, SMALL ? 9 : 16, 0.85, 0.5);    // twilight zone
  jelly(3, 0.0, 0.8, SMALL ? 5 : 9, 0.5, 1.0);      // midnight zone: they make their own light
  // midnight zone
  const squid = new THREE.Group(), sm = makeCreature(SPECIES.squid); squid.add(sm);
  const armMat = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len: 2.6 } });
  for (let i = 0; i < 10; i++) {
    const long = i >= 8, len = long ? 4.8 : 2.4 + (i % 3) * 0.3, g = loft(len, [[0, 0.004, 0.004, 0.004, 0], [0.05, 0.03, 0.03, 0.03, 0], [long ? 0.85 : 0.5, 0.012, 0.012, 0.012, 0], [long ? 0.9 : 1, long ? 0.035 : 0.004, long ? 0.03 : 0.004, 0.03, 0], [1, 0.004, 0.004, 0.004, 0]], 24, 8);
    const a = i / 10 * TAU, arm = new THREE.Mesh(g, armMat.clone()); arm.userData.len = len;
    arm.material = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len } });
    arm.position.set(2.1 + len / 2, Math.sin(a) * 0.22, Math.cos(a) * 0.22); arm.rotation.y = Math.cos(a) * 0.06; squid.add(arm);
  }
  passBy(squid, tu(3, 0.25), view(tu(3, 0.25), 12, 6, 0), view(tu(3, 0.25), -0.3, -0.55, 0), 'Giant squid', 34, null, true);
  const ang = makeCreature(SPECIES.angler), lure = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, 0.24, 0), new THREE.Vector3(0.55, 0.42, 0), new THREE.Vector3(0.8, 0.5, 0)]), 12, 0.006, 5), new THREE.MeshStandardMaterial({ color: 0x3a2d28, roughness: 0.6 }));
  const bulb = glowSprite(1.6, 0xa8f4ff); bulb.position.set(0.8, 0.5, 0); lure.add(stalk, bulb);   // the bacteria in the lure give off blue-green light
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8fcff, fog: false })); core.position.copy(bulb.position); lure.add(core);
  ang.add(lure);
  // the lure's light fades with the square of the distance. It lives in the scene, not on the fish, and is never hidden:
  // it just goes dark while the fish is out of sight (see lights.js for why)
  const lureLight = new THREE.PointLight(0x9fefff, 0, 2.5, 2); scene.add(lureLight);
  let glow = 1;
  passBy(ang, tu(3, 0.7), view(tu(3, 0.7), 3.4, 0.7, -0.2), view(tu(3, 0.7), 0.05, -0.32, 0), 'Anglerfish', 16, () => { glow = 0.8 + 0.25 * Math.sin(U.time.value * 3); bulb.scale.setScalar(1.6 * glow); }, true);
  ACTORS.push({ obj: null, update: () => {
    lureLight.intensity = ang.visible ? 0.6 * Math.PI * glow : 0;
    if (ang.visible) bulb.getWorldPosition(lureLight.position);
  } });
  // dumbo octopuses hover near the wreck on the abyssal plain (they live from about 1,000 to 7,000 m)
  const wc = new THREE.Vector3(WRECK.x - 5, seafloorY(WRECK.x - 5, WRECK.z - 12) + 9, WRECK.z - 12);
  for (let i = 0; i < 3; i++) {
    const d = makeCreature(SPECIES.dumbo); d.scale.setScalar(1.3);
    orbit(d, wc.clone().add(new THREE.Vector3(0, i * 1.2 - 1, 0)), 9 + i * 3, 0.1 * (i % 2 ? -1 : 1), i * 2.1 - 1.2, 1.2, 'Dumbo octopus', 16);
  }
  // snailfish on the trench wall, only between about 6,500 and 8,300 m (no fish live much deeper)
  for (let i = 0; i < 6; i++) {
    const sfish = makeCreature(SPECIES.snailfish), tm = tu(7, 0.1 + i * 0.09);
    passBy(sfish, tm, view(tm, rand(2.2, 3.4), rand(-1, 1), rand(-0.5, 0.3)), view(tm, 0.1, Math.random() < 0.5 ? -0.12 : 0.12, 0), 'Mariana snailfish', 12, null, true);
  }
  { const te = tu(7, 0.42), p = pathAt(te), wx = landWallX(p.pos.y - 2, p.pos.z + 6);   // a group feeding by a ledge on the wall
    const c = new THREE.Vector3(Math.max(wx + 4, p.pos.x - 8), p.pos.y - 2, p.pos.z + 6);
    for (let i = 0; i < 8; i++) orbit(makeCreature(SPECIES.snailfish), c.clone().add(new THREE.Vector3(rand(-0.8, 0.8), rand(-0.4, 0.6), rand(-0.8, 0.8))), rand(0.8, 2.4), rand(0.15, 0.3) * (i % 2 ? 1 : -1), rand(0, TAU), 0.3, 'Mariana snailfish', 12); }
}

export { buildLife };
