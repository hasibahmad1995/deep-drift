"""Makes the report PDF Hasib asked for after every fix: what is on the website now, what changed, and what to do next.
Run:  python docs/make_report.py            (the newest report)
      python docs/make_report.py v1.4       (one version)
Writes docs/reports/report-<version>.pdf. To add a report: add an entry to REPORTS (newest last) and update SITE
if the website itself changed. Pictures live in docs/reports/img/. Plain words, no em dashes."""
import html, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pdf_tools import BASE_CSS, embed, print_pdf

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "docs" / "reports" / "img"

# ---------------------------------------------------------------------------
# What is on the website now. Kept up to date with each report.
# ---------------------------------------------------------------------------
SITE = dict(
    summary="Deep Drift is a first-person dive in the browser, from the sunlit surface to the floor of the Challenger Deep "
            "(10,935 m), as one continuous descent of about 7 minutes. You are the diver: you drift toward wherever you look "
            "and you are always sinking. The places are real kinds of places moved closer together, and the descent is sped up; "
            "the page says so.",
    route=[
        ("Surface and coral reef", "0 to 60 m", "A boat above you, dolphins passing at the start, a reef shelf and wall covered in corals, sponges, sea fans and anemones. Barramundi schools (the one real 3D model), reef fish schools, blacktip reef sharks, a green sea turtle, a giant manta ray, moon jellies."),
        ("Reef drop-off and deep reef", "60 to 200 m", "The wall continues into the blue: big sea fans and black corals. A whale shark, a great white shark and a humpback whale pass by; a school of silver jacks swirls beside you."),
        ("Twilight zone", "200 to 1,000 m", "Light fades. Jellyfish, hatchetfish, lanternfish, a sperm whale hunting, a siphonophore (a glowing chain of animals), a vampire squid."),
        ("Midnight zone", "1,000 to 1,600 m", "Only your torch and lamp. A giant squid, an anglerfish with its glowing lure, a gulper eel with a glowing tail tip, glowing jellyfish."),
        ("Hydrothermal vents", "about 1,600 m", "Smoking chimneys, giant tube worms, vent shrimp swarms, droplets of liquid CO2."),
        ("Volcano slope", "1,600 to 4,500 m", "Bamboo corals, glass sponges, sea lilies, brittle stars."),
        ("Abyssal plain", "about 5,000 m", "An imagined shipwreck with rusticles, a whale skeleton, manganese nodules, sea pigs, xenophyophores, dumbo octopuses, grenadiers and tripod fish."),
        ("Trench and Challenger Deep", "6,000 to 10,935 m", "The trench wall, Mariana snailfish (only between about 6,500 and 8,300 m, as in reality), sea cucumbers, amphipods, and the deepest floor."),
    ],
    controls=[
        ("Look and swim", "Drag with the mouse or a finger. You slowly swim toward where you look. Looking up slows your sinking, looking down speeds it up; you can never swim back up."),
        ("Arrow keys", "Turn your head smoothly, always around the true vertical with the horizon level (it speeds up while held and eases to a stop)."),
        ("Side panel", "A small handle on the left edge. Move the mouse over it (or tap it on a phone) to show Pause, Music and Zoom; otherwise it stays hidden."),
        ("Pause", "In the side panel, or Space. You hover in place while the sea keeps moving around you. Play to swim on."),
        ("Zoom", "In the side panel: each press zooms a step in (up to 2.5x, less in murky water) and then back out step by step; hold it to zoom smoothly. Pinch or the mouse wheel also zoom."),
        ("Music", "In the side panel. A live soundtrack made in the browser."),
        ("Deep Drift (top left)", "The home button: back to the start screen. Begin starts a new dive, and every dive is a little different. The end of the dive also brings you back there."),
        ("Recenter view", "Button or double-click: look along the dive again."),
        ("Phones", "The top buttons sit in a Menu. Motion look turns the view with the phone."),
        ("Blog and Credits", "Short posts in our own words with source links; credits say what is real and what is built by code."),
    ],
    feel=[
        "Nothing passes through you: corals, rocks, sponges, tube worms, the wreck and the bones are solid, and you slide around them.",
        "Animals keep a comfortable distance and swim aside; big ones (whales, the whale shark, the manta) gently push you aside.",
        "School fish part around you and beat their tails as fast as real fish of their size.",
        "Nothing pops in or out: visitors arrive from out of sight and leave out of sight; far things fade into the water.",
        "Each dive is different: scripted animals meet you at a new depth each time (always within the depths where they really live), on either side, nearer or farther, and some are not there every time; random visitors come and go too.",
        "Animals only live where they really live (for example no fish below about 8,300 m).",
    ],
    real="Real: the barramundi (a CC0 3D model by Microsoft from the Khronos glTF samples) and the fonts. Everything else "
         "(all other animals, corals, rocks, the wreck, the water, the light) is built by code, so it is stylised, not photographic.",
    run="On your computer: in the project folder run <code>node tools/serve.mjs</code> (or <code>npm start</code>) and open "
        "http://localhost:8080. Nothing is loaded from other websites.",
)

