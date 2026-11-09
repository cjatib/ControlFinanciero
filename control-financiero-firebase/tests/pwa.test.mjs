import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = await readFile(path.join(root, 'public', 'sw.js'), 'utf8');

function createWorker() {
  const listeners = {};
  let skipCount = 0;
  const deleted = [];
  const cacheStore = new Map();

  const cacheAPI = {
    open: async (name) => ({
      addAll: async (urls) => {
        cacheStore.set(name, new Map(urls.map((url) => [url, new Response('app shell')])));
      },
      match: async (key) => cacheStore.get(name)?.get(typeof key === 'string' ? key : key.url),
      put: async (key, response) => {
        const bucket = cacheStore.get(name) ?? new Map();
        bucket.set(typeof key === 'string' ? key : key.url, response);
        cacheStore.set(name, bucket);
      },
    }),
    keys: async () => [...cacheStore.keys(), 'unrelated-cache'],
    delete: async (name) => { deleted.push(name); cacheStore.delete(name); return true; },
  };
  const worker = {
    registration: { scope: 'https://example.test/app/' },
    location: { origin: 'https://example.test' },
    clients: { claim: async () => {} },
    skipWaiting: () => { skipCount += 1; },
    addEventListener: (name, callback) => { listeners[name] = callback; },
  };
  runInNewContext(script, {
    self: worker,
    caches: cacheAPI,
    URL,
    Response,
    fetch: async () => new Response('asset content', {
      status: 200,
      headers: { 'content-type': 'application/javascript' },
    }),
  });
  return { listeners, getSkipCount: () => skipCount, deleted, cacheStore };
}

test('installation never interrupts the user and only explicit message activates update', async () => {
  const worker = createWorker();
  let installPromise;
  worker.listeners.install({ waitUntil: (promise) => { installPromise = promise; } });
  await installPromise;
  assert.equal(worker.getSkipCount(), 0);
  assert.ok([...worker.cacheStore.keys()].some((name) => name.includes('shell-')));
  worker.listeners.message({ data: { type: 'IGNORED' } });
  assert.equal(worker.getSkipCount(), 0);
  worker.listeners.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(worker.getSkipCount(), 1);
});

test('fetch handler never caches Firebase/API documents or unrelated navigation routes', () => {
  const worker = createWorker();
  for (const url of [
    'https://firestore.googleapis.com/v1/projects/test/documents',
    'https://example.test/app/api/transactions',
    'https://example.test/app/users/private.json',
    'https://example.test/app/unrelated-page',
  ]) {
    let intercepted = false;
    worker.listeners.fetch({
      request: { url, method: 'GET', cache: 'default', mode: url.endsWith('unrelated-page') ? 'navigate' : 'cors' },
      respondWith: () => { intercepted = true; },
    });
    assert.equal(intercepted, false, 'Unexpected interception: ' + url);
  }

  let interceptedAsset = false;
  worker.listeners.fetch({
    request: { url: 'https://example.test/app/assets/index-AbCd123456.js', method: 'GET', cache: 'default', mode: 'cors' },
    respondWith: () => { interceptedAsset = true; },
  });
  assert.equal(interceptedAsset, true);
});

test('activation removes own legacy caches but preserves unrelated applications', async () => {
  const worker = createWorker();
  worker.cacheStore.set('controlfinanciero-v1', new Map());
  let activationPromise;
  worker.listeners.activate({ waitUntil: (promise) => { activationPromise = promise; } });
  await activationPromise;
  assert.ok(worker.deleted.includes('controlfinanciero-v1'));
  assert.ok(!worker.deleted.includes('unrelated-cache'));
});

test('build setup includes a placeholder replaced by asset fingerprint', async () => {
  assert.ok(script.includes("'__BUILD_ID__'"));
  assert.ok(!script.includes('cache.put(event.request, clonedResponse)'));
  const builder = await readFile(path.join(root, 'scripts', 'generate-sw.mjs'), 'utf8');
  assert.ok(builder.includes("createHash('sha256')"));
  assert.ok(builder.includes('assetNames.join'));
});
