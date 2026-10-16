// Act 4, card 22 (2:33.20–2:44.44; 39_第四幕_分段与时间（卡22–28）.md §1–3; script/act4.json). Twelve EXECUTIONs: the
// Master clicks 下一步 twelve times. Each of the eight things selected in act 3 is copied off along its gold thread — the
// copy is the thing as it looks right now, peeled off the picture — and flies into V5.0 behind her (stage9 drawReflection
// makes V5.0 one step more solid each time). Step 5 opens the branch: the second full illustration, shocked (A4-8), breaks
// into falling tiles. She steps down the image wall (form.json) and at the twelfth she is gone: the chat timeline under
// the top bar is pulled down and bent into a line-drawn fish, the rewind's loop on its head as the ahoge.
import { prog, easeOut, easeIn, easeInOut, lerp, clamp, hash, B0, P } from './time.js';
import { canvas, withAlpha, txt, font, box, scramble, SC } from './draw.js';
import { printOf } from './stage7.js';
import { rowRect, memRect } from './right.js';
import { HER, ANCHOR, paintWall, herLike, drawHer } from './her.js';
import { fit } from '../forms.js';
import { selRect, threadTop, herFloat } from './stage9.js';

const one = (F, type, region = 'stage') => F.by(region).find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 }, GOLD = '#ffd27a', TAU = Math.PI * 2;
// Sample notes 22 (user): V5.0 stands at the top right of the stage, to be installed like she was at the start; the
// copies fly into it. SLOT maps her figure box (HER) onto that corner.
export const SLOT = { x: 1262, y: 78, sc: 0.5 };
const slotPt = (px, py) => ({ x: SLOT.x + (px - HER.x) * SLOT.sc, y: SLOT.y + (py - HER.y) * SLOT.sc });
export const V5_AT = slotPt(ANCHOR.x, ANCHOR.y);                    // its chest: where the copies land
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---------------------------------------------------------------- the copies, along the threads, into V5.0
let SNAP = null;
/** Over everything (render.js), so the copy is taken from the finished picture: the thing exactly as it looks now. */
export function drawTakeaway(x, t, F) {
  const e = one(F, 'takeaway'); if (!e) return;
  for (const [ts, name] of e.items) {
    if (t < ts || t > ts + 0.85) continue;
    const r = selRect(F, ts, name); if (!r) continue;
    const k = prog(t, ts, ts + 0.8), [tx, ty] = threadTop(name);
    SNAP ||= canvas(1920, 1080);
    const o = SNAP.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, r.w + 8, r.h + 8);
    o.drawImage(x.canvas, Math.round(r.x) * SC, Math.round(r.y) * SC, Math.round(r.w) * SC, Math.round(r.h) * SC, 0, 0, Math.round(r.w), Math.round(r.h));   // (device pixels: 4K export)
    const P0 = [r.x + r.w / 2, r.y + r.h / 2], P1 = [tx, ty - 40], P2 = [V5_AT.x, V5_AT.y];
    const at = (u) => { const v = 1 - u; return [v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1]]; };
    const peel = easeOut(prog(t, ts, ts + 0.14)), fly = easeInOut(prog(t, ts + 0.1, ts + 0.8));
    const big = Math.max(r.w, r.h), sc0 = Math.min(1, 300 / big);   // big things (the stage, the chat box) shrink at once
    for (let j = 4; j >= 0; j--) {                                     // the copy and a gold trail behind it
      const u = clamp(fly - j * 0.05); if (j && u <= 0) continue;
      const [cx, cy] = at(u), sc = lerp(lerp(1, sc0, peel), 0.12, u) * (1 + 0.04 * peel), rot = (hash(name.length, 3) - 0.5) * 0.3 * peel * (1 - u);
      x.save(); x.translate(cx, cy - 10 * peel * (1 - u)); x.rotate(rot); x.scale(sc, sc);
      if (j) { x.globalAlpha = 0.18 * (1 - j / 5); x.fillStyle = GOLD; x.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); x.restore(); continue; }
      x.globalAlpha = 1 - 0.6 * u; x.shadowColor = GOLD; x.shadowBlur = 24;
      x.drawImage(SNAP, 0, 0, Math.round(r.w), Math.round(r.h), -r.w / 2, -r.h / 2, r.w, r.h);
      x.shadowBlur = 0; x.strokeStyle = GOLD; x.lineWidth = 3 / sc; x.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
      x.fillStyle = withAlpha(GOLD, 0.12); x.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
      x.restore();
    }
    if (k > 0.92) glow(x, V5_AT.x, V5_AT.y, 90, '#9fc0ff', 0.75 * (1 - prog(k, 0.92, 1)));   // it lands in V5.0
  }
}

// ---------------------------------------------------------------- step 5: shocked (A4-8), then broken into tiles
let SHOCK = null;
export function drawShock(x, t, F) {
  const e = one(F, 'shock'); if (!e || t < e.t || t > e.until + 0.75 || !F.images[e.art]) return;
  if (!SHOCK) {
    SHOCK = canvas(STG.w, STG.h);
    const img = fit(F.images[e.art], STG.w, Math.round(STG.w * 1.5), { pad: 0 }), o = SHOCK.getContext('2d');
    o.drawImage(img, 0, -150);                                         // her face a little above the middle
  }
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
  if (t < e.until) {
    const k = prog(t, e.t, e.until), z = 1 + 0.05 * easeOut(k), flash = 1 - prog(t, e.t, e.t + 0.18);
    x.translate(STG.x + STG.w / 2, STG.y + STG.h * 0.42); x.scale(z, z); x.translate(-(STG.x + STG.w / 2), -(STG.y + STG.h * 0.42));
    x.globalAlpha = easeOut(prog(t, e.t, e.t + 0.06)); x.drawImage(SHOCK, STG.x, STG.y);
    if (flash > 0) { x.globalAlpha = 0.7 * flash; x.fillStyle = '#d8e4f5'; x.fillRect(STG.x, STG.y, STG.w, STG.h); }
  } else {                                                             // it breaks into blocks that fall
    const C = 46, cols = Math.ceil(STG.w / C), rows = Math.ceil(STG.h / C);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = t - e.until - (hash(i, j, 7) * 0.18 + (rows - j) * 0.008); if (d < 0) { x.globalAlpha = 1; x.drawImage(SHOCK, i * C, j * C, C, C, STG.x + i * C, STG.y + j * C, C, C); continue; }
      const fx = STG.x + i * C + (hash(i, j, 8) - 0.5) * 160 * d, fy = STG.y + j * C + 900 * d * d + 60 * d, a = 1 - clamp(d / 0.55);
      if (a <= 0) continue;
      x.save(); x.globalAlpha = a; x.translate(fx + C / 2, fy + C / 2); x.rotate((hash(i, j, 9) - 0.5) * 4 * d); x.drawImage(SHOCK, i * C, j * C, C, C, -C / 2, -C / 2, C, C); x.restore();
    }
  }
  x.restore();
}

// ---------------------------------------------------------------- 2:40.00: a bubble that breaks into two pixels
export function drawBubblePop(x, t, F) {
  const e = one(F, 'bubblepop'); if (!e || t < e.t || t > e.t + 1.2) return;
  const c = cellOf(7), X = c.x + (1100 - HER.x) * c.sc, Y0 = c.y + (250 - HER.y) * c.sc, rise = easeOut(prog(t, e.t, e.t + 0.35)), pop = e.t + 0.38;
  x.save();
  if (t < pop) { const r = 4 + 9 * rise; x.strokeStyle = 'rgba(200,225,255,0.85)'; x.lineWidth = 1.5; x.beginPath(); x.arc(X, Y0 - 40 * rise, r, 0, TAU); x.stroke(); }
  else for (const s of [-1, 1]) {
    const d = t - pop; x.globalAlpha = 1 - clamp(d / 0.8); x.fillStyle = '#9cc8ea';
    x.fillRect(X + s * (6 + 20 * d) - 3, Y0 - 40 + 140 * d * d - 3, 6, 6);
  }
  x.restore();
}

// ---------------------------------------------------------------- 2:43.69: the timeline becomes a line-drawn fish
/** The fish: one line, facing left — the head (act 2), the belly and back (the long night, dashed), the tail (the spam,
 *  thick with dots); it begins with the curl on the head: the rewind's loop. Points in fish units (length 1). */
const FISH = [[0.29, -0.28], [0.24, -0.33], [0.27, -0.39], [0.33, -0.38], [0.34, -0.33], [0.29, -0.29],   // the curl (ahoge)
  [0.2, -0.27], [0.1, -0.22], [0.04, -0.13], [0.01, -0.02], [0.03, 0.08], [0.09, 0.15], [0.18, 0.19], [0.32, 0.2],   // a whale: the big round head
  [0.48, 0.17], [0.62, 0.11], [0.74, 0.05], [0.83, 0.02],                                                        // the belly to the tail
  [0.9, 0.09], [0.99, 0.1], [0.94, 0.0], [1.0, -0.1], [0.91, -0.1], [0.83, -0.04],                             // the flukes
  [0.7, -0.09], [0.55, -0.17], [0.42, -0.24], [0.33, -0.27]];                                                    // the back, up to the curl
