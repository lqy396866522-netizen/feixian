#!/usr/bin/env python3
"""Remove baked grey checkerboard (192/208) from RGBA PNGs under assets/resources."""
from __future__ import annotations

import os
import sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'resources', 'textures')


def strip(path: str) -> int:
    im = Image.open(path).convert('RGBA')
    px = im.load()
    w, h = im.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            if abs(r - g) <= 6 and abs(g - b) <= 6 and 180 <= r <= 220:
                px[x, y] = (r, g, b, 0)
                n += 1
    if n:
        im.save(path)
    return n


def main() -> None:
    base = os.path.normpath(ROOT)
    total = 0
    for dirpath, _, files in os.walk(base):
        for fn in files:
            if not fn.lower().endswith('.png'):
                continue
            p = os.path.join(dirpath, fn)
            n = strip(p)
            if n:
                print(f'{os.path.relpath(p, base)}: removed {n}')
                total += n
    print('done, pixels cleared:', total)


if __name__ == '__main__':
    main()
