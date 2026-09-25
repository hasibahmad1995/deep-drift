/* Runs a list of slow jobs one at a time, letting the page draw and react between them,
   so the browser never freezes for long while the dive is being built.
   Each job's time (ms) is kept in STARTUP so a test can watch how long opening takes.
   While it runs, STARTUP.busy tells the frame loop not to draw: a half-built world is not worth drawing, and drawing
   it would build shader programs one by one (slow) instead of all together at the end (warmup.js). */

const STARTUP = { steps: [], readyAt: 0, busy: false };   // busy: the frame loop should wait

const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

// jobs: [[label, fn], ...]; fn may be async. report(label, doneFraction) is called before each job.
async function runSteps(jobs, report) {
  await nextFrame(); STARTUP.busy = true;   // one picture of the empty sea first, behind the loading message
  for (let i = 0; i < jobs.length; i++) {
    const [label, fn] = jobs[i];
    report(label, i / jobs.length);
    await nextFrame();
    const t0 = performance.now();
    await fn();
    STARTUP.steps.push([label, Math.round(performance.now() - t0)]);
  }
  STARTUP.busy = false; report('', 1);
  STARTUP.readyAt = Math.round(performance.now());
}

export { STARTUP, runSteps, nextFrame };