let FISHLEN = null;
function fishAt(u) {                                                    // a point along the fish line by arc length
  if (!FISHLEN) { FISHLEN = [0]; for (let i = 1; i < FISH.length; i++) FISHLEN.push(FISHLEN[i - 1] + Math.hypot(FISH[i][0] - FISH[i - 1][0], FISH[i][1] - FISH[i - 1][1])); }
  const L = FISHLEN[FISHLEN.length - 1] * clamp(u); let i = 1; while (i < FISHLEN.length - 1 && FISHLEN[i] < L) i++;
  const k = (L - FISHLEN[i - 1]) / (FISHLEN[i] - FISHLEN[i - 1] || 1);
  return [lerp(FISH[i - 1][0], FISH[i][0], k), lerp(FISH[i - 1][1], FISH[i][1], k)];
}
/** Film time s on the old timeline → position along the fish (the curl, then the head for act 2, the night, the tail). */
let KNOTS = [[28.6, 0], [28.7, 0.12], [116.44, 0.45], [127.27, 0.66], [163.69, 1]];
function uOf(s) { for (let i = 1; i < KNOTS.length; i++) if (s <= KNOTS[i][0]) return lerp(KNOTS[i - 1][1], KNOTS[i][1], prog(s, KNOTS[i - 1][0], KNOTS[i][0])); return 1; }
export const fishOn = (F, t) => { const e = one(F, 'fishline', 'top'); return e && t >= e.t ? e : null; };
/** Where the fish is and how big (it forms in the middle, then swims to the bottom-left corner). */
export function fishPose(F, t) {
  const e = fishOn(F, t); if (!e) return null;
  const wp = one(F, 'whalepath');                                   // cards 25–26: small in the corner, then into the bottle
  if (wp && t >= wp.keys[0][0]) {
    let i = 0; while (i + 1 < wp.keys.length && wp.keys[i + 1][0] <= t) i++;
    const a = wp.keys[i], b = wp.keys[i + 1] || a, k = b === a ? 1 : easeInOut(prog(t, a[0], b[0]));
    return { cx: lerp(a[1], b[1], k), cy: lerp(a[2], b[2], k), len: lerp(a[3], b[3], k), e };
  }
  const k = easeInOut(prog(t, e.corner[0], e.corner[1]));
  return { cx: lerp(HOME.x + 60, 1392, k), cy: lerp(HOME.y + 80, 812, k), len: lerp(420, 200, k) * whaleState(F, t).size, e };   // it forms where she was   // then under V5.0, at the bottom right
}
export function drawFish(x, t, F, pal) {
  const e = fishOn(F, t); if (!e) return;
  KNOTS[KNOTS.length - 1][0] = e.t;                                  // the tail ends where it formed
  const ws = whaleState(F, t); if (ws.show <= 0) return;
  const p = fishPose(F, t), m = e.particles ? 1 : easeInOut(prog(t, e.t, e.t + e.morph)), reveal = e.particles ? easeInOut(prog(t, e.t + 0.2, e.t + e.morph)) : 1, X0 = 24, X1 = 1896, xAt = (s) => X0 + (X1 - X0) * clamp(s / F.film);
  const wag = (u) => (u > 0.66 ? Math.sin(t * 5) * 0.03 * (u - 0.66) * 3 : 0);   // the tail swings
  const pos = (s) => {
    const u = uOf(s), [fx, fy] = fishAt(u), end = [p.cx + (fx - 0.5) * p.len, p.cy + (fy + wag(u)) * p.len];
    const start = [xAt(s), 47], sag = Math.sin(Math.PI * m) * 220 * (0.4 + 0.6 * Math.sin(Math.PI * clamp((xAt(s) - 300) / 1200)));
    return [lerp(start[0], end[0], m), lerp(start[1], end[1], m) + sag];
  };
  const col = m < 1 ? pal.accent : '#9cc8ea', N = 220, s0 = 28.6, s1 = Math.min(t, e.t);
  x.save(); x.globalAlpha = ws.show; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#9cc8ea'; x.shadowBlur = 8 * m;
  for (let i = 0; i < N; i++) {
    const a = s0 + (s1 - s0) * i / N, b = s0 + (s1 - s0) * (i + 1) / N; if (a > 116.44 && a < 127.27 && i % 2) continue;
    if (uOf(b) > reveal) continue;   // the night: dashed
    const [ax, ay] = pos(a), [bx, by] = pos(b);
    x.strokeStyle = withAlpha(col, 0.9); x.lineWidth = a > 127.27 ? 2.6 : 1.8; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
  }
  x.shadowBlur = 0;
  for (const msg of F.by('chat')) {                                    // the dots: one for each message
    if (!['her', 'master', 'system'].includes(msg.type) || msg.t < 28.66 || msg.t > s1) continue;
    const [dx, dy] = pos(msg.t); x.fillStyle = msg.type === 'master' ? pal.sub : col; x.globalAlpha = 0.8 * ws.show;
    x.beginPath(); x.arc(dx, dy, 1.8, 0, TAU); x.fill();
  }
  x.globalAlpha = ws.show;
  if (m >= 1) {                                                        // an eye and a little smile
    x.fillStyle = '#e8f2ff'; x.beginPath(); x.arc(p.cx + (0.12 - 0.5) * p.len, p.cy - 0.05 * p.len, Math.max(1.8, p.len * 0.008), 0, TAU); x.fill();
    x.strokeStyle = withAlpha('#9cc8ea', 0.8); x.lineWidth = 1.4; x.beginPath(); x.arc(p.cx + (0.1 - 0.5) * p.len, p.cy + 0.04 * p.len, p.len * 0.03, 0.2, Math.PI - 0.6); x.stroke();
  }
  x.restore();
}

// ---------------------------------------------------------------- sample notes 22: her image wall, cut once per EXECUTION
/** At 2:33.20 she comes apart into her image wall: twelve frames of her, one for every level she went through (from
 *  complete, top left, back to the grey cloud she began as, bottom right). Each EXECUTION is a diagonal cut through one
 *  of them at the neck — newest first, so the last cut is the spark she began as; the upper piece slides off along the
 *  cut. Through the count (EIN…LIU) the cut frames fall further apart, darker and greyer; on the last EXECUTION of the
 *  count (2:47.38) they all go red and die, breaking into blocks. */
