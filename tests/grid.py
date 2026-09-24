import sys
from PIL import Image
n=int(sys.argv[1]); ims=[Image.open(f"/tmp/dd_shot_{i}.png").resize((600,360)) for i in range(n)]
W=Image.new("RGB",(1200,360*((n+1)//2)))
for k,im in enumerate(ims): W.paste(im,((k%2)*600,(k//2)*360))
W.save("/tmp/dd_shot_grid.png")
