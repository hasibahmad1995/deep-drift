/* Recipes for more animals of the deep, built by code (see creature.js for how a recipe becomes a 3D animal).
   Sizes are real: L is the length in metres. */
import * as THREE from '../lib/three.js';
import { mixc } from '../util/color.js';
import { flat, loft, mergeGeo, paintGeo, place } from '../util/geometry.js';
import { clamp } from '../util/math.js';

// Rattail or grenadier (Coryphaenoides): big head and eyes, a body that tapers to a long thin tail with no tail fin.
// Among the most common fish near the deep sea floor, from about 800 to 5,500 m.
const GRENADIER = {
  L: 0.8, rough: 0.55, bend: { mode: 1, amp: 0.06, speed: 2.2, wave: 3.5, len: 0.8 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.04, 0.05, 0.05, 0.05, 0], [0.12, 0.075, 0.09, 0.085, 0], [0.25, 0.06, 0.08, 0.07, 0], [0.5, 0.03, 0.045, 0.04, 0], [0.8, 0.012, 0.018, 0.016, 0], [1, 0.002, 0.003, 0.003, 0]],
  paint: (p, n) => mixc('#8a8478', '#5e5a52', clamp(n.y * 0.5 + 0.5)),
  fins: [
    { pts: [[0.04, 0], [0.0, 0.1], [-0.05, 0.02], [-0.06, 0]], at: [0.28, 0.085, 0], color: '#4a463f' },               // tall first dorsal fin
    { pts: [[0.0, 0], [-0.55, 0], [-0.55, -0.02], [0.0, -0.035]], at: [0.1, -0.06, 0], color: '#5a554c' },           // long fin along the belly and tail
    { pts: [[0.03, 0], [-0.03, 0], [-0.09, 0.08], [-0.04, 0.08]], at: [0.25, -0.03, 0.06], rot: [Math.PI / 2 + 0.3, 0, 0], color: '#5a554c' },
    { pts: [[0.03, 0], [-0.03, 0], [-0.09, 0.08], [-0.04, 0.08]], at: [0.25, -0.03, -0.06], rot: [-Math.PI / 2 - 0.3, 0, 0], color: '#5a554c' }
  ],
  eyes: [[0.4, 0.035, 0.055, 0.03], [0.4, 0.035, -0.055, 0.03]], eyeColor: '#2e3a3c'
};

// Tripod fish (Bathypterois): stands on three long fin rays (two below, one from the tail), facing the current.
function tripodLegs(L, legLen) {
  const parts = [];
  const leg = (x0, z0, x1, z1) => { const a = new THREE.Vector3(x0, -0.03 * L, z0), b = new THREE.Vector3(x1, -legLen, z1), g = new THREE.CylinderGeometry(0.0025, 0.004, a.distanceTo(b), 4);
    g.translate(0, a.distanceTo(b) / 2, 0); g.applyMatrix4(new THREE.Matrix4().compose(b, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()), new THREE.Vector3(1, 1, 1))); parts.push(g); };
  leg(0.08 * L, 0.015, 0.22 * L, 0.09); leg(0.08 * L, -0.015, 0.22 * L, -0.09);   // the two pelvic rays, splayed forward
  leg(-0.48 * L, 0, -0.75 * L, 0);                                                     // the lower tail ray, behind
  // the long, thin pectoral rays point forward and up, like feelers
  [-1, 1].forEach(s => { const g = new THREE.CylinderGeometry(0.0015, 0.002, 0.3, 3); g.translate(0, 0.15, 0); g.rotateZ(-1.0); g.rotateX(s * 0.35); g.translate(0.2 * L, 0.02 * L, s * 0.02); parts.push(g); });
  return paintGeo(mergeGeo(parts), () => '#2a2622');
}
const TRIPOD = {
  L: 0.3, rough: 0.5, bend: { mode: 1, amp: 0.01, speed: 1, wave: 2, len: 0.3 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.05, 0.04, 0.05, 0.04, 0], [0.2, 0.06, 0.07, 0.06, 0], [0.55, 0.045, 0.055, 0.045, 0], [0.9, 0.02, 0.025, 0.02, 0], [1, 0.01, 0.012, 0.01, 0]],
  paint: (p, n) => mixc('#3a3632', '#26221f', clamp(n.y * 0.5 + 0.5)),
  fins: [{ pts: [[0.03, 0], [-0.03, 0.12], [-0.1, 0.1], [-0.08, 0]], at: [0.05, 0.06, 0], color: '#26221f' },
         { pts: [[0.02, 0], [-0.06, 0.07], [-0.08, 0], [-0.06, -0.07]], at: [-0.48, 0, 0], color: '#26221f' }],
  eyes: [[0.44, 0.025, 0.03, 0.01], [0.44, 0.025, -0.03, 0.01]],
  extra: [tripodLegs(0.3, 0.55)]
};