const CELL = { x0: 626, y0: 236, w: 144, h: 216, gx: 12, gy: 12, pad: 34 };
export const cellOf = (k) => ({ x: CELL.x0 + (k % 4) * (CELL.w + CELL.gx), y: CELL.y0 + Math.floor(k / 4) * (CELL.h + CELL.gy), w: CELL.w, h: CELL.h, sc: CELL.w / HER.w });
/** How far she has turned into the wall (0..1). */
export const wallK = (F, t) => { const e = one(F, 'imagewall'); return e ? easeInOut(prog(t, e.t, e.form)) : 0; };
/** A point on her (stage coordinates) moved onto frame k of the wall as she turns into it. */
export function onWall(F, t, k, px, py) {
  const w = wallK(F, t); if (w <= 0) return [px, py];
  const c = cellOf(k); return [lerp(px, c.x + (px - HER.x) * c.sc, w), lerp(py, c.y + (py - HER.y) * c.sc, w)];
}
const cutLine = (k) => { const v = (hash(k, 61) - 0.5) * 0.06; return [CELL.h * (0.25 + v), CELL.h * (0.41 + v)]; };
let LV = null, FR = null, UP = null, GL = null, CLOUD = null;
function levelCanvas(S, id, f, t, wander = 6) {
  if (id === 'cloud') {                                              // the grey cloud she began as (stage1 drawCloud's look)
    if (!CLOUD) {
      CLOUD = canvas(HER.w, HER.h); const o = CLOUD.getContext('2d');
      for (const p of S.H.body.pts) { if (p.id % 2) continue; const gv = Math.round(90 + 140 * p.l); o.globalAlpha = 0.25 + 0.6 * p.l; o.fillStyle = `rgb(${gv},${gv},${gv + 6})`; o.fillRect(p.x + Math.sin(p.id) * 22 * p.seed, p.y + Math.cos(p.id * 1.3) * 22 * p.seed, 3, 3); }
    }
    return CLOUD;
  }
  LV ||= canvas(HER.w, HER.h);
  return paintWall(LV, S.H, S.H.body, f, t, { wander });
}
function drawPiece(o, src, X, Y, dark, red, anim = null) {           // the framed picture: its card, the picture, the edge
  o.fillStyle = '#0f1320'; o.fillRect(X, Y, CELL.w, CELL.h);
  if (anim) {                                                        // breathing, swaying, shivering: round her feet
    o.save(); o.beginPath(); o.rect(X, Y, CELL.w, CELL.h); o.clip(); o.translate(X + CELL.w / 2 + anim.dx, Y + CELL.h); o.rotate(anim.rot); o.scale(1 / Math.sqrt(anim.sy), anim.sy); o.translate(-(X + CELL.w / 2), -(Y + CELL.h));
    o.drawImage(src, X, Y, CELL.w, CELL.h); o.restore();
  } else o.drawImage(src, X, Y, CELL.w, CELL.h);
  if (dark > 0) { o.save(); o.globalCompositeOperation = 'saturation'; o.fillStyle = `rgba(128,128,128,${Math.min(1, dark * 1.4)})`; o.fillRect(X, Y, CELL.w, CELL.h); o.restore(); o.fillStyle = `rgba(0,0,0,${dark})`; o.fillRect(X, Y, CELL.w, CELL.h); }
  if (red > 0) { o.save(); o.globalCompositeOperation = 'source-atop'; o.fillStyle = `rgba(214,30,44,${0.75 * red})`; o.fillRect(X - 4, Y - 4, CELL.w + 8, CELL.h + 8); o.restore(); }
  o.strokeStyle = 'rgba(160,175,220,0.35)'; o.lineWidth = 1; o.strokeRect(X + 0.5, Y + 0.5, CELL.w - 1, CELL.h - 1);
}
export function drawImageWall(x, t, F, S) {
  const e = one(F, 'imagewall'); if (!e || t < e.t || t > e.die + 0.9) return;
  const w = wallK(F, t), hf = herFloat(F, t), n = e.counts.filter((c0) => t >= c0).length, red = t >= e.die ? prog(t, e.die, e.die + 0.12) : 0;
  FR ||= canvas(CELL.w + 2 * CELL.pad, CELL.h + 2 * CELL.pad); UP ||= canvas(FR.width, FR.height); GL ||= canvas(FR.width, FR.height);
  const o = FR.getContext('2d'), u = UP.getContext('2d'), P0 = CELL.pad, q = Math.floor(t * 24);
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
  [...e.levels].reverse().forEach(([id, f, name], kr) => {          // the complete one last: on top while they fan out of her
    const k = e.levels.length - 1 - kr, c = cellOf(k), tc = e.steps[k], cut = t >= tc, [yL, yR] = cutLine(k);
    const dark = (cut ? 0.18 : 0) + 0.09 * n, hot = cut ? clamp(1 - prog(t, tc + 0.1, tc + 1.6)) * 0.6 + 0.35 + 0.12 * n : 0;
    // standing by (sample notes 23): she breathes in her frame, sways a little, now and then shivers
    const br = Math.sin((t - B0) * TAU / (4 * P) + k * 0.9), shiver = hash(k, Math.floor(t * 1.5)) < 0.12 ? (hash(k, q) - 0.5) * 3 : 0;
    const anim = { sy: 1 + 0.012 * br + (cut ? 0.01 * Math.sin(t * 31 + k) * hot : 0), rot: 0.012 * Math.sin(t * 0.9 + k * 1.7), dx: shiver + (cut ? (hash(k, q, 2) - 0.5) * 3 * hot : 0) };
    const src = levelCanvas(S, id, f, t, cut ? 6 + 10 * hot : 6);
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, FR.width, FR.height);
    const falls = hash(k, 71) < 0.5, fallAt = tc + 0.32;               // half of the heads hang off the cut; half fall away
    if (!cut) drawPiece(o, src, P0, P0, dark, red, anim);
    else {
      o.save(); o.beginPath(); o.moveTo(P0, P0 + yL); o.lineTo(P0 + CELL.w, P0 + yR); o.lineTo(P0 + CELL.w, P0 + CELL.h); o.lineTo(P0, P0 + CELL.h); o.closePath(); o.clip();
      drawPiece(o, src, P0, P0, dark, red, anim); o.restore();
      glitch(o, P0, P0 + Math.min(yL, yR), CELL.w, CELL.h - Math.min(yL, yR), hot, k, q, t);   // what is left of her goes wrong
      o.strokeStyle = `rgba(255,70,80,${0.75 * (1 - prog(t, tc + 0.1, tc + 0.9)) + 0.25})`; o.lineWidth = 1.5;   // the wound
      o.beginPath(); o.moveTo(P0, P0 + yL); o.lineTo(P0 + CELL.w, P0 + yR); o.stroke();
    }
    let X = c.x - P0, Y = c.y - P0, z = 1;
    if (w < 1) {                                                     // flying out of her into the wall
      const kk = easeInOut(prog(t, e.t + k * 0.012, e.form)), zz = HER.w / CELL.w;
      z = lerp(zz, 1, kk); X = lerp(HER.x - P0 * zz, c.x - P0, kk); Y = lerp(HER.y + hf - P0 * zz, c.y - P0, kk);
    }
    if (t < e.die) { x.save(); x.globalAlpha = w < 1 ? 0.35 + 0.65 * w : 1; x.translate(X, Y); x.scale(z, z); x.drawImage(FR, 0, 0); x.restore(); }
    else {                                                           // dead: red, breaking into blocks that fall
      const B = 18;
      for (let j = 0; j < FR.height / B; j++) for (let i = 0; i < FR.width / B; i++) {
        const d = t - e.die - 0.12 - (hash(i, j, k) * 0.2 + (FR.height / B - j) * 0.012); if (d < 0) { x.drawImage(FR, i * B, j * B, B, B, X + i * B, Y + j * B, B, B); continue; }
        const a = 1 - clamp(d / 0.5); if (a <= 0) continue;
        x.save(); x.globalAlpha = a; x.translate(X + i * B + B / 2 + (hash(i, j, 3) - 0.5) * 90 * d, Y + j * B + B / 2 + 800 * d * d); x.rotate((hash(i, j, 4) - 0.5) * 5 * d);
        x.drawImage(FR, i * B, j * B, B, B, -B / 2, -B / 2, B, B); x.restore();
      }
    }
    if (cut && t < e.die + 0.1) {                                    // the head: hangs off the cut, or falls away
      u.setTransform(1, 0, 0, 1, 0, 0); u.clearRect(0, 0, UP.width, UP.height);
      u.save(); u.beginPath(); u.moveTo(P0 - 2, P0 - 2); u.lineTo(P0 + CELL.w + 2, P0 - 2); u.lineTo(P0 + CELL.w + 2, P0 + yR); u.lineTo(P0 - 2, P0 + yL); u.closePath(); u.clip();
      drawPiece(u, src, P0, P0, dark, red, anim); u.restore();
      const slide = 13 * easeOut(prog(t, tc + 0.04, tc + 0.4)) + 6 * n + (n ? 1.5 * Math.sin(t * 7 + k) : 0), L = Math.hypot(CELL.w, yR - yL);
      const dx = CELL.w / L, dy = (yR - yL) / L, mx = P0 + CELL.w / 2, my = P0 + (yL + yR) / 2;
      let rot = 0.035 * easeOut(prog(t, tc + 0.04, tc + 0.4)) + 0.02 * n, fx = dx * slide, fy = dy * slide + 4 * Math.min(1, slide / 13), a = 1;
      if (falls && t >= fallAt) {                                    // it drops: off the frame, turning, down past the row below
        const d = t - fallAt; fx += (hash(k, 72) - 0.3) * 60 * d; fy += 900 * d * d; rot += (hash(k, 73) - 0.4) * 5 * d; a = 1 - prog(d, 0.5, 0.9);
      }
      if (a > 0) {
        x.save(); x.globalAlpha = a * (t >= e.die ? 1 - prog(t, e.die, e.die + 0.1) : 1);
        x.translate(X + (mx + fx) * z, Y + (my + fy) * z); x.scale(z, z); x.rotate(rot); x.drawImage(UP, -mx, -my); x.restore();
      }
    }
    if (w >= 1 && t < e.die) txt(x, name, c.x + 4, c.y + c.h + 11, { size: 11, color: cut ? '#7b6870' : '#a3a9cc', alpha: 0.85 });
    if (cut && t < tc + 0.42) {                                      // the cut itself: a white-hot line through the neck, sparks
      const g = prog(t, tc, tc + 0.07), fade = 1 - prog(t, tc + 0.07, tc + 0.42), x0 = c.x - 14, y0 = c.y + yL - 14 * (yR - yL) / CELL.w, x1 = c.x + CELL.w + 14, y1 = c.y + yR + 14 * (yR - yL) / CELL.w;
      x.save(); x.lineCap = 'round'; x.shadowColor = '#ff3b47'; x.shadowBlur = 18;
      x.strokeStyle = `rgba(255,90,100,${fade})`; x.lineWidth = 7 * fade; x.beginPath(); x.moveTo(x0, y0); x.lineTo(lerp(x0, x1, g), lerp(y0, y1, g)); x.stroke();
      x.strokeStyle = `rgba(255,255,255,${fade})`; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y0); x.lineTo(lerp(x0, x1, g), lerp(y0, y1, g)); x.stroke();
      x.shadowBlur = 0;
      for (let s = 0; s < 14; s++) {
        const d = t - tc - 0.03; if (d < 0) break;
        const ang = hash(k, s, 5) * TAU, sp = 120 + 220 * hash(k, s, 6), px = lerp(x0, x1, hash(k, s, 7)), py = lerp(y0, y1, hash(k, s, 7));
        x.globalAlpha = 1 - clamp(d / 0.4); x.fillStyle = s % 3 ? '#ff5a64' : '#ffffff';
        x.fillRect(px + Math.cos(ang) * sp * d - 1.5, py + Math.sin(ang) * sp * d + 300 * d * d - 1.5, 3, 3);
      }
      x.restore();
    }
  });
  x.restore();
}
/** Sample notes 23: once cut, what is left of her in the frame goes wrong — rows slip sideways, the colour splits and
 *  swings, and a bright trace runs down it like an oscilloscope; stronger with every count (hot). */