# ---------------------------------------------------------------------------
# One entry per version, newest last.
# ---------------------------------------------------------------------------
REPORTS = {
    "v1.4": dict(
        date="25 September 2026",
        title="A smooth start, a living pause, a new dive every time",
        oneline="Five things Hasib noticed while testing v1.3 are fixed: the blink and lag at the start, jerky keyboard turning, "
                "the same animals every dive, a pause that froze the whole sea, and school fish that looked too slow.",
        fixes=[
            dict(asked="The camera blinks and lags at the beginning.",
                 found="Measured on this laptop's own graphics (Intel UHD) at its screen size (1536x864 at 125%). The reef, which "
                       "is the start of the dive, took 50 to 70 ms per picture (about 15 to 20 pictures a second). After a few "
                       "seconds the automatic sharpness control lowered the resolution; that change cleared the picture for one "
                       "frame (a blink) and caused a 170 to 200 ms hitch. A second blink came from Begin itself: the picture cut to "
                       "black and faded back in.",
                 did="Before Begin, the page now draws the busy reef a few times and picks the sharpness that gives about 30 ms per "
                     "picture, so nothing has to change during the dive. Sharpness changes only after about a second of slow "
                     "pictures, and never between drawing and showing a picture. Edge smoothing is off on scaled screens (it cost "
                     "about a fifth of each picture there). The rock grain skips detail you cannot see at a distance; coral shapes "
                     "share their corners so the graphics card does less work. The loading screen no longer freezes for long. "
                     "Begin now fades the intro card away over the live picture.",
                 result="On this laptop: the first 8 to 12 s of the dive run at a steady 60 pictures a second with no hitch over 33 ms "
                        "(v1.3: 200 ms), no resolution change during the dive, and the longest freeze while loading is 0.37 s "
                        "(v1.3: 1.85 s). The price: on this laptop the picture is drawn at about 0.86 to 1.0 of the screen's "
                        "sharpness, so it is a little softer."),
            dict(asked="Keyboard rotations are not smooth.",
                 found="Each arrow key press jumped the view by 7 degrees, and holding the key repeated those jumps in steps after "
                       "a half-second delay.",
                 did="Holding an arrow key now turns the head smoothly: it speeds up to a steady turn (about 75 degrees a second) and "
                     "eases to a stop when let go, like turning your head.",
                 result="Measured: the biggest change from one picture to the next is 0.14 degrees, and the turn stops smoothly."),
            dict(asked="Animals and fish play the same all the time; it could be randomised so it does not become boring.",
                 found="All the scripted animals (the turtle, the manta, the sharks, the whales, the squid, the anglerfish and more) "
                       "were placed by hand at fixed times and places.",
                 did="Every dive, and every restart, rolls a new version: each scripted animal comes a few seconds earlier or later, "
                     "nearer or farther, from either side, a little faster or slower, and about one dive in seven it is not there. "
                     "Circling sharks, grenadiers and schools start anywhere on their circle and may circle the other way; jellyfish "
                     "drift from new spots; the dolphins still travel as one pod. Every version is checked so no animal swims "
                     "through rock; if no version is clear, that animal is simply not in that dive.",
                 result="73 of 74 scripted animals change between dives; 1 to 7 are absent in a given dive; 0 paths through rock "
                        "within 50 m of the dive path. The check also found three older mistakes and fixed them: the three reef "
                        "sharks circled through the reef wall, and the manta met you inside the wall (it now glides over you)."),
            dict(asked="The pause button freezes everything; the diver could be frozen while other movement goes on.",
                 found="Everything in the sea moved by the dive's clock, so pausing the dive stopped the whole world.",
                 did="Pause now stops only the diver: you hover in place. The sea has its own clock: schools, circling sharks and "
                     "jellyfish keep swimming, animals passing by swim on (when you continue they have moved on, as in real life), "
                     "and new visitors still come past. Your breathing, bubbles and gentle sway go on.",
                 result="Measured over 3 s of pause: the diver moved 0.08 m (the breathing bob), the dive time did not move, and all "
                        "8 nearby schools and all 12 nearby animals kept moving."),
            dict(asked="Schools of fish do not swim that slowly in real life; check this and give a real-life feeling.",
                 found="Checked against research: fish cruise at about 1 to 3 body lengths a second, and each tail beat moves a fish "
                       "about 0.7 of its body length (Bainbridge 1958). Our 18 cm reef fish already moved 1.1 to 1.4 m/s but beat "
                       "their tails only about twice a second, so they looked like they were gliding in slow motion. Each school "
                       "also circled as one rigid block at a constant speed.",
                 did="Small schooling fish now beat their tails about 8 times a second (lanternfish and hatchetfish about 5, the "
                     "barramundi about 2, big animals unchanged: a whale shark beats once every few seconds). Schools surge: their "
                     "speed rises and falls by about 40%. Each fish weaves a little on its own and faces the way it really moves.",
                 result="Measured on a reef school over 40 s: its speed ranged from about half to about twice its average. "
                        "Source: R. Bainbridge (1958), The speed of swimming of fish as related to size and to the frequency and "
                        "amplitude of the tail beat, Journal of Experimental Biology 35: 109-133, "
                        "https://journals.biologists.com/jeb/article/35/1/109/13233."),
        ],
        tests=[
            ("Opening, on this laptop's graphics (tests/startup.py --gpu)", "Begin ready in 3.4 s; first 8 s of the dive at 60 pictures a second, no hitch over 17 ms; 0 shaders built late"),
            ("Solid world and no pops (tests/solid.py)", "Whole dive plus reef and wreck runs: 0 times inside something solid, 0 animal or fish overlaps, 0 pops, 0 jumps; whale shark pushes the diver, a jellyfish is nudged away"),
            ("Pause, variety, keys, schools (tests/life.py, new)", "All pass (numbers above)"),
            ("Swimming (tests/glide.py)", "Steers, never rises, sinks slower looking up and faster looking down, roaming limit works"),
            ("Menus on phone and desktop (tests/ui.py), live play (tests/live.py)", "Pass, no page errors"),
        ],
        pictures=[("v1.4-start.jpg", "The start of the dive on Hasib's laptop, v1.3 and v1.4."),
                  ("v1.4-intro.jpg", "The start page (the loading message counts up; Begin fades this card away)."),
                  ("v1.4-dive.jpg", "The dive on Hasib's laptop at its screen size: reef at 6, 15 and 34 m, the drop-off at 155 m, "
                   "the vents at 1,575 m, the abyssal plain at 5,435 m.")],
        limits=[
            "On this laptop the reef is drawn a little softer (about 0.86 to 1.0 of full sharpness) to stay smooth. The reef (corals and rock shading) is still the heaviest part.",
            "Animals are kept off rock and the floor but not off corals, and beyond 50 m from the dive path a straight-swimming animal can still meet rock (hidden by the water and by the rock itself).",
            "The solid shapes are simple, so you stop a little before thin, airy corals such as fans.",
            "Deep scenes are lit only by your torch and lamp, so far rock is dark; animals right in front of the torch look paler than they should.",
            "Nothing has been tried on a real phone yet.",
        ],
        next=[
            ("v1.5", "Animal behaviour", "Curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, flounder, scorpionfish, garden eels), deep-sea light displays, feeding at the vents and the whale skeleton, animals steering around corals."),
            ("any time", "Phone check", "Try the dive on a real phone (speed, motion look, the glide). Needs your phone."),
            ("any time", "Lighter reef", "Draw far corals with simpler shapes so laptops like this one can use full sharpness."),
            ("after testing", "Publish", "First public version on GitHub Pages (free). Needs a GitHub account."),
            ("v1.6+", "Real 3D models", "In small batches from Sketchfab, each with your OK on its licence and a credit on the page."),
        ],
    ),
    "v1.5": dict(
        date="26 September 2026",
        title="Smooth zoom, level turning, a side panel and a home button",
        oneline="Five things Hasib found in v1.4 are fixed: the zoom button, turning with the arrow keys on steep parts of the dive, "
                "where the Pause, Music and Zoom buttons live, going back to the start, and seeing the same animals at the same places.",
        fixes=[
            dict(asked="The zoom button lags. It should zoom in gradually and, once at the highest point, gradually come back down.",
                 found="Each press jumped between three fixed levels (1x, 1.6x, 2.4x) and then straight back to 1x. Also, deeper than about "
                       "200 m the murky-water limit held zoom at 1.2x, so a press often seemed to do nothing. And when zoomed, small corals "
                       "still disappeared at the distance meant for normal view.",
                 did="Each press now moves one smooth step: 1x, 1.3x, 1.6x, 2x, 2.5x, then back down 2x, 1.6x, 1.3x, 1x, and so on. Holding the "
                     "button zooms smoothly, turning round at each end. The button says what the next press does (Zoom in or Zoom out). The "
                     "limit in deep, clear water is now 1.5x to 2.5x. When zoomed, small corals are drawn farther out, as they should be.",
                 result="Measured: presses gave 1.3, 1.6, 2, 2.5, 2, 1.6, 1.3, 1, 1.3; holding changes the zoom smoothly (no step over 0.5x in 0.3 s)."),
            dict(asked="When paused and turning with the arrow keys, the view goes round in a circle; we cannot look sideways. It should be the normal free view, just frozen in place.",
                 found="Turning happened around the dive path's own tilted axis. Where the dive heads steeply down (up to about 45 degrees), turning "
                       "left or right therefore swung the view around in a circle instead of turning your head. It shows most while paused, "
                       "because nothing else moves then.",
                 did="Turning left and right is now always around the true vertical, with the horizon level, like turning your head: while paused "
                     "and while diving.",
                 result="Measured after turning 90 degrees at four points of the dive (including a 43-degree dive slope): the horizon stays level "
                        "(the only tilt left is the diver's gentle sway of up to about 1 degree)."),
            dict(asked="Move Play, Music and Zoom to the left side of the screen, stacked up and down, shown only when hovering over them.",
                 found="All buttons sat in one row at the top right.",
                 did="A slim handle on the left edge. Move the mouse over it and Pause (or Play), Music and Zoom slide out, stacked; move away "
                     "and they hide again. On a phone, tap the handle to open or close it. The keyboard can still reach them.",
                 result="Checked: hidden when the mouse is away, shown while hovering."),
            dict(asked="Deep Drift should be a home button; remove Restart. Home should go to the start screen with the Begin button, and "
                       "the start screen should explain the hover panel.",
                 found="Restart jumped straight back to the surface without the start screen.",
                 did="Clicking Deep Drift at the top goes back to the start screen (the dive fades back to the surface behind it), and Begin "
                     "starts a new dive. The Restart button is gone. The end of the dive now also returns to the start screen. The start "
                     "screen has a new line: move the mouse to the left edge (or tap its handle) for Pause, Music and Zoom; click Deep Drift "
                     "to come back and start a new dive.",
                 result="Checked: home shows the start screen with the dive reset; Begin starts again."),
            dict(asked="However many times I restart, the animals should be different, but deep-ocean animals must never be seen near the surface.",
                 found="In v1.4 each scripted animal only moved a few seconds and metres from its fixed place, so it was always met at about the "
                       "same spot.",
                 did="Each dive now picks where each scripted animal meets you: anywhere the dive is within the depths where that animal really "
                     "lives, from one shared list (for example the turtle from the surface to 90 m, the whale shark 10 to 300 m, the sperm "
                     "whale 300 to 1,500 m, snailfish 6,000 to 8,300 m). Animals that sink along with you stay within their depths for the "
                     "whole time they are beside you. About one in five is absent in a given dive, and random visitors add more.",
                 result="Measured over 6 dives: 39 scripted animals with a depth range, none met outside its depths; for example the whale "
                        "shark was met at about 40, 80, 160 and 180 m, the sperm whale at 440 to 960 m, the giant squid at 310 to 840 m."),
        ],
        tests=[
            ("Zoom, turning, side panel, home, depths (tests/controls.py, new)", "All pass (numbers above); no animal met outside its depths or above the water"),
            ("Opening on this laptop's graphics (tests/startup.py --gpu)", "First 8 s of the dive at 60 pictures a second, no hitch over 17 ms"),
            ("Solid world and no pops (tests/solid.py)", "0 inside something solid, 0 overlaps, 0 pops, 0 jumps, contact checks pass"),
            ("Pause, variety, keys, schools (tests/life.py)", "All pass; 0 animal paths through rock"),
            ("Swimming, menus, live play (glide.py, ui.py, live.py)", "Pass; live play now opens the side panel and uses the home button"),
        ],
        pictures=[("v1.5-controls.jpg", "On Hasib's laptop: the start screen with the new hint; the dive with the side panel closed (only its "
                   "handle on the left edge); the mouse over the edge opens Pause, Music and Zoom; zoomed in to 2.5x.")],
        limits=[
            "Also found and fixed while testing: near the surface, the dolphins and the turtle could drift up out of the water with the new meeting moments (all animals now stay in the water); swimming into the lip of the reef shelf from the side could lift you 3 m at once (the lip now stops you like a wall); a big animal could shove you 3 m in one moment (big animals now nudge you gently before they touch).",
            "On Hasib's laptop the reef is still drawn a little softer (about 0.86 to 1.0 of full sharpness) to stay smooth.",
            "Animals are kept off rock and the floor but not off corals; beyond 50 m from the dive path a straight-swimming animal can still meet rock (hidden by the water and the rock).",
            "Deep scenes are lit only by your torch and lamp; animals right in front of the torch look paler than they should.",
            "Nothing has been tried on a real phone yet (the side panel's handle is made for touch, but untested).",
        ],
        next=[
            ("v1.6", "Animal behaviour", "Curious and startled school fish, predators chasing schools, hidden animals (day octopus with ink, flounder, scorpionfish, garden eels), deep-sea light displays, feeding at the vents and the whale skeleton, animals steering around corals."),
            ("any time", "Phone check", "Try the dive on a real phone (speed, the side panel, motion look, the glide). Needs your phone."),
            ("any time", "Lighter reef", "Draw far corals with simpler shapes so laptops like this one can use full sharpness."),
            ("after testing", "Publish", "First public version on GitHub Pages (free). Needs a GitHub account."),
            ("v1.7+", "Real 3D models", "In small batches from Sketchfab, each with your OK on its licence and a credit on the page."),
        ],
    ),
}


