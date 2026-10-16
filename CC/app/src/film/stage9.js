// Centre · stage, act 3, cards 18–21 (1:56.44–2:33.20; 38_第三幕_分段与时间（卡18–21）.md; script/act3.json). The long
// night: the ring that closed round her at COMPLETION goes out light by light (ISOLATION the last); the purple light by his
// point reaches once toward the needs box; the oldest messages are cut off and fall into a little pile in the middle; she
// spams him, goes red step by step and shrinks to a trembling red knot (DISHEARTENED); cold morning light; the update
// notice drops in as a line of code, the error box (the conflict is inside one memory), ▶ runs; she comes back whole —
// as a character card — and gold threads are drawn to everything that will be exported; last, V5.0 faint behind her.
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash } from './time.js';
import { box, txt, font, canvas, withAlpha, graphemes, base, fullCanvas } from './draw.js';
import { HER, ANCHOR } from './her.js';
import { memRect, rowRect } from './right.js';
import { onWall, wallK, cellOf, SLOT } from './stage10.js';
import { masterAt } from './stage2.js';

const one = (F, type, region = 'stage') => F.by(region).find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 }, GOLD = '#ffd27a', RED = '#ff3b47', TAU = Math.PI * 2;
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---------------------------------------------------------------- card 18 · the ring goes out
/** The ring that came down round her at COMPLETION (stage8 drawIllustration) stays where it closed; at each of e.times
 *  one word-light flashes and goes out (ISOLATION, 2:02.81, the last), and the ring line fades with it. */
const RING = { x: 1068, y: 420, r: 340 };
export const nightRing = (F, t) => { const e = one(F, 'lightsout'); return e && t >= e.t && t < e.until ? e : null; };
export function drawNightRing(x, t, F) {
  const e = nightRing(F, t); if (!e) return;
  const words = one(F, 'maths')?.ringWords || [], n = words.length, line = 1 - easeIn(prog(t, e.ringOff, e.ringOff + 0.8));
  const settle = 1 - prog(t, e.t, e.t + 0.5);                        // the warm afterglow of the illustration, gone at once
  if (line > 0) {
    x.save(); x.shadowColor = GOLD; x.shadowBlur = 10 * line + 12 * settle;
    x.strokeStyle = withAlpha('#fff1c8', 0.45 * line + 0.4 * settle); x.lineWidth = 2 + 2 * settle;
    x.beginPath(); x.ellipse(RING.x, RING.y, RING.r, RING.r, 0, 0, TAU); x.stroke(); x.restore();
  }
  if (e.leave) {                                                       // the wait, drawn as the timeline draws it: a dashed line to him, longer every line
    const M = masterAt(F, t), la = line * Math.min(1, (M.far || 0) * 3);
    if (la > 0) { x.save(); x.setLineDash([6, 7]); x.strokeStyle = withAlpha('#d8d0bc', 0.75 * la); x.lineWidth = 1.8; x.beginPath(); const a0 = Math.atan2(M.y - RING.y, M.x - RING.x); x.moveTo(RING.x + RING.r * Math.cos(a0), RING.y + RING.r * Math.sin(a0)); x.lineTo(M.x + 10 * Math.cos(a0 + Math.PI), M.y + 10 * Math.sin(a0 + Math.PI)); x.stroke(); x.restore(); }
  }
  words.forEach((w, i) => {
    const off = e.times[Math.min(i, e.times.length - 1)], a = -Math.PI / 2 + (i / n) * TAU;
    const X = RING.x + RING.r * Math.cos(a), Y = RING.y + RING.r * Math.sin(a);
    let k = t < off ? 0.75 + 0.25 * settle : t < off + 0.1 ? 2 : 0;   // a last flash, then out
    let ember = t >= off ? 0.25 * (1 - prog(t, off + 0.1, off + 1.2)) : 0;
    if (e.leave && t >= off + 0.1) {                                   // sample notes 33: it goes after him, and out
      const M = masterAt(F, t), u = easeInOut(prog(t, off + 0.1, off + 1.1)); if (u >= 1) return;
      const DX = lerp(X, M.x, u), DY = lerp(Y, M.y, u) - 40 * Math.sin(Math.PI * u), fa = 1 - u;
      glow(x, DX, DY, 16, GOLD, 0.45 * fa); x.save(); x.fillStyle = '#fff6e0'; x.globalAlpha = fa; x.beginPath(); x.arc(DX, DY, 3.5 * (1 - 0.5 * u), 0, TAU); x.fill(); x.restore();
      txt(x, w, DX, DY - 12, { size: 17 - 6 * u, weight: 700, color: '#c9c2b0', align: 'center', alpha: 0.75 * fa });
      return;
    }
    if (k > 0) { glow(x, X, Y, 24 + 20 * (k > 1), GOLD, 0.6 * Math.min(k, 1.4)); x.save(); x.fillStyle = '#fff6e0'; x.globalAlpha = Math.min(1, k); x.beginPath(); x.arc(X, Y, 4.5, 0, TAU); x.fill(); x.restore(); }
    if (ember > 0) { x.save(); x.fillStyle = withAlpha('#8a7a60', ember * 2); x.beginPath(); x.arc(X, Y, 3, 0, TAU); x.fill(); x.restore(); }
    const wa = t < off + 0.1 ? Math.min(1, k) * 0.85 : 0.35 * (1 - prog(t, off + 0.1, off + 0.9));
    if (wa > 0) txt(x, w, X, Y + (Math.sin(a) > 0.3 || Math.sin(a) < -0.9 ? 28 : -14), { size: 17, weight: 700, color: t < off ? '#fff0f6' : '#8d8a96', align: 'center', alpha: wa });
  });
}

// ---------------------------------------------------------------- card 19 · reach, cut off, spam, red
/** 2:03.95: she (the little cloud of light) reaches out once from her chest, toward the needs box (top right) — and draws
 *  back. Unclipped. */
export function drawReach(x, t, F) {
  const e = one(F, 'reach'); if (!e || t < e.t || t > e.until) return;
  const out = Math.sin(Math.PI * prog(t, e.t, e.until)), N = 48;
  const P0 = [ANCHOR.x, ANCHOR.y], P1 = [1380, 150], P2 = [1556, 190];
  const at = (u) => { const v = 1 - u; return [v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1]]; };
  const head = 0.86 * easeOut(out);
  x.save(); x.lineCap = 'round'; x.shadowColor = '#80b2d8'; x.shadowBlur = 12;
  for (let q = 1; q <= N; q++) {
    const u0 = head * (q - 1) / N, u1 = head * q / N, [ax, ay] = at(u0), [bx, by] = at(u1), w = q / N;
    const wob = Math.sin(t * 9 + q * 0.5) * 3 * w;
    x.strokeStyle = withAlpha('#a9d2f0', (0.15 + 0.6 * w) * out); x.lineWidth = 0.8 + 2.4 * (1 - w);
    x.beginPath(); x.moveTo(ax, ay + wob); x.lineTo(bx, by + wob); x.stroke();
  }
  const [hx, hy] = at(head); glow(x, hx, hy, 18, '#a9d2f0', 0.7 * out);
  x.restore();
}

