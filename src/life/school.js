/* Schools of fish: many copies of one shape moving together. */
import * as THREE from '../lib/three.js';
import { clock } from '../dive/state.js';
import { camera } from '../engine/renderer.js';
import { sightRange } from '../world/culling.js';
import { BODY } from '../diver/collision.js';
import { TOUCH } from './touch.js';
import { chance, vary } from './variety.js';
import { col } from '../util/color.js';
import { TAU, clamp, rand } from '../util/math.js';

/* ---- schools of fish: many copies of one shape, moving together ----
   A school either circles a point (cfg.omega) or swims along a straight line (cfg.line).
   Fish keep a little space around the diver (COMFORT): closer than that, a fish turns and speeds away (quickly, the way
   startled fish do, but not in a single jump), so the school parts around the diver and closes again behind.
   No fish ever passes through the diver. */
const COMFORT = 1.4;   // metres from the diver's body
const SURGE = 1.15;    // how much a circling school speeds up and slows down (1.15 gives about 40%, see angle())

class School {
  constructor(geo, mat, n, cfg) {
    this.cfg = cfg; this.n = n; this.name = cfg.name || null;
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    const ph = new Float32Array(n); this.fish = [];
    for (let i = 0; i < n; i++) {
      ph[i] = Math.random() * TAU;
      this.fish.push({ o: new THREE.Vector3(rand(-1, 1), rand(-0.6, 0.6), rand(-1, 1)), lag: rand(0, 1.2), s: rand(0.8, 1.2), w: rand(0, TAU), off: new THREE.Vector3(), vel: new THREE.Vector3() });
      if (cfg.colors) this.mesh.setColorAt(i, col(cfg.colors[Math.floor(Math.random() * cfg.colors.length)]).multiplyScalar(rand(0.8, 1.1)));
    }
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
    if (!cfg.line) { const om = cfg.omega; vary(() => { cfg.phase = rand(0, TAU); cfg.omega = chance(0.5) ? om : -om; }); }   // a different start each dive
    // the computer skips the school when it is off screen or faded into the distance; the sphere around it moves with it
    this.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), cfg.spread * 1.8 + 4); this.away = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.p = new THREE.Vector3(); this.sc = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.fw = new THREE.Vector3(); this.eu = new THREE.Euler(0, 0, 0, 'YZX');
  }
  // Where a circling school is on its circle. Real schools do not cruise at one steady speed: they surge and ease off,
  // so the speed rises and falls by about 40% every 18 s or so (it never stops or turns back).
  angle(t) {
    const c = this.cfg;
    return c.omega * t + c.phase + SURGE * Math.abs(c.omega) * Math.sin(0.35 * t + c.phase * 1.7);
  }
  centre(t, out) {
    const c = this.cfg;
    if (c.line) return out.copy(c.line.start).addScaledVector(c.line.vel, t - c.line.t0);
    const a = this.angle(t);
    return out.set(c.center[0] + Math.cos(a) * c.radius, c.center[1] + Math.sin(a * 0.7) * c.rise, c.center[2] + Math.sin(a) * c.radius);
  }
  // Where fish i is at time t: its place in the school, plus a quick weave of its own, plus any dodge (f.off).
  fishAt(f, t, out) {
    const s = this.cfg.spread;
    this.centre(t - f.lag * 0.5, out);
    out.x += f.o.x * s + Math.sin(t * 2.3 + f.w) * 0.18; out.y += f.o.y * s * 0.6 + Math.sin(t * 1.7 + f.w * 1.3) * 0.1; out.z += f.o.z * s + Math.cos(t * 2.0 + f.w) * 0.12;
    return out.add(f.off);
  }
  update(t) {
    if (!this.mesh.visible && !this.away) return;
    // far beyond sight (fully faded in the water): hide it and skip the work until it comes back
    const bs = this.mesh.boundingSphere; this.centre(t, bs.center);
    const away = bs.center.distanceTo(camera.position) - bs.radius > sightRange() + (this.away ? 0 : 10);   // 10 m of slack so it never flickers
    if (away !== this.away) { this.away = away; this.mesh.visible = !away; }
    if (away) return;
    const c = this.cfg, dt = clock.dt, TP = TOUCH.point, reach2 = (TOUCH.r + 0.12) * (TOUCH.r + 0.12), E = camera.position;
    const near = BODY + COMFORT, hard = BODY + 0.12 * c.scale, turn = 1 - Math.exp(-dt * 9);
    for (let i = 0; i < this.n; i++) {
      const f = this.fish[i];
      this.fishAt(f, t, this.p);
      const tx = this.p.x - TP.x, ty = this.p.y - TP.y, tz = this.p.z - TP.z;
      if (tx * tx + ty * ty + tz * tz < reach2) TOUCH.hit(this.name || 'a fish');   // the hand touched it
      const dx = this.p.x - E.x, dy = this.p.y - E.y, dz = this.p.z - E.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < near * near) {   // too close to the diver: turn and speed away
        const l = Math.sqrt(d2) || 1, sp = (2.5 + f.s * 1.5) * (1 - Math.max(0, l - BODY) / COMFORT) + 0.5;
        const vx = dx / l * sp, vy = dy / l * sp * 0.6, vz = dz / l * sp;
        if (f.vel.x * vx + f.vel.y * vy + f.vel.z * vz < sp * sp) { f.vel.x += (vx - f.vel.x) * turn; f.vel.y += (vy - f.vel.y) * turn; f.vel.z += (vz - f.vel.z) * turn; }
        if (l < hard) { const k = (hard - l) / l; f.off.x += dx * k; f.off.y += dy * k; f.off.z += dz * k; this.p.x += dx * k; this.p.y += dy * k; this.p.z += dz * k; }   // never inside the diver
      }
      if (f.vel.lengthSq() > 0.01) { f.off.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-dt * 1.6)); }
      f.off.multiplyScalar(Math.exp(-dt * 0.22));   // slowly swim back to the school
      // each fish faces the way it is really moving (its weave and surges included), turned further by any dodge
      this.fishAt(f, t - 0.12, this.fw); this.fw.sub(this.p).negate();   // movement over the last 0.12 s
      const ml = Math.hypot(this.fw.x, this.fw.y, this.fw.z) || 1;
      const hx = this.fw.x / ml + f.vel.x * 0.5, hy = this.fw.y / ml * 0.6 + f.vel.y * 0.5, hz = this.fw.z / ml + f.vel.z * 0.5, h = Math.hypot(hx, hy, hz) || 1;
      this.eu.set(Math.sin(t * 0.7 + f.w) * 0.12, Math.atan2(-hz, hx), Math.asin(clamp(hy / h, -1, 1)));
      this.q.setFromEuler(this.eu);
      this.sc.setScalar(c.scale * f.s);
      this.m.compose(this.p, this.q, this.sc);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export { School };
