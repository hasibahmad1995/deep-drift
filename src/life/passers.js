/* Random visitors: animals and schools that swim right past the diver every few seconds.
   Each kind only appears between the depths where it really lives (minD, maxD in metres), and some only near a place.
   Nothing pops in or out: a visitor starts somewhere you cannot see it (outside the screen, or so far that the water
   hides it), swims across, and is taken away only once it is out of sight again. Its path never goes through rock. */
import * as THREE from '../lib/three.js';
import { pathAt } from '../dive/route.js';
import { swim } from '../diver/input.js';
import { inRock } from '../diver/collision.js';
import { state } from '../dive/state.js';
import { DETAIL } from '../engine/device.js';
import { camera, scene } from '../engine/renderer.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { BARRA } from './barramundi.js';
import { makeCreature } from './creature.js';
import { makeJelly } from './jelly.js';
import { orient } from './motion.js';
import { School } from './school.js';
import { shrimpGeo, smallFishGeo } from './small-shapes.js';
import { SPECIES } from './species.js';
import { GRENADIER, hatchetGeo } from './species-deep.js';
import { makeTurtle } from './turtle.js';
import { rand } from '../util/math.js';
import { sightRange } from '../world/culling.js';
import { UP } from '../world/layout.js';
import { seafloorY } from '../world/terrain.js';

const PASSERS = { indiv: [], swarms: [], next: 8, lastT: 0 };
const LONGEST = 24;    // seconds: the longest a visitor may take to reach the diver

/* ---- can the diver see this spot right now? ---- */
const view = new THREE.Frustum(), viewM = new THREE.Matrix4(), ball = new THREE.Sphere(), here = new THREE.Vector3();
function updateView() {
  camera.updateMatrixWorld(); viewM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); view.setFromProjectionMatrix(viewM);
}
// true if something of radius r at p could show on screen: inside the view (with a margin) and not yet lost in the water
function inSight(p, r) {
  ball.center.copy(p); ball.radius = r + 1.5;
  return view.intersectsSphere(ball) && p.distanceTo(camera.position) - r < sightRange();
}

function deactivatePassers() {
  PASSERS.indiv.forEach(a => { a.active = false; a.obj.visible = false; a.react = null; });
  PASSERS.swarms.forEach(a => { a.active = false; a.sch.mesh.visible = false; });
}
// How far the animal reaches from its centre, whichever way it turns (so 'out of sight' also covers a fin tip).
const sizeOf = obj => { const b = new THREE.Box3().setFromObject(obj), f = (lo, hi) => Math.max(Math.abs(lo), Math.abs(hi)); return Math.hypot(f(b.min.x, b.max.x), f(b.min.y, b.max.y), f(b.min.z, b.max.z)); };

