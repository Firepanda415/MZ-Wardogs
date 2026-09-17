# Third-party notices

## Apollyon — WARDOGS Artillery Calculator

> Apollyon (apollyon-sys). (2026). *WARDOGS Artillery Calculator* [Computer software]. GitHub. Revision: [`ef7cf2d8cb637532b1595b634b87469be6f507b4`](https://github.com/apollyon-sys/wardogs-calculator/tree/ef7cf2d8cb637532b1595b634b87469be6f507b4). Accessed September 14, 2026.

Author: [Apollyon](https://github.com/apollyon-sys). Original application: [wardogs-artillery.com](https://wardogs-artillery.com/).

This project adapts the following upstream data into `core.mjs`:

- Map bounds and tile calibration from [maps/](https://github.com/apollyon-sys/wardogs-calculator/tree/ef7cf2d8cb637532b1595b634b87469be6f507b4/maps). Only the required fields are retained.
- Minimum and maximum SPH-2 ranges from [data/weapons.json](https://github.com/apollyon-sys/wardogs-calculator/blob/ef7cf2d8cb637532b1595b634b87469be6f507b4/data/weapons.json), converted from kilometers to meters.

Original WebP map tiles were downloaded from the upstream public asset service, `assets.wardogs-artillery.com/releases/assets-v1/`, using URLs supplied by the map configuration. The unchanged originals are stored in `assets/maps/` for tracing and review. Display copies in `assets/maps-display/` are encoded as WebP at quality 88 with unchanged pixel dimensions, tile positions and zoom levels 0–7. A source file is copied unchanged when re-encoding would increase its size. Only display copies are included in website and desktop distributions. The application makes no runtime requests to the upstream tile service. `assets/maps/manifest.json` records the source URL, download time and each file's SHA-256. `assets/maps-display/manifest.json` records compression settings, source hashes, output hashes and the cache revision. The asset release is separate from the pinned source-code snapshot.

Thank you to Apollyon for making the original tool and data available. This project is maintained independently; changes in this repository are the responsibility of its maintainers.

## Independently measured locations

All current tower, landmark and Control Zone coordinates, plus spawn corners and icon positions on all three maps, are measured from maintainer-supplied gameplay screenshots. Measurements and screenshot filenames are documented in README.md.

Road centerlines and junctions are traced from the credited map imagery. Selected coordinates were refined using MetaForge's public 3D road-corridor samples on September 17, 2026. These traces are separate from the gameplay screenshot measurements and do not change ownership of the underlying imagery or source data.

The 3D references are [Bakurani](https://metaforge.app/wardogs/map/bakurani/3d), [Ozeti](https://metaforge.app/wardogs/map/ozeti/3d), and [Zestafona](https://metaforge.app/wardogs/map/zestafona/3d). The sampled dataset versions are `fb6c96cd` (kavkazi), `eae43320` (europe), and `639fe5c9` (northamerica). [The correction record](docs/road-review-3d.json) lists the source endpoints and coordinate changes. The application uses local road modules and makes no runtime requests to MetaForge. The samples include railway geometry and omit some tracks, so they were checked against imagery before use. Vehicle access has not been verified in game.

[WardogTools.gg](https://wardogtools.gg/artillery/) and [MetaForge](https://metaforge.app/wardogs/map/bakurani) are references for the Sunflower Church place name. Hilltop Church is the display name chosen here. No code or icons from those services are included.

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
