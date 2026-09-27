# Commit log

Every saved change (commit), newest first, and where it is: only on this computer, uploaded to GitHub, or live on the
website. Claude reads this to know what is done and where to pick up. The table is rebuilt from git by
`python tools/commit_log.py` (run it after committing and again after uploading); the notes below are written by hand.

## Where we are
- **Two small fixes after v1.5.1** (side panel swipes; nothing leaves the water, manta keeps clear) are committed and merged
  to main (see the table for whether they are uploaded).
- **v1.5.1 is uploaded and live** (26 Sep 2026): Recenter view in the side panel, a clean start screen that appears at
  once, music off on the home screen, caching for faster return visits. All commits are on GitHub.
- This file itself is saved with the next commit (a commit cannot list itself, so the newest table waits here).
- Next: v1.6, animal behaviour (see CLAUDE.md, Known weak spots), or any small change Hasib asks for.

## How to read the table
- **Uploaded:** GitHub has this commit. **no** means it is only on this computer so far.
- **Live:** it is on GitHub's `main`, which Cloudflare Pages publishes as the website.
- **Version:** the version label (tag) on that commit, if any.

<!-- TABLE START (made by tools/commit_log.py) -->
| Date | Commit | Branch | Version | What changed | Uploaded | Live |
|---|---|---|---|---|---|---|
| 27 Sep 2026 | `e9e7579` | fix/surface-light-and-start-screen |  | ui: a darker start screen so all of its text can be read | **no** | no |
| 27 Sep 2026 | `22e206d` | fix/surface-light-and-start-screen |  | feat: the water surface and sunbeams look like real water light | **no** | no |
| 27 Sep 2026 | `0de4d1b` | fix/surface-light-and-start-screen |  | fix: bubbles slow down and dissolve under the surface instead of popping | **no** | no |
| 26 Sep 2026 | `2153ae5` | main |  | docs: track the side panel and surface fixes | yes | yes |
| 26 Sep 2026 | `b233511` | main |  | fix: nothing leaves the water; jellyfish hang in place; the manta keeps clear of the diver | yes | yes |
| 26 Sep 2026 | `f376666` | main |  | fix: the closed side panel no longer blocks swipes, and touch opens and closes it properly | yes | yes |
| 26 Sep 2026 | `7c1a59a` | main |  | docs: update the tracking guide and commit log for v1.5.1 | yes | yes |
| 26 Sep 2026 | `1a9359f` | main | v1.5.1 | v1.5.1: a clean start screen, Recenter view in the side panel, a quiet home screen | yes | yes |
| 26 Sep 2026 | `1acbe68` | feature/start-screen |  | release: set the version to 1.5.1 | yes | yes |
| 26 Sep 2026 | `931c81c` | feature/start-screen |  | docs: describe v1.5.1 and add a commit log | yes | yes |
| 26 Sep 2026 | `68cd156` | feature/start-screen |  | ui: a clean start screen that appears at once, with a progress bar | yes | yes |
| 26 Sep 2026 | `abb9c0e` | feature/start-screen |  | build: cache the 3D library, fish model and fonts for return visits; add a loading-speed test | yes | yes |
| 26 Sep 2026 | `7e7028c` | feature/start-screen |  | audio: music is off on the home screen and comes back on Begin if it was playing | yes | yes |
| 26 Sep 2026 | `e59b8e3` | feature/start-screen |  | ui: move Recenter view into the side panel | yes | yes |
| 26 Sep 2026 | `d92f0b9` | main |  | docs: update the tracking guide for v1.5 | yes | yes |
| 26 Sep 2026 | `d7ec890` | main | v1.5 | v1.5: smooth zoom, level turning, a side panel and a home button | yes | yes |
| 26 Sep 2026 | `502d662` | feature/v1.5-controls |  | release: set the version to 1.5.0 | yes | yes |
| 26 Sep 2026 | `e41dada` | feature/v1.5-controls |  | docs: describe v1.5, report and notes | yes | yes |
| 26 Sep 2026 | `3efc866` | feature/v1.5-controls |  | fix: animals and fish stay in the water; a faster controls test | yes | yes |
| 26 Sep 2026 | `3f940fc` | feature/v1.5-controls |  | feat: smooth zoom, level turning, a side panel, a home button, animals at new depths each dive | yes | yes |
| 25 Sep 2026 | `b4b1e65` | main |  | docs: update the tracking guide for v1.4 | yes | yes |
| 25 Sep 2026 | `d8c7364` | main | v1.4 | v1.4: a smooth start, a living pause, a new dive every time | yes | yes |
| 25 Sep 2026 | `8aebc89` | feature/v1.4-feel |  | release: set the version to 1.4.0 | yes | yes |
| 25 Sep 2026 | `ab9a62a` | feature/v1.4-feel |  | docs: describe v1.4; a report after every fix; Claude's notes | yes | yes |
| 25 Sep 2026 | `f351714` | feature/v1.4-feel |  | feat: hover while the sea lives on, a new dive every time, smooth keys, lively schools | yes | yes |
| 25 Sep 2026 | `b8ec339` | feature/v1.4-feel |  | perf: a smooth start on laptop graphics, no blink at Begin | yes | yes |
| 25 Sep 2026 | `aaca2f4` | main |  | docs: update the tracking guide for v1.3 | yes | yes |
| 25 Sep 2026 | `bbdc609` | main | v1.3 | v1.3: a solid world, smooth arrivals and a faster start | yes | yes |
| 25 Sep 2026 | `32cda40` | feature/v1.3-solid-and-smooth |  | release: set the version to 1.3.0 | yes | yes |
| 25 Sep 2026 | `df0bc04` | feature/v1.3-solid-and-smooth |  | docs: describe v1.3 in CLAUDE.md and README | yes | yes |
| 25 Sep 2026 | `bcd1382` | feature/v1.3-solid-and-smooth |  | feat: a solid world, animals that give way, nothing pops in or out | yes | yes |
| 25 Sep 2026 | `7987b4e` | feature/v1.3-solid-and-smooth |  | perf: open faster and stop freezes early in the dive | yes | yes |
| 25 Sep 2026 | `1f3e0b2` | main |  | docs: update the tracking guide for v1.2 | yes | yes |
| 25 Sep 2026 | `42dfe05` | main | v1.2 | v1.2: one continuous dive to the Challenger Deep, glide swimming, life at real depths | yes | yes |
| 25 Sep 2026 | `0e6fb86` | feature/v1.2-continuous-dive |  | release: set the version to 1.2.0 | yes | yes |
| 25 Sep 2026 | `10cb423` | feature/v1.2-continuous-dive |  | dive: one continuous 7-minute dive from the surface to the Challenger Deep | yes | yes |
| 24 Sep 2026 | `4197c3b` | feature/v1.2-continuous-dive |  | engine: upgrade three.js from r128 (2021) to r186 | yes | yes |
| 24 Sep 2026 | `fb31bb2` | feature/v1.2-continuous-dive |  | refactor: split the code into small ES modules and run the site locally | yes | yes |
| 24 Sep 2026 | `593c8f5` | main |  | docs: update the tracking guide for v1.1 | yes | yes |
| 24 Sep 2026 | `4eec30b` | main | v1.1 | v1.1: a more realistic reef wall, wreck, trench and deep animals | yes | yes |
| 24 Sep 2026 | `df2af88` | main |  | tests: wait for the Begin button without eval | yes | yes |
| 24 Sep 2026 | `2bc92ac` | main |  | tests: make the test tools work on Windows and apply the page policy for real | yes | yes |
| 24 Sep 2026 | `fa9e4ca` | main |  | docs: add the git tracking guide | yes | yes |
| 24 Sep 2026 | `159e389` | main | v1.0 | v1.0: save the dive as it was before the realism work | yes | yes |
<!-- TABLE END -->
