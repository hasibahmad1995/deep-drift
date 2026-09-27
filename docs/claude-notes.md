# Claude's notes for Deep Drift

My own reference, updated after every fix (Hasib's rule since v1.4). Read this, then CLAUDE.md, at the start of a session.
Plain words, no em dashes. Newest state at the top.

## State now (v1.5.1 live plus two small fixes, 26 Sep 2026)
- Two small fixes after v1.5.1 (no version number, no PDF report), on `fix/side-panel-and-surface`, then merged to main:
  1. Side panel: the closed panel's invisible box swallowed swipes on the left edge. Now `#dock` and `#dockBody` have
     `pointer-events: none` until open; hover only under `@media (hover: hover)`; `:has(:focus-visible)` instead of
     `:focus-within` (a tap left the panel stuck open). Tests in tests/controls.py (3b, 3c).
  2. Nothing leaves the water: `life/surface.js` `keepInWater` (called in main.js after reactActor); jellyfish use `jellyAt`
     (bounded wander, never a steady rise) and `jellyDepth`; bubbles die at y > -0.05; specks hidden above y = -0.1 in the
     shader; manta HIT shape fixed (`at` = disc offset toward the nose) with `shy: 4`; big passers cross ahead by their reach + 2.5 m.
     New tests/surface.py (fails on the old code).
- Then three more small changes (branch `fix/surface-light-and-start-screen`):
  1. Bubbles dissolve under the surface (bubbles.js: slow to 0.3x, shrink over the last 1.5 m, gone at 0.1 m under, sideways fan).
  2. Surface and sunbeams (engine/sky.js, environment.js). Research: waves are lenses, light forms curved sheets that look like
     vertical streaks, sharp near the top, blurrier and fainter deeper; sun light bends toward the vertical (Snell): sun 32 deg
     from overhead gives beams about 23 deg. Surface = Voronoi cell-edge light web (two layers) with weak normals (0.75; strong
     ones broke the bright window into puddles). Beams = 14 wide sheets (8 on small screens) shaded from streaks of the entry
     point (`vWP.xz - uLean * vWP.y`), so the pattern is fixed in the water; contrast `exp(-depth/30)`, fade `exp(-depth/42)`,
     `uI = exp(-D/45)`, hidden past 200 m. Bugs fixed: shear was applied before a random yaw (random lean), and `along` was upside down.
     The beam sheets still follow the camera x,z (main.js); only the stripes are world-fixed.
  3. Darker start screen (main.css #intro).
- Loading (measured 27 Sep 2026 on Hasib's laptop, real GPU, 1536x790@1.25): Begin ready at ~4.0 s after our code starts: build
  ~1.3 s, warm-up 1.76 s (shaders 0.76, shapes 1.0), sharpness check 0.45 s. First visit at 9 Mbit/s: ~1.18 MB compressed, 89
  requests, code ready ~3.4 s. The barramundi (tex json 379 KB + glb 126 KB) is 43 percent of the download; three.js ~410 KB.
  Hasib chose "option 2": staged world building (Begin after reef and sea floor, build and warm the deep places in the background).
  If it is not a fit he wants to go back to the state before it (main after these commits).
- Known, not caused by these: tests/solid.py sometimes reports the random Green sea turtle passer appearing or vanishing on
  screen (2 of 5 runs on the old code too). Worth its own fix.
- Not tried on a real phone: the panel touch behaviour. Hasib said "manta ended up beneath me" and I could not reproduce that.
- v1.5.1 is merged, tagged, uploaded to GitHub and published by Cloudflare. All commits uploaded (see docs/commit-log.md).
- Uncommitted on purpose: docs/commit-log.md (its newest table) and this file; they go into the next commit.
- Start of a new session: read this file, CLAUDE.md and docs/commit-log.md ("Where we are"), check `git status`.
- Next: v1.6 animal behaviour, or small changes Hasib asks for. For small changes: branch, commits, merge, no PDF report.

## How v1.5.1 was made
- Published: private GitHub repo + Cloudflare Pages (see CLAUDE.md "Publishing"). Commit log: docs/commit-log.md
  (`python tools/commit_log.py`). Hasib wants to learn: teach step by step, he checks results himself.
- v1.5.1 on `feature/start-screen`: Recenter view in the side panel, clean instant start screen (subtitle "Descend from
  sunlight into the deepest dark on Earth."), music off at home and back on Begin if it was on, cache rules.
  Measured (tests/load.py --cloudlike): compressed site 1.2 MB, ~3 s download at 9 Mbit/s; a modulepreload list gave no
  gain, so it was dropped. The real wait is building the world (~3 s on his laptop). "Begin sooner by building the deep
  places in the background" was offered; Hasib said not now.

## Before v1.5.1
- `main` is tagged v1.5. Branches kept: `feature/v1.2-continuous-dive`, `feature/v1.3-solid-and-smooth`, `feature/v1.4-feel`, `feature/v1.5-controls`.
- Reports: `docs/reports/report-v1.4.pdf`, `report-v1.5.pdf` (made by `docs/make_report.py`, entries in `REPORTS`, site overview in `SITE`).
- Tracking guide: `docs/git-tracking.pdf` (made by `docs/make_git_tracking.py`). Both use `docs/pdf_tools.py`.
- v1.4 feedback led to v1.5: zoom steps up and back down, level turning (the arrow keys spun the view on steep parts),
  side panel for Pause/Music/Zoom, Deep Drift = home (no Restart), animals at new depths each dive within their real range.
- Hasib's words can be ambiguous: for "the view goes circular when paused" I asked with options; his answer was about the
  arrow keys on a steep part of the route. Ask when a fix depends on the meaning.

## Hasib's machine (for real measurements)
- Laptop with Intel UHD graphics, screen 1536x864 at 125% (devicePixelRatio 1.25).
- Real-GPU test: `python tests/startup.py 10 --gpu --screen=1536x790@1.25 --freeze=60`.
  Playwright Chromium with `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` uses the real GPU even headless.
- On it the reef costs about 47 ms per picture at full sharpness; the benchmark picks about 0.86 to 1.0.
- Memory is sometimes low: background servers can be killed by the system. Do not restart them unasked.

## Rules I must keep
- Never em dashes. Plain language. Many small files by job. Feature branch, test, merge --no-ff, annotated tag.
- After every fix: report PDF + these notes + tracking PDF rows + version bump (package.json).
- Real models only with Hasib's OK per licence and a credit.
- Bash heredocs eat backslashes in Python strings: write patch scripts with the Write tool. My inserted `// comments`
  have twice swallowed the rest of a line (davits in ship.js, camera sway): put comments on their own line when inserting mid-line.
- Python `write_text` on Windows writes CRLF; use `write_bytes(s.encode())` (git normalises anyway via .gitattributes).

## How things work (the parts that are easy to forget)
- Two clocks: `state.t` dive time (stops on pause), `state.life` sea time. Animals get `a.update(state.t + a.lag)`; `a.lag`
  grows while paused (cyclic animals and schools always; others only after Begin). Restart resets lags and reshuffles.
- Variety: `vary(roll)` + `reshuffle()` (life/variety.js). passBy tries random versions, then fallbacks (mirror, nearer,
  reversed, angled). `clearPath` checks `inRock(p, 0.5)` every 1 s within 50 m of the dive path; no clear path -> absent.
- Never hide or add a light after loading (shader rebuild freeze). Lure light stays at intensity 0.
- Sharpness: benchmark.js before Begin; quality.js during the dive, called before step() so a resize never blinks.
- Tests with software GL are slow; use `window.__noRender` for simulation tests (solid.py, life.py).
- solid.py judges a hidden animal by where it is now plus its dodge offset (a.react.off), and measures its size unturned
  (a box around a turned body is too big). Bodiless caption spots (pseudo) are skipped.
- Reef collision: the shelf lip stops the diver from the side (SHELF_EDGE); only small lifts onto the shelf. Big lifts were jumps.
- Heavy animals (whales, whale shark, manta) push the diver gently within CUSHION (0.6 m) before contact.
- Animals stay in the water: CEILING (-1) in motion.js, and clamps in passers.js and school.js. Test depths by the animal's
  own depth (depthAt of its y), never by the diver's: in the deep 1 world m is 20 real m.

## Open questions and ideas
- Reef is still the heaviest part. Idea: low-poly coral versions for far tiles (a second InstancedMesh per tile).
- Animals do not avoid corals. Could reuse the solids grid for animals in v1.5.
- Phone never tested. Gyro and touch glide untested.
- Pale animals under the torch (tone mapping).

## Next (agreed plan)
- v1.6: animal behaviour (curious and startled fish, predators chasing schools, hidden animals, light displays,
  feeding at vents and the whale fall, animals steering around corals).
- v1.7+: real models from Sketchfab in small batches. Publish on GitHub Pages after local testing.

## History in one line each
- v1.0 saved; v1.1 realism; v1.2 one continuous dive, glide swim; v1.3 solid world, no pops, faster opening;
  v1.4 smooth start on laptop graphics, living pause, new dive every time, smooth keys, realistic school swimming;
  v1.5 zoom up and back down, level turning, side panel, Deep Drift home button, animals at new depths each dive.