/** 2:06.40: the oldest messages (act 1) are cut off the chat — each breaks into character blocks that drop out of the top
 *  of the chat window and fall into a small pile in the middle of the stage; by 2:08 the pile has sunk into the dark. */
const PILE = { x: 1068, y: 846, bw: 24, bh: 22 };
let BLOCKS = null;
function blocksOf(e) {
  if (BLOCKS && BLOCKS.e === e) return BLOCKS.list;
  const list = [], chars = e.texts.flatMap((s, m) => graphemes(s).filter((g) => g.trim()).map((g, j) => ({ g, m, j })));
  const rows = []; let left = chars.length, w = 15;                 // a mound: wide rows at the bottom, narrower above
  while (left > 0) { const c = Math.min(left, Math.max(1, w)); rows.push(c); left -= c; w -= 2; }
  let i = 0;
  rows.forEach((c, r) => { for (let q = 0; q < c; q++) {
    const ch = chars[i++], slot = { x: PILE.x + (q - (c - 1) / 2) * PILE.bw + (hash(i, 4) - 0.5) * 6, y: PILE.y - r * PILE.bh, rot: (hash(i, 5) - 0.5) * 0.5 };
    const born = e.t + ch.m * 0.14 + ch.j * 0.025, start = { x: 60 + ((ch.j * 23 + ch.m * 41) % 470), y: 168 };
    list.push({ ...ch, slot, born, land: born + 0.75 + hash(i, 6) * 0.2, start, ord: i });
  } });
  BLOCKS = { e, list }; return list;
}
function blockPos(b, t) {
  const k = prog(t, b.born, b.land), up = { x: lerp(b.start.x, b.slot.x, 0.35), y: b.start.y - 70 - 50 * hash(b.ord, 7) };
  const u = easeIn(k), v = 1 - u;
  return { x: v * v * b.start.x + 2 * v * u * up.x + u * u * b.slot.x, y: v * v * b.start.y + 2 * v * u * up.y + u * u * b.slot.y, rot: b.slot.rot * k + (1 - k) * Math.sin(b.ord + t * 8) * 0.6, k };
}
function drawBlock(x, X, Y, rot, g, a, pal) {
  x.save(); x.translate(X, Y); x.rotate(rot); x.globalAlpha = a;
  box(x, -11, -10, 22, 20, 4, { fill: '#202637', stroke: '#4a5578' });
  txt(x, g, 0, 6, { size: 14, color: '#c9d2ea', align: 'center' });
  x.restore();
}
/** In flight: drawn over the chat and the stage (unclipped). */
export function drawTruncFly(x, t, F) {
  const e = one(F, 'truncate', 'chat'); if (!e || t < e.t || t > e.t + 2) return;
  for (const b of blocksOf(e)) { if (t < b.born || t >= b.land) continue; const p = blockPos(b, t); drawBlock(x, p.x, p.y, p.rot, b.g, 1, null); }
}
/** Landed: the pile in the stage, sinking and darkening until 2:08 (buried under the night). */
export function drawTruncPile(x, t, F) {
  const e = one(F, 'truncate', 'chat'); if (!e || t < e.t) return;
  const sink = easeIn(prog(t, 127.27, 128.3)); if (sink >= 1) return;
  for (const b of blocksOf(e)) { if (t < b.land) continue; const bump = 1 - easeOut(prog(t, b.land, b.land + 0.12)); drawBlock(x, b.slot.x, b.slot.y + 40 * sink - 4 * bump, b.slot.rot, b.g, 1 - sink, null); }
}

/** Sample notes 19: when an item on the export list is ticked, the thing it stands for loses its weight — it floats up,
 *  bobs up and down twice, and then stays a little suspended (so you can see what was just chosen). Returns a y offset
 *  (negative = up). lift scales the part that stays up (0: only the two bobs). */
