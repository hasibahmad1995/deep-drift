"""Makes docs/git-tracking.pdf: Hasib's guide to git for this project, plus a table of every saved version.
Run:  python docs/make_git_tracking.py
To add a new commit to the table: add an entry to COMMITS below (newest last), commit, then run this again.
Commit IDs and dates are read from git, so only the words need to be written here.
The PDF is printed by Microsoft Edge (or Chrome) in headless mode. No extra Python packages are needed."""
import html, os, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pdf_tools import BASE_CSS, print_pdf

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "git-tracking.pdf"

# ---------------------------------------------------------------------------
# The table. One entry per commit, oldest first.
#   subject: the first line of the commit message, used to find the commit in git
#   version: the tag (v1.0, v1.1, ...) or "" for commits that do not change the dive
#   status:  Kept / Undone (reverted) / Replaced
# ---------------------------------------------------------------------------
COMMITS = [
    dict(
        subject="v1.0: save the dive as it was before the realism work",
        version="v1.0",
        title="Save the dive as it was before the realism work",
        what="Nothing in the dive itself was changed. The whole project was put under git for the first time, "
             "so every later change can be undone.",
        files=["All of <code>src/</code>, <code>assets/</code>, <code>tests/</code>, <code>tools/</code>, "
               "<code>README.md</code>, <code>CLAUDE.md</code>, <code>build.py</code>, <code>.gitignore</code>",
               "<code>dist/index.html</code>: the built, playable page",
               "<code>package.json</code>: version changed from 0.4.0 to 1.0.0",
               "New: <code>backup/deep-drift-v1.0.html</code>, a plain copy of the page that opens without git",
               "New: <code>.gitattributes</code>, keeps line endings exactly as saved"],
        state="Six places: reef, open ocean, midnight, vents, wreck, trench. One real 3D model (the barramundi fish); "
              "everything else is built by code. The weak spots listed in CLAUDE.md (hazy reef wall, dark wreck and "
              "trench, small deep animals, corals you can swim through, untested on phones) are all still present.",
        checks="All five scripts pass a syntax check, alone and joined. <code>dist/index.html</code> is identical to a "
               "fresh build. No screenshots yet: the test tools were not installed at this point.",
        status="Kept",
    ),
    dict(
        subject="docs: add the git tracking guide",
        version="",
        title="Add this git tracking guide",
        what="Added this PDF and the small script that makes it. The dive was not changed, so this commit gets no "
             "version number.",
        files=["New: <code>docs/git-tracking.pdf</code> (this file)",
               "New: <code>docs/make_git_tracking.py</code> (writes this file; holds the table entries)"],
        state="Same as v1.0.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="tests: make the test tools work on Windows and apply the page policy for real",
        version="",
        title="Make the tests work on Windows and apply the page policy for real",
        what="The screenshot tests were meant to run under a strict page policy like the real host, but the policy was "
             "never applied: it only matched an old file name, and the test browser cannot add it to file:// pages anyway. "
             "The page is now served from a made-up web address that the test script answers itself, so the policy "
             "really applies and anything not allowed is blocked. Screenshots go to <code>tests/out/</code> instead of "
             "<code>/tmp</code>, which does not exist on Windows. <code>build.py</code> now reads and writes UTF-8 "
             "and keeps line endings, so the built page is byte for byte the same.",
        files=["<code>tests/shot.py</code>, <code>tests/ui.py</code>, <code>tests/live.py</code>, <code>tests/grid.py</code>",
               "<code>build.py</code>, <code>.gitignore</code> (ignores <code>tests/out/</code>)",
               "<code>CLAUDE.md</code>: how to install the test tools on Windows (the full npm install fails on "
               "<code>sharp</code>, which only the old fish-model tools need, so only three.js is fetched)"],
        state="Same as v1.0. First real screenshots taken: the \"before\" pictures in section 7.",
        checks="Screenshots at 9 dive moments under the strict policy, no page errors. The real fish model still "
               "loads under the policy.",
        status="Kept",
    ),
    dict(
        subject="tests: wait for the Begin button without eval",
        version="",
        title="Tests: wait for the Begin button without eval",
        what="Once the strict policy really applied, one test helper (<code>wait_for_function</code>) broke, because it "
             "runs text as code and the policy forbids that. The tests now wait with <code>wait_for_selector</code>, "
             "which the policy allows. Found while testing v1.1.",
        files=["<code>tests/shot.py</code>, <code>tests/ui.py</code>, <code>tests/live.py</code>"],
        state="Same as v1.0.",
        checks="All three test scripts run with no errors.",
        status="Kept",
    ),
    dict(
        subject="v1.1: a more realistic reef wall, wreck, trench and deep animals",
        version="v1.1",
        title="A more realistic reef wall, wreck, trench and deep animals",
        what="Hasib asked for the four areas in one version. "
             "<b>Reef wall:</b> rock grain painted from three directions (never stretched) that catches the light like "
             "real bumps; ledges, deep cracks and lumpy rock; more colour from encrusting life; a new set of corals and "
             "sponges growing out of the wall (vase and tube sponges, sea fans, soft and plate corals, sea whips). "
             "<b>Wreck:</b> rebuilt as a 47 m steamship: keel, flat sides, raked bow, flat stern, plate seams, black and "
             "faded red paint, rotted plank deck with holes, deckhouse with windows and bridge, broken railings, davits, "
             "a snapped mast across the deck, hatches, a torn hole in the side; rusticles hanging with gravity (as on the "
             "Titanic, at the same depth), anchor chain, sponges and anemones on deck, a debris field with the fallen "
             "funnel. "
             "<b>Trench:</b> finer walls with rock layers and ledges, pale sediment on ledges, boulders at the foot of the "
             "walls, sea cucumbers on the floor; the dive ends about 7 m above the floor. "
             "<b>Deep light:</b> the deep water was set so murky you could see only about 8 m; it is now clear, as real "
             "deep water is, and a soft lamp moves with the diver. "
             "<b>Deep animals:</b> tube worms thicker and in dense clumps with red plumes; anglerfish dark with fangs and "
             "a blue-green lure, now in view about 9 s instead of half a second; dumbo octopus with webbed arms; "
             "snailfish passing close, plus a group feeding near the trench floor; shrimp shapes for vent shrimp and "
             "amphipods. "
             "<b>Speed:</b> only the current place is drawn, so the deep places cost about a quarter of v1.0; the reef "
             "costs the same as v1.0.",
        files=["<code>src/core.js</code>: rock grain, bumps, rust and rock layers in <code>wet()</code>; clearer deep water; lamp; softer torch",
               "<code>src/world.js</code>: reef wall and wall corals, new sponges, <code>buildShip</code>, "
               "<code>addRusticles</code>, debris field, trench walls, boulders, sea cucumbers, tube worms",
               "<code>src/life.js</code>: dumbo web, anglerfish teeth and colour, <code>shrimpGeo</code>, paler animals toned down",
               "<code>src/run.js</code>: animals that sink with the diver, dumbo and snailfish routes, lure light, "
               "trench path, drawing only the current place",
               "<code>dist/index.html</code> rebuilt; <code>package.json</code> 1.1.0; <code>CLAUDE.md</code> updated"],
        state="See the before and after pictures in section 7. Still to do: corals are not solid, phone testing, "
              "anglerfish teeth are too small to notice, trench rock layers are subtle.",
        checks="Syntax of all scripts; screenshots at 9 dive moments under the strict page policy; phone and desktop "
               "menu test; live play test (pause, restart, music). No page errors. Triangles per frame measured at "
               "1300x800 against v1.0: reef 4.2 million (v1.0: 4.0), deep places about 1.0 million (v1.0: 4.0).",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide for v1.1",
        version="",
        title="Update this guide for v1.1",
        what="Added the four new commits to this table, before and after pictures (section 7), and a history diagram "
             "drawn from the real commits.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>",
               "New: <code>docs/img/before-v1.1.jpg</code> and <code>docs/img/after-v1.1.jpg</code>"],
        state="Same as v1.1.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="refactor: split the code into small ES modules and run the site locally",
        version="", lane="feature",
        title="Split the code into small modules; run the site locally",
        what="Hasib asked for clean, separated code that can be found later, and for local testing before shipping. "
             "The five big script files (about 2,400 lines) became 55 small modules, one job each, in folders by area "
             "(engine, dive, world, life, diver, ui, audio, content). The page is a normal folder now: index.html, styles/, "
             "src/, and three.js and the fonts included in the project, so nothing is loaded from other websites. "
             "A small local server (<code>node tools/serve.mjs</code>) runs it at http://localhost:8080. "
             "The dive itself did not change: screenshots at 9 moments looked the same as v1.1.",
        files=["New folders <code>src/engine</code>, <code>src/dive</code>, <code>src/world</code>, <code>src/life</code>, "
               "<code>src/diver</code>, <code>src/ui</code>, <code>src/audio</code>, <code>src/content</code>, <code>src/util</code>",
               "<code>index.html</code>, <code>styles/</code>, <code>vendor/three/</code>, <code>assets/fonts/</code>",
               "<code>tools/serve.mjs</code> (local server), <code>tools/build.py</code> (makes <code>dist/</code> for publishing), "
               "<code>tools/vendor_three.py</code>",
               "Removed: the old single-file build; <code>dist/</code> is no longer kept in git"],
        state="Same as v1.1.",
        checks="Screenshots at 9 moments, menus on phone and desktop, live play. A first Python server dropped requests "
               "on Windows and the page could hang while loading; the Node server loaded 6 of 6 times in about 2 s.",
        status="Kept",
    ),
    dict(
        subject="engine: upgrade three.js from r128 (2021) to r186",
        version="", lane="feature",
        title="Upgrade the 3D engine to the current three.js",
        what="three.js r128 (2021) became r186. This turns on modern colour management and physically based lights "
             "(light fades with distance, as in reality), the base for more realistic pictures. Strengths were converted so "
             "the dive looked the same. One bug found on the way: the new engine gives its fog colour already converted for "
             "the screen, which made every deep place flat bright blue; our fog now keeps its own colour.",
        files=["<code>vendor/three/</code> (r186), <code>tools/vendor_three.py</code>",
               "<code>src/engine/</code> lights, environment, uniforms and <code>wet.js</code>; small renames in several shaders"],
        state="Same as v1.1, on the new engine.",
        checks="Screenshots at 9 moments matched v1.1; menus and live play pass.",
        status="Kept",
    ),
    dict(
        subject="dive: one continuous 7-minute dive from the surface to the Challenger Deep",
        version="", lane="feature",
        title="One continuous dive, gliding swim, life at real depths",
        what="Hasib found the jumps between places jarring and wanted more to explore, kept real. "
             "<b>One world:</b> the dive now goes down the side of a volcanic island without any fade or depth jump: reef, "
             "the island cliff into the twilight and midnight zones, a vent terrace at ~1,600 m, the volcano slope, the "
             "abyssal plain with the wreck at ~5,000 m, the trench wall, and the floor of the Challenger Deep at 10,935 m. "
             "<b>Swimming:</b> no button. You drift toward wherever you look and are always sinking; looking up slows the "
             "sinking, looking down speeds it up; you can never swim back up, so you must aim early; a gentle current brings "
             "you back if you stray too far. <b>Life at real depths:</b> every animal only appears where it really lives "
             "(for example snailfish only between about 6,500 and 8,300 m). New: deep reef (sea fans, black corals, sponges), "
             "hatchetfish, vampire squid, gulper eel, grenadiers, tripod fish, bamboo corals, glass sponges, sea lilies, "
             "brittle stars, sea pigs, xenophyophores, manganese nodules, liquid CO2 droplets at the vents. "
             "<b>Look:</b> backscatter (specks lit in the torch beam, like real deep-sea footage), fog that melts into the "
             "background, realistic rock brightness. <b>Honest page text:</b> the places are moved closer together and the "
             "descent is sped up.",
        files=["New: <code>src/dive/depth.js</code>, <code>route.js</code>; <code>src/world/sites.js</code>, <code>terrain.js</code>, "
               "<code>benthos.js</code>, <code>culling.js</code>; <code>src/diver/glide.js</code>; <code>src/life/species-deep.js</code>, "
               "<code>cast-deep.js</code>; <code>tests/glide.py</code>",
               "Changed: vents, wreck, trench, reef, corals, collision, camera, input, cast, extras, passers, facts, HUD, "
               "particles, page text, README, CLAUDE.md",
               "Removed: <code>src/dive/timeline.js</code>, <code>src/dive/path.js</code> (the old six separate places)"],
        state="One continuous ~7 minute dive from the surface to 10,935 m. See the pictures in section 7.",
        checks="Screenshots down the whole dive under the strict page policy; menus on phone and desktop; live play; "
               "glide test (steers, never rises, sinks slower or faster, roaming limit). No page errors. Triangles per frame "
               "at 1300x800: reef about 4.7 million (v1.1: 4.2), open water 0.8 million, deep places 1.1 to 2.2 million.",
        status="Kept",
    ),
    dict(
        subject="release: set the version to 1.2.0",
        version="", lane="feature",
        title="Set the version number to 1.2.0",
        what="The last step on the branch before merging: <code>package.json</code> says 1.2.0.",
        files=["<code>package.json</code>"],
        state="Same as the commit before.",
        checks="None needed.",
        status="Kept",
    ),
    dict(
        subject="v1.2: one continuous dive to the Challenger Deep, glide swimming, life at real depths",
        version="v1.2", merge=True,
        title="Release v1.2: merge the branch into main",
        what="The merge commit that brings the four commits of <code>feature/v1.2-continuous-dive</code> into <code>main</code>, "
             "tagged <code>v1.2</code>. From here, <code>main</code> is the v1.2 dive.",
        files=["Everything changed on the branch (the four rows above it)."],
        state="v1.2: one continuous dive to the Challenger Deep with gliding swim and life at real depths.",
        checks="All tests passed on the branch before merging.",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide for v1.2",
        version="",
        title="Update this guide for v1.2",
        what="New rows, a history diagram that shows the branch and the merge, a new part explaining branches and "
             "releases (section 4), before and after pictures for v1.2, and the plan for v1.3 and later.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>",
               "New: <code>docs/img/before-v1.2.jpg</code>, <code>docs/img/after-v1.2.jpg</code>"],
        state="Same as v1.2.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="perf: open faster and stop freezes early in the dive",
        version="", lane="feature",
        title="Open faster; no freezes at the start of the dive",
        what="Hasib noticed lag when the page opens. Measured first (a new test, <code>tests/startup.py</code>), then fixed four causes. "
             "<b>1. Too much drawn:</b> each kind of coral was one big batch covering the whole reef, so all 3.9 million reef "
             "triangles were drawn every frame, even behind you. Corals, sea-floor life, rocks, tube worms, nodules and sea "
             "cucumbers are now split into tiles, and only tiles on screen and within sight are drawn. Small corals shrink away "
             "smoothly with distance (when they are a few pixels across and already faded) instead of being drawn out to 250 m. "
             "Schools of fish are skipped when off screen or far away. The first view went from 4.7 million to 0.34 million triangles. "
             "<b>2. Drawing while loading:</b> the page drew the half-built world between loading steps. Now it builds in steps "
             "with a progress message (for example: Loading the coral reef... 11%) and draws nothing until it is ready. "
             "<b>3. Shaders built during the dive:</b> the first time a material is drawn, the browser builds its shader, a "
             "freeze each time. All are now built before Begin (<code>warmup.js</code>). "
             "<b>4. A hidden light:</b> the anglerfish carries a light; hiding and showing it made three.js rebuild the shaders "
             "of everything on screen. The light now stays and just goes dark. "
             "Also: picture sharpness now drops quickly when frames are slow and rises back slowly (<code>quality.js</code>), "
             "and tiny point sprites keep their size when it changes (an old bug).",
        files=["New: <code>src/util/steps.js</code>, <code>src/engine/warmup.js</code>, <code>src/engine/quality.js</code>, "
               "<code>src/world/tiles.js</code>, <code>tests/startup.py</code>",
               "Changed: <code>main.js</code>, <code>culling.js</code>, <code>corals.js</code>, <code>benthos.js</code>, <code>floor.js</code>, "
               "<code>vents.js</code>, <code>wreck.js</code>, <code>trench.js</code>, <code>school.js</code>, <code>cast.js</code>, "
               "<code>wet.js</code> (new option <code>shrink</code>), <code>lights.js</code>, particles, bubbles, effects"],
        state="Same dive, lighter to draw. See the chart in section 7.",
        checks="In the test browser: Begin ready after 2.5 s (v1.2: 5.4 s); 26 pictures in the first 6 s of the dive (v1.2: 9); "
               "no shader built after the warm-up. Screenshots looked the same as v1.2.",
        status="Kept",
    ),
    dict(
        subject="feat: a solid world, animals that give way, nothing pops in or out",
        version="", lane="feature",
        title="Nothing passes through the diver; nothing pops in or out",
        what="Hasib's two rules: you cannot pass through anything (animals move away, or you are stopped), and nothing "
             "appears or vanishes suddenly. <b>Solid world:</b> corals, sponges, bamboo corals, sea lilies, big rocks, tube "
             "worm clumps, the wreck's masts, railings, winches, funnel and boiler, and the whale bones are now solid "
             "(7,794 simple shapes kept in a grid, <code>solids.js</code>). The diver is a 0.45 m ball and slides around them. "
             "The wreck is checked with its real hull shape instead of one big box. "
             "<b>Animals give way:</b> each animal senses the diver's body and has its own comfort distance. Too close, it "
             "speeds up smoothly and swims aside. If it still touches you, a light animal is pushed aside, and a heavy one "
             "(whales, the whale shark, the manta) pushes you aside instead. School fish keep about 1.4 m away and part "
             "around you. <b>No pops:</b> passing animals start where you cannot see them (off screen or lost in the water), "
             "swim across, and leave only once out of sight again; their path never goes through rock. Glows (vents, "
             "anglerfish lure) fade with distance. Deep animals that sink with you slow down gently instead of stopping dead. "
             "<b>Bugs found by the new test and fixed:</b> animals more than 300 m away stopped moving for good (so after the "
             "dive restarted they were frozen and hidden); near the top of the reef wall the diver could be lifted 58 m in one "
             "frame; past the look-up limit the diver was pulled down 6 m in one frame; the reef collision stepped up to 2 m at "
             "once; the lifeboat arms on the wreck were never added (their code was inside a comment).",
        files=["New: <code>src/world/solids.js</code>, <code>tests/solid.py</code>",
               "Changed: <code>collision.js</code>, <code>glide.js</code>, <code>touch.js</code>, <code>school.js</code>, "
               "<code>passers.js</code>, <code>motion.js</code>, <code>main.js</code>, <code>ship.js</code>, <code>wreck.js</code>, "
               "<code>corals.js</code>, <code>benthos.js</code>, <code>floor.js</code>, <code>vents.js</code>, <code>effects.js</code>, "
               "<code>debug.js</code>"],
        state="The world is solid, animals give way, nothing pops. See the whale skeleton pictures in section 7.",
        checks="<code>tests/solid.py</code> simulates the whole dive plus a reef run and a wreck run (10,900 steps): 0 times inside "
               "something solid, 0 animal or fish overlaps, 0 pops, 0 jumps. Direct contact: a whale shark pushed the diver "
               "1.9 m aside; a jellyfish was nudged 0.7 m away. Glide, menu and live tests pass.",
        status="Kept",
    ),
    dict(
        subject="docs: describe v1.3 in CLAUDE.md and README",
        version="", lane="feature",
        title="Describe v1.3 for the next person (and for Claude)",
        what="How the solid world, tiles, warm-up, sharpness control, giving way and passers work; the rule never to hide "
             "a light; the two new tests; the plan moved on (animal behaviour is now v1.4, real models v1.5 and later).",
        files=["<code>CLAUDE.md</code>, <code>README.md</code>"],
        state="Same as the commit before.",
        checks="Read through; no em dashes.",
        status="Kept",
    ),
    dict(
        subject="release: set the version to 1.3.0",
        version="", lane="feature",
        title="Set the version number to 1.3.0",
        what="The last step on the branch before merging: <code>package.json</code> says 1.3.0.",
        files=["<code>package.json</code>"],
        state="Same as the commit before.",
        checks="None needed.",
        status="Kept",
    ),
    dict(
        subject="v1.3: a solid world, smooth arrivals and a faster start",
        version="v1.3", merge=True,
        title="Release v1.3: merge the branch into main",
        what="The merge commit that brings the four commits of <code>feature/v1.3-solid-and-smooth</code> into <code>main</code>, "
             "tagged <code>v1.3</code>. Why 1.3 and not 2.0: it is the same dive, it just behaves more like the real thing "
             "and opens faster. A 2.0 would mean a big change in what the dive is (for example real 3D models everywhere).",
        files=["Everything changed on the branch (the four rows above it)."],
        state="v1.3: nothing passes through the diver, nothing pops in or out, faster opening.",
        checks="All tests passed on the branch before merging.",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide for v1.3",
        version="",
        title="Update this guide for v1.3",
        what="New rows, the whale skeleton before and after pictures, the opening chart, and the plan for v1.4 and later.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>",
               "New: <code>docs/img/solid-v1.3.jpg</code>, <code>docs/img/opening-v1.3.jpg</code>"],
        state="Same as v1.3.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="perf: a smooth start on laptop graphics, no blink at Begin",
        version="", lane="feature",
        title="A smooth start on Hasib's laptop; no blink at Begin",
        what="Hasib saw the camera blink and lag at the beginning. This time it was measured on his laptop's own graphics card "
             "(Intel UHD, screen 1536x864 at 125%), not only the slow test graphics. The reef, the start of the dive, took 50 to 70 ms "
             "per picture; after a few seconds the automatic sharpness dropped, which cleared the picture for a frame (a blink) and "
             "caused a 170 to 200 ms hitch; and Begin cut the picture to black. Now: before Begin the page draws the reef a few times "
             "and picks the sharpness for about 30 ms per picture (<code>benchmark.js</code>); sharpness changes only after about a second "
             "of slow pictures and never between drawing and showing; no edge smoothing on scaled screens (a fifth of the cost there); "
             "cheaper rock grain; coral shapes share their corners; the warm-up copies shapes a few at a time so loading never freezes "
             "long; Begin fades the intro card away over the live picture.",
        files=["New: <code>src/engine/benchmark.js</code>, <code>src/lib/geometry-utils.js</code>",
               "Changed: <code>renderer.js</code>, <code>quality.js</code>, <code>warmup.js</code>, <code>wet.js</code>, <code>corals.js</code>, "
               "<code>styles/main.css</code>, <code>tests/startup.py</code> (new options <code>--gpu</code>, <code>--screen</code>, <code>--freeze</code>)"],
        state="Smooth from the first second on Hasib's laptop, a little softer picture there.",
        checks="On the real graphics card at Hasib's size: first 8 to 12 s of the dive at 60 pictures a second, no hitch over 33 ms "
               "(v1.3: 200 ms), no sharpness change during the dive, longest loading freeze 0.37 s (v1.3: 1.85 s).",
        status="Kept",
    ),
    dict(
        subject="feat: hover while the sea lives on, a new dive every time, smooth keys, lively schools",
        version="", lane="feature",
        title="Living pause, a new dive every time, smooth arrow keys, real fish speeds",
        what="<b>Pause:</b> it now stops only the diver; the sea has its own clock, so schools, sharks and jellyfish keep swimming, "
             "passing animals swim on, and new visitors still come. <b>Variety:</b> at Begin and every restart each scripted animal "
             "rolls its version: earlier or later, nearer or farther, either side, faster or slower, and about one dive in seven "
             "not there; circling animals and schools start anywhere and may circle the other way; the dolphins stay one pod. Every "
             "version is checked against rock with a new honest 0.5 m check; if none is clear the animal stays away. This found older "
             "mistakes: the three reef sharks circled through the reef wall and the manta met you inside the wall (it now glides over "
             "you). <b>Keys:</b> arrow keys speed up to a smooth turn and ease to a stop instead of 7-degree jumps. <b>Fish:</b> each "
             "tail beat moves a fish about 0.7 of its length (Bainbridge 1958), so small school fish now beat their tails about 8 "
             "times a second instead of 2; schools surge (speed up and slow down by about 40%); each fish faces its real movement.",
        files=["New: <code>src/life/variety.js</code>, <code>tests/life.py</code>",
               "Changed: <code>main.js</code>, <code>state.js</code>, <code>camera.js</code>, <code>input.js</code>, <code>collision.js</code> "
               "(new <code>inRock</code> for animals), <code>motion.js</code>, <code>school.js</code>, <code>passers.js</code>, <code>touch.js</code>, "
               "<code>cast.js</code>, <code>cast-deep.js</code>, <code>extras.js</code>, <code>small-shapes.js</code>, <code>barramundi.js</code>, "
               "<code>hud.js</code>, <code>playback.js</code>, <code>debug.js</code>, <code>tests/solid.py</code>"],
        state="Pause hovers while the sea lives on; every dive differs; smooth keys; lively schools.",
        checks="<code>tests/life.py</code>: 3 s of pause, the diver moved 0.08 m (breathing) and all 8 schools and 12 animals nearby kept "
               "moving; 73 of 74 animals change between dives, 1 to 7 absent, 0 paths through rock; keys turn with no jump over 0.14 "
               "degrees per picture; a school's speed ranged from half to twice its average. <code>tests/solid.py</code> still 0 problems.",
        status="Kept",
    ),
    dict(
        subject="docs: describe v1.4; a report after every fix; Claude's notes",
        version="", lane="feature",
        title="Describe v1.4; start the report after every fix",
        what="Hasib's new rule: after every fix, a PDF report of what is on the website and what to do next, and a notes file Claude "
             "keeps for itself. <code>docs/make_report.py</code> writes <code>docs/reports/report-v1.4.pdf</code>; "
             "<code>docs/claude-notes.md</code> holds Claude's notes; the page style and PDF printing moved into "
             "<code>docs/pdf_tools.py</code>, shared by both PDF scripts. CLAUDE.md and README describe the v1.4 parts.",
        files=["New: <code>docs/make_report.py</code>, <code>docs/pdf_tools.py</code>, <code>docs/claude-notes.md</code>, "
               "<code>docs/reports/report-v1.4.pdf</code>, <code>docs/reports/img/</code>",
               "Changed: <code>CLAUDE.md</code>, <code>README.md</code>, <code>docs/make_git_tracking.py</code>"],
        state="Same as the commit before.",
        checks="Report opened and read through; no em dashes.",
        status="Kept",
    ),
    dict(
        subject="release: set the version to 1.4.0",
        version="", lane="feature",
        title="Set the version number to 1.4.0",
        what="The last step on the branch before merging: <code>package.json</code> says 1.4.0.",
        files=["<code>package.json</code>"],
        state="Same as the commit before.",
        checks="None needed.",
        status="Kept",
    ),
    dict(
        subject="v1.4: a smooth start, a living pause, a new dive every time",
        version="v1.4", merge=True,
        title="Release v1.4: merge the branch into main",
        what="The merge commit that brings the four commits of <code>feature/v1.4-feel</code> into <code>main</code>, tagged "
             "<code>v1.4</code>. The planned animal behaviour moves to v1.5, because these fixes came first (a number always means one thing).",
        files=["Everything changed on the branch (the four rows above it)."],
        state="v1.4: smooth start, living pause, a new dive every time, smooth keys, real fish speeds.",
        checks="All tests passed on the branch before merging.",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide for v1.4",
        version="",
        title="Update this guide for v1.4",
        what="New rows, the start-of-dive chart, and the plan for v1.5 and later.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>"],
        state="Same as v1.4.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="feat: smooth zoom, level turning, a side panel, a home button, animals at new depths each dive",
        version="", lane="feature",
        title="Smooth zoom, level turning, side panel, home button, animals at new depths",
        what="Hasib's five points after trying v1.4. <b>Zoom:</b> each press now steps smoothly 1x, 1.3x, 1.6x, 2x, 2.5x and back down "
             "(no jump from the top to 1x); holding zooms smoothly; in deep water the limit was 1.2x (a press often did nothing), now "
             "1.5x to 2.5x; small corals stay drawn when zoomed. <b>Turning:</b> on steep parts of the dive the arrow keys spun the view "
             "in a circle, because turning followed the dive path's tilt; it is now always around the true vertical with a level "
             "horizon. <b>Side panel:</b> Pause/Play, Music and Zoom moved to a panel on the left edge, hidden until you hover (a "
             "handle opens it on phones). <b>Home:</b> Deep Drift at the top goes back to the start screen; the Restart button is gone; "
             "the end of the dive also returns there; the start screen explains the panel. <b>Variety:</b> each scripted animal now "
             "meets you anywhere within the depths where it really lives (one shared list), so a deep animal is never near the "
             "surface. Found while testing: swimming into the reef shelf's lip could lift you 3 m at once (the lip now stops you), and a big animal could shove you 3 m "
             "(big animals now nudge you gently first).",
        files=["New: <code>src/diver/zoom.js</code>, <code>src/ui/dock.js</code>, <code>src/life/depths.js</code>, <code>tests/controls.py</code>",
               "Changed: <code>index.html</code>, <code>styles/main.css</code>, <code>main.js</code>, <code>camera.js</code>, <code>input.js</code>, "
               "<code>collision.js</code>, <code>playback.js</code>, <code>panels.js</code>, <code>motion.js</code>, <code>variety.js</code>, "
               "<code>passers.js</code>, <code>school.js</code>, <code>touch.js</code>, <code>cast.js</code>, <code>extras.js</code>, "
               "<code>culling.js</code>, <code>wet.js</code>, <code>uniforms.js</code>, <code>debug.js</code>, tests"],
        state="New controls layout, home button, smooth zoom, level turning, animals met at new depths each dive.",
        checks="<code>tests/controls.py</code>: zoom 1.3, 1.6, 2, 2.5, 2, 1.6, 1.3, 1; horizon level after turning on a 43-degree slope; "
               "panel hidden until hover; home works; 39 animals never met outside their depths over 6 dives. Solid, life, glide, "
               "menu, live and real-graphics startup tests pass.",
        status="Kept",
    ),
    dict(
        subject="fix: animals and fish stay in the water; a faster controls test",
        version="", lane="feature",
        title="Animals and fish stay in the water",
        what="Found by checking each animal's own depth (not the diver's): with the new meeting moments near the surface, the "
             "dolphins and the turtle could drift up out of the water, up to 10 m above it. Scripted animals, visitors and school "
             "fish are now kept below the surface. The controls test now judges each animal by its own depth and runs its zoom and "
             "turning checks without drawing (much faster).",
        files=["<code>motion.js</code>, <code>passers.js</code>, <code>school.js</code>, <code>debug.js</code>, <code>tests/controls.py</code>"],
        state="Same as the commit before, with every animal in the water.",
        checks="controls.py: 0 animals met outside their depths (and none above the water) over 6 dives; solid, life and live tests pass.",
        status="Kept",
    ),
    dict(
        subject="docs: describe v1.5, report and notes",
        version="", lane="feature",
        title="Describe v1.5; report v1.5; notes",
        what="CLAUDE.md and README describe the new controls, zoom, level turning and depth list; <code>docs/reports/report-v1.5.pdf</code> "
             "shows what is on the website now and what is next; Claude's notes updated.",
        files=["<code>CLAUDE.md</code>, <code>README.md</code>, <code>docs/claude-notes.md</code>, <code>docs/make_report.py</code>, "
               "<code>docs/reports/report-v1.5.pdf</code>, <code>docs/reports/img/v1.5-controls.jpg</code>"],
        state="Same as the commit before.",
        checks="Report opened and read through; no em dashes.",
        status="Kept",
    ),
    dict(
        subject="release: set the version to 1.5.0",
        version="", lane="feature",
        title="Set the version number to 1.5.0",
        what="The last step on the branch before merging: <code>package.json</code> says 1.5.0.",
        files=["<code>package.json</code>"],
        state="Same as the commit before.",
        checks="None needed.",
        status="Kept",
    ),
    dict(
        subject="v1.5: smooth zoom, level turning, a side panel and a home button",
        version="v1.5", merge=True,
        title="Release v1.5: merge the branch into main",
        what="The merge commit that brings the four commits of <code>feature/v1.5-controls</code> into <code>main</code>, tagged "
             "<code>v1.5</code>. Animal behaviour moves to v1.6 and real models to v1.7 or later.",
        files=["Everything changed on the branch (the four rows above it)."],
        state="v1.5: new controls and home button, smooth zoom, level turning, animals at new depths each dive.",
        checks="All tests passed on the branch before merging.",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide for v1.5",
        version="",
        title="Update this guide for v1.5",
        what="New rows and the plan for v1.6 and later.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>"],
        state="Same as v1.5.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
    dict(
        subject="ui: move Recenter view into the side panel",
        version="", lane="feature",
        title="Recenter view moves into the side panel",
        what="Hasib's first change made by himself, as a lesson: the Recenter view button moved from the top row into the side panel on the left edge, with its hidden label and the start-screen hint updated, and the phone Menu no longer closing for it.",
        files=["<code>index.html</code>, <code>src/ui/panels.js</code>"],
        state="Recenter view sits in the side panel.",
        checks="Tried in the browser; menu and live tests pass.",
        status="Kept",
    ),
    dict(
        subject="audio: music is off on the home screen and comes back on Begin if it was playing",
        version="", lane="feature",
        title="A quiet home screen",
        what="Going back to the start screen stops the music; pressing Begin brings it back only if it was playing before.",
        files=["<code>src/audio/music.js</code>, <code>src/ui/playback.js</code>"],
        state="Music stops at home.",
        checks="Checked: on, home (off), Begin (on); off before home stays off.",
        status="Kept",
    ),
    dict(
        subject="build: cache the 3D library, fish model and fonts for return visits; add a loading-speed test",
        version="", lane="feature",
        title="Faster return visits; measuring loading",
        what="Measured first-visit loading on a slowed connection with the files compressed like Cloudflare does: 1.2 MB, about 3 s to download at 9 Mbit/s; the real wait is building the world (about 3 s on Hasib's laptop). A list of early downloads was tried and gave no gain, so it was left out. Kept: cache rules (<code>_headers</code>) so returning visitors keep the 3D library, the fish model and the fonts for a day.",
        files=["<code>tools/build.py</code>, new <code>tests/load.py</code>, <code>tests/cloudlike_server.mjs</code>"],
        state="Same dive; return visits load faster.",
        checks="load.py measured before and after.",
        status="Kept",
    ),
    dict(
        subject="ui: a clean start screen that appears at once, with a progress bar",
        version="", lane="feature",
        title="A clean start screen that appears at once",
        what="The long paragraph and the controls box are gone. The start screen shows a small line (An interactive ocean dive), the title, the subtitle Descend from sunlight into the deepest dark on Earth., three short hints, and Begin with a slim progress bar. It is written in the page itself, so it appears before any code runs. Nothing else shows behind it.",
        files=["<code>index.html</code>, <code>styles/main.css</code>, <code>src/main.js</code>, <code>src/config.js</code>, <code>src/ui/playback.js</code>"],
        state="New start screen.",
        checks="Pictures while loading, ready, in the dive and home again; all tests pass.",
        status="Kept",
    ),
    dict(
        subject="docs: describe v1.5.1 and add a commit log",
        version="", lane="feature",
        title="A commit log",
        what="<code>docs/commit-log.md</code> lists every commit and whether it is uploaded to GitHub and live; <code>tools/commit_log.py</code> rebuilds the table from git. CLAUDE.md describes publishing and the new rules.",
        files=["<code>CLAUDE.md</code>, <code>README.md</code>, <code>docs/claude-notes.md</code>, <code>docs/make_report.py</code>, <code>docs/commit-log.md</code>, <code>tools/commit_log.py</code>"],
        state="Same as the commit before.",
        checks="Read through.",
        status="Kept",
    ),
    dict(
        subject="release: set the version to 1.5.1",
        version="", lane="feature",
        title="Set the version number to 1.5.1",
        what="The last step on the branch before merging: <code>package.json</code> says 1.5.1. Small improvements get the third number.",
        files=["<code>package.json</code>"],
        state="Same as the commit before.",
        checks="None needed.",
        status="Kept",
    ),
    dict(
        subject="v1.5.1: a clean start screen, Recenter view in the side panel, a quiet home screen",
        version="v1.5.1", merge=True,
        title="Release v1.5.1: merge the branch into main",
        what="The merge commit that brings the six commits of <code>feature/start-screen</code> into <code>main</code>, tagged <code>v1.5.1</code>.",
        files=["Everything changed on the branch (the six rows above it)."],
        state="v1.5.1: new start screen, Recenter in the side panel, quiet home screen.",
        checks="All tests passed on the branch before merging.",
        status="Kept",
    ),
    dict(
        subject="docs: update the tracking guide and commit log for v1.5.1",
        version="", lane="main",
        title="Update this guide and the commit log for v1.5.1",
        what="New rows for v1.5.1.",
        files=["<code>docs/git-tracking.pdf</code>, <code>docs/make_git_tracking.py</code>, <code>docs/commit-log.md</code>"],
        state="Same as v1.5.1.",
        checks="PDF opened and read through.",
        status="Kept",
    ),
]