def esc(s):
    return html.escape(s, quote=False)


CSS = BASE_CSS + """
.fix { border: 1px solid #cfdbe4; border-radius: 4px; padding: 3mm 4mm; margin: 0 0 3.5mm; break-inside: avoid; }
.fix h3 { margin: 0 0 1.5mm; }
.fix .k { font-weight: 600; color: #16324a; }
.fig img { width: 100%; border: 1px solid #cfdbe4; }
table.route td:first-child { width: 44mm; font-weight: 600; color: #16324a; }
table.route td:nth-child(2) { width: 30mm; white-space: nowrap; color: #52606d; }
table.ctl td:first-child { width: 36mm; font-weight: 600; color: #16324a; }
"""


def build(version):
    r = REPORTS[version]
    fixes = "".join(f"""<div class="fix"><h3>{i + 1}. {esc(f['asked'])}</h3>
<p><span class="k">What we found:</span> {esc(f['found'])}</p>
<p><span class="k">What we did:</span> {esc(f['did'])}</p>
<p><span class="k">Result:</span> {esc(f['result'])}</p></div>""" for i, f in enumerate(r["fixes"]))
    tests = "".join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td></tr>" for a, b in r["tests"])
    route = "".join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>" for a, b, c in SITE["route"])
    controls = "".join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td></tr>" for a, b in SITE["controls"])
    feel = "".join(f"<li>{esc(x)}</li>" for x in SITE["feel"])
    limits = "".join(f"<li>{esc(x)}</li>" for x in r["limits"])
    nxt = "".join(f"<tr><td class='v'>{esc(v)}</td><td><b>{esc(a)}</b></td><td>{esc(b)}</td></tr>" for v, a, b in r["next"])
    pics = "".join(f"<div class='fig'><img src='{embed(IMG / n)}'><div class='cap'>{esc(c)}</div></div>" for n, c in r["pictures"])
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>Deep Drift report {version}</title><style>{CSS}</style></head><body>
<h1>Deep Drift {version}: {esc(r['title'])}</h1>
<div class="sub">Report for Hasib, {esc(r['date'])}. What is on the website now, what changed in this version, and what to do next.</div>
<div class="box"><b>In one sentence:</b> {esc(r['oneline'])}</div>

<h2>1. What changed in {version}</h2>
{fixes}

<h2>2. Tests</h2>
<table class="cmd">{tests}</table>

<h2>3. Pictures</h2>
{pics}

<h2 class="pb">4. What is on the website now</h2>
<p>{esc(SITE['summary'])}</p>
<h3>The dive, top to bottom</h3>
<table class="cmd route">{route}</table>
<h3>How you control it</h3>
<table class="cmd ctl">{controls}</table>
<h3>How it feels</h3>
<ul>{feel}</ul>
<h3>What is real</h3>
<p>{esc(SITE['real'])}</p>
<h3>Running it</h3>
<p>{SITE['run']}</p>

<h2>5. Known limits (honest list)</h2>
<ul>{limits}</ul>

<h2>6. What to do next</h2>
<table class="log plan"><thead><tr><th>When</th><th>What</th><th>Details</th></tr></thead><tbody>{nxt}</tbody></table>
</body></html>"""


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else list(REPORTS)[-1]
    print_pdf(build(version), ROOT / "docs" / "reports" / f"report-{version}.pdf")


if __name__ == "__main__":
    main()
