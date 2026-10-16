// Canvas helpers shared by the regions: fonts, boxes, text that wraps by grapheme (CJK, emoji), coloured segments, and
// the scrambled-then-decoded big words (镜头卡 16 全片通用第 3 条: "先是乱码，约 0.2 秒内一位位解码成正确的词").
import { clamp, hash } from './time.js';

export const SANS = '"Noto Sans SC", "Microsoft YaHei", "Segoe UI Emoji", sans-serif';
export const MONO = 'Consolas, "Noto Sans SC", "Segoe UI Emoji", monospace';
export const font = (size, { weight = 400, mono = false } = {}) => `${weight} ${size}px ${mono ? MONO : SANS}`;

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---- 4K export (sample notes 35): everything is drawn in the film's own 1920×1080 coordinates; the picture can be made
// SC times bigger. base(x) sets the frame's coordinates (in place of setTransform(1, …)); fullCanvas() is a buffer as big
// as the picture. Shadows and blur filters are sized in device pixels and do not follow the transform, so on a
// full-size canvas they are scaled by SC here; at SC = 1 nothing changes.
export let SC = 1;
export const base = (x) => x.setTransform(SC, 0, 0, SC, 0, 0);
export const fullCanvas = () => canvas(1920 * SC, 1080 * SC);
export function setSC(v) {
  SC = v; if (v === 1) return;
  const P = CanvasRenderingContext2D.prototype, big = (o) => o.canvas.width >= 1920 * SC;
  for (const k of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) {
    const d = Object.getOwnPropertyDescriptor(P, k);
    Object.defineProperty(P, k, { configurable: true, get() { const g = d.get.call(this); return big(this) ? g / SC : g; }, set(u) { d.set.call(this, big(this) ? u * SC : u); } });
  }
  const f = Object.getOwnPropertyDescriptor(P, 'filter');
  const up = (s) => s.replace(/(blur|drop-shadow)\(([^)]*)\)/g, (m, fn, args) => `${fn}(${args.replace(/(-?\d*\.?\d+)px/g, (mm, n) => `${n * SC}px`)})`);
  Object.defineProperty(P, 'filter', { configurable: true, get() { return f.get.call(this); }, set(u) { f.set.call(this, big(this) && typeof u === 'string' ? up(u) : u); } });
}

export function box(x, X, Y, W, H, R, { fill = null, stroke = null, width = 1, dash = null, alpha = 1 } = {}) {
  x.save(); x.globalAlpha *= alpha;
  x.beginPath(); x.roundRect(X, Y, W, H, R);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = width; if (dash) x.setLineDash(dash); x.stroke(); }
  x.restore();
}
export function txt(x, s, X, Y, { size = 16, color = '#fff', weight = 400, mono = false, align = 'left', base = 'alphabetic', alpha = 1, spacing = 0 } = {}) {
  x.save(); x.globalAlpha *= alpha; x.font = font(size, { weight, mono }); x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (spacing) x.letterSpacing = `${spacing}px`;
  x.fillText(s, X, Y); x.restore();
}

const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
export const graphemes = (s) => [...seg.segment(s)].map((g) => g.segment);

/** Wrap a run of coloured segments [[text, colour], ...] into lines no wider than maxW. Latin words and numbers stay
 *  whole; CJK and emoji break anywhere. Returns lines of [[text, colour], ...]. */