# Before and after pictures (section 7): (image in docs/img, caption)
PICTURES = [
    ("../reports/img/v1.5-controls.jpg", "v1.5 on Hasib's laptop: the start screen with the new hint, the side panel closed and open, zoomed in to 2.5x."),
    ("../reports/img/v1.4-start.jpg", "v1.4, the start of the dive on Hasib's laptop (Intel UHD graphics, 1536x864 at 125%): v1.3 and v1.4."),
    ("solid-v1.3.jpg", "v1.3, solid world. The diver is sent straight into the whale skeleton on the abyssal plain. "
     "Left, v1.2: the camera ends up inside the rib cage. Right, v1.3: the diver is stopped just above the bones."),
    ("opening-v1.3.jpg", "v1.3, opening the page, measured in the test browser (software graphics, so all numbers are slower "
     "than on a real computer; compare the bars, not the numbers)."),
    ("before-v1.2.jpg", "v1.1 (before v1.2): six separate places, with a fade to black between the vents, the wreck and the trench."),
    ("after-v1.2.jpg", "v1.2: one continuous dive. Left to right, top to bottom: reef 11 m and 54 m, reef drop-off 155 m, "
     "twilight 560 m (hatchetfish), midnight 1,120 m (vampire squid) and 1,450 m (anglerfish), vents 1,580 m, volcano slope "
     "2,270 and 3,440 m, abyssal plain 4,840 m, wreck 4,860 m, whale skeleton 5,185 m, trench 6,300 and 8,275 m, Challenger Deep 10,890 m."),
    ("before-v1.1.jpg", "Before (v1.0). Top: reef at 8, 32 and 52 m. Middle: midnight zone (the anglerfish should be here), "
     "vents, wreck. Bottom: wreck, trench, trench."),
    ("after-v1.1.jpg", "After (v1.1), at the same moments of the dive (the anglerfish and trench shots are a few seconds "
     "later, when the animals pass)."),
]

