"""Rebuilds the table in docs/commit-log.md from git itself: every commit, newest first, with its branch, version,
and whether it is uploaded to GitHub and live on the website.
Run:  python tools/commit_log.py        (after committing, and again after uploading)
- Uploaded = GitHub has it (it is inside one of the branches this folder last sent or fetched, refs/remotes/origin/*).
- Live = it is inside GitHub's main, which Cloudflare Pages publishes.
Only the part between the two TABLE markers is rewritten; the notes above it are kept as they are."""
import pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG = ROOT / "docs" / "commit-log.md"
START, END = "<!-- TABLE START (made by tools/commit_log.py) -->", "<!-- TABLE END -->"


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout.strip()


def contained(ref):
    """Every commit reachable from ref (empty if ref does not exist)."""
    return set(git("rev-list", ref).split()) if git("rev-parse", "--verify", "--quiet", ref) else set()


def main():
    remotes = git("for-each-ref", "--format=%(refname)", "refs/remotes/origin").split()
    uploaded = set().union(*[contained(r) for r in remotes]) if remotes else set()
    live = contained("refs/remotes/origin/main")
    on_main = set(git("rev-list", "--first-parent", "main").split())
    # each feature branch and the commits it holds, smallest first: a commit belongs to the smallest branch holding it
    # (later branches also hold the older history, so "the first branch found" would be wrong)
    feature = sorted(((b, contained(b)) for b in git("for-each-ref", "--format=%(refname:short)", "refs/heads").split() if b != "main"),
                     key=lambda bc: len(bc[1]))
    tags = {}
    for line in git("for-each-ref", "--format=%(*objectname) %(objectname) %(refname:short)", "refs/tags").splitlines():
        parts = line.split()
        tags[parts[0]] = parts[-1]   # the commit a tag points to (for an annotated tag, the commit it wraps)
    rows = []
    for line in git("log", "--all", "--date=format:%d %b %Y", "--format=%H|%h|%ad|%s").splitlines():
        full, short, date, subject = line.split("|", 3)
        if full in on_main:
            where = "main"
        else:   # the feature branch it was made on
            where = next((b for b, held in feature if full in held), "?")
        rows.append(f"| {date} | `{short}` | {where} | {tags.get(full, '')} | {subject} | "
                    f"{'yes' if full in uploaded else '**no**'} | {'yes' if full in live else 'no'} |")
    table = "\n".join([START,
                       "| Date | Commit | Branch | Version | What changed | Uploaded | Live |",
                       "|---|---|---|---|---|---|---|", *rows, END])
    text = LOG.read_text(encoding="utf-8")
    a, b = text.index(START), text.index(END) + len(END)
    LOG.write_bytes((text[:a] + table + text[b:]).encode("utf-8"))
    print("wrote", LOG, len(rows), "commits,", sum(1 for r in rows if "**no**" in r), "not uploaded yet")


if __name__ == "__main__":
    main()