// Gulper eel (Eurypharynx): a mouth far bigger than its body, and a whip-thin tail whose tip can glow.
const GULPER = {
  L: 0.75, rough: 0.35, emissive: 0x050204, bend: { mode: 1, amp: 0.1, speed: 2.5, wave: 4, len: 0.75 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.02, 0.05, 0.05, 0.1, -0.03], [0.1, 0.07, 0.07, 0.13, -0.05], [0.18, 0.03, 0.035, 0.05, -0.01], [0.3, 0.018, 0.02, 0.02, 0], [0.7, 0.008, 0.009, 0.009, 0], [1, 0.002, 0.002, 0.002, 0]],
  paint: () => '#1c1818',
  eyes: [[0.49, 0.03, 0.012, 0.006], [0.49, 0.03, -0.012, 0.006]]
};

// Vampire squid (Vampyroteuthis): dark red, a cape of skin between its eight arms, two fins, very large blue eyes.
function vampireCape(L) {
  const NI = 8, NJ = 40, pos = [], idx = [];
  for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
    const t = i / NI, a = j / NJ * Math.PI * 2, arm = Math.pow(Math.abs(Math.cos(a * 4)), 6);
    const r = L * (0.12 + 0.34 * Math.pow(t, 1.1)) * (1 + 0.1 * arm), x = -L * (0.15 + 0.5 * t) + L * 0.14 * t * (1 - arm);
    pos.push(x, Math.sin(a) * r, Math.cos(a) * r);
  }
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = i * (NJ + 1) + j, b = a + NJ + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#3a0c10', '#1a0608', clamp(-p.x / L)));
}
const VAMPIRE = {
  L: 0.3, rough: 0.45, bend: { mode: 1, amp: 0.05, speed: 2.5, wave: 2, len: 0.3 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.08, 0.1, 0.11, 0.09, 0], [0.3, 0.14, 0.14, 0.12, 0], [0.55, 0.12, 0.11, 0.1, 0], [0.8, 0.07, 0.06, 0.05, 0], [1, 0.03, 0.03, 0.03, 0]],
  paint: (p, n) => mixc('#4a1418', '#6a2024', clamp(n.y * 0.5 + 0.5)),
  fins: [{ pts: [[0, 0], [0.04, 0.12], [0.1, 0.13], [0.12, 0.03]], at: [0.3, 0.06, 0.1], rot: [Math.PI / 2 - 0.4, 0, 0], color: '#5a181c' },
         { pts: [[0, 0], [0.04, 0.12], [0.1, 0.13], [0.12, 0.03]], at: [0.3, 0.06, -0.1], rot: [-Math.PI / 2 + 0.4, 0, 0], color: '#5a181c' }],
  eyes: [[0.08, 0.05, 0.12, 0.035], [0.08, 0.05, -0.12, 0.035]], eyeColor: '#4a8cff',
  extra: [vampireCape(0.3)]
};

// Hatchetfish (Argyropelecus): a few cm long, very tall and thin, mirror-silver, with eyes that look upward.
// Used as a school shape (like the small reef fish), so it is the same size: 0.18 long, scaled down by the school.
function hatchetGeo() {
  const L = 0.18, rows = [[0, 0.004, 0.004, 0.004, 0], [0.08, 0.04, 0.12, 0.14, 0], [0.3, 0.06, 0.2, 0.32, -0.04], [0.6, 0.04, 0.1, 0.12, 0], [0.8, 0.012, 0.03, 0.03, 0], [1, 0.006, 0.01, 0.01, 0]];
  const g = mergeGeo([loft(L, rows, 14, 10), place(flat([[0.02, 0], [-0.04, 0.05], [-0.05, 0], [-0.04, -0.05]], L), -0.5 * L, 0, 0)]);
  return paintGeo(g, (p, n) => mixc('#dfe8ee', '#3a4a58', clamp((n.y - 0.3) * 1.5)));   // dark back, mirror-silver sides
}

export { GRENADIER, TRIPOD, GULPER, VAMPIRE, hatchetGeo };
