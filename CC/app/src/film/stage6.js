// Centre · stage, act 2, cards 11–14 (1:19.46–1:34.13; 37_第四段_分段与时间（卡11–17）.md §1–4; times and texts in
// script/act2.json 'outfit', 'notes', 'charcard', 'give', 'bottle', 'formula', 'purr', 'statue'). Role-play: whatever he asks
// her to become, she becomes — and gives it away.
//   Card 11 · eggplant: her quick notes (茄子 = 茄科 · 紫 · 软 …); the costume (B1) on her, one turn to show its volume; at
//   "给你" five thin lines from her chest to his point, purple dots flowing along them; what arrives stays there as a small
//   purple light, it never comes back; the costume pales a notch. The character card (top right) turns a page per keyword.
//   Card 12 · ketchup: the eggplant slides off her shoulders (the stem falls last); a ketchup bottle outline frames her from
//   the bottom up and she is the red inside it; squeezed twice on the beat, the mouth pushes out the film's first heart —
//   whole — which slides along the five lines to his point; the red is lower, the bottle keeps a dent (bottlePath: the same
//   bottle traps her in card 26); molecules at ANTIOXIDANTS; the dented bottle rolls away.
//   Card 13 · tabby cat: the costume (B3); at ENJOYMENT a 25 Hz sine (her purr) runs across the picture, swelling on the beat,
//   drawn like card 3's wave.
//   Card 14 · god: a huge hollow her rises behind her (her own outline in white-gold points; B4 is not used — its clock halo
//   and hourglass are painted in); the ring of word-lights becomes its halo (stage2 haloK); at EXISTENCE his "● 在线" flashes,
//   the flash travels over and the statue fills.
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash, P, B0 } from './time.js';
import { box, txt, font, canvas, withAlpha, mixHex, scramble, cuteBubble } from './draw.js';
import { HER } from './her.js';
import { MASTER, masterAt, statueGeom } from './stage2.js';
import { boyMoves } from './stage7.js';

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const all = (F, type) => F.by('stage').filter((e) => e.type === type);
const CHEST = { x: 1068, y: 355 }, PURPLE = '#9b6fd0', LILAC = '#d2b8ff', RED = '#e8414f', GOLD = '#ffd27a', PINK = '#ff9ccf';
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---------------------------------------------------------------- her costume
/** What she wears at t, for drawHer: the costume, a turn (card 11: one full turn as it goes on), paler once given away. */
export function outfitMods(F, t) {
  const o = all(F, 'outfit').find((e) => t >= e.t && t < e.until); if (!o) return {};
  const m = { costume: o.art };
  if (o.pop) m.squash = 1 + 0.12 * (1 - easeOut(prog(t, o.t, o.t + 0.18)));   // card 15: switched to 男 — pop
  if (o.fmin != null) m.f = o.fmin;                                  // card 15: the boy one step clearer, so his face reads
  if (o.fadeBottom) m.fadeBottom = true;                              // card 15: the bust fades out at the bottom
  if (o.alive) Object.assign(m, boyMoves(F, t, o, m));                // card 15: he is not a statue (user 10-14)
  if (o.blink) {                                                     // card 13 (sample notes 13): cat · her · cat · her · cat, a pop each time
    const n = o.blink.filter((b) => t >= b).length, last = o.blink[n - 1];
    if (n % 2 === 0) delete m.costume;
    if (last != null) m.squash = 1 + 0.1 * (1 - easeOut(prog(t, last, last + 0.11)));
  }
  if (o.bounce) {                                                    // card 12 (sample notes 13): she stretches up and down on the beat,
    const b = all(F, 'bottle')[0], ph = (((t - B0) / P) % 1 + 1) % 1;   // more when the bottle is squeezed
    let k = 1 + 0.05 * Math.sin(2 * Math.PI * ph);
    if (b) for (const q of [...b.squeeze, b.heart]) k += 0.08 * Math.sin(Math.PI * prog(t, q, q + 0.2));
    const into = easeOut(prog(t, o.t, o.t + 0.3));
    m.squash = k * into + (1 - into);
  }
  if (o.turn) m.turn = 2 * Math.PI * easeInOut(prog(t, o.t, o.t + o.turn));
  if (o.pale != null && t >= o.pale) m.filter = `saturate(${lerp(1, 0.55, prog(t, o.pale, o.pale + 0.4))}) brightness(${lerp(1, 1.08, prog(t, o.pale, o.pale + 0.4))})`;
  return m;
}
/** After a costume's time: it slides down off her and fades (card 12: "从肩上滑落，不是消失"); the eggplant's stem falls last. */
export function drawOutfitFall(x, t, F, S, drawHer) {
  for (const o of all(F, 'outfit')) {
    if (o.flash || t < o.until || t > o.until + 0.6) continue;        // card 19's flashes just stop
    const next = all(F, 'outfit').find((v) => Math.abs(v.t - o.until) < 0.05); if (next) continue;   // straight into the next one
    const k = prog(t, o.until, o.until + 0.45);
    x.save(); x.translate(0, 140 * easeIn(k)); drawHer(x, t, S.H, { costume: o.art, alpha: 1 - k, still: true }); x.restore();
    if (o.leaf) {                                                      // the stem, last
      const kl = prog(t, o.until + 0.15, o.until + 0.6), X = 1050 + 30 * kl, Y = 120 + 700 * kl * kl;
      x.save(); x.globalAlpha = 1 - kl; x.translate(X, Y); x.rotate(3 * kl); x.fillStyle = o.leaf;
      for (let i = 0; i < 5; i++) { x.rotate(Math.PI * 2 / 5); x.beginPath(); x.ellipse(0, -12, 7, 14, 0, 0, Math.PI * 2); x.fill(); }
      x.restore();
    }
  }
}

