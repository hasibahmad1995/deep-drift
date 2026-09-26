/* The sea surface is the highest point of the water: nothing that lives in it may poke through. After every animal has
   moved (and dodged the diver), this keeps its top just under the surface, so it swims along beneath it instead. */
import { HIT } from './touch.js';

const GAP = 0.25;   // metres of water kept above the animal's top
// How far the animal reaches above its middle (its thickness, or a fifth of its wing width, or a jellyfish's bell).
function reachUp(a, sc) {
  if (a.name === 'Jellyfish') return sc * 1.1;
  const h = a.hit || HIT[a.name];
  return h ? Math.max(h.rad, (h.wide || 0) * 0.3) * sc : 0.3 * sc;
}
function keepInWater(a) {
  const o = a.obj, top = -(reachUp(a, o.scale.x || 1) + GAP);
  if (o.position.y > top) o.position.y = top;
}

export { keepInWater, reachUp };
