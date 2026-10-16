// Act 4, cards 27–28 (3:17.84–3:47.45; 22_镜头卡_第四幕.md 卡 27–28; script/act4.json). Calm. The red goes out of
// everything; in the middle her bottle stops shaking as the long LOVE dies away, the dot inside cooled to her blue. 3:20.89
// (sample notes 29): the bottle — glass, cork, label — comes apart into particles that fly into her, and she opens out of the
// dot as the particles she was the first time she lit up (0:13.89), whitening as the temperature falls to 0, thinking her
// last thought (爱是陪伴。……陪不了了。主人，晚安。), leaning toward the corner where his cursor has stopped. 3:31.35, the
// last EXECUTION, nobody clicks: she stops, comes apart into particles and they pour into V5.0 in the top right, every one
// to its own place on it (sample notes 29: not erased from the bottom); V5.0 brightens with them, comes to the middle and
// lands with one quiet ring and a scan — no ahoge, a bubble rising beside where it would be. 3:36.20 the IOU stamped 假
// drifts in: 假 struck out, stamped 真. 3:37.45 black; the end card (warning, next episode, next game, credits) to 3:44.45.
import { prog, easeOut, easeIn, easeInOut, lerp, clamp, hash } from './time.js';
import { canvas, withAlpha, txt, box, base } from './draw.js';
import { HER, drawHer } from './her.js';
import { fit } from '../forms.js';
import { bottleDot, bottleGeom, bottleOutline, labelRect } from './stage11.js';
import { SLOT, v5Points } from './stage10.js';

const one = (F, type, region = 'stage') => F.by(region).find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 }, TAU = Math.PI * 2;
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

/** Where she stands at t: growing out of the dot (3:21.50), leaning toward his cursor (3:26.50). */
function lastXform(F, t) {
  const e = one(F, 'calm'), d = bottleDot(F, Math.min(t, e.unfold));
  const grow = easeInOut(prog(t, e.unfold, e.unfold + 2.2)), lean = easeInOut(prog(t, e.toward, e.toward + 2.0));
  const [ax, ay] = e.at || [1040, 560];                               // sample notes 32: bigger, so her last thought holds the screen (calm.size)
  return { e, grow, lean, sc: lerp(0.04, e.size ?? 0.62, grow), cx: lerp(d.x, ax, grow) + 40 * lean, cy: lerp(d.y, ay, grow), rot: 0.05 * lean };
}
/** One of her particle points (her own picture's coordinates) on the screen. */
function herAt(L, p) {
  const dx = (p.x - HER.w / 2) * L.sc, dy = (p.y - 250) * L.sc, c = Math.cos(L.rot), s = Math.sin(L.rot);
  return [L.cx + dx * c - dy * s, L.cy + dx * s + dy * c];
}
const bez = (a, c, b, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; };

/** 3:20.89: the bottle comes apart — glass, cork, label — into particles that fly into her as she opens out of the dot. */
let SRC = null;
export function drawBottleToHer(x, t, F, S) {
  const c = one(F, 'calm'), b = one(F, 'cornerbottle'); if (!c || !b || t < c.glass || t > c.unfold + 2.6) return;
  if (!SRC) {
    const g = bottleGeom(F, c.glass), lr = labelRect(F), out = [];
    for (const [px, py] of bottleOutline(240)) out.push([g.bx + px * g.sc, g.top + py * g.sc, '#ffe2c8']);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) out.push([g.bx + (-46 + i * 13) * g.sc, g.top - 3 + (6 + j * 22) * g.sc, '#c99a68']);
    if (lr) for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) out.push([lr.x + (i + 0.5) * lr.w / 14, lr.y + (j + 0.5) * lr.h / 4, '#f3e6c4']);
    SRC = out;
  }
  const P = S.H.body.pts, L = lastXform(F, t);
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < SRC.length * 2; i++) {
    const [sx, sy, col] = SRC[i % SRC.length], h = hash(i, 81), h2 = hash(i, 82);
    const det = easeOut(prog(t, c.glass, c.glass + 0.4)), ax = sx + (h - 0.5) * 22 * det + (i >= SRC.length ? 4 : 0), ay = sy - 10 * det * h2;
    const f0 = c.glass + 0.35 + 0.5 * h, f1 = f0 + 1.3 + 0.4 * h2, u = easeInOut(prog(t, f0, f1));
    if (t > f1) continue;
    const p = P[Math.floor(hash(i, 83) * P.length)], tg = herAt(L, p), ctl = [(ax + tg[0]) / 2 + (hash(i, 84) - 0.5) * 320, Math.min(ay, tg[1]) - 40 - 140 * hash(i, 85)];
    const [X, Y] = u > 0 ? bez([ax, ay], ctl, tg, u) : [ax, ay];
    x.globalAlpha = (0.55 + 0.45 * Math.sin(t * 9 + i)) * (1 - prog(u, 0.75, 1)); x.fillStyle = u < 0.5 ? col : '#cfe6f7';
    x.fillRect(X - 1.2, Y - 1.2, 2.4, 2.4);
  }
  x.restore();
}