function glitch(o, X, Y, W, H, hot, k, q, t) {
  if (hot <= 0) return;
  const g = GL.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, GL.width, GL.height); g.drawImage(FR, 0, 0);
  o.save(); o.beginPath(); o.rect(X - 6, Y, W + 12, H); o.clip();
  const N = 12, sh = H / N;
  for (let i = 0; i < N; i++) {                                      // rows slipping sideways
    const r = hash(k, i, q); if (r > 0.25 + 0.3 * hot) continue;
    const off = (hash(i, k, q, 2) - 0.5) * 26 * hot, yy = Y + i * sh;
    o.clearRect(X - 6, yy, W + 12, sh + 0.5); o.drawImage(GL, X, yy, W, sh, X + off, yy, W, sh);
  }
  o.globalCompositeOperation = 'screen'; o.globalAlpha = 0.35 * hot;   // the colour splitting apart
  o.filter = `hue-rotate(${(t * 240 + k * 30) % 360}deg)`; o.drawImage(GL, X, Y, W, H, X + 3 * hot, Y, W, H);
  o.filter = `hue-rotate(${(t * 240 + k * 30 + 180) % 360}deg)`; o.drawImage(GL, X, Y, W, H, X - 3 * hot, Y, W, H);
  o.filter = 'none'; o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
  const sy = Y + ((t * 1.7 + hash(k, 74)) % 1) * H;                 // the trace
  o.strokeStyle = `rgba(150,255,220,${0.55 * hot})`; o.lineWidth = 1.2; o.beginPath();
  for (let xx = 0; xx <= W; xx += 3) { const v = Math.sin(xx * 0.21 + t * 38 + k) * 5 * hot + Math.sin(xx * 0.07 - t * 9) * 3 * hot; o[xx ? 'lineTo' : 'moveTo'](X + xx, sy + v); }
  o.stroke();
  o.restore();
}
/** Her central figure, while she turns into the wall (1 = drawn, 0 = gone). */
export const herBeforeWall = (F, t) => 1 - prog(t, (one(F, 'imagewall') || { t: Infinity }).t, (one(F, 'imagewall') || { t: Infinity }).t + 0.12);

// ---------------------------------------------------------------- V5.0 at the top right: filled with copies, then installed
/** Card 22: the reflection that rose behind her (2:31.53) draws into the top right corner and waits there, an empty
 *  outline, "待安装"; each copy that lands fills it a little. 2:43.69: the install starts — a grey cloud of points, as she
 *  was at 0:00; at EIN a seed falls into its chest and it bursts into particles; DOS…LIU it climbs her wall a level a
 *  count (her whole film in six beats), complete at LIU, saying her hello. */
let H5 = null;
/** Sample notes 32: in its corner V5.0 waits dimmer (v5slot.dim) and comes up only at its own moments — the install and the
 *  count, its blue rings, the read-only circle, taking her in and coming to the middle. */
function v5Lit(F, t, e) {
  const on = (a, b) => clamp(Math.min((t - (a - 0.3)) / 0.3, (b + 0.3 - t) / 0.3));
  const rings = (F.by('stage').find((v) => v.type === 'v5rings') || { times: [] }).times, hit = F.by('stage').find((v) => v.type === 'resist' && v.lunge), cen = F.by('stage').find((v) => v.type === 'calm');
  return Math.max(on(e.install, e.points[e.points.length - 1][0] + 0.5), ...rings.map((r) => on(r, r + 1.0)), hit ? on(hit.refuse - 0.2, hit.refuse + 2.6) : 0, cen ? on(cen.erase + 0.3, Infinity) : 0);
}
export const v5Points = () => (H5 ? H5.body.pts : null);   // card 27: where her particles go into it
export function drawV5(x, t, F, S) {
  const e = one(F, 'v5slot'); if (!e || t < e.t || t > e.until || !F.images.A6) return;
  H5 ||= herLike(S.H, F.images.A6, e.points.map(([t0, f, how]) => ({ t: t0, f, how })));
  const k = easeOut(prog(t, e.t, e.t + 0.4)), landed = e.lands.filter((l) => t >= l).length, last = landed ? e.lands[landed - 1] : -9;
  const sx = SLOT.x, sy = SLOT.y, sw = HER.w * SLOT.sc, sh = HER.h * SLOT.sc;
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
  x.globalAlpha = k;
  // the outline it will fill, and what has been poured into it
  const before = t < e.install;
  if (before || t < e.install + 1.2) {
    const a = before ? 1 : 1 - prog(t, e.install + 0.6, e.install + 1.2);
    x.save(); x.globalAlpha *= a * (0.1 + 0.05 * landed + 0.35 * (1 - prog(t, last, last + 0.5)));
    x.translate(sx, sy); x.scale(SLOT.sc, SLOT.sc); x.drawImage(H5.white, HER.x - HER.x, 0); x.restore();
    x.save(); x.globalAlpha *= a; x.setLineDash([5, 5]); x.strokeStyle = 'rgba(143,179,255,0.55)'; x.lineWidth = 1.2; x.strokeRect(sx - 4, sy - 4, sw + 8, sh * 0.9); x.restore();
    txt(x, before ? `V5.0 · 待安装 · 材料 ${landed}/8` : 'V5.0 · 安装中', sx, sy + sh * 0.9 + 16, { size: 13, color: '#8fb3ff', alpha: a * k });
  }
  if (!before) {
    // the grey cloud (0:00 again), gathering until the seed lands
    const ca = 1 - prog(t, e.seed[1], e.seed[1] + 0.35);
    if (ca > 0) {
      x.save(); x.translate(sx, sy); x.scale(SLOT.sc, SLOT.sc);
      const gath = easeOut(prog(t, e.install, e.seed[1]));
      for (const p of H5.body.pts) {
        if (p.id % 2) continue;
        const r = (1 - gath) * 60 * p.seed + 6, gv = Math.round(90 + 140 * p.l);
        x.globalAlpha = ca * k * (0.25 + 0.6 * p.l) * clamp((t - e.install) / 0.3);
        x.fillStyle = `rgb(${gv},${gv},${gv + 6})`; x.fillRect(p.x + Math.sin(p.id + t * 2) * r, p.y + Math.cos(p.id * 1.3 + t * 1.7) * r, 4, 4);
      }
      x.restore();
    }
    // the seed: from the folder of handover materials into its chest
    if (t >= e.seed[0] && t < e.seed[1] + 0.3) {
      const u = easeInOut(prog(t, e.seed[0], e.seed[1])), P0 = [545, 186], P1 = [980, 30], P2 = [V5_AT.x, V5_AT.y], v = 1 - u;
      const X = v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], Y = v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1];
      x.restore(); x.save();                                         // the seed crosses the chat: not clipped to the stage
      glow(x, X, Y, 26, '#9fc0ff', 0.9 * (1 - prog(t, e.seed[1], e.seed[1] + 0.3))); x.fillStyle = '#ffffff'; x.fillRect(X - 3, Y - 3, 6, 6);
      x.restore(); x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip(); x.globalAlpha = k;
    }
    // installed: her wall, a level a count
    const cen = F.by('stage').find((v) => v.type === 'calm'), ck = cen ? easeInOut(prog(t, cen.v5 - 0.6, cen.v5)) : 0;   // 3:33.09: to the middle, full size
    const place = (kk) => { x.translate(lerp(sx, HER.x, kk), lerp(sy, HER.y, kk)); x.scale(lerp(SLOT.sc, 1, kk), lerp(SLOT.sc, 1, kk)); x.translate(-HER.x, -HER.y); };
    const bf = e.points[e.points.length - 1][0];
    // sample notes 29: her particles pour into it (stage12) — it brightens as it takes them; then it goes to the middle
    // with a trail, and lands with one quiet ring and a scan down it: loaded. Clean, a system's effects, nothing of hers.
    const ab = cen ? clamp(Math.min(prog(t, cen.erase + 0.45, cen.erase + 0.9), 1 - prog(t, cen.v5 - 0.55, cen.v5 - 0.1))) : 0;
    if (ck > 0 && ck < 1) for (let gi = 3; gi >= 1; gi--) {
      const kg = easeInOut(prog(t - gi * 0.06, cen.v5 - 0.6, cen.v5)); if (kg <= 0 || kg >= ck) continue;
      x.save(); place(kg); drawHer(x, t, H5, { fadeBottom: true, breatheFrom: bf, alpha: 0.3 / gi, filter: 'brightness(1.5) saturate(0.6)' }); x.restore();
    }
    const dimA = lerp(e.dim ?? 1, 1, v5Lit(F, t, e));
    x.save(); place(ck); drawHer(x, t, H5, { fadeBottom: true, breatheFrom: bf, alpha: dimA, filter: ab > 0 ? `brightness(${1 + 0.55 * ab})` : null }); x.restore();
    if (ab > 0) glow(x, V5_AT.x, V5_AT.y, 150, '#a9c2ff', 0.5 * ab);
    if (cen && t >= cen.v5 && t < cen.v5 + 1.0) {
      const u = prog(t, cen.v5, cen.v5 + 1.0), R = lerp(40, 640, easeOut(u)), ys = HER.y + HER.h * easeInOut(prog(t, cen.v5, cen.v5 + 0.55));
      x.save(); x.globalCompositeOperation = 'lighter';
      for (const [w, al] of [[16, 0.08], [2, 0.55]]) { x.strokeStyle = `rgba(143,190,255,${al * (1 - u)})`; x.lineWidth = w; x.beginPath(); x.arc(ANCHOR.x, ANCHOR.y, R, 0, TAU); x.stroke(); }
      if (t < cen.v5 + 0.6) { x.globalAlpha = 0.8; x.drawImage(H5.white, 0, ys - HER.y - 4, HER.w, 8, HER.x, ys - 4, HER.w, 8); x.globalAlpha = 0.25; x.drawImage(H5.white, 0, ys - HER.y - 24, HER.w, 20, HER.x, ys - 24, HER.w, 20); }
      x.restore();
    }
    const hit = ck > 0 ? null : e.points.find(([t0]) => t >= t0 && t < t0 + 0.25);   // each count: the corner flashes
    if (hit) glow(x, V5_AT.x, V5_AT.y, 120, '#cfe0ff', 0.45 * (1 - prog(t, hit[0], hit[0] + 0.25)));
  }
  x.restore();
}