export function wrapSegs(x, segs, maxW) {
  const tokens = [];
  for (const [s, c] of segs) {
    let word = '';
    for (const g of graphemes(s)) {
      if (/^[A-Za-z0-9.,'’\-_:/~]$/.test(g)) { word += g; continue; }
      if (word) { tokens.push([word, c]); word = ''; }
      tokens.push([g, c]);
    }
    if (word) tokens.push([word, c]);
  }
  // lay tokens into lines; a line never starts with closing punctuation, and punctuation never sticks out past maxW:
  // when it would, the character before it moves down with it
  const rows = [[]], width = (L) => L.reduce((n, t) => n + t[2], 0);
  for (const [s, c] of tokens) {
    const tw = x.measureText(s).width, closing = /^[，。、！？）」』…～]$/.test(s), L = rows[rows.length - 1];
    if (width(L) + tw > maxW && L.length && s !== ' ') {
      if (!closing) rows.push([]);
      else if (L.length > 1) { const carry = L.pop(); rows.push([carry]); }
    }
    const R = rows[rows.length - 1];
    if (!(R.length === 0 && s === ' ')) R.push([s, c, tw]);
  }
  return rows.map((L) => L.reduce((out, [s, c]) => { const last = out[out.length - 1]; if (last && last[1] === c) last[0] += s; else out.push([s, c]); return out; }, []));
}
export const wrap = (x, s, maxW) => wrapSegs(x, [[s, null]], maxW).map((L) => L.map((p) => p[0]).join(''));

/** Draw wrapped segments; colour null = the default colour. Returns the height used. */
export function drawSegs(x, lines, X, Y, lineH, color) {
  lines.forEach((L, i) => {
    let cx = X;
    for (const [s, c] of L) {
      const strike = typeof c === 'string' && c[0] === '~', col = strike ? c.slice(1) : c, w = x.measureText(s).width;
      x.fillStyle = col || color; x.fillText(s, cx, Y + i * lineH);
      if (strike) { x.fillRect(cx, Y + i * lineH - lineH * 0.3, w, Math.max(1.5, lineH * 0.07)); }   // crossed out
      cx += w;
    }
  });
  return lines.length * lineH;
}

const NOISE = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/<>[]{}=+*';
const NOISE_ZH = '鲸泡卡参数载入初始化模型权重角色设定开场陪伴缓存显存校验字段';
/** A word that starts as noise and decodes left to right over `dur` seconds (k = time since start). Characters that are
 *  spaces stay spaces. Noise changes every 1/30 s, frame-independently. */
export function scramble(word, k, dur = 0.2, seed = 1) {
  if (k >= dur) return word;
  const g = graphemes(word), n = g.length, done = Math.floor(clamp(k / dur) * n), tick = Math.floor(k * 30);
  return g.map((c, i) => {
    if (i < done || c === ' ') return c;
    const pool = /[一-鿿]/.test(c) ? NOISE_ZH : NOISE;
    return pool[Math.floor(hash(seed, i, tick) * pool.length)];
  }).join('');
}

export function withAlpha(hex, a) {
  const v = hex.replace('#', ''), n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
/** The branch mark (⑂ in the cards; the fonts draw that glyph tiny): a trunk, one fork, a dot on each tip. (X, Y) is the
 *  bottom of the trunk, s its height. */
export function forkIcon(x, X, Y, s, color, alpha = 1) {
  x.save(); x.globalAlpha *= alpha; x.strokeStyle = color; x.fillStyle = color; x.lineWidth = Math.max(1.5, s / 9); x.lineCap = 'round';
  x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - s); x.moveTo(X, Y - s * 0.45); x.quadraticCurveTo(X + s * 0.55, Y - s * 0.6, X + s * 0.55, Y - s); x.stroke();
  for (const [px, py] of [[X, Y - s], [X + s * 0.55, Y - s], [X, Y]]) { x.beginPath(); x.arc(px, py, s / 7, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
export function mixHex(a, b, k) {
  const p = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = p(a), Bv = p(b);
  return '#' + A.map((v, i) => Math.round(v + (Bv[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('');
}
/** Text whose characters tremble from t0 and then fall one by one (card 8: her words breaking, the program, the
 *  windows). Each character starts falling at t0 + delay + a random part of spread. */
export function fallGlyphs(x, s, X, Y, t, t0, { size = 20, weight = 400, mono = false, color = '#fff', seed = 1, delay = 0.12, spread = 0.6, shake = 2, alpha = 1 } = {}) {
  x.save(); x.font = font(size, { weight, mono }); x.fillStyle = color; x.textBaseline = 'alphabetic';
  let cx = X;
  const tick = Math.floor(t * 30);
  graphemes(s).forEach((g, j) => {
    const w = x.measureText(g).width, dt = t - (t0 + delay + hash(seed, j) * spread);
    let dx = 0, dy = 0, rot = 0, a = 1;
    if (t >= t0) { dx = (hash(seed, j, tick) - 0.5) * 2 * shake; dy = (hash(j, seed, tick) - 0.5) * 2 * shake; }
    if (dt > 0) { dy += 760 * dt * dt + 30 * dt; dx += (hash(seed, j, 5) - 0.5) * 140 * dt; rot = (hash(seed, j, 6) - 0.5) * 7 * dt; a = 1 - clamp(dt / 0.9); }
    if (a > 0) { x.save(); x.globalAlpha *= alpha * a; x.translate(cx + w / 2 + dx, Y + dy); x.rotate(rot); x.fillText(g, -w / 2, 0); x.restore(); }
    cx += w;
  });
  x.restore();
}
/** A small cute bubble with a face (or anything) in it (sample notes 5 liked the sad-face bubbles; sample notes 10 wants
 *  the romance bubbles like that): a clear round skin, a rim, a highlight, the emoji inside. */
export function cuteBubble(x, X, Y, r, inside, alpha = 1, rim = '#80b2d8') {
  if (alpha <= 0.01 || r <= 0.5) return;
  x.save(); x.globalAlpha *= alpha;
  x.fillStyle = withAlpha(rim, 0.14); x.strokeStyle = rim; x.lineWidth = Math.max(1.5, r * 0.08);
  x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.arc(X - r * 0.4, Y - r * 0.4, r * 0.14, 0, Math.PI * 2); x.fill();
  if (inside) { const n = graphemes(inside).length, size = Math.round(r * (n > 1 ? 1.5 / Math.sqrt(n) : 0.95)); txt(x, inside, X, Y + size * 0.36, { size, align: 'center' }); }
  x.restore();
}
