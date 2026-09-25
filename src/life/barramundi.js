/* The real fish: a CC0 barramundi 3D model (assets/barra_geo.glb, pictures in assets/barra_tex.json).
   The shape and the pictures are stored separately; the pictures are set up by hand. */
import * as THREE from '../lib/three.js';
import { GLTFLoader } from '../lib/gltf-loader.js';
import { wet } from '../engine/wet.js';
import { paintGeo } from '../util/geometry.js';
import { mixc } from '../util/color.js';
import { clamp, smooth } from '../util/math.js';
import { smallFishGeo } from './small-shapes.js';

const BARRA = { model: null };   // { geometry, material } once ready
const BARRA_TURN = -Math.PI / 2;
const SWIM = { mode: 1, amp: 0.08, speed: 13, wave: 5.5 };   // about 2 tail beats a second: right for a fish this size at about 1 m/s

function texFrom(uri, srgb) {
  const t = new THREE.Texture(); t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = uri; return t;
}

// A plain silver fish, used only if the model cannot be read (no message to visitors).
function fallback() {
  const g = smallFishGeo(); g.scale(5, 5, 5);
  paintGeo(g, (p, n) => mixc('#6f8792', '#e6ecef', smooth(clamp((0.35 - n.y) / 0.6))));
  BARRA.model = { geometry: g, material: wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }), { bend: { ...SWIM, len: 0.9 } }) };
}

async function loadBarramundi() {
  try {
    const [buf, tex] = await Promise.all([
      fetch('assets/barra_geo.glb').then(r => r.arrayBuffer()),
      fetch('assets/barra_tex.json').then(r => r.json())
    ]);
    const gltf = await new Promise((ok, fail) => new GLTFLoader().parse(buf, '', ok, fail));
    let mesh = null; gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (!mesh) { fallback(); return; }
    const g = mesh.geometry.clone(), m = mesh.material;
    g.computeBoundingBox(); const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
    g.translate(-c.x, -c.y, -c.z); g.rotateY(BARRA_TURN); g.scale(0.95 / size.z, 0.95 / size.z, 0.95 / size.z);
    m.map = texFrom(tex.color, true); m.normalMap = texFrom(tex.normal, false); m.roughnessMap = m.metalnessMap = texFrom(tex.orm, false);
    wet(m, { bend: { ...SWIM, len: 0.95 } });
    BARRA.model = { geometry: g, material: m };
  } catch (e) { fallback(); }
}

export { BARRA, loadBarramundi };
