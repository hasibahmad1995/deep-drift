# Notes for Claude Code

## What this is
A web app: a realistic-style first-person dive from the surface to the deepest trench, in three.js (ES modules, no bundler).
The user is Hasib. Keep writing plain and simple, and **never use em dashes** in any text you write (code comments, page text, messages).
Prefer plain language over jargon. If you write study notes as .md, also make a matching .pdf.

## How Hasib wants the code kept
- **Never put everything in one file.** One job per module, in the folder for its area (see the map below). Refactor when a file grows or mixes jobs.
- **Locally testable first**, then ship like a real SDLC: work on a feature branch, test, merge to `main`, tag the version.
- The site loads nothing from other websites (three.js, the fonts and the fish model are all included). Keep it that way.

## Run and test locally
- Run: `node tools/serve.mjs` (or `npm start`), then open http://localhost:8080. No build step is needed to test.
- Publish folder: `python tools/build.py` copies only the site files into `dist/` (ignored by git). Never edit `dist/` by hand.
- three.js lives in `vendor/three/` (copied by `python tools/vendor_three.py` from `node_modules/three`; add-on imports are rewritten to relative paths, so no import map or inline script is needed). The full `npm install` fails on Windows (sharp, only used by the old fish tools), so fetch three alone (currently 0.186.1): `cd node_modules && npm pack three@<version> && tar -xzf three-<version>.tgz && mv package three`.
- Tests: `python -m pip install playwright pillow && python -m playwright install chromium`, then
  `python tests/shot.py 3 30 90` (stills at those dive times into `tests/out/`), `python tests/ui.py` (phone and desktop menus), `python tests/live.py` (live play),
  `python tests/glide.py` (the swim), `python tests/solid.py` (nothing passes through the diver, no pops, no jumps; runs the whole dive without drawing via `window.__noRender`),
  `python tests/startup.py` (opening time, freezes, shaders built after the warm-up; add `--gpu --screen=1536x790@1.25` to use this laptop's real graphics card at Hasib's screen size),
  `python tests/life.py` (pause keeps the sea moving, a different dive each time with no path through rock, smooth arrow keys, school surges),
  `python tests/controls.py` (zoom steps up and back down, level turning, the side panel, the home button, animals only at their depths).
  The tests serve the project from a made-up https address with a strict page policy (only the site's own files may run or load). Keep it strict.
- Software WebGL is slow. The tests use `?still` and `window.__hold` so the page stops its own loop and you call `step(0.03)` yourself.
- Handy in the page console (set up by `src/debug.js`): `state.t = 120` jumps in time, `step(0.03)` draws a frame, `look`, `swim`, `ACTORS`, `groups`, `pathAt(t)`, `display.pixelRatio`,
  `SOLIDS`, `constrain(p)`, `PASSERS`, `inSight(p, r)`, `STARTUP` (how long each loading step took).

## After every fix (Hasib's rule since v1.4)
- Make a PDF report: what is on the website now, what changed, what to do next. `python docs/make_report.py` writes `docs/reports/report-vX.Y.pdf` from the `REPORT` entry in that script.
- Update `docs/claude-notes.md` (Claude's own notes: state, decisions, gotchas, next steps). Read it at the start of a session.
- Bump the version in `package.json` and update the tracking PDF (below).

## Versions and git
- Branch `main` holds released versions, tagged `v1.0`, `v1.1`, ... Each new version is built on a branch like `feature/v1.2-continuous-dive`, then merged and tagged. Docs and test-only commits get no version number.
- After commits, add an entry to `COMMITS` in `docs/make_git_tracking.py`, run `python docs/make_git_tracking.py`, and commit the new `docs/git-tracking.pdf`. Hasib uses that PDF to track versions.
- `backup/deep-drift-v1.0.html` is a plain copy of the v1.0 page. Do not edit it.

## Where things are
| Folder | What is in it |
|---|---|
| `index.html`, `styles/` | Page shell (buttons, panels) and CSS. `styles/fonts.css` loads the included fonts. |
| `src/main.js` | Starts everything; the frame loop `step(dt)`; window resize. |
| `src/config.js` | Easy settings and the water colour and light absorption per depth (`ENV`). |
| `src/engine/` | Renderer, scene and camera; lights; `wet()` underwater materials; environment per depth; sky, surface and sun rays; drifting specks and backscatter; `warmup.js` (shaders ready before Begin); `quality.js` (pixel count adapts to speed). |
| `src/dive/` | `state` and `clock`; `depth.js` (real depth to world height); `route.js` (the parts of the dive `LEGS`, `tu`, `pathAt(t)`: where the current carries you). |
| `src/world/` | `sites.js` (the plan: floor profile, vents, wreck, trench), `terrain.js` (the one continuous sea floor `seafloorY`), reef and corals, boat, vents, ship and wreck, trench, sea-floor life (`benthos.js`), floors and effects; `layout.js` (`groups`, `addPlace`); `solids.js` (what the diver cannot pass through); `tiles.js` and `culling.js` (draw only what can be seen). |
| `src/life/` | Animals: recipes (`species.js`, `species-deep.js`), builder (`creature.js`), skins, schools, turtle, jellyfish, the real barramundi, touch reactions, motion helpers, the main cast (`cast.js`, `cast-deep.js`), extras, random passers (by real depth range). |
| `src/diver/` | Input (look, gyro), `glide.js` (how you move), camera, collision with rock (`groundAt`), breathing bubbles. |
| `src/ui/` | Mask and hose drawing, depth meter and zone/place names, touch feedback, pause and restart, menus, blog and credits. |
| `src/audio/`, `src/content/` | The live soundtrack; facts, the ocean's depth zones (`zoneName`) and blog posts. |
| `src/lib/` | Thin wrappers that point to `vendor/three`. |
| `assets/` | The barramundi model and pictures; the fonts (with their OFL licences). |
| `tools/`, `tests/`, `docs/` | Local server, build and vendoring tools; tests; the git tracking guide. |

## Architecture in one minute
- **One continuous world (v1.2):** the dive goes down the side of a volcanic island along +x: reef (x < -20), the island cliff, the vent terrace (~1,600 m), the volcano slope, the abyssal plain with the wreck (~5,000 m), then the trench (x 558 to 652) down to 10,935 m. `sites.js` holds the plan, `terrain.js` builds the floor as a height map in chunks, the reef wall and trench walls are separate meshes (too steep for a height map). No fades except at the very start and end.
- **Depth:** `depth.js` squeezes the deep ocean (1 world m per real m near the surface, 0.05 below 4,000 m) so the dive fits in about 7 minutes. The meter shows real depth from where you actually are (`state.D`).
- **Route:** `route.js` `pathAt(t)`: the reef part keeps its hand-made motion (first 80 s), then a smooth curve through `KEYS`, each placed at a depth (open water) or a height above the floor (near the bottom), with a suggested look direction. `LEGS` name the parts (reef, drop-off, twilight, midnight, vents, slope, plain, trench, deep) for captions and timing (`tu(leg, u)`).
- **Swimming (glide.js):** no swim button. The current carries you along the route; you swim slowly (1.3 m/s) toward where you look; looking up slows sinking (max 18 m behind the route), looking down sinks faster; you never rise except when the floor lifts you; beyond a per-leg roaming distance a gentle current brings you back. `tests/glide.py` checks all of this.
- **Look:** camera yaw = route heading + `look.yaw` (always around the true vertical, horizon level), pitch = route pitch + `look.pitch`, then optional phone gyro (v1.5; before, turning happened around the route's tilted axis and spun the view on steep parts). Arrow keys turn smoothly (`updateKeys` in input.js: speeds up to 1.3 rad/s, eases to a stop). `constrain()` (collision.js) keeps you out of the reef, floor, trench walls, vent chimneys and the ship.
- **Two clocks (v1.4):** `state.t` is the dive time (it stops when paused: the diver hovers); `state.life` is the sea's own time (runs once started). Each animal has `a.lag`, how far its own clock runs ahead of the dive time: it grows while paused (always for `cyclic` animals and schools, for the others once the dive has begun). Main loop calls `a.update(state.t + a.lag)`. Restart resets every lag. Passers are timed by `state.life`, so visitors keep coming while you hover.
- **Variety (v1.4, v1.5):** `variety.js`: `vary(roll)` registers a function that picks this dive's version of an animal; `reshuffle()` runs them all at Begin; `dice()` shares one roll (the dolphin pod). `passBy` picks the meeting moment anywhere the dive is inside the animal's depths (`LIVES` in life/depths.js, shared with the passers; animals that sink with you need their whole stay inside), and varies side, distance, speed and presence (80%). `view()` returns vectors that remember their ahead/right/up parts (`fsu`) so passBy can rebuild them at another moment; `orbit` and circling schools vary start and direction; jellyfish vary their spot. Every version's path is checked with `clearPath` (motion.js) against `inRock(p, gap)` (collision.js, an honest 0.5 m check for animals, unlike the diver's padded checks) while within 50 m of the dive path; if no version is clear the animal stays away that dive.
- **Water:** `wet(material, opts)` (engine/wet.js) patches any MeshStandardMaterial: per-colour fog (red fades first), caustics, rock grain, and swimming bends (modes 1 to 4). All scene materials must go through `wet()` or fog will not apply. We do our own fog before tone mapping and blank the stock `fog_fragment`.
  Options: `detail` = rock grain painted from three directions (triplanar, `GLSL_ROCK`) that also tilts the normal like real bumps (screen-space bump), `bump` = strength, `rust` = rust streaks (wreck), `strata` = rock layers (trench).
- **Light in the deep:** deep water in `ENV` is clear (low absorption); it is dark only because no light reaches it. The diver carries `torch` (spot) and `lamp` (soft point light, like submersible work lights). Lights are physically based (three.js r186); torch and lamp use decay 1 (gentler than real inverse-square) and intensities carry a factor PI. A strong torch still washes out pale animals close up; keep pale animals not pure white. Our fog uses `U.water` (linear), never three.js `fogColor` (that one is already converted for the screen).
- **Only what can be seen is drawn (v1.3):** `culling.js` hides places, floor chunks and tiles once they have fully faded into the water (5 / absorption, up to 300 m; anything with `userData.cull`, with 15 m of slack so nothing flickers).
  Many copies of one thing (corals, sea-floor life, rocks, tube worms) are split into tiles by `addTiled` (tiles.js), so tiles behind you or far away are skipped. Small corals also shrink away smoothly with distance (`wet()` option `shrink`) and their tiles get a shorter `far` limit.
- **Opening (v1.3, v1.4):** `runSteps` (util/steps.js) builds the world in steps with a progress message and draws nothing meanwhile; `warmUp` (engine/warmup.js) builds every shader and copies every shape to the graphics card (a few parts per frame) before Begin; `chooseSharpness` (engine/benchmark.js) draws the reef view a few times and sets the pixel ratio for about 30 ms per picture. `quality.js` then changes it only after about a second of slow pictures, and before drawing (a change clears the canvas). No antialias on screens scaled 125% or more (renderer.js). Begin fades the intro card; the black fade is only for restarts and the end.
  Rule: never hide a light or add one later (the light count is built into every shader, so three.js would rebuild them all: a freeze). Switch a light off with intensity 0 (see the anglerfish lure in cast.js). `tests/startup.py` lists any shader built too late.
- **Solid world (v1.3):** `solids.js` keeps balls and pills (lines with a thickness) in an 8 m grid. Builders add them: `addSolidsFor(instancedMesh, thick)` for corals and sea-floor life (thickness from the shape's `userData.thick`), `addBall` for rocks, `addGrowth` for clumps, `addSolid` for wreck parts and bones. `constrain()` pushes the diver (a 0.45 m ball, `BODY`) out of them; the wreck hull has its own shaped check.
- **Backscatter:** a dense 12 m cloud of tiny specks around the camera (`backscatter` in particles.js) lights up only inside the torch cone, like real deep-sea footage.
- **Fog colour:** fully fogged rock fades to the same colours as the background (`U.waterUp`/`U.waterDown`, by view direction), so far shapes have no outline.
- **Animals:** `buildCreature(spec)` (life/creature.js, rings + flat fins + painted skin). `SPECIES` holds the recipes. The real fish model loads via `loadBarramundi` (fetches `assets/`).
  Tail beats follow Bainbridge (1958): each beat moves a fish about 0.7 of its length, so small schooling fish use `SMALL_FISH_SWIM` (small-shapes.js, about 8 beats a second). Circling schools surge (`SURGE` in school.js) and each fish faces its real movement (`fishAt`).
- **Touch and giving way (v1.3):** `TOUCH.point` is a small ball in front of the mask (touching gives a jolt and a caption). Animals sense the diver's whole body: `reactActor` (life/touch.js) uses the `HIT` table (length, thickness, `shy` distance, `heavy`).
  Too close: the animal speeds up smoothly and swims aside. Still touching: a light animal is pushed aside, a heavy one (whales, whale shark, manta) pushes the diver (`shoveDiver`, glide.js). School fish keep about 1.4 m away and part around the diver.
- **Passers:** `initPassers` and `spawnPasser` send random animals and schools past the diver every 5 to 11 seconds, each kind only within its real depth range (`minD`, `maxD`, optional `near`).
  No pops (v1.3): each starts out of sight (`inSight`: off screen, or faded), crosses, and leaves only once out of sight again; its path is checked against rock (`inRock`).
  `passBy(..., follow)` makes a scripted animal sink with the diver around the meeting and then ease to a stop (the anglerfish and trench snailfish), because in the deep the camera sinks about 12 m/s and a still animal flashes past.
  Animals more than 300 m away are hidden and moved on only twice a second.
- **Mask and hose:** 2D canvases (`#mask`, `#hose`) drawn in ui/mask.js.
- **Controls (v1.5):** Pause/Play, Music and Zoom sit in a side panel on the left edge (`#dock`, ui/dock.js), hidden until hovered (CSS) or opened by its handle on touch screens. Zoom (diver/zoom.js): a press steps 1x to 2.5x and back down (ping-pong), holding zooms smoothly; `U.zoom` keeps small corals drawn farther out when zoomed. "Deep Drift" at the top is the home button (`goHome` in ui/playback.js): back to the start screen; Begin (`beginDive`) rolls a new dive. There is no Restart button; the end of the dive also goes home. The top row (Recenter view, Motion look, Blog, Credits) goes into the bottom sheet behind a Menu button on phones and tablets (ui/panels.js).

## Known weak spots (good next tasks)
1. Animal behaviour (planned for v1.6): curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, flounder, scorpionfish, garden eels), deep-sea light displays, feeding at vents and the whale fall.
2. Animals right in front of the torch look paler than they should (tone mapping of strong light); deep scenes are lit only by torch and lamp, so rock far from the route is dark.
3. The reef wall still turns teal beyond ~10 m; the deckhouse of the wreck is plain boxes; glass sponges look like plain white cones.
4. Performance on phones is untested. `DETAIL` (engine/device.js) halves counts on small screens; pixel ratio adapts automatically. The tests' 900x540 window counts as a small screen.
   On Hasib's laptop (Intel UHD) the reef needs a pixel ratio of about 0.86 to 1.0 for 30 pictures a second, so the picture is a little soft there. The reef (corals and rock shading) is still the most expensive part.
5. Motion look (phone gyro) and the look-to-swim glide were never tested on a real device.
6. Solids are simple balls and pills, so the diver stops a little before thin, airy shapes (fans, branches). Animals are kept off rock and the floor, but not off corals; beyond 50 m from the dive path a straight-swimming animal may still meet rock (hidden by water and the rock itself).
7. Only one real 3D asset (the CC0 barramundi). Real models are planned (v1.7+, Sketchfab, with Hasib's OK on each licence and a credit).

## Rules kept from the user
- Be honest in the page: say what is real (the barramundi model) and what is built by code, that the places are moved closer together, and that the descent is sped up. Do not show "something is missing" messages to visitors; fall back quietly.
- Blog posts are written in our own words with a source link. Sources were only skimmed, so re-read them before promoting the site.
- Reduced motion: the dive starts paused, at half speed, without camera bob or hose sway.
- Keep the credits card readable (solid, blurred glass) and phone controls tidy (one Menu button).
