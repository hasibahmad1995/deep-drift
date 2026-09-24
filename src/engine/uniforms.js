/* Values shared by every material (time, how the water absorbs light, caustics). */
import * as THREE from '../lib/three.js';

const U = {   // values shared by every material
  time: { value: 0 },
  absorb: { value: new THREE.Vector3(0.115, 0.042, 0.02) },
  caust: { value: 1 }
};

export { U };
