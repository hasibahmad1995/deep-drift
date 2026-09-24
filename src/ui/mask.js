/* The diver's mask frame and the air hose, drawn on top of the picture. */
import { breath } from '../diver/bubbles.js';
import { REDUCED } from '../engine/device.js';
import { $ } from '../util/dom.js';
import { TAU } from '../util/math.js';

const maskC = $('mask'), hoseC = $('hose');
let maskW = 0, maskH = 0, hoseAcc = 0;
function layoutMask() {
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  maskW = W; maskH = H; maskC.width = Math.round(W * dpr); maskC.height = Math.round(H * dpr); hoseC.width = Math.round(W * 0.75); hoseC.height = Math.round(H * 0.75);
  const g = maskC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const mx = Math.max(8, W * 0.03), mt = Math.max(10, H * 0.05), mb = Math.max(8, H * 0.045), r = Math.min(W, H) * 0.17, L = mx, R = W - mx, T = mt, B = H - mb;
  const nw = Math.min(W * 0.2, 170), nh = Math.min(H * 0.1, 84);
  const win = new Path2D();
  win.moveTo(L + r, T); win.lineTo(R - r, T); win.quadraticCurveTo(R, T, R, T + r); win.lineTo(R, B - r); win.quadraticCurveTo(R, B, R - r, B);
  win.lineTo(W / 2 + nw * 0.95, B); win.bezierCurveTo(W / 2 + nw * 0.55, B, W / 2 + nw * 0.5, B - nh, W / 2, B - nh); win.bezierCurveTo(W / 2 - nw * 0.5, B - nh, W / 2 - nw * 0.55, B, W / 2 - nw * 0.95, B);
  win.lineTo(L + r, B); win.quadraticCurveTo(L, B, L, B - r); win.lineTo(L, T + r); win.quadraticCurveTo(L, T, L + r, T); win.closePath();
  const outer = new Path2D(); outer.rect(0, 0, W, H); outer.addPath(win);
  const rub = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); rub.addColorStop(0, '#0b0f13'); rub.addColorStop(1, '#010203');
  g.fillStyle = rub; g.fill(outer, 'evenodd');
  g.save(); g.clip(win); g.lineWidth = 16; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke(win);
  const sheen = g.createLinearGradient(0, 0, W, H); sheen.addColorStop(0, 'rgba(255,255,255,0.075)'); sheen.addColorStop(0.28, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(120,200,255,0.03)');
  g.fillStyle = sheen; g.fillRect(0, 0, W, H); g.restore();
  g.lineWidth = 2; g.strokeStyle = 'rgba(130,150,165,0.28)'; g.stroke(win);
  drawHose(0, true);
}
// The air hose comes over the shoulder to the regulator at your mouth, and moves a little as you breathe.
const hosePt = (p0, p1, p2, p3, t, out) => { const u = 1 - t; out.x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x; out.y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y; return out; };
const hp = { x: 0, y: 0 }, hq = { x: 0, y: 0 };
function drawHose(dt, force) {
  if (!force) { hoseAcc += dt; if (hoseAcc < 1 / 30) return; hoseAcc = 0; }
  const g = hoseC.getContext('2d'), W = hoseC.width, H = hoseC.height, s = Math.min(W, H) / 620, now = performance.now(), calm = REDUCED ? 0 : 1;
  g.clearRect(0, 0, W, H);
  const portrait = H > W, sw = calm * Math.sin(now * 0.0011) * 7 * s, br = calm * (breath.exhaleLeft > 0 ? Math.sin(now * 0.035) * 2.5 * s : 0);
  const p0 = { x: W + 30 * s, y: H * (portrait ? 0.6 : 0.5) }, p1 = { x: W * 0.92 + sw, y: H * (portrait ? 0.48 : 0.4) + sw }, p2 = { x: W * (portrait ? 0.9 : 0.8) - sw, y: H * 0.97 }, p3 = { x: W * (portrait ? 0.64 : 0.58) + br, y: H + 26 * s };
  const path = new Path2D(); path.moveTo(p0.x, p0.y); path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  g.lineCap = 'round'; g.strokeStyle = '#0d1014'; g.lineWidth = 30 * s; g.stroke(path);
  g.strokeStyle = '#1b2026'; g.lineWidth = 22 * s; g.stroke(path);
  for (let k = 0; k <= 70; k++) {   // ribs
    const t = k / 70; hosePt(p0, p1, p2, p3, t, hp); hosePt(p0, p1, p2, p3, Math.min(1, t + 0.01), hq);
    let dx = hq.x - hp.x, dy = hq.y - hp.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    g.beginPath(); g.moveTo(hp.x - dy * 11 * s, hp.y + dx * 11 * s); g.lineTo(hp.x + dy * 11 * s, hp.y - dx * 11 * s);
    g.strokeStyle = k % 2 ? 'rgba(0,0,0,0.55)' : 'rgba(150,170,185,0.10)'; g.lineWidth = 2.4 * s; g.stroke();
  }
  g.save(); g.translate(-5 * s, -5 * s); g.strokeStyle = 'rgba(120,140,155,0.25)'; g.lineWidth = 3 * s; g.stroke(path); g.restore();
  // the regulator (mouthpiece part)
  g.save(); g.translate(p3.x, H - 6 * s); g.rotate(-0.15);
  g.fillStyle = '#12161a'; g.beginPath(); g.ellipse(0, 0, 58 * s, 40 * s, 0, 0, TAU); g.fill();
  g.strokeStyle = '#2a323a'; g.lineWidth = 4 * s; g.stroke();
  g.fillStyle = '#c9a800'; g.beginPath(); g.arc(-8 * s, -6 * s, 10 * s, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.ellipse(-20 * s, -22 * s, 22 * s, 7 * s, -0.5, 0, TAU); g.fill();
  g.restore();
}

export { layoutMask, drawHose };