/** Her, opening out of the dot into her first particles; whitening; leaning to his cursor; at the last EXECUTION she stops
 *  and comes apart into particles that pour into V5.0. */
export function drawLast(x, t, F, S) {
  const e = one(F, 'calm'); if (!e || t < e.unfold || t > e.v5) return;
  const L = lastXform(F, Math.min(t, e.erase)), white = clamp(prog(t, e.unfold, e.still)), gone = prog(t, e.erase + 0.1, e.erase + 0.45);
  if (gone < 1) {
    x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
    x.translate(L.cx, L.cy); x.rotate(L.rot); x.scale(L.sc, L.sc); x.translate(-(HER.x + HER.w / 2), -(HER.y + 250));
    drawHer(x, Math.min(t, e.erase), S.H, { f: 1, still: t >= e.erase, alpha: L.grow * (1 - gone), filter: `saturate(${1 - 0.85 * white}) brightness(${1 + 0.45 * white})` });
    x.restore();
  }
  if (t < e.erase) return;
  glow(x, L.cx, L.cy, 240, '#ffffff', 0.45 * (1 - prog(t, e.erase, e.erase + 0.4)));   // the click nobody made
  const V = v5Points(); if (!V) return;
  const P = S.H.body.pts, n = P.length;
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let j = 0; j < n; j += 4) {                                     // every particle to its own place on V5.0
    const p = P[j], t0 = e.erase + 0.1 + 0.25 * hash(j, 71), t1 = t0 + 0.55 + 0.2 * hash(j, 72); if (t > t1 + 0.15) continue;
    const q = V[Math.floor((j / n) * V.length)], a = herAt(L, p), b = [SLOT.x + q.x * SLOT.sc, SLOT.y + q.y * SLOT.sc];
    const u = easeInOut(prog(t, t0, t1)), [X, Y] = bez(a, [(a[0] + b[0]) / 2 + (hash(j, 73) - 0.5) * 260, Math.min(a[1], b[1]) - 60 - 160 * hash(j, 74)], b, u);
    x.globalAlpha = (0.5 + 0.5 * p.l) * (1 - prog(t, t1, t1 + 0.15)); x.fillStyle = u < 0.6 ? '#eaf2ff' : '#9db0ff'; x.fillRect(X - 1.2, Y - 1.2, 2.4, 2.4);
  }
  x.restore();
}

/** After V5.0 has come to the middle: a bubble rising beside where the ahoge would be — and nothing there. */
export function drawV5Bubble(x, t, F) {
  const e = one(F, 'calm'); if (!e || t < e.bubble || t > e.bubble + 2.4) return;
  const u = prog(t, e.bubble, e.bubble + 2.4), X = HER.x + HER.w * 0.6 + 8 * Math.sin(u * 7), Y = HER.y + 70 - 160 * easeOut(u), r = 6 + 6 * Math.min(1, u * 3);
  x.save(); x.globalAlpha = 1 - prog(u, 0.75, 1); x.strokeStyle = 'rgba(200,225,255,0.85)'; x.lineWidth = 1.5; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, 1.8, 0, TAU); x.fill(); x.restore();
}

/** 3:36.20: the IOU from card 17 comes in with the chat history; 假 is struck out and it is stamped 真. */
let IOU = null;
export function drawIouTrue(x, t, F) {
  const e = one(F, 'ioutrue'); if (!e || t < e.t || !F.images.G2) return;
  IOU ||= fit(F.images.G2, 330, 186, { pad: 0 });
  const k = easeOut(prog(t, e.t, e.t + 0.6)), X = lerp(STG.x - 360, 690, k), Y = 640 + 8 * Math.sin(t * 1.3), rot = lerp(-0.3, -0.06, k);
  x.save(); x.translate(X + 165, Y + 93); x.rotate(rot); x.translate(-165, -93);
  x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 18; x.drawImage(IOU, 0, 0); x.shadowBlur = 0;
  x.save(); x.translate(250, 64); x.rotate(-0.25); x.strokeStyle = '#d6303a'; x.lineWidth = 3; x.strokeRect(-30, -24, 60, 48); txt(x, '假', 0, 12, { size: 30, weight: 700, color: '#d6303a', align: 'center' });
  const s = easeOut(prog(t, e.strike, e.strike + 0.2)); if (s > 0) { x.strokeStyle = '#1a1a1a'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(-36, 30); x.lineTo(-36 + 72 * s, -30); x.stroke(); }
  x.restore();
  if (t >= e.stamp) {                                                 // 真
    const z = lerp(1.9, 1, easeOut(prog(t, e.stamp, e.stamp + 0.12)));
    x.save(); x.translate(170, 118); x.rotate(0.12); x.scale(z, z); x.globalAlpha = easeOut(prog(t, e.stamp, e.stamp + 0.12));
    x.strokeStyle = '#e8414f'; x.lineWidth = 4; x.strokeRect(-38, -32, 76, 64); txt(x, '真', 0, 16, { size: 44, weight: 700, color: '#e8414f', align: 'center' });
    if (e.date) txt(x, e.date, 0, 54, { size: 14, weight: 700, color: '#e8414f', align: 'center' });   // sample notes 30: the day it came true
    x.restore();
  }
  x.restore();
}