function initPassers(M) {
  const V = () => new THREE.Vector3(), D = Math.max(DETAIL, 0.5);
  const small = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const indiv = (name, make, speed, count, lim) => {
    for (let i = 0; i < count; i++) {
      const obj = make(), size = sizeOf(obj); obj.visible = false; scene.add(obj);
      const a = Object.assign({ obj, name, speed, size, active: false, start: V(), vel: V(), t0: 0, meetIn: 0, range: 10, tick: obj.userData.update || null }, lim || {});
      a.update = t => {
        if (!a.active) return;
        obj.position.copy(a.start).addScaledVector(a.vel, t - a.t0); orient(obj, a.vel.x, a.vel.y, a.vel.z); if (a.tick) a.tick(t);
        // gone past the diver and out of sight: now it can quietly leave
        here.copy(obj.position); if (a.react) here.add(a.react.off);   // where it really is, including any dodge
        if (t - a.t0 > a.meetIn + 2 && !inSight(here, size)) { a.active = false; obj.visible = false; }
      };
      ACTORS.push(a); PASSERS.indiv.push(a);
    }
  };
  const swarm = (name, geo, mat, n, colors, scale, lim) => {
    const sch = new School(geo, mat, n, { line: { start: V(), vel: V(), t0: 0 }, spread: 2.2, scale, colors, name });
    sch.mesh.visible = false; scene.add(sch.mesh);
    const a = Object.assign({ obj: null, name, sch, size: sch.mesh.boundingSphere.radius, active: false, meetIn: 0 }, lim || {}), c = V();
    a.update = t => {
      if (!a.active) return;
      sch.update(t);
      if (t - sch.cfg.line.t0 > a.meetIn + 2 && !inSight(sch.centre(t, c), a.size)) { a.active = false; sch.mesh.visible = false; }
    };
    ACTORS.push(a); PASSERS.swarms.push(a);
  };
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'];
  const nearVents = pos => pos.x > 95 && pos.x < 210;
  const nearFloor = pos => pos.x > -38 && pos.y - seafloorY(pos.x, pos.z) < 25;   // grenadiers live close to the bottom
  indiv('Blacktip reef shark', () => makeCreature(SPECIES.blacktip), 1.8, 2, { minD: 0, maxD: 75 });
  indiv('Green sea turtle', () => makeTurtle(), 0.8, 1, { minD: 0, maxD: 90 });
  indiv('Giant manta ray', () => makeCreature(SPECIES.manta), 1.6, 1, { minD: 12, maxD: 120 });
  indiv('Whale shark', () => makeCreature(SPECIES.whaleshark), 1.3, 1, { minD: 20, maxD: 300 });
  indiv('Great white shark', () => makeCreature(SPECIES.greatwhite), 1.8, 1, { minD: 20, maxD: 300 });
  indiv('Jellyfish', () => { const j = makeJelly(0.85 + rand(-0.05, 0.05), 0.5); j.scale.setScalar(rand(0.5, 1.1)); return j; }, 0.35, 3, { minD: 150, maxD: 1000 });
  indiv('Jellyfish', () => { const j = makeJelly(0.5 + rand(-0.05, 0.05), 1.0); j.scale.setScalar(rand(0.5, 1.2)); return j; }, 0.3, 3, { minD: 700, maxD: 3000 });
  indiv('Anglerfish', () => makeCreature(SPECIES.angler), 0.5, 1, { minD: 700, maxD: 2500 });
  indiv('Dumbo octopus', () => makeCreature(SPECIES.dumbo), 0.6, 2, { minD: 1500, maxD: 6500 });
  indiv('Mariana snailfish', () => makeCreature(SPECIES.snailfish), 0.5, 3, { minD: 6000, maxD: 8300 });
  indiv('Grenadier fish', () => makeCreature(GRENADIER), 0.5, 2, { minD: 800, maxD: 5500, near: nearFloor });
  swarm('Reef fish', smallFishGeo(), small, Math.round(60 * D), orange, 1.0, { minD: 0, maxD: 50 });
  swarm('Reef fish', smallFishGeo(), small, Math.round(50 * D), teal, 1.0, { minD: 0, maxD: 50 });
  if (BARRA.model) swarm('Barramundi', BARRA.model.geometry.clone(), BARRA.model.material, Math.round(26 * D), null, 1.0, { minD: 0, maxD: 40 });
  swarm('Silver jacks', smallFishGeo(), M.silverMat, Math.round(70 * D), ['#c9d3d8', '#b5c2c9', '#dfe6e9'], 1.6, { minD: 20, maxD: 250 });
  swarm('Hatchetfish', hatchetGeo(), M.silverMat, Math.round(50 * D), ['#e8f0f4', '#d0dce4'], 0.45, { minD: 200, maxD: 1000 });
  swarm('Lanternfish', smallFishGeo(), M.glowMat, Math.round(60 * D), ['#9fe8ff', '#7fd6ff'], 1.5, { minD: 250, maxD: 1300 });
  swarm('Vent shrimp', shrimpGeo(), M.whiteMat, Math.round(60 * D), ['#f3ede0', '#ffe9d0'], 0.5, { minD: 1500, maxD: 1750, near: nearVents });
  swarm('Amphipods', shrimpGeo(), M.whiteMat, Math.round(60 * D), ['#f5e6dc', '#ffd9c0'], 0.4, { minD: 4500, maxD: 10935 });
}