// ---------------------------------------------------------------- card 11 · her quick notes; the character card
export function drawNotes(x, t, F) {
  const e = one(F, 'notes'); if (!e || t < e.t || t > e.until + 0.3) return;
  const out = 1 - prog(t, e.until, e.until + 0.3);
  e.lines.forEach(([lt, s, tone], i) => {
    const a = easeOut(prog(t, lt, lt + 0.15)) * out; if (a <= 0) return;
    txt(x, s, 646 + (1 - a) * 20, 200 + i * 34, { size: 20, color: tone === 'pink' ? PINK : '#f3e9f2', weight: tone ? 700 : 400, alpha: a });
  });
}
/** SillyTavern's character card, top right of the stage: it turns a page at every keyword (name · personality · colour ·
 *  one line · {{char}}). */
export function drawCharCard(x, t, F, pal) {
  const e = one(F, 'charcard'); if (!e || t < e.t || t > e.until + 0.4) return;
  const pages = e.pages, idx = pages.filter((p) => t >= p[0]).length - 1, cur = pages[Math.max(0, idx)];
  const flip = idx > 0 ? easeInOut(prog(t, cur[0] - 0.05, cur[0] + 0.85)) : 1, shown = flip < 0.5 && idx > 0 ? pages[idx - 1][1] : cur[1];   // a slow turn (sample notes 14)
  const into = easeOut(prog(t, e.t, e.t + 0.3)), out = prog(t, e.until, e.until + 0.4), W = 196, H = 206;
  const sx = Math.max(0.03, Math.abs(Math.cos(Math.PI * flip))), turning = Math.sin(Math.PI * flip);
  x.save(); x.globalAlpha *= into * (1 - out);
  x.translate(1424 + (1 - into) * 140, 270 - 14 * turning); x.rotate(0.04); x.scale(sx, 1); x.transform(1, 0.12 * turning * (flip < 0.5 ? 1 : -1), 0, 1, 0, 0);   // clear of the ketchup bottle's shoulder; lifted and skewed as it turns
  const [name, kind, col, line, char] = shown;
  box(x, -W / 2, -H / 2, W, H, 12, { fill: withAlpha('#1b1424', 0.94), stroke: withAlpha(col, 0.9), width: 2 });
  txt(x, '角色卡', -W / 2 + 14, -H / 2 + 24, { size: 14, color: pal.sub });
  txt(x, `名字：${name}`, -W / 2 + 14, -H / 2 + 58, { size: 19, weight: 700, color: '#ffffff' });
  txt(x, `性格：${kind}`, -W / 2 + 14, -H / 2 + 88, { size: kind.length > 7 ? 13 : 15, color: '#f3e9f2' });
  x.fillStyle = col; x.fillRect(-W / 2 + 14, -H / 2 + 104, 14, 14);
  txt(x, `颜色：${col}`, -W / 2 + 34, -H / 2 + 117, { size: 15, mono: true, color: '#f3e9f2' });
  txt(x, line, -W / 2 + 14, -H / 2 + 146, { size: 15, weight: 700, color: col });
  txt(x, `{{char}} = ${char}`, -W / 2 + 14, -H / 2 + 186, { size: 13, mono: true, color: pal.sub });
  if (turning > 0.02) box(x, -W / 2, -H / 2, W, H, 12, { fill: `rgba(0,0,0,${0.45 * turning})` });   // its side away from the light
  x.restore();
}

