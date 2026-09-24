/* Random visitors: animals and schools that swim right past the diver every few seconds. */
import * as THREE from '../lib/three.js';
import { pathAt } from '../dive/path.js';
import { state } from '../dive/state.js';
import { DETAIL } from '../engine/device.js';
import { scene } from '../engine/renderer.js';
import { wet } from '../engine/wet.js';
import { ACTORS } from './actors.js';
import { BARRA } from './barramundi.js';
import { makeCreature } from './creature.js';
import { makeJelly } from './jelly.js';
import { orient } from './motion.js';
import { School } from './school.js';
import { shrimpGeo, smallFishGeo } from './small-shapes.js';
import { SPECIES } from './species.js';
import { makeTurtle } from './turtle.js';
import { rand } from '../util/math.js';
import { UP } from '../world/layout.js';

/* ---- random visitors: animals and schools that swim right past the diver ---- */
const PASSERS = { indiv: [], swarms: [], next: 8, stage: -1, lastT: 0 };
function deactivatePassers() {
  PASSERS.indiv.forEach(a => { a.active = false; a.obj.visible = false; a.react = null; });
  PASSERS.swarms.forEach(a => { a.active = false; a.sch.mesh.visible = false; });
}
function initPassers(M) {
  const V = () => new THREE.Vector3(), D = Math.max(DETAIL, 0.5);
  const small = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const indiv = (si, name, make, speed, count, lim) => {
    for (let i = 0; i < count; i++) {
      const obj = make(); obj.visible = false; scene.add(obj);
      const a = Object.assign({ obj, name, si, speed, active: false, start: V(), vel: V(), t0: 0, life: 0, range: 10, tick: obj.userData.update || null }, lim || {});
      a.update = t => {
        if (!a.active) return;
        if (t - a.t0 > a.life) { a.active = false; obj.visible = false; return; }
        obj.position.copy(a.start).addScaledVector(a.vel, t - a.t0); orient(obj, a.vel.x, a.vel.y, a.vel.z); if (a.tick) a.tick(t);
      };
      ACTORS.push(a); PASSERS.indiv.push(a);
    }
  };
  const swarm = (si, name, geo, mat, n, colors, scale, lim) => {
    const sch = new School(geo, mat, n, { line: { start: V(), vel: V(), t0: 0 }, spread: 2.2, scale, colors, name });
    sch.mesh.visible = false; scene.add(sch.mesh);
    const a = Object.assign({ obj: null, name, si, sch, active: false, life: 0 }, lim || {});
    a.update = t => { if (!a.active) return; sch.update(t); if (t - sch.cfg.line.t0 > a.life) { a.active = false; sch.mesh.visible = false; } };
    ACTORS.push(a); PASSERS.swarms.push(a);
  };
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'];
  indiv(0, 'Blacktip reef shark', () => makeCreature(SPECIES.blacktip), 1.8, 2);
  indiv(0, 'Green sea turtle', () => makeTurtle(), 0.8, 1);
  indiv(0, 'Giant manta ray', () => makeCreature(SPECIES.manta), 1.6, 1, { minD: 15 });
  indiv(1, 'Whale shark', () => makeCreature(SPECIES.whaleshark), 1.3, 1);
  indiv(1, 'Great white shark', () => makeCreature(SPECIES.greatwhite), 1.8, 1);
  indiv(1, 'Jellyfish', () => { const j = makeJelly(0.85 + rand(-0.05, 0.05), 0.5); j.scale.setScalar(rand(0.5, 1.1)); return j; }, 0.35, 3, { minD: 150 });
  indiv(2, 'Jellyfish', () => { const j = makeJelly(0.5 + rand(-0.05, 0.05), 1.0); j.scale.setScalar(rand(0.5, 1.2)); return j; }, 0.3, 3);
  indiv(2, 'Anglerfish', () => makeCreature(SPECIES.angler), 0.5, 1);
  indiv(4, 'Dumbo octopus', () => makeCreature(SPECIES.dumbo), 0.6, 2);
  indiv(5, 'Mariana snailfish', () => makeCreature(SPECIES.snailfish), 0.5, 3);
  swarm(0, 'Reef fish', smallFishGeo(), small, Math.round(60 * D), orange, 1.0);
  swarm(0, 'Reef fish', smallFishGeo(), small, Math.round(50 * D), teal, 1.0);
  if (BARRA.model) { swarm(0, 'Barramundi', BARRA.model.geometry.clone(), BARRA.model.material, Math.round(26 * D), null, 1.0); swarm(1, 'Barramundi', BARRA.model.geometry.clone(), BARRA.model.material, Math.round(24 * D), null, 1.0, { maxD: 260 }); }
  swarm(1, 'Silver jacks', smallFishGeo(), M.silverMat, Math.round(70 * D), ['#c9d3d8', '#b5c2c9', '#dfe6e9'], 1.6);
  swarm(2, 'Lanternfish', smallFishGeo(), M.glowMat, Math.round(60 * D), ['#9fe8ff', '#7fd6ff'], 1.5);
  swarm(3, 'Vent shrimp', shrimpGeo(), M.whiteMat, Math.round(60 * D), ['#f3ede0', '#ffe9d0'], 0.5);
  swarm(4, 'Amphipods', shrimpGeo(), M.whiteMat, Math.round(60 * D), ['#f3ede0', '#ffe9d0'], 0.5);
  swarm(5, 'Amphipods', shrimpGeo(), M.whiteMat, Math.round(60 * D), ['#f5e6dc', '#ffd9c0'], 0.4);
}
const spF = new THREE.Vector3(), spR = new THREE.Vector3(), spU = new THREE.Vector3(), spT = new THREE.Vector3(), spV = new THREE.Vector3();
function spawnPasser(p) {
  const ok = a => a.si === p.si && !a.active && (!a.minD || p.D >= a.minD) && (!a.maxD || p.D <= a.maxD);
  const ind = PASSERS.indiv.filter(ok), sw = PASSERS.swarms.filter(ok);
  if (!ind.length && !sw.length) return;
  spF.copy(p.fwd); spR.crossVectors(spF, UP).normalize(); spU.crossVectors(spR, spF).normalize();
  const useSwarm = sw.length && (!ind.length || Math.random() < 0.45), T = useSwarm ? rand(3, 5) : rand(3.5, 6);
  const meet = pathAt(state.t + T).pos;   // where the diver will be when it arrives
  if (useSwarm) {
    const a = sw[Math.floor(Math.random() * sw.length)], sp = rand(1.7, 2.6);
    spT.copy(meet).addScaledVector(spF, rand(0.5, 2)).addScaledVector(spR, rand(-0.7, 0.7)).addScaledVector(spU, rand(-0.5, 0.5));
    if (Math.random() < 0.6) spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.3)); else spV.copy(spF).negate().addScaledVector(spR, rand(-0.25, 0.25));
    spV.y *= 0.3; spV.normalize().multiplyScalar(sp);
    const L = a.sch.cfg.line; L.vel.copy(spV); L.start.copy(spT).addScaledVector(spV, -T); L.t0 = state.t;
    a.sch.fish.forEach(f => { f.off.set(0, 0, 0); f.vel.set(0, 0, 0); }); a.sch.mesh.visible = true; a.active = true; a.life = T * 2 + 6;
  } else {
    const a = ind[Math.floor(Math.random() * ind.length)];
    spT.copy(meet).addScaledVector(spR, rand(-1.5, 1.5)).addScaledVector(spU, rand(-1, 1)).addScaledVector(spF, rand(0, 2.5));
    spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.4)).normalize().multiplyScalar(a.speed);
    if (a.name === 'Jellyfish') spV.set(spV.x * 0.5, 0.25, spV.z * 0.5);
    a.vel.copy(spV); a.start.copy(spT).addScaledVector(spV, -T); a.t0 = state.t; a.life = T * 2 + 3; a.react = null; a.active = true; a.obj.visible = true;
  }
}
function runPassers(p) {
  if (!state.started) return;
  if (state.t < PASSERS.lastT - 1) { deactivatePassers(); PASSERS.stage = -1; }   // the dive started over
  PASSERS.lastT = state.t;
  if (PASSERS.stage !== p.si) { deactivatePassers(); PASSERS.stage = p.si; PASSERS.next = state.t + 3; }
  if (state.playing && state.t >= PASSERS.next) { spawnPasser(p); PASSERS.next = state.t + rand(5, 11); }
}

export { PASSERS, deactivatePassers, initPassers, spawnPasser, runPassers };
