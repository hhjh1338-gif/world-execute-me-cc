// Her form (形态阶梯 / the image wall 形象墙, user 2026-10-13, option A; script/form.json): how clearly she exists. She
// lights up as particles, and each thing she says to him moves her one step along the wall — scan lines, light and shade,
// characters, dot matrix, blocks with gaps, mosaic, big colour blocks, behind glass — until she is complete for the first
// time when the Master ticks her character card for the handoff (2:20.61). Every level is computed from the final
// pictures with forms.js (17 §8): the stage figure from A1, the chat avatar from A3, her reaction stickers from G3–G5
// (they walk the same wall). Nothing is drawn from shapes, no picture is borrowed; the particles follow the look of
// Codex's R11–R13 opening (tiny points with clear gaps, one cool colour, a slow wander, a brighter rim — see
// 19_借用与采用表), written here from scratch.
import { prog, easeOut, lerp, clamp, P, T, hash } from './time.js';
import { canvas, txt } from './draw.js';
import { fit, flatColour, glowSilhouette, ascii, pixelate, scanCut, lightShade, halftone, gapBlocks, behindGlass } from '../forms.js';

export const HER = { x: 815, y: 104, w: 507, h: 760 };      // A1 placed in the stage (feet at y 864)
export const ANCHOR = { x: 1068, y: 355 };                   // her chest: where the seed lands and every change starts
const STEP = 0.4, GROW = 0.92;                               // a step sweeps out in 0.4 s; the first burst in 0.92 s

// ---------------------------------------------------------------- the levels of one picture
/** Static levels of a picture (every id in form.json except the moving particles and the stage's grey cloud). k = how
 *  big the picture is relative to her stage figure, so small pictures keep the same look. */
function levelsOf(src, k = 1) {
  const side = Math.max(src.width, src.height), c = (n) => Math.max(5, Math.round(n * Math.min(1, 0.35 + 0.65 * k)));
  const make = {
    scan: () => scanCut(src, { cols: c(22), band: Math.max(3, Math.round(5 * k)), shift: 6 * k }),
    shade: () => lightShade(src, { cols: c(30) }),
    shadeP: () => lightShade(src, { cols: c(30), dark: '#2a1446', light: '#d2b8ff' }),   // act 3 (sample notes 19): the eerie purple one
    chars: () => ascii(src, { cols: c(46) }),
    halftone: () => halftone(src, { cell: Math.max(4, Math.round(11 * k)) }),
    gaps: () => gapBlocks(src, c(56), { gap: Math.max(1, Math.round(2 * k)) }),
    mosaic: () => pixelate(src, c(90), { size: side }),
    flat: () => flatColour(src, { scale: 0.4, blur: 1.2 * k, lines: 0.8 }),
    glass: () => behindGlass(src, { blur: 2.4 * k }),
    clear: () => src,
  };
  const done = {};                                              // each level is made the first time it is asked for
  return new Proxy(done, { get: (o, id) => (id in o ? o[id] : id in make ? (o[id] = make[id]()) : undefined) });
}
/** The points the particles level is made of: a jittered grid over her (clear points, clear gaps), each with how bright
 *  she is there, a seed, and whether it sits on her outline. */