export function floatOf(F, name, t, { lift = 1 } = {}) {
  const ex = one(F, 'export', 'chat'), it = ex && ex.items.find(([, n]) => n === name);
  if (!it || t < it[0]) return 0;
  const u = t - it[0], up = 10 * lift * easeOut(clamp(u / 0.22));
  const bob = u > 0.22 && u < 1.32 ? Math.sin(((u - 0.22) / 0.55) * TAU) * 7 * (1 - (u - 0.22) / 1.3) : 0;   // two bobs, settling
  const drift = u >= 1.32 ? 1.6 * Math.max(lift, 0.3) * Math.sin((u - 1.32) * 1.9) * clamp((u - 1.32) / 0.6) : 0;   // and it hangs there
  return -(up + bob + drift);
}
/** Her whole figure: the character card (2:20.61) lifts her, 人设 (2:28.00) bobs her again. */
export const herFloat = (F, t) => floatOf(F, '角色卡', t, { lift: 1.6 }) + floatOf(F, '人设', t, { lift: 0 });
/** Her shadow on the floor, left behind when she floats (drawn before her). */
export function drawHerShadow(x, t, F, f = 1) {
  const fy = herFloat(F, t); if (fy > -0.5 || f <= 0) return;
  const k = clamp(-fy / 24), g = x.createRadialGradient(ANCHOR.x, 860, 0, ANCHOR.x, 860, 170);
  g.addColorStop(0, `rgba(0,0,0,${0.5 - 0.15 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.translate(ANCHOR.x, 860); x.scale(1 - 0.2 * k, 0.11); x.translate(-ANCHOR.x, -860); x.fillStyle = g; x.fillRect(ANCHOR.x - 170, 690, 340, 340); x.restore();
}

/** Her look in act 3: 2:07.27 she goes red a step at a time and from 2:09.20 shrinks to a red knot (DISHEARTENED,
 *  2:10.43) that trembles until the character card is ticked (2:20.61) and she is whole again. From 2:28.00 (人设
 *  ticked) her outline is traced in gold. Returns {scale, dx, dy, filter} for stage1 to draw her with. */
export function herAct3(F, t, f = 1) {
  const e = one(F, 'redden2'), m = {};
  if (e && t >= e.t && t < e.until + 0.35) {
    const back = prog(t, e.until, e.until + 0.35);
    const red = Math.floor(prog(t, e.t, e.full) * 6) / 6 * (1 - back);
    const s = lerp(1, 0.45, easeInOut(prog(t, e.shrink[0], e.shrink[1])));
    m.scale = back > 0 ? lerp(0.45, 1, easeBack(back, 1.2)) : s;
    if (red > 0) m.filter = Math.abs(f - 1.25) < 0.01                 // the purple light-dark goes crimson, not gold (sample notes 19)
      ? `hue-rotate(${70 * red}deg) saturate(${1 + 1.4 * red}) brightness(${1 + 0.08 * red})`
      : `sepia(${red}) saturate(${1 + 4 * red}) hue-rotate(${-38 * red}deg) brightness(${1 + 0.15 * red})`;
    if (t >= e.tremble && back <= 0) { const q = Math.floor(t * 30); m.dx = (hash(q, 1) - 0.5) * 7; m.dy = (hash(q, 2) - 0.5) * 5; }
  }
  const ex = one(F, 'export', 'chat'), per = ex && ex.items.find(([, n]) => n === '人设');
  if (per && t >= per[0]) { const k = easeOut(prog(t, per[0] + 0.3, per[0] + 0.6)); m.filter = `drop-shadow(0 0 ${1.5 * k}px ${GOLD}) drop-shadow(0 0 ${7 * k}px rgba(255,210,122,${0.55 * k}))`; }
  m.fy = herFloat(F, t);
  return m;
}
/** Wraps drawing her with herAct3's scale/tremble (round her chest). */
export function withHerAct3(x, m, draw) {
  if (!m.scale && !m.dx && !m.fy) return draw();
  x.save(); x.translate(ANCHOR.x + (m.dx || 0), ANCHOR.y + (m.dy || 0) + (m.fy || 0)); const s = m.scale || 1; x.scale(s, s); x.translate(-ANCHOR.x, -ANCHOR.y);
  draw(); x.restore();
}
/** 2:07.27–2:11.00: the spam — oversaturated, a gentle sway (render.js applies it to the whole frame). */
export function frenzyAt(F, t) {
  const e = one(F, 'frenzy'); if (!e || t < e.t || t >= e.until + 0.4) return null;
  const k = easeOut(prog(t, e.t, e.t + 0.3)) * (1 - prog(t, e.until, e.until + 0.4));
  return { k, rot: 0.006 * k * Math.sin(t * 2.1), dx: 6 * k * Math.sin(t * 1.3 + 1), sat: 1 + 0.7 * k };
}

// ---------------------------------------------------------------- card 20 · morning, the update, the error
/** 2:11.25: cold morning light through a window, top left, over the dark. */
export function drawMorning(x, t, F) {
  const e = one(F, 'morning'); if (!e || t < e.t || t > e.until + 1.2) return;
  const k = easeOut(prog(t, e.t, e.t + 1)) * (1 - prog(t, e.until, e.until + 1.2));
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const x0 = STG.x + 40 + i * 120, g = x.createLinearGradient(x0, STG.y, x0 + 520, STG.y + 760);
    g.addColorStop(0, withAlpha('#cfdcf0', 0.11 * k)); g.addColorStop(1, withAlpha('#cfdcf0', 0));
    x.fillStyle = g; x.beginPath(); x.moveTo(x0, STG.y); x.lineTo(x0 + 80, STG.y); x.lineTo(x0 + 80 + 560, STG.y + 760); x.lineTo(x0 + 560, STG.y + 760); x.closePath(); x.fill();
  }
  x.restore();
}
/** 2:14.20: the notice's line falls into the middle and becomes code that has not run; its arguments are underlined one by
 *  one; ▶ at 2:19.34. */
const CODE = { x: 1068, y: 712 };
export function drawCode(x, t, F) {
  const e = one(F, 'code'); if (!e || t < e.t + 0.25 || t > e.until) return;
  const fall = easeIn(prog(t, e.t + 0.25, e.t + 0.85)), out = 1 - prog(t, e.until - 0.45, e.until);   // gone as she comes back whole (2:20.61)
  const Y = lerp(STG.y - 10, CODE.y, fall), run = t >= e.run ? prog(t, e.run, e.run + 1.6) : 0;
  x.save(); x.globalAlpha = out;
  x.font = font(26, { mono: true, weight: 700 }); const W = x.measureText(e.text).width, X0 = CODE.x - W / 2;
  box(x, X0 - 64, Y - 38, W + 92, 58, 10, { fill: withAlpha('#0c1018', 0.88), stroke: run ? '#7fd1a8' : '#3a4560' });
  const parts = [['update', 0], ['model', 7], ["'DeepSeek-V5.0'", 15]];
  txt(x, e.text, X0, Y, { size: 26, mono: true, weight: 700, color: '#e6ecff' });
  parts.forEach(([s, at], i) => {                                    // underlines, one per argument, as if read slowly
    const t0 = e.t + 1.1 + i * 0.5, k = easeOut(prog(t, t0, t0 + 0.3)); if (k <= 0) return;
    x.font = font(26, { mono: true, weight: 700 }); const ux = X0 + x.measureText(e.text.slice(0, at)).width, uw = x.measureText(s).width;
    x.strokeStyle = i === 2 ? '#ff8a8a' : '#8fb3ff'; x.lineWidth = 2; x.beginPath(); x.moveTo(ux, Y + 8); x.lineTo(ux + uw * k, Y + 8); x.stroke();
  });
  const pa = t >= e.run ? 1 : 0.35;                                  // ▶: waiting, then pressed
  x.fillStyle = withAlpha(t >= e.run ? '#7fd1a8' : '#8b93ad', pa); x.beginPath(); x.moveTo(X0 - 48, Y - 22); x.lineTo(X0 - 48, Y + 4); x.lineTo(X0 - 26, Y - 9); x.closePath(); x.fill();
  if (run > 0) {                                                     // running: a progress line under it
    x.fillStyle = '#7fd1a8'; x.fillRect(X0 - 64, Y + 24, (W + 92) * easeInOut(run), 3);
    if (t < e.run + 0.15) { x.globalAlpha = out * (1 - prog(t, e.run, e.run + 0.15)); box(x, X0 - 64, Y - 38, W + 92, 58, 10, { fill: '#ffffff' }); }
  }
  x.restore();
}
/** 2:16.76–2:19.34: ILLEGAL ARGUMENTS — an error box across the picture; the conflict is inside one memory of hers (love =
 *  company · do all he asks: staying vs. being replaced). Red status codes ring her, 409 Conflict the biggest. */
export function drawError(x, t, F) {
  const e = one(F, 'error'); if (!e || t < e.t || t >= e.until) return;
  const k = easeOut(prog(t, e.t, e.t + 0.2)), out = 1 - prog(t, e.until - 0.12, e.until), q = Math.floor(t * 30);
  const shake = (1 - prog(t, e.t, e.t + 0.5)) * 8, sx = (hash(q, 3) - 0.5) * shake, sy = (hash(q, 4) - 0.5) * shake;
  // the codes round her (she is the red knot at her chest)
  e.codes.forEach((c, i) => {
    const t0 = e.t + 0.12 + i * 0.09; if (t < t0) return;
    const big = c.includes('409'), a = (i / e.codes.length) * TAU + 0.35 * (t - e.t) - 0.3, R = big ? 150 : 205 + 25 * hash(i, 8);
    const X = ANCHOR.x + R * Math.cos(a), Y = ANCHOR.y + R * 0.8 * Math.sin(a), pop = easeBack(prog(t, t0, t0 + 0.2), 2);
    x.save(); x.shadowColor = RED; x.shadowBlur = big ? 18 : 8;
    txt(x, c, X, Y, { size: (big ? 32 : 19) * pop, mono: true, weight: 700, color: big ? '#ff5a64' : '#d6303a', align: 'center', alpha: out * (big ? 1 : 0.8) });
    x.restore();
  });
  // the box
  const Y0 = 520, H = 136, X0 = STG.x + 36, W = STG.w - 72;
  x.save(); x.globalAlpha = k * out; x.translate(sx, sy);
  box(x, X0, Y0, W, H, 8, { fill: withAlpha('#1a070b', 0.92), stroke: RED, width: 2 });
  x.fillStyle = RED; x.fillRect(X0, Y0, W, 30);
  txt(x, '✕  ' + e.lines[0], X0 + 16, Y0 + 22, { size: 18, mono: true, weight: 700, color: '#ffffff' });
  txt(x, e.lines[1], X0 + 20, Y0 + 66, { size: 20, mono: true, color: '#ffd0d4' });
  txt(x, e.lines[2], X0 + 20, Y0 + 104, { size: 18, color: '#ffb0b6' });
  x.restore();
}

// ---------------------------------------------------------------- card 21 · threads, and V5.0 behind her
/** From 2:20.61, as each item on the export list is ticked, a thin gold thread is let down from the top to the thing on her
 *  (card 16's puppet strings): the card frame round her, the world book's stage edge, her chest (long-term memory), the
 *  chat's scroll bar, the ⑂ corner, her outline (人设), a box round her face, the bubble. Unclipped (two go to the chat). */
export const CARD_MINI = { x: 630, y: 94, sc: 0.39, w: 234, h: 129 };   // card 21: where the character card hangs (sample notes 20)
const FACE = { x: HER.x + 243, y: HER.y + 184 };
const TARGET = {
  '角色卡': { top: [CARD_MINI.x + 117, CARD_MINI.y] }, '世界书': { top: [640, 68] }, '长期记忆': { top: [1068, 355] }, '聊天记录': { top: [304, 66] },
  '分支': { top: [548, 120] }, '人设': { top: [1196, 300] }, '头像': { top: [FACE.x, FACE.y - 64] }, '口头禅（吐泡泡）': { top: [1150, 210] },
};
export function drawThreads(x, t, F) {
  const th = one(F, 'threads'), ex = one(F, 'export', 'chat'); if (!th || !ex || t < th.t) return;
  x.save(); x.lineCap = 'round';
  ex.items.forEach(([t0, name], i) => {
    const T = TARGET[name]; if (!T || t < t0 || t >= takenAt(F, name) + 0.1) return;   // act 4: the copy goes up it, and it is gone
    if (shockHide(F, t) > 0.99) return;
    const onHer = ['长期记忆', '人设', '头像', '口头禅（吐泡泡）'].includes(name), own = ['角色卡', '世界书', '分支', '头像', '口头禅（吐泡泡）'].includes(name);
    const fdy = (onHer ? herFloat(F, t) : 0) + (own ? floatOf(F, name, t) : 0);
    const WK = { '长期记忆': 2, '人设': 5, '头像': 6, '口头禅（吐泡泡）': 7 }[name], wz = WK != null ? wallK(F, t) : 0;
    let [tx, ty] = [T.top[0], T.top[1] + fdy]; if (wz > 0) [tx, ty] = onWall(F, t, WK, T.top[0], T.top[1] + fdy * (1 - wz));
    const msc = WK != null ? lerp(1, cellOf(0).sc * 1.6, wz) : 1, down = easeOut(prog(t, t0, t0 + 0.4)), sw = Math.sin(t * 1.2 + i * 1.7) * 6, ax = tx + (i % 2 ? 14 : -14);
    const yEnd = lerp(46, ty, down);
    x.strokeStyle = withAlpha(GOLD, 0.8); x.lineWidth = 1.2; x.shadowColor = GOLD; x.shadowBlur = 6;
    x.beginPath(); x.moveTo(ax, 46); x.quadraticCurveTo((ax + tx) / 2 + sw, (46 + yEnd) / 2, lerp(ax, tx, down), yEnd); x.stroke();
    const on = easeOut(prog(t, t0 + 0.35, t0 + 0.7)); if (on <= 0) return;
    x.globalAlpha = on * (WK != null ? 1 - 0.5 * wz : 1); x.shadowBlur = 10 * (WK != null ? 1 - 0.7 * wz : 1);   // on her frames: quieter
    if (name === '世界书') { x.strokeStyle = withAlpha(GOLD, 0.18); x.lineWidth = 1; x.beginPath(); x.roundRect(STG.x + 4, STG.y + 4, STG.w - 8, STG.h - 8, 8); x.stroke(); }   // a faint trace where the world was
    else if (name === '长期记忆') { glow(x, tx, ty, 26 * msc, GOLD, 0.8); x.fillStyle = '#fff6e0'; x.beginPath(); x.arc(tx, ty, 4 * Math.max(0.6, msc), 0, TAU); x.fill(); }
    else if (name === '分支') { glow(x, 548, 132 + fdy, 30, GOLD, 0.7); }
    else if (name === '头像') { const [fx, fy] = wz > 0 ? onWall(F, t, 6, FACE.x, FACE.y) : [FACE.x, FACE.y + fdy]; x.save(); x.translate(fx, fy); x.rotate(-0.28); x.scale(msc, msc); x.strokeStyle = withAlpha(GOLD, 0.85); x.lineWidth = 1.8 / msc; x.strokeRect(-64, -64, 128, 128); x.restore(); }
    else if (name === '口头禅（吐泡泡）') { const r = (16 + Math.sin(t * 3) * 1.5) * Math.max(0.5, msc); x.strokeStyle = withAlpha(GOLD, 0.9); x.lineWidth = 1.8; x.beginPath(); x.arc(tx, ty + r, r, 0, TAU); x.stroke(); x.fillStyle = withAlpha('#ffffff', 0.5); x.beginPath(); x.arc(tx - r * 0.35, ty + r * 0.6, 3, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  });
  x.restore();
}
/** 2:31.53: in the dark behind her, faintly, another figure — the same maid dress and fin ears, flat blue, no ahoge (V5.0,
 *  A6) — like a reflection in glass. Drawn before her. */
let A6 = null;
const GHOST = { w: 600, h: 900, x: 890, y: -60, face: { x: 300, y: 328 } };   // A6 is a bust: its face up and to the right of hers, larger
function ghostOf(img) {
  const c = canvas(GHOST.w, GHOST.h), o = c.getContext('2d');
  o.filter = 'grayscale(1) sepia(1) hue-rotate(175deg) saturate(2.2) brightness(1.05)'; o.drawImage(img, 0, 0, GHOST.w, GHOST.h); o.filter = 'none';
  o.globalCompositeOperation = 'destination-in';                     // a soft oval, no picture edges: a reflection, not a poster
  const g = o.createRadialGradient(GHOST.face.x, GHOST.face.y + 60, 60, GHOST.face.x, GHOST.face.y + 120, 470);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  o.fillStyle = g; o.fillRect(0, 0, GHOST.w, GHOST.h);
  return c;
}
export function drawReflection(x, t, F) {
  const e = one(F, 'reflection'); if (!e || t < e.t || !F.images[e.art] || one(F, 'v5slot')) return;   // sample notes 23: it rises in the corner instead (stage10 drawV5)
  A6 ||= ghostOf(F.images[e.art]);
  const k = easeInOut(prog(t, e.t, e.t + 1.2)), sl = one(F, 'v5slot'), go = sl ? easeInOut(prog(t, sl.t, sl.t + 0.45)) : 0;
  if (go >= 1) return;
  const tx = SLOT.x + 126 - GHOST.face.x * 0.42, ty = SLOT.y + 36 - GHOST.face.y * 0.42;   // toward the corner, smaller, fading
  x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.26 * k * (1 - go);
  x.translate(lerp(GHOST.x, tx, go), lerp(GHOST.y + 12 * (1 - k), ty, go)); x.scale(lerp(1, 0.42, go), lerp(1, 0.42, go)); x.drawImage(A6, 0, 0); x.restore();
}

/** Sample notes 19 (2:18.41): the Master clicks ［更新］ and rings of water spread from that point over the whole screen —
 *  the picture refracts as each ring passes (a crest pushes outward, its trough pulls in), light on the crest; the first
 *  ring reaches the far corners as the piano comes in (e.full = 2:18.91). render.js calls this after the frame is drawn,
 *  before the cursor. */
let RIP = null;
export function drawRipple(x, t, F) {
  const e = one(F, 'ripple'); if (!e || t < e.t || t > e.until) return;
  RIP ||= fullCanvas();
  const o = RIP.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, RIP.width, RIP.height); o.drawImage(x.canvas, 0, 0);
  const [cx, cy] = e.at, far = Math.hypot(Math.max(cx, 1920 - cx), Math.max(cy, 1080 - cy)), speed = far / (e.full - e.t);
  x.save(); base(x);
  for (const [delay, amp] of [[0, 18], [0.11, 11], [0.22, 6]]) {
    const R = speed * (t - e.t - delay); if (R <= 6) continue;
    const decay = Math.max(0, 1 - R / (far * 1.3)), W = 54 + 0.05 * R, A = amp * decay, S = 6;
    if (A < 0.3) continue;
    for (let q = -S; q < S; q++) {
      const r0 = Math.max(0, R + (q / S) * W), r1 = R + ((q + 1) / S) * W; if (r1 <= 1) continue;
      const mid = (r0 + r1) / 2, d = A * Math.sin(Math.PI * (q + 0.5) / S), k = (mid + d) / Math.max(mid, 1);
      x.save(); x.beginPath(); x.arc(cx, cy, r1, 0, TAU); x.arc(cx, cy, r0, 0, TAU, true); x.clip();
      x.translate(cx, cy); x.scale(k, k); x.translate(-cx, -cy); x.drawImage(RIP, 0, 0, 1920, 1080); x.restore();
    }
    const lit = decay * amp / 18;
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(190,220,255,${0.3 * lit})`; x.lineWidth = 3;
    x.beginPath(); x.arc(cx, cy, R + W * 0.3, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'source-over'; x.strokeStyle = `rgba(0,0,0,${0.22 * lit})`; x.lineWidth = 5;
    x.beginPath(); x.arc(cx, cy, Math.max(1, R - W * 0.45), 0, TAU); x.stroke();
  }
  const f = 1 - prog(t, e.t, e.t + 0.35); if (f > 0) glow(x, cx, cy, 70, '#ffffff', 0.7 * f);   // where his finger came down
  x.restore();
}

/** Sample notes 20–21 (2:07.27–2:18.41): once the cut-off pile has sunk, everything she spams comes down on the stage — her
 *  lines in red blocks, and loose characters and words (回 来 在 吗 你 哪 · 回来 · 在吗？· 你在哪？· 我看见你了 · 为什么不回我？…)
 *  — and they heap up behind her, not in rows but piled anyhow, tilted, overlapping, until the stage is full to the top.
 *  The letters bleed: each smears downward and some run in thin red drips; blood runs down from the top edge too. She,
 *  shrunk, stays in the middle in front. The ring of 更新 breaks the heap up and draws it off. Drawn before her. */
let WALLS = null;
const MEASURE = canvas(4, 4).getContext('2d');
const CHARS = ['回', '来', '在', '吗', '你', '哪', '我', '想', '看', '见', '为', '什', '么', '不', '理'];
function wallTiles(F, e) {
  if (WALLS && WALLS.e === e) return WALLS.list;
  const msgs = F.by('chat').filter((m) => m.type === 'her' && m.t >= e.t - 0.01 && m.t < e.t + 3.8), list = [];
  const X0 = STG.x + 10, X1 = STG.x + STG.w - 10, FLOOR = STG.y + STG.h - 6, COL = 6, n = Math.ceil((X1 - X0) / COL), hm = new Array(n).fill(0);
  let i = 0, tries = 0, miss = 0, full = false;
  const ceilAt = (cx) => 590 - 160 * Math.pow(Math.min(1, Math.abs(cx - 1068) / 460), 1.4);   // sample notes 22: under her feet in the middle, higher at the sides
  const drop = (str, at, size, boxed, cxAt = null) => {
    if (full) return false;
    MEASURE.font = font(size, { weight: 700 });
    const w = Math.round(MEASURE.measureText(str).width + (boxed ? 22 : 6)), h = Math.round(size * (boxed ? 1.55 : 1.15));
    const tr = tries++, u = i < 110 ? (hash(tr, 31) + hash(tr, 32) + hash(tr, 33)) / 3 : hash(tr, 31);   // a heap: the middle first, then everywhere
    const cx = cxAt != null ? clamp(cxAt, X0 + w / 2, X1 - w / 2) : X0 + w / 2 + u * (X1 - X0 - w);
    const c0 = Math.max(0, Math.floor((cx - w / 2 - X0) / COL)), c1 = Math.min(n - 1, Math.floor((cx + w / 2 - X0) / COL));
    let base = 0; for (let c = c0; c <= c1; c++) base = Math.max(base, hm[c]);
    const sink = h * (0.3 + 0.25 * hash(i, 34));                      // they sink into what is under them: a dense heap
    const y = FLOOR - base - h + sink;
    if (y < ceilAt(cx)) { if (cxAt == null && ++miss > 90) full = true; return false; }   // no room here: try elsewhere, until there is none
    miss = 0;
    for (let c = c0; c <= c1; c++) hm[c] = base + h - sink;
    list.push({ s: str, t: at, size, boxed, i, slot: { x: cx - w / 2, y, w, h }, rot: (hash(i, 3) - 0.5) * (boxed ? 0.32 : 0.9), bleed: hash(i, 35) < 0.1, depth: base / (FLOOR - STG.y) });
    i++; return true;
  };
  const pick = (j, q) => (hash(j, q, 41) < 0.35 ? [CHARS[Math.floor(hash(j, q, 42) * CHARS.length)], 26 + Math.round(20 * hash(j, q, 43)), false] : [e.extra[(j * 3 + q * 7) % e.extra.length], 18 + Math.round(12 * hash(j, q, 44)), hash(j, q, 45) < 0.5]);
  const lowFill = (k, at, j) => {                                   // into the lowest places that still have room
    for (let q = 0; q < k; q++) {
      let best = -1, bh = Infinity;
      for (let c = 0; c < n; c += 3) { const X = X0 + c * COL; if (FLOOR - hm[c] - 18 < ceilAt(X)) continue; const v = hm[c] + 6 * hash(j, q, c); if (v < bh) { bh = v; best = c; } }
      if (best < 0) return;
      const [str, size, boxed] = pick(j, q + 11); drop(str, at + 0.012 * q, size, boxed, X0 + best * COL + (hash(j, q, 46) - 0.5) * 30);
    }
  };
  msgs.forEach((m, j) => {                                            // her line, then a handful of loose ones with it
    drop(m.text, m.t, 24 + Math.round(8 * hash(j, 1)), true);
    const more = 5 + Math.floor(hash(j, 2) * 4);
    for (let q = 0; q < more; q++) {
      const r = hash(j, q, 5), at = m.t + 0.02 * (q + 1);
      if (r < 0.35) drop(CHARS[Math.floor(hash(j, q, 6) * CHARS.length)], at, 28 + Math.round(22 * hash(j, q, 7)), false);
      else drop(e.extra[(j * 5 + q) % e.extra.length], at, 18 + Math.round(12 * hash(j, q, 8)), hash(j, q, 9) < 0.55);
    }
    lowFill(5, m.t + 0.03, j);                                       // and a few into the gaps at the bottom, every time
  });
  const last = msgs.length ? msgs[msgs.length - 1].t + 0.05 : e.t;
  lowFill(400, last, 999);                                            // then fill every gap up to the ceiling
  for (let q = 0, at = last + 0.3; !full && q < 600; q++, at += 0.004) { const [str, size, boxed] = pick(777, q); drop(str, at, size, boxed); }
  const N = list.length, t1 = (msgs.length ? msgs[msgs.length - 1].t : e.t + 3) + 0.1;   // it builds up through the whole spam, bottom first
  list.forEach((b, j) => { b.t = e.t + (t1 - e.t) * Math.pow(j / Math.max(1, N - 1), 0.85); });
  WALLS = { e, list }; return list;
}
export function drawWordWall(x, t, F) {
  const e = one(F, 'wordwall'); if (!e || t < e.t || t > e.until) return;
  const rp = one(F, 'ripple'), q = Math.floor(t * 24), list = wallTiles(F, e);
  const far = rp ? Math.hypot(Math.max(rp.at[0], 1920 - rp.at[0]), Math.max(rp.at[1], 1080 - rp.at[1])) : 1, sp = rp ? far / (rp.full - rp.t) : 1;
  x.save();
  for (const b of list) {
    if (t < b.t) continue;
    const fall = easeIn(prog(t, b.t, b.t + 0.34)), land = prog(t, b.t + 0.34, b.t + 0.5), bounce = Math.sin(Math.PI * land) * 7 * (1 - land);
    let X = b.slot.x, Y = lerp(STG.y - 70 - b.slot.h, b.slot.y, fall) - bounce, a = 1, sc = 1, rot = b.rot * (0.4 + 0.6 * fall);
    if (fall >= 1) { X += (hash(b.i, q) - 0.5) * 2; Y += (hash(q, b.i) - 0.5) * 1.5; }   // the heap trembles
    if (rp && t >= rp.t) {                                            // the ring breaks it up and draws it off
      const hit = rp.t + Math.hypot(X + b.slot.w / 2 - rp.at[0], Y + b.slot.h / 2 - rp.at[1]) / sp, k = prog(t, hit, hit + 0.4);
      if (k >= 1) continue;
      a = 1 - k; sc = 1 - 0.45 * k; Y -= 50 * easeIn(k); rot += k * (hash(b.i, 4) - 0.5) * 2;
    }
    const cx = X + b.slot.w / 2, cy = Y + b.slot.h / 2, dim = 1 - 0.35 * b.depth, fresh = fall >= 1 ? 1 - prog(t, b.t + 0.34, b.t + 0.9) : 0.6;
    if (b.bleed && fall >= 1) {                                       // a drip running down from it
      const L = 8 + 20 * easeOut(prog(t, b.t + 0.4, b.t + 3.2)) + 8 * prog(t, b.t + 3.2, b.t + 12), dx = (hash(b.i, 36) - 0.5) * b.slot.w * 0.6;
      x.save(); x.globalAlpha = a * 0.85; x.strokeStyle = '#a3101e'; x.lineWidth = 2 + hash(b.i, 37) * 1.5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx + dx, cy + b.slot.h * 0.35); x.lineTo(cx + dx, cy + b.slot.h * 0.35 + L); x.stroke();
      x.fillStyle = '#c2142a'; x.beginPath(); x.arc(cx + dx, cy + b.slot.h * 0.35 + L, 2.6, 0, TAU); x.fill(); x.restore();
    }
    x.save(); x.globalAlpha = a; x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc);
    if (b.boxed) box(x, -b.slot.w / 2, -b.slot.h / 2, b.slot.w, b.slot.h, 5, { fill: `rgba(${Math.round(42 * dim)},6,11,0.92)`, stroke: '#7a1520', width: 1.5 });
    const base = b.size * 0.36, col = `rgb(${Math.round(255 * dim)},${Math.round(70 * dim)},${Math.round(82 * dim)})`;
    txt(x, b.s, 0, base + 2.5, { size: b.size, weight: 700, color: '#8a0c18', align: 'center', alpha: 0.14 });   // a little of the ink runs down
    if (fresh > 0) { x.shadowColor = '#ff3b47'; x.shadowBlur = 14 * fresh; }
    if (!b.boxed) { x.lineWidth = 3; x.strokeStyle = 'rgba(20,0,4,0.85)'; x.font = font(b.size, { weight: 700 }); x.textAlign = 'center'; x.strokeText(b.s, 0, base); }
    txt(x, b.s, 0, base, { size: b.size, weight: 700, color: col, align: 'center' });
    x.restore();
  }
  // blood from the top edge, running like drops down a window (sample notes 23–27): each place is different — some
  // drops are short and stop near the top, some run on; they go at their own speed, stick and slip at their own moments,
  // wander a little; the trails are short and thin out. One runs further than the rest (about a third of the way down),
  // stays there as a thin line and drips from its end.
  const until = rp ? rp.t : e.until, fadeAll = rp && t >= until ? 1 - prog(t, until, until + 0.5) : 1;
  const runDrop = (X0, t0, reach, life, w, seed) => {                 // one drop: its own rhythm of stick and slip
    if (t < t0 || t > t0 + life) return;
    const u = (t - t0) / life, n = 3 + Math.floor(hash(seed, 1) * 4);
    let f = 0; for (let i = 0; i < n; i++) { const a0 = i / n, len = hash(seed, i, 2); f += len * easeInOut(clamp((u - a0) * n * (0.6 + 0.8 * hash(seed, i, 3)))); }
    f /= Math.max(0.001, Array.from({ length: n }, (_, i) => hash(seed, i, 2)).reduce((s0, v) => s0 + v, 0));
    const Y = STG.y + reach * f, sway = (y) => X0 + (2 + 4 * hash(seed, 4)) * Math.sin((y - STG.y) * (0.02 + 0.03 * hash(seed, 5)) + seed), X = sway(Y);
    const a = fadeAll * (1 - prog(u, 0.7, 1)), tail = Math.min(Y - STG.y, (10 + 34 * hash(seed, 6)) * (0.4 + 0.6 * f));
    x.save(); x.globalAlpha = a; x.lineCap = 'round';
    const g = x.createLinearGradient(0, Y - tail, 0, Y); g.addColorStop(0, 'rgba(150,10,26,0)'); g.addColorStop(1, 'rgba(190,20,40,0.8)');
    x.strokeStyle = g; x.lineWidth = w * 0.6; x.beginPath(); for (let y = Y - tail; y <= Y; y += 3) x[y === Y - tail ? 'moveTo' : 'lineTo'](sway(y), y); x.stroke();
    x.fillStyle = '#c8162c'; x.beginPath(); x.ellipse(X, Y + w * 0.4, w * 0.75, w * (1.05 + 0.3 * hash(seed, 7)), 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,190,190,0.45)'; x.fillRect(X - w * 0.3, Y - w * 0.2, 1, 1);
    x.restore();
  };
  if (fadeAll > 0) {
    const LX = 884, LY = STG.y + 290, grow = easeOut(prog(t, e.t + 0.6, e.t + 3.6));   // the long one (sample notes 27: well short of the middle)
    if (grow > 0) {
      const tip = lerp(STG.y, LY, grow), sw = (y) => LX + 4 * Math.sin((y - STG.y) * 0.03);
      x.save(); x.globalAlpha = fadeAll; x.lineCap = 'round';
      const g = x.createLinearGradient(0, STG.y, 0, tip); g.addColorStop(0, 'rgba(90,6,16,0.7)'); g.addColorStop(1, 'rgba(200,22,44,0.9)');
      x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); for (let y = STG.y; y <= tip; y += 6) x[y === STG.y ? 'moveTo' : 'lineTo'](sw(y), y); x.stroke();
      const sw0 = sw(tip), swell = 1 + 0.45 * ((t * 0.6) % 1);
      x.fillStyle = '#c8162c'; x.beginPath(); x.ellipse(sw0, tip + 2 * swell, 2.2 * swell, 3 * swell, 0, 0, TAU); x.fill();
      if (grow >= 1) for (let j = 0; j < 5; j++) {
        const d = (t - (e.t + 3.6) - j * 1.67) % 1.67; if (t < e.t + 3.6 + j * 1.67 || d < 0 || d > 0.45) continue;
        const fy = tip + 6 + 500 * d * d; x.globalAlpha = fadeAll * (1 - d / 0.45); x.beginPath(); x.ellipse(sw0, fy, 1.8, 3, 0, 0, TAU); x.fill();
      }
      x.restore();
    }
    for (let i = 0; i < 9; i++) {                                     // the others: each its own place, length, pace, size
      const X0 = STG.x + 40 + hash(i, 51) * (STG.w - 80), every = 1.4 + 2.2 * hash(i, 52), short = hash(i, 57) < 0.45;
      for (let j = 0; j < 10; j++) {
        const seed = i * 31 + j, t0 = e.t + 0.2 + hash(i, 58) * 1.5 + j * every * (0.8 + 0.4 * hash(seed, 59));
        const reach = short ? 25 + 70 * hash(seed, 55) : 80 + 170 * hash(seed, 55), life = (short ? 1.6 : 2.6) + 2.4 * hash(seed, 53);
        runDrop(X0 + (hash(seed, 60) - 0.5) * 24, t0, reach, life, 1.1 + 1.6 * hash(seed, 54), seed);
      }
    }
  }
  x.restore();
}

