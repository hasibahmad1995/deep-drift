"""Shared tools for the PDFs in docs/ (the git tracking guide and the reports): the page style, pictures inside the
page, and printing HTML to PDF with Microsoft Edge (or Chrome) in headless mode. No extra Python packages are needed."""
import base64, os, pathlib, subprocess, tempfile

BASE_CSS = """
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

def find_browser():
    for p in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(p):
            return p
    raise SystemExit("Could not find Edge or Chrome to print the PDF.")


def embed(path):
    """A picture put inside the page (so the PDF needs no other files)."""
    p = pathlib.Path(path); kind = "png" if p.suffix.lower() == ".png" else "jpeg"
    return f"data:image/{kind};base64," + base64.b64encode(p.read_bytes()).decode()


def print_pdf(page_html, out):
    """Prints an HTML page to the PDF file out."""
    out = pathlib.Path(out); out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / "page.html"
        src.write_text(page_html, encoding="utf-8")
        subprocess.run([find_browser(), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--user-data-dir={tmp}/profile", f"--print-to-pdf={out}", src.as_uri()],
                       check=True, capture_output=True, timeout=120)
    print("wrote", out, round(out.stat().st_size / 1024), "KB")