# Planned work, shown in its own table so it is never confused with saved versions.
PLANNED = [
    ("v1.6", "Animal behaviour", "Curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, "
     "flounder, scorpionfish, garden eels), deep-sea light displays, feeding at the vents and the whale skeleton, animals steering "
     "around corals."),
    ("v1.7+", "Real 3D models", "In small batches from Sketchfab, each with Hasib's OK on its licence and a credit in the page."),
    ("", "Lighter reef", "Simpler far corals, so laptops like Hasib's can draw the reef at full sharpness."),
    ("", "Phone check", "Try the dive on a real phone: speed, the side panel, motion look (gyro), and the glide. Needs Hasib's phone."),
    ("", "Publish", "First public version on GitHub Pages (free), after local testing. Needs a GitHub account."),
]


# ---------------------------------------------------------------------------
def git(*args):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    return r.stdout.strip() if r.returncode == 0 else ""


def lookup(subject):
    """Find a commit by the first line of its message. Returns (short id, full id, date) or None."""
    for line in git("log", "--all", "--date=format:%d %b %Y, %H:%M", "--format=%h|%H|%ad|%s").splitlines():
        h, H, d, s = line.split("|", 3)
        if s == subject:
            return h, H, d
    return None


def git_path():
    """Returns [the git Windows uses, the git used inside Git Bash] (either may be missing)."""
    found = subprocess.run(["where", "git"], capture_output=True, text=True, shell=True).stdout.splitlines()
    return sorted({p.strip() for p in found if p.strip()}, key=lambda p: "\\cmd\\" not in p)


