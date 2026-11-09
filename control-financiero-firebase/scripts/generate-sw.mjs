import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const assets = path.join(dist, 'assets');
const swPath = path.join(dist, 'sw.js');

const assetNames = (await readdir(assets)).sort();
const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const digest = createHash('sha256')
  .update(indexHtml)
  .update('\0')
  .update(assetNames.join('\n'))
  .digest('hex')
  .slice(0, 16);
const template = await readFile(swPath, 'utf8');
if (!template.includes("'__BUILD_ID__'")) {
  throw new Error('No se encontró el marcador de versión del service worker.');
}
await writeFile(swPath, template.replace("'__BUILD_ID__'", "'" + digest + "'"));
console.log('PWA service worker generado para la versión ' + digest);
