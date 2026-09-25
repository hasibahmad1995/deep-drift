/* The side panel on the left edge (Pause, Music, Zoom). With a mouse it opens while you hover over it (CSS); on a touch
   screen its handle opens and closes it, and a tap anywhere else closes it. Also the Zoom button: a press steps the zoom,
   holding it zooms smoothly (see diver/zoom.js). */
import { cancelZoomPress, pressZoom, stepZoom } from '../diver/zoom.js';
import { $ } from '../util/dom.js';

function setOpen(open) { $('dock').classList.toggle('open', open); $('dockTab').setAttribute('aria-expanded', String(open)); }

function wireDock() {
  $('dockTab').addEventListener('click', () => setOpen(!$('dock').classList.contains('open')));
  document.addEventListener('pointerdown', e => { if (!$('dock').contains(e.target)) setOpen(false); });
  const z = $('btnZoom');
  z.addEventListener('pointerdown', e => { z.setPointerCapture(e.pointerId); pressZoom(true); });
  z.addEventListener('pointerup', () => pressZoom(false));
  z.addEventListener('pointercancel', cancelZoomPress);
  z.addEventListener('click', e => { if (e.detail === 0) stepZoom(); });   // Enter or Space on the keyboard
}

export { wireDock };
