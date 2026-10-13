"""Make the wood textures for the 3D preview (textures/*.jpg).

Run from the repo root:  python3 tools/make_textures.py

Each board texture covers 64 x 16 inches at 32 pixels per inch, with the
grain running left to right. It models a plain-sawn board: growth rings are
cylinders around the log's center, and cutting them at a shallow, wandering
angle gives the arched "cathedral" pattern. For each wood this writes a color
map (<name>.jpg) and a bump map (<name>-bump.jpg) for pores and grain texture.
"""
from pathlib import Path

import numpy as np
from PIL import Image

PX_PER_IN = 32
SS = 2                      # draw at 2x and scale down, so ring edges stay smooth
LENGTH_IN, WIDTH_IN = 64, 16
OUT = Path(__file__).resolve().parent.parent / "textures"

u, v = np.meshgrid(np.arange(LENGTH_IN * PX_PER_IN * SS) / (PX_PER_IN * SS),
                   np.arange(WIDTH_IN * PX_PER_IN * SS) / (PX_PER_IN * SS))


def noise(x, y, seed):
    """Smooth value noise in 0..1, one random value per unit cell of x, y."""
    rng = np.random.default_rng(seed)
    x = x - x.min()
    y = y - y.min()
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    g = rng.random((y0.max() + 2, x0.max() + 2))
    tx, ty = x - x0, y - y0
    sx, sy = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    top = g[y0, x0] * (1 - sx) + g[y0, x0 + 1] * sx
    bottom = g[y0 + 1, x0] * (1 - sx) + g[y0 + 1, x0 + 1] * sx
    return top * (1 - sy) + bottom * sy


def fbm(x, y, seed, octaves=4):
    total, amp, norm = 0, 1.0, 0
    for i in range(octaves):
        total = total + amp * noise(x * 2 ** i, y * 2 ** i, seed + i)
        norm += amp
        amp *= 0.5
    return total / norm


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def board(seed, ring_in, pith_depth, tilt, wander):
    """Ring position (in rings, continuous) and latewood amount for a plain-sawn board."""
    # The log's center sits below the board face. The board is cut at a slight
    # angle to the log, so that depth changes steadily along the length: each
    # ring breaks through the face in turn, giving nested arches.
    depth = pith_depth + tilt * (u - LENGTH_IN / 2) + wander * (fbm(u * 0.04, v * 0, seed, 3) - 0.5)
    depth = np.maximum(depth, 0.25)
    center = WIDTH_IN * 0.55 + 2.5 * (fbm(u * 0.025, v * 0, seed + 10, 2) - 0.5)
    r = np.sqrt((v - center) ** 2 + depth ** 2)
    # Some years grow more than others, so ring widths vary.
    rings = r / ring_in + 3.0 * (fbm(r * 1.2, r * 0, seed + 20, 3) - 0.5)
    rings += 0.35 * (fbm(u * 0.15, v * 0.8, seed + 30, 3) - 0.5)    # rings aren't perfect circles
    latewood = smoothstep(0.42, 0.92, rings % 1.0)                   # darkens through the ring, then resets sharply
    return rings, latewood


def shrink(a):
    """Average SS x SS blocks back down to the output size."""
    h, w = a.shape[:2]
    return a.reshape(h // SS, SS, w // SS, SS, *a.shape[2:]).mean(axis=(1, 3))


def save(name, rgb, bump):
    rgb, bump = shrink(rgb), shrink(bump)
    OUT.mkdir(exist_ok=True)
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(OUT / f"{name}.jpg", quality=84, optimize=True, progressive=True)
    b = (bump - bump.min()) / (bump.max() - bump.min() + 1e-9)
    Image.fromarray((b * 255).astype(np.uint8), "L").save(OUT / f"{name}-bump.jpg", quality=80, optimize=True)
    print("wrote", name)


def mix(a, b, t):
    a, b = np.array(a, float), np.array(b, float)
    return a + (b - a) * t[..., None]


def oak():
    """Red oak: ring-porous, strong ring contrast, open pores in the earlywood."""
    rings, late = board(seed=11, ring_in=0.17, pith_depth=3.6, tilt=-0.1, wander=1.2)
    rgb = mix((216, 174, 128), (180, 128, 84), late)
    rgb *= (0.93 + 0.12 * fbm(u * 0.05, v * 0.4, 101))[..., None]
    rgb += np.array([7, 0, -5]) * (fbm(u * 0.03, v * 0.2, 102)[..., None] - 0.5)   # a little pink, red oak style
    # Pores line up along each ring's earlywood, so they follow the arches.
    pores = smoothstep(0.66, 0.86, noise(u * 3.0, rings * 12, 103)) * (1 - late) ** 2
    fibers = fbm(u * 0.25, rings * 22, 104, 2) - 0.5
    rgb *= (1 - 0.22 * pores)[..., None]
    rgb *= (1 + 0.07 * fibers)[..., None]
    bump = 0.6 * late - 1.0 * pores + 0.25 * fibers
    save("oak", rgb, bump)


def walnut():
    """Black walnut: diffuse-porous, softer rings, rich color streaks."""
    rings, late = board(seed=21, ring_in=0.24, pith_depth=3.8, tilt=-0.09, wander=1.2)
    rgb = mix((126, 90, 63), (88, 59, 41), late * 0.85)
    rgb *= (0.82 + 0.3 * fbm(u * 0.05, v * 0.9, 201))[..., None]
    rgb = rgb * 0.95 + np.array([5, -2, 4]) * (fbm(u * 0.04, v * 0.3, 202)[..., None] - 0.5) * 2   # purple-grey cast in places
    pores = smoothstep(0.72, 0.9, noise(u * 3.0, rings * 16, 203))
    fibers = fbm(u * 0.3, rings * 24, 204, 2) - 0.5
    rgb *= (1 - 0.22 * pores)[..., None]
    rgb *= (1 + 0.10 * fibers)[..., None]
    bump = 0.4 * late - 0.7 * pores + 0.25 * fibers
    save("walnut", rgb, bump)


def stained():
    """Walnut-stained poplar: fine, quiet grain under an even dark stain."""
    rings, late = board(seed=31, ring_in=0.3, pith_depth=3.8, tilt=-0.08, wander=1.0)
    rgb = mix((104, 70, 46), (80, 52, 34), late * 0.7)
    rgb *= (0.9 + 0.16 * fbm(u * 0.12, v * 0.5, 301))[..., None]
    fibers = fbm(u * 0.3, rings * 20, 302, 2) - 0.5
    rgb *= (1 + 0.07 * fibers)[..., None]
    bump = 0.3 * late + 0.2 * fibers
    save("dark-stain", rgb, bump)


def paint():
    """Painted poplar: no visible color grain, just faint grain and a fine roller texture to catch the light."""
    rings, late = board(seed=41, ring_in=0.3, pith_depth=3.2, tilt=-0.05, wander=0.5)
    bump = 0.25 * late + 0.35 * fbm(u * 3, v * 3, 401, 3)
    bump = shrink(bump)
    b = (bump - bump.min()) / (bump.max() - bump.min())
    OUT.mkdir(exist_ok=True)
    Image.fromarray((b * 255).astype(np.uint8), "L").save(OUT / "paint-bump.jpg", quality=80, optimize=True)
    print("wrote paint")


if __name__ == "__main__":
    oak()
    walnut()
    stained()
    paint()