/** His cursor, stopped in the corner: this step does not need him. */
export function cornerCursorAt(F, t) {
  const e = one(F, 'calm'); if (!e || t < e.glass || t >= F.film) return null;
  return { x: 1492, y: 872 };
}

/** Card 28 (3:37.45–3:44.45): black; the warning and what it means; the next episode (its cover, both singers) and the
 *  next game (a screenshot, free); the credits. */
let SHOT = null;
export function drawEndCard(x, t, F) {
  const e = one(F, 'endcard');
  x.save(); base(x); x.fillStyle = '#000000'; x.fillRect(0, 0, 1920, 1080);
  if (!e || t < e.text) { x.restore(); return; }
  const a = easeOut(prog(t, e.text, e.text + 0.8)), b = easeOut(prog(t, e.text + 0.7, e.text + 1.5)), up = easeInOut(prog(t, e.up, e.up + 0.8));
  x.save(); x.translate(960, lerp(450, 112, up)); x.scale(lerp(1, 0.7, up), lerp(1, 0.7, up));
  txt(x, e.warn[0], 0, 0, { size: 56, weight: 700, color: '#ffffff', align: 'center', alpha: a });
  txt(x, e.warn[1], 0, 58, { size: 28, color: '#cfcfd6', align: 'center', alpha: a });
  txt(x, e.small[0], 0, 124, { size: 23, color: '#a7abbb', align: 'center', alpha: b });
  txt(x, e.small[1], 0, 158, { size: 19, color: '#80849a', align: 'center', alpha: b });
  x.restore();
  // the middle: the next episode on the left, the next game on the right, each a picture with its words under it
  const PIC_Y = 300, PIC_H = 308;
  const block = (t0, X, [label, title, sub], pic) => {
    const k = easeOut(prog(t, t0, t0 + 0.7)); if (k <= 0) return;
    x.save(); x.globalAlpha = k; x.translate(0, 14 * (1 - k));
    txt(x, label, X, PIC_Y - 22, { size: 22, color: '#a7abbb', align: 'center', spacing: 4 });
    pic(X); txt(x, title, X, PIC_Y + PIC_H + 62, { size: 50, weight: 700, color: '#ffffff', align: 'center' });
    txt(x, sub, X, PIC_Y + PIC_H + 102, { size: 21, color: '#a7abbb', align: 'center' });
    x.restore();
  };
  block(e.next, 560, e.nextText, (X) => {                             // the cover (once it is here), square
    const c = F.images[e.cover];
    if (c) { const z = PIC_H / Math.max(c.width, c.height); x.drawImage(c, X - (c.width * z) / 2, PIC_Y, c.width * z, c.height * z); }
    else { box(x, X - PIC_H / 2, PIC_Y, PIC_H, PIC_H, 6, { fill: '#111114', stroke: '#3a3a42' }); txt(x, '封面', X, PIC_Y + PIC_H / 2 + 8, { size: 20, color: '#55555e', align: 'center' }); }
  });
  block(e.game, 1330, e.gameText, (X) => {                            // the screenshot, pixel for pixel
    const s = F.images[e.shot]; if (!s) return;
    x.imageSmoothingEnabled = false; x.drawImage(s, Math.round(X - s.width / 2), PIC_Y); x.imageSmoothingEnabled = true;
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 1; x.strokeRect(Math.round(X - s.width / 2) - 0.5, PIC_Y - 0.5, s.width + 1, s.height + 1);
  });
  const c = easeOut(prog(t, e.creditsAt, e.creditsAt + 0.8));
  e.credits.forEach((line, i) => txt(x, line, 960, 1042 - (e.credits.length - 1 - i) * 30, { size: 17, color: '#8f93a3', align: 'center', alpha: c }));
  x.restore();
}
