// Card 1, the opening (sample notes 30, 2026-10-15): the first 18 seconds were too plain — people might leave before she
// first speaks at 0:18.76. Two things over the approved boot, nothing under them changed:
// 0:00.10–0:02.92 a viewing warning under the blinking cursor on the black stage (flashing lights, mild psychological
// horror); at PROTECTION it shrinks to one line at the top of the stage, until the character list (0:06.38).
// 0:03.00, in the chat that has no model yet, someone writes anyway: 你好呀～ / a sticker / 你还记得你叫什么名字吗？ —
// grey like everything before 0:13.89 (she has no colour until she is switched on). At 0:06.6 it breaks up and is gone,
// and the deployment goes on as if nothing had been said. Texts are in act1.json.
// Sample notes 34: now and then, for a moment, her silhouette (形象墙 2.0 只剩明暗, grey) is there in the run status or in
// the empty needs box — then not.
import { prog, easeOut, easeInOut, lerp, hash } from './time.js';
import { canvas, txt, box, font } from './draw.js';
import { fit } from '../forms.js';
import { paintWall, HER, herLike } from './her.js';
import { SLOT, CB, cellOf } from './stage10.js';
import { cornerBottle } from './stage11.js';

const one = (F, type, region = 'stage') => F.by(region).find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 };
const G = { raised: '#24242a', line: '#3a3a42', text: '#e6e6ea', sub: '#9a9aa3' };   // 开机：灰度

export function drawOpenWarning(x, t, F) {
  const e = one(F, 'warning'); if (!e || t < e.t || t > e.until + 0.4) return;
  const a = easeOut(prog(t, e.t, e.t + 0.3)) * (1 - prog(t, e.until, e.until + 0.4)), k = easeInOut(prog(t, e.shrink, e.shrink + 0.45));
  const W = lerp(780, 860, k), H = lerp(206, 42, k), X = STG.x + (STG.w - W) / 2, Y = lerp(560, STG.y + 14, k);
  x.save(); x.globalAlpha = a;
  box(x, X, Y, W, H, 10, { fill: 'rgba(12,12,14,0.94)', stroke: '#cfcfd6', width: 1.4 });
  const cx = STG.x + STG.w / 2, [title, l1, l2, en] = e.lines;
  if (k < 1) {
    x.save(); x.globalAlpha = a * (1 - k);
    txt(x, title, cx, Y + 46, { size: 27, weight: 700, color: '#ffffff', align: 'center', spacing: 2 });
    txt(x, l1, cx, Y + 96, { size: 21, color: G.text, align: 'center' });
    txt(x, l2, cx, Y + 132, { size: 21, color: G.text, align: 'center' });
    txt(x, en, cx, Y + 176, { size: 16, color: G.sub, align: 'center' });
    x.restore();
  }
  if (k > 0) { x.save(); x.globalAlpha = a * k; txt(x, e.short, cx, Y + 28, { size: 17, color: G.text, align: 'center' }); x.restore(); }
  x.restore();
}

