import sys, os, pymupdf
from PIL import Image
pdf, out, pages = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(",")]
d = pymupdf.open(pdf); ims = []
for i in pages:
    p = os.path.join(os.path.dirname(out), f"_p{i}.png"); d[i].get_pixmap(matrix=pymupdf.Matrix(0.9, 0.9)).save(p); ims.append(Image.open(p))
s = Image.new("RGB", (sum(i.width for i in ims), ims[0].height), "white"); x = 0
for im in ims: s.paste(im, (x, 0)); x += im.width
s.save(out, quality=80)
