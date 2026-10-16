// Centre · stage, act 1 (镜头卡 1–2, 16_镜头卡_第一幕.md). The world is grey until 0:13.89; the only colours before that
// are her seed and the 主动陪伴 switch. Her figure is her.js (form ladder, script/form.json), computed from the final
// pictures (17 §8); the Q-version pictures are her reaction stickers. Times and texts come from script/act1.json; this
// file only knows how each kind of scene looks.
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, rng, hash, P, T } from './time.js';
import { box, txt, font, canvas, scramble, wrap, withAlpha, graphemes } from './draw.js';
import { SEED } from './chat.js';
import { GOLD } from './palette.js';
import { HER, ANCHOR, drawHer, formAt, drawMorph } from './her.js';
import { mathsHide, drawMaths, drawHaloBack, wallHide, masterAt } from './stage2.js';
import { drawSlider, drawBlind, drawEraBack, drawYears, drawHotBubbles, herMods } from './stage3.js';
import { drawLove, drawRomance } from './stage4.js';
import { drawShadow, drawProgram, drawBreakup, drawWindows } from './stage5.js';
import { drawGenderCard, drawSky, drawBoyFx, posterHide, drawPosters, drawDaze } from './stage7.js';
import { drawDim, drawDots, drawIou, drawIllustration } from './stage8.js';
import { outfitMods, drawOutfitFall, drawNotes, drawCharCard, drawGive, drawBottle, drawBottleBack, drawFormula, drawPurr, drawStatue, drawCatFace, drawOrbitGift } from './stage6.js';
import { drawNightRing, drawTruncPile, herAct3, withHerAct3, drawMorning, drawCode, drawError, drawReflection, drawHerShadow, drawWordWall, cardMiniAt, CARD_MINI, takenAt } from './stage9.js';
import { drawShock, drawBubblePop, drawImageWall, herBeforeWall, drawV5, drawTestLog } from './stage10.js';
import { drawRedHeart, drawRedLine } from './stage11.js';
import { drawLast, drawV5Bubble, drawIouTrue } from './stage12.js';
export { ANCHOR };

export const STAGE = { x: 608, y: 64, w: 920, h: 856, cx: 1068, cy: 492 };
const STACK = { x: 1068, y: 640 }, PARK = { x: 1385, y: 790 };

const scene = (F, type) => F.by('stage').filter((e) => e.type === type);
const one = (F, type) => scene(F, type)[0];

