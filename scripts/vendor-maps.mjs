import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { maps, tileBounds } from '../core.mjs';

const root = new URL('../assets/maps/', import.meta.url);
const source = 'https://assets.wardogs-artillery.com/releases/assets-v1/maps/tiles/';
const verify = process.argv.includes('--verify');
assert(process.argv.slice(2).every(arg => arg === '--verify'), 'Usage: node scripts/vendor-maps.mjs [--verify]');
const paths = [];
for (const [id, bounds] of Object.entries(maps)) {
  for (let z = 0; z <= 7; z++) {
    const count = 2 ** z, unit = (tileBounds.maxX - tileBounds.minX) / count;
    const x0 = Math.max(0, Math.floor((bounds.minX - tileBounds.minX) / unit));
    const x1 = Math.min(count - 1, Math.floor((bounds.maxX - tileBounds.minX) / unit));
    const y0 = Math.max(0, Math.floor((tileBounds.maxY - bounds.maxY) / unit));
    const y1 = Math.min(count - 1, Math.floor((tileBounds.maxY - bounds.minY) / unit));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) paths.push(`${id}/zoom_${z}/${x}_${y}.webp`);
    if (!verify) await mkdir(new URL(`${id}/zoom_${z}/`, root), { recursive: true });
  }
}
let previous = { files: {} };
try { previous = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8')); }
catch (error) { if (verify || error.code !== 'ENOENT') throw error; }
if (verify) assert.deepEqual(Object.keys(previous.files).sort(), [...paths].sort(), 'Incomplete tile manifest');

function inspect(data) {
  assert(data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP', 'Invalid WebP');
  assert.equal(data.readUInt32LE(4) + 8, data.length, 'Truncated WebP');
  return { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') };
}

let next = 0, done = 0, bytes = 0, lastReport = Date.now();
const files = {}, errors = [];
// ponytail: bounded workers; no requests occur in --verify mode or in the application.
await Promise.all(Array.from({ length: 12 }, async () => {
  while (next < paths.length) {
    const path = paths[next++], destination = new URL(path, root);
    try {
      let record;
      try {
        record = inspect(await readFile(destination));
        if (previous.files[path]) assert.deepEqual(record, previous.files[path], `Checksum mismatch: ${path}`);
      } catch (error) {
        if (verify) throw error;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(new URL(path, source), { signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
            const data = Buffer.from(await response.arrayBuffer());
            record = inspect(data);
            if (previous.files[path]) assert.deepEqual(record, previous.files[path], `Upstream changed: ${path}`);
            await writeFile(new URL(`${path}.tmp`, root), data);
            await rename(new URL(`${path}.tmp`, root), destination);
            break;
          } catch (failure) {
            if (attempt === 2) throw failure;
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      files[path] = record;
      bytes += record.bytes;
      done++;
    } catch (error) { errors.push(`${path}: ${error.message}`); }
    if (Date.now() - lastReport > 10000) {
      console.log(`${done}/${paths.length} tiles, ${(bytes / 1048576).toFixed(1)} MiB, ${errors.length} errors`);
      lastReport = Date.now();
    }
  }
}));
if (!verify) {
  await writeFile(new URL('manifest.json', root), JSON.stringify({
    source, upstreamCommit: 'ef7cf2d8cb637532b1595b634b87469be6f507b4',
    downloadedAt: new Date().toISOString(), scope: 'Playable bounds, zoom levels 0–7; original WebP files, unchanged.',
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  }, null, 2) + '\n');
}
assert.equal(errors.length, 0, errors.slice(0, 10).join('\n'));
console.log(`${verify ? 'Verified' : 'Downloaded'} ${done} tiles, ${(bytes / 1048576).toFixed(1)} MiB.`);
