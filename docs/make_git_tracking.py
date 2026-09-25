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
]

# Before and after pictures (section 7): (image in docs/img, caption)
PICTURES = [
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
    ("v1.4", "Animal behaviour", "Curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, "
     "flounder, scorpionfish, garden eels), deep-sea light displays, feeding at the vents and the whale skeleton. "
     "Also: animals steer around corals and rocks (today they only avoid the floor and the diver)."),
    ("v1.5+", "Real 3D models", "In small batches from Sketchfab, each with Hasib's OK on its licence and a credit in the page."),
    ("", "Phone check", "Try the dive on a real phone: speed, motion look (gyro), and the look-to-swim glide. Needs Hasib's phone."),
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
    """The history as circles: main along the bottom row, a side branch (lane "feature") on the row above,
    with the fork and the merge drawn as slanted lines. Drawn from COMMITS plus the next planned version."""
    nodes = []
    for c in COMMITS:
        f = lookup(c["subject"])
        lab = c["version"] or ("merge" if c.get("merge") else c["subject"].split(":")[0])
        nodes.append(dict(lab=lab, sub=f[0] if f else "this one", ver=bool(c["version"]), plan=False, lane=c.get("lane", "main"), merge=c.get("merge", False)))
    nodes.append(dict(lab=PLANNED[0][0] or "next", sub="planned", ver=True, plan=True, lane="main", merge=False))
    n, W, r = len(nodes), 720, 19
    step = (W - 60) / (n - 1); Y = {"main": 120, "feature": 55}; out = []
    X = [30 + k * step for k in range(n)]
    last = {"main": None, "feature": None}
    for k, nd in enumerate(nodes):   # lines to the parent(s) first, so circles sit on top
        y, parent = Y[nd["lane"]], last[nd["lane"]] if last[nd["lane"]] is not None else last["main"]
        dash = ' stroke-dasharray="4 3"' if nd["plan"] else ""
        col = "#aab7c2" if nd["plan"] else "#6f9bb8"
        if parent is not None: out.append(f'<line x1="{X[parent]:.0f}" y1="{Y[nodes[parent]["lane"]]}" x2="{X[k]:.0f}" y2="{y}" stroke="{col}" stroke-width="2"{dash}/>')
        if nd["merge"] and last["feature"] is not None: out.append(f'<line x1="{X[last["feature"]]:.0f}" y1="{Y["feature"]}" x2="{X[k]:.0f}" y2="{y}" stroke="#c9a24a" stroke-width="2"/>')
        last[nd["lane"]] = k
    for k, nd in enumerate(nodes):
        x, y = X[k], Y[nd["lane"]]
        stroke, fill, tc = ("#aab7c2", "#fff", "#8a97a3") if nd["plan"] else (("#5aa377", "#e9f6ee", "#1d6b3a") if nd["ver"] else (("#c9a24a", "#fff8e8", "#7a5a10") if nd["lane"] == "feature" else ("#6f9bb8", "#f4f9fc", "#0b3954")))
        dash = ' stroke-dasharray="4 3"' if nd["plan"] else ""
        out.append(f'<circle cx="{x:.0f}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"{dash}/>'
                   f'<text x="{x:.0f}" y="{y - 2}" text-anchor="middle" font-weight="700" font-size="9.5" fill="{tc}">{html.escape(nd["lab"])}</text>'
                   f'<text x="{x:.0f}" y="{y + 10}" text-anchor="middle" font-size="8" fill="#555">{html.escape(nd["sub"])}</text>')
        if nd["ver"] and not nd["plan"]:
            out.append(f'<rect x="{x - 26:.0f}" y="{y + r + 10}" width="52" height="17" rx="3" fill="#1d6b3a"/><text x="{x:.0f}" y="{y + r + 22}" text-anchor="middle" fill="#fff" font-size="9.5">tag {html.escape(nd["lab"])}</text>'
                       f'<line x1="{x:.0f}" y1="{y + r}" x2="{x:.0f}" y2="{y + r + 10}" stroke="#1d6b3a" stroke-width="2"/>')
    xl = X[n - 2]
    out.append(f'<rect x="{xl - 34:.0f}" y="{Y["main"] + r + 32}" width="68" height="17" rx="3" fill="#0b3954"/><text x="{xl:.0f}" y="{Y["main"] + r + 44}" text-anchor="middle" fill="#fff" font-size="9.5">main (HEAD)</text>')
    out.append(f'<text x="30" y="30" fill="#7a5a10" font-size="11">side branches: feature/... (one per version, where it was built)</text><text x="30" y="{Y["main"] + r + 72}" fill="#0b3954" font-size="11">main: released versions</text>')
    return ('<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial">' + "".join(out) + '</svg>')


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
<p>The rule from now on (<b>vMAJOR.MINOR</b>):</p>
<ul>
<li><b>MINOR goes up by one</b> for each finished, tested change to the dive: v1.1 (the realism work), v1.2 (the continuous dive), and so on.
After v1.9 comes v1.10, not v2.0.</li>
<li><b>MAJOR goes up</b> (v2.0) only for a very big change you decide on, for example a full redesign.</li>
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
<li><b>Branch.</b> Start a side branch for the version, for example <code>git switch -c feature/v1.4-behaviour</code>. <code>main</code> is not touched,
so the last released version is always safe there.</li>
<li><b>Build in small steps,</b> each saved as its own commit on the branch (for v1.2: refactor, engine upgrade, the continuous dive).
The code is split into small files, one job each, so every part can be found and changed later.</li>
<li><b>Test locally</b> after every step: <code>node tools/serve.mjs</code> to play it at http://localhost:8080, and the test scripts
(<code>tests\\shot.py</code>, <code>ui.py</code>, <code>live.py</code>, <code>glide.py</code>, <code>solid.py</code>, <code>startup.py</code>).</li>
<li><b>Show Hasib</b> before and after. Only if it looks better and nothing broke:</li>
<li><b>Release.</b> Set the version in <code>package.json</code>, merge the branch into <code>main</code> with a merge commit
(<code>git switch main</code> then <code>git merge --no-ff feature/...</code>), and tag it (<code>git tag -a v1.3 -m "..."</code>).</li>
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
<p class="muted">v1.1 (the realism work), v1.2 (the continuous dive) and v1.3 (the solid world and faster start) are done. What is left is below. Rows move into the table above when they are committed.</p>
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
