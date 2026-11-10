import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(path.join(folder, 'package-lock.json'), 'utf8'));

function versionParts(value) {
  return String(value).split('.').map((part) => Number(part));
}

function atLeast(value, minimum) {
  const a = versionParts(value);
  const b = versionParts(minimum);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return true;
}

test('Firestore transitive gRPC dependency versions are overridden on every path, including Firestore', () => {
  const override = pkg.overrides?.['@grpc/grpc-js'];
  assert.ok(override, 'Missing explicit patched gRPC override');
  assert.ok(atLeast(override, '1.14.6'), 'A known-vulnerable gRPC range is pinned');
  const entries = Object.entries(lock.packages).filter(([name]) =>
    /(?:^|\/)node_modules\/@grpc\/grpc-js$/.test(name),
  );
  assert.ok(entries.length >= 1, 'No resolved gRPC package in lockfile');
  for (const [name, resolved] of entries) {
    assert.equal(resolved.version, override, 'Stale gRPC version at ' + name);
  }
});

test('Vite and esbuild use branches with the 2026 security fixes', () => {
  const vite = lock.packages['node_modules/vite'];
  const esbuild = lock.packages['node_modules/esbuild'];
  assert.ok(vite && esbuild, 'Missing Vite / esbuild');
  assert.ok(atLeast(vite.version, '6.4.4'), 'Vite security fixes are missing');
  assert.ok(atLeast(esbuild.version, '0.25.0'), 'esbuild security fixes are missing');
  assert.equal(vite.version, pkg.devDependencies.vite);
});

test('Firebase remains on the validated major while updating only transitive tooling', () => {
  assert.equal(lock.packages['node_modules/firebase'].version, pkg.dependencies.firebase);
  assert.equal(lock.packages[''].dependencies.firebase, pkg.dependencies.firebase);
});