let STK = null;
/** The sticker (G6, her in the mature version, waving), grey: she has no colour yet. */
function stickerOf(img, colour) {
  if (STK) return STK;
  const S = 176, c = canvas(S, S), o = c.getContext('2d'), f = fit(img, S, S, { pad: 0 });   // G6 has its own white sticker edge
  o.filter = colour ? 'none' : 'grayscale(1) contrast(1.05)'; o.drawImage(f, 0, 0); o.filter = 'none';   // sample notes 32: in colour (hook.colour)
  return (STK = c);
}
/** Her message before she exists: grey bubbles in the empty chat, then broken up and gone. */
export function drawOpenHook(x, t, F) {
  const e = one(F, 'hook'); if (!e || t < e.t || t > e.gone + 0.45) return;
  const g = prog(t, e.gone, e.gone + 0.45), q = Math.floor(t * 30);
  x.save(); x.beginPath(); x.rect(24, 152, 560, 680); x.clip();
  let Y = 170;
  for (const [t0, s] of e.msgs) {
    if (t < t0 - 0.28) break;
    const typing = t < t0, isSt = s === '@sticker', img = isSt ? (F.images[e.art] ? stickerOf(F.images[e.art], e.colour) : null) : null;
    x.font = font(20); const tw = isSt ? 0 : x.measureText(s).width;
    const BW = typing ? 70 : isSt ? (img ? img.width : 150) : tw + 28, BH = typing ? 40 : isSt ? (img ? img.height : 150) : 44, BX = 86;
    const pop = easeOut(prog(t, typing ? t0 - 0.28 : t0, (typing ? t0 - 0.28 : t0) + 0.18));
    const draw = (o) => {
      o.save(); o.globalAlpha *= pop;
      o.strokeStyle = G.line; o.setLineDash([3, 3]); o.lineWidth = 1.2; o.beginPath(); o.arc(56, Y + 20, 15, 0, Math.PI * 2); o.stroke(); o.setLineDash([]);   // an empty avatar
      if (typing) { box(o, BX, Y, BW, BH, 14, { fill: G.raised, stroke: G.line }); for (let i = 0; i < 3; i++) { o.fillStyle = G.sub; o.globalAlpha = pop * (0.4 + 0.6 * (Math.floor(t * 6 + i) % 3 === 0)); o.beginPath(); o.arc(BX + 22 + i * 13, Y + 20, 3.2, 0, Math.PI * 2); o.fill(); } }
      else if (isSt) { if (img) o.drawImage(img, BX, Y); else box(o, BX, Y, 150, 150, 14, { stroke: G.line }); }
      else { box(o, BX, Y, BW, BH, 14, { fill: G.raised, stroke: G.line }); txt(o, s, BX + 14, Y + 29, { size: 20, color: G.text }); }
      o.restore();
    };
    if (g <= 0) draw(x);
    else for (let i = 0; i < 8; i++) {                                   // breaking up: slices slipping sideways, going
      const sy = Y + (i * BH) / 8, off = (hash(q, i, Y) - 0.5) * 180 * g;
      x.save(); x.beginPath(); x.rect(24, sy, 560, BH / 8 + 1); x.clip(); x.translate(off, 0); x.globalAlpha = 1 - g; draw(x); x.restore();
    }
    Y += BH + 10;
  }
  x.restore();
}

// ---------------------------------------------------------------- her silhouette, glimpsed (sample notes 34)
const BOXES = { needs: { x: 1560, y: 76, w: 328, h: 256, cy: 214, hh: 210 }, status: { x: 1560, y: 418, w: 328, h: 490, cy: 760, hh: 280 } };
let GHOST = null;
export function drawOpenGhosts(x, t, F, S) {
  const e = one(F, 'ghost'); if (!e || !S || t < e.t - 0.1 || t > e.at[e.at.length - 1][0] + e.dur + 0.2) return;
  const hit = e.at.find(([t0]) => t >= t0 && t < t0 + e.dur); if (!hit) return;
  if (!GHOST) {                                                        // black and white: there is no colour before 0:13.89
    const src = paintWall(canvas(HER.w, HER.h), S.H, S.H.body, 2.0, 20); GHOST = canvas(HER.w, HER.h);
    const o = GHOST.getContext('2d'); o.filter = 'grayscale(1) contrast(4) brightness(1.15)'; o.drawImage(src, 0, 0);   // 只剩黑白: stark black and white (sample notes 35) o.filter = 'none';
  }
  const [t0, where] = hit, B = BOXES[where], u = (t - t0) / e.dur, a = 0.85 * Math.min(1, u / 0.2, (1 - u) / 0.3), z = B.hh / HER.h, w = HER.w * z, q = Math.floor(t * 30);
  const X = B.x + B.w / 2 - w / 2 + (hash(q, 1) - 0.5) * 4, Y = B.cy - B.hh / 2;
  x.save(); x.beginPath(); x.rect(B.x + 2, B.y + 2, B.w - 4, B.h - 4); x.clip(); x.globalAlpha = a;
  for (let i = 0; i < 6; i++) {                                        // drawn in slices, a few of them slipped sideways
    const sy = (i / 6) * HER.h, sh = HER.h / 6, dx = hash(q, i, 2) < 0.3 ? (hash(q, i, 3) - 0.5) * 18 : 0;
    x.drawImage(GHOST, 0, sy, HER.w, sh, X + dx, Y + sy * z, w, sh * z + 0.5);
  }
  x.restore();
}

