import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expected = 'control-financiero-49b07';
const ci = process.argv.includes('--ci');

async function exists(file) {
  try { await access(file, constants.R_OK); return true; } catch { return false; }
}

function parseProjectId(envText) {
  const match = envText.match(/^\s*(?:export\s+)?VITE_FIREBASE_PROJECT_ID\s*=\s*(.*?)\s*$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null;
}

const files = [
  'dist/index.html', 'dist/sw.js', 'dist/manifest.webmanifest',
  'firebase.json', 'package.json', 'package-lock.json',
];
for (const file of files) {
  assert.ok(await exists(path.join(root, file)), 'Falta ' + file + '. Ejecuta npm ci y npm run build.');
}

const hosting = JSON.parse(await readFile(path.join(root, 'firebase.json'), 'utf8')).hosting;
assert.equal(hosting.public, 'dist', 'Firebase Hosting debe publicar solamente dist.');
assert.deepEqual(hosting.rewrites, [{ source: '**', destination: '/index.html' }]);
const sw = await readFile(path.join(root, 'dist/sw.js'), 'utf8');
assert.match(sw, /const BUILD_ID = '[0-9a-f]{16}';/, 'El service worker debe estar versionado.');
assert.ok(!sw.includes('__BUILD_ID__'), 'La compilación PWA aún tiene marcadores sin resolver.');
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
assert.match(html, /assets\/[^"'\s]+\.js/, 'No se encontraron recursos versionados en HTML.');
const assets = await readdir(path.join(root, 'dist/assets'));
assert.ok(assets.some((name) => /^.+-[A-Za-z0-9_-]{8,}\.js$/.test(name)),
  'No se encontraron paquetes JavaScript con huella de versión.');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
assert.equal(lock.packages[''].devDependencies.vite, pkg.devDependencies.vite);
assert.equal(lock.packages['node_modules/firebase'].version, pkg.dependencies.firebase);

if (!ci) {
  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(branch, 'feature/control-financiero-v2', 'No estás en la rama V2 validada.');
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(status, '', 'Hay cambios locales sin confirmar. Revísalos antes de preparar live.');

  // Vite priority for `build` mode: production.local, local, production, generic.
  const candidates = ['.env.production.local', '.env.local', '.env.production', '.env'];
  let project = null;
  for (const file of candidates) {
    const pathname = path.join(root, file);
    if (!await exists(pathname)) continue;
    project = parseProjectId(await readFile(pathname, 'utf8'));
    if (project !== null) break;
  }
  assert.equal(project, expected,
    'VITE_FIREBASE_PROJECT_ID no coincide con el proyecto PRD previsto o no se encontró. Verifica tus archivos .env sin publicarlos.');
}

console.log('Preflight V2 correcto: build, SW y Hosting. Proyecto objetivo: ' + expected);
console.log(ci ? 'La revisión de rama y variables .env queda pendiente en tu equipo.'
  : 'Rama y proyecto Firebase verificados. Este comando NO publica en Firebase.');
