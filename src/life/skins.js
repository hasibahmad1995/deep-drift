/* Skin pictures for the animals, drawn in code. */
import { TAU, seeded } from '../util/math.js';
import { canvasTexture } from '../util/textures.js';

const skins = {};   // skin pictures, made once when first needed
function skin(kind) {
  if (skins[kind]) return skins[kind];
  const R = seeded(kind.length * 31 + 7);
  const t = canvasTexture(1024, 256, (g, w, h) => {
    const grad = (stops) => { const lg = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => lg.addColorStop(p, c)); g.fillStyle = lg; g.fillRect(0, 0, w, h); };
    if (kind === 'whaleshark') {
      grad([[0, '#5b7a8f'], [0.25, '#2f4a60'], [0.5, '#5b7a8f'], [0.75, '#d7e0e2'], [1, '#5b7a8f']]);
      g.strokeStyle = 'rgba(190,210,220,.16)'; g.lineWidth = 3;
      for (let x = 60; x < w; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, h * 0.55); g.stroke(); }
      for (let y = 30; y < h * 0.55; y += 44) { g.beginPath(); g.moveTo(60, y); g.lineTo(w, y); g.stroke(); }
      for (let i = 0; i < 520; i++) {
        const x = R() * w, y = R() * h * 0.52, r = 3 + R() * 5;
        g.fillStyle = 'rgba(245,250,250,' + (0.7 + R() * 0.3) + ')'; g.beginPath(); g.ellipse(x, y, r * 1.2, r, 0, 0, TAU); g.fill();
      }
    } else if (kind === 'manta') {
      grad([[0, '#1c242c'], [0.25, '#20292f'], [0.47, '#151b21'], [0.53, '#e9eef0'], [0.75, '#f3f6f7'], [0.97, '#dfe6e9'], [1, '#1c242c']]);
      g.fillStyle = '#eef3f5';
      [[0.16, 0.2], [0.16, 0.3]].forEach(([u, v], k) => { g.beginPath(); g.moveTo(w * 0.08, h * (0.38)); g.quadraticCurveTo(w * 0.2, h * 0.08, w * 0.34, h * 0.1); g.quadraticCurveTo(w * 0.24, h * 0.22, w * 0.2, h * 0.4); g.fill(); });
      g.fillStyle = 'rgba(20,25,30,.5)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(w * (0.3 + R() * 0.3), h * (0.56 + R() * 0.36), 3 + R() * 5, 0, TAU); g.fill(); }
    } else if (kind === 'humpback') {
      grad([[0, '#3b5163'], [0.25, '#1f3142'], [0.5, '#3b5163'], [0.66, '#7f95a3'], [0.8, '#dfe6ea'], [1, '#3b5163']]);
      g.strokeStyle = 'rgba(20,30,40,.35)'; g.lineWidth = 2;
      for (let y = h * 0.6; y < h * 0.95; y += 9) { g.beginPath(); g.moveTo(w * 0.05, y); g.lineTo(w * 0.62, y + 2); g.stroke(); }
      g.fillStyle = 'rgba(220,230,235,.55)'; for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(R() * w, R() * h * 0.5, 1 + R() * 3, 0, TAU); g.fill(); }
    } else if (kind === 'squid') {
      grad([[0, '#b34a33'], [0.25, '#8f3624'], [0.5, '#b34a33'], [0.75, '#e0a184'], [1, '#b34a33']]);
      for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(70,15,8,' + (0.15 + R() * 0.3) + ')'; g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 3.5, 0, TAU); g.fill(); }
    } else if (kind === 'angler') {
      grad([[0, '#6a5244'], [0.25, '#45342b'], [0.5, '#6a5244'], [0.75, '#8b7160'], [1, '#6a5244']]);
      for (let i = 0; i < 1000; i++) { g.fillStyle = 'rgba(' + (R() < 0.5 ? '20,12,8' : '110,85,65') + ',' + (0.12 + R() * 0.25) + ')'; g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 4, 0, TAU); g.fill(); }
    } else if (kind === 'dumbo') {
      grad([[0, '#f6c9bd'], [0.25, '#efb4a6'], [0.5, '#f6c9bd'], [0.75, '#fbe2da'], [1, '#f6c9bd']]);
    } else if (kind === 'snailfish') {
      grad([[0, '#e9c4c6'], [0.25, '#dcaab0'], [0.5, '#e9c4c6'], [0.75, '#f6e3e2'], [1, '#e9c4c6']]);
      g.strokeStyle = 'rgba(190,110,125,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.1, h * 0.02); g.lineTo(w, h * 0.02); g.stroke();
    }
  });
  t.repeat.set(1, 1); skins[kind] = t; return t;
}

export { skin };
