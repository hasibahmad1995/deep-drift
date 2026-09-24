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
| `src/config.js` | Easy settings, the parts of the dive (`STAGES`), water colour and light absorption per depth (`ENV`). |
| `src/engine/` | Renderer, scene and camera; lights; `wet()` underwater materials; environment per depth; sky, surface and sun rays; drifting specks. |
| `src/dive/` | `state` and `clock`; timeline (`TOTAL`, `tu`, `worldY`); `pathAt(t)` (where the diver is). |
| `src/world/` | The places: reef and corals, boat, vents, ship and wreck, trench, floors, effects; `layout.js` holds `groups` and where each place sits. |
| `src/life/` | Animals: recipes (`species.js`), builder (`creature.js`), skins, schools, turtle, jellyfish, the real barramundi, touch reactions, motion helpers, the main cast, extras, random passers. |
| `src/diver/` | Input (look, swim, gyro), camera and swimming, collision with rock, breathing bubbles. |
| `src/ui/` | Mask and hose drawing, depth meter and captions, touch feedback, pause and restart, menus, blog and credits. |
| `src/audio/`, `src/content/` | The live soundtrack; facts, zone names and blog posts. |
| `src/lib/` | Thin wrappers that point to `vendor/three`. |
| `assets/` | The barramundi model and pictures; the fonts (with their OFL licences). |
| `tools/`, `tests/`, `docs/` | Local server, build and vendoring tools; tests; the git tracking guide. |

## Architecture in one minute
- **Timeline:** `STAGES` (config.js) lists 6 places and their length. `pathAt(t)` (dive/path.js) gives camera position, forward direction and depth D (metres).
  Reef, open ocean and midnight share one world (origin 0). Vents, wreck and trench each live at `STAGE_ORIGIN(i)` (3000 m apart in z) and the page fades to black between them. (v1.2 replaces this with one continuous world.)
- **Look and swim:** camera = path direction * your drag (`look`, unlimited yaw) * optional phone gyro. `updateSwim` lets you swim off the path within a leash that shrinks with visibility, and `constrain()` keeps you out of rock.
- **Water:** `wet(material, opts)` (engine/wet.js) patches any MeshStandardMaterial: per-colour fog (red fades first), caustics, rock grain, and swimming bends (modes 1 to 4). All scene materials must go through `wet()` or fog will not apply. We do our own fog before tone mapping and blank the stock `fog_fragment`.
  Options: `detail` = rock grain painted from three directions (triplanar, `GLSL_ROCK`) that also tilts the normal like real bumps (screen-space bump), `bump` = strength, `rust` = rust streaks (wreck), `strata` = rock layers (trench).
- **Light in the deep:** deep water in `ENV` is clear (low absorption); it is dark only because no light reaches it. The diver carries `torch` (spot) and `lamp` (soft point light, like submersible work lights). Lights are physically based (three.js r186); torch and lamp use decay 1 (gentler than real inverse-square) and intensities carry a factor PI. A strong torch still washes out pale animals close up; keep pale animals not pure white. Our fog uses `U.water` (linear), never three.js `fogColor` (that one is already converted for the screen).
- **Only the current place is drawn:** `step()` hides the reef, vents, wreck and trench groups you are not in.
- **Animals:** `buildCreature(spec)` (life/creature.js, rings + flat fins + painted skin). `SPECIES` holds the recipes. The real fish model loads via `loadBarramundi` (fetches `assets/`).
- **Touch:** `TOUCH.point` is a small ball in front of the mask. `School.update` makes touched fish dart away; `reactActor` does it for single animals using the `HIT` table (life/touch.js).
- **Passers:** `initPassers` and `spawnPasser` send random animals and schools past the diver every 5 to 11 seconds.
  `passBy(..., follow)` makes a scripted animal sink with the diver for 10 s around the meeting (the anglerfish and trench snailfish), because in the deep the camera sinks about 12 m/s and a still animal flashes past.
- **Mask and hose:** 2D canvases (`#mask`, `#hose`) drawn in ui/mask.js.
- **Controls:** desktop shows a button row; phones and tablets (`pointer: coarse` or width under 900) move the row into a bottom sheet opened by a Menu button (ui/panels.js).

## Known weak spots (good next tasks)
1. Reef wall: has relief, cracks, ledges, bumpy triplanar rock and corals on the wall, but the water still makes it teal at 10 m and beyond. Soft corals are the heaviest part of the reef to draw.
2. Wreck and trench: the deckhouse is still plain boxes. Trench rock layers are subtle, and the trench walls are a smooth height field (no overhangs).
3. Deep animals: anglerfish teeth are too small to notice; pale animals right in front of the torch are still bright.
4. Performance on phones is untested. `DETAIL` (engine/device.js) halves coral and fish counts on small screens; pixel ratio adapts automatically.
   The tests' 900x540 window counts as a small screen. v1.1 at 1300x800: reef about 4.2 million triangles per frame, deep places about 1 million.
5. Motion look (phone gyro) and press-and-hold swimming were never tested on a real device.
6. Corals are not solid: the diver is kept 3 m off the reef wall but can clip a tall coral crown.
7. Only one real 3D asset (the CC0 barramundi). Everything else is procedural, so it is stylised, not photographic. Any new real asset must have a clear free licence and be credited in the Credits panel.

## Rules kept from the user
- Be honest in the page: say what is real (the barramundi model) and what is built by code. Do not show "something is missing" messages to visitors; fall back quietly.
- Blog posts are written in our own words with a source link. Sources were only skimmed, so re-read them before promoting the site.
- Reduced motion: the dive starts paused, at half speed, without camera bob or hose sway.
- Keep the credits card readable (solid, blurred glass) and phone controls tidy (one Menu button).
