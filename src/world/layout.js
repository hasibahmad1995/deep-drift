/* Where each place sits in the 3D world, and the list of built places. */
import * as THREE from '../lib/three.js';
import { scene } from '../engine/renderer.js';

const UP = new THREE.Vector3(0, 1, 0);
const STAGE_ORIGIN = i => new THREE.Vector3(0, 0, i * 3000);
const wg = (i) => { const g = new THREE.Group(); g.position.copy(STAGE_ORIGIN(i)); scene.add(g); return g; };
const groups = {};   // the built places: reef, vents, wreck, trench

export { UP, STAGE_ORIGIN, wg, groups };