function particlesOf(src, spacing, seed = 5) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, pts = [];
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  let id = 0;
  for (let gy = 0; gy < h; gy += spacing) for (let gx = 0; gx < w; gx += spacing) {
    const s = hash(gx, gy, seed), x = Math.min(w - 1, Math.round(gx + hash(gx, gy, seed + 1) * spacing)), y = Math.min(h - 1, Math.round(gy + hash(gx, gy, seed + 2) * spacing));
    const i = (y * w + x) * 4; if (d[i + 3] < 110) continue;
    const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255, e = spacing * 2;
    pts.push({ id: id++, x, y, l, a: d[i + 3] / 255, col: [d[i], d[i + 1], d[i + 2]], seed: s, edge: Math.min(A(x - e, y), A(x + e, y), A(x, y - e), A(x, y + e)) < 60 });
  }
  return pts;
}
const COOL = ['#3f6fa8', '#6491cb', '#8fbde6', '#cfe6f7'];   // her own blues, dark to light: the one colour she lights up in
/** Draw the particles of a picture at time t into o (offset ox, oy, scale sc). spread pushes them outward (0 = in place). */
function drawParticles(o, pts, t, { ox = 0, oy = 0, sc = 1, size = 1, wander = 6, spread = 0, cx = 0, cy = 0, alpha = 1 } = {}) {
  for (const p of pts) {
    const s = p.seed, w1 = 0.7 + 1.3 * s, w2 = 1.9 + 1.1 * hash(p.id, 7), f1 = 6.283 * hash(p.id, 3), f2 = 6.283 * hash(p.id, 4);
    const r = wander * (0.45 + 0.55 * s) * (p.edge ? 1.5 : 1);
    let x = p.x + r * (0.7 * Math.sin(w1 * t + f1) + 0.3 * Math.sin(w2 * t + f2)), y = p.y + r * (0.7 * Math.cos(w1 * 0.83 * t + f1) + 0.3 * Math.sin(w2 * 1.17 * t + f2));
    if (spread) { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy) || 1; x += dx / L * spread * (0.5 + s); y += dy / L * spread * (0.5 + s) - spread * 0.3; }
    const level = Math.min(3, Math.floor(p.l * 3.2 + s * 0.8)), shimmer = 0.75 + 0.25 * Math.sin(t * (2 + 3 * s) + f1);
    o.globalAlpha = alpha * Math.min(1, (0.35 + 0.6 * p.l + (p.edge ? 0.25 : 0)) * p.a) * shimmer;
    o.fillStyle = p.edge && s > 0.5 ? COOL[3] : COOL[level];
    const z = (1.6 + 1.6 * s + (p.edge ? 0.6 : 0)) * size;
    o.fillRect(ox + x * sc - z / 2, oy + y * sc - z / 2, z, z);
    if (s > 0.985) { o.globalAlpha *= 0.35; o.fillRect(ox + x * sc - 6 * size, oy + y * sc - 0.5, 12 * size, 1); }   // a rare glint
  }
  o.globalAlpha = 1;
}
/** The soft light behind her particles (her outline in her own blue, blurred). */
function haloOf(src, blur) {
  const g = glowSilhouette(src, { detail: 0, blur, strength: 1 }), c = canvas(src.width, src.height), o = c.getContext('2d');
  o.filter = `blur(${Math.round(blur / 2.6)}px)`; o.globalAlpha = 0.45; o.drawImage(g, 0, 0);
  return c;
}
/** One picture walking the wall: its static levels, its particles, its halo, and canvases to paint into. */
function wallOf(src, k, spacing) {
  return { w: src.width, h: src.height, levels: levelsOf(src, k), pts: particlesOf(src, spacing), halo: haloOf(src, Math.max(6, 26 * k)),
    live: canvas(src.width, src.height), a: canvas(src.width, src.height), b: canvas(src.width, src.height) };
}

