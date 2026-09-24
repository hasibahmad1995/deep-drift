# Notes for Claude Code

## What this is
Single-file web app: a realistic-style first-person scuba dive in three.js r128 (global `THREE`, no modules, no bundler).
The user is Hasib. Keep writing plain and simple, and **never use em dashes** in any text you write (code comments, page text, messages).
Prefer plain language over jargon. If you write study notes as .md, also make a matching .pdf.

## Build and test
- `python build.py` then open `dist/index.html`. Never edit `dist/index.html` by hand.
- Tests need three.js in `node_modules/three` and Playwright. The full `npm install` fails on Windows (sharp, only used by `tools/`), so fetch three alone:
  `cd node_modules && npm pack three@0.128.0 && tar -xzf three-0.128.0.tgz && mv package three`. Then `python -m pip install playwright pillow && python -m playwright install chromium`.
  `python tests/shot.py 3 30 90` takes stills at those dive times (seconds) into `tests/out/dd_shot_N.png` (ignored by git). The page is served from a
  made-up https address so a strict page policy really applies (script only from jsDelivr, images only data:, no connect), like the claude.ai artifact host. Keep it that way.
- Software WebGL is slow. The tests use `?still` and `window.__hold` so the page stops its own loop and you call `step(0.03)` yourself.
- Handy in the page console: `state.t = 120` jumps in time, `step(0.03)` draws a frame, `look`, `swim`, `ACTORS`, `groups`, `pathAt(t)`.

## Versions and git
- The project is a git repo (branch `main`). Each finished, tested change to the dive is one commit, tagged `v1.1`, `v1.2`, ... (Hasib chose v1.0 for the starting point, tag `v1.0`). Docs and test-only commits get no version number.
- After every commit, add an entry to `COMMITS` in `docs/make_git_tracking.py`, run `python docs/make_git_tracking.py`, and commit the new `docs/git-tracking.pdf`. Hasib uses that PDF to track versions.
- `backup/deep-drift-v1.0.html` is a plain copy of the v1.0 page. Do not edit it.

## Architecture in one minute
- **Timeline:** `STAGES` (core.js) lists 6 places and their length. `pathAt(t)` (run.js) gives camera position, forward direction and depth D (metres).
  Reef, open ocean and midnight share one world (origin 0). Vents, wreck and trench each live at `STAGE_ORIGIN(i)` (3000 m apart in z) and the page fades to black between them.
- **Look and swim:** camera = path direction * your drag (`look`, unlimited yaw) * optional phone gyro. `updateSwim` lets you swim off the path within a leash that shrinks with visibility, and `constrain()` keeps you out of rock.
- **Water:** `wet(material, opts)` (core.js) patches any MeshStandardMaterial: per-colour fog (red fades first), caustics, rock grain, and swimming bends (modes 1 to 4). All scene materials must go through `wet()` or fog will not apply. r128 puts fog after colour encoding, so we do our own fog before tone mapping and blank the stock `fog_fragment`.
- **Animals:** `buildCreature(spec)` in life.js (rings + flat fins + painted skin). `SPECIES` holds the recipes. Real fish model loads via `loadBarramundi` (textures set by hand because the host blocks blob: images).
- **Touch:** `TOUCH.point` is a small ball in front of the mask. `School.update` makes touched fish dart away; `reactActor` does it for single animals using the `HIT` table (run.js).
- **Passers:** `initPassers` and `spawnPasser` send random animals and schools past the diver every 5 to 11 seconds.
- **Mask and hose:** 2D canvases (`#mask`, `#hose`) drawn in `layoutMask` and `drawHose`.
- **Controls:** desktop shows a button row; phones and tablets (`pointer: coarse` or width under 900) move the row into a bottom sheet opened by a Menu button (`layoutControls`).

## Known weak spots (good next tasks)
1. The reef wall looks hazy and flat. Ideas: real rock texture (triplanar), more geometry relief, more coral cover on the wall, stronger light on the wall.
2. Deep scenes (wreck, trench) are very dark and sparse. The wreck reads like a barrel; needs a better hull and details.
3. Tube worms look faint; snailfish, dumbo octopus and anglerfish are small and easy to miss.
4. Performance on phones is untested. `DETAIL` (core.js) halves coral and fish counts on small screens; pixel ratio adapts automatically.
5. Motion look (phone gyro) and press-and-hold swimming were never tested on a real device.
6. Corals are not solid: the diver is kept 3 m off the reef wall but can clip a tall coral crown.
7. Only one real 3D asset (the CC0 barramundi). Everything else is procedural, so it is stylised, not photographic. Any new real asset must have a clear free licence and be credited in the Credits panel.

## Rules kept from the user
- Be honest in the page: say what is real (the barramundi model) and what is built by code. Do not show "something is missing" messages to visitors; fall back quietly.
- Blog posts are written in our own words with a source link. Sources were only skimmed, so re-read them before promoting the site.
- Reduced motion: the dive starts paused, at half speed, without camera bob or hose sway.
- Keep the credits card readable (solid, blurred glass) and phone controls tidy (one Menu button).
