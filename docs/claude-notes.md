# Claude's notes for Deep Drift

My own reference, updated after every fix (Hasib's rule since v1.4). Read this, then CLAUDE.md, at the start of a session.
Plain words, no em dashes. Newest state at the top.

## State now (v1.4, 25 Sep 2026)
- `main` is tagged v1.4. Branches kept: `feature/v1.2-continuous-dive`, `feature/v1.3-solid-and-smooth`, `feature/v1.4-feel`.
- Reports: `docs/reports/report-v1.4.pdf` (made by `docs/make_report.py`, entry `REPORTS["v1.4"]`, site overview in `SITE`).
- Tracking guide: `docs/git-tracking.pdf` (made by `docs/make_git_tracking.py`). Both use `docs/pdf_tools.py`.
- Hasib has not yet tried v1.4. v1.3 feedback led to v1.4 (start blink and lag, keyboard, variety, pause, school speed).

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
- solid.py judges a hidden animal by where it is now plus its dodge offset (a.react.off), not the last frame.

## Open questions and ideas
- Reef is still the heaviest part. Idea: low-poly coral versions for far tiles (a second InstancedMesh per tile).
- Animals do not avoid corals. Could reuse the solids grid for animals in v1.5.
- Phone never tested. Gyro and touch glide untested.
- Pale animals under the torch (tone mapping).

## Next (agreed plan)
- v1.5: animal behaviour (curious and startled fish, predators chasing schools, hidden animals, light displays,
  feeding at vents and the whale fall, animals steering around corals).
- v1.6+: real models from Sketchfab in small batches. Publish on GitHub Pages after local testing.

## History in one line each
- v1.0 saved; v1.1 realism; v1.2 one continuous dive, glide swim; v1.3 solid world, no pops, faster opening;
  v1.4 smooth start on laptop graphics, living pause, new dive every time, smooth keys, realistic school swimming.
