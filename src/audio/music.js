/* The soundtrack, made live from simple tones, and the little touch sound. */
import { SETTINGS } from '../config.js';
import { wet } from '../engine/wet.js';
import { $ } from '../util/dom.js';

const music = { ctx: null, master: null, bus: null, on: false, timers: [], pads: [], chord: 0, noise: null };
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [220, 277.18, 329.63]];
function wobble(ctx, param, rate, depth) { const l = ctx.createOscillator(), g = ctx.createGain(); l.frequency.value = rate; g.gain.value = depth * param.value; l.connect(g); g.connect(param); l.start(); }
function buildMusic() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  const bus = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(), rev = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.5), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  rev.buffer = buf; dry.gain.value = 0.8; wet.gain.value = 0.55;
  bus.connect(dry); dry.connect(master); bus.connect(rev); rev.connect(wet); wet.connect(master);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170;
  const dg = ctx.createGain(); dg.gain.value = 0.35; lp.connect(dg); dg.connect(bus);
  [[55, 'sine', 0, 0.8], [55.3, 'triangle', 0, 0.5], [82.4, 'sine', -5, 0.6]].forEach(([f, type, det, vol]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; g.gain.value = vol; o.connect(g); g.connect(lp); o.start();
  });
  wobble(ctx, dg.gain, 0.05, 0.1);
  const plp = ctx.createBiquadFilter(); plp.type = 'lowpass'; plp.frequency.value = 420;
  const pg = ctx.createGain(); pg.gain.value = 0.13; plp.connect(pg); pg.connect(bus);
  music.pads = CHORDS[0].map((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (i - 1) * 7; g.gain.value = 0.33; o.connect(g); g.connect(plp); o.start(); wobble(ctx, g.gain, 0.03 + i * 0.017, 0.25); return o; });
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  music.noise = nb;
  Object.assign(music, { ctx, master, bus });
}
const later = (fn, ms) => music.timers.push(setTimeout(fn, ms));
const clearTimers = () => { music.timers.forEach(clearTimeout); music.timers = []; };
function bubbleBlip() {
  if (!music.on) return;
  const ctx = music.ctx, t0 = ctx.currentTime, n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const st = t0 + i * 0.09 + Math.random() * 0.04, o = ctx.createOscillator(), g = ctx.createGain(), f = 350 + Math.random() * 700;
    o.type = 'sine'; o.frequency.setValueAtTime(f, st); o.frequency.exponentialRampToValueAtTime(f * 2.1, st + 0.07);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.05, st + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, st + 0.13);
    o.connect(g); g.connect(music.bus); o.start(st); o.stop(st + 0.15);
  }
  later(bubbleBlip, 900 + Math.random() * 3200);
}
function breathe() {   // the diver's regulator: a soft breath in, then a breath out with bubbles
  if (!music.on) return;
  const ctx = music.ctx, t0 = ctx.currentTime;
  const noise = (start, dur, f0, f1, vol) => {
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = music.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, start); bp.frequency.linearRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + dur * 0.3); g.gain.linearRampToValueAtTime(0, start + dur);
    s.connect(bp); bp.connect(g); g.connect(music.bus); s.start(start); s.stop(start + dur + 0.05);
  };
  noise(t0, 1.1, 700, 1500, 0.05); noise(t0 + 1.6, 1.5, 1600, 900, 0.035);
  later(breathe, 5200);
}
function whaleGlide() {
  if (!music.on) return;
  const ctx = music.ctx, st = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
  o.type = 'sine'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 900;
  o.frequency.setValueAtTime(200, st); o.frequency.linearRampToValueAtTime(420, st + 2.5); o.frequency.linearRampToValueAtTime(170, st + 7);
  o2.frequency.setValueAtTime(400, st); o2.frequency.linearRampToValueAtTime(840, st + 2.5); o2.frequency.linearRampToValueAtTime(340, st + 7);
  vib.frequency.value = 5.5; vg.gain.value = 4; vib.connect(vg); vg.connect(o.frequency);
  g2.gain.value = 0.25; g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.08, st + 2); g.gain.linearRampToValueAtTime(0.08, st + 4); g.gain.linearRampToValueAtTime(0, st + 7.5);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(music.bus);
  [o, o2, vib].forEach(x => { x.start(st); x.stop(st + 8); });
  later(whaleGlide, 22000 + Math.random() * 25000);
}
function chordShift() { if (!music.on) return; music.chord = (music.chord + 1) % CHORDS.length; music.pads.forEach((o, i) => o.frequency.setTargetAtTime(CHORDS[music.chord][i], music.ctx.currentTime, 4)); later(chordShift, 24000); }
function scheduleMusic() { later(bubbleBlip, 1200); later(breathe, 800); later(whaleGlide, 6000); later(chordShift, 22000); }
async function musicOn() {
  if (!music.ctx) buildMusic();
  try { await music.ctx.resume(); } catch (e) { /* the browser refused; the button stays off */ }
  music.on = true; clearTimers();
  const t0 = music.ctx.currentTime, g = music.master.gain;
  g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(SETTINGS.musicVolume, t0 + 3);
  scheduleMusic();
}
function musicOff() {
  music.on = false; clearTimers();
  const t0 = music.ctx.currentTime, g = music.master.gain;
  g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(0, t0 + 1.5);
  later(() => { if (!music.on) music.ctx.suspend(); }, 1700);
}
function toggleMusic() {
  const b = $('btnMusic');
  if (music.on) { musicOff(); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Music: off'; }
  else { musicOn(); b.setAttribute('aria-pressed', 'true'); b.textContent = 'Music: on'; }
}
document.addEventListener('visibilitychange', () => {
  if (!music.ctx || !music.on) return;
  if (document.hidden) { clearTimers(); music.ctx.suspend(); } else { music.ctx.resume(); scheduleMusic(); }
});
function pop() {   // a tiny bubble sound for a touch (only if the music is on)
  if (!music.on || !music.ctx) return;
  const ctx = music.ctx, st = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(500, st); o.frequency.exponentialRampToValueAtTime(1100, st + 0.08);
  g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.06, st + 0.01); g.gain.exponentialRampToValueAtTime(0.001, st + 0.16);
  o.connect(g); g.connect(music.bus); o.start(st); o.stop(st + 0.2);
}

// The home screen is quiet: going home stops the music, and the next Begin brings it back if it was playing.
const home = { wasOn: false };
function musicAtHome() { home.wasOn = music.on; if (music.on) toggleMusic(); }
function musicAtBegin() { if (home.wasOn && !music.on) toggleMusic(); home.wasOn = false; }

export { music, toggleMusic, musicAtHome, musicAtBegin, pop };