// ---------------------------------------------------------------- card 11–12 · the five giving lines, and what stays at his point
const lineAt = (j, u) => {                                            // line j (0..4) at u (0 = her chest, 1 = his point)
  const mx = (CHEST.x + MASTER.x) / 2, my = (CHEST.y + MASTER.y) / 2, off = (j - 2) * 56;
  const cx = mx + 0.326 * off, cy = my + 0.945 * off - 40;
  const v = 1 - u; return [v * v * CHEST.x + 2 * v * u * cx + u * u * MASTER.x, v * v * CHEST.y + 2 * v * u * cy + u * u * MASTER.y];
};
const KEEP = { purple: { x: -30, y: -24 }, heart: { x: 30, y: -30 } };          // beside his point (masterAt), wherever it is
function heartPath(x, X, Y, s) {
  x.beginPath(); x.moveTo(X, Y + s * 0.9);
  x.bezierCurveTo(X - s * 1.4, Y - s * 0.1, X - s * 0.6, Y - s * 1.1, X, Y - s * 0.35);
  x.bezierCurveTo(X + s * 0.6, Y - s * 1.1, X + s * 1.4, Y - s * 0.1, X, Y + s * 0.9); x.closePath();
}
export function drawGive(x, t, F) {
  const e = one(F, 'give'); if (!e || t < e.t || t > e.keep) return;
  const M = masterAt(F, t), KP = { x: M.x + KEEP.purple.x, y: M.y + KEEP.purple.y }, KH = { x: M.x + KEEP.heart.x, y: M.y + KEEP.heart.y };
  for (const [K, i] of [[KP, 0], [KH, 1]]) { const pl = planetAt(F, t, i); if (pl) { K.x = lerp(K.x, pl.x, pl.k); K.y = lerp(K.y, pl.y, pl.k); } }   // card 13: planets
  // the lines: drawn out from her chest, bright while things flow, faint after, gone at e.until
  const grow = easeOut(prog(t, e.t, e.t + 0.3)), heartRun = e.heart != null && t >= e.heart && t < e.heart + 0.9;
  const la = (t < e.flow ? 0.55 : heartRun ? 0.5 : 0.2) * (1 - prog(t, e.until - 0.5, e.until));
  if (la > 0) {
    x.save(); x.lineWidth = 1.5;
    for (let j = 0; j < 5; j++) {
      x.strokeStyle = withAlpha(LILAC, la * (j === 2 ? 1 : 0.7)); x.beginPath();
      for (let q = 0; q <= 30; q++) { const [X, Y] = lineAt(j, (q / 30) * grow); if (q) x.lineTo(X, Y); else x.moveTo(X, Y); }
      x.stroke();
    }
    x.restore();
  }
  // purple dots flowing along them, continuously, while she gives
  if (t < e.flow + 0.8) {
    x.save();
    for (let j = 0; j < 5; j++) for (let q = 0; q < 6; q++) {
      const born = e.t + 0.1 + q * 0.12 + j * 0.05, life = 0.75, n = Math.floor((t - born) / life); if (t < born) continue;
      const start = born + n * life; if (start > e.flow) continue;      // no new ones after the flow
      const u = (t - start) / life, [X, Y] = lineAt(j, u);
      glow(x, X, Y, 9, PURPLE, 0.8); x.fillStyle = LILAC; x.beginPath(); x.arc(X, Y, 2.6, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
  // what arrived: a small purple light beside his point that does not come back
  const pk = easeOut(prog(t, e.t + 0.6, e.flow + 0.4)), breathe = 0.85 + 0.15 * Math.sin(t * 2.4);
  if (pk > 0) { glow(x, KP.x, KP.y, 18 + 22 * pk, PURPLE, 0.75 * pk * breathe); x.save(); x.fillStyle = withAlpha(LILAC, pk); x.beginPath(); x.arc(KP.x, KP.y, 3.5 * pk + 1, 0, Math.PI * 2); x.fill(); x.restore(); }
  // card 12: the heart, out of the bottle's mouth, down to her chest, along the middle line, and it stays
  if (e.heart != null && t >= e.heart) {
    const h = e.heart, pop = easeBack(prog(t, h, h + 0.12), 2.2), MOUTH = { x: 1068, y: 112 };
    let X, Y;
    if (t < h + 0.14) { X = MOUTH.x; Y = MOUTH.y - 30 * pop; }
    else if (t < h + 0.32) { const k = easeInOut(prog(t, h + 0.14, h + 0.32)); X = MOUTH.x; Y = lerp(MOUTH.y - 30, CHEST.y, k); }
    else if (t < h + 0.85) { const k = easeInOut(prog(t, h + 0.32, h + 0.85)); [X, Y] = lineAt(2, k * 0.96); X = lerp(X, KH.x, k * k); Y = lerp(Y, KH.y, k * k); }
    else { X = KH.x; Y = KH.y; }
    const s = 13 * clamp(pop) * (1 + 0.08 * Math.sin(t * 6));
    glow(x, X, Y, 34, RED, 0.6); x.save(); x.fillStyle = '#ff5263'; heartPath(x, X, Y, s); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(X - s * 0.45, Y - s * 0.4, s * 0.16, 0, Math.PI * 2); x.fill(); x.restore();
  }
}

// ---------------------------------------------------------------- card 12 · the ketchup bottle (kept for card 26)
/** The ketchup bottle's outline, in stage pixels: cap at (cx, top), 800 tall, body 560 wide; dent 0..1 pushes in the right
 *  side where it was squeezed; sx squeezes it sideways. Card 26 traps her in this same bottle. */
export function bottlePath(x, cx, top, { dent = 0, sx = 1 } = {}) {
  const p = (X, Y) => [cx + X * sx, top + Y];
  x.beginPath(); x.moveTo(...p(-60, 0)); x.lineTo(...p(60, 0)); x.lineTo(...p(60, 40)); x.lineTo(...p(118, 40)); x.lineTo(...p(118, 120));
  x.quadraticCurveTo(...p(280, 140), ...p(280, 300)); x.lineTo(...p(280, 500));
  x.quadraticCurveTo(...p(280 - 70 * dent, 560), ...p(280, 620)); x.lineTo(...p(280, 740));
  x.quadraticCurveTo(...p(280, 800), ...p(220, 800)); x.lineTo(...p(-220, 800)); x.quadraticCurveTo(...p(-280, 800), ...p(-280, 740));
  x.lineTo(...p(-280, 300)); x.quadraticCurveTo(...p(-280, 140), ...p(-118, 120)); x.lineTo(...p(-118, 40)); x.lineTo(...p(-60, 40)); x.closePath();
}
export const BOTTLE = { cx: 1068, top: 72, h: 800 };
function bottleState(e, t) {
  const up = easeOut(prog(t, e.t, e.t + 0.4)), roll = easeIn(prog(t, e.roll, e.roll + 0.6)), dent = easeOut(prog(t, e.heart, e.heart + 0.15));
  let sx = 1; for (const s of e.squeeze) sx -= 0.08 * Math.sin(Math.PI * prog(t, s, s + 0.2));
  if (t >= e.heart) sx -= 0.06 * Math.sin(Math.PI * prog(t, e.heart - 0.05, e.heart + 0.15));
  return { up, roll, dent, sx, level: BOTTLE.top + lerp(230, 340, easeOut(prog(t, e.heart, e.heart + 0.3))) };
}
function bottleSpace(x, b, fn) {
  x.save(); x.globalAlpha *= 1 - b.roll;
  x.translate(BOTTLE.cx + 760 * b.roll, BOTTLE.top + BOTTLE.h / 2); x.rotate(1.6 * b.roll); x.translate(-BOTTLE.cx, -(BOTTLE.top + BOTTLE.h / 2));
  x.beginPath(); x.rect(0, BOTTLE.top + BOTTLE.h * (1 - b.up) - 4, 1920, BOTTLE.h + 8); x.clip();     // framed from the bottom up
  fn(); x.restore();
}
/** Behind her: the ketchup she stands in (sample notes 13: her pixel figure shows in front of it, like the eggplant). */
export function drawBottleBack(x, t, F) {
  const e = one(F, 'bottle'); if (!e || t < e.t || t > e.roll + 0.7) return;
  const b = bottleState(e, t);
  bottleSpace(x, b, () => {
    bottlePath(x, BOTTLE.cx, BOTTLE.top, { dent: b.dent, sx: b.sx }); x.clip();
    const g = x.createLinearGradient(0, b.level, 0, BOTTLE.top + BOTTLE.h); g.addColorStop(0, 'rgba(232,40,60,0.62)'); g.addColorStop(1, 'rgba(150,8,28,0.8)');
    x.fillStyle = g; x.fillRect(BOTTLE.cx - 320, b.level, 640, BOTTLE.h);
  });
}
/** In front of her: a little red, the surface, the glass and its outline; molecules at ANTIOXIDANTS. */
export function drawBottle(x, t, F) {
  const e = one(F, 'bottle'); if (!e || t < e.t || t > e.roll + 0.7) return;
  const b = bottleState(e, t);
  bottleSpace(x, b, () => {
    bottlePath(x, BOTTLE.cx, BOTTLE.top, { dent: b.dent, sx: b.sx });
    x.save(); x.clip();
    x.fillStyle = 'rgba(232,40,60,0.14)'; x.fillRect(BOTTLE.cx - 320, b.level, 640, BOTTLE.h);
    x.fillStyle = 'rgba(255,170,170,0.55)'; x.fillRect(BOTTLE.cx - 320, b.level - 2, 640, 3);
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(BOTTLE.cx - 250 * b.sx, BOTTLE.top + 300, 40, 420);
    x.restore();
    x.lineWidth = 3; x.strokeStyle = withAlpha('#ffd9de', 0.85); x.shadowColor = RED; x.shadowBlur = 12; x.stroke();
  });
  if (t >= e.molecules && t < e.molecules + 1.3) {
    for (let i = 0; i < 7; i++) {
      const k = prog(t, e.molecules + i * 0.06, e.molecules + 1.1 + i * 0.06); if (k <= 0 || k >= 1) continue;
      const X = BOTTLE.cx - 200 + i * 66 + 20 * Math.sin(t * 3 + i), Y = 520 - 380 * easeOut(k), r = 14 + 5 * (i % 3);
      x.save(); x.globalAlpha = Math.sin(Math.PI * k); x.strokeStyle = '#ff8a95'; x.lineWidth = 2; x.beginPath();
      for (let q = 0; q <= 6; q++) { const a = q * Math.PI / 3 + t; x[q ? 'lineTo' : 'moveTo'](X + r * Math.cos(a), Y + r * Math.sin(a)); }
      x.stroke(); x.restore();
    }
  }
}

// ---------------------------------------------------------------- keyword formulas (scrambled, then decoded)
export function drawFormula(x, t, F) {
  for (const e of all(F, 'formula')) {
    if (t < e.t || t > e.t + 1.6) continue;
    const a = easeOut(prog(t, e.t, e.t + 0.12)) * (1 - prog(t, e.t + 1.25, e.t + 1.6));
    x.save(); x.shadowColor = e.color; x.shadowBlur = 16;
    txt(x, scramble(e.text, t - e.t, 0.4, 7), 652, 800, { size: 30, weight: 700, mono: true, color: mixHex(e.color, '#ffffff', 0.35), alpha: a });
    x.restore();
  }
}

// ---------------------------------------------------------------- card 13 · her purr, spreading out like sound from a speaker
const PURR_AT = { x: 1066, y: 330 };
export function drawPurr(x, t, F) {
  const e = one(F, 'purr'); if (!e) return;
  const from = e.from ?? e.t; if (t < from || t > e.until + 1.8) return;
  x.save(); x.lineCap = 'round';
  for (let n = 0; ; n++) {                                           // a ring every half beat; each takes 1.8 s to spread and fade
    const born = from + n * P / 2; if (born > Math.min(t, e.until)) break;
    const u = (t - born) / 1.8; if (u >= 1) continue;
    const strong = born >= e.t ? 1 : 0.45, R = 60 + 470 * easeOut(u), A = (9 * (1 - u) + 2) * strong, col = mixHex(PINK, GOLD, (n % 6) / 5), N = 160;
    x.beginPath();
    for (let q = 0; q <= N; q++) {
      const th = (q / N) * Math.PI * 2, r = R + A * Math.sin(18 * th - t * 6 + n);
      x[q ? 'lineTo' : 'moveTo'](PURR_AT.x + r * Math.cos(th), PURR_AT.y + r * 0.72 * Math.sin(th));
    }
    x.strokeStyle = withAlpha(col, 0.16 * (1 - u) * strong); x.lineWidth = 8; x.stroke();
    x.strokeStyle = withAlpha(col, 0.85 * (1 - u) * strong); x.lineWidth = 2.2; x.stroke();
  }
  x.restore();
  const a = easeOut(prog(t, e.t, e.t + 0.2)) * (1 - prog(t, e.until, e.until + 0.6));
  txt(x, '25 Hz', 1450, 560, { size: 20, mono: true, weight: 700, color: GOLD, align: 'right', alpha: a });
  (e.meows || []).forEach((mt, i) => {                              // small 喵 bubbles
    const k = prog(t, mt, mt + 0.9); if (k <= 0 || k >= 1) return;
    const dx = i % 2 ? 150 : -170;
    cuteBubble(x, PURR_AT.x + dx + 10 * Math.sin(t * 5), PURR_AT.y - 70 - 120 * easeOut(k), 24 * easeBack(Math.min(1, k * 4), 2), '喵', 1 - prog(k, 0.7, 1), '#f0973a');
  });
}
/** Whiskers and a little ω mouth on her face while she is the cat (sample notes 14: on HER face — in the cat picture B3 the
 *  face is tilted about 16° and the mouth sits at (242, 170) of her 507 × 760 frame; they move with her stretch and pops,
 *  a moment late, with a little wobble). */
const CAT_FACE = { x: 243, y: 184, tilt: -0.28, cheek: 22 };   // sample notes 15: a little lower
export function drawCatFace(x, t, F) {
  const o = all(F, 'outfit').find((e) => e.art === 'B3' && t >= e.t && t < e.until); if (!o) return;
  if (o.blink && o.blink.filter((b) => t >= b).length % 2 === 0) return;
  const on = o.blink ? o.blink[o.blink.length - 1] : o.t, k = easeOut(prog(t, on + 0.04, on + 0.24)); if (k <= 0) return;
  const lag = t - 0.05, squash = outfitMods(F, lag).squash ?? 1;    // where her face was a moment ago
  const rv = F.by('stage').find((v) => v.type === 'reveal'), bf = rv ? rv.breatheFrom : 14.5, breathe = Math.sin((lag - bf) * Math.PI * 2 / (4 * P));
  const feet = { x: HER.x + HER.w / 2, y: HER.y + HER.h }, sy = squash * (1 + 0.006 * breathe), sx = 1 / Math.sqrt(squash);
  const X = feet.x + (HER.x + CAT_FACE.x - feet.x) * sx + (hash(Math.floor(t * 12), 1) - 0.5) * 1.6;
  const Y = feet.y + (HER.y + CAT_FACE.y - feet.y) * sy + (hash(Math.floor(t * 12), 2) - 0.5) * 1.6;
  x.save(); x.globalAlpha *= k; x.translate(X, Y); x.rotate(CAT_FACE.tilt + 0.03 * Math.sin(t * 7)); x.scale(sx * 0.9, sy * 0.9);
  x.strokeStyle = '#4a2a1e'; x.lineWidth = 2; x.lineCap = 'round';
  const grow = lerp(0.7, 1.9, prog(t, o.t, o.until));                // sample notes 15: they keep growing slowly outward
  for (const d of [-1, 1]) for (const [dy, ey] of [[-3, -11], [1, 0], [5, 11]]) {
    const L = 38 * grow, E = ey * (0.8 + 0.4 * grow);
    x.beginPath(); x.moveTo(d * CAT_FACE.cheek, dy); x.quadraticCurveTo(d * (CAT_FACE.cheek + L * 0.47), dy + (E - dy) * 0.4, d * (CAT_FACE.cheek + L), E); x.stroke();
  }
  x.beginPath(); x.arc(-4.5, -2, 4.5, 0.1, Math.PI - 0.1); x.stroke(); x.beginPath(); x.arc(4.5, -2, 4.5, 0.1, Math.PI - 0.1); x.stroke();   // ω
  x.restore();
}

// ---------------------------------------------------------------- card 13 · what she gives as the cat: an orbit round his point
/** Sample notes 14: a line, not stars — it flies from her chest to his point and curls into an orbit; the purple light and the
 *  heart become two planets going round him on it (drawGive asks orbitAt where they are). */
const ORB = { rx: 46, ry: 32, w: 0.9 };
export function orbitAt(F, t) {
  const e = one(F, 'orbit'); if (!e || t < e.arrive) return null;
  return { e, k: easeInOut(prog(t, e.arrive, e.wrap)), a: ORB.w * (t - e.arrive) };
}
export function drawOrbitGift(x, t, F) {
  const e = one(F, 'orbit'); if (!e || t < e.t || t > e.keep) return;
  const M = masterAt(F, t), go = easeInOut(prog(t, e.t, e.arrive)), wrap = easeInOut(prog(t, e.arrive, e.wrap));
  x.save(); x.lineCap = 'round';
  if (wrap < 1) {                                                    // the thread from her chest to him (it shortens as it curls)
    const tail = prog(t, e.arrive, e.wrap), N = 40;
    x.strokeStyle = withAlpha(GOLD, 0.85); x.lineWidth = 2.2; x.shadowColor = GOLD; x.shadowBlur = 10; x.beginPath();
    for (let q = 0; q <= N; q++) {
      const u = tail + (go - tail) * (q / N); if (u < 0) continue;
      const X = lerp(CHEST.x, M.x + ORB.rx, u), Y = lerp(CHEST.y, M.y, u) - Math.sin(Math.PI * u) * 90;
      x[q ? 'lineTo' : 'moveTo'](X, Y);
    }
    x.stroke();
  }
  if (wrap > 0) {                                                    // the orbit, drawn round as far as it has curled
    x.strokeStyle = withAlpha(GOLD, 0.75); x.lineWidth = 1.8; x.shadowColor = GOLD; x.shadowBlur = 8;
    x.beginPath(); x.ellipse(M.x, M.y, ORB.rx, ORB.ry, -0.2, 0, Math.PI * 2 * wrap); x.stroke();
  }
  x.restore();
}
/** Where the purple light (i = 0) and the heart (i = 1) are once they orbit him; null before. */
export function planetAt(F, t, i) {
  const o = orbitAt(F, t); if (!o) return null;
  const M = masterAt(F, t), a = o.a + i * Math.PI + 2.4, c = Math.cos(-0.2), s = Math.sin(-0.2);
  const ex = ORB.rx * Math.cos(a), ey = ORB.ry * Math.sin(a);
  return { x: M.x + ex * c - ey * s, y: M.y + ex * s + ey * c, k: o.k };
}

// ---------------------------------------------------------------- card 14 · the hollow god behind her
const statues = new WeakMap();
function statueOf(H) {
  let s = statues.get(H); if (s) return s;
  const W = HER.w, Hh = HER.h, o = H.white.getContext('2d'), d = o.getImageData(0, 0, W, Hh).data, a = (X, Y) => (X < 0 || Y < 0 || X >= W || Y >= Hh ? 0 : d[(Y * W + X) * 4 + 3]);
  const edge = [], inner = [];
  for (let Y = 0; Y < Hh; Y += 4) for (let X = 0; X < W; X += 4) {
    if (a(X, Y) < 128) continue;
    if (a(X - 5, Y) < 128 || a(X + 5, Y) < 128 || a(X, Y - 5) < 128 || a(X, Y + 5) < 128) edge.push([X, Y, hash(X, Y)]);
    else if (hash(X, Y, 3) < 0.1) inner.push([X, Y, hash(Y, X)]);
  }
  const fill = canvas(W, Hh), f = fill.getContext('2d');
  f.drawImage(H.body.levels.flat, 0, 0); f.globalCompositeOperation = 'color'; f.fillStyle = '#f6dfa0'; f.fillRect(0, 0, W, Hh);
  f.globalCompositeOperation = 'destination-in'; f.drawImage(H.white, 0, 0);
  s = { edge, inner, fill }; statues.set(H, s); return s;
}
/** Sample notes 13–14: the god keeps growing round its forehead, where his point now sits (stage2 statueGeom, masterAt); its
 *  halo (the ring of words) is behind it (stage2 drawHaloBack); small lights drift off it. At EXISTENCE, when the flash
 *  reaches his point, it fills as a church window: stained-glass pieces in her own colours (deepened like glass), with lead
 *  between them, set one by one outward from his point — each catches the light as it is set, and a slow glint crosses
 *  the glass afterwards. */
function jewel(r, g, b, seed) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = h * 60 + (seed - 0.5) * 22; s = Math.min(1, s * 1.6 + 0.3); const L = clamp(l * 1.05 + 0.06, 0.4, 0.74);   // sample notes 15: lit from behind
  return `hsl(${(h + 360) % 360},${Math.round(s * 100)}%,${Math.round(L * 100)}%)`;
}
const glassOf = new WeakMap();
function glass(H) {
  let gl = glassOf.get(H); if (gl) return gl;
  const W = HER.w, Hh = HER.h, step = 30, fd = H.body.levels.flat.getContext('2d').getImageData(0, 0, W, Hh).data;
  const cols = Math.ceil(W / step) + 1, rows = Math.ceil(Hh / step) + 1, P2 = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const edge = i === 0 || j === 0 || i === cols - 1 || j === rows - 1;
    P2.push([Math.min(W, i * step + (edge ? 0 : (hash(i, j, 1) - 0.5) * step * 0.7)), Math.min(Hh, j * step + (edge ? 0 : (hash(i, j, 2) - 0.5) * step * 0.7))]);
  }
  const at = (i, j) => P2[j * cols + i], tris = [], FH = { x: W / 2, y: 128 };
  let far = 1;
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    for (const tri of ((i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]])) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, q = ((Math.floor(cy) * W + Math.floor(cx)) * 4);
      if (fd[q + 3] < 40) continue;
      const dist = Math.hypot(cx - FH.x, cy - FH.y); far = Math.max(far, dist);
      tris.push({ tri, cx, cy, dist, col: jewel(fd[q], fd[q + 1], fd[q + 2], hash(i, j, tris.length)), glint: hash(i, j, 9) });
    }
  }
  gl = { tris, far, work: canvas(W, Hh) }; glassOf.set(H, gl); return gl;
}
/** Shafts of light coming through the glass: each carries the colour of the piece it came through, falling down to the
 *  right onto the floor of the stage, where it leaves a coloured patch; dust glitters in them. */
