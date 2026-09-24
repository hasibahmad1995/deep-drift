/* Colour helpers: hex to linear colour, blending, and dark-back/light-belly shading. */
import * as THREE from '../lib/three.js';
import { clamp, smooth } from './math.js';

const col = h => new THREE.Color(h);   // hex colour (sRGB); three.js turns it into the linear colour it works in
const mixc = (a, b, t) => col(a).lerp(col(b), t);
const countershade = (back, belly, edge = 0.22) => (p, n) => mixc(belly, back, smooth(clamp((n.y + 0.02) / edge)));

export { col, mixc, countershade };