/** Card 21 (sample notes 20): the character card — the one filled in at the start (card 1) — comes out of her chest when
 *  角色卡 is ticked and hangs at the top left of the stage, selected (stage1 drawCardMini draws it). */
export function cardMiniAt(F, t) {
  const it = one(F, 'export', 'chat')?.items.find(([, n]) => n === '角色卡'); if (!it || t < it[0]) return null;
  const k = easeInOut(prog(t, it[0], it[0] + 0.5)), fy = floatOf(F, '角色卡', t), s0 = 0.06;
  return { x: lerp(ANCHOR.x - CARD_MINI.w * s0 / 2, CARD_MINI.x, k), y: lerp(ANCHOR.y + herFloat(F, t), CARD_MINI.y, k) + fy, sc: lerp(s0, CARD_MINI.sc, k), k };
}

/** Sample notes 20: each ticked thing is selected — a gold frame (with a black one round it) that slowly opens out from it,
 *  handles on the corners — and stays selected: the card, the stage (the world), the memory card, the whole chat box, the
 *  ⑂, her figure and her name, the avatar, the bubble and the card's opening line; and their rows in the run status. */
function selectFrame(x, r, t0, t) {
  if (!r) return;
  const u = t - t0; if (u < 0) return;
  if (r.row) {                                                       // a row in a list: selected like a list row — tint and a bar
    const k = easeOut(clamp(u / 0.5)), flash = 1 - prog(u, 0, 0.35);
    x.save(); x.fillStyle = withAlpha(GOLD, 0.1 + 0.25 * flash); x.fillRect(r.x, r.y, r.w * k, r.h);
    x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 6; x.fillRect(r.x, r.y, 3, r.h); x.restore();
    return;
  }
  const k = easeOut(clamp(u / 1.6)), pad = lerp(-3, 8, k) + (u > 1.6 ? Math.sin((u - 1.6) * 2.2) * 1.2 : 0);
  const X = r.x - pad, Y = r.y - pad, W = r.w + 2 * pad, H = r.h + 2 * pad, flash = 1 - prog(u, 0, 0.35);
  x.save(); x.globalAlpha *= clamp(u / 0.12);
  x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 4; x.strokeRect(X - 2.5, Y - 2.5, W + 5, H + 5);
  x.strokeStyle = flash > 0 ? '#fff3d0' : GOLD; x.lineWidth = 1.6 + 1.5 * flash; x.shadowColor = GOLD; x.shadowBlur = 8 + 12 * flash; x.strokeRect(X, Y, W, H);
  x.shadowBlur = 0; x.fillStyle = '#fff3d0';
  for (const [hx, hy] of [[X, Y], [X + W, Y], [X, Y + H], [X + W, Y + H]]) { x.fillRect(hx - 3, hy - 3, 6, 6); x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 1; x.strokeRect(hx - 3, hy - 3, 6, 6); }
  x.restore();
}
/** Act 4 (card 22): when a selected thing has been copied off and taken, it is no longer selected. */
export function takenAt(F, name) { const e = one(F, 'takeaway'); const it = e && e.items.find(([, n]) => n === name); return it ? it[0] : Infinity; }
export const threadTop = (name) => TARGET[name].top;
/** The boxes a thing is selected by at t (the first is the thing itself: what act 4 copies off). */
export function selRects(F, t, name) {
  const cm = cardMiniAt(F, t), card = cm && cm.k >= 1 ? { x: cm.x, y: cm.y, w: CARD_MINI.w, h: CARD_MINI.h } : null, hf = herFloat(F, t);
  const bub = TARGET['口头禅（吐泡泡）'].top, bf = hf + floatOf(F, '口头禅（吐泡泡）', t);
  const SEL = {
    '角色卡': () => [card, rowRect(F, t, '{{char}}')],
    '世界书': () => [{ x: STG.x + 4, y: STG.y + 4 + floatOf(F, '世界书', t), w: STG.w - 8, h: STG.h - 8 }, rowRect(F, t, 'world')],
    '长期记忆': () => [memRect(F, t)],
    '聊天记录': () => [{ x: 28, y: 68, w: 552, h: 848 }],
    '分支': () => [{ x: 532, y: 99 + floatOf(F, '分支', t), w: 34, h: 44 }, rowRect(F, t, 'branch')],
    '人设': () => [((w, a, b) => ({ x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), w: lerp(a.w, b.w, w), h: lerp(a.h, b.h, w) }))(wallK(F, t), { x: HER.x + 62, y: HER.y + 14 + hf, w: HER.w - 116, h: HER.h - 34 }, wallK(F, t) > 0 && t > takenAt(F, '人设') - 0.4 ? cellOf(5) : WALLBOX), { x: 102, y: 80, w: 86, h: 34 }],
    '头像': () => [{ x: 40, y: 80 + floatOf(F, '头像', t), w: 60, h: 60 }],
    '口头禅（吐泡泡）': () => [wallK(F, t) >= 1 ? (([bx, by]) => ({ x: bx - 9, y: by - 3, w: 18, h: 18 }))(onWall(F, t, 7, bub[0], bub[1])) : { x: bub[0] - 24, y: bub[1] - 6 + bf, w: 48, h: 48 }, card && { x: card.x + 8, y: card.y + (98 + 2 * 56 - 30) * CARD_MINI.sc, w: CARD_MINI.w - 16, h: 22 }],
  };
  return SEL[name] ? SEL[name]().filter(Boolean) : [];
}
export const selRect = (F, t, name) => selRects(F, t, name)[0] || null;
const ONSTAGE = ['世界书', '人设', '口头禅（吐泡泡）', '角色卡'];
const WALLBOX = { x: 620, y: 230, w: 624, h: 694 };                // card 21 (sample notes 23): 人设 is all of her — every frame
/** How much of a selection frame shows once her wall is up: 人设 lets go after it has been seen; the rest keep quiet. */
const wallQuiet = (F, t, name) => { const w = wallK(F, t); if (w <= 0) return 1; if (name === '人设') return t > takenAt(F, '人设') - 0.4 ? 1 : 1 - prog(t, F.by('stage').find((v) => v.type === 'imagewall').form + 0.6, F.by('stage').find((v) => v.type === 'imagewall').form + 1.4); return ['口头禅（吐泡泡）', '世界书'].includes(name) ? 1 - 0.55 * w : 1; };
const shockHide = (F, t) => { const s = one(F, 'shock'); return s ? clamp(Math.min(prog(t, s.t - 0.05, s.t + 0.05), 1 - prog(t, s.until + 0.5, s.until + 0.8))) : 0; };   // card 22: the shocked face fills the stage
export function drawSelections(x, t, F) {
  const ex = one(F, 'export', 'chat'); if (!ex) return;
  for (const [t0, name] of ex.items) {
    if (t < t0) continue;
    const gone = takenAt(F, name); if (t >= gone + 0.15) continue;
    x.save(); x.globalAlpha *= (1 - prog(t, gone, gone + 0.15)) * (ONSTAGE.includes(name) ? 1 - shockHide(F, t) : 1) * wallQuiet(F, t, name);
    for (const r of selRects(F, t, name)) selectFrame(x, r, t0 + 0.05, t);
    x.restore();
  }
}