def folder_size(p):
    return sum(f.stat().st_size for f in p.rglob("*") if f.is_file())


# ---------------------------------------------------------------------------
CSS = BASE_CSS   # the shared page style (pdf_tools.py)

AREAS_SVG = """
<svg viewBox="0 0 720 190" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial" font-size="13">
 <defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0b3954"/></marker></defs>
 <rect x="10" y="30" width="190" height="120" rx="8" fill="#f4f9fc" stroke="#6f9bb8"/>
 <text x="105" y="58" text-anchor="middle" font-weight="700" fill="#0b3954">1. Working folder</text>
 <text x="105" y="82" text-anchor="middle" fill="#333">The files you see and edit</text>
 <text x="105" y="102" text-anchor="middle" fill="#333">src\\world.js, build.py ...</text>
 <text x="105" y="130" text-anchor="middle" fill="#777" font-size="11">changes are NOT saved in git yet</text>
 <rect x="265" y="30" width="190" height="120" rx="8" fill="#fff8e8" stroke="#c9a24a"/>
 <text x="360" y="58" text-anchor="middle" font-weight="700" fill="#7a5a10">2. Staging area</text>
 <text x="360" y="82" text-anchor="middle" fill="#333">A list of changes chosen</text>
 <text x="360" y="102" text-anchor="middle" fill="#333">for the next save</text>
 <text x="360" y="130" text-anchor="middle" fill="#777" font-size="11">like packing a box before sealing it</text>
 <rect x="520" y="30" width="190" height="120" rx="8" fill="#e9f6ee" stroke="#5aa377"/>
 <text x="615" y="58" text-anchor="middle" font-weight="700" fill="#1d6b3a">3. History (.git)</text>
 <text x="615" y="82" text-anchor="middle" fill="#333">Every saved version,</text>
 <text x="615" y="102" text-anchor="middle" fill="#333">kept forever</text>
 <text x="615" y="130" text-anchor="middle" fill="#777" font-size="11">the sealed boxes, in order</text>
 <line x1="202" y1="90" x2="260" y2="90" stroke="#0b3954" stroke-width="2" marker-end="url(#a)"/>
 <text x="231" y="80" text-anchor="middle" fill="#0b3954" font-family="Consolas" font-size="12">git add</text>
 <line x1="457" y1="90" x2="515" y2="90" stroke="#0b3954" stroke-width="2" marker-end="url(#a)"/>
 <text x="486" y="80" text-anchor="middle" fill="#0b3954" font-family="Consolas" font-size="12">git commit</text>
 <path d="M615,152 C615,182 105,182 105,152" fill="none" stroke="#5aa377" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#a)"/>
 <text x="360" y="186" text-anchor="middle" fill="#1d6b3a" font-size="12">git switch / git restore: bring an old version back into the folder</text>
</svg>"""

