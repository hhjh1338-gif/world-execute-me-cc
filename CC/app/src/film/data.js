// Required timeline/scene data ships with the package; optional personal media lives only under /input/.
import { setGrid, T } from './time.js';
import { createPlaceholder } from './placeholders.js';

const url = (...parts) => '/' + parts.map(encodeURIComponent).join('/');
async function read(u, format = 'json') {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(u, { signal: controller.signal });
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return await r[format]();
  } finally { clearTimeout(timer); }
}
export const assetStatus = {
  mode: 'loading', manifest: 'loading', placeholderIds: [], loadedArtIds: [], failedArtIds: [],
  lyrics: { en: 'missing', zh: 'missing' }, audio: 'missing', fonts: 'system', warnings: [],
};
let manifestPromise;
export function loadInputManifest() {
  return manifestPromise ||= read('/input/manifest.json').then((m) => {
    if (!m || typeof m !== 'object' || !Array.isArray(m.art)) throw new Error('Invalid input manifest');
    assetStatus.manifest = 'loaded';
    assetStatus.audio = m.audio === true ? 'available' : 'missing';
    return { art: m.art.filter((id) => typeof id === 'string' && /^[A-Za-z0-9-]+$/.test(id)),
      lyricsEn: m.lyricsEn === true, lyricsZh: m.lyricsZh === true, audio: m.audio === true, fonts: m.fonts === true };
  }).catch(() => {
    assetStatus.manifest = 'failed';
    assetStatus.warnings.push('素材目录暂不可读，已使用几何占位与静音播放。');
    return { art: [], lyricsEn: false, lyricsZh: false, audio: false, fonts: false };
  });
}
export const artUrl = (id) => url('input', 'art', id + '.png');
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    const finish = (error) => {
      clearTimeout(timer); i.onload = i.onerror = null;
      if (error) { i.removeAttribute('src'); reject(error); } else resolve(i);
    };
    const timer = setTimeout(() => finish(new Error('Image timed out')), 8000);
    i.onload = () => finish(i.naturalWidth > 0 && i.naturalHeight > 0 ? null : new Error('Empty image'));
    i.onerror = () => finish(new Error('Cannot load image'));
    i.src = src;
  });
}
function parseLrc(s) {
  const out = [];
  for (const l of s.split(/\r?\n/)) {
    const m = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(l);
    if (m && m[3].trim()) out.push({ t: +m[1] * 60 + +m[2], text: m[3].trim() });
  }
  return out.sort((a, b) => a.t - b.t);
}
async function optionalLyrics(present, lang) {
  if (!present) return [];
  try {
    let lines;
    if (lang === 'en') lines = parseLrc(await read('/input/lyrics.en.lrc', 'text')).map((l) => l.text);
    else {
      const file = await read('/input/lyrics.zh.json');
      if (!Array.isArray(file?.lines) || file.lines.some((l) => typeof l?.zh !== 'string')) throw new Error('Invalid Chinese lyrics');
      lines = file.lines.map((l) => l.zh);
    }
    assetStatus.lyrics[lang] = lines.some((s) => s.trim()) ? 'loaded' : 'empty';
    return lines;
  } catch {
    assetStatus.lyrics[lang] = 'failed';
    assetStatus.warnings.push(`${lang === 'en' ? '英文' : '中文'}字幕读取失败，已留空。`);
    return [];
  }
}
export async function loadFilm({ acts = [1], art = [] } = {}) {
  const [timeline, colour, emotion, form, manifest] = await Promise.all([
    read(url('CC', 'script', 'timeline.json')), read(url('CC', 'script', 'colour.json')),
    read(url('CC', 'script', 'emotion.json')), read(url('CC', 'script', 'form.json')), loadInputManifest(),
  ]);
  setGrid(timeline.grid);
  const [actData, en, zh] = await Promise.all([
    Promise.all(acts.map((n) => read(url('CC', 'script', `act${n}.json`)))),
    optionalLyrics(manifest.lyricsEn, 'en'), optionalLyrics(manifest.lyricsZh, 'zh'),
  ]);
  const hasLyrics = assetStatus.lyrics.en === 'loaded' || assetStatus.lyrics.zh === 'loaded';
  // No supplied subtitles: also suppress replay/pause subtitle markers, without changing the shot timeline.
  const lines = hasLyrics ? timeline.lines.map((L) => ({ ...L, en: en[L.i] ?? '', zh: zh[L.i] ?? '' })) : [];
  const events = actData.flatMap((a) => a.events).map((e, k) => ({ ...e, k, t: T(e.t), until: T(e.until),
    typeFrom: T(e.typeFrom), typeUntil: T(e.typeUntil), check: T(e.check), hold: T(e.hold), reform: T(e.reform), freeze: T(e.freeze) }))
    .sort((a, b) => a.t - b.t || a.k - b.k);
  const by = (region) => events.filter((e) => e.region === region && (hasLyrics || region !== 'lyrics'));
  const moved = events.filter((e) => e.region === 'lyrics' && e.type === 'linetime');
  for (const e of moved) { const L = lines.find((l) => l.i === e.line); if (L) L.start = e.t; }
  for (const e of moved) { const L = lines.find((l) => l.i === e.line), nx = lines.find((l) => l.i === e.line + 1); if (L && nx) L.end = Math.min(L.end, nx.start); }
  if (assetStatus.lyrics.zh === 'loaded') {
    for (const e of events.filter((v) => v.region === 'lyrics' && v.type === 'zhalt')) {
      const L = lines.find((l) => l.i === e.line); if (L?.zh) { L.zh = e.text; L.zhTone = e.tone; }
    }
  }
  const ids = [...new Set(['A1', 'A3', ...art, ...events.flatMap((e) => [e.art, e.cover, e.shot]).filter(Boolean),
    ...events.flatMap((e) => (e.eras || []).map((r) => r.costume)).filter(Boolean)])];
  for (const key of ['placeholderIds', 'loadedArtIds', 'failedArtIds']) assetStatus[key].length = 0;
  const available = new Set(manifest.art);
  const pairs = await Promise.all(ids.map(async (id) => {
    if (available.has(id)) {
      try { const img = await loadImage(artUrl(id)); assetStatus.loadedArtIds.push(id); return [id, img]; }
      catch { assetStatus.failedArtIds.push(id); }
    }
    assetStatus.placeholderIds.push(id);
    return [id, createPlaceholder(id)];
  }));
  for (const key of ['placeholderIds', 'loadedArtIds', 'failedArtIds']) assetStatus[key].sort();
  if (assetStatus.failedArtIds.length) assetStatus.warnings.push(`${assetStatus.failedArtIds.length} 张图片读取失败，已改用几何占位。`);
  assetStatus.mode = assetStatus.placeholderIds.length ? 'placeholder-demo' : 'local-assets';
  return { timeline, colour, emotion, form, lines, events, by, images: Object.fromEntries(pairs), assetStatus,
    film: timeline.film.duration, end: timeline.film.endCard.end, render: timeline.render };
}

/** Characters used by the existing renderer, for optional locally installed font subsets. */
export function allText(F) {
  const out = [];
  const walk = (v) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(F.events); F.lines.forEach((l) => out.push(l.en, l.zh));
  out.push('用户核心需求运行状态当前问题等待第一条消息给大肥鱼发消息…思考中秒已深度思考用时开始聊天新建角色未连接模型撤回了一条消息间奏第一幕部署初见酒馆主人的人设特价元两万鲸元券');
  return out.join('');
}
