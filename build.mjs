import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const client = join(output, 'client');

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function shouldCopyAsset(source) {
  const assetPath = relative(join(root, 'assets'), source).split(sep).join('/');
  if (!assetPath || assetPath === '.') return true;

  // Keep the compressed delivery assets, but leave WAV sources out of the
  // online build. They remain in the repository for future editing.
  if (assetPath === 'audio' || assetPath === 'audio/compressed' || assetPath.startsWith('audio/compressed/')) return true;
  if (assetPath.startsWith('audio/')) return false;
  return true;
}

await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'server'), { recursive: true });
await mkdir(client, { recursive: true });

for (const file of ['index.html', 'styles.css', 'game.js', 'Char.png', 'og.png']) {
  const source = join(root, file);
  if (await exists(source)) await cp(source, join(client, file));
}

for (const directory of ['assets']) {
  const source = join(root, directory);
  if (await exists(source)) {
    await cp(source, join(client, directory), {
      recursive: true,
      filter: (entry) => directory !== 'assets' || shouldCopyAsset(entry),
    });
  }
}

await cp(join(root, 'worker', 'index.js'), join(output, 'server', 'index.js'));
console.log('Online game build is ready.');
