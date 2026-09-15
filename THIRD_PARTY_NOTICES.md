# Third-party notices

## Apollyon — WARDOGS Artillery Calculator

> Apollyon (apollyon-sys). (2026). *WARDOGS Artillery Calculator* [Computer software]. GitHub. Revision: [`ef7cf2d8cb637532b1595b634b87469be6f507b4`](https://github.com/apollyon-sys/wardogs-calculator/tree/ef7cf2d8cb637532b1595b634b87469be6f507b4). Accessed September 14, 2026.

Author: [Apollyon](https://github.com/apollyon-sys). Original application: [wardogs-artillery.com](https://wardogs-artillery.com/).

This project adapts the following upstream data into `core.mjs`:

- Map bounds, tile calibration and the retained Bakurani/Zestafona spawn-area polygons from [maps/](https://github.com/apollyon-sys/wardogs-calculator/tree/ef7cf2d8cb637532b1595b634b87469be6f507b4/maps). Only the required fields are retained; polygon coordinates are converted from meters to game coordinate units.
- Minimum and maximum weapon ranges from [data/weapons.json](https://github.com/apollyon-sys/wardogs-calculator/blob/ef7cf2d8cb637532b1595b634b87469be6f507b4/data/weapons.json), converted from kilometers to meters.

Original WebP map tiles were downloaded from the upstream public asset service, `assets.wardogs-artillery.com/releases/assets-v1/`, using URLs supplied by the map configuration. They are bundled in `assets/maps/` and served by this project's own host; the application makes no runtime requests to the upstream tile service. The bundle covers playable bounds at zoom levels 0–7, without re-encoding. `assets/maps/manifest.json` records the source URL, download time and each file's SHA-256. The asset release is separate from the pinned source-code snapshot.

Thank you to Apollyon for making the original tool and data available. This project is maintained independently; changes in this repository are the responsibility of its maintainers.

## Independently measured locations

All current tower, landmark and Control Zone coordinates, plus Ozeti spawn corners and icon positions, are measured from maintainer-supplied gameplay screenshots. Measurements and screenshot filenames are documented in README.md.

[WardogTools.gg](https://wardogtools.gg/artillery/) and [MetaForge](https://metaforge.app/wardogs/map/ozeti) are references for the Sunflower Church and Church Top place names. Hilltop Church is the display name used here. No code or icons from those services are included.

## WARDOGS assets

WARDOGS map imagery, game assets, names, logos and trademarks are NOT covered by the upstream MIT license. They remain the property of BULKHEAD / their respective rights holders. The bundled map tiles and README screenshots do not imply ownership or relicensing of these assets.
This is an independently maintained, unofficial fan tool. It does not represent BULKHEAD, the WARDOGS development team or Apollyon, and does not claim their approval or endorsement.

Bundling and self-hosting the map tiles does not change their ownership or place them under the upstream MIT license. This notice identifies the project and credits the rights holders; it does not replace any applicable permission from them.

## Upstream license

The upstream original source code is MIT-licensed. Its [copyright and license notice](https://github.com/apollyon-sys/wardogs-calculator/blob/ef7cf2d8cb637532b1595b634b87469be6f507b4/LICENSE) is reproduced below.

MIT License

Copyright (c) 2026 Apollyon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## MetaForge spawn coordinates

The retained Bakurani spawn icon coordinates were obtained from [MetaForge](https://metaforge.app/wardogs/map/bakurani) on 2026-09-14. These three points use the source coordinates. Current values are listed in README.md. No MetaForge code or image assets are included; its material is not covered by the Apollyon MIT license.
