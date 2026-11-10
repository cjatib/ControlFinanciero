import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'firebase.json'), 'utf8'));

function headersFor(source) {
  return config.hosting.headers.find((entry) => entry.source === source)?.headers ?? [];
}

function header(source, key) {
  return headersFor(source).find((entry) => entry.key.toLowerCase() === key.toLowerCase())?.value;
}

test('Hosting serves compiled build, not public sources, and does not deploy Firestore automatically', () => {
  assert.equal(config.hosting.public, 'dist');
  assert.equal(config.firestore.rules, 'firestore.rules');
  assert.equal(config.hosting.rewrites.length, 1);
  assert.deepEqual(config.hosting.rewrites[0], { source: '**', destination: '/index.html' });
});

test('entry HTML, worker and manifest require revalidation for PWA updates', () => {
  for (const source of ['/sw.js', '/index.html', '/', '/manifest.webmanifest']) {
    const policy = header(source, 'Cache-Control');
    assert.ok(policy?.includes('no-cache'), source + ' should be revalidated');
    assert.ok(!policy?.includes('immutable'), source + ' must not be immutable');
  }
});

test('only fingerprinted generated assets use long-lived browser cache', () => {
  assert.equal(header('/assets/**', 'Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(header('**', 'X-Content-Type-Options'), 'nosniff');
  assert.equal(header('**', 'Referrer-Policy'), 'no-referrer');
  assert.ok(header('**', 'Permissions-Policy')?.includes('camera=()'));
});
