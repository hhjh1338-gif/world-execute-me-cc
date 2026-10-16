// Local-only preview. No dependencies required; no files outside this package are served.
import { createServer } from 'node:http';
import { stat, realpath, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.lrc': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const allowed = p => /^CC\/app\/(src|film)\/[\w/.-]+\.(js|html|css)$/.test(p)
  || /^CC\/script\/[\w-]+\.json$/.test(p)
  || /^CC\/app\/node_modules\/@fontsource\/noto-sans-sc\/[\w/.-]+\.(css|woff2?)$/.test(p)
  || /^input\/art\/[A-Z]\d+(?:-\d+)?\.png$/.test(p)
  || ['input/lyrics.en.lrc', 'input/lyrics.zh.json', 'input/edited_song.wav', 'CC/样片/样片列表.json'].includes(p)
  || /^CC\/样片\/[^/\\]+\.mp4$/.test(p);

async function localFile(path) {
  const file = await realpath(join(ROOT, path));
  const rel = relative(await realpath(ROOT), file);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Outside package');
  const info = await stat(file);
  if (!info.isFile()) throw new Error('Not a file');
  return { file, info };
}
async function has(path) { try { await localFile(path); return true; } catch { return false; } }
export async function inputManifest() {
  let names = []; try { names = await readdir(join(ROOT, 'input/art')); } catch { /* optional */ }
  const art = [];
  for (const name of names.sort()) if (/^[A-Z]\d+(?:-\d+)?\.png$/.test(name) && await has('input/art/' + name)) art.push(name.slice(0,-4));
  return { art, lyricsEn: await has('input/lyrics.en.lrc'), lyricsZh: await has('input/lyrics.zh.json'),
    audio: await has('input/edited_song.wav'),
    fonts: await has('CC/app/node_modules/@fontsource/noto-sans-sc/400.css') && await has('CC/app/node_modules/@fontsource/noto-sans-sc/700.css') };
}
export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const end = (code, body = '') => { res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : body); };
    try {
      if (!['GET', 'HEAD'].includes(req.method)) return end(405, 'Read-only server');
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1);
      if (!p) { res.writeHead(302, { location: '/CC/app/film/index.html' }); return res.end(); }
      if (p.includes('\\') || p.includes('\0') || p.split('/').includes('..')) return end(403);
      if (p === 'input/manifest.json') {
        const data = Buffer.from(JSON.stringify(await inputManifest()));
        res.writeHead(200, { 'content-type': TYPES['.json'], 'content-length': data.length, 'cache-control': 'no-store' });
        return res.end(req.method === 'HEAD' ? undefined : data);
      }
      if (!allowed(p)) return end(403);
      const { file, info } = await localFile(p), size = info.size;
      const headers = { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'accept-ranges': 'bytes',
        'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' };
      let start = 0, endByte = size - 1, status = 200;
      if (req.headers.range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!m || (!m[1] && !m[2])) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end(); }
        start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
        endByte = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(endByte) || start > endByte || start >= size) {
          res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end();
        }
        status = 206; headers['content-range'] = 'bytes ' + start + '-' + endByte + '/' + size;
      }
      headers['content-length'] = Math.max(0, endByte - start + 1);
      res.writeHead(status, headers);
      if (req.method === 'HEAD' || !size) return res.end();
      createReadStream(file, { start, end: endByte }).on('error', () => res.destroy()).pipe(res);
    } catch (e) { if (!res.headersSent) end(e instanceof URIError ? 400 : 404); else res.destroy(); }
  });
  return new Promise((ok, no) => { server.once('error', no); server.listen(port, '127.0.0.1', () => ok(server)); });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const server = await serve(Number(process.argv[2] || 5181));
  console.log('Open http://127.0.0.1:' + server.address().port + '/ (Ctrl+C stops this preview only)');
}

