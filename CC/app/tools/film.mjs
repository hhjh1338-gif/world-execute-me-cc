// Render 30-second picture-only pieces, then join them and optionally add your own audio.
// node CC/app/tools/film.mjs --list       read-only; no Playwright, ffmpeg or audio required
// node CC/app/tools/film.mjs --noaudio    silent demo (optional artwork/subtitles may be absent)
// --scale 2 --fps 120 --jobs 2 preserves the 4K/120 fps parallel-piece workflow.
// --to <seconds> · --redo 66-80 · --stale · --sheet · --chrome <path> · --python <path>
// Stale pieces are always rebuilt; --stale is retained as a compatible explicit spelling.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, statSync, renameSync, copyFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { serve, ROOT } from './serve.mjs';
import { arg, numberArg, chromePath, BROWSER_FLAGS, loadChromium, ffmpegPath, requireAudio, pythonPath,
  checkAudioPython, mixAudio, encoder, writeFrame, assetStatus } from './runtime.mjs';

const SCALE = numberArg('scale', 1, { integer: true }), FPS = numberArg('fps', 60, { integer: true }), JOBS = numberArg('jobs', 1, { integer: true });
if (SCALE > 4) throw new Error('--scale must be an integer from 1 to 4.');
const TAG = SCALE === 1 && FPS === 60 ? '' : (SCALE === 2 ? '4K' : 1080 * SCALE + 'p') + FPS;
const CC = join(ROOT, 'CC'), OUT = join(CC, '样片'), DIR = join(OUT, TAG ? '分段_' + TAG : '分段'), LOG = join(DIR, '分段记录.json');
const PIECE = 30 * FPS, NOAUDIO = Boolean(arg('noaudio', false));
const TL = JSON.parse(readFileSync(join(CC, 'script', 'timeline.json'), 'utf8'));
const acts = readdirSync(join(CC, 'script')).filter((f) => /^act\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(CC, 'script', f), 'utf8')));
const END = numberArg('to', Math.max(...acts.map((a) => a.range[1])));
const LAST = Math.round(END * FPS);
if (LAST < 1) throw new Error('The selected range contains no frames.');

function fingerprint() {
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ version: 2, fps: FPS, scale: SCALE, encoder: 'libx264-medium-crf16-yuv420p-g2s' }));
  const add = (dir, accept = () => true) => {
    if (!existsSync(dir)) { hash.update('missing:' + relative(ROOT, dir) + '\0'); return; }
    for (const name of readdirSync(dir).sort()) {
      const file = join(dir, name), st = statSync(file);
      if (st.isDirectory()) add(file, accept);
      else if (accept(name)) hash.update(relative(ROOT, file).replaceAll('\\', '/') + '\0').update(readFileSync(file));
    }
  };
  add(join(CC, 'app', 'src'), (f) => /\.(js|mjs|json|css)$/.test(f));
  add(join(CC, 'app', 'film'), (f) => /\.(js|mjs|html|css)$/.test(f));
  add(join(CC, 'script'), (f) => f.endsWith('.json') && !f.startsWith('revision'));
  // No mandatory final-art directory: artwork and subtitle changes invalidate placeholder pieces too.
  add(join(ROOT, 'input'), (f) => /\.(json|lrc|srt|vtt|txt|csv|png|jpe?g|webp|gif|svg|woff2?|ttf|otf)$/i.test(f));
  add(join(CC, 'app', 'fonts'));
  add(join(CC, 'app', 'public', 'fonts'));
  add(join(CC, 'app', 'node_modules', '@fontsource'));
  for (const name of ['runtime.mjs', 'film.mjs', 'serve.mjs']) hash.update(readFileSync(join(CC, 'app', 'tools', name)));
  return hash.digest('hex').slice(0, 16);
}
const NOW = fingerprint();
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : { pieces: {} };
log.pieces ??= {};
const pieces = Array.from({ length: Math.ceil(LAST / PIECE) }, (_, k) => {
  const f0 = k * PIECE, f1 = Math.min(LAST, f0 + PIECE), file = 'piece_' + String(k).padStart(3, '0') + '.mp4', rec = log.pieces[k];
  const have = Boolean(rec && existsSync(join(DIR, file)) && rec.frames === f1 - f0);
  return { k, f0, f1, file, rec, have, fresh: have && rec.hash === NOW && rec.fps === FPS && rec.scale === SCALE };
});
const stamp = (s) => Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0');
console.log('the film so far: 0:00.00–' + stamp(END) + ', ' + LAST + ' frames, ' + pieces.length + ' pieces of 30 s; fingerprint now ' + NOW);
for (const p of pieces) console.log('  ' + p.file + '  ' + stamp(p.f0 / FPS) + '–' + stamp(p.f1 / FPS) + '  ' + (p.have ? (p.fresh ? 'up to date' : 'stale: will rebuild') : 'missing') + (p.rec ? '  (' + p.rec.made + ')' : ''));
if (arg('list', false)) process.exit(0);