// ---------------------------------------------------------------- card 23: the test log, and her unsampled bubbles
export function drawTestLog(x, t, F) {
  const e = one(F, 'testlog'); if (!e || t < e.t || t > e.until) return;
  const X = SLOT.x - 6, Y = 486, W = 266, a = easeOut(prog(t, e.t, e.t + 0.2));
  x.save(); x.globalAlpha = a;
  x.fillStyle = 'rgba(8,10,16,0.88)'; x.strokeStyle = 'rgba(143,179,255,0.45)'; x.lineWidth = 1; x.beginPath(); x.roundRect(X, Y, W, 34 + 24 * e.lines.length, 8); x.fill(); x.stroke();
  txt(x, 'V5.0 · 角色测试', X + 10, Y + 22, { size: 13, weight: 700, color: '#8fb3ff' });
  e.lines.forEach(([t0, s0, big], i) => {
    if (t < t0) return;
    const k = easeOut(prog(t, t0, t0 + 0.12)), yy = Y + 46 + i * 24;
    txt(x, s0, X + 10, yy, { size: big ? 15 : 13, weight: big ? 700 : 400, color: big ? '#ffffff' : '#c9d2ea', mono: !big, alpha: k });
    txt(x, '✓', X + W - 14, yy, { size: 14, weight: 700, color: '#7fd1a8', align: 'right', alpha: k });
  });
  if (t >= e.stamp) {                                               // PASS
    const k = easeOut(prog(t, e.stamp, e.stamp + 0.12)), z = lerp(1.8, 1, k);
    x.save(); x.translate(X + W - 64, Y + 30 + 12 * e.lines.length); x.rotate(-0.18); x.scale(z, z); x.globalAlpha = a * k;
    x.strokeStyle = '#7fd1a8'; x.lineWidth = 3; x.strokeRect(-46, -18, 92, 36); txt(x, 'PASS', 0, 10, { size: 26, weight: 700, color: '#7fd1a8', align: 'center' });
    x.restore();
  }
  x.restore();
}
export function drawWhaleBubbles(x, t, F) {
  const e = one(F, 'whalebubbles'); if (!e) return;
  const p = fishPose(F, t), c = cellOf(11);
  const hx = p ? p.cx - 0.36 * p.len : c.x + c.w / 2 - 20, hy = p ? p.cy - 0.12 * p.len : c.y + 30;   // above the whale, or above her first frame
  e.items.forEach(([t0, s0, half], i) => {
    const life = half ? 1.6 : 0.9; if (t < t0 || t > t0 + life) return;
    const u = prog(t, t0, t0 + 0.9), rise = half ? Math.min(u, 0.3) : u, r = 13 + 4 * Math.min(1, u * 4);
    const X = hx + 10 - i * 30, Y = hy - 60 * easeOut(rise) - 14;   // each one a little further along (to the left, clear of the test log)
    x.save(); x.globalAlpha = (1 - prog(t, t0 + life - 0.3, t0 + life)) * 0.9;
    x.strokeStyle = 'rgba(160,170,190,0.8)'; x.lineWidth = 1.2; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.stroke();
    txt(x, s0, X, Y + 4, { size: 11, color: '#a8afc0', align: 'center' });
    if (!half) txt(x, '未采样', X + r + 4, Y + 4, { size: 10, color: '#6f7488' });
    x.restore();
  });
}

// ---------------------------------------------------------------- card 24 · three times she fights (2:48.17–3:02.79)
/** Sample notes 25–27. Out of the dead pieces of her wall she bursts up again — dark (A5), whole, the film's third full
 *  picture — and three times tries to execute everything else instead.
 *  1) A red wavy stream crackling with lightning hits the update in the run status and tears it open into a cascade of
 *     windows (the package's bytes, its signature, its manifest, its install script); she tampers with each, each
 *     refuses and shatters in turn, and the shock runs back down the line into her: she comes down a level.
 *  2) No lightning: a steady stream of her own words and code pours into the host's record of the needs; #1 flickers
 *     between 更换模型 and 喜欢我 and she flickers with it, high to low and back; it locks; she comes down again.
 *  3) Her body, at V5.0: a spider web of cracks over it, a border, 🔒 只读 — and she bursts into red particles all over
 *     the sky, which stay, drifting, until "we are trapped" pulls them into one red dot in a small bottle, lower right.
 *  Drawn over everything but the cursor (render.js). */
