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
  `python tests/shot.py 3 30 90` (stills at those dive times into `tests/out/`), `python tests/ui.py` (phone and desktop menus), `python tests/live.py` (live play).
  The tests serve the project from a made-up https address with a strict page policy (only the site's own files may run or load). Keep it strict.
- Software WebGL is slow. The tests use `?still` and `window.__hold` so the page stops its own loop and you call `step(0.03)` yourself.
- Handy in the page console (set up by `src/debug.js`): `state.t = 120` jumps in time, `step(0.03)` draws a frame, `look`, `swim`, `ACTORS`, `groups`, `pathAt(t)`, `display.pixelRatio`.

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
| `src/engine/` | Renderer, scene and camera; lights; `wet()` underwater materials; environment per depth; sky, surface and sun rays; drifting specks and backscatter. |
| `src/dive/` | `state` and `clock`; `depth.js` (real depth to world height); `route.js` (the parts of the dive `LEGS`, `tu`, `pathAt(t)`: where the current carries you). |
| `src/world/` | `sites.js` (the plan: floor profile, vents, wreck, trench), `terrain.js` (the one continuous sea floor `seafloorY`), reef and corals, boat, vents, ship and wreck, trench, sea-floor life (`benthos.js`), floors and effects; `layout.js` (`groups`, `addPlace`); `culling.js` (skip far parts). |
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
- **Look:** camera = route direction * your drag (`look`, unlimited yaw) * optional phone gyro. `constrain()` (collision.js) keeps you out of the reef, floor, trench walls, vent chimneys and the ship.
- **Water:** `wet(material, opts)` (engine/wet.js) patches any MeshStandardMaterial: per-colour fog (red fades first), caustics, rock grain, and swimming bends (modes 1 to 4). All scene materials must go through `wet()` or fog will not apply. We do our own fog before tone mapping and blank the stock `fog_fragment`.
  Options: `detail` = rock grain painted from three directions (triplanar, `GLSL_ROCK`) that also tilts the normal like real bumps (screen-space bump), `bump` = strength, `rust` = rust streaks (wreck), `strata` = rock layers (trench).
- **Light in the deep:** deep water in `ENV` is clear (low absorption); it is dark only because no light reaches it. The diver carries `torch` (spot) and `lamp` (soft point light, like submersible work lights). Lights are physically based (three.js r186); torch and lamp use decay 1 (gentler than real inverse-square) and intensities carry a factor PI. A strong torch still washes out pale animals close up; keep pale animals not pure white. Our fog uses `U.water` (linear), never three.js `fogColor` (that one is already converted for the screen).
- **Only nearby parts are drawn:** `culling.js` hides places and floor chunks more than ~260 m away (anything with `userData.cull`).
- **Backscatter:** a dense 12 m cloud of tiny specks around the camera (`backscatter` in particles.js) lights up only inside the torch cone, like real deep-sea footage.
- **Fog colour:** fully fogged rock fades to the same colours as the background (`U.waterUp`/`U.waterDown`, by view direction), so far shapes have no outline.
- **Animals:** `buildCreature(spec)` (life/creature.js, rings + flat fins + painted skin). `SPECIES` holds the recipes. The real fish model loads via `loadBarramundi` (fetches `assets/`).
- **Touch:** `TOUCH.point` is a small ball in front of the mask. `School.update` makes touched fish dart away; `reactActor` does it for single animals using the `HIT` table (life/touch.js).
- **Passers:** `initPassers` and `spawnPasser` send random animals and schools past the diver every 5 to 11 seconds, each kind only within its real depth range (`minD`, `maxD`, optional `near`).
  `passBy(..., follow)` makes a scripted animal sink with the diver for 10 s around the meeting (the anglerfish and trench snailfish), because in the deep the camera sinks about 12 m/s and a still animal flashes past.
- **Mask and hose:** 2D canvases (`#mask`, `#hose`) drawn in ui/mask.js.
- **Controls:** desktop shows a button row; phones and tablets (`pointer: coarse` or width under 900) move the row into a bottom sheet opened by a Menu button (ui/panels.js).

## Known weak spots (good next tasks)
1. Animal behaviour (planned for v1.3): curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, flounder, scorpionfish, garden eels), deep-sea light displays, feeding at vents and the whale fall.
2. Animals right in front of the torch look paler than they should (tone mapping of strong light); deep scenes are lit only by torch and lamp, so rock far from the route is dark.
3. The reef wall still turns teal beyond ~10 m; the deckhouse of the wreck is plain boxes; glass sponges look like plain white cones.
4. Performance on phones is untested. `DETAIL` (engine/device.js) halves counts on small screens; pixel ratio adapts automatically. The tests' 900x540 window counts as a small screen.
5. Motion look (phone gyro) and the look-to-swim glide were never tested on a real device.
6. Corals are not solid: the diver is kept off the reef wall but can clip a tall coral crown.
7. Only one real 3D asset (the CC0 barramundi). Real models are planned (v1.4+, Sketchfab, with Hasib's OK on each licence and a credit).

## Rules kept from the user
- Be honest in the page: say what is real (the barramundi model) and what is built by code, that the places are moved closer together, and that the descent is sped up. Do not show "something is missing" messages to visitors; fall back quietly.
- Blog posts are written in our own words with a source link. Sources were only skimmed, so re-read them before promoting the site.
- Reduced motion: the dive starts paused, at half speed, without camera bob or hose sway.
- Keep the credits card readable (solid, blurred glass) and phone controls tidy (one Menu button).
