import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
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

await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'server'), { recursive: true });
await mkdir(client, { recursive: true });

for (const file of ['index.html', 'styles.css', 'game.js', 'Char.png', 'og.png']) {
  const source = join(root, file);
  if (await exists(source)) await cp(source, join(client, file));
}

for (const directory of ['assets']) {
  const source = join(root, directory);
  if (await exists(source)) await cp(source, join(client, directory), { recursive: true });
}

await cp(join(root, 'worker', 'index.js'), join(output, 'server', 'index.js'));
console.log('Online game build is ready.');