def chain_svg():
    """The history as circles: main along the lower line, side branches (lane "feature") on the upper line, with forks
    and merges as slanted lines. Wraps onto several rows of up to PER_ROW commits so circles never overlap.
    Drawn from COMMITS plus the next planned version."""
    nodes = []
    for c in COMMITS:
        f = lookup(c["subject"])
        lab = c["version"] or ("merge" if c.get("merge") else c["subject"].split(":")[0])
        nodes.append(dict(lab=lab, sub=f[0] if f else "this one", ver=bool(c["version"]), plan=False, lane=c.get("lane", "main"), merge=c.get("merge", False)))
    nodes.append(dict(lab=PLANNED[0][0] or "next", sub="planned", ver=True, plan=True, lane="main", merge=False))
    PER_ROW, W, r, step = 15, 720, 19, 44
    Y = {"main": 120, "feature": 55}
    # parents: the last node on the same line, or on main when a branch starts
    last = {"main": None, "feature": None}
    for k, nd in enumerate(nodes):
        nd["parent"] = last[nd["lane"]] if last[nd["lane"]] is not None else last["main"]
        nd["merged"] = last["feature"] if nd["merge"] else None
        last[nd["lane"]] = k
    rows = []
    starts = list(range(0, len(nodes), PER_ROW))
    if len(starts) > 1 and len(nodes) - starts[-1] == 1: starts.pop()   # a lone last circle joins the row before
    for n_row, r0 in enumerate(starts):
        r1 = starts[n_row + 1] if n_row + 1 < len(starts) else len(nodes)
        ids = range(r0, r1); X = {k: 30 + (k - r0) * step for k in ids}; out = []
        def line(a, b, col, dash=""):
            ya, yb = Y[nodes[a]["lane"]] if a is not None else 0, Y[nodes[b]["lane"]]
            xa = X[a] if a in X else 0   # the parent is on the row above: the line comes in from the left edge
            if a is not None and a not in X: ya = Y[nodes[a]["lane"]]
            out.append(f'<line x1="{xa:.0f}" y1="{ya}" x2="{X[b]:.0f}" y2="{yb}" stroke="{col}" stroke-width="2"{dash}/>')
        for k in ids:
            nd = nodes[k]; dash = ' stroke-dasharray="4 3"' if nd["plan"] else ""
            if nd["parent"] is not None: line(nd["parent"], k, "#aab7c2" if nd["plan"] else "#6f9bb8", dash)
            if nd["merged"] is not None: line(nd["merged"], k, "#c9a24a")
        for k in ids:
            nd = nodes[k]; x, y = X[k], Y[nd["lane"]]
            stroke, fill, tc = ("#aab7c2", "#fff", "#8a97a3") if nd["plan"] else (("#5aa377", "#e9f6ee", "#1d6b3a") if nd["ver"] else (("#c9a24a", "#fff8e8", "#7a5a10") if nd["lane"] == "feature" else ("#6f9bb8", "#f4f9fc", "#0b3954")))
            dash = ' stroke-dasharray="4 3"' if nd["plan"] else ""
            out.append(f'<circle cx="{x:.0f}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"{dash}/>'
                       f'<text x="{x:.0f}" y="{y - 2}" text-anchor="middle" font-weight="700" font-size="9.5" fill="{tc}">{html.escape(nd["lab"])}</text>'
                       f'<text x="{x:.0f}" y="{y + 10}" text-anchor="middle" font-size="8" fill="#555">{html.escape(nd["sub"])}</text>')
            if nd["ver"] and not nd["plan"]:
                out.append(f'<rect x="{x - 26:.0f}" y="{y + r + 10}" width="52" height="17" rx="3" fill="#1d6b3a"/><text x="{x:.0f}" y="{y + r + 22}" text-anchor="middle" fill="#fff" font-size="9.5">tag {html.escape(nd["lab"])}</text>'
                           f'<line x1="{x:.0f}" y1="{y + r}" x2="{x:.0f}" y2="{y + r + 10}" stroke="#1d6b3a" stroke-width="2"/>')
            if k == len(nodes) - 2:
                out.append(f'<rect x="{x - 34:.0f}" y="{Y["main"] + r + 32}" width="68" height="17" rx="3" fill="#0b3954"/><text x="{x:.0f}" y="{Y["main"] + r + 44}" text-anchor="middle" fill="#fff" font-size="9.5">main (HEAD)</text>')
        if r0 == 0:
            out.append('<text x="30" y="24" fill="#7a5a10" font-size="11">side branches: feature/... (one per version, where it was built)</text>')
        rows.append('<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial">' + "".join(out) + '</svg>')
    rows.append('<div class="cap">Read left to right, row after row. Lower line: main (released versions). Upper line: side branches.</div>')
    return "".join(rows)


