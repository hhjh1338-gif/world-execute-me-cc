// Card 10 · the rewind (1:13.918–1:19.46; 36_第三段_分段与时间（卡6–10）.md §8; script/act2.json 'rewind'; the sound is
// already in 音频/edited_song.wav, timeline.json edits[0]). TRUE backward playback — the user (2026-10-14): when it goes back,
// everything goes back to the earlier interface. So the frame at film time t is the film as it was at an earlier story
// time s(t), and s runs backwards: chat, stage, right panel and top bar all un-happen in order. s(t) is a monotone cubic
// through the event's map: frozen half a second on the click, then (sample notes 10) one smooth speed curve — from 0 up
// to its fastest (about ×15) and down to 0 again at 0:28.65 (— 进入 深海小酒馆 —), no stops on the way; the key lines
// (执行 · 只找我 · 爱是陪伴) light up as they go past.
// Drawn at REAL time instead: the memory (the host keeps it outside the chat; right.js), the pocket watch (top.js), the
// lyric bar (lyrics.js), and here: two ghost layers (borrowed: Codex preview/transition-study/rewind-fx.js — 19), the tape
// grade, and the discarded stretch folding into ⑂.
import { prog, easeOut, easeInOut, lerp, clamp, hash } from './time.js';
import { withAlpha, fullCanvas } from './draw.js';

const ev = (F) => F.by('film').find((e) => e.type === 'rewind');

/** Monotone cubic (Fritsch–Carlson) through [[real, story], ...]: never runs forward, flat stretches stay flat, and the
 *  slope is 0 at both ends (starts from a standstill, stops gently). */
function spline(pts) {
  const n = pts.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); m[i] = s * a * d[i]; m[i + 1] = s * b * d[i]; }
  }
  return (X) => {
    if (X <= pts[0][0]) return pts[0][1];
    if (X >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (X > pts[i + 1][0]) i++;
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = x1 - x0, u = (X - x0) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m[i + 1];
  };
}
const curves = new WeakMap();
const storyAt = (e, t) => { let f = curves.get(e); if (!f) { f = spline(e.map); curves.set(e, f); } return f(t); };

/** After the rewind: what of the chat is in the branch now (chat.js, top.js). */
export function cutOf(F) {
  const e = ev(F); return e ? { from: e.to, end: e.t, to: e.end, at: e.land, icon: e.stop } : null;   // the ⑂ is there to gather into
}

/** Inside the rewind: { t (real), s (story), phase, hl (the line that lights up), hlK, ghosts }; null outside. */
export function rewindAt(F, t) {
  const e = ev(F); if (!e || t < e.t || t >= e.end) return null;
  const s = storyAt(e, t), phase = t < e.start ? 'freeze' : t < e.stop ? 'run' : 'stop';
  const key = (e.keys || []).find((k) => s >= k - 0.5 && s < k + 3);              // passing a key line: it lights up
  const hlK = key != null ? Math.sin(Math.PI * prog(s, key - 0.5, key + 3)) : 0;
  const ghosts = phase === 'run' ? [storyAt(e, t - 0.05), storyAt(e, t - 0.11)] : [];
  const speed = t < e.start ? 0 : (storyAt(e, t - 1 / 120) - storyAt(e, t + 1 / 120)) * 60;   // how many times faster than real
  return { e, t, s, phase, hl: key ?? null, hlK, ghosts, speed };
}

const ghostCanvas = (R, i) => {
  R.ghost ||= [];
  if (!R.ghost[i]) R.ghost[i] = fullCanvas();
  return R.ghost[i];
};

/** Over the frame of story time rw.s: the ghosts (the same film a moment ago — later in the story — cyan, only where
 *  brighter, so the text underneath stays clear), the tape grade, tracking lines, and the fold into ⑂. */