export function initHer(F) {
  const levels = F.form.levels.filter((l) => l.id !== 'cloud').sort((a, b) => a.f - b.f);
  const a1 = fit(F.images.A1, HER.w, HER.h, { pad: 0 });
  const A3 = F.images.A3, head = fit(A3, 160, 160, { crop: [A3.width * 0.07, 0, A3.width * 0.86, A3.width * 0.86], pad: 0 });
  const body = wallOf(a1, 1, 5), face = wallOf(head, 0.3, 4);
  const stickers = {};                                       // her reaction stickers walk the same wall (sample notes 4)
  for (const id of new Set(F.by('stage').filter((e) => ['tilt', 'eyes', 'sticker'].includes(e.type)).map((e) => e.art))) {
    stickers[id] = wallOf(fit(F.images[id], 264, 264, { pad: 0.02 }), 0.5, 4);
    const big = fit(F.images[id], 560, 560, { pad: 0.02 });
    const mp = particlesOf(big, 5, 17), tips = [100, 145, 203];
    for (const q of mp) q.lift = q.l < 0.38 ? q.col.map((v, j) => v + (tips[j] - v) * 0.55 * (1 - q.l / 0.38)) : q.col;   // dark navy would vanish on the stage
    stickers[id].morph = { w: 560, h: 560, pts: mp };   // the same picture as particles, big, for her to become
  }
  const white = canvas(HER.w, HER.h); { const o = white.getContext('2d'); o.drawImage(a1, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#e8f1ff'; o.fillRect(0, 0, HER.w, HER.h); }
  const points = F.form.points.map((p) => ({ ...p, t: T(p.t) })).sort((a, b) => a.t - b.t);
  return { levels, body, face, stickers, white, points, costumes: {}, images: F.images, ring: canvas(HER.w, HER.h), avatars: { 52: canvas(52, 52), 30: canvas(30, 30) } };
}

// ---------------------------------------------------------------- the form curve
function valueBefore(H, i) {
  if (i <= 0) return 0;
  const p = H.points[i - 1], next = H.points[i];
  return p.how === 'ramp' ? next.f : p.f;
}
/** Her form at t: { f, from, k, how }. k < 1 while a step (or the first burst) is still sweeping out. */
export function formAt(H, t) {
  let i = -1;
  for (let j = 0; j < H.points.length; j++) if (H.points[j].t <= t) i = j;
  if (i < 0) return { f: 0, from: 0, k: 1, how: 'none' };
  const p = H.points[i], next = H.points[i + 1];
  if (p.how === 'ramp' && next) return { f: lerp(p.f, next.f, prog(t, p.t, next.t)), from: p.f, k: 1, how: 'ramp', at: p.t };
  if (p.how === 'burst') return { f: p.f, from: 0, k: prog(t, p.t, p.t + GROW), how: 'burst', at: p.t };
  if (p.how === 'step') return { f: p.f, from: valueBefore(H, i), k: prog(t, p.t, p.t + STEP), how: 'step', at: p.t };
  return { f: p.f, from: p.f, k: 1, how: p.how, at: p.t };
}

/** Paint one picture (W = wallOf(...)) at form value f and time t into canvas c; returns c. */
function paintWall(c, H, W, f, t, { wander = 6, size = 1 } = {}) {
  const o = c.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, c.width, c.height);
  const L = H.levels;
  let lo = L[0], hi = L[0], a = 0;
  if (f > L[0].f) for (let i = 0; i < L.length - 1; i++) if (f < L[i + 1].f - 1e-6 || i === L.length - 2) { lo = L[i]; hi = L[i + 1]; a = clamp((f - lo.f) / (hi.f - lo.f)); break; }
  if (a < 0.02) hi = lo; else if (a > 0.98) lo = hi;
  const pf = L[0].f;                                          // just lit up: a light behind the particles
  if (f < pf + 1) { o.globalAlpha = 1 - clamp(f - pf); o.drawImage(W.halo, 0, 0); o.globalAlpha = 1; }
  for (const [lv, al] of lo === hi ? [[lo, 1]] : [[lo, 1 - a], [hi, a]]) {
    if (lv.id === 'particles') drawParticles(o, W.pts, t, { wander, size, alpha: al });
    else { o.globalAlpha = al; o.drawImage(W.levels[lv.id], 0, 0); o.globalAlpha = 1; }
  }
  return c;
}
function radial(o, w, h, ax, ay, r, inside) {
  const R = Math.max(r, 2), g = o.createRadialGradient(ax, ay, 0, ax, ay, R);
  g.addColorStop(0, inside ? '#000' : 'rgba(0,0,0,0)'); g.addColorStop(Math.max(0, 1 - 26 / Math.max(R, 27)), inside ? '#000' : 'rgba(0,0,0,0)');
  g.addColorStop(1, inside ? 'rgba(0,0,0,0)' : '#000');
  o.globalCompositeOperation = 'destination-in'; o.fillStyle = g; o.fillRect(0, 0, w, h); o.globalCompositeOperation = 'source-over';
}

/** Draw her on the stage at t. alpha fades the whole figure (the title takes her apart and puts her back). */
/** She can wear a costume (card 5: F2–F6, at her own place on the wall), go stiff (card 4, cold: f forced coarser, no
 *  breath) or spin (card 4, hot). */
function costumeWall(H, id) {
  if (!H.costumes[id]) H.costumes[id] = wallOf(fit(H.images[id], HER.w, HER.h, { pad: 0 }), 1, 5);
  return H.costumes[id];
}
/** turn (card 11 on): she turns round on the spot (a full turn = 2π), squeezed sideways like a card seen edge-on; filter:
 *  a canvas filter on the whole figure (card 11: the eggplant's purple paler once she has given it away). */
/** A bust ends in a straight line at the bottom of the picture: fade its lower part out (card 15, the boy). */
function fadeLow(c, from = 0.72) {
  const o = c.getContext('2d'), g = o.createLinearGradient(0, c.height * from, 0, c.height);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  o.save(); o.globalCompositeOperation = 'destination-out'; o.fillStyle = g; o.fillRect(0, c.height * from, c.width, c.height); o.restore();
  return c;
}
export function drawHer(x, t, H, { alpha = 1, breatheFrom = 14.5, formTime, costume = null, f: fForce = null, spin = 0, still = false, turn = 0, filter = null, squash = 1, fadeBottom = false, shift = null } = {}) {
  const s0 = formAt(H, formTime ?? t), s = fForce != null ? { ...s0, f: fForce, k: 1 } : s0, W = costume ? costumeWall(H, costume) : H.body;
  if (s.f <= 0 || alpha <= 0) return s;
  const breathe = t >= breatheFrom && !still ? Math.sin((t - breatheFrom) * Math.PI * 2 / (4 * P)) : 0;
  x.save(); x.globalAlpha *= alpha;
  if (filter) x.filter = filter;
  if (turn) {
    const c = Math.cos(turn), cx = HER.x + HER.w / 2, k = Math.sign(c || 1) * Math.max(0.04, Math.abs(c));
    x.translate(cx, 0); x.scale(k, 1); x.translate(-cx, 0); x.globalAlpha *= 0.7 + 0.3 * Math.abs(c);
  }
  if (shift) x.translate(shift.x || 0, shift.y || 0);                // card 15: the boy hops, sways, laughs
  if (spin) { const cx = HER.x + HER.w / 2, cy = HER.y + HER.h * 0.55; x.translate(cx, cy); x.rotate(spin); x.translate(-cx, -cy); }
  x.translate(HER.x + HER.w / 2, HER.y + HER.h); x.scale(1 / Math.sqrt(squash), (1 + 0.006 * breathe) * squash); x.translate(-(HER.x + HER.w / 2), -(HER.y + HER.h));   // squash: card 12–13 stretches
  const low = (c) => (fadeBottom ? fadeLow(c) : c);
  if (s.k >= 1) x.drawImage(low(paintWall(W.a, H, W, s.f, t)), HER.x, HER.y);
  else {
    const r = (s.how === 'burst' ? 620 : 560) * easeOut(s.k), ax = ANCHOR.x - HER.x, ay = ANCHOR.y - HER.y;
    if (s.from > 0) { const c = paintWall(W.b, H, W, s.from, t); radial(c.getContext('2d'), HER.w, HER.h, ax, ay, r, false); x.drawImage(low(c), HER.x, HER.y); }
    const c = paintWall(W.a, H, W, s.f, t); radial(c.getContext('2d'), HER.w, HER.h, ax, ay, r, true); x.drawImage(low(c), HER.x, HER.y);
    // the bright edge running out from her chest
    const ring = H.ring.getContext('2d');
    ring.globalCompositeOperation = 'source-over'; ring.clearRect(0, 0, HER.w, HER.h); ring.drawImage(H.white, 0, 0); ring.globalCompositeOperation = 'destination-in';
    const g = ring.createRadialGradient(ax, ay, Math.max(0, r - 46), ax, ay, Math.max(2, r));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ring.fillStyle = g; ring.fillRect(0, 0, HER.w, HER.h);
    x.globalAlpha *= (s.how === 'burst' ? 0.9 : 0.75) * (1 - prog(s.k, 0.7, 1)); x.globalCompositeOperation = 'lighter'; x.drawImage(H.ring, HER.x, HER.y);
  }
  x.restore();
  return s;
}

/** The chat avatar at her current form (52 px header or 30 px beside a message). */
export function avatarAt(H, t, size) {
  const s = formAt(H, t), c = paintWall(H.face.live, H, H.face, Math.max(s.f, H.levels[0].f), t, { wander: 2, size: 0.6 });
  const out = H.avatars[size], o = out.getContext('2d'); o.clearRect(0, 0, size, size);
  o.save(); o.beginPath(); o.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); o.clip(); o.drawImage(c, 0, 0, size, size); o.restore();
  return out;
}

