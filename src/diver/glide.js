/* How the diver moves: a slow glide, always sinking, steered by looking.
   - The current carries the diver along the dive route (route.js). There is no swim button.
   - The diver swims slowly toward wherever they look (about a real diver's or small submersible's speed).
   - Looking up slows the sinking (like finning upward), but never stops it. Looking down sinks faster.
   - The diver can never rise, except when pushed up by the sea floor. What you did not aim for early, you miss.
   - If the diver strays too far from the route, a gentle current brings them back (no invisible walls). */
import * as THREE from '../lib/three.js';
import { state } from '../dive/state.js';
import { constrain, groundAt } from './collision.js';
import { swim } from './input.js';
import { camera } from '../engine/renderer.js';
import { clamp } from '../util/math.js';

const SWIM_SPEED = 1.3;          // metres per second toward where you look
const MAX_LAG_ABOVE = 18;        // how far you can hang back above the route by looking up (m)
const MAX_BELOW = 30;            // how far you can dive below the route (m)
// How far the diver may stray sideways from the route in each part of the dive (m): narrow where there is rock close by.
const ROAM = { reef: 14, dropoff: 18, twilight: 30, midnight: 30, vents: 24, slope: 20, plain: 26, trench: 12, deep: 10 };
const PULL = 0.8;                // how firmly the current brings you back once you are beyond that distance
const CRUISE = 3.5;              // near the floor you ease up to glide about this high above it, instead of bumping over every rock

const look = new THREE.Vector3(), prevBase = new THREE.Vector3(), baseVel = new THREE.Vector3(), pos = new THREE.Vector3();
let hasPrev = false, lastT = -1;

// p = pathAt(state.t); legId = which part of the dive. Returns the diver's position this frame.
function updateGlide(dt, p, legId) {
  // how fast the current (the route) is moving right now
  if (!hasPrev || state.t < lastT) { prevBase.copy(p.pos); swim.off.set(0, 0, 0); hasPrev = true; }
  const moving = state.playing && state.started && dt > 0;
  if (moving) baseVel.copy(p.pos).sub(prevBase).divideScalar(dt); else baseVel.set(0, 0, 0);
  prevBase.copy(p.pos); lastT = state.t;

  if (moving) {
    camera.getWorldDirection(look);
    // sideways and forward: swim toward where you look
    swim.off.x += look.x * SWIM_SPEED * dt; swim.off.z += look.z * SWIM_SPEED * dt;
    // up and down: you sink with the current; looking up slows it, looking down adds your own swimming
    const sinkFactor = 1 - 0.65 * clamp(look.y / 0.6), vy = Math.min(0, baseVel.y) * sinkFactor + Math.min(0, look.y) * SWIM_SPEED;
    swim.off.y += (Math.min(0, vy) - baseVel.y) * dt;   // your own height changes by vy, which is never upward
    // past a limit (for example lifted high by the reef top): settle back gently, never in one jump
    swim.off.y = clamp(swim.off.y, Math.min(-MAX_BELOW, swim.off.y + 3 * dt), Math.max(MAX_LAG_ABOVE, swim.off.y - 3 * dt));
    // a gentle current brings you back if you stray too far to the side
    const roam = ROAM[legId] || 20, h = Math.hypot(swim.off.x, swim.off.z);
    if (h > roam) { const k = 1 - Math.max(0, h - roam) * PULL * dt / h; swim.off.x *= k; swim.off.z *= k; }
  }
  pos.copy(p.pos).add(swim.off);
  // glide smoothly over rising ground (look a little ahead, like a diver lifting over a rock)
  if (moving) {
    const ahead = Math.max(groundAt(pos.x, pos.z), groundAt(pos.x + look.x * 2, pos.z + look.z * 2)) + CRUISE;
    if (pos.y < ahead) pos.y += (ahead - pos.y) * Math.min(1, dt * 2.5);
  }
  constrain(pos);                       // the floor, walls and wrecks push you back out
  swim.off.copy(pos).sub(p.pos);
  return pos;
}

const fix = new THREE.Vector3();
// Something big (a whale, the whale shark) pushed the diver by v this frame. Moves the diver now and keeps the move,
// but never into rock or anything solid.
function shoveDiver(v) {
  fix.copy(camera.position).add(v); constrain(fix); fix.sub(camera.position);   // the move that is really possible
  camera.position.add(fix); swim.off.add(fix); camera.updateMatrixWorld();
}

export { updateGlide, shoveDiver, SWIM_SPEED };
