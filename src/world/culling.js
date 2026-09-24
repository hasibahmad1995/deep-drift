/* Skips drawing parts of the world that are too far away to see, which only saves work.
   How far you can see depends on the water: about 4 / (how fast blue light fades per metre), where almost no light is left.
   A place (or a chunk inside it) opts in with userData.cull = { center, radius }. */
import { U } from '../engine/uniforms.js';
import { clamp } from '../util/math.js';
import { groups } from './layout.js';

function updateCulling(eye) {
  const see = clamp(4 / Math.max(U.absorb.value.z, 0.001), 60, 260) + 20;   // metres, with a little margin
  for (const g of Object.values(groups)) {
    const items = g.userData.cull ? [g] : g.children.filter(c => c.userData.cull);
    for (const o of items) { const c = o.userData.cull; o.visible = eye.distanceTo(c.center) - c.radius < see; }
  }
}

export { updateCulling };
