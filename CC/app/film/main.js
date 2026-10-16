// Standalone geometric demo and optional local-media preview. Export API remains frame-addressable.
import { initFilm, renderFrame } from '../src/film/render.js';
import { drawWallPage } from '../src/film/her.js';
import { P, B0, mmss } from '../src/film/time.js';
import { setSC } from '../src/film/draw.js';
import { loadInputManifest, assetStatus } from '../src/film/data.js';

const qs = new URLSearchParams(location.search), EXPORT = qs.has('export');
if (EXPORT) document.body.classList.add('export');
window.__ready = false;
window.__assetStatus = assetStatus;
const c = document.getElementById('film'), x = c.getContext('2d');
const requestedScale = +(qs.get('scale') || 1);
const SCALE = Number.isFinite(requestedScale) && requestedScale > 0 ? Math.min(4, requestedScale) : 1;
if (SCALE !== 1) { setSC(SCALE); c.width = Math.round(1920 * SCALE); c.height = Math.round(1080 * SCALE); }
const statusEl = document.getElementById('asset-status');
const controls = [...document.querySelectorAll('#bar button, #seek')];
controls.forEach((el) => { el.disabled = true; });

function updateStatus() {
  const missing = assetStatus.placeholderIds.length;
  const parts = [missing ? `几何占位演示（非原成片） · ${missing} 张占位` : '本地素材预览'];
  const en = assetStatus.lyrics.en === 'loaded', zh = assetStatus.lyrics.zh === 'loaded';
  parts.push(en && zh ? '双语字幕' : en ? '英文字幕' : zh ? '中文字幕' : '无字幕');
  parts.push(assetStatus.audio === 'ready' ? '本地音频' : assetStatus.audio === 'loading' ? '音频加载中，暂用静音' : '静音播放');
  if (assetStatus.warnings.length) parts.push(assetStatus.warnings.join(' '));
  statusEl.textContent = parts.join(' · ');
}
const fontLinks = [];
async function loadFonts(manifest) {
  if (!manifest.fonts) return;
  const results = await Promise.all([400, 700].map((weight) => new Promise((resolve) => {
    const link = document.createElement('link'); fontLinks.push(link);
    link.rel = 'stylesheet'; link.href = `/CC/app/node_modules/@fontsource/noto-sans-sc/${weight}.css`;
    const timer = setTimeout(() => finish(false), 8000);
    function finish(ok) { clearTimeout(timer); link.onload = link.onerror = null; resolve(ok); }
    link.onload = () => finish(true); link.onerror = () => finish(false); document.head.append(link);
  })));
  assetStatus.fonts = results.every(Boolean) ? 'local' : 'system';
  if (assetStatus.fonts === 'system') {
    fontLinks.forEach((link) => link.remove());
    assetStatus.warnings.push('本地字体不可用，已使用系统字体。');
  }
}

try {
  const manifest = await loadInputManifest();
  await loadFonts(manifest);
  let R;
  try { R = await initFilm(); }
  catch (error) {
    if (assetStatus.fonts !== 'local') throw error;
    // A CSS file can exist while its font binaries are missing. Retry without that optional font.
    fontLinks.forEach((link) => link.remove()); assetStatus.fonts = 'system';
    assetStatus.warnings.push('本地字体加载失败，已使用系统字体。');
    R = await initFilm();
  }
  const duration = Number(R.F.end || R.F.film);
  assetStatus.duration = duration;
  window.drawAt = (t) => { renderFrame(x, t, R); return true; };
  window.frameAt = (t) => { renderFrame(x, t, R); return c.toDataURL('image/png'); };
  window.wallAt = (t) => { drawWallPage(x, R.H, R.F, t); return c.toDataURL('image/png'); };
  window.coverAt = async (v, w = 1920) => {
    const { drawCover } = await import('../src/cover.js');
    const cc = document.createElement('canvas'); cc.width = w; cc.height = 1080;
    drawCover(cc.getContext('2d'), v, R, w); return cc.toDataURL('image/png');
  };
  updateStatus();
  if (qs.has('wall')) drawWallPage(x, R.H, R.F, 16);
  else if (EXPORT) renderFrame(x, 0, R);
  else setupPreview(R, manifest, duration);
  window.__ready = true;
} catch (error) {
  window.__error = String(error?.message || error);
  assetStatus.mode = 'error';
  statusEl.textContent = '预览未能启动：必要的镜头数据不可用。请确认已从完整项目目录启动。';
  console.error(error);
}

