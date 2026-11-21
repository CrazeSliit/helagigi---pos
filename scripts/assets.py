import sys
from PIL import Image, ImageFilter, ImageOps, ImageChops
import numpy as np
logo_src, banner_src, out = sys.argv[1], sys.argv[2], sys.argv[3]

def white_to_alpha(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    alpha = np.max((255 - a) / 255.0, axis=2)
    safe = np.where(alpha < 1e-3, 1, alpha)[..., None]
    col = 255 - (255 - a) / safe
    col = np.clip(col, 0, 255)
    rgba = np.dstack([col, (alpha * 255)]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

logo = Image.open(logo_src)
# find bbox of wordmark (above tagline)
arr = np.asarray(logo.convert('L'))
dark = arr < 200
rows = np.where(dark.any(axis=1))[0]
# split wordmark from tagline: find a gap of white rows
gaps = [r for r in range(rows[0], rows[-1]) if not dark[r].any()]
cut = gaps[0] if gaps else rows[-1]
word = dark[:cut]
ys = np.where(word.any(axis=1))[0]; xs = np.where(word.any(axis=0))[0]
pad = 6
box = (xs[0]-pad, ys[0]-pad, xs[-1]+pad, ys[-1]+pad)
wm = white_to_alpha(logo.crop(box))
wm.save(f'{out}/wordmark.png')
print('wordmark', wm.size)
full = white_to_alpha(logo.crop((xs[0]-pad, ys[0]-pad, xs[-1]+pad, rows[-1]+pad)))
full.save(f'{out}/logo-full.png'); print('full', full.size)

banner = Image.open(banner_src)
mask = banner.crop((1590, 0, 2034, 773))
white_to_alpha(mask).save(f'{out}/raksha-color.png')
# line version from the artwork: edges of the colour regions
g = mask.convert('L').filter(ImageFilter.GaussianBlur(1.2))
e = g.filter(ImageFilter.FIND_EDGES)
e = ImageOps.autocontrast(e)
ea = np.asarray(e).astype(np.float32)
ea = np.clip((ea - 40) * 2.2, 0, 255)
for name, rgb in [('raksha-line-light', (255,255,255)), ('raksha-line-navy', (11,30,79))]:
    img = np.zeros((ea.shape[0], ea.shape[1], 4), np.uint8)
    img[..., :3] = rgb; img[..., 3] = ea.astype(np.uint8)
    Image.fromarray(img, 'RGBA').save(f'{out}/{name}.png')
print('mask', mask.size)