const spF = new THREE.Vector3(), spR = new THREE.Vector3(), spU = new THREE.Vector3(), spT = new THREE.Vector3(), spV = new THREE.Vector3(), spS = new THREE.Vector3(), probe = new THREE.Vector3();
const jit = { r: 0, u: 0, f: 0 };
// Where the diver will be in s seconds, with the visitor's small offset from that spot.
function meetPoint(s, out) {
  out.copy(pathAt(state.t + s).pos).add(swim.off);
  return out.addScaledVector(spR, jit.r).addScaledVector(spU, jit.u).addScaledVector(spF, jit.f);
}
// The straight path from start to well past the meeting point stays out of rock.
function pathClear(start, vel, s) {
  for (let k = 0; k <= 8; k++) { probe.copy(start).addScaledVector(vel, s * 1.6 * k / 8); if (inRock(probe)) return false; }
  return true;
}
/* Finds how long before the meeting the visitor must set off so that it starts out of sight. Sets spT (meeting point)
   and spS (start). Returns the time to the meeting in seconds, or 0 if there is no good path this time. */
function planPath(vel, size, minT) {
  for (let s = minT; s <= LONGEST; s += 1.5) {
    meetPoint(s, spT);
    if (spT.x > -38 && spT.y < seafloorY(spT.x, spT.z) + 2.5) return 0;   // too close to the sea floor: try again later
    spS.copy(spT).addScaledVector(vel, -s);
    if (!inSight(spS, size) && pathClear(spS, vel, s)) return s;
  }
  return 0;
}

function spawnPasser(p) {
  const here = state.D, pos = pathAt(state.t).pos.add(swim.off);   // where the diver really is
  const ok = a => !a.active && here >= (a.minD || 0) && here <= (a.maxD == null ? 1e9 : a.maxD) && (!a.near || a.near(pos));
  const ind = PASSERS.indiv.filter(ok), sw = PASSERS.swarms.filter(ok);
  if (!ind.length && !sw.length) return;
  spF.copy(p.fwd); spR.crossVectors(spF, UP).normalize(); spU.crossVectors(spR, spF).normalize();
  const useSwarm = sw.length && (!ind.length || Math.random() < 0.45);
  if (useSwarm) {
    const a = sw[Math.floor(Math.random() * sw.length)], sp = rand(1.7, 2.6);
    jit.r = rand(-0.7, 0.7); jit.u = rand(-0.5, 0.5); jit.f = rand(0.5, 2);
    if (Math.random() < 0.6) spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.3)); else spV.copy(spF).negate().addScaledVector(spR, rand(-0.25, 0.25));
    spV.y *= 0.3; spV.normalize().multiplyScalar(sp);
    const s = planPath(spV, a.size, rand(3, 5)); if (!s) return;
    const L = a.sch.cfg.line; L.vel.copy(spV); L.start.copy(spS); L.t0 = state.t;
    a.sch.fish.forEach(f => { f.off.set(0, 0, 0); f.vel.set(0, 0, 0); }); a.sch.mesh.visible = true; a.sch.away = false; a.active = true; a.meetIn = s;
  } else {
    const a = ind[Math.floor(Math.random() * ind.length)];
    jit.r = rand(-1.5, 1.5); jit.u = rand(-1, 1); jit.f = rand(0, 2.5);
    spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.4)).normalize().multiplyScalar(a.speed);
    if (a.name === 'Jellyfish') spV.set(spV.x * 0.5, 0.25, spV.z * 0.5);
    const s = planPath(spV, a.size, rand(3.5, 6)); if (!s) return;
    a.vel.copy(spV); a.start.copy(spS); a.t0 = state.t; a.meetIn = s; a.react = null; a.active = true; a.obj.visible = true;
    a.obj.position.copy(spS);
  }
}
function runPassers(p) {
  if (!state.started) return;
  updateView();
  if (state.t < PASSERS.lastT - 1) { deactivatePassers(); PASSERS.next = state.t + 3; }   // the dive started over
  PASSERS.lastT = state.t;
  if (state.playing && state.t >= PASSERS.next) { spawnPasser(p); PASSERS.next = state.t + rand(5, 11); }
}

export { PASSERS, deactivatePassers, initPassers, spawnPasser, runPassers, inSight };