def picture(name):
    """An image from docs/img, put inside the page so the PDF needs no other files."""
    import base64
    return "data:image/jpeg;base64," + base64.b64encode((ROOT / "docs" / "img" / name).read_bytes()).decode()


def esc(s):
    return html.escape(s)


def build_html():
    gp = git_path()
    ver = git("--version")
    gitdir = ROOT / ".git"
    size_mb = folder_size(gitdir) / 1e6 if gitdir.exists() else 0
    branch = git("branch", "--show-current") or "main"
    name, email = git("config", "user.name"), git("config", "user.email")
    remote = git("remote", "-v")
    tags = git("tag", "--list") .split()
    today = git("log", "-1", "--date=format:%d %b %Y", "--format=%ad") or ""

    # ---- table rows
    rows = []
    for i, c in enumerate(COMMITS, 1):
        found = lookup(c["subject"])
        if found:
            short, full, date = found
            idcell = f'<span class="mono">{short}</span>'
        else:
            date = "this commit"
            idcell = '<span class="muted">Added at the next update (see section 3)</span>'
        v = c["version"] or '<span class="muted">none</span>'
        pill = "kept" if c["status"] == "Kept" else "undone"
        desc = (f'<div><span class="lbl">What changed:</span> {c["what"]}</div>'
                f'<div class="lbl" style="margin-top:1mm">Files:</div><ul>' + "".join(f"<li>{f}</li>" for f in c["files"]) + "</ul>"
                f'<div><span class="lbl">State of the dive:</span> {c["state"]}</div>'
                f'<div style="margin-top:1mm"><span class="lbl">Checks:</span> {c["checks"]}</div>')
        rows.append(f'<tr><td>{i}</td><td class="v">{v}</td><td>{idcell}</td><td>{esc(date)}</td>'
                    f'<td><b>{esc(c["title"])}</b><div class="muted mono" style="background:none;padding:0;font-size:7.8pt;margin-top:1mm">{esc(c["subject"])}</div></td>'
                    f'<td>{desc}</td><td><span class="pill {pill}">{esc(c["status"])}</span></td></tr>')
    plan_rows = "".join(f'<tr><td class="v">{v or "<span class=muted>none</span>"}</td><td><b>{esc(t)}</b></td><td>{esc(d)}</td></tr>' for v, t, d in PLANNED)

    features = ", ".join(f"<code>{esc(b)}</code>" for b in git("branch", "--format=%(refname:short)").splitlines() if b.startswith("feature/")) or "none"
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>Deep Drift: git tracking</title><style>{CSS}</style></head><body>