export function drawRewind(x, t, R, rw, frame) {
  const e = rw.e;
  rw.ghosts.forEach((sg, i) => {
    if (Math.abs(sg - rw.s) < 0.04) return;
    const c = ghostCanvas(R, i), o = c.getContext('2d');
    frame(o, sg, R, { ...rw, s: sg, hl: null, ghost: true });
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'multiply'; o.fillStyle = '#7fdcff'; o.fillRect(0, 0, c.width, c.height); o.restore();
    x.save(); x.globalCompositeOperation = 'lighten'; x.globalAlpha = i ? 0.16 : 0.3; x.drawImage(c, 0, 0, 1920, 1080); x.restore();   // still things coincide: no change
  });
  const g = easeOut(prog(t, e.t, e.start)) * (1 - prog(t, e.stop, e.end)), run = rw.phase === 'run' ? 1 : 0;
  x.save();
  x.globalCompositeOperation = 'color'; x.globalAlpha = 0.3 * g; x.fillStyle = '#3d63c9'; x.fillRect(0, 0, 1920, 1080);
  x.globalCompositeOperation = 'source-over';
  if (run) for (let i = 0; i < 3; i++) {                           // tape tracking: bright noisy bands crawling up
    const Y = 1080 - ((t * 700 + i * 430) % 1300), h = 3 + 8 * hash(i, Math.floor(t * 30));
    x.globalAlpha = 0.07 + 0.05 * hash(Math.floor(t * 30), i); x.fillStyle = '#dfe9ff'; x.fillRect(0, Y, 1920, h);
  }
  x.restore();
  drawGather(x, t, e, R.F);
}

/** 1:18.40–1:19.00 (sample notes 13): everything that was thrown away — his blue bubbles, hers, the red 分手 blocks —
 *  comes back as small chips and flies, one after another, into the ⑂ in the chat's corner (chat.js draws it from
 *  F.cut.icon, with the count); then the picture is still until 1:19.46, a moment to settle before the song goes on. */
const chipsOf = new WeakMap();
function chips(e, F) {
  let c = chipsOf.get(e); if (c) return c;
  const msgs = F.by('chat').filter((m) => m.t > e.to && m.t < e.t && ['her', 'master', 'think', 'swipe'].includes(m.type));
  c = msgs.map((m, i) => {
    const len = (m.text || '').length || (m.type === 'swipe' ? 30 : 16), w = Math.min(190, 40 + len * 6);
    const col = m.type === 'master' ? '#3651b8' : m.type === 'think' ? (m.flood ? '#ff5a64' : '#3a3f52') : m.type === 'swipe' ? '#5a2a36' : '#2a2f46';
    return { x: m.type === 'master' ? 560 - w : 82, y: 190 + ((i * 97) % 600), w, col, d: i / Math.max(1, msgs.length) };
  });
  for (let q = 0; q < 8; q++) c.push({ x: 900 + hash(q, 1) * 300, y: 420 + hash(q, 2) * 260, w: 22, col: '#ff4a5a', d: hash(q, 3), glyph: '分手'[q % 2] });
  chipsOf.set(e, c); return c;
}
function drawGather(x, t, e, F) {
  if (t < e.stop || t > e.gather + 0.1) return;
  const ICON = { x: 548, y: 118 }, span = e.gather - e.stop - 0.3;
  x.save();
  for (const c of chips(e, F)) {
    const t0 = e.stop + c.d * span, k = prog(t, t0, t0 + 0.3); if (k <= 0 || k >= 1) continue;
    const q = easeInOut(k), cx = lerp(c.x + c.w / 2, ICON.x, q), cy = lerp(c.y, ICON.y, q) - Math.sin(Math.PI * q) * 70, s = lerp(1, 0.12, q);
    x.globalAlpha = Math.min(1, k * 5) * (1 - 0.4 * q);
    if (c.glyph) { x.fillStyle = c.col; x.font = '700 22px "Noto Sans SC", sans-serif'; x.textAlign = 'center'; x.fillText(c.glyph, cx, cy + 8 * s); }
    else { x.fillStyle = c.col; x.beginPath(); x.roundRect(cx - (c.w * s) / 2, cy - 14 * s, c.w * s, 28 * s, 10 * s); x.fill(); x.strokeStyle = withAlpha('#cfe0ff', 0.5); x.lineWidth = 1; x.stroke(); }
  }
  // the ⑂ swallows them: a glow that pulses as they arrive
  const n = chips(e, F).filter((c) => t >= e.stop + c.d * span + 0.3).length;
  if (n) { const f = 0.5 + 0.5 * Math.sin(n * 2.1); x.globalAlpha = 1; const g = x.createRadialGradient(ICON.x, ICON.y, 0, ICON.x, ICON.y, 34); g.addColorStop(0, withAlpha('#ff8a95', 0.55 * f)); g.addColorStop(1, withAlpha('#ff8a95', 0)); x.fillStyle = g; x.fillRect(ICON.x - 34, ICON.y - 34, 68, 68); }
  x.restore();
}
