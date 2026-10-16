// Lightweight checks only: no browser, dependency installation, audio or video rendering.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { serve, ROOT } from '../CC/app/tools/serve.mjs';

const seen = new Set();
function visit(file) {
  if (seen.has(file)) return; seen.add(file);
  const s = readFileSync(file, 'utf8');
  for (const m of s.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
    const next = resolve(dirname(file), m[1]);
    assert.ok(existsSync(next), `Missing import in ${relative(ROOT,file)}: ${m[1]}`); visit(next);
  }
}
visit(join(ROOT, 'CC/app/film/main.js'));
let jsonFiles = 0, syntaxFiles = 0;
function check(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'input', '样片', '发布', 'output', '.git'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) check(p);
    else if (e.name.endsWith('.json')) { JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,'')); jsonFiles++; }
    else if (/\.(js|mjs)$/.test(e.name)) {
      const result = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8', windowsHide: true });
      assert.equal(result.status, 0, `Syntax failed: ${relative(ROOT,p)}\n${result.stderr}`); syntaxFiles++;
    }
  }
}
check(ROOT);
const pkg = JSON.parse(readFileSync(join(ROOT,'CC/app/package.json'))), lock = JSON.parse(readFileSync(join(ROOT,'CC/app/package-lock.json')));
assert.deepEqual(pkg.dependencies, lock.packages[''].dependencies, 'Dependencies differ from lockfile');
const server = await serve(0), base = 'http://127.0.0.1:' + server.address().port;
try {
  assert.equal((await fetch(base + '/')).status, 200);
  const manifest = await (await fetch(base + '/input/manifest.json')).json();
  assert.ok(Array.isArray(manifest.art));
  for (const key of ['audio','lyricsEn','lyricsZh','fonts']) assert.equal(typeof manifest[key], 'boolean');
  const file = '/CC/app/film/main.js', full = await (await fetch(base + file)).arrayBuffer();
  const range = await fetch(base + file, { headers: { range: 'bytes=0-9' } });
  assert.equal(range.status, 206); assert.equal((await range.arrayBuffer()).byteLength, 10);
  assert.equal((await fetch(base+file, {method:'HEAD'})).headers.get('content-length'),String(full.byteLength));
  assert.equal((await fetch(base+file, {headers:{range:'bytes=999999999-'}})).status,416);
  for (const p of ['/package.json', '/.env', '/CC/app/tools/serve.mjs', '/CC/app/node_modules/playwright-core/package.json', '/input/README.md'])
    assert.equal((await fetch(base+p)).status,403, `Unexpected serving of ${p}`);
  assert.equal((await fetch(base+'/input/manifest.json',{method:'POST'})).status,405);
  console.log(JSON.stringify({pass:true,moduleCount:seen.size,jsonFiles,syntaxFiles,httpChecks:'passed',inputs:manifest},null,2));
} finally { await new Promise(ok=>server.close(ok)); }
