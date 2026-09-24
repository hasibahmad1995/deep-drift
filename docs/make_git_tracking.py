"""Makes docs/git-tracking.pdf: Hasib's guide to git for this project, plus a table of every saved version.
Run:  python docs/make_git_tracking.py
To add a new commit to the table: add an entry to COMMITS below (newest last), commit, then run this again.
Commit IDs and dates are read from git, so only the words need to be written here.
The PDF is printed by Microsoft Edge (or Chrome) in headless mode. No extra Python packages are needed."""
import html, os, pathlib, subprocess, tempfile

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
]

# Planned work, shown in its own table so it is never confused with saved versions.
PLANNED = [
    ("", "Test fixes", "Make the screenshot tests work on Windows (they save to /tmp), make the strict page policy "
     "actually apply in tests, and make build.py read and write files as UTF-8. Tools only, the dive does not change."),
    ("v1.1", "Reef wall", "Real rock pattern on the wall, ledges and overhangs, more coral and sponges on the wall, "
     "less haze close to the wall."),
    ("v1.2", "Wreck", "Proper ship hull (keel, flat sides, deck, pointed bow), rails, broken planks, a hole, rust, "
     "growth on the hull, better torch light."),
    ("v1.3", "Trench", "Layered rock, fallen boulders, sea cucumbers and shrimp, a faint glow so it is not pure black."),
    ("v1.4", "Deep animals", "Thicker, brighter tube worm clusters, brighter anglerfish lure, snailfish and dumbo "
     "octopus passing closer to the camera."),
    ("v1.5", "Solid corals", "The diver can no longer swim through tall corals."),
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


def find_browser():
    for p in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(p):
            return p
    raise SystemExit("Could not find Edge or Chrome to print the PDF.")


def git_path():
    """Returns [the git Windows uses, the git used inside Git Bash] (either may be missing)."""
    found = subprocess.run(["where", "git"], capture_output=True, text=True, shell=True).stdout.splitlines()
    return sorted({p.strip() for p in found if p.strip()}, key=lambda p: "\\cmd\\" not in p)


def folder_size(p):
    return sum(f.stat().st_size for f in p.rglob("*") if f.is_file())


# ---------------------------------------------------------------------------
CSS = """
@page { size: A4; margin: 16mm 15mm 16mm 15mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.2pt; line-height: 1.5; color: #1d2530; margin: 0; }
h1 { font-size: 22pt; margin: 0 0 2mm; color: #0b3954; letter-spacing: -0.3px; }
h2 { font-size: 14pt; color: #0b3954; margin: 8mm 0 2mm; padding-bottom: 1.5mm; border-bottom: 2px solid #bfd7e6; break-after: avoid; }
h3 { font-size: 11pt; margin: 5mm 0 1.5mm; color: #16324a; break-after: avoid; }
p { margin: 0 0 2.5mm; }
ul, ol { margin: 0 0 2.5mm; padding-left: 6mm; }
li { margin-bottom: 1mm; }
code, .mono { font-family: Consolas, "Cascadia Mono", monospace; font-size: 9.2pt; background: #eef3f7; padding: 0 1.2mm; border-radius: 2px; }
pre { font-family: Consolas, monospace; font-size: 9.2pt; background: #0f2233; color: #e6f0f7; padding: 3mm 4mm; border-radius: 3px; margin: 1mm 0 3mm; white-space: pre-wrap; break-inside: avoid; }
pre .c { color: #8fb3cc; }
.sub { color: #52606d; font-size: 10.5pt; margin-bottom: 5mm; }
.box { border: 1px solid #bfd7e6; background: #f4f9fc; border-radius: 4px; padding: 3mm 4mm; margin: 2mm 0 4mm; break-inside: avoid; }
.warn { border-color: #e7b9a4; background: #fdf4ef; }
.facts { width: 100%; border-collapse: collapse; margin: 1mm 0 4mm; }
.facts td { border-bottom: 1px solid #dde6ec; padding: 1.6mm 2mm; vertical-align: top; }
.facts td:first-child { width: 42mm; font-weight: 600; color: #16324a; }
table.log { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2mm; }
table.log th { background: #0b3954; color: #fff; text-align: left; padding: 2mm; font-weight: 600; }
table.log td { border: 1px solid #cfdbe4; padding: 2mm; vertical-align: top; }
table.log tr { break-inside: avoid; }
table.log thead { display: table-header-group; }
h3 + p + table.log, h3 + p { break-after: avoid; }
table.log td.v { font-weight: 700; color: #0b3954; white-space: nowrap; }
table.log .lbl { font-weight: 600; color: #16324a; }
table.log ul { padding-left: 4mm; margin: 0.5mm 0 1.5mm; }
table.log li { margin-bottom: 0.4mm; }
.plan td { color: #3d4a56; }
.pill { display: inline-block; padding: 0 2mm; border-radius: 8px; font-size: 8.5pt; font-weight: 600; }
.kept { background: #dcf2e3; color: #1d6b3a; }
.undone { background: #fbe0da; color: #9a2f1c; }
.muted { color: #6b7883; }
.cmd { width: 100%; border-collapse: collapse; margin: 1mm 0 4mm; font-size: 9.5pt; }
.cmd tr { break-inside: avoid; }
.cmd td { border-bottom: 1px solid #dde6ec; padding: 1.8mm 2mm; vertical-align: top; }
.cmd td:first-child { width: 48%; }
.fig { margin: 2mm 0 4mm; text-align: center; break-inside: avoid; }
.fig svg { width: 100%; height: auto; }
.cap { font-size: 8.8pt; color: #52606d; margin-top: 1mm; }
.pb { break-before: page; }
"""

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

CHAIN_SVG = """
<svg viewBox="0 0 720 170" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial" font-size="13">
 <defs><marker id="b" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#6f9bb8"/></marker></defs>
 <g>
  <circle cx="80" cy="95" r="30" fill="#e9f6ee" stroke="#5aa377" stroke-width="2"/><text x="80" y="92" text-anchor="middle" font-weight="700" fill="#1d6b3a">v1.0</text><text x="80" y="108" text-anchor="middle" font-size="11" fill="#555">7929f37</text>
  <circle cx="220" cy="95" r="30" fill="#f4f9fc" stroke="#6f9bb8" stroke-width="2"/><text x="220" y="92" text-anchor="middle" font-weight="700" fill="#0b3954">docs</text><text x="220" y="108" text-anchor="middle" font-size="11" fill="#555">guide</text>
  <circle cx="360" cy="95" r="30" fill="#fff" stroke="#aab7c2" stroke-width="2" stroke-dasharray="4 3"/><text x="360" y="92" text-anchor="middle" font-weight="700" fill="#8a97a3">v1.1</text><text x="360" y="108" text-anchor="middle" font-size="11" fill="#8a97a3">planned</text>
  <circle cx="500" cy="95" r="30" fill="#fff" stroke="#aab7c2" stroke-width="2" stroke-dasharray="4 3"/><text x="500" y="92" text-anchor="middle" font-weight="700" fill="#8a97a3">v1.2</text><text x="500" y="108" text-anchor="middle" font-size="11" fill="#8a97a3">planned</text>
  <text x="600" y="100" fill="#8a97a3" font-size="20">. . .</text>
  <line x1="188" y1="95" x2="112" y2="95" stroke="#6f9bb8" stroke-width="2" marker-end="url(#b)"/>
  <line x1="328" y1="95" x2="252" y2="95" stroke="#aab7c2" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#b)"/>
  <line x1="468" y1="95" x2="392" y2="95" stroke="#aab7c2" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#b)"/>
 </g>
 <rect x="40" y="20" width="80" height="24" rx="4" fill="#1d6b3a"/><text x="80" y="37" text-anchor="middle" fill="#fff" font-size="12">tag: v1.0</text>
 <line x1="80" y1="44" x2="80" y2="63" stroke="#1d6b3a" stroke-width="2"/>
 <rect x="170" y="20" width="100" height="24" rx="4" fill="#0b3954"/><text x="220" y="37" text-anchor="middle" fill="#fff" font-size="12">main (HEAD)</text>
 <line x1="220" y1="44" x2="220" y2="63" stroke="#0b3954" stroke-width="2"/>
 <text x="360" y="155" text-anchor="middle" fill="#52606d" font-size="11.5">Each commit points back to the one before it. "main" moves forward with every new commit; a tag never moves.</text>
</svg>"""


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
<tr><td>Branch</td><td><code>{esc(branch)}</code> (the main line of work; see section 3)</td></tr>
<tr><td>Tags (named versions)</td><td>{", ".join("<code>" + esc(t) + "</code>" for t in tags) or "none"}</td></tr>
<tr><td>Online copy</td><td>{"<code>" + esc(remote) + "</code>" if remote else "None. The history exists only on this computer. If the project folder is lost, the history is lost too. Putting a copy on GitHub (private) would fix that; ask when you want it."}</td></tr>
<tr><td>Plain backup page</td><td><code>backup\\deep-drift-v1.0.html</code>. Double-click it to play the v1.0 dive. No git needed.</td></tr>
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
<li><b>MINOR goes up by one</b> for each finished, tested change to the dive: v1.1 (reef wall), v1.2 (wreck), and so on.
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
<div class="fig">{CHAIN_SVG}</div>
<ul>
<li><b>History</b> is a chain: every commit points back to its parent.</li>
<li><b>Branch</b> (<code>main</code>): a name that points at the newest commit and moves forward with every commit. We use only one branch.</li>
<li><b>Tag</b> (<code>v1.0</code>): a permanent name for one commit. It never moves. This is how "go back to v1.1" stays easy.</li>
<li><b>HEAD</b>: "where you are now", the version the working folder is based on. Normally HEAD is on <code>main</code>.</li>
</ul>

<h2>4. How each change will be made</h2>
<ol>
<li>Edit the source files in <code>src\\</code> (never <code>dist\\index.html</code> by hand).</li>
<li>Rebuild: <code>python build.py</code>, which writes <code>dist\\index.html</code>.</li>
<li>Test: syntax checks, screenshots at the same dive moments as before, check for page errors.</li>
<li>Show Hasib before and after. Only if it looks better and nothing broke:</li>
<li>Commit, with a message that says what changed and why: <code>git add -A</code> then <code>git commit</code>.</li>
<li>Tag it with the next version number: <code>git tag -a v1.1 -m "..."</code></li>
<li>Add a row to <code>COMMITS</code> in <code>docs\\make_git_tracking.py</code>, run it, and commit the new PDF.</li>
</ol>
<p>If a change looks worse or breaks something, it is not committed; the files are put back with <code>git restore</code>. If a
problem is found only later, that one commit is undone with <code>git revert</code> (below), and the table shows it as "Undone".</p>

<h2>5. How to look back and go back</h2>
<p>Type these in <b>Git Bash</b> (Start menu, "Git Bash") or in PowerShell, after moving into the project folder:
<code>cd C:\\Users\\hasib\\Downloads\\deep-drift-project</code>. Or ask Claude to do it.</p>
<table class="cmd">
<tr><td><code>git log --oneline --decorate</code></td><td>List every saved version, newest first, with IDs and tags.</td></tr>
<tr><td><code>git status</code></td><td>Show which files changed since the last save. Safe, changes nothing.</td></tr>
<tr><td><code>git diff</code></td><td>Show the exact lines changed since the last save. Safe.</td></tr>
<tr><td><code>git show v1.0:dist/index.html &gt; old.html</code></td><td>Get the playable page of any version as a separate file,
without touching the project. Open <code>old.html</code> in a browser.</td></tr>
<tr><td><code>git switch --detach v1.0</code><br>then <code>git switch main</code></td><td>Visit an old version: the folder turns into v1.0.
The second command comes back to the newest. Nothing is lost. (Save or undo current edits first; git will warn you.)</td></tr>
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
<p class="muted">Order proposed on 24 Sep 2026, not yet confirmed by Hasib. Rows move into the table above when they are committed. The version numbers may shift if the order changes.</p>
<table class="log plan">
<thead><tr><th style="width:16mm">Version</th><th style="width:30mm">Change</th><th>What it will do</th></tr></thead>
{plan_rows}
</table>

<h2>7. Words used in this guide</h2>
<table class="facts">
<tr><td>Repository (repo)</td><td>The project folder plus its <code>.git</code> history.</td></tr>
<tr><td>Commit</td><td>One saved snapshot of the whole project, with a message.</td></tr>
<tr><td>Commit ID (hash)</td><td>The fingerprint name of a commit, like <code>7929f37</code>.</td></tr>
<tr><td>Stage / staging area</td><td>The waiting list of changes for the next commit.</td></tr>
<tr><td>Branch</td><td>A moving name for the newest commit of a line of work. Ours is <code>main</code>.</td></tr>
<tr><td>Tag</td><td>A fixed name for one commit, used for version numbers.</td></tr>
<tr><td>HEAD</td><td>The commit the working folder is currently based on.</td></tr>
<tr><td>Revert</td><td>Undo a commit by adding its opposite as a new commit.</td></tr>
<tr><td>Remote</td><td>A copy of the repository somewhere else, like GitHub. We have none yet.</td></tr>
</table>
</body></html>"""


def main():
    page = build_html()
    browser = find_browser()
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / "git-tracking.html"
        src.write_text(page, encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--user-data-dir={tmp}/profile", f"--print-to-pdf={OUT}", src.as_uri()],
                       check=True, capture_output=True, timeout=120)
    print("wrote", OUT, round(OUT.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