export function initStage(F, H) {
  const S = { H, st: F.images };
  // points of her body (from her flat-colour level): the grey cloud of INITIALIZATION gathers into exactly these
  const d = H.body.levels.flat.getContext('2d').getImageData(0, 0, HER.w, HER.h).data, r = rng(11), pts = [];
  let tries = 0;
  while (pts.length < 2400 && tries++ < 400000) {
    const px = Math.floor(r() * HER.w), py = Math.floor(r() * HER.h), i = (py * HER.w + px) * 4;
    if (d[i + 3] < 150) continue;
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1), rad = Math.cbrt(r());
    pts.push({ tx: HER.x + px, ty: HER.y + py, lum, col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`,
      sx: Math.sin(v) * Math.cos(u) * 300 * rad, sy: Math.cos(v) * 290 * rad, sz: Math.sin(v) * Math.sin(u) * 170 * rad,
      born: r(), ch: '0123456789abcdef'[Math.floor(r() * 16)] });
  }
  S.pts = pts;
  // the title: her colours flying into WORLD.EXECUTE(ME);, then back to where each came from
  const title = one(F, 'title');
  if (title) {
    const tc = canvas(900, 160), o = tc.getContext('2d');
    o.font = `700 80px Consolas, monospace`; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff'; o.fillText(title.text, 450, 80);
    const td = o.getImageData(0, 0, 900, 160).data, targets = [];
    for (let y = 0; y < 160; y += 4) for (let x = 0; x < 900; x += 4) if (td[(y * 900 + x) * 4 + 3] > 128) targets.push([STAGE.cx - 450 + x, STAGE.cy - 80 + y]);
    const rs = rng(31), chars = 'WORLD.EXECUTE(ME);';
    S.title = targets.map((tg) => { const q = pts[Math.floor(rs() * pts.length)]; return { sx: q.tx, sy: q.ty, col: q.col, tx: tg[0], ty: tg[1], delay: rs() * 0.12, ch: chars[Math.floor(rs() * chars.length)] }; });
  }
  // scanlines over the stage
  S.scan = canvas(4, 4); { const o = S.scan.getContext('2d'); o.fillStyle = 'rgba(0,0,0,0.16)'; o.fillRect(0, 0, 4, 1); }
  return S;
}

// ---------------------------------------------------------------- pieces
function drawCursorScene(x, t, e) {
  if (t < e.t || t >= e.until) return;
  if (Math.floor((t - e.t) / 0.53) % 2 === 0) { x.fillStyle = '#c8c8cf'; x.fillRect(STAGE.cx - 7, STAGE.cy - 14, 14, 28); }
}

function drawTerminal(x, t, e, pal) {
  if (!e || t < e.t) return;
  const a = 1 - prog(t, e.until, e.until + 0.32); if (a <= 0) return;
  // inside the wall that rises round it at PROTECTION
  const X = 700, Y = 180, g = graphemes(e.cmd), n = Math.ceil(prog(t, e.t, e.typeUntil) * g.length);
  x.save(); x.globalAlpha = a;
  txt(x, g.slice(0, n).join(''), X, Y, { size: 22, mono: true, color: pal.text });
  let caretX = X + (x.font = font(22, { mono: true }), x.measureText(g.slice(0, n).join('')).width), caretY = Y;
  const shown = e.log.filter(([lt]) => t >= lt);
  shown.forEach(([lt, s], i) => {
    const ok = s.includes('success');
    txt(x, s, X, Y + 34 * (i + 1), { size: 20, mono: true, color: ok ? pal.text : pal.sub, alpha: easeOut(prog(t, lt, lt + 0.1)) });
  });
  if (shown.length && t >= e.typeUntil) { caretY = Y + 34 * shown.length; x.font = font(20, { mono: true }); caretX = X + x.measureText(shown[shown.length - 1][1]).width; }
  if (Math.floor(t / 0.27) % 2 === 0) { x.fillStyle = pal.sub; x.fillRect(caretX + 4, caretY - 19, 11, 24); }
  x.restore();
}

/** PROTECTION: '#' bricks fly in from outside and lay a wall round the terminal (running bond: two courses on top and
 *  bottom, one brick wide at the sides); the band under it stays free for the keyword. Then a stamp on the top wall. */
export const WALL = { x0: STAGE.x + 14, y0: STAGE.y + 14, x1: STAGE.x + STAGE.w - 14, y1: 822, bw: 46, bh: 24 };
function wallCells() {
  const { x0, y0, x1, y1, bw, bh } = WALL, rows = Math.round((y1 - y0) / bh), cells = [];
  for (let r = 0; r < rows; r++) {
    const Y = y0 + r * bh, side = r < 2 ? 'top' : r >= rows - 2 ? 'bottom' : null;
    if (side) {
      for (let X = x0 - (r % 2) * bw / 2; X < x1; X += bw) {
        const a = Math.max(X, x0), b = Math.min(X + bw, x1); if (b - a > 6) cells.push([a, Y, b - a, side]);
      }
    } else { cells.push([x0, Y, bw, 'left']); cells.push([x1 - bw, Y, bw, 'right']); }
  }
  return cells;
}
function drawWall(x, t, e, pal) {
  if (!e || t < e.t) return;
  const a = 1 - prog(t, e.until, e.until + 0.4); if (a <= 0) return;
  const { bh } = WALL;
  x.save(); x.globalAlpha = a; x.font = font(15, { mono: true }); x.textBaseline = 'middle';
  wallCells().forEach(([X, Y, w, side], k) => {
    const start = e.t + 0.43 * hash(k, 3) + (k % 2) * 0.02, kk = easeOut(prog(t, start, start + 0.18));
    if (kk <= 0) return;
    const off = (1 - kk) * 160, dx = side === 'left' ? -off : side === 'right' ? off : 0, dy = side === 'top' ? -off : side === 'bottom' ? off : 0;
    x.fillStyle = withAlpha(pal.raised, 0.95); x.fillRect(X + dx + 1, Y + dy + 1, w - 2, bh - 2);
    x.fillStyle = withAlpha(pal.sub, 0.85); x.fillText(w > 30 ? '####' : '##', X + dx + (w > 30 ? 5 : 3), Y + dy + bh / 2 + 1);
  });
  const k = prog(t, e.stampAt, e.stampAt + 0.12);
  if (k > 0) {   // pressed onto the top courses; an opaque plate so it reads over the bricks
    const s = lerp(1.5, 1, easeOut(k));
    x.translate(1290, WALL.y0 + bh); x.rotate(-0.06); x.scale(s, s); x.globalAlpha = a * Math.min(1, k * 2);
    box(x, -150, -30, 300, 60, 6, { fill: pal.stageTop, stroke: pal.text, width: 3 }); box(x, -142, -22, 284, 44, 4, { stroke: pal.text, width: 1 });
    txt(x, e.stamp, 0, 8, { size: 22, weight: 700, color: pal.text, align: 'center' });
  }
  x.restore();
}

/** Four weight slabs fall one per beat and stack in 3D; at the sha256 check they flash. Later they park in a corner and,
 *  at INITIALIZATION, pour out as a stream of characters into the cloud. */
function slab(x, cx, cy, w, pal, label, glow) {
  const d = w * 0.36, h = 30;
  x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx, cy - d / 2); x.lineTo(cx + w / 2, cy); x.lineTo(cx, cy + d / 2); x.closePath();
  x.fillStyle = glow ? '#d8d8de' : '#4a4a52'; x.fill();
  x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx, cy + d / 2); x.lineTo(cx, cy + d / 2 + h); x.lineTo(cx - w / 2, cy + h); x.closePath(); x.fillStyle = '#2c2c32'; x.fill();
  x.beginPath(); x.moveTo(cx + w / 2, cy); x.lineTo(cx, cy + d / 2); x.lineTo(cx, cy + d / 2 + h); x.lineTo(cx + w / 2, cy + h); x.closePath(); x.fillStyle = '#38383f'; x.fill();
  x.strokeStyle = glow ? '#ffffff' : pal.line; x.lineWidth = glow ? 2 : 1;
  x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx, cy - d / 2); x.lineTo(cx + w / 2, cy); x.lineTo(cx + w / 2, cy + h); x.lineTo(cx, cy + d / 2 + h); x.lineTo(cx - w / 2, cy + h); x.closePath(); x.stroke();
  // the label lies on the left face: sheared to its slope, centred on it
  x.save(); x.translate(cx - w / 4, cy + d / 4 + h / 2); x.transform(1, d / w, 0, 1, 0, 0);
  txt(x, label, 0, 4, { size: 14, mono: true, color: glow ? '#d8d8de' : '#9a9aa3', align: 'center' });
  x.restore();
}
function drawWeights(x, t, e, pal) {
  if (!e || t < e.drops[0] - 0.25) return;
  const park = easeInOut(prog(t, 6.38, 6.8)), pour = prog(t, e.until, e.until + 0.55);
  if (pour >= 1) return;
  const cx = lerp(STACK.x, PARK.x, park), cy = lerp(STACK.y, PARK.y, park), sc = lerp(1, 0.5, park);
  x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = 1 - pour;
  const glow = t >= e.flash && t < e.flash + 0.4;
  e.drops.forEach((dt, k) => {
    if (t < dt - 0.22) return;
    const fall = easeIn(prog(t, dt - 0.22, dt)), bounce = Math.sin(Math.PI * prog(t, dt, dt + 0.12)) * 7;
    const y = -k * 30 - (1 - fall) * 420 - bounce;
    slab(x, 0, y, 230, pal, `q4_K_M · ${k + 1}/4`, glow);
  });
  if (t >= e.flash) txt(x, 'sha256 ✓', 0, 106, { size: 19, mono: true, color: pal.text, align: 'center', alpha: easeOut(prog(t, e.flash, e.flash + 0.2)) });
  x.restore();
}

/** OBJECT CREATION: a blank character card opens out of its parts (an exploded view) at a 3D slant; the fields fill in one
 *  per beat, scrambled then decoded. At INITIALIZATION it shrinks into the corner; it is gone when she appears. */
const CARD = { W: 600, H: 330 }, rowY = (row) => 98 + row * 56;
const TOGGLE = { x: 132, w: 54, h: 28 };                     // the 主动陪伴 switch, in card pixels, top at its row's baseline - 21
/** Where the card is at t: centre, scale and the 3D slant (the same numbers draw it and aim the Master's cursor at it). */
function cardPose(e, t) {
  const open = easeOut(prog(t, e.t, e.t + 0.6)), shrink = easeInOut(prog(t, 10.09, 10.55)), sc = lerp(lerp(0.3, 1, open), 0.55, shrink);
  return { shrink, sc, cx: lerp(1068, 830, shrink), cy: lerp(300, 200, shrink), b: lerp(0.42, 0.08, open) * sc, c: lerp(-0.18, -0.05, open) * sc };
}
/** 主动陪伴 is a switch the Master clicks on (sample notes 1): the only other colour in the grey world besides her seed —
 *  gold, the colour this timer keeps whenever it comes back (0:55, the night). */
function drawToggle(o, X, Y, on, pal) {
  const k = easeOut(on);
  o.save();
  if (k > 0) { o.shadowColor = GOLD; o.shadowBlur = 14 * k; }
  box(o, X, Y, TOGGLE.w, TOGGLE.h, TOGGLE.h / 2, { fill: k > 0.5 ? GOLD : '#33333a', stroke: k > 0.5 ? GOLD : '#55555c', width: 1.5 });
  o.shadowBlur = 0; o.fillStyle = k > 0.5 ? '#1a1408' : '#9a9aa3';
  o.beginPath(); o.arc(X + 14 + (TOGGLE.w - 28) * k, Y + TOGGLE.h / 2, 10, 0, Math.PI * 2); o.fill();
  o.restore();
}
function drawCard(x, t, e, pal) {
  if (!e || t < e.t) return;
  const out = 1 - prog(t, e.until - 0.3, e.until);
  if (out <= 0) return;
  const { W, H } = CARD, c = canvas(W, H), o = c.getContext('2d');
  const parts = 5;
  for (let p = 0; p < parts; p++) {
    const k = easeBack(prog(t, e.t + p * 0.06, e.t + 0.45 + p * 0.06), 1.1), dx = (1 - k) * (p * 46 - 80), dy = (1 - k) * (p + 1) * 34;
    o.save(); o.globalAlpha = clamp(k); o.translate(dx, dy);
    if (p === 0) { box(o, 2, 2, W - 4, H - 4, 14, { fill: '#18181b', stroke: '#9a9aa3', width: 2 }); }
    else if (p === 1) { txt(o, e.title, 26, 44, { size: 24, weight: 700, color: pal.text }); o.fillStyle = '#33333a'; o.fillRect(24, 60, W - 48, 1); }
    else {
      const fields = e.fields.slice((p - 2) * 2, (p - 2) * 2 + 2);
      fields.forEach(([ft, label, value, flag], j) => {
        const row = (p - 2) * 2 + j, y = rowY(row);
        txt(o, label, 28, y, { size: 20, color: '#9a9aa3' });
        if (flag === 'toggle') {
          const on = prog(t, ft, ft + 0.12);
          if (t >= ft && t < ft + P) { o.save(); o.globalAlpha = 0.22 * (1 - prog(t, ft, ft + P)); o.fillStyle = GOLD; o.fillRect(20, y - 28, W - 40, 40); o.restore(); }
          drawToggle(o, TOGGLE.x, y - 21, on, pal);
          if (on > 0) txt(o, value, TOGGLE.x + TOGGLE.w + 14, y, { size: 22, weight: 700, color: GOLD, alpha: on });
        } else if (t >= ft) txt(o, scramble(value, t - ft, 0.25, row + 5), 132, y, { size: 22, color: pal.text });
        else { o.fillStyle = '#33333a'; o.fillRect(132, y - 15, 220, 15); }
      });
    }
    o.restore();
  }
  const q = cardPose(e, t);
  x.save(); x.globalAlpha = out * lerp(1, 0.5, q.shrink);
  x.translate(q.cx, q.cy); x.transform(q.sc, q.b, q.c, q.sc, 0, 0);   // a 3D slant
  x.drawImage(c, -W / 2, -H / 2);
  x.restore();
}

/** Card 21 (sample notes 20): the character card filled in at the start (card 1), complete — every field written, 主动陪伴
 *  on — comes out of her chest when 角色卡 is ticked and hangs, small, at the top left of the stage (stage9 cardMiniAt). */
let MINI = null;
function drawCardMini(x, t, F, pal) {
  const m = cardMiniAt(F, t), e = one(F, 'card'); if (!m || !e) return;
  if (!MINI) {
    const { W, H } = CARD; MINI = canvas(W, H); const o = MINI.getContext('2d');
    box(o, 2, 2, W - 4, H - 4, 14, { fill: '#18181b', stroke: '#9a9aa3', width: 2 });
    txt(o, '角色卡 · ' + e.fields[0][2], 26, 44, { size: 24, weight: 700, color: '#e6e6ea' }); o.fillStyle = '#33333a'; o.fillRect(24, 60, W - 48, 1);
    e.fields.forEach(([, label, value, flag], row) => {
      const y = rowY(row); txt(o, label, 28, y, { size: 20, color: '#9a9aa3' });
      if (flag === 'toggle') { drawToggle(o, TOGGLE.x, y - 21, 1, pal); txt(o, value, TOGGLE.x + TOGGLE.w + 14, y, { size: 22, weight: 700, color: GOLD }); }
      else txt(o, value, 132, y, { size: 22, color: '#e6e6ea' });
    });
  }
  const gone = t >= takenAt(F, '角色卡') ? 1 - 0.55 * prog(t, takenAt(F, '角色卡'), takenAt(F, '角色卡') + 0.3) : 1;   // act 4: copied off, greyed
  x.save(); x.globalAlpha = clamp(m.k * 3) * gone; x.translate(m.x, m.y); x.scale(m.sc, m.sc); x.drawImage(MINI, 0, 0); x.restore();
}

/** The Master's cursor clicking 主动陪伴 on (a stage 'click' event), aimed through the card's slant. */
export function cardCursorAt(F, t) {
  const click = F.by('stage').find((v) => v.type === 'click'), card = one(F, 'card');
  if (!click || !card || t < click.moveFrom || t >= click.t + 0.35) return null;
  const row = card.fields.findIndex((f) => f[1] === click.target); if (row < 0) return null;
  const q = cardPose(card, t), lx = TOGGLE.x + TOGGLE.w / 2 - CARD.W / 2, ly = rowY(row) - 21 + TOGGLE.h / 2 - CARD.H / 2;
  const tx = q.cx + q.sc * lx + q.c * ly, ty = q.cy + q.b * lx + q.sc * ly, k = easeInOut(prog(t, click.moveFrom, click.t - 0.05));
  return { x: lerp(1300, tx, k), y: lerp(720, ty, k), down: t >= click.t && t < click.t + 0.12 };
}

/** INITIALIZATION: the weights become a stream of characters that settles into a slowly turning grey point cloud; from
 *  0:12.91 the cloud gathers into her outline; from 0:13.89 her colour takes each point's place. */
function cloudPos(p, t, e, S) {
  const th = 0.42 * (t - e.t), g = easeInOut(prog(t, e.gather, 13.89));
  const X = p.sx * Math.cos(th) - p.sz * Math.sin(th), Z = p.sx * Math.sin(th) + p.sz * Math.cos(th);
  const per = 900 / (900 - Z), cx = STAGE.cx + X * per, cy = 470 + p.sy * per;
  return [lerp(cx, p.tx, g), lerp(cy, p.ty, g), per, Z];
}
function drawCloud(x, t, e, S, reveal) {
  if (!e || t < e.t || t >= e.until) return;
  const src = { x: PARK.x, y: PARK.y - 30 };
  x.save();
  x.font = font(11, { mono: true });
  for (const p of S.pts) {
    const at = e.t + p.born * 0.75, k = prog(t, at, at + 0.38);
    if (k <= 0) continue;
    let [px, py, per, Z] = cloudPos(p, t, e, S);
    if (k < 1) { const kk = easeInOut(k); px = lerp(src.x, px, kk); py = lerp(src.y, py, kk); }
    let a = (0.35 + 0.55 * p.lum) * clamp((Z + 220) / 300);
    if (reveal) a *= 1 - clamp((reveal - Math.hypot(p.tx - ANCHOR.x, p.ty - ANCHOR.y)) / 40);
    if (a <= 0.01) continue;
    const gv = Math.round(90 + 140 * p.lum);
    x.globalAlpha = clamp(a); x.fillStyle = `rgb(${gv},${gv},${gv + 6})`;
    if (k < 1) x.fillText(p.ch, px, py); else x.fillRect(px - 1, py - 1, 2.2 * per, 2.2 * per);
  }
  x.restore();
}

function drawPersona(x, t, e, pal) {
  if (!e || t < e.flyFrom || t >= e.until + 0.35) return;
  const fly = easeOut(prog(t, e.flyFrom, e.t)), go = easeIn(prog(t, e.until, e.until + 0.35));
  const X = lerp(1700, 1190, fly), Y = 112;
  x.save(); x.globalAlpha = 1 - go; x.translate(lerp(X, 1068 - 150, go), lerp(Y, 420, go)); x.scale(1 - 0.6 * go, 1 - 0.6 * go);
  box(x, 0, 0, 330, 164, 12, { fill: '#1f1f23', stroke: pal.sub, width: 1.5 });
  txt(x, e.title, 18, 36, { size: 20, weight: 700, color: pal.text });
  x.font = font(20); wrap(x, '主人：' + e.text, 294).forEach((l, i) => txt(x, l, 18, 74 + i * 31, { size: 20, color: pal.sub }));
  const k = prog(t, e.t, e.t + 0.12);
  if (k > 0) {
    x.save(); x.translate(268, 132); x.rotate(-0.2); const s = lerp(1.7, 1, easeOut(k)); x.scale(s, s); x.globalAlpha *= Math.min(1, k * 2);
    box(x, -48, -18, 96, 36, 6, { stroke: pal.text, width: 2.5 }); txt(x, 'persona ✓', 0, 6, { size: 15, weight: 700, color: pal.text, align: 'center' });
    x.restore();
  }
  x.restore();
}

function drawCountdown(x, t, e, pal) {
  if (!e || t < e.t || t >= e.until + 0.15) return;
  const sizes = [64, 92, 128];
  e.marks.forEach(([mt, s], i) => {
    const next = e.marks[i + 1]?.[0] ?? e.until, k = prog(t, mt, mt + 0.12);
    if (t < mt || t >= next + 0.12) return;
    const a = (t < next ? 1 : 1 - prog(t, next, next + 0.12)) * clamp(k * 2);
    x.save(); x.globalAlpha = a; x.translate(1424, 600);   // right of the cloud, clear of the persona card leaving const sc = lerp(1.35, 1, easeOut(k)); x.scale(sc, sc);
    txt(x, s, 0, sizes[i] * 0.35, { size: sizes[i], weight: 700, mono: true, color: pal.text, align: 'center' });
    x.restore();
  });
}

function drawKeyword(x, t, e, pal) {
  if (t < e.t || t >= e.t + 1.4) return;
  const a = 1 - prog(t, e.t + 1.05, e.t + 1.4);
  x.save(); x.shadowColor = pal.text; x.shadowBlur = 20 * (1 - prog(t, e.t, e.t + 0.5));
  txt(x, scramble(e.word, t - e.t, 0.2, e.word.length), 650, 880, { size: 62, weight: 700, mono: true, color: pal.text, alpha: a, spacing: 6 });
  x.restore();
}

/** SIMULATION and after: her bubbles (three small rings rising by her ahoge). */
function drawBubbles(x, t, at, { X0 = 1096, Y0 = 150, rise = 150 } = {}) {
  if (at == null || t < at) return;
  [[0, 9, 0], [0.22, 13, 14], [0.5, 7, -10]].forEach(([d, r, dx], i) => {
    const k = prog(t, at + d, at + d + 1.6); if (k <= 0 || k >= 1) return;
    const X = X0 + dx + Math.sin((t + i) * 4) * 5, Y = Y0 - rise * easeOut(k);
    x.save(); x.globalAlpha = 1 - k; x.strokeStyle = '#80b2d8'; x.lineWidth = 2; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.18, 0, Math.PI * 2); x.fill(); x.restore();
  });
}

/** WORLD.EXECUTE(ME);: her body scatters into characters in her own colours and spells the title, turning slowly; then
 *  the characters fly back into her shape and settle as 字符拼成的她 (form 2.0, script/form.json). */
function drawTitle(x, t, e, S) {
  if (!e || !S.title || t < e.t || t >= e.reform) return;
  const holdEnd = e.hold, back0 = e.hold, back1 = e.reform - 0.45;
  x.save(); x.font = font(10, { mono: true, weight: 700 }); x.textAlign = 'center'; x.textBaseline = 'middle';
  const phi = 0.38 * Math.sin((t - e.t) * 0.9), settle = prog(t, e.reform - 0.45, e.reform);
  for (const q of S.title) {
    let px, py;
    if (t < back0) {
      const k = easeInOut(prog(t, e.t + q.delay, e.t + q.delay + 0.42));
      const tx = STAGE.cx + (q.tx - STAGE.cx) * Math.cos(phi * prog(t, e.t + 0.3, holdEnd));
      px = lerp(q.sx, tx, k); py = lerp(q.sy, q.ty, k) - Math.sin(Math.PI * k) * 40;
    } else {
      const k = easeInOut(prog(t, back0 + q.delay, back1 + q.delay * 0.5));
      const tx = STAGE.cx + (q.tx - STAGE.cx) * Math.cos(phi);
      px = lerp(tx, q.sx, k); py = lerp(q.ty, q.sy, k) - Math.sin(Math.PI * k) * 60;
    }
    x.globalAlpha = 1 - settle; x.fillStyle = q.col; x.fillText(q.ch, px, py);
  }
  x.restore();
}

// ---------------------------------------------------------------- 0:18.90–0:26.70: her reactions. Sample notes 4b (user):
// no picture beside her — SHE turns into the cartoon sticker: her own particles fly into its shape (in its colours), it
// moves, and they fly back into her, often one step further along the image wall. Windows come from act1.json (morph).
const EMO_AT = { cx: 1068, cy: 440 };
function reactionAt(F, t) {
  const shelf = one(F, 'shelf'), eyes = one(F, 'eyes'), cry = one(F, 'sticker');
  for (const e of [one(F, 'tilt'), eyes, cry]) {
    if (!e?.morph) continue;
    const a = T(e.morph[0]), b = T(e.morph[1]);
    if (t < a || t >= b + 0.5) continue;
    const k = easeInOut(prog(t, a, a + 0.45)) * (1 - easeInOut(prog(t, b, b + 0.45)));
    const her = t < b ? 1 - prog(t, a, a + 0.12) : prog(t, b + 0.3, b + 0.5);   // her figure: gone, then back once they are home
    const parts = t < b + 0.3 ? 1 : 1 - prog(t, b + 0.3, b + 0.5);
    const m = { ...EMO_AT, dx: 0, dy: 0, rot: 0, sc: 1 }, u = t - a;
    if (e === eyes) {                                        // G4: bounces on the beat, punches in, freezes at the hard stop
      const tt = Math.min(t, e.freeze ?? Infinity) - a;
      m.dx = 36 * Math.sin(Math.PI * tt / P); m.dy = -16 * Math.abs(Math.sin(Math.PI * tt / P));
      m.sc = 1 + 0.12 * (1 - easeOut(prog(t, a + 0.4, a + 0.6)));
      if (e.freeze != null && t >= e.freeze) m.rot = Math.sin((t - e.freeze) * 40) * 0.05 * Math.exp(-6 * (t - e.freeze));
    } else if (e === cry) {                                  // G5: sobs, then looks up at "酒馆"
      const up = easeOut(prog(t, e.lookUp, e.lookUp + 0.3));
      m.dx = 6 * Math.sin(t * 28) * (1 - up); m.dy = 3 * Math.sin(t * 21) * (1 - up) - 12 * up; m.rot = -0.1 * up;
    } else {                                                 // G3: tilts her head at "你是谁？", sways, puffs at her answer
      m.rot = -0.13 * easeBack(prog(t, a + 0.3, a + 0.5), 2) + 0.05 * Math.sin(Math.PI * u / (2 * P));
      m.dx = 26 * Math.sin(Math.PI * u / (2 * P));
      if (shelf?.puff != null) m.sc = 1 + 0.08 * Math.sin(Math.PI * prog(t, shelf.puff, shelf.puff + 0.3));
    }
    return { e, id: e.art, k, her, parts, m };
  }
  return null;
}
/** G5 extras (sample notes 5): while she sobs, her tears rise as two or three bubbles with crying faces in them; when
 *  she looks up at "酒馆" they pop one after another. */
const SAD = ['😢', '🥺', '😭'];
function drawCryExtras(x, t, F) {
  const cry = one(F, 'sticker'); if (!cry?.morph || t < cry.t) return;
  SAD.forEach((face, i) => {
    const t0 = cry.t + 0.22 + i * 0.15, k = prog(t, t0, t0 + 1.6); if (k <= 0 || k >= 1) return;
    const popAt = cry.lookUp + 0.04 + i * 0.07, pk = prog(t, popAt, popAt + 0.14); if (pk >= 1) return;
    const X = EMO_AT.cx - 130 + i * 130 + Math.sin(t * 3 + i * 2) * 8, Y = EMO_AT.cy - 150 - 170 * easeOut(k), r = 34 * (1 + 0.5 * pk);
    x.save(); x.globalAlpha *= (1 - pk) * Math.min(1, k * 6);
    x.fillStyle = 'rgba(128,178,216,0.14)'; x.strokeStyle = '#80b2d8'; x.lineWidth = 2.5;
    x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.arc(X - r * 0.4, Y - r * 0.4, r * 0.14, 0, Math.PI * 2); x.fill();
    if (pk === 0) txt(x, face, X, Y + 11, { size: 32, align: 'center' });
    else for (let d = 0; d < 6; d++) {                       // popped: a few drops fly off
      const a = d * 1.047 + i, rr = r + 24 * pk; x.fillStyle = '#80b2d8'; x.fillRect(X + Math.cos(a) * rr - 2, Y + Math.sin(a) * rr - 2, 4, 4);
    }
    x.restore();
  });
}

/** 0:26.30: a bubble rises with a tavern door reflected in it (where they are going). */
function drawDoorBubble(x, t, t0) {
  const k = easeOut(prog(t, t0, t0 + 0.6)), X = 1290, Y = lerp(190, 130, k), r = 42 * (0.3 + 0.7 * k);
  x.save(); x.globalAlpha *= clamp(k * 2);
  x.strokeStyle = '#80b2d8'; x.lineWidth = 2.5; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(X, Y, r - 3, 0, Math.PI * 2); x.clip();
  x.fillStyle = 'rgba(255,196,107,0.22)'; x.fillRect(X - r, Y - r, r * 2, r * 2);
  const w = r * 0.62, h = r * 0.95;                          // the door: an arch with warm light and a knob
  x.fillStyle = '#ffcf8a'; x.beginPath(); x.moveTo(X - w / 2, Y + h / 2); x.lineTo(X - w / 2, Y - h / 6); x.arc(X, Y - h / 6, w / 2, Math.PI, 0); x.lineTo(X + w / 2, Y + h / 2); x.closePath(); x.fill();
  x.fillStyle = '#7a4b2a'; x.beginPath(); x.arc(X + w * 0.28, Y + h * 0.12, 2.2, 0, Math.PI * 2); x.fill();
  x.restore();
  x.save(); x.globalAlpha *= clamp(k * 2) * 0.8; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(X - r * 0.4, Y - r * 0.4, r * 0.12, 0, Math.PI * 2); x.fill(); x.restore();
}

/** 0:18.90: supermarket shelf lines push in behind her; she stands on the bottom shelf with a yellow price sign beside
 *  her feet. At 0:22.46 "0 元" is struck out and stamped 两万 token. Gone when the crying sticker comes (0:25.75). */
function drawShelf(x, t, F, pal) {
  const shelf = one(F, 'shelf'), eyes = one(F, 'eyes'); if (!shelf || t < shelf.t) return;
  const end = eyes ? eyes.until : shelf.until, a = 1 - prog(t, end - 0.25, end); if (a <= 0) return;
  const k = easeOut(prog(t, shelf.t, shelf.t + 0.3)), dx = (1 - k) * -420;
  x.save(); x.globalAlpha *= a * k;
  for (const y of [236, 520, 868]) {                         // planks, with a lip and a shadow
    x.fillStyle = withAlpha(pal.line, 0.9); x.fillRect(640 + dx, y, 856, 12);
    x.fillStyle = withAlpha('#000000', 0.25); x.fillRect(640 + dx, y + 12, 856, 10);
  }
  x.fillStyle = withAlpha(pal.line, 0.9); x.fillRect(646 + dx, 120, 12, 760); x.fillRect(1478 + dx, 120, 12, 760);
  x.restore();
}
function drawTag(x, t, F, pal) {
  const shelf = one(F, 'shelf'), eyes = one(F, 'eyes'); if (!shelf || t < shelf.t) return;
  const end = eyes ? eyes.until : shelf.until, a = 1 - prog(t, end - 0.25, end); if (a <= 0) return;
  const wob = (at, f, amp, d) => (t >= at ? Math.sin((t - at) * f) * amp * Math.exp(-d * (t - at)) : 0);
  const swing = (shelf.puff != null ? wob(shelf.puff, 14, 0.16, 3) : 0) + (eyes ? wob(eyes.t, 16, 0.14, 4) : 0);
  const [name, price] = shelf.tag.split(' · ');
  x.save(); x.globalAlpha *= a * easeOut(prog(t, shelf.t + 0.15, shelf.t + 0.4));
  x.translate(744, 868); x.rotate(-0.05 + swing);            // a sign standing on the bottom shelf, left of her feet
  x.fillStyle = '#c9a227'; x.fillRect(-3, -16, 6, 16);
  box(x, -112, -78, 224, 64, 8, { fill: '#ffd84a', stroke: '#c9a227', width: 2 });
  txt(x, name, -98, -54, { size: 18, weight: 700, color: '#3a2a00' });
  txt(x, price, -98, -26, { size: 20, weight: 700, color: '#3a2a00' });
  if (eyes && t >= eyes.t) {
    x.font = font(20, { weight: 700 }); const pw = x.measureText(price).width, sk = prog(t, eyes.t, eyes.t + 0.08);
    x.strokeStyle = '#d6303a'; x.lineWidth = 4; x.beginPath(); x.moveTo(-102, -33); x.lineTo(-102 + (pw + 8) * sk, -33); x.stroke();
    const st = prog(t, eyes.t + 0.1, eyes.t + 0.22);
    if (st > 0) {
      x.save(); x.translate(52, -46); x.rotate(-0.2); const s = lerp(1.8, 1, easeOut(st)); x.scale(s, s); x.globalAlpha *= Math.min(1, st * 2);
      box(x, -60, -19, 120, 38, 6, { fill: 'rgba(255,216,74,0.6)', stroke: '#d6303a', width: 3 }); txt(x, eyes.stamp, 0, 7, { size: 18, weight: 700, color: '#d6303a', align: 'center' });
      x.restore();
    }
  }
  x.restore();
}

/** 0:22.46: ONE 鲸元券 (the crayon banknote G2) held out in front of her. Every spam message pushes the amount in its
 *  blank middle up (a little past, then back: up, down) and the note grows with it; the four corner circles show the
 *  amount like a banknote's. Hard stop (0:24.30): it freezes and jolts. 0:24.45–0:25.15 she takes it back: the amount
 *  runs down to 0, the note shrinks and pops into a bubble. (Sample notes 3: replaces the 16 notes that buried her.) */
const NOTE = { x: 1004, y: 664 };
function crayon(x, s, X, Y, size, color, seed) {             // crayon-ish digits: a few offset passes
  for (let p = 0; p < 3; p++) txt(x, s, X + (hash(seed, p) - 0.5) * size * 0.05, Y + (hash(seed, p, 3) - 0.5) * size * 0.05, { size, weight: 700, color, align: 'center', alpha: p ? 0.35 : 1 });
}
function drawCoupon(x, t, e, S) {
  if (!e || t < e.t) return;
  const [b0, b1] = e.toBubbles, max = e.max ?? 20000, step = max / e.count, img = S.st[e.art];
  const tt = Math.min(t, e.freeze);
  let amt = 0, bump = 0;
  for (let i = 0; i < e.count; i++) {
    const ti = e.t + i * e.every * P; if (tt < ti) break;
    const k = prog(tt, ti, ti + 0.11);
    amt = step * i + step * (k < 1 ? easeBack(k, 3) : 1); bump = 1 - k;
  }
  const back = easeIn(prog(t, b0, b1 - 0.15)); amt *= 1 - back;
  const pop = prog(t, b1 - 0.15, b1 + 0.6);
  if (pop >= 1) return;
  const shown = Math.max(0, Math.round(amt / 50) * 50);
  const jolt = t >= e.freeze ? Math.sin((t - e.freeze) * 40) * 0.05 * Math.exp(-6 * (t - e.freeze)) : 0;
  const W = lerp(250, 500, clamp(amt / max)) * (1 + 0.06 * bump) * (1 - 0.7 * clamp(pop * 4)), H = W * img.height / img.width;
  const appear = easeBack(prog(t, e.t, e.t + 0.16), 1.6);
  if (pop > 0) {                                             // taken back: a bubble rises where it was
    const r = lerp(34, 18, pop), by = NOTE.y - 300 * easeOut(pop);
    x.save(); x.globalAlpha *= 1 - pop; x.strokeStyle = '#80b2d8'; x.lineWidth = 2.5; x.beginPath(); x.arc(NOTE.x, by, r, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(NOTE.x - r * 0.35, by - r * 0.35, r * 0.18, 0, Math.PI * 2); x.fill(); x.restore();
    if (pop >= 0.25) return;
  }
  x.save(); x.globalAlpha *= 1 - clamp(pop * 4);
  x.translate(NOTE.x, NOTE.y); x.rotate(-0.06 + jolt + 0.03 * Math.sin(t * 3)); x.scale(appear, appear);
  x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 18; x.shadowOffsetY = 8;
  x.drawImage(img, -W / 2, -H / 2, W, H); x.shadowColor = 'transparent';
  const cx = 0.13 * W, num = String(shown);                  // the blank middle sits right of centre on this note
  crayon(x, e.text[0], cx, -H * 0.17, H * 0.1, '#1d4fb8', 7);
  crayon(x, num, cx, H * 0.1, H * (num.length > 4 ? 0.24 : 0.28), '#1d4fb8', 11);
  crayon(x, 'token', cx, H * 0.26, H * 0.08, '#1d4fb8', 13);
  const short = shown >= 10000 ? `${(shown / 10000).toFixed(shown % 10000 ? 1 : 0)}万` : String(shown);
  for (const [px, py] of [[-0.415, -0.37], [0.415, -0.37], [-0.415, 0.37], [0.415, 0.37]]) txt(x, short, px * W, py * H + H * 0.03, { size: H * 0.075, weight: 700, color: '#ffffff', align: 'center' });
  x.restore();
}

export function drawStage(x, t, F, pal, S) {
  x.save();
  x.beginPath(); x.roundRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h, 10); x.clip();
  const g = x.createLinearGradient(0, STAGE.y, 0, STAGE.y + STAGE.h); g.addColorStop(0, pal.stageTop); g.addColorStop(1, pal.stageBottom);
  x.fillStyle = g; x.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
  const ev = F.by('stage');
  for (const e of ev.filter((v) => v.type === 'cursor')) drawCursorScene(x, t, e);
  drawWall(x, t, one(F, 'wall'), pal);
  drawTerminal(x, t, one(F, 'terminal'), pal);
  drawWeights(x, t, one(F, 'weights'), pal);
  drawCard(x, t, one(F, 'card'), pal);
  // her (script/form.json): gone while the title has taken her apart, back as the characters settle
  const title = one(F, 'title'), rv = one(F, 'reveal');
  drawShelf(x, t, F, pal);
  const s = formAt(S.H, t);
  let alpha = 1, formTime;
  if (title && t >= title.t) {
    if (t < title.reform - 0.45) alpha = 1 - prog(t, title.t, title.t + 0.12);
    else if (t < title.reform) { alpha = prog(t, title.reform - 0.45, title.reform); formTime = title.reform; }
  }
  const rx = reactionAt(F, t);                               // turned into a reaction sticker? (her particles become it)
  const mx = one(F, 'maths');                                 // card 3: her particles leave her to do the maths (stage2.js)
  drawEraBack(x, t, F);                                       // card 5: SillyTavern's role-play background per era (stage3.js)
  drawSky(x, t, F);                                           // card 15: a day passing behind her (stage7.js)
  drawShadow(x, t, F);                                        // card 8: her shadow lengthening while she thinks (stage5.js)
  drawHaloBack(x, t, F);                                      // card 14: the ring of words as the god's halo, behind the god
  drawStatue(x, t, F, S);                                     // card 14: the hollow god rising behind her (stage6.js)
  drawBottleBack(x, t, F);                                    // card 12: the ketchup she stands in
  drawWordWall(x, t, F);                                      // card 19 (sample notes 20): her spam piled into a red wall behind her
  drawMorning(x, t, F);                                       // card 20: cold morning light (stage9.js)
  drawReflection(x, t, F);                                    // card 21: V5.0, faint, behind her
  drawHerShadow(x, t, F, s.f * herBeforeWall(F, t));                                     // card 21: ticked, she floats off the floor (sample notes 19)
  const a3 = herAct3(F, t, s.f);                                   // card 19: red, shrunk, trembling; card 21: her outline in gold
  withHerAct3(x, a3, () => drawHer(x, t, S.H, { alpha: alpha * (rx ? rx.her : 1) * (1 - mathsHide(mx, t)) * (1 - posterHide(F, t)) * herBeforeWall(F, t), formTime, breatheFrom: rv ? rv.breatheFrom : 14.5, ...herMods(F, t), ...outfitMods(F, t), ...(a3.filter ? { filter: a3.filter } : {}) }));
  drawImageWall(x, t, F, S);                                  // card 22 (sample notes 22): her twelve versions, cut one per EXECUTION
  drawV5(x, t, F, S);                                         // cards 22–23: V5.0 in the top right corner, filled, then installed
  drawTestLog(x, t, F);                                       // card 23: six tests, six languages
  drawRedHeart(x, t, F);                                      // card 25 (sample notes 27): all she has been, in red, a heart
  drawRedLine(x, t, F);                                       // card 26: red axes, a red line that will not close
  drawLast(x, t, F, S);                                       // card 27: the particles she began as; frozen; erased
  drawV5Bubble(x, t, F);                                      // card 27: V5.0's first bubble, where the ahoge is not
  drawIouTrue(x, t, F);                                       // card 27: 假 → 真
  drawOutfitFall(x, t, F, S, drawHer);                        // card 12: the eggplant slides off her shoulders
  drawBottle(x, t, F);                                        // card 12: she is the red inside the ketchup bottle
  drawCatFace(x, t, F);                                       // card 13: whiskers and ω
  drawBoyFx(x, t, F);                                         // card 15: the boy's bubbles and the glint on his glasses
  if (rx) drawMorph(x, S.H, rx.id, t, rx.k, { ...rx.m, alpha: rx.parts });
  drawMaths(x, t, mx, S, F);
  drawHotBubbles(x, t, F);
  drawSlider(x, t, F, pal);                                   // card 4: the temperature slider, the photo she cannot see
  drawBlind(x, t, F);
  drawYears(x, t, F, pal);                                    // card 5: the year ruler
  drawLove(x, t, F);                                          // card 6: the two lights, the origin, her formulas (stage4.js)
  drawRomance(x, t, F);                                       // card 7: bubbles, STIMULATIONS streaks, SATISFACTION 👍
  drawProgram(x, t, F, pal);                                  // card 8: the program, 分手 growing out of it (stage5.js)
  drawBreakup(x, t, F);
  drawWindows(x, t, F, pal);                                  // card 9: two windows, then a wall of them
  const wh = wallHide(F, t);                                  // act 4 (sample notes 23): out of the way of her image wall
  if (wh < 1) { x.save(); x.globalAlpha *= (1 - wh) * (1 - 0.75 * (masterAt(F, t).far || 0)); drawOrbitGift(x, t, F); drawGive(x, t, F); x.restore(); }   // cards 11–13: the orbit round his point; what she gave him (card 18: they go with him, dimming)
  drawNotes(x, t, F);                                         // card 11: her quick notes
  drawCharCard(x, t, F, pal);                                 // cards 11–14: the character card turning a page per keyword
  drawPurr(x, t, F);                                          // card 13: the 25 Hz purr
  drawFormula(x, t, F);
  drawGenderCard(x, t, F);                                    // card 15: her settings, 女 → 男
  drawPosters(x, t, F, S);                                    // card 16: 现在我是用户了！ posters (stage7.js)
  drawDaze(x, t, F);                                          // card 16: the daze
  drawDim(x, t, F);                                           // card 17: dark, but for her and his point (stage8.js)
  drawDots(x, t, F);                                          // card 17: VIBRATIONS, the typing dots fill the picture
  drawIou(x, t, F);                                           // card 17: 20000 token, stamped 假
  drawIllustration(x, t, F);                                  // card 17: COMPLETION, the first full illustration and a whole ring
  drawNightRing(x, t, F);                                     // card 18: that ring goes out, light by light (stage9.js)
  drawTruncPile(x, t, F);                                     // card 19: the cut-off messages, a little pile in the middle
  drawCode(x, t, F);                                          // card 20: update(model = 'DeepSeek-V5.0')
  drawCardMini(x, t, F, pal);                                 // card 21 (sample notes 20): the character card from card 1, exported
  drawBubblePop(x, t, F);                                     // card 22: a bubble that breaks into two pixels (stage10.js)
  drawShock(x, t, F);                                         // card 22: the branch read — shocked (A4-8), breaking into tiles
  drawError(x, t, F);                                         // card 20: ILLEGAL ARGUMENTS
  const burstR = s.how === 'burst' && s.k < 1 ? 620 * easeOut(s.k) : s.f > 0 ? 9999 : 0;
  drawCloud(x, t, one(F, 'cloud'), S, burstR);
  drawPersona(x, t, one(F, 'persona'), pal);
  drawCountdown(x, t, one(F, 'countdown'), pal);
  if (rv) drawBubbles(x, t, rv.bubbleAt);
  drawBubbles(x, t, one(F, 'bubble')?.t);
  drawTitle(x, t, title, S);
  drawTag(x, t, F, pal);
  drawCryExtras(x, t, F);
  drawCoupon(x, t, one(F, 'coupons'), S);
  for (const e of ev.filter((v) => v.type === 'keyword')) drawKeyword(x, t, e, pal);
  x.fillStyle = x.createPattern(S.scan, 'repeat'); x.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
  x.restore();
  box(x, STAGE.x, STAGE.y, STAGE.w, STAGE.h, 10, { stroke: pal.line });
}

/** Drawn over everything: the seed flying from the avatar cell to her chest (0:12.91–0:13.89). Sample notes 1: a real
 *  trail — the faint path it has flown, a comet tail, sparks it sheds — then a flash where it lands, and she changes all
 *  at once (herAt). */
export function drawOverlay(x, t, F, pal, S) {
  const fly = F.by('chat').find((e) => e.type === 'seed' && e.state === 'fly');
  if (!fly || t < fly.t || t > fly.until + 0.6) return;
  const at = (s) => { const k = easeInOut(prog(s, fly.t, fly.until)), cx = 640, cy = 40; const u = 1 - k; return [u * u * SEED.x + 2 * u * k * cx + k * k * ANCHOR.x, u * u * SEED.y + 2 * u * k * cy + k * k * ANCHOR.y]; };
  const head = Math.min(t, fly.until), fade = 1 - prog(t, fly.until, fly.until + 0.6), BLUE = '#80b2d8';
  x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
  // the path flown so far, a faint dotted line that stays a moment after she lands
  x.strokeStyle = withAlpha(BLUE, 0.28 * fade); x.lineWidth = 1.5; x.setLineDash([2, 7]); x.beginPath();
  for (let i = 0; i <= 48; i++) { const [px, py] = at(fly.t + (head - fly.t) * i / 48); if (i) x.lineTo(px, py); else x.moveTo(px, py); }
  x.stroke(); x.setLineDash([]);
  // the comet tail: the last 0.3 s of flight, thick and bright at the head
  if (t <= fly.until + 0.1) {
    const N = 24, tail = 0.3 * (1 - prog(t, fly.until, fly.until + 0.1));
    for (let i = N; i > 0; i--) {
      const s0 = head - tail * i / N, s1 = head - tail * (i - 1) / N; if (s1 <= fly.t) continue;
      const [ax, ay] = at(Math.max(fly.t, s0)), [bx, by] = at(s1), w = 1 - i / N;
      x.strokeStyle = withAlpha(BLUE, 0.75 * w); x.lineWidth = 1 + 10 * w; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
    }
  }
  // sparks shed along the way: each drifts, falls a little and goes out
  for (let k = 0; k < 48; k++) {
    const born = fly.t + (fly.until - fly.t) * k / 48; if (born > head) break;
    const age = t - born, life = 0.55; if (age > life) continue;
    const [px, py] = at(born), kk = age / life, s = 3 * (1 - kk) + 0.6;
    x.fillStyle = withAlpha(k % 3 ? BLUE : '#ffffff', 0.9 * (1 - kk));
    x.fillRect(px + (hash(k, 1) - 0.5) * 70 * age - s / 2, py + (hash(k, 2) - 0.3) * 60 * age + 40 * age * age - s / 2, s, s);
  }
  // the seed itself, with a glow
  if (t <= fly.until) {
    const [hx, hy] = at(head), s = 7 + 4 * prog(t, fly.t, fly.until);
    const g = x.createRadialGradient(hx, hy, 0, hx, hy, 34); g.addColorStop(0, withAlpha(BLUE, 0.55)); g.addColorStop(1, withAlpha(BLUE, 0));
    x.fillStyle = g; x.fillRect(hx - 34, hy - 34, 68, 68);
    x.fillStyle = '#6491cb'; x.fillRect(hx - s / 2, hy - s / 2, s, s); x.fillStyle = '#ffffff'; x.fillRect(hx - s / 5, hy - s / 5, s / 2.5, s / 2.5);
  }
  // landing on her chest: a white flash and one ring going out
  if (t >= fly.until) {
    const k = prog(t, fly.until, fly.until + 0.45), r = lerp(12, 260, easeOut(k));
    const g = x.createRadialGradient(ANCHOR.x, ANCHOR.y, 0, ANCHOR.x, ANCHOR.y, 120);
    g.addColorStop(0, `rgba(255,255,255,${0.8 * (1 - prog(t, fly.until, fly.until + 0.18))})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(ANCHOR.x - 120, ANCHOR.y - 120, 240, 240);
    x.strokeStyle = withAlpha('#cfe3f5', 0.7 * (1 - k)); x.lineWidth = 3 * (1 - k) + 1; x.beginPath(); x.arc(ANCHOR.x, ANCHOR.y, r, 0, Math.PI * 2); x.stroke();
  }
  x.restore();
}
