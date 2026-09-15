"""Measure the original game screenshot: python docs/mortar-pixel-check.py INPUT.jpg OUTPUT.png"""
import itertools
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

source, output = map(Path, sys.argv[1:3])
im = Image.open(source)
assert im.size == (3840, 2160), "Use the original 3840x2160 screenshot"
gray = np.asarray(im.convert("L"), dtype=float)

def line_center(x0, x1, y0, y1, threshold):
    rows = np.arange(y0, y1)[gray[y0:y1, x0:x1].mean(axis=1) < threshold]
    assert 1 <= len(rows) <= 12 and np.all(np.diff(rows) == 1), "Expected one narrow horizontal stroke"
    return float(rows.mean()), [int(rows[0]), int(rows[-1])]

ticks = {}
for name, x0, x1 in [("left", 1388, 1415), ("right", 2424, 2450)]:
    ticks[name] = [line_center(x0, x1, y-12, y+13, 65) for y in (968, 1172)]
assert ticks["left"] == ticks["right"], "Both scales must give the same row centers"
upper = line_center(1885, 1910, 948, 974, 20)[0]
lower = line_center(1885, 1910, 1188, 1214, 20)[0]
center = (upper+lower)/2
bracket_center = (line_center(1805, 1830, 1005, 1035, 20)[0]
                  + line_center(1805, 1830, 1130, 1160, 20)[0])/2
assert center == bracket_center, "T bars and side brackets must agree on reticle center"
y850, y900 = [row[0] for row in ticks["left"]]
fraction = (center-y850)/(y900-y850)
distance = 132+(110-132)*fraction
# Sensitivity to an assumed +/-1 px error in each of the three measured centers.
perturbed = [132-22*((center+c)-(y850+a))/((y900+b)-(y850+a))
             for a, b, c in itertools.product((-1, 1), repeat=3)]
print(json.dumps(dict(source=str(source), size=im.size, ticks=ticks, reticleY=center,
                     bracketCenterY=bracket_center, intervalPixels=y900-y850,
                     offsetPixels=center-y850, fraction=fraction, mil=850+50*fraction,
                     meters=distance, onePixelSensitivityMeters=[min(perturbed), max(perturbed)]), indent=2))

figure = Image.new('RGB', (1660, 420), '#202326')
figure.paste(im.crop((1250, 920, 2550, 1230)), (0, 80))
draw = ImageDraw.Draw(figure)
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 20)
draw.text((20, 15), f'Original: 3840 x 2160 | Offset: 112 / 204 px | Reading: {distance:.4f} m', font=font, fill='white')
draw.text((20, 42), f'Reticle: {850+50*fraction:.4f} MIL | Horizontal guides added for measurement', font=font, fill='white')
for y, color, label in [(y850, "#28cfe5", "132 m / 850 MIL"),
                         (center, "#ffb940", "Reticle center"),
                         (y900, "#fa7ae0", "110 m / 900 MIL")]:
    py = round(y-920+80)
    for x in range(0, 1300, 18):
        draw.line((x, py, x+10, py), fill=color)
    draw.text((1320, py-23), f'{label}\ny = {y:.1f} px', font=font, fill=color)
output.parent.mkdir(parents=True, exist_ok=True)
figure.save(output)