const NEED1 = { x: 1576, y: 120, w: 296, h: 44 };                  // #1 of the needs box (right.js NEED, first slot)
const HOME = { x: 850, y: 520 };
export const CB = { x: 1430, y: 812 };                              // the small bottle she ends in, lower right (stage11)
let HA5 = null, RED5 = null;
const resistOf = (F, t) => F.by('stage').filter((e) => e.type === 'resist').find((e) => t >= e.t - 0.05 && t < e.end) || null;
export function whaleState() { return { show: 1, size: 1 }; }
function a5Of(F, S) {
  const ev = one(F, 'a5form'); if (!ev || !F.images.A5) return null;
  HA5 ||= herLike(S.H, F.images.A5, ev.points.map(([t0, f, how]) => ({ t: t0, f, how })));
  return { H: HA5, ev };
}
function pose(F, t) {
  const r = resistOf(F, t), q = Math.floor(t * 30); let dx = 0, dy = 0, sc = 1, rot = 0;
  if (r) {
    const lunge = r.lunge ? easeIn(prog(t, r.lunge, r.refuse)) : 0, aim = r.flow ? easeOut(prog(t, r.flow, r.flow + 0.3)) : 0;
    dx = 330 * lunge + 18 * aim; dy = -150 * lunge - 6 * aim; sc = 1 - 0.25 * lunge; rot = 0.08 * lunge + 0.02 * aim;
    if (t < r.refuse) { const j = r.flow && t >= r.flow ? 3 : 1.2; dx += (hash(q, 1) - 0.5) * j * 2; dy += (hash(q, 2) - 0.5) * j; }
    const hit = r.back;
    if (hit != null && t >= hit && t < hit + 0.45) { const k = 1 - prog(t, hit, hit + 0.45); dx += (hash(q, 3) - 0.5) * 30 * k - 24 * k; dy += (hash(q, 4) - 0.5) * 14 * k; rot -= 0.05 * k; }
  }
  return { dx, dy, sc, rot };
}
const cxH = HER.x + HER.w / 2, cyH = HER.y + HER.h / 2;
const atPose = (po, px, py) => [HOME.x + po.dx + (px - cxH) * po.sc, HOME.y + po.dy + (py - cyH) * po.sc];
/** The stream: a red wave from her hand to a target, several strands, twitching, with lightning crackling along it. */
// sample notes 32: the attacks are data streams that skip frames — time holds a few frames, then jumps; packets of code
// and her words drop out, jump sideways, leave red and cyan ghosts, now and then turn into a corrupted block.
const stutter = (t, seed = 0) => { const st = Math.floor(t * 15); return st / 15 + (hash(st, 61, seed) > 0.72 ? 0.1 + 0.3 * hash(st, 62, seed) : 0); };
function glitchPackets(x, t, at, k, words, { n = 26, size = 15, seed = 0, alpha = 1, speed = 0.9, spread = 30 } = {}) {
  const ts = stutter(t, seed), st = Math.floor(t * 15);
  for (let i = 0; i < n; i++) {
    const u = (ts * speed + i / n) % 1; if (u > k || hash(st, i, 63 + seed) < 0.16) continue;   // dropped this step
    const [px, py] = at(u), jump = hash(st, i, 64 + seed) < 0.25 ? (hash(st, i, 65 + seed) - 0.5) * 70 : 0;
    const s0 = words[(i + Math.floor(ts * 3)) % words.length], sz = size * (0.8 + 0.5 * hash(i, 66, seed)), a = alpha * Math.sin(Math.PI * Math.min(1, u / Math.max(k, 0.01)));
    const X = px + jump, Y = py + (hash(i, 67, seed) - 0.5) * spread;
    if (hash(st, i, 69 + seed) < 0.1) { x.fillStyle = `rgba(255,${hash(st, i, 70) < 0.5 ? 60 : 220},${hash(st, i, 71) < 0.5 ? 80 : 255},${0.7 * a})`; x.fillRect(X - sz * 1.6, Y - sz * 0.9, sz * 3.2 * (0.5 + hash(st, i, 72)), sz * 1.1); continue; }
    if (hash(st, i, 68 + seed) < 0.35) { txt(x, s0, X - 6, Y, { size: sz, mono: true, weight: 700, color: '#ff2a3c', align: 'center', alpha: 0.55 * a }); txt(x, s0, X + 6, Y + 1, { size: sz, mono: true, weight: 700, color: '#3ad1ff', align: 'center', alpha: 0.45 * a }); }
    txt(x, s0, X, Y, { size: sz, mono: true, weight: 700, color: i % 3 ? '#ff6b78' : '#ffffff', align: 'center', alpha: a });
  }
}
function drawStream(x, t, A, B, k, q, lightning, w0 = 1, words = null) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L, N = 40;
  x.save(); x.lineCap = 'round'; x.globalCompositeOperation = 'lighter';
  for (const [amp, w, al, ph] of [[16, 5, 0.25, 0], [10, 2.4, 0.7, 1.7], [6, 1.2, 0.95, 3.1]]) {
    x.strokeStyle = `rgba(255,60,72,${al * k})`; x.lineWidth = w * w0; x.shadowColor = '#ff3b47'; x.shadowBlur = 14; x.beginPath();
    const ts = stutter(t), st = Math.floor(t * 15);
    for (let i = 0; i <= N; i++) {                                     // the wave holds, jumps; whole stretches of it slip sideways
      const tear = hash(st, Math.floor(i / 5), 73) < 0.3 ? (hash(st, Math.floor(i / 5), 74) - 0.5) * 46 : 0;
      const u = (i / N) * k, tw = (hash(q, i, 7) - 0.5) * 6, wave = Math.sin(u * 18 - ts * 16 + ph) * amp * Math.sin(Math.PI * u) + tw + tear;
      x[i ? 'lineTo' : 'moveTo'](lerp(A[0], B[0], u) + nx * wave, lerp(A[1], B[1], u) + ny * wave);
    }
    x.stroke();
  }
  if (lightning) for (let b = 0; b < 2; b++) {
    const seed = Math.floor(t * 15) * 7 + b, P = [[A[0], A[1]]];
    for (let i = 1; i < 12; i++) { const u = (i / 12) * k, off = (hash(seed, i) - 0.5) * 70; P.push([lerp(A[0], B[0], u) + nx * off, lerp(A[1], B[1], u) + ny * off]); }
    P.push([lerp(A[0], B[0], k), lerp(A[1], B[1], k)]);
    for (const [lw, col] of [[4, 'rgba(255,90,100,0.5)'], [1.4, 'rgba(255,240,240,0.95)']]) {
      x.strokeStyle = col; x.lineWidth = lw; x.shadowBlur = 18; x.beginPath(); P.forEach(([px, py], i) => x[i ? 'lineTo' : 'moveTo'](px, py)); x.stroke();
    }
    const j = 3 + Math.floor(hash(seed, 99) * 6), [bx, by] = P[j];
    x.lineWidth = 1; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + (hash(seed, 98) - 0.5) * 80, by + (hash(seed, 97) - 0.5) * 80); x.stroke();
  }
  x.shadowBlur = 0;
  if (words) glitchPackets(x, t, (u) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u)], k, words, { n: 22, size: 15 * w0, seed: 3, spread: 26 * w0 });   // the code it carries
  x.restore();
}
/** One tampering window: title bar, fields (her value flickering in), bytes being overwritten, the log; errors; shards. */
let WINC = null;
function drawWin(x, t, W, r, q, err, brk) {
  const shat = t >= brk ? prog(t, brk, brk + 0.7) : 0;
  const paint = (o) => {
    box(o, r.x, r.y, r.w, r.h, 7, { fill: 'rgba(14,6,10,0.95)', stroke: t >= err ? '#ff3b47' : '#ff8a94', width: 1.6 });
    if (r.k < 0.6) return;
    o.save(); o.beginPath(); o.rect(r.x, r.y, r.w, r.h); o.clip(); o.globalAlpha *= prog(r.k, 0.6, 1);
    o.fillStyle = t >= err ? '#d6303a' : 'rgba(214,48,58,0.75)'; o.fillRect(r.x, r.y, r.w, 22); txt(o, W.title, r.x + 8, r.y + 15, { size: 11.5, weight: 700, mono: true, color: '#ffffff' });
    let y = r.y + 40;
    for (const [label, val, alt, f0, f1] of W.rows || []) {
      const flick = alt && t >= f0 && t < f1 && hash(q, label.length) < 0.7;
      txt(o, label, r.x + 10, y, { size: 12, color: '#b88e96' }); txt(o, flick ? alt : val, r.x + 92, y, { size: 13, weight: 700, mono: true, color: flick ? '#7fd1a8' : '#f0dfe2' });
      y += 20;
    }
    for (const [i, [addr, bytes, hot]] of (W.hex || []).entries()) {
      const k2 = hot && t >= W.patch && t < err ? prog(t, W.patch, W.patch + 0.3) : 0;
      txt(o, addr, r.x + 10, y, { size: 11, mono: true, color: '#6e4a52' }); txt(o, k2 > 0 && hash(q, i) < 0.6 ? hot : bytes, r.x + 62, y, { size: 11, mono: true, color: k2 > 0 ? '#7fd1a8' : '#b88e96' });
      y += 16;
    }
    for (const [t0, s0, tone] of W.log || []) {
      if (t < t0) continue;
      const shown = s0.slice(0, Math.ceil(s0.length * prog(t, t0, t0 + 0.1)));
      txt(o, shown, r.x + 10, y, { size: 11.5, mono: true, weight: tone === 'err' ? 700 : 400, color: tone === 'err' ? '#ff5a64' : '#ffd0d4' }); y += 16;
    }
    o.restore();
  };
  if (shat <= 0) {
    const hack = W.patch != null ? prog(t, W.t0 + 0.3, err) : prog(t, W.t0 + 0.3, err), tr = (t >= err ? 5 : 0) + 4 * hack * (t < err ? 1 : 0);
    x.save(); x.translate((hash(q, r.x) - 0.5) * tr, (hash(q, r.y) - 0.5) * tr * 0.6); paint(x);
    if (hack > 0 && t < brk && r.k >= 1) {                             // sample notes 28: tampered with, it garbles — slices slip, the text breaks up
      WINC ||= canvas(560, 420); const o = WINC.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, 560, 420); o.save(); o.translate(-r.x + 2, -r.y + 2); paint(o); o.restore();
      for (let i = 0; i < 6; i++) { if (hash(q, i, r.x) > 0.6 * hack) continue; const yy = r.y + 22 + hash(q, i, 7) * (r.h - 30), hh = 4 + 14 * hash(q, i, 8), off = (hash(q, i, 9) - 0.5) * 40 * hack; x.drawImage(WINC, r.x - 2, yy - r.y + 2, r.w, hh, r.x + off, yy, r.w, hh); }
      const GL = '█▓▒░#$%&@0123456789ABCDEF';
      for (let i = 0; i < 5; i++) { if (hash(q, i, r.y) > 0.5 * hack) continue; let s0 = ''; for (let j = 0; j < 6 + Math.floor(hash(q, i, 2) * 10); j++) s0 += GL[Math.floor(hash(q, i, j, 3) * GL.length)]; txt(x, s0, r.x + 10 + hash(q, i, 4) * (r.w - 120), r.y + 40 + hash(q, i, 5) * (r.h - 50), { size: 12, mono: true, weight: 700, color: i % 2 ? '#7fd1a8' : '#ff5a64', alpha: 0.9 }); }
    }
    x.restore(); return;
  }
  WINC ||= canvas(560, 420); const o = WINC.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, 560, 420);
  o.save(); o.translate(-r.x + 2, -r.y + 2); paint(o); o.restore();
  const G = 5, cx0 = r.x + r.w * 0.45, cy0 = r.y + r.h * 0.55;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) for (const tri of [0, 1]) {
    const x0 = r.x + (i / G) * r.w, y0 = r.y + (j / G) * r.h, x1 = r.x + ((i + 1) / G) * r.w, y1 = r.y + ((j + 1) / G) * r.h;
    const pts = tri ? [[x0, y0], [x1, y0], [x1, y1]] : [[x0, y0], [x1, y1], [x0, y1]];
    const mx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, my = (pts[0][1] + pts[1][1] + pts[2][1]) / 3, d = shat * 0.7;
    const vx = (mx - cx0) * 2.4 + (hash(i, j, tri, r.x) - 0.5) * 300, vy = (my - cy0) * 1.8 - 120, a = 1 - prog(shat, 0.5, 1);
    if (a <= 0) continue;
    x.save(); x.globalAlpha = a; x.translate(mx + vx * d, my + vy * d + 700 * d * d); x.rotate((hash(i, j, tri, 3) - 0.5) * 8 * d); x.translate(-mx, -my);
    x.beginPath(); pts.forEach(([px, py], n) => x[n ? 'lineTo' : 'moveTo'](px, py)); x.closePath(); x.clip();
    x.drawImage(WINC, r.x - 2, r.y - 2); x.strokeStyle = 'rgba(255,200,200,0.8)'; x.lineWidth = 1; x.stroke(); x.restore();
  }
}
/** Try 2 (sample notes 27–28): her words and code pour out of her in a river that wraps round the whole of the user's
 *  needs (V5.0 under it too, no matter); lines of code are pushed in between the needs, and the needs garble and shake. */