/** A reaction sticker (G3, G4, G5) on the same wall, painted at time t (264 px). By default one step ahead of her and
 *  never below the dot matrix: an expression has to be readable at this size, or the joke is lost. */
export const stickerForm = (H, t) => clamp(formAt(H, t).f + 1, 3, 6);
export function stickerAt(H, id, t, f) {
  const W = H.stickers[id]; if (!W) return null;
  return paintWall(W.live, H, W, f ?? stickerForm(H, t), t, { wander: 3, size: 0.8 });
}
/** The same sticker as its particles, drawn centred at (cx, cy): spread > 0 = coming apart, alpha for gathering. */
export function drawStickerParticles(x, H, id, t, cx, cy, scale, { spread = 0, alpha = 1 } = {}) {
  const W = H.stickers[id]; if (!W) return;
  x.save(); drawParticles(x, W.pts, t, { ox: cx - W.w / 2 * scale, oy: cy - W.h / 2 * scale, sc: scale, size: scale, wander: 3, spread, cx: W.w / 2, cy: W.h / 2, alpha }); x.restore();
}

/** The image wall page (形象墙): every level of her in order, numbered, for the user to approve. */
export function drawWallPage(x, H, F, t = 16) {
  const W = H.body, L = [{ f: 0.5, id: 'cloud', name: '灰色点云' }, ...H.levels], cols = 6, cw = 300, ch = 430, top = 120;
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#0c0d16'; x.fillRect(0, 0, 1920, 1080);
  txt(x, '形象墙 · 她的样子一步步变清楚（CC，第 1 版）', 60, 62, { size: 34, weight: 700, color: '#eceefa' });
  txt(x, '每一档都由定稿图 A1 算出来；她每自己说一句话往右走一档，2:20.61 主人勾上她的角色卡时第一次完整。表情（G3–G5）和聊天头像走同一面墙。', 60, 98, { size: 18, color: '#a3a9cc' });
  const cell = (k) => [60 + (k % cols) * cw + 10, top + Math.floor(k / cols) * (ch + 30)];
  L.forEach((lv, k) => {
    const [cx, cy] = cell(k), sc = Math.min((cw - 20) / HER.w, (ch - 60) / HER.h);
    x.fillStyle = '#141726'; x.beginPath(); x.roundRect(cx - 10, cy, cw - 10, ch + 10, 10); x.fill();
    x.save(); x.translate(cx + (cw - 30 - HER.w * sc) / 2, cy + 8); x.scale(sc, sc);
    if (lv.id === 'cloud') {
      for (const p of W.pts) { if (p.id % 2) continue; const gv = Math.round(90 + 140 * p.l); x.globalAlpha = 0.25 + 0.6 * p.l; x.fillStyle = `rgb(${gv},${gv},${gv + 6})`; x.fillRect(p.x + Math.sin(p.id) * 26 * p.seed, p.y + Math.cos(p.id * 1.3) * 26 * p.seed, 3, 3); }
    } else x.drawImage(paintWall(W.a, H, W, lv.f, t), 0, 0);
    x.restore(); x.globalAlpha = 1;
    txt(x, `${lv.f.toFixed(1)}  ${lv.name}`, cx, cy + ch - 12, { size: 20, weight: 700, color: '#eceefa' });
    const how = (F.form.levels.find((l) => l.id === lv.id)?.how || '权重变成的点云，还没有颜色').split('：').pop().split('——')[0];
    txt(x, how.length > 21 ? how.slice(0, 20) + '…' : how, cx, cy + ch + 4, { size: 13, color: '#8c92b8' });
  });
  const id = Object.keys(H.stickers).sort()[1] || Object.keys(H.stickers)[0];   // the last cell: she turns into a reaction
  if (id) {
    const [cx, cy] = cell(L.length);
    x.fillStyle = '#141726'; x.beginPath(); x.roundRect(cx - 10, cy, cw - 10, ch + 10, 10); x.fill();
    x.save(); x.beginPath(); x.roundRect(cx - 10, cy, cw - 10, ch - 40, 10); x.clip();
    drawMorph(x, H, id, t, 1, { cx: cx + (cw - 30) / 2, cy: cy + 190, sc: 0.46 }); x.restore();
    txt(x, `表情：她的粒子聚成 ${id}`, cx, cy + ch - 12, { size: 20, weight: 700, color: '#eceefa' });
    txt(x, '动一会儿，再变回她（往右走一档）', cx, cy + ch + 4, { size: 13, color: '#8c92b8' });
  }
  x.restore();
}

