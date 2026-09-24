/* Values shared by every material (time, how the water absorbs light, the water colour, caustics). */
import * as THREE from '../lib/three.js';

const U = {   // values shared by every material
  time: { value: 0 },
  absorb: { value: new THREE.Vector3(0.115, 0.042, 0.02) },
  // The water colour for our own fog, in linear light. (three.js gives its stock fog colour already converted for the
  // screen, because its fog runs last; ours runs before tone mapping, so it needs the linear colour.)
  water: { value: new THREE.Color() },
  // The open water all around (the background) is lighter looking up and darker looking down. Fog fades toward the same
  // colours, so far rock melts into the background with no outline. Set in environment.js; the sky dome uses them too.
  waterUp: { value: new THREE.Color() },
  waterDown: { value: new THREE.Color() },
  caust: { value: 1 }
};

export { U };
