import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worker = await readFile(path.join(root, 'dist', 'sw.js'), 'utf8');
const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');

assert.match(worker, /const BUILD_ID = '[0-9a-f]{16}';/);
assert.ok(!worker.includes('__BUILD_ID__'), 'Production service worker must not contain unresolved build markers');
assert.ok(html.includes('assets/'), 'Expected versioned assets in production HTML');
assert.ok(worker.includes("event.data.type === 'SKIP_WAITING'"));
assert.ok(worker.includes("const shellNavigation ="));
console.log('Service worker de producción versionado y verificado.');
