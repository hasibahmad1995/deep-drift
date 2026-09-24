"""Joins tests/out/dd_shot_0..N-1.png into one picture, tests/out/dd_shot_grid.png.  Usage: python tests/grid.py N"""
import sys, pathlib
from PIL import Image
OUT = pathlib.Path(__file__).resolve().parent / "out"
n=int(sys.argv[1]); ims=[Image.open(OUT / f"dd_shot_{i}.png").resize((600,360)) for i in range(n)]
W=Image.new("RGB",(1200,360*((n+1)//2)))
for k,im in enumerate(ims): W.paste(im,((k%2)*600,(k//2)*360))
W.save(OUT / "dd_shot_grid.png")
