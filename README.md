# Deep Drift

A first-person 3D dive from the sunlit surface to the floor of the Challenger Deep (10,935 m), in the browser: one continuous descent of about 7 minutes. You drift toward wherever you look, always sinking.
Built with three.js (included in `vendor/three`). The site loads nothing from other websites.

## Run it on your computer

```
node tools/serve.mjs          # or: npm start
```
Then open http://localhost:8080. Edit any file in `src/` and reload the page to see the change.

## Make the folder to publish

```
python tools/build.py         # or: npm run build
```
This writes `dist/` with only the files a visitor needs. Upload that folder to any static host (for example GitHub Pages).

## Folder map

| Path | What it is |
|---|---|
| `index.html`, `styles/` | Page shell (buttons, panels, blog, credits) and the CSS |
| `src/main.js` | Starts everything and runs the frame loop |
| `src/config.js` | Easy settings, water colour per depth |
| `src/engine/` | Renderer, lights, underwater materials, sky and surface, drifting specks |
| `src/dive/` | Dive state, real depth vs world height, the route and the parts of the dive |
| `src/world/` | The one continuous world: its plan (`sites.js`), the sea floor, reef, vents, shipwreck, trench and sea-floor life; what is solid (`solids.js`); drawing only what can be seen (`tiles.js`, `culling.js`) |
| `src/life/` | The animals: recipes, schools, the real barramundi, touching, who appears where |
| `src/diver/` | Looking around, the gliding swim, camera, collisions, breathing bubbles |
| `src/ui/` | Mask and hose, depth meter, menus, blog and credits panels |
| `src/audio/`, `src/content/` | The live soundtrack; facts and blog posts |
| `vendor/three/` | three.js (MIT licence), copied by `tools/vendor_three.py` |
| `assets/` | The barramundi model and its pictures; the fonts (SIL Open Font License) |
| `tools/` | Local server, build, vendoring; `fish-model/` holds the Node scripts used once to shrink the fish model |
| `tests/` | Playwright screenshot and behaviour checks |
| `docs/` | The git tracking guide (PDF), a report after every fix (`docs/reports/`), Claude's notes (`claude-notes.md`), and the scripts that make the PDFs |

## Tests

```
python -m pip install playwright pillow
python -m playwright install chromium
python tests/shot.py 3 30 90      # screenshots at those dive times, into tests/out/
python tests/ui.py                # phone and desktop menus
python tests/live.py              # live play: pause, restart, music
python tests/glide.py             # the gliding swim: steering, never rising, the roaming limit
python tests/solid.py             # nothing passes through the diver, nothing pops in or out, no jumps
python tests/startup.py           # how fast the page opens, freezes, shaders built too late (--gpu: real graphics card)
python tests/life.py              # pause keeps the sea moving, a new dive each time, smooth keys, school surges
```

## Credits

Barramundi fish: "BarramundiFish" by Microsoft, CC0. From the Khronos glTF-Sample-Models collection
(https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/BarramundiFish). Textures were shrunk and converted to JPEG.
Fonts: Fraunces and Figtree, SIL Open Font License 1.1 (licences in `assets/fonts/`).
Everything else is built by code. three.js is MIT licensed. Blog sources are linked from each post.