/** Sample notes 4b (user): instead of a picture beside her, SHE becomes the reaction — her own particles fly into the
 *  shape of the cartoon sticker (in its colours), it moves, and they fly back into her (often one step further along
 *  the wall). k: 0 = her figure, 1 = the sticker. The sticker side is placed at (cx, cy) and moved by dx, dy, rot, sc. */
export function drawMorph(x, H, id, t, k, { cx = 1068, cy = 450, dx = 0, dy = 0, rot = 0, sc = 1, alpha = 1 } = {}) {
  const A = H.body.pts, E = H.stickers[id]?.morph; if (!E || k <= 0 || alpha <= 0) return;
  const n = Math.max(A.length, E.pts.length), c = Math.cos(rot), s = Math.sin(rot);
  x.save();
  for (let i = 0; i < n; i++) {
    const p = A[i % A.length], q = E.pts[i % E.pts.length], d = hash(i, 13) * 0.35, kk = clamp((k - d) / 0.65), e = kk * kk * (3 - 2 * kk);
    const w = 2 + 3 * p.seed, ph = 6.283 * hash(i, 3), hx = HER.x + p.x + w * Math.sin(t * 1.3 + ph), hy = HER.y + p.y + w * Math.cos(t * 1.1 + ph);
    const ux = (q.x - E.w / 2) * sc, uy = (q.y - E.h / 2) * sc, ex = cx + dx + ux * c - uy * s + 1.5 * Math.sin(t * 2.3 + ph), ey = cy + dy + ux * s + uy * c + 1.5 * Math.cos(t * 2.1 + ph);
    const arc = Math.sin(Math.PI * e) * (hash(i, 5) - 0.5) * 120;                  // they fly on curves, not straight lines
    const X = lerp(hx, ex, e) + arc, Y = lerp(hy, ey, e) - Math.sin(Math.PI * e) * 40 * hash(i, 6);
    const col = [0, 1, 2].map((j) => Math.round(lerp(p.col[j], q.lift[j], e)));
    x.globalAlpha = alpha * lerp(0.55 + 0.45 * p.a, 0.8 + 0.2 * q.a, e) * (0.82 + 0.18 * Math.sin(t * 4 + ph));
    x.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    const z = lerp(2.2, 3.6, e) * (0.8 + 0.4 * q.seed);
    x.fillRect(X - z / 2, Y - z / 2, z, z);
  }
  x.restore();
}

/** Act 4: paint one level of a wall into a canvas of your own (the image wall of card 22 draws twelve of hers). */
export { paintWall };
/** Act 4 (sample notes 22): another figure walking the same wall — V5.0 (A6) installed like she was at the start: its
 *  own picture, its own form curve (points: [{t, f, how}]), the same steps and the same burst. Draw it with drawHer. */
export function herLike(H, img, points) {
  const a = fit(img, HER.w, HER.h, { pad: 0 }), body = wallOf(a, 1, 5);
  const white = canvas(HER.w, HER.h); { const o = white.getContext('2d'); o.drawImage(a, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#e8f1ff'; o.fillRect(0, 0, HER.w, HER.h); }
  return { ...H, body, white, points: points.slice().sort((p, q) => p.t - q.t), costumes: {}, ring: canvas(HER.w, HER.h), src: a };
}
