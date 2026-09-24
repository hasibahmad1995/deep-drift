# Deep Drift

A first-person 3D dive from the sunlit surface to the deepest ocean trench. It ships as one HTML file (`dist/index.html`).
The 3D engine is three.js r128, loaded from the jsDelivr network. There are no other files to host.

## Quick start

```
python3 build.py                 # writes dist/index.html from src/ and assets/
python3 -m http.server 8080 --directory dist     # then open http://localhost:8080
```

To host it, upload `dist/index.html` (rename not needed) to Netlify Drop, GitHub Pages or any static host.

## Folder map

| Path | What it is |
|---|---|
| `src/head.html` | Page shell: CSS, buttons, panels (menu sheet, blog, credits), script tags for three.js |
| `src/core.js` | Settings, renderer, underwater light and fog, sky dome, surface, sun rays, drifting specks, shape-building tools |
| `src/life.js` | Animals (built from code), the real CC0 fish loader, schools, turtle, jellyfish, touch settings |
| `src/world.js` | Places: reef wall and corals, vents, wreck, trench, boat, whale skeleton, collision maps |
| `src/posts.js` | The 7 blog posts (edit this file to change the blog) |
| `src/run.js` | Dive path, animals' routes, touch and passers, camera and controls, mask and hose, sound, main loop |
| `assets/barra_geo.glb`, `barra_tex.json` | The barramundi model: shape, and 3 texture pictures as data URIs |
| (original model) | Not included (12.5 MB). Download BarramundiFish.glb from the Khronos link in Credits if you need to redo `tools/` |
| `tools/` | Node scripts used to shrink and split the fish model |
| `tests/` | Playwright screenshot and behaviour checks (run after `npm install` and `pip install playwright`) |

`build.py` joins the files in this order: head.html, fish data, core, life, world, posts, run. Order matters because the scripts share top-level names.

## Credits

Barramundi fish: "BarramundiFish" by Microsoft, CC0. From the Khronos glTF-Sample-Models collection
(https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/BarramundiFish). Textures were shrunk and converted to JPEG.
Everything else is built by code. three.js is MIT licensed. Blog sources are linked from each post.
