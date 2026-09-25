/* Gets the graphics card ready before the dive starts, so the dive does not stutter later.
   The first time a material or a shape is drawn, the browser has to build its shader program and copy the shape
   to the graphics card. Done during the dive, that shows up as a freeze each time a new place comes into view.
   Here we do all of it once while the loading message is showing. */
import { renderer, scene, camera } from './renderer.js';
import { STARTUP } from '../util/steps.js';

// Shows every hidden part for a moment, runs job, then puts everything back as it was.
async function withAllShown(job) {
  const hidden = [], unculled = [];
  scene.traverse(o => {
    if (!o.visible) { hidden.push(o); o.visible = true; }
    if (o.frustumCulled) { unculled.push(o); o.frustumCulled = false; }
  });
  try { await job(); } finally {
    hidden.forEach(o => { o.visible = false; });
    unculled.forEach(o => { o.frustumCulled = true; });
  }
}

async function warmUp() {
  await withAllShown(async () => {
    let t0 = performance.now();
    // build every shader program: in the background where the browser can, otherwise all at once right here
    if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
    STARTUP.steps.push(['  shaders', Math.round(performance.now() - t0)]);
    t0 = performance.now();
    // draw everything once onto the real screen, but clipped to a single pixel: this copies every shape to the card
    // and builds the exact shader versions the screen needs (an off-screen picture would need different ones)
    renderer.setScissor(0, 0, 1, 1); renderer.setScissorTest(true);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    STARTUP.steps.push(['  shapes', Math.round(performance.now() - t0)]);
    STARTUP.warmPrograms = renderer.info.programs.map(p => p.id);   // tests compare this with later, to catch shaders built too late
  });
}

export { warmUp };
