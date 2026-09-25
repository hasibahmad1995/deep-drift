/* Skips drawing parts of the world that are too far away to see, which only saves work.
   How far you can see depends on the water: at 5 / (how fast the clearest colour fades per metre) less than 1% of
   the light is left, so a part is hidden only once it has already faded fully into the water colour (no popping).
   A place, and parts inside it (floor chunks, coral tiles), opt in with userData.cull = { center, radius, far }.
   far (optional) is a shorter limit for small things that have already shrunk away by then (see wet() shrink). */
import { U } from '../engine/uniforms.js';
import { clamp } from '../util/math.js';
import { groups } from './layout.js';

const MARGIN = 15;   // metres: a part comes back a little before it could show, and goes only a little after, so it never flickers

function sightRange() {
  const a = U.absorb.value, clearest = Math.max(Math.min(a.x, a.y, a.z), 0.001);
  return clamp(5 / clearest, 60, 300);
}

function show(o, eye, see) {
  const c = o.userData.cull, gap = eye.distanceTo(c.center) - c.radius, limit = c.far ? Math.min(see, c.far) : see;
  o.visible = gap < limit + (o.visible ? MARGIN : 0);
  return o.visible;
}

function updateCulling(eye) {
  const see = sightRange();
  for (const g of Object.values(groups)) {
    if (g.userData.cull && !show(g, eye, see)) continue;
    if (!g.userData.cullKids) g.userData.cullKids = g.children.filter(c => c.userData.cull);
    for (const k of g.userData.cullKids) show(k, eye, see);
  }
}

export { updateCulling, sightRange };