// ---------------------------------------------------------------- the rewind's little easter eggs (sample notes 35)
// While the chat runs backwards (1:14–1:18), for a blink at a time, silhouettes of what is still to come: V5.0 in the
// corner where it will wait, her little bottle with the red dot, her dark A5 form in red, the twelve frames of her
// image wall. Each ~0.25 s, faint, in slices. Times in act2.json (rewindeggs).
const EGG = {};
function eggCanvas(F, S, kind) {
  if (EGG[kind]) return EGG[kind];
  const c = canvas(HER.w, HER.h), o = c.getContext('2d');
  if (kind === 'v5' && F.images.A6) { const H6 = herLike(S.H, F.images.A6, []); o.drawImage(paintWall(canvas(HER.w, HER.h), H6, H6.body, 2.0, 20), 0, 0); }
  if (kind === 'her') o.drawImage(paintWall(canvas(HER.w, HER.h), S.H, S.H.body, 2.0, 20), 0, 0);
  if (kind === 'a5' && F.images.A5) { o.drawImage(fit(F.images.A5, HER.w, HER.h, { pad: 0 }), 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#c8162c'; o.fillRect(0, 0, HER.w, HER.h); }
  return (EGG[kind] = c);
}
export function drawRewindEggs(x, t, F, S) {
  const e = one(F, 'rewindeggs'); if (!e || !S) return;
  const hit = e.eggs.find(([t0]) => t >= t0 && t < t0 + e.dur); if (!hit) return;
  const [t0, kind] = hit, u = (t - t0) / e.dur, a = 0.55 * Math.min(1, u / 0.2, (1 - u) / 0.3), q = Math.floor(t * 30);
  const sliced = (img, X, Y, w, h) => { for (let i = 0; i < 5; i++) { const sy = (i / 5) * img.height, sh = img.height / 5, dx = hash(q, i, 7) < 0.35 ? (hash(q, i, 8) - 0.5) * 16 : 0; x.drawImage(img, 0, sy, img.width, sh, X + dx, Y + (sy / img.height) * h, w, (sh / img.height) * h + 0.5); } };
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip(); x.globalAlpha = a;
  if (kind === 'v5') sliced(eggCanvas(F, S, 'v5'), SLOT.x, SLOT.y, HER.w * SLOT.sc, HER.h * SLOT.sc);
  else if (kind === 'a5') sliced(eggCanvas(F, S, 'a5'), HER.x, HER.y, HER.w, HER.h);
  else if (kind === 'wall') { const c = eggCanvas(F, S, 'her'); for (let k = 0; k < 12; k++) { const C = cellOf(k); sliced(c, C.x, C.y, HER.w * C.sc, HER.h * C.sc); } }
  else if (kind === 'bottle') {
    const P = cornerBottle(), sc = 0.2; x.strokeStyle = 'rgba(255,226,200,0.9)'; x.lineWidth = 1.6; x.beginPath(); P.forEach(([px, py], i) => x[i ? 'lineTo' : 'moveTo'](CB.x + px * sc, CB.y - 80 + py * sc)); x.closePath(); x.stroke();
    x.fillStyle = '#ff3b4a'; x.beginPath(); x.arc(CB.x, CB.y - 80 + 560 * sc, 4, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
