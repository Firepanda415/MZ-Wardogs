import argparse
import hashlib
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, __version__ as pillow_version, features

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/maps'
OUTPUT = ROOT / 'assets/maps-display'
SETTINGS = {'format': 'WebP', 'quality': 88, 'method': 4, 'size': [256, 256]}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description='Build or verify display tiles without modifying source tiles.')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--workers', type=int, default=4, choices=range(1, 17))
    args = parser.parse_args()
    source_manifest = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
    previous_path = OUTPUT / 'manifest.json'
    previous = json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}
    if args.verify and previous.get('settings') != SETTINGS:
        raise ValueError('Missing or outdated display manifest')

    def process(item):
        name, source_record = item
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts or relative.suffix != '.webp':
            raise ValueError(f'Invalid tile path: {name}')
        data = (SOURCE / relative).read_bytes()
        source_hash = digest(data)
        if len(data) != source_record['bytes'] or source_hash != source_record['sha256']:
            raise ValueError(f'Original tile differs from source manifest: {name}')
        destination = OUTPUT / relative
        old = previous.get('files', {}).get(name, {})
        encoded = destination.read_bytes() if destination.exists() else b''
        reusable = (previous.get('settings') == SETTINGS and old.get('sourceSha256') == source_hash
                    and old.get('sha256') == digest(encoded) and old.get('bytes') == len(encoded))
        if args.verify and not reusable:
            raise ValueError(f'Missing, stale or modified display tile: {name}')
        if not reusable:
            with Image.open(io.BytesIO(data)) as image:
                if list(image.size) != SETTINGS['size']:
                    raise ValueError(f'Unexpected source dimensions: {name}')
                buffer = io.BytesIO()
                image.save(buffer, 'WEBP', quality=SETTINGS['quality'], method=SETTINGS['method'])
            encoded = buffer.getvalue()
            if len(encoded) >= len(data):
                encoded = data
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_suffix('.webp.tmp')
            temporary.write_bytes(encoded)
            temporary.replace(destination)
        with Image.open(io.BytesIO(encoded)) as image:
            if image.format != 'WEBP' or list(image.size) != SETTINGS['size']:
                raise ValueError(f'Invalid display tile: {name}')
            image.load()
        return name, {'bytes': len(encoded), 'sha256': digest(encoded), 'sourceSha256': source_hash}

    records = {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for index, (name, record) in enumerate(pool.map(process, sorted(source_manifest['files'].items())), 1):
            records[name] = record
            if index % 2000 == 0:
                print(f'{index}/{len(source_manifest["files"])} tiles', flush=True)
    revision = digest(json.dumps(records, sort_keys=True, separators=(',', ':')).encode())[:16]
    module = f"export const tileRoot = './assets/maps-display';\nexport const tileVersion = '{revision}';\n"
    if args.verify:
        if set(previous['files']) != set(records) or previous.get('revision') != revision:
            raise ValueError('Display manifest inventory or revision mismatch')
        if (ROOT / 'map-assets.mjs').read_text(encoding='utf-8') != module:
            raise ValueError('Map cache version does not match display assets')
    else:
        manifest = {'source': '../maps/manifest.json', 'settings': SETTINGS, 'revision': revision,
                    'encoder': {'pillow': pillow_version, 'libwebp': features.version('webp')}, 'files': records}
        previous_path.write_text(json.dumps(manifest, separators=(',', ':')) + '\n', encoding='utf-8')
        (ROOT / 'map-assets.mjs').write_text(module, encoding='utf-8')
    original_bytes = sum(x['bytes'] for x in source_manifest['files'].values())
    display_bytes = sum(x['bytes'] for x in records.values())
    print(f'{"Verified" if args.verify else "Generated"} {len(records)} tiles: '
          f'{original_bytes / 1048576:.2f} -> {display_bytes / 1048576:.2f} MiB '
          f'({100 * (1 - display_bytes / original_bytes):.1f}% smaller). Originals unchanged.')


if __name__ == '__main__':
    main()