<h1>Deep Drift: saved versions and how git works</h1>
<div class="sub">A guide for Hasib. Keeps track of every saved version of the dive, and explains how to go back to one.
Updated {esc(today)}.</div>

<div class="box"><b>In one sentence:</b> git is a program that takes a photo of the whole project each time we save
(a <i>commit</i>), keeps every photo forever, and can put any old photo back. Before each realism change we have a safe
copy to return to.</div>

<h2>1. Where everything is</h2>
<table class="facts">
<tr><td>Git program</td><td><code>{esc(gp[0] if gp else "not found")}</code> (the one Windows uses)<br>
{"<code>" + esc(gp[1]) + "</code> (the same program, used inside the Git Bash window)" if len(gp) > 1 else ""}</td></tr>
<tr><td>Git version</td><td>{esc(ver)}</td></tr>
<tr><td>The project</td><td><code>{esc(str(ROOT))}</code></td></tr>
<tr><td>The history</td><td><code>{esc(str(gitdir))}</code><br>A hidden folder, about {size_mb:.1f} MB. Every saved version lives
inside it (packed and compressed). <b>Never edit or delete it:</b> deleting it deletes all history. Your normal files are not affected.</td></tr>
<tr><td>Settings for this project</td><td><code>.git\\config</code>. Name <code>{esc(name)}</code>, email <code>{esc(email)}</code>.
These are set for this project only. Git on this computer has no global name or email.</td></tr>
<tr><td>Branches</td><td><code>main</code>: released versions. {features}: where each version was built (kept for the record). You are on <code>{esc(branch)}</code>. See section 4.</td></tr>
<tr><td>Run it locally</td><td>In the project folder: <code>node tools/serve.mjs</code>, then open <code>http://localhost:8080</code>. Stop it with Ctrl+C.</td></tr>
<tr><td>Tags (named versions)</td><td>{", ".join("<code>" + esc(t) + "</code>" for t in tags) or "none"}</td></tr>
<tr><td>Online copy</td><td>{"<code>" + esc(remote) + "</code>" if remote else "None. The history exists only on this computer. If the project folder is lost, the history is lost too. Putting a copy on GitHub (private) would fix that; ask when you want it."}</td></tr>
<tr><td>Plain backup page</td><td><code>backup\\deep-drift-v1.0.html</code>. Double-click it to play the v1.0 dive. No git needed.
(Any other version: see section 5.)</td></tr>
<tr><td>This guide</td><td><code>docs\\git-tracking.pdf</code>, made by <code>docs\\make_git_tracking.py</code></td></tr>
<tr><td>Special files</td><td><code>.gitignore</code>: things git ignores (<code>node_modules</code>, screenshots <code>*.png</code>, <code>__pycache__</code>).<br>
<code>.gitattributes</code>: keeps line endings exactly as saved. Without it, Windows git would switch them when restoring,
so an old version would not come back byte for byte.</td></tr>
</table>

<h2>2. Why the version is called v1.0, and how numbers go up</h2>
<p>The project file <code>package.json</code> said <code>0.4.0</code> before git was set up. A number starting with 0 usually means
"still being built". You chose to call the current dive <b>v1.0</b>: the first saved version. <code>package.json</code> was
changed to <code>1.0.0</code> so everything agrees.</p>
<p>The rule from now on (<b>vMAJOR.MINOR</b>, plus a third number for small fixes):</p>
<ul>
<li><b>MINOR goes up by one</b> for each finished, tested change to the dive: v1.1 (the realism work), v1.2 (the continuous dive), and so on.
After v1.9 comes v1.10, not v2.0.</li>
<li><b>MAJOR goes up</b> (v2.0) only for a very big change you decide on, for example a full redesign.</li>
<li><b>The third number goes up</b> for a set of small improvements, like v1.5.1 (a new start screen, a button moved, music quiet at home). A single tiny change does not need a number at all: it is still a saved commit you can go back to.</li>
<li><b>No new number</b> for commits that do not change the dive: this guide, test fixes, notes. They still get a row in the
table, with "none" as the version.</li>
<li>If a version is undone, its number is <b>not reused</b>. The next change takes the next number, so a number always means one thing.</li>
</ul>

<h2>3. How git works</h2>
<h3>The three places a change passes through</h3>
<div class="fig">{AREAS_SVG}</div>
<ol>
<li><b>Working folder.</b> The files as they are now. When code is edited, only this changes. Git notices, but nothing is saved yet.</li>
<li><b>Staging area.</b> <code>git add</code> puts chosen changes here. It is a waiting list for the next save, so one save can
hold one tidy change even if other files were also touched.</li>
<li><b>History.</b> <code>git commit</code> seals everything on the waiting list into a new saved version inside <code>.git</code>.
After that it is safe: later edits cannot damage it.</li>
</ol>