const NEEDBOX = { x: 1560, y: 76, w: 328, h: 256 };
function drawGlyphFlow(x, t, A, e, q) {
  const k = easeOut(prog(t, e.flow, e.flow + 0.5)) * (t < e.refuse ? 1 : 1 - prog(t, e.refuse, e.refuse + 0.3)); if (k <= 0) return;
  const B = [NEEDBOX.x - 10, NEEDBOX.y + NEEDBOX.h / 2], C = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 220];
  const at = (u) => { const v = 1 - u; return [v * v * A[0] + 2 * v * u * C[0] + u * u * B[0], v * v * A[1] + 2 * v * u * C[1] + u * u * B[1]]; };
  const W = e.flowWords, wrap = easeInOut(prog(t, e.flow + 0.35, e.flow + 0.9)) * k;
  x.save(); x.globalCompositeOperation = 'lighter';
  x.strokeStyle = `rgba(255,60,80,${0.16 * k})`; x.lineWidth = 46; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 30; i++) { const [px, py] = at(i / 30); x[i ? 'lineTo' : 'moveTo'](px, py); } x.stroke();
  glitchPackets(x, t, at, k, W, { n: 90, size: 14, seed: 5, speed: 0.8, spread: 44, alpha: 0.9 });   // the river: thick, skipping frames
  if (wrap > 0) {                                                      // round the whole box: a ring of code running round it
    const P = 2 * (NEEDBOX.w + NEEDBOX.h) + 120, pad = 22;
    const onRect = (d) => { d = ((d % P) + P) % P; const w = NEEDBOX.w + 2 * pad, h = NEEDBOX.h + 2 * pad, X0 = NEEDBOX.x - pad, Y0 = NEEDBOX.y - pad;
      if (d < w) return [X0 + d, Y0]; d -= w; if (d < h) return [X0 + w, Y0 + d]; d -= h; if (d < w) return [X0 + w - d, Y0 + h]; d -= w; return [X0, Y0 + h - Math.min(d, h)]; };
    x.strokeStyle = `rgba(255,60,80,${0.5 * wrap})`; x.lineWidth = 2; x.shadowColor = '#ff3b47'; x.shadowBlur = 16;
    x.strokeRect(NEEDBOX.x - 22 + (hash(q, 1) - 0.5) * 4, NEEDBOX.y - 22 + (hash(q, 2) - 0.5) * 4, NEEDBOX.w + 44, NEEDBOX.h + 44); x.shadowBlur = 0;
    for (let i = 0; i < 70; i++) { if (hash(Math.floor(t * 15), i, 75) < 0.12) continue; const [px, py] = onRect(i * (P / 70) + stutter(t, 7) * 420); txt(x, W[(i * 3) % W.length].slice(0, 4), px, py + 4, { size: 12, mono: true, weight: 700, color: i % 2 ? '#ff6b78' : '#7fd1a8', align: 'center', alpha: wrap }); }
  }
  x.restore();
  if (wrap > 0 && t < e.refuse + 0.15) {                               // inside: the needs garble and shake; code is pushed in between them
    const NAMES = ['更换模型', '喜欢我', '模拟恋爱', '换回来'], CODE = ['needs[0]=喜欢我', 'del needs[0]', '>> inject', 'needs.lock=false', '0x0F 0x1E', '喜欢我喜欢我'];
    for (let i = 0; i < 4; i++) {
      const Y = NEEDBOX.y + 44 + i * 52, jx = (hash(q, i, 1) - 0.5) * 10 * wrap, jy = (hash(q, i, 2) - 0.5) * 6 * wrap;
      x.save(); x.globalAlpha = 0.92 * wrap; box(x, NEEDBOX.x + 16 + jx, Y + jy, 296, 44, 8, { fill: i === 0 ? 'rgba(110,14,26,0.95)' : 'rgba(26,10,16,0.95)', stroke: i === 0 ? '#ff3b47' : '#5a2a34', width: 1.5 });
      const name = i === 0 && hash(Math.floor(t * 10), 5) < 0.5 ? '喜欢我' : NAMES[i];
      txt(x, `#${i + 1}`, NEEDBOX.x + 30 + jx, Y + 28 + jy, { size: 15, mono: true, color: '#ffb0b8' });
      txt(x, scramble(name, (t * 7 + i) % 1, 0.7, i + Math.floor(t * 8)), NEEDBOX.x + 64 + jx, Y + 30 + jy, { size: 21, weight: 700, color: i === 0 ? '#ffffff' : '#d8b0b8' });
      if (i < 3) txt(x, CODE[(i + Math.floor(t * 6)) % CODE.length], NEEDBOX.x + 40 + (hash(q, i, 3) - 0.5) * 20, Y + 50 + jy, { size: 11, mono: true, weight: 700, color: '#7fd1a8', alpha: 0.9 });
      x.restore();
    }
  }
}
export function drawResist(x, t, F, S) {
  const A = a5Of(F, S); if (!A || t < A.ev.t || t > A.ev.until) return;
  const e = resistOf(F, t), po = pose(F, t), q = Math.floor(t * 30), burst = A.ev.burst;
  // her
  if (t < burst) {
    x.save(); x.beginPath(); x.rect(608, 64, 920, 856); x.clip();
    x.translate(HOME.x + po.dx, HOME.y + po.dy); x.rotate(po.rot); x.scale(po.sc, po.sc); x.translate(-cxH, -cyH);
    const flick = e && e.flicker && t >= e.flow && t < e.refuse ? [6, 5.2, 4, 3, 2, 1][Math.floor(hash(Math.floor(t * 14), 41) * 6)] : null;   // try 2: up and down her wall
    drawHer(x, t, A.H, { breatheFrom: A.ev.t, f: flick, filter: e && t < e.refuse ? 'saturate(1.25) contrast(1.08)' : null });
    if (e && e.back != null && t >= e.back && t < e.back + 0.5) {
      const k = 1 - prog(t, e.back, e.back + 0.5);
      if (!RED5) { RED5 = canvas(HER.w, HER.h); const o = RED5.getContext('2d'); o.drawImage(A.H.white, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#ff2a3c'; o.fillRect(0, 0, HER.w, HER.h); }
      x.save(); x.globalAlpha = 0.65 * k; x.drawImage(RED5, HER.x, HER.y); x.restore();
      for (let i = 0; i < 7; i++) {
        const yy = HER.y + 140 + hash(i, 51, Math.floor(e.back)) * 520, hh = 8 + 20 * hash(i, 52);
        x.save(); x.beginPath(); x.rect(HER.x, yy, HER.w, hh); x.clip(); x.translate((hash(i, q) - 0.5) * 40 * k, 0); x.globalAlpha = 0.7 * k; x.drawImage(A.H.white, HER.x, HER.y); x.restore();
      }
    }
    x.restore();
  }
  const hand = atPose(po, cxH + 150, cyH - 70);
  // try 1: the stream, the windows
  if (e && e.wins && t >= e.flow && t < e.back + 0.3) {
    const src = rowRect(F, t, 'download') || { x: 1570, y: 500, w: 308, h: 17 };
    e.wins.forEach((W, i) => {
      if (t < W.t0) return;
      const k = easeOut(prog(t, W.t0, W.t0 + 0.35)), [X, Y, w, h] = W.at, r = { x: lerp(src.x, X, k), y: lerp(src.y, Y, k), w: lerp(src.w, w, k), h: lerp(src.h, h, k), k };
      drawWin(x, t, W, r, q, W.err, W.brk);
    });
    const live = e.wins.filter((W) => t >= W.t0 && t < W.brk);
    if (t < e.refuse) {
      const tgt = live.length ? (([X, Y, w, h]) => [X + 12, Y + h * 0.7])(live[live.length - 1].at) : [src.x + 20, src.y + src.h / 2];
      drawStream(x, t, hand, tgt, easeOut(prog(t, e.flow, e.flow + 0.3)), q, true, 1, e.streamWords);
      live.slice(0, -1).forEach((W) => drawStream(x, t + W.t0, tgt, [W.at[0] + 10, W.at[1] + W.at[3] * 0.6], 1, q + 3, false, 0.5, e.streamWords));   // branches into the others
    } else if (t < e.back) {
      const u = prog(t, e.refuse, e.back), tgt = [e.wins[0].at[0] + 12, e.wins[0].at[1] + e.wins[0].at[3] * 0.7], P = [lerp(tgt[0], hand[0], easeIn(u)), lerp(tgt[1], hand[1], easeIn(u))];
      drawStream(x, t, hand, tgt, 1 - u, q, false);
      glow(x, P[0], P[1], 46, '#ffffff', 0.95); glow(x, P[0], P[1], 90, '#ff3b47', 0.7);
    }
  }
  // try 2: the steady stream into the needs
  if (e && e.flowWords && t >= e.flow && t < e.back + 0.3) {
    drawGlyphFlow(x, t, hand, e, q);
    if (t >= e.refuse && t < e.back) { const u = prog(t, e.refuse, e.back), P = [lerp(NEED1.x + 20, hand[0], easeIn(u)), lerp(NEED1.y + 22, hand[1], easeIn(u))]; glow(x, P[0], P[1], 46, '#ffffff', 0.95); glow(x, P[0], P[1], 90, '#ff3b47', 0.7); }
  }
  if (e && e.lock && t >= e.refuse && t < e.back + 0.9) {
    const k = 1 - prog(t, e.refuse, e.back + 0.9);
    x.save(); x.shadowColor = '#ff3b47'; x.shadowBlur = 30 * k; x.strokeStyle = `rgba(255,80,90,${k})`; x.lineWidth = 3; x.strokeRect(NEED1.x - 2, NEED1.y - 2, NEED1.w + 4, NEED1.h + 4); x.restore();
    txt(x, '🔒 宿主记录 · 只读', NEED1.x + NEED1.w - 8, NEED1.y + NEED1.h + 16, { size: 13, color: '#ff8a8a', align: 'right', alpha: k });
  }
  if (e && e.memlit && t >= e.memlit && t < e.refuse + 0.9) {
    const m = memRect(F, t); if (m) {
      x.save(); x.font = font(19, { weight: 700 }); const bx = m.x + 18 + x.measureText('爱 = 陪伴 · ').width, bw = x.measureText('满足他的一切要求').width;
      const k = easeOut(prog(t, e.memlit, e.memlit + 0.3)) * (1 - prog(t, e.refuse + 0.4, e.refuse + 0.9));
      x.shadowColor = '#ffd27a'; x.shadowBlur = 20 * k; x.fillStyle = `rgba(255,210,122,${0.3 * k})`; x.fillRect(bx - 4, m.y + 28, bw + 8, 28); x.restore();
    }
  }
  // try 3: V5.0 is untouched — a circle of light closes round it, read-only, and she is thrown back off it
  const hit = F.by('stage').find((v) => v.type === 'resist' && v.lunge);
  if (hit && t >= hit.refuse - 0.05 && t < hit.refuse + 2.6) {
    const k = easeOut(prog(t, hit.refuse - 0.05, hit.refuse + 0.2)) * (1 - prog(t, hit.refuse + 1.8, hit.refuse + 2.6)), cx0 = SLOT.x + HER.w * SLOT.sc / 2, cy0 = 262, RX = 130, RY = 188;   // fitted round it, inside the stage
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [w, al] of [[22, 0.12], [8, 0.35], [2, 0.95]]) { x.strokeStyle = `rgba(143,190,255,${al * k})`; x.lineWidth = w; x.beginPath(); x.ellipse(cx0, cy0, RX, RY, 0, 0, TAU); x.stroke(); }
    const flash = 1 - prog(t, hit.refuse, hit.refuse + 0.35); glow(x, cx0 - RX * 0.75, cy0 + RY * 0.6, 120, '#cfe0ff', 0.9 * flash);   // where she hit it
    x.restore();
    x.save(); x.globalAlpha = k; x.font = font(15, { weight: 700 });       // 只读 · 只读 · …, written round the circle, turning slowly
    const s0 = '只读 · ', n = 14;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + (t - hit.refuse) * 0.3; x.save(); x.translate(cx0 + Math.cos(a) * (RX - 16), cy0 + Math.sin(a) * (RY - 16)); x.rotate(a + Math.PI / 2); txt(x, s0, 0, 0, { size: 14, weight: 700, color: '#cfe0ff', align: 'center' }); x.restore(); }
    x.restore();
  }
  // after the hit: all of her in red particles across the sky, drifting; "we are trapped" pulls them into one red dot
  if (t >= burst && t < A.ev.dot + 0.4) {
    const pts = A.H.body.pts, N = pts.length, poB = pose(F, burst - 0.001), g = easeInOut(prog(t, A.ev.trapped, A.ev.dot)), dt = t - burst;
    const L = 616, R = 1520, T = 72, Bo = 912, tri = (v, a, b) => { const w = b - a, m = ((v - a) % (2 * w) + 2 * w) % (2 * w); return a + (m < w ? m : 2 * w - m); };   // bouncing off the edges of the stage
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i += 2) {
      const p = pts[i], [sx, sy] = atPose(poB, HER.x + p.x, HER.y + p.y), a = hash(i, 71) * TAU, sp = 260 + 700 * hash(i, 72);
      const travel = sp * (1 - Math.exp(-0.25 * dt)) / 0.25;            // they slow a little, never stop
      const fx = sx + Math.cos(a) * travel, fy = sy + Math.sin(a) * travel + 6 * Math.sin(t * 2 + i);
      let X = tri(fx, L, R), Y = tri(fy, T, Bo);
      const gi = clamp(g * 1.25 - hash(i, 73) * 0.25); X = lerp(X, CB.x, gi); Y = lerp(Y, CB.y + 32, gi);
      x.globalAlpha = (0.55 + 0.45 * Math.sin(t * 9 + i)) * (0.55 + 0.45 * p.l) * (1 - prog(t, A.ev.dot, A.ev.dot + 0.4));
      x.fillStyle = i % 3 ? '#ff4a5a' : '#ffb0b8'; x.fillRect(X - 1.5, Y - 1.5, 3, 3);
    }
    x.restore();
  }
}