// Fail before launching a browser or encoding a frame if the requested audio is absent.
let python;
if (!NOAUDIO) { requireAudio(ROOT); python = pythonPath(); checkAudioPython(python); }
const ffmpeg = await ffmpegPath();
const redo = arg('redo', null), range = redo ? String(redo).split('-').map(Number) : [];
if (redo && (range.length !== 2 || range.some((n) => !Number.isFinite(n) || n < 0) || range[1] <= range[0])) throw new Error('--redo must be a range such as 66-80, in seconds.');
const todo = pieces.filter((p) => !p.fresh || (redo && p.f0 / FPS < range[1] && p.f1 / FPS > range[0]));
const made = () => new Date().toISOString();
mkdirSync(DIR, { recursive: true });

if (todo.length) {
  const chrome = chromePath(), chromium = await loadChromium(), server = await serve(0);
  let browser;
  try {
    browser = await chromium.launch({ executablePath: chrome, args: BROWSER_FLAGS, headless: true });
    const queue = todo.slice();
    const worker = async () => {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/CC/app/film/index.html?export=1&scale=' + SCALE);
        await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
        if (errors.length) throw new Error('page errors:\n  ' + errors.join('\n  '));
        const assets = await assetStatus(page);
        for (let p; (p = queue.shift());) {
          const tmp = join(DIR, p.file + '.part.mp4'), t0 = Date.now(), enc = encoder(ffmpeg, FPS, tmp);
          try {
            for (let frame = p.f0; frame < p.f1; frame++) {
              const buffer = Buffer.from((await page.evaluate((t) => window.frameAt(t), frame / FPS)).split(',')[1], 'base64');
              await writeFrame(enc, buffer);
              if ((frame - p.f0) % 60 === 0) process.stdout.write('\r' + p.file + ': ' + (frame - p.f0) + '/' + (p.f1 - p.f0) + ' frames (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
            }
            enc.child.stdin.end(); await enc.done;
          } catch (error) { enc.child.kill(); throw error; }
          renameSync(tmp, join(DIR, p.file));
          log.pieces[p.k] = { file: p.file, from: p.f0 / FPS, to: p.f1 / FPS, frames: p.f1 - p.f0, hash: NOW, fps: FPS, scale: SCALE, assets, made: made() };
          writeFileSync(LOG, JSON.stringify(log, null, 1) + '\n');
          console.log('\rwrote ' + p.file + ' (' + (p.f1 - p.f0) + ' frames)            ');
        }
      } finally { await page.close(); }
    };
    await Promise.all(Array.from({ length: Math.min(JOBS, todo.length) }, worker));
  } finally { if (browser) await browser.close(); server.close(); }
}

log._doc = '30-second picture-only pieces on the selected fps grid; joined without re-encoding. Optional self-provided audio is added once. The content fingerprint includes renderer, script, input artwork/subtitles, fonts, fps and scale; stale pieces are rebuilt automatically.';
log.settings = { fps: FPS, scale: SCALE, jobs: JOBS };
writeFileSync(LOG, JSON.stringify(log, null, 1) + '\n');
writeFileSync(join(DIR, 'list.txt'), pieces.map((p) => "file '" + p.file + "'").join('\n') + '\n');
const silent = join(DIR, 'film_silent.mp4');
execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', '-movflags', '+faststart', 'film_silent.mp4'], { cwd: DIR });
const name = '成片_至' + stamp(END).replace(':', '.') + (TAG ? '_' + TAG : ''), ms = TL.render.avOffsetMs;
const filename = name + (NOAUDIO ? '_无声.mp4' : '_声音晚' + ms + 'ms.mp4'), film = join(OUT, filename);
if (NOAUDIO) {
  copyFileSync(silent, film);
} else {
  const wav = join(OUT, '音频片段', '成片.wav');
  mixAudio(python, CC, 0, LAST / FPS, wav);
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', wav,
    '-filter_complex', '[1:a]adelay=' + ms + ':all=1,atrim=0:' + (LAST / FPS).toFixed(3) + '[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', film]);
}
console.log('wrote', film);
const assets = Object.fromEntries(pieces.map((p) => [p.file, log.pieces[p.k].assets]));
writeFileSync(join(OUT, name + '_导出记录.json'), JSON.stringify({ made: made(), fps: FPS, scale: SCALE, jobs: JOBS, noaudio: NOAUDIO, fingerprint: NOW, duration: LAST / FPS, assets, file: filename }, null, 2) + '\n');
if (arg('sheet', false) && !TAG) execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', film, '-vf', 'fps=10,scale=384:216,tile=6x6:margin=4:padding=4', join(OUT, name + '_连续表_每秒10帧_%02d.png')]);
if (!TAG) {
  const listFile = join(OUT, '样片列表.json'), list = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : { samples: [] };
  list.samples = [{ name: '成片', from: 0, to: LAST / FPS, file: filename, made: made(), noaudio: NOAUDIO, assets }, ...list.samples.filter((v) => !v.name.startsWith('成片'))];
  writeFileSync(listFile, JSON.stringify(list, null, 1) + '\n');
}
