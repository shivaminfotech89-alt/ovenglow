"""
Cut the round badge out of the shop's artwork.

The artwork is the badge photographed on maroon board with embossed line art
around it -- cake slices, a whisk, a rolling pin, a sprig. The site shows the
mark inside a circular frame, so anything outside the badge is either clipped or
half-visible. The logo.png this replaces was a square crop tight enough that the
outer ring touched all four edges, and logo-mark.png was a letterbox strip of the
monogram with the O and the g cut off at the sides and black bands above and
below.

So: find what is actually part of the mark, keep that, and replace everything
else with the artwork's own ground -- sampled per radius, so the maroon keeps its
vignette and the badge keeps its drop shadow, and only the decoration goes.

Run:  python3 -I make_logo.py <artwork.jpg> <output dir>
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src_path, out_dir = sys.argv[1], sys.argv[2]
src = np.asarray(Image.open(src_path).convert('RGB')).astype(np.float32)
H, W, _ = src.shape

lum = src.mean(axis=2)
sat = src.max(axis=2) - src.min(axis=2)
# Silver is bright and near-neutral. The maroon ground is red-dominant and the
# rolling pin is brown, so a saturation ceiling separates the mark from both --
# brightness alone picks up the rolling pin and runs the bounding box off the
# edge of the image.
SILVER = (lum > 140) & (sat < 28)

yy, xx = np.mgrid[0:H, 0:W]


def blur(mask, sigma):
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32) / 255


def components(mask, min_px=400):
    """Connected components, labelled by a scan with union-find."""
    closed = blur(mask, 2.5) > 0.25  # bridge hairline gaps within one glyph
    lab = np.zeros((H, W), np.int32)
    parent, nxt = {}, 0

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[max(rx, ry)] = min(rx, ry)

    for y in range(H):
        for x in np.nonzero(closed[y])[0]:
            near = [v for v in (
                lab[y - 1, x] if y else 0,
                lab[y, x - 1] if x else 0,
                lab[y - 1, x - 1] if (y and x) else 0,
                lab[y - 1, x + 1] if (y and x + 1 < W) else 0,
            ) if v]
            if near:
                v = min(near)
                lab[y, x] = v
                for o in near:
                    union(v, o)
            else:
                nxt += 1
                parent[nxt] = nxt
                lab[y, x] = nxt

    flat = np.zeros(nxt + 1, np.int32)
    for i in range(1, nxt + 1):
        flat[i] = find(i)
    lab = flat[lab]

    found = []
    for v in np.unique(lab):
        if v == 0:
            continue
        piece = lab == v
        if piece.sum() < min_px:
            continue
        ys, xs = np.nonzero(piece)
        found.append({'mask': piece, 'n': int(piece.sum()),
                      'box': (xs.min(), xs.max(), ys.min(), ys.max())})
    return found


def enclosing_circle(mask, search=18):
    """Smallest circle containing the mask, by a local search on the centre."""
    ys, xs = np.nonzero(mask)
    cx0, cy0 = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    best = None
    for cx in np.arange(cx0 - search, cx0 + search + 0.1, 1.0):
        for cy in np.arange(cy0 - search, cy0 + search + 0.1, 1.0):
            r = np.hypot(xs - cx, ys - cy).max()
            if best is None or r < best[0]:
                best = (r, float(cx), float(cy))
    return best


def ground_by_radius(cx, cy, upto):
    """
    The ground colour at each radius, as the artwork actually has it.

    Median rather than mean, over the whole annulus and with the mark's own
    pixels excluded: the decorations are a small part of any ring, so the median
    lands on clean board. Taken per radius, it carries the vignette and the
    badge's drop shadow across without carrying a whisk.
    """
    rad = np.hypot(xx - cx, yy - cy)
    table = np.zeros((int(upto) + 3, 3), np.float32)
    for r in range(int(upto) + 3):
        band = (rad >= r - 2) & (rad < r + 3) & ~SILVER
        table[r] = np.median(src[band], axis=0) if band.sum() > 200 else table[r - 1]
    k = np.ones(11) / 11
    for c in range(3):
        table[:, c] = np.convolve(np.pad(table[:, c], 5, mode='edge'), k, mode='valid')
    return table


def render(keep, cx, cy, canvas_r, size, square_bg=False, feather=7.0, exclude=None):
    """
    One square image: the artwork where `keep` says so, the shop's own maroon
    everywhere else. `canvas_r` is the half-width of the crop in source pixels --
    the gap between the mark and that edge is the breathing room it needs inside
    a circular frame.
    """
    alpha = np.clip(blur(keep, feather) * 1.9, 0, 1)
    if exclude is not None:
        # The margin that carries the badge's drop shadow also reaches far
        # enough to leave a ghost of whatever lettering sits just outside the
        # crop -- a faint "C" floating in the maroon. Anything silver that is
        # not part of this mark is pushed back out explicitly.
        alpha *= 1 - np.clip(blur(exclude, 5) * 3.0, 0, 1)
    table = ground_by_radius(cx, cy, canvas_r * 1.5)

    rad = np.hypot(xx - cx, yy - cy)
    ground = table[np.clip(rad.astype(int), 0, len(table) - 1)]
    if square_bg:
        # An app icon is masked to whatever shape the platform likes, so its
        # ground runs to the corners rather than fading past a circle.
        flat = table[int(canvas_r)]
        ground = np.where(rad[..., None] > canvas_r, flat, ground)

    merged = src * alpha[..., None] + ground * (1 - alpha[..., None])

    box = (int(round(cx - canvas_r)), int(round(cy - canvas_r)),
           int(round(cx + canvas_r)), int(round(cy + canvas_r)))
    # Crop at full resolution and let PIL downscale: sampling the source per
    # output pixel would alias the engraved lettering into dotted lines.
    return Image.fromarray(np.clip(merged, 0, 255).astype(np.uint8)) \
        .crop(box).resize((size, size), Image.LANCZOS)


# ------------------------------------------------------------- the badge --
R, cx, cy = enclosing_circle(SILVER)
rad_badge = np.hypot(xx - cx, yy - cy)
# The silhouette plus everything inside the ring. The circle alone is not
# enough: the ring is not concentric with the mark's bounding circle, so a sprig
# sitting at radius 450 in one direction fell inside a radius the ring reaches
# only in another, and came through into the finished logo.
badge_keep = (blur(SILVER, 9) > 0.045) | (rad_badge < R * 0.86)
print(f'badge:    centre ({cx:.0f}, {cy:.0f})  radius {R:.0f}')

# ---------------------------------------------------------- the monogram --
# At header size the arched lettering renders about four pixels tall and reads
# as grey mush, so small sizes get the OG alone. Picked out as connected
# components rather than by radius: DELIGHTS sits at the same distance from the
# centre as the g's tail, so no circle separates them.
parts = components(SILVER)
MONO_BOX = (380, 880, 365, 790)
mono = np.zeros((H, W), bool)
for p in parts:
    x0, x1, y0, y1 = p['box']
    if x0 >= MONO_BOX[0] and x1 <= MONO_BOX[1] and y0 >= MONO_BOX[2] and y1 <= MONO_BOX[3]:
        mono |= p['mask']
        print(f'  monogram part: {p["n"]:6d}px  x {x0}-{x1}  y {y0}-{y1}')
Rm, mx, my = enclosing_circle(mono)
mono_keep = blur(mono, 9) > 0.045
print(f'monogram: centre ({mx:.0f}, {my:.0f})  radius {Rm:.0f}')

not_mono = SILVER & ~(blur(mono, 4) > 0.02)

jobs = [
    ('logo.png',             badge_keep, (cx, cy), R * 1.15,  512, False, None),
    # 256, not 512. This is the one that loads on every page -- the header and
    # the footer both take the simplified mark -- and it is drawn at 44 to 56
    # CSS pixels, so 512 was a quarter of a megabyte to render a thumbnail.
    ('logo-mark.png',        mono_keep,  (mx, my), Rm * 1.17, 256, False, not_mono),
    ('icon-512.png',         badge_keep, (cx, cy), R * 1.32,  512, True,  None),
    ('icon-192.png',         badge_keep, (cx, cy), R * 1.32,  192, True,  None),
    ('apple-touch-icon.png', badge_keep, (cx, cy), R * 1.24,  180, True,  None),
    ('favicon-32.png',       mono_keep,  (mx, my), Rm * 1.17, 32,  True,  not_mono),
]
for name, keep, (ax, ay), canvas, size, square, excl in jobs:
    render(keep, ax, ay, canvas, size, square_bg=square, exclude=excl) \
        .save(f'{out_dir}/{name}', optimize=True)
    print(f'  wrote {name}  {size}x{size}')
