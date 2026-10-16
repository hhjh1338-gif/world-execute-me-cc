// Export a local clip or stills. Optional media is read from this package's input/ folder.
// node CC/app/tools/export.mjs --from 0 --to 6.38 --name clip --noaudio
// --stills 0.10,2.92 --name check · --fps 120 --scale 2 · --offsets 0,33,67 · --sheet
// Browser: --chrome /path/to/browser or CHROME_PATH. Encoder: FFMPEG_PATH or ffmpeg-static.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { arg, numberArg, outputName, chromePath, BROWSER_FLAGS, loadChromium, ffmpegPath, requireAudio, pythonPath,
  checkAudioPython, mixAudio, encoder, writeFrame, assetStatus } from './runtime.mjs';

const CC = join(ROOT, 'CC'), out = join(CC, '样片');
const fps = numberArg('fps', 60, { integer: true }), scale = numberArg('scale', 1, { integer: true }), name = outputName(arg('name', 'clip'));
if (scale > 4) throw new Error('--scale must be an integer from 1 to 4.');
const wall = arg('wall', null), stills = arg('stills', null), noaudio = Boolean(arg('noaudio', false));
const wallName = wall ? outputName(wall === true ? '形象墙_v1' : wall) : null;
const stillTimes = stills ? String(stills).split(',').map(Number) : [];
if (stills && (stills === true || stillTimes.some((time) => !Number.isFinite(time) || time < 0))) throw new Error('--stills needs comma-separated nonnegative seconds.');
const from = numberArg('from', 0, { allowZero: true }), to = numberArg('to', 6.38);
if (!wall && !stills && to <= from) throw new Error('--to must be greater than --from.');
const TL = JSON.parse(readFileSync(join(CC, 'script', 'timeline.json'), 'utf8'));
const offsets = String(arg('offsets', TL.render.avOffsetMs)).split(',').map(Number);
if (offsets.some((ms) => !Number.isFinite(ms) || ms < 0)) throw new Error('--offsets must be comma-separated nonnegative milliseconds.');
let python, ffmpeg;
if (!wall && !stills) {
  if (!noaudio) { requireAudio(ROOT); python = pythonPath(); checkAudioPython(python); }
  ffmpeg = await ffmpegPath();
}
const chrome = chromePath(), chromium = await loadChromium();
mkdirSync(join(out, '静帧'), { recursive: true });
const server = await serve(0);
let browser;
try {
  browser = await chromium.launch({ executablePath: chrome, args: BROWSER_FLAGS, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + server.address().port + '/CC/app/film/index.html?export=1&scale=' + scale);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  if (errors.length) throw new Error('page errors:\n  ' + errors.join('\n  '));
  const assets = await assetStatus(page), outputs = [];
  const png = async (t) => Buffer.from((await page.evaluate((tt) => window.frameAt(tt), t)).split(',')[1], 'base64');
  if (wall) {
    const f = join(out, '静帧', wallName + '.png');
    writeFileSync(f, Buffer.from((await page.evaluate(() => window.wallAt(16))).split(',')[1], 'base64'));
    outputs.push(f); console.log('wrote', f);
  } else if (stills) {
    for (const time of stillTimes) {
      const f = join(out, '静帧', name + '_' + time.toFixed(2) + '.png');
      writeFileSync(f, await png(time)); outputs.push(f); console.log('wrote', f);
    }
  } else {
    const n = Math.round((to - from) * fps);
    if (n < 1) throw new Error('The selected range contains no frames at this fps.');
    const video = join(out, name + '_无声.mp4'), enc = encoder(ffmpeg, fps, video), t0 = Date.now();
    try {
      for (let i = 0; i < n; i++) {
        await writeFrame(enc, await png(from + i / fps));
        if (i % 60 === 0) process.stdout.write('\r' + name + ': frame ' + i + '/' + n + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
      }
      enc.child.stdin.end(); await enc.done;
    } catch (error) { enc.child.kill(); throw error; }
    outputs.push(video); console.log('\nwrote', video);
    if (!noaudio) {
      const wav = join(out, '音频片段', name + '.wav');
      mixAudio(python, CC, from, to, wav);
      for (const ms of offsets) {
        const f = join(out, name + '_声音晚' + ms + 'ms.mp4');
        execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', wav,
          '-filter_complex', '[1:a]adelay=' + ms + ':all=1,atrim=0:' + (to - from).toFixed(3) + '[a]', '-map', '0:v', '-map', '[a]',
          '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', f]);
        outputs.push(f); console.log('wrote', f);
      }
    }
    const chosen = noaudio ? name + '_无声.mp4' : name + '_声音晚' + TL.render.avOffsetMs + 'ms.mp4';
    if (outputs.includes(join(out, chosen))) {
      const listFile = join(out, '样片列表.json'), list = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : { samples: [] };
      list.samples = list.samples.filter((v) => v.name !== name).concat({ name, from, to, file: chosen, made: new Date().toISOString(), noaudio, assets });
      list.samples.sort((a, b) => a.from - b.from || a.to - b.to);
      writeFileSync(listFile, JSON.stringify(list, null, 1) + '\n');
    }
    if (arg('sheet', false)) {
      const sheet = join(out, name + '_连续表_每秒10帧_%02d.png');
      execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-vf', 'fps=10,scale=384:216,tile=6x6:margin=4:padding=4', sheet]);
    }
  }
  writeFileSync(join(out, name + '_导出记录.json'), JSON.stringify({ made: new Date().toISOString(), fps, scale, from, to, noaudio: wall || stills ? null : noaudio, assets, outputs }, null, 2) + '\n');
} finally { if (browser) await browser.close(); server.close(); }
