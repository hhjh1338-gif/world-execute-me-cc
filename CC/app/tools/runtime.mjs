// Shared local-tool discovery. This module never downloads or installs a runtime.
import { existsSync, statSync } from 'node:fs';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

export const BROWSER_FLAGS = ['--disable-extensions', '--disable-component-extensions-with-background-pages', '--disable-default-apps'];
export const arg = (key, fallback) => {
  const i = process.argv.indexOf('--' + key);
  if (i < 0) return fallback;
  return process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
};
export function numberArg(key, fallback, { min = 0, integer = false, allowZero = false } = {}) {
  const raw = arg(key, fallback), value = Number(raw);
  if (raw === true || !Number.isFinite(value) || (allowZero ? value < min : value <= min) || (integer && !Number.isInteger(value))) {
    throw new Error('--' + key + ' needs a valid ' + (integer ? 'whole ' : '') + 'number ' + (allowZero ? '>=' : '>') + ' ' + min);
  }
  return value;
}
export function outputName(value) {
  if (typeof value !== 'string' || !value.trim() || /[\\/:*?"<>|\x00-\x1f]/.test(value) || value === '.' || value === '..') {
    throw new Error('Output names must be plain filenames, without a path.');
  }
  return value;
}
function isFile(path) { try { return statSync(path).isFile(); } catch { return false; } }
function executable(value) {
  if (typeof value !== 'string' || !value) return null;
  if (isAbsolute(value) || /[\\/]/.test(value)) return isFile(resolve(value)) ? resolve(value) : null;
  const extensions = process.platform === 'win32' && !/\.[a-z0-9]+$/i.test(value) ? ['.exe', '.cmd', '.bat', ''] : [''];
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    for (const ext of extensions) { const path = join(dir, value + ext); if (isFile(path)) return path; }
  }
  return null;
}
export function chromePath() {
  const explicit = arg('chrome', process.env.CHROME_PATH);
  if (explicit !== undefined) {
    const path = executable(explicit);
    if (!path) throw new Error('--chrome / CHROME_PATH does not point to an existing browser executable.');
    return path;
  }
  const candidates = process.platform === 'win32' ? [
    ...[process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean).flatMap((base) => [
      join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'), join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ]), 'chrome', 'msedge',
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium',
  ] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
  for (const candidate of candidates) { const path = executable(candidate); if (path) return path; }
  throw new Error('No installed Chrome, Chromium or Edge found. Set CHROME_PATH or pass --chrome /path/to/browser. Nothing was installed.');
}
export async function loadChromium() {
  try { return (await import('playwright-core')).chromium; }
  catch (cause) { throw new Error('playwright-core is unavailable. Install the candidate package dependencies before rendering; --list needs none.', { cause }); }
}
export async function ffmpegPath() {
  if (process.env.FFMPEG_PATH !== undefined) {
    const path = executable(process.env.FFMPEG_PATH);
    if (!path) throw new Error('FFMPEG_PATH does not point to an existing ffmpeg executable.');
    return path;
  }
  try {
    const path = (await import('ffmpeg-static')).default;
    if (path && existsSync(path)) return path;
  } catch { /* report the supported choices below */ }
  throw new Error('ffmpeg is unavailable. Set FFMPEG_PATH or install the candidate package dependencies (ffmpeg-static). Nothing was installed.');
}
export function audioPath(root) { return join(root, 'input', 'edited_song.wav'); }
export function requireAudio(root) {
  const path = audioPath(root);
  if (!isFile(path)) throw new Error('Missing input/edited_song.wav. Prepare your own audio with CC/tools/audio_edit.py --src <file>, or export a silent placeholder demo with --noaudio. No frames were rendered.');
  return path;
}
export function pythonPath() {
  const configured = arg('python', process.env.PYTHON_PATH);
  const path = configured === undefined ? (executable('python') || executable('python3')) : executable(configured);
  if (!path) throw new Error('Python was not found. Set PYTHON_PATH or pass --python /path/to/python; --noaudio does not require Python.');
  return path;
}
export function checkAudioPython(path) {
  try { execFileSync(path, ['-I', '-c', 'import numpy, soundfile'], { stdio: 'pipe' }); }
  catch { throw new Error('Audio export needs numpy and soundfile in the selected Python. Prepare those optional dependencies yourself, or pass --noaudio. Nothing was installed.'); }
}
export function mixAudio(python, cc, from, to, out) {
  execFileSync(python, ['-X', 'utf8', '-I', join(cc, 'tools', 'mix_audio.py'), '--from', String(from), '--to', String(to), '--out', out], { stdio: 'inherit' });
}
export function encoder(ffmpeg, fps, output) {
  const child = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', String(fps * 2), '-movflags', '+faststart', output], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, no) => { child.once('error', no); child.once('close', (code) => code === 0 ? ok() : no(new Error('ffmpeg exited with ' + code))); });
  done.catch(() => {}); // the rendering loop awaits completion after its last frame
  child.stdin.on('error', () => {}); // writeFrame/done propagate failures
  return { child, done };
}
export async function writeFrame(enc, buffer) {
  if (enc.child.stdin.destroyed) { await enc.done; throw new Error('ffmpeg input closed early.'); }
  if (!enc.child.stdin.write(buffer)) {
    await new Promise((ok, no) => {
      const cleanup = () => { enc.child.stdin.off('drain', drained); enc.child.stdin.off('error', failed); enc.child.off('close', closed); };
      const drained = () => { cleanup(); ok(); }, failed = (error) => { cleanup(); no(error); };
      const closed = () => failed(new Error('ffmpeg stopped before all frames were written.'));
      enc.child.stdin.once('drain', drained); enc.child.stdin.once('error', failed); enc.child.once('close', closed);
    });
  }
}
export async function assetStatus(page) {
  return page.evaluate(() => window.__assetStatus ?? { status: 'unknown', note: 'Frontend did not expose asset status.' });
}