function setupPreview(R, manifest, duration) {
  const GROUPS = [['G1', 0, 6.38], ['G2', 6.38, 10.09], ['G3', 10.09, 13.89], ['G4', 13.89, 18.76], ['G5', 18.76, 24.30], ['G6', 24.30, 29.709],
    ['G7', 29.709, 35.38], ['G8', 35.38, 40.92], ['G9', 40.92, 44.45], ['G10', 44.45, 51.36], ['G11', 51.36, 55.08],
    ['P1', 55.08, 56.92], ['P2', 56.92, 59.22], ['P3', 59.22, 62.59], ['P4', 62.59, 66.60], ['P5', 66.60, 69.26], ['P6', 69.26, 71.76], ['P7', 71.76, 73.918], ['P8', 73.918, 79.46],
    ['Q1', 79.46, 83.11], ['Q2', 83.11, 86.89], ['Q3', 86.89, 90.62], ['Q4', 90.62, 94.126], ['Q5', 94.126, 97.553], ['Q6', 97.553, 101.004], ['Q7', 101.004, 104.887], ['Q8', 104.887, 109.028], ['Q9', 109.028, 113.0], ['Q10', 113.0, 116.44],
    ['R1', 116.44, 120.46], ['R2', 120.46, 123.87], ['R3', 123.87, 127.27], ['R4', 127.27, 131.25], ['R5', 131.25, 134.2], ['R6', 134.2, 139.34], ['R7', 139.34, 146.15], ['R8', 146.15, 153.2],
    ['S1', 153.2, 157.23], ['S2', 157.23, 160.92], ['S3', 160.92, 164.44], ['S4', 164.44, 168.17],
    ['S5', 168.17, 171.55], ['S6', 171.55, 175.36], ['S7', 175.36, 182.79], ['S8', 182.79, 190.08], ['S9', 190.08, 197.84],
    ['T1', 197.84, 205.0], ['T2', 205.0, 211.35], ['T3', 211.35, 217.446], ['T4', 217.446, duration]];
  const song = document.getElementById('song'), seek = document.getElementById('seek'), clock = document.getElementById('clock');
  const playBtn = document.getElementById('play'), groupsEl = document.getElementById('groups');
  const clamp = (v) => Math.max(0, Math.min(duration, Number.isFinite(v) ? v : 0));
  const lead = (R.F.render?.avOffsetMs ?? 0) / 1000;
  let t = clamp(+(qs.get('t') || 0)), playing = false, raf = 0, generation = 0;
  let anchorT = t, anchorNow = performance.now(), audioReady = false, audioFailed = false, audioDriving = false, audioPending = false;
  let loadTimer, lastAudioTime = 0, lastAudioAdvance = 0;
  seek.max = duration;
  controls.forEach((el) => { el.disabled = false; });
  const resetClock = () => { anchorT = t; anchorNow = performance.now(); };
  const current = () => !playing ? t : audioDriving ? song.currentTime + lead : anchorT + (performance.now() - anchorNow) / 1000;
  const show = () => {
    renderFrame(x, t, R); seek.value = t;
    const b = (t - B0) / P;
    clock.textContent = `${mmss(t)} / ${mmss(duration)} · 第 ${Math.floor(b)} 拍 · 小节 ${Math.floor(b / 4)}.${(Math.floor(b) % 4 + 4) % 4 + 1}`;
    for (const el of groupsEl.children) el.classList.toggle('on', t >= +el.dataset.a && t < +el.dataset.b);
  };
  const failAudio = () => {
    if (audioFailed) return;
    t = clamp(current()); audioDriving = false; audioReady = false; audioFailed = true;
    clearTimeout(loadTimer); song.pause(); resetClock();
    assetStatus.audio = 'failed';
    assetStatus.warnings.push('音频无法播放，已自动继续静音。');
    updateStatus();
  };
  const startAudio = async () => {
    if (!playing || !audioReady || audioFailed || audioPending || audioDriving) return;
    if (Number.isFinite(song.duration) && Math.max(0, t - lead) >= song.duration) return;
    const token = generation;
    audioPending = true;
    let timer;
    try {
      song.currentTime = Math.max(0, clamp(current()) - lead);
      await Promise.race([song.play(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Audio play timeout')), 3000); })]);
      if (token !== generation || !playing || audioFailed) { song.pause(); return; }
      // Keep the independent clock moving while play() resolves, then hand over without a backward jump.
      const resumedTime = clamp(current());
      if (Number.isFinite(song.duration) && Math.max(0, resumedTime - lead) >= song.duration) {
        song.pause(); t = resumedTime; audioDriving = false; resetClock(); return;
      }
      song.currentTime = Math.max(0, resumedTime - lead);
      audioDriving = true; lastAudioTime = song.currentTime; lastAudioAdvance = performance.now();
    } catch { if (token === generation && playing) failAudio(); }
    finally {
      clearTimeout(timer); audioPending = false;
      if (token !== generation && playing && !audioFailed) queueMicrotask(() => void startAudio());
    }
  };
  const pause = () => {
    t = clamp(current()); playing = false; generation++; audioDriving = false;
    song.pause(); cancelAnimationFrame(raf); playBtn.textContent = '▶ 播放'; show();
  };
  const go = (v) => {
    t = clamp(v); resetClock();
    if (audioDriving) {
      if (Number.isFinite(song.duration) && t - lead >= song.duration) { audioDriving = false; song.pause(); }
      else { song.currentTime = Math.max(0, t - lead); lastAudioTime = song.currentTime; lastAudioAdvance = performance.now(); }
    } else if (playing) void startAudio();
    show();
  };
  const loop = () => {
    if (!playing) return;
    if (audioDriving) {
      if (Math.abs(song.currentTime - lastAudioTime) > 0.001) { lastAudioTime = song.currentTime; lastAudioAdvance = performance.now(); }
      else if (performance.now() - lastAudioAdvance > 2000) failAudio();
    }
    t = clamp(current());
    if (t >= duration) { pause(); return; }
    show(); raf = requestAnimationFrame(loop);
  };
  const toggle = () => {
    if (playing) { pause(); return; }
    if (t >= duration) t = 0;
    playing = true; generation++; resetClock(); playBtn.textContent = '❚❚ 暂停';
    raf = requestAnimationFrame(loop); void startAudio();
  };
  GROUPS.forEach(([n, a, b]) => {
    const btn = document.createElement('button'); btn.textContent = n; btn.dataset.a = a; btn.dataset.b = b;
    btn.onclick = () => go(a); groupsEl.append(btn);
  });
  seek.oninput = () => go(+seek.value);
  playBtn.onclick = toggle;
  document.getElementById('prev').onclick = () => go(clamp(current()) - 1 / 60);
  document.getElementById('next').onclick = () => go(clamp(current()) + 1 / 60);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); go(clamp(current()) - (e.shiftKey ? P : 1 / 60)); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); go(clamp(current()) + (e.shiftKey ? P : 1 / 60)); }
    else if (/^Digit[1-9]$/.test(e.code)) go(GROUPS[+e.code.slice(5) - 1][1]);
  });
  if (manifest.audio) {
    assetStatus.audio = 'loading'; updateStatus();
    song.addEventListener('loadedmetadata', () => {
      if (audioFailed) return;
      clearTimeout(loadTimer); audioReady = true; assetStatus.audio = 'ready'; updateStatus();
      if (playing) void startAudio();
    });
    song.addEventListener('error', failAudio);
    song.addEventListener('ended', () => {
      if (!audioDriving) return;
      t = clamp(song.currentTime + lead); audioDriving = false; resetClock();
      // The timeline may include a silent end card after the local audio ends.
    });
    loadTimer = setTimeout(failAudio, 8000);
    song.src = '/input/edited_song.wav'; song.load();
  }
  show();
}
