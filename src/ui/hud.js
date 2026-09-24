/* The depth meter, the zone and place names, and the 'Nearby' caption. */
import { FACTS, zoneName } from '../content/facts.js';
import { LEGS } from '../dive/route.js';
import { camera } from '../engine/renderer.js';
import { ACTORS } from '../life/actors.js';
import { $ } from '../util/dom.js';

const touchMsg = { text: '', until: 0 };
let hud = '', capName = '';
function updateHud(D, si) {
  const shown = D < 100 ? Math.round(D) : Math.round(D / 5) * 5;
  $('depthNumber').textContent = shown.toLocaleString('en');
  const z = D < 5 ? zoneName(D) : zoneName(D) + ' · ' + LEGS[si].place;   // e.g. 'Midnight zone · Hydrothermal vents'
  if (z !== hud) { $('zoneName').textContent = z; hud = z; }
  let best = null, bd = 1e9;
  ACTORS.forEach(a => { if (!a.name || !a.obj) return; const d = a.obj.position.distanceTo(camera.position); if (d < a.range && d < bd) { bd = d; best = a.name; } });
  const touching = performance.now() < touchMsg.until, want = touching ? touchMsg.text : (best ? 'Nearby: ' + best : '');
  if (want !== capName) { capName = want; $('caption').textContent = want; $('fact').textContent = touching ? '' : (best ? (FACTS[best] || '') : ''); }
}

export { touchMsg, updateHud };
