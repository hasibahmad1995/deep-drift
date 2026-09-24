/* The built places (reef, sea floor, vents, wreck, trench), all in one continuous world. See sites.js for the plan. */
import * as THREE from '../lib/three.js';
import { scene } from '../engine/renderer.js';

const UP = new THREE.Vector3(0, 1, 0);
const groups = {};   // name -> the group of 3D objects for that place

// Adds a built place to the scene. Anything inside with userData.cull = { center, radius } is hidden when far away (see main.js).
function addPlace(name, group) { scene.add(group); groups[name] = group; return group; }

export { UP, groups, addPlace };
