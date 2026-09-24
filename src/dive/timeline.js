/* How long each part of the dive lasts, and how real depth maps to height in the 3D world. */
import { SETTINGS, STAGES } from '../config.js';
import { REDUCED } from '../engine/device.js';

if (REDUCED) SETTINGS.speed *= 0.5;
let TOTAL = 0;   // the whole dive, in seconds
STAGES.forEach(s => { s.dur = s.seconds / SETTINGS.speed; s.t0 = TOTAL; TOTAL += s.dur; });
const stageIndex = t => { for (let i = 0; i < STAGES.length; i++) if (t < STAGES[i].t0 + STAGES[i].dur) return i; return STAGES.length - 1; };
const tu = (si, u) => STAGES[si].t0 + STAGES[si].dur * u;
const worldY = D => (D < 180 ? -D : -(180 + (D - 180) * 0.35));   // deep water is squeezed so the dive stays short

export { TOTAL, stageIndex, tu, worldY };
