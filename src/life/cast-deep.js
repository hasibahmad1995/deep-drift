/* More of the deep cast, each at its real depth: hatchetfish (twilight zone), a vampire squid (~950 m),
   a gulper eel (~1,300 m), grenadiers cruising above the abyssal plain, tripod fish standing on it,
   and named spots so the caption says what you are looking at (deep reef, vents, slope, plain, trench floor). */
import * as THREE from '../lib/three.js';
import { pathAt, tu } from '../dive/route.js';
import { scene } from '../engine/renderer.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { makeCreature } from './creature.js';
import { pseudo } from './extras.js';
import { orbit, passBy, view } from './motion.js';
import { School } from './school.js';
import { GRENADIER, GULPER, TRIPOD, VAMPIRE, hatchetGeo } from './species-deep.js';
import { seeded } from '../util/math.js';
import { glowSprite } from '../world/effects.js';
import { TRENCH } from '../world/sites.js';
import { seafloorY } from '../world/terrain.js';
import { trenchFloorY } from '../world/trench.js';

function buildDeepCast() {
  // hatchetfish: a loose school of small mirror-silver fish in the twilight zone
  { const tm = tu(2, 0.5), c = pathAt(tm).pos.clone().add(view(tm, 6, -2, 0));
    const mat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.6, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.1, speed: 30, wave: 5, len: 0.18 } });   // tiny fish: quick tail beats (about 5 a second)
    const sch = new School(hatchetGeo(), mat, 70, { center: [c.x, c.y, c.z], radius: 3, omega: 0.3, phase: 0, spread: 2, scale: 0.45, colors: ['#e8f0f4', '#d0dce4'], rise: 1, name: 'Hatchetfish' });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); pseudo('Hatchetfish', c, 10); }
  // a vampire squid near the bottom of the twilight zone, and a gulper eel in the midnight zone (both sink with you as they pass)
  { const tm = tu(2, 0.95); passBy(makeCreature(VAMPIRE), tm, view(tm, 3, 0.8, -0.2), view(tm, 0.05, -0.25, 0), 'Vampire squid', 12, null, true); }
  { const tm = tu(3, 0.45), eel = makeCreature(GULPER), tip = glowSprite(0.18, 0xff6aa0); tip.position.set(-0.37, 0, 0); eel.add(tip);   // the glowing tip of the tail
    passBy(eel, tm, view(tm, 3.5, -1, 0.3), view(tm, 0, 0.3, 0.02), 'Gulper eel', 12, null, true); }
  // grenadiers cruise slowly just above the plain, head down, looking for food
  const R = seeded(404);
  for (let i = 0; i < 6; i++) {
    const x = 350 + i * 32 + R() * 10, z = (R() - 0.5) * 24, c = new THREE.Vector3(x, seafloorY(x, z) + 1.2, z);
    orbit(makeCreature(GRENADIER), c, 3 + R() * 4, 0.1 + R() * 0.08, R() * 6, 0.3, 'Grenadier fish', 12);
  }
  // tripod fish stand still on their fin rays, facing the current, waiting for food to drift past
  for (let i = 0; i < 7; i++) {
    const x = 362 + i * 26 + R() * 12, z = (R() - 0.5) * 22, f = makeCreature(TRIPOD);
    f.position.set(x, seafloorY(x, z) + 0.55, z); f.rotation.y = Math.PI + (R() - 0.5) * 0.4; scene.add(f);
    ACTORS.push({ obj: f, name: 'Tripod fish', range: 8, update() {} });
  }
  // named spots, so the caption says what you are looking at
  const at = (x, z, up) => new THREE.Vector3(x, seafloorY(x, z) + up, z);
  pseudo('Sea fans', new THREE.Vector3(-30, -110, 8), 14); pseudo('Black corals', new THREE.Vector3(-33, -165, 12), 14);
  pseudo('Liquid CO2 droplets', at(150, -6, 2), 8);
  pseudo('Bamboo corals', at(236, -2, 2), 16); pseudo('Sea lilies', at(262, 0, 2), 16); pseudo('Glass sponges', at(290, 2, 2), 16); pseudo('Brittle stars', at(320, 0, 1), 14);
  pseudo('Manganese nodules', at(365, 4, 1), 12); pseudo('Sea pigs', at(395, -4, 1), 14); pseudo('Xenophyophores', at(505, 0, 1), 14);
  { const x = (TRENCH.landFoot + TRENCH.farFoot) / 2 - 4, z = 30; pseudo('Xenophyophores', new THREE.Vector3(x, trenchFloorY(x, z) + 1, z), 14); }
}

export { buildDeepCast };