<h3>What a commit is</h3>
<p>A commit is a complete snapshot of every tracked file at that moment, plus a message (what and why), the author, the date,
and a pointer to the commit before it. Git stores only what changed, so saving often is cheap: the whole history today is about {size_mb:.1f} MB.</p>
<p>Each commit gets an <b>ID</b> like <code>7929f37</code> (short form) or a 40-character long form. The ID is a fingerprint
calculated from the commit's content. Change one letter anywhere and the ID changes completely. That is why an old version
cannot be changed quietly. It is also why this file cannot show the ID of the commit that contains it: the ID is only known after
the file is saved. That row is filled in at the next update.</p>

<h3>History, branch, tag and HEAD</h3>
<div class="fig">{chain_svg()}</div>
<ul>
<li><b>History</b> is a chain: every commit points back to its parent.</li>
<li><b>Branch</b>: a name that points at the newest commit of a line of work and moves forward with every commit. <code>main</code> holds the released versions; each new version is built on its own side branch first (the upper row).</li>
<li><b>Tag</b> (<code>v1.0</code>): a permanent name for one commit. It never moves. This is how "go back to v1.1" stays easy.</li>
<li><b>HEAD</b>: "where you are now", the version the working folder is based on. Normally HEAD is on <code>main</code>.</li>
</ul>

<h2>4. Branches, testing and releases (how each version is made)</h2>
<p>Since v1.2 each version is built the way software teams do it (a simple "SDLC": build, test, release):</p>
<ol>
<li><b>Branch.</b> Start a side branch for the version, for example <code>git switch -c feature/v1.6-behaviour</code>. <code>main</code> is not touched,
so the last released version is always safe there.</li>
<li><b>Build in small steps,</b> each saved as its own commit on the branch (for v1.2: refactor, engine upgrade, the continuous dive).
The code is split into small files, one job each, so every part can be found and changed later.</li>
<li><b>Test locally</b> after every step: <code>node tools/serve.mjs</code> to play it at http://localhost:8080, and the test scripts
(<code>tests\\shot.py</code>, <code>ui.py</code>, <code>live.py</code>, <code>glide.py</code>, <code>solid.py</code>, <code>startup.py</code>, <code>life.py</code>, <code>controls.py</code>).</li>
<li><b>Show Hasib</b> before and after. Only if it looks better and nothing broke:</li>
<li><b>Release.</b> Set the version in <code>package.json</code>, merge the branch into <code>main</code> with a merge commit
(<code>git switch main</code> then <code>git merge --no-ff feature/...</code>), and tag it (<code>git tag -a v1.3 -m "..."</code>).</li>
<li><b>Report:</b> after every fix, a PDF report of what is on the website and what to do next (<code>python docs/make_report.py</code>, into <code>docs/reports</code>).</li>
<li><b>Record it:</b> add rows to <code>COMMITS</code> in <code>docs\\make_git_tracking.py</code>, run it, and commit the new PDF.</li>
<li><b>Publish</b> (later): <code>python tools\\build.py</code> makes <code>dist\\</code> with only the files a visitor needs; that folder goes to the host.</li>
</ol>
<p>If a step looks worse or breaks something, it is not committed; the files are put back with <code>git restore</code>. If a problem is found
only later, that one commit is undone with <code>git revert</code> (below), and the table shows it as "Undone". A whole branch can also simply be
left unmerged: <code>main</code> never saw it.</p>

<h2>5. How to look back and go back</h2>
<p>Type these in <b>Git Bash</b> (Start menu, "Git Bash") or in PowerShell, after moving into the project folder:
<code>cd C:\\Users\\hasib\\Downloads\\deep-drift-project</code>. Or ask Claude to do it.</p>
<table class="cmd">
<tr><td><code>git log --oneline --decorate</code></td><td>List every saved version, newest first, with IDs and tags.</td></tr>
<tr><td><code>git log --oneline --graph --all</code></td><td>The same, drawn with the branches and merges.</td></tr>
<tr><td><code>git status</code></td><td>Show which files changed since the last save. Safe, changes nothing.</td></tr>
<tr><td><code>git diff</code></td><td>Show the exact lines changed since the last save. Safe.</td></tr>
<tr><td><code>git show v1.1:dist/index.html &gt; old.html</code></td><td>v1.0 and v1.1 were one single file: this saves one as <code>old.html</code>,
without touching the project. Open it in a browser.</td></tr>
<tr><td><code>git switch --detach v1.2</code><br><code>node tools/serve.mjs</code><br>then <code>git switch main</code></td><td>Play any version from v1.2 on:
the folder turns into that version, the server runs it, and the last command comes back to the newest. Nothing is lost.
(Save or undo current edits first; git will warn you.)</td></tr>
<tr><td><code>git restore src/world.js</code></td><td>Throw away unsaved edits to one file, back to the last commit.</td></tr>
<tr><td><code>git revert 1a2b3c4</code></td><td>Undo one commit by adding a new commit that does the opposite. Later changes are kept,
and the history still shows what happened. <b>The safe way to undo.</b></td></tr>
</table>
<div class="box warn"><b>Careful:</b> <code>git reset --hard v1.0</code> makes the project exactly v1.0 and <b>deletes unsaved edits
and every commit after it</b> (tagged versions can still be recovered, others are hard to find). Use <code>git revert</code> or
<code>git switch</code> instead, or ask Claude first.</div>

<h2 class="pb">6. The table of saved versions</h2>
<p>Every commit, oldest first. The commit ID links a row to git: <code>git show 7929f37</code> shows everything in that commit.</p>
<table class="log">
<thead><tr><th>#</th><th>Version</th><th style="width:19mm">Commit ID</th><th style="width:17mm">Date</th><th style="width:30mm">Commit name</th><th>Detailed description</th><th>Status</th></tr></thead>
{"".join(rows)}
</table>

<h3>Planned (not saved yet)</h3>
<p class="muted">v1.1 (the realism work), v1.2 (the continuous dive), v1.3 (the solid world and faster start) v1.4 (smooth start, living pause, variety) and v1.5 (controls, zoom, level turning, home button) are done. After every fix there is also a report in docs/reports. What is left is below. Rows move into the table above when they are committed.</p>
<table class="log plan">
<thead><tr><th style="width:16mm">Version</th><th style="width:30mm">Change</th><th>What it will do</th></tr></thead>
{plan_rows}
</table>

<h2 class="pb">7. Before and after pictures</h2>
<p>Taken by the test script with the same settings, at the same moments of the dive. The test window counts as a small screen,
so these show the lighter phone-level detail.</p>
{"".join(f'<div class="fig"><img src="{picture(n)}" style="width:100%;border-radius:3px"><div class="cap">{c}</div></div>' for n, c in PICTURES)}

<h2>8. Words used in this guide</h2>
<table class="facts">
<tr><td>Repository (repo)</td><td>The project folder plus its <code>.git</code> history.</td></tr>
<tr><td>Commit</td><td>One saved snapshot of the whole project, with a message.</td></tr>
<tr><td>Commit ID (hash)</td><td>The fingerprint name of a commit, like <code>7929f37</code>.</td></tr>
<tr><td>Stage / staging area</td><td>The waiting list of changes for the next commit.</td></tr>
<tr><td>Branch</td><td>A moving name for the newest commit of a line of work: <code>main</code> for releases, a side branch per new version.</td></tr>
<tr><td>Merge</td><td>Bringing a side branch into <code>main</code>. The merge commit has two parents: the last commit on each line.</td></tr>
<tr><td>Release</td><td>A tested version merged into <code>main</code> and given a tag, like <code>v1.2</code>.</td></tr>
<tr><td>Tag</td><td>A fixed name for one commit, used for version numbers.</td></tr>
<tr><td>HEAD</td><td>The commit the working folder is currently based on.</td></tr>
<tr><td>Revert</td><td>Undo a commit by adding its opposite as a new commit.</td></tr>
<tr><td>Remote</td><td>A copy of the repository somewhere else, like GitHub. We have none yet.</td></tr>
</table>
</body></html>"""


def main():
    print_pdf(build_html(), OUT)


if __name__ == "__main__":
    main()