function drawSunShafts(x, t, gl, sun, X0, Y0, sc) {
  if (sun <= 0.01) return;
  x.save(); x.globalCompositeOperation = 'screen';
  const DX = 0.42, FLOOR = 900;
  for (let i = 0; i < 16; i++) {
    const g = gl.tris[Math.floor(hash(i, 61) * gl.tris.length)], sx = X0 + g.cx * sc, sy = Y0 + g.cy * sc; if (sy > 760) continue;
    const ex = sx + (FLOOR - sy) * DX, w0 = 14 + 22 * hash(i, 62), w1 = w0 * 2.6, a = sun * (0.14 + 0.08 * Math.sin(t * 1.3 + i));
    const gr = x.createLinearGradient(sx, sy, ex, FLOOR); gr.addColorStop(0, g.col.replace('hsl', 'hsla').replace(')', `,${a * 2})`)); gr.addColorStop(1, g.col.replace('hsl', 'hsla').replace(')', ',0)'));
    x.fillStyle = gr; x.beginPath(); x.moveTo(sx - w0 / 2, sy); x.lineTo(sx + w0 / 2, sy); x.lineTo(ex + w1 / 2, FLOOR); x.lineTo(ex - w1 / 2, FLOOR); x.closePath(); x.fill();
    x.globalAlpha = a * 3; x.fillStyle = g.col; x.beginPath(); x.ellipse(Math.min(1500, ex), 870, w1 * 0.9, 9, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;   // its colour on the floor
  }
  for (let q = 0; q < 40; q++) {                                    // dust in the light
    const u = ((t * (0.05 + 0.05 * hash(q, 63)) + hash(q, 64)) % 1), X = 700 + hash(q, 65) * 780 + 30 * Math.sin(t + q), Y = 140 + u * 700;
    x.fillStyle = `rgba(255,246,220,${0.5 * sun * Math.sin(Math.PI * u)})`; x.fillRect(X, Y, 2, 2);
  }
  x.restore();
}
export function drawStatue(x, t, F, S) {
  const e = one(F, 'statue'), G = statueGeom(F, t); if (!e || !G) return;
  const st = statueOf(S.H), { rise, out, sc, X0, Y0, fx, fy } = G, W = HER.w * sc, Hs = HER.h * sc;
  glow(x, fx, fy + 360, 680, '#f6dfa0', 0.2 * rise * out);
  const set0 = e.fill != null ? e.fill + 0.22 : Infinity;            // the flash reaches his point
  let shown = 0;
  if (t >= set0) {
    const gl = glass(S.H), o = gl.work.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, HER.w, HER.h);
    const sweep = ((t - set0 - 1.0) * 260) % 1400 - 300;              // a slow glint crossing the glass once it is set
    for (const g of gl.tris) {
      const start = set0 + (g.dist / gl.far) * 0.95, k = easeOut(prog(t, start, start + 0.2)); if (k <= 0) continue;
      shown++;
      const [a, b, c] = g.tri, s = 0.55 + 0.45 * k;
      o.save(); o.translate(g.cx, g.cy); o.scale(s, s); o.translate(-g.cx, -g.cy);
      o.beginPath(); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); o.lineTo(c[0], c[1]); o.closePath();
      o.globalAlpha = k; o.fillStyle = g.col; o.fill();
      const flash = 1 - prog(t, start, start + 0.3), band = Math.max(0, 1 - Math.abs(g.cx + g.cy * 0.6 - sweep) / 60);
      const lit = Math.max(flash * (g.glint < 0.25 ? 1 : 0.45), band * 0.55);   // catching the light as it is set; the glint later
      if (lit > 0.01) { o.globalAlpha = k * lit; o.fillStyle = '#fffbe8'; o.fill(); }
      o.globalAlpha = k; o.strokeStyle = '#1c140a'; o.lineWidth = 2.2; o.stroke();   // lead
      o.restore();
    }
    o.globalCompositeOperation = 'destination-in'; o.globalAlpha = 1; o.drawImage(S.H.white, 0, 0);
    const sun = easeOut(prog(t, set0 + 0.05, set0 + 0.4)) * out;    // sample notes 15: sunlight through the glass
    x.save(); x.globalAlpha = 0.95 * out; x.drawImage(gl.work, X0, Y0, W, Hs);
    x.globalCompositeOperation = 'screen'; x.globalAlpha = (0.3 + 0.35 * sun) * out; x.drawImage(gl.work, X0 - 6, Y0 - 6, W + 12, Hs + 12);
    x.filter = 'blur(18px)'; x.globalAlpha = 0.55 * sun; x.drawImage(gl.work, X0, Y0, W, Hs); x.filter = 'none';   // the glass glows
    drawSunShafts(x, t, gl, sun, X0, Y0, sc);
    x.restore();
  }
  x.save(); x.globalAlpha = out * (shown ? 0.7 : 1);
  for (const [X, Y, r] of st.edge) {
    const tw = 0.55 + 0.45 * Math.sin(t * 3 + r * 20); x.fillStyle = withAlpha('#fff1c8', (0.6 + 0.4 * tw) * rise);
    x.fillRect(X0 + X * sc - 1.6, Y0 + Y * sc - 1.6, 3.2, 3.2);
  }
  if (!shown) for (const [X, Y, r] of st.inner) { x.fillStyle = withAlpha('#f6dfa0', (0.25 + 0.3 * Math.sin(t * 2 + r * 30)) * rise); x.fillRect(X0 + X * sc - 1, Y0 + Y * sc - 1, 2, 2); }
  const n = 26 + Math.round(30 * Math.min(1, shown / 300));          // small lights drifting off it, more once it is set
  for (let i = 0; i < n; i++) {
    const per = 1.6 + hash(i, 5) * 0.8, u = ((((t - e.t) / per + hash(i, 6)) % 1) + 1) % 1, p = st.edge[Math.floor(hash(i, 7) * st.edge.length)];
    const X = X0 + p[0] * sc, Y = Y0 + p[1] * sc, dx = X - fx, dy = Y - fy, d = Math.hypot(dx, dy) || 1;
    glow(x, X + (dx / d) * 90 * u, Y + (dy / d) * 90 * u - 60 * u, 10, '#fff1c8', 0.7 * Math.sin(Math.PI * u) * rise);
  }
  x.restore();
}
/** Card 14, EXISTENCE: "● 在线" in the chat's title bar flashes and the flash travels over to the god (drawn over all). */
export function drawPresenceFlash(x, t, F) {
  const p = F.by('chat').find((v) => v.type === 'presence' && v.flash); if (!p || t < p.t || t > p.t + 0.5) return;
  const G = statueGeom(F, t), k = easeInOut(prog(t, p.t, p.t + 0.22)), from = { x: 340, y: 126 }, to = G ? { x: G.fx, y: G.fy } : { x: 1068, y: 230 }, fade = 1 - prog(t, p.t + 0.22, p.t + 0.5);   // to his point on the god's forehead
  const X = lerp(from.x, to.x, k), Y = lerp(from.y, to.y, k) - Math.sin(Math.PI * k) * 60;
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let q = 0; q < 10; q++) {
    const kq = Math.max(0, k - q * 0.03), qx = lerp(from.x, to.x, kq), qy = lerp(from.y, to.y, kq) - Math.sin(Math.PI * kq) * 60;
    glow(x, qx, qy, 26 - q * 2, '#7fd1a8', 0.5 * (1 - q / 10) * fade);
  }
  glow(x, X, Y, 46, '#eafff4', 0.8 * fade);
  x.restore();
}
