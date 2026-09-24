/* Schools of fish: many copies of one shape moving together. */
import * as THREE from '../lib/three.js';
import { clock } from '../dive/state.js';
import { TOUCH } from './touch.js';
import { col } from '../util/color.js';
import { TAU, clamp, rand } from '../util/math.js';

/* ---- schools of fish: many copies of one shape, moving together ----
   A school either circles a point (cfg.omega) or swims along a straight line (cfg.line).
   If the diver touches a fish, that fish darts away and then slowly comes back to the school. */
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
    this.mesh.frustumCulled = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.p = new THREE.Vector3(); this.sc = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.fw = new THREE.Vector3(); this.eu = new THREE.Euler(0, 0, 0, 'YZX');
  }
  centre(t, out) {
    const c = this.cfg;
    if (c.line) return out.copy(c.line.start).addScaledVector(c.line.vel, t - c.line.t0);
    const a = c.omega * t + c.phase;
    return out.set(c.center[0] + Math.cos(a) * c.radius, c.center[1] + Math.sin(a * 0.7) * c.rise, c.center[2] + Math.sin(a) * c.radius);
  }
  dirAt(t, out) {
    const c = this.cfg;
    if (c.line) return out.set(c.line.vel.x, 0, c.line.vel.z);
    const a = c.omega * t + c.phase, d = c.omega > 0 ? 1 : -1;
    return out.set(-Math.sin(a) * d, 0, Math.cos(a) * d);
  }
  update(t) {
    if (!this.mesh.visible) return;
    const c = this.cfg, spread = c.spread, dt = clock.dt, TP = TOUCH.point, reach2 = (TOUCH.r + 0.12) * (TOUCH.r + 0.12);
    for (let i = 0; i < this.n; i++) {
      const f = this.fish[i], tt = t - f.lag * 0.5;
      this.centre(tt, this.p);
      this.p.x += f.o.x * spread + Math.sin(t * 0.8 + f.w) * 0.25; this.p.y += f.o.y * spread * 0.6 + Math.sin(t * 1.1 + f.w) * 0.15; this.p.z += f.o.z * spread;
      this.p.add(f.off);
      const dx = this.p.x - TP.x, dy = this.p.y - TP.y, dz = this.p.z - TP.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < reach2) {   // touched: dart away from the diver
        const l = Math.sqrt(d2) || 1, sp = rand(3, 5);
        f.vel.set(dx / l * sp, (dy / l * 0.6 + rand(-0.2, 0.4)) * sp, dz / l * sp);
        TOUCH.hit(this.name || 'a fish');
      }
      if (f.vel.lengthSq() > 0.01) { f.off.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-dt * 1.6)); }
      f.off.multiplyScalar(Math.exp(-dt * 0.22));   // slowly swim back to the school
      this.dirAt(tt, this.fw); const hl = Math.hypot(this.fw.x, this.fw.z) || 1;
      const hx = this.fw.x / hl + f.vel.x * 0.5, hy = f.vel.y * 0.5, hz = this.fw.z / hl + f.vel.z * 0.5, h = Math.hypot(hx, hy, hz) || 1;
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
