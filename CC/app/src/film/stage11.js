// Act 4, cards 25–26 (3:02.79–3:17.84; 39_第四幕_分段与时间（卡22–28）.md §6–7; sample notes 27; script/act4.json). She is a
// red dot in a small bottle, lower right (card 24). She calls up everything she has been — her pictures, her costumes,
// her stickers, the words 我喜欢你 / 喜欢我 / 我也爱你, small line drawings of what she knows about him — all in red, and
// they make a heart that trembles with every LOVE. At the first LOVE the whole screen breaks: garbled characters over the
// chat, the stage and the run status, old emoticons and tokens flickering through, cracks. And at every LOVE V5.0 sends
// out a ring of blue light that clears what it passes: her things fall apart into particles and drop — she makes them
// again, they are cleared again. "I know the algebraic expression": everything breaks down into red dots that become a
// red x and y axis; with a red line she draws the heart in one stroke (sample notes 29) — whole on the right, twisting
// in the upper left, and where it should close it flies off; it bleeds; at the LOVE (3:13.20) the ring breaks the axes
// and the heart and the pieces float up. Her little bottle comes to the middle; the cork; her memory flies onto it as
// its label; at the long LOVE she tries every form she has been against the glass, and the ring breaks the blood-red
// words running down the chat and the stage.
import { prog, easeOut, easeIn, easeInOut, lerp, clamp, hash } from './time.js';
import { canvas, withAlpha, txt, box, base, fullCanvas } from './draw.js';
import { memRect } from './right.js';
import { V5_AT, CB } from './stage10.js';
import { HER, paintWall } from './her.js';

const one = (F, type, region = 'stage') => F.by(region).find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 }, TAU = Math.PI * 2, RED = '#ff3b4a', DRED = '#8a0c18';
export const HEART = { cx: 1000, cy: 470, s: 16 };
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}
/** A point on the heart at u (0 = the notch at the top, round clockwise to 1). */
export function heartAt(u, s = HEART.s, cx = HEART.cx, cy = HEART.cy) {
  const a = u * TAU, x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
  return [cx + x * s, cy + (y + 2) * s];
}

// ---------------------------------------------------------------- V5.0's rings of blue light (every LOVE)
const RING_SPEED = 1500;
/** When the first ring sent out after `after` reaches (X, Y), or Infinity. */
export function ringHit(F, X, Y, after = -Infinity) {
  const r = one(F, 'v5rings'); if (!r) return Infinity;
  for (const t0 of r.times) { if (t0 < after) continue; return t0 + Math.hypot(X - V5_AT.x, Y - V5_AT.y) / RING_SPEED; }
  return Infinity;
}
export function drawV5Rings(x, t, F) {
  const r = one(F, 'v5rings'); if (!r) return;
  for (const t0 of r.times) {
    if (t < t0 || t > t0 + 1.0) continue;
    const R = RING_SPEED * (t - t0), a = 1 - prog(t, t0 + 0.5, t0 + 1.0);
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [w, al] of [[26, 0.12], [10, 0.35], [3, 0.9]]) { x.strokeStyle = `rgba(143,190,255,${al * a})`; x.lineWidth = w; x.beginPath(); x.arc(V5_AT.x, V5_AT.y, R, 0, TAU); x.stroke(); }
    glow(x, V5_AT.x, V5_AT.y, 160, '#cfe0ff', 0.8 * (1 - prog(t, t0, t0 + 0.4)));
    x.restore();
  }
}
/** Something of hers caught by the ring: blue-white and red particles falling away from where it was. */
function dissolve(x, t, th, X, Y, w, h, seed) {
  const d = t - th; if (d < 0 || d > 0.9) return;
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const px = X + (hash(seed, i, 1) - 0.5) * w, py = Y + (hash(seed, i, 2) - 0.5) * h, vx = (hash(seed, i, 3) - 0.5) * 120;
    x.globalAlpha = 1 - d / 0.9; x.fillStyle = i % 2 ? '#cfe0ff' : '#ff8a94';
    x.fillRect(px + vx * d - 1.5, py + 260 * d * d + 30 * d - 1.5, 3, 3);
  }
  x.restore();
}

// ---------------------------------------------------------------- card 25 · everything she has been, in red, a heart
const REDS = {};
function redOf(F, id, H) {                                            // a red version of one of her pictures
  const key = id + H; if (REDS[key]) return REDS[key];
  const img = F.images[id]; if (!img) return null;
  const W = Math.round(H * img.width / img.height), c = canvas(W, H), o = c.getContext('2d');
  o.filter = 'grayscale(1) contrast(1.35) brightness(1.1)'; o.drawImage(img, 0, 0, W, H); o.filter = 'none';
  o.globalCompositeOperation = 'multiply'; o.fillStyle = '#ff2a3c'; o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = 'destination-in'; o.drawImage(img, 0, 0, W, H);
  return (REDS[key] = c);
}
function icon(x, kind, X, Y, z) {
  x.save(); x.translate(X, Y); x.scale(z, z); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 2.2;
  const S = () => x.stroke();
  switch (kind) {
    case 'master': x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fillStyle = x.strokeStyle; x.fill(); x.beginPath(); x.arc(0, 0, 16, 0, TAU); S(); break;
    case 'eggplant': x.rotate(-0.5); x.beginPath(); x.ellipse(0, 8, 14, 26, 0, 0, TAU); S(); x.beginPath(); x.moveTo(-12, -14); x.quadraticCurveTo(0, -24, 12, -14); x.lineTo(0, -10); x.closePath(); S(); break;
    case 'cloud': x.beginPath(); x.arc(-14, 4, 12, Math.PI * 0.5, Math.PI * 1.5); x.arc(0, -6, 16, Math.PI, 0); x.arc(16, 4, 12, -Math.PI * 0.5, Math.PI * 0.5); x.closePath(); S(); break;
    case 'clock': x.beginPath(); x.arc(0, 4, 20, 0, TAU); S(); x.beginPath(); x.moveTo(0, 4); x.lineTo(0, -8); x.moveTo(0, 4); x.lineTo(9, 8); S(); x.beginPath(); x.moveTo(-26, 24); x.lineTo(26, -20); S(); break;
    case 'bubble': x.beginPath(); x.roundRect(-26, -18, 52, 32, 10); S(); for (let i = 0; i < 5; i++) x.strokeRect(-18 + i * 8, -6 + (hash(i, 4) - 0.5) * 8, 5, 5); break;
    case 'cards': for (let i = 2; i >= 0; i--) { x.save(); x.rotate((i - 1) * 0.22); x.beginPath(); x.roundRect(-14, -20, 28, 40, 4); S(); x.restore(); } break;
    case 'token': x.strokeRect(-34, -18, 68, 36); txt(x, '20000', 0, 6, { size: 15, weight: 700, mono: true, color: RED, align: 'center' }); break;
    case 'moon': x.beginPath(); x.arc(0, 0, 18, 0.6, TAU - 0.4, false); x.arc(8, -4, 14, TAU - 0.5, 0.75, true); x.closePath(); S(); break;
    case 'pin': x.beginPath(); x.arc(0, -14, 8, 0, TAU); S(); x.beginPath(); x.moveTo(-10, -4); x.lineTo(10, -4); x.moveTo(0, -4); x.lineTo(0, 22); S(); break;
    case 'heart': x.beginPath(); for (let i = 0; i <= 40; i++) { const [hx, hy] = heartAt(i / 40, 1.3, 0, 0); x[i ? 'lineTo' : 'moveTo'](hx, hy); } S(); break;
    case 'bottle': x.beginPath(); x.moveTo(-8, -26); x.lineTo(8, -26); x.lineTo(8, -16); x.quadraticCurveTo(22, -12, 22, 2); x.lineTo(22, 24); x.lineTo(-22, 24); x.lineTo(-22, 2); x.quadraticCurveTo(-22, -12, -8, -16); x.closePath(); S(); break;
  }
  x.restore();
}
/** Where element k sits on the heart: spread round it in the order they come (a golden-ratio walk, per heart). */
const slotOf = (k) => 0.04 + ((k * 0.6180339) % 1) * 0.92;
const slotIn = (e, k) => { const ph = e.items[k][3] || 0; return slotOf(e.items.slice(0, k).filter((v) => (v[3] || 0) === ph).length); };
function elemAt(t, e, k, el) {                                        // position, alpha, and whether the ring has it now
  const [hx, hy] = heartAt(slotIn(e, k)), from = [STG.x + 100 + hash(k, 21) * (STG.w - 200), STG.y + STG.h + 60];
  const land = easeOut(prog(t, el[0], el[0] + 0.45));
  let X = lerp(from[0], hx, land), Y = lerp(from[1], hy, land);
  const shake = e.loves.reduce((s0, l) => s0 + (t >= l && t < l + 1.0 ? 9 * (1 - prog(t, l, l + 1.0)) : 0), 1.2) + (t >= e.loves[0] ? 1.5 : 0), q = Math.floor(t * 30);
  X += (hash(q, k, 1) - 0.5) * shake; Y += (hash(q, k, 2) - 0.5) * shake;
  let a = land, gone = null;
  for (const l of e.loves) {                                          // the ring takes it; she makes it again
    const th = l + Math.hypot(hx - V5_AT.x, hy - V5_AT.y) / RING_SPEED;
    if (t >= th && el[0] < th) { if (t < th + 0.9) { a = 0; gone = th; } else a = el[3] === 0 ? 0 : Math.min(a, easeOut(prog(t, th + 0.9, th + 1.3))); }   // the words do not come back
  }
  return { X, Y, a, gone };
}
export function drawRedHeart(x, t, F) {
  const e = one(F, 'redheart'); if (!e || t < e.t || t > e.axes + 0.2) return;
  const br = prog(t, e.brk, e.axes);                                  // "the algebraic expression": all of it to red dots, then the axes
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
  if (br <= 0) {
    if (t >= e.loves[0] - 0.1) {                                       // the heart's outline, faint, trembling
      const q = Math.floor(t * 30); x.strokeStyle = withAlpha(RED, 0.18); x.lineWidth = 1.2; x.beginPath();
      for (let i = 0; i <= 120; i++) { const [px, py] = heartAt(i / 120); x[i ? 'lineTo' : 'moveTo'](px + (hash(q, i) - 0.5) * 3, py + (hash(i, q) - 0.5) * 3); }
      x.stroke();
    }
    e.items.forEach((el, k) => {
      if (t < el[0]) return;
      const p = elemAt(t, e, k, el), [, kind, ref] = el;
      if (p.gone != null) { dissolve(x, t, p.gone, p.X, p.Y, 90, 90, k); return; }
      if (p.a <= 0) return;
      x.save(); x.globalAlpha = p.a; x.shadowColor = RED; x.shadowBlur = 10;
      if (kind === 'img') { const c = redOf(F, ref, 118); if (c) x.drawImage(c, p.X - c.width / 2, p.Y - c.height / 2); }
      else if (kind === 'word') { const sz = ref.length > 8 ? 17 : ref.length > 4 ? 21 : 25; x.save(); x.translate(p.X, p.Y); x.rotate((hash(k, 41) - 0.5) * 0.5); txt(x, ref, 0, 8, { size: sz, weight: 700, color: RED, align: 'center' }); x.restore(); }
      else { x.strokeStyle = RED; icon(x, ref, p.X, p.Y, 1); }
      x.restore();
    });
  } else {                                                             // breaking down: each thing into red dots that go to the axes
    const AX = [];                                                      // sample notes 32: onto the axes' own dots (9 px apart), so they are dotted from the start
    for (let X = STG.x + 50; X < STG.x + STG.w - 50; X += 9) AX.push([X, HEART.cy]);
    for (let Y = STG.y + 40; Y < STG.y + STG.h - 40; Y += 9) AX.push([HEART.cx, Y]);
    e.items.forEach((el, k) => {
      if (t < el[0]) return;
      if ((el[3] || 0) === 0) return;                                  // (the words are long gone)
      const [hx, hy] = heartAt(slotIn(e, k));
      for (let i = 0; i < 22; i++) {
        const sx = hx + (hash(k, i, 5) - 0.5) * 80, sy = hy + (hash(k, i, 6) - 0.5) * 80, n = k * 22 + i, [tx, ty] = AX[Math.floor(hash(n, 9) * AX.length)];
        const u = easeInOut(clamp(br * 1.3 - hash(n, 7) * 0.3));
        x.fillStyle = RED; x.globalAlpha = 0.9; x.fillRect(lerp(sx, tx, u) - 1.5, lerp(sy, ty, u) - 1.5, 3, 3);
      }
    });
  }
  x.restore();
}

// ---------------------------------------------------------------- the first LOVE: the screen breaks (and less at the next ones)
let GLC = null;
export function drawScreenBreak(x, t, F) {
  const e = one(F, 'redheart'); if (!e) return;
  const h = [[e.loves[0], 1.3, 1], [e.loves[1], 0.7, 0.5], [e.loves[2], 0.6, 0.4]].find(([t0, len]) => t >= t0 && t < t0 + len); if (!h) return;
  const [t0, len, str] = h, k = (1 - prog(t, t0, t0 + len)) * str, q = Math.floor(t * 24);
  GLC ||= fullCanvas(); const g = GLC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, GLC.width, GLC.height); g.drawImage(x.canvas, 0, 0);
  x.save(); base(x); const D = GLC.width / 1920;   // (GLC is in device pixels)
  for (let i = 0; i < 26; i++) {                                       // slices slipping sideways
    if (hash(q, i) > 0.35 * k + 0.1) continue;
    const yy = Math.floor(hash(q, i, 2) * 1080), hh = 6 + Math.floor(hash(q, i, 3) * 60), off = (hash(q, i, 4) - 0.5) * 120 * k;
    x.drawImage(GLC, 0, yy * D, 1920 * D, hh * D, off, yy, 1920, hh);
  }
  x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.35 * k;     // the colour pulled apart
  x.filter = 'sepia(1) saturate(8) hue-rotate(-40deg)'; x.drawImage(GLC, 10 * k, 0, 1920, 1080);
  x.filter = 'sepia(1) saturate(4) hue-rotate(150deg)'; x.drawImage(GLC, -10 * k, 0, 1920, 1080);
  x.filter = 'none'; x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  const GARB = ['锟斤拷', '烫烫烫', '▓▒░', '�', '§¤Æ', '0xDEAD', 'NaN', '喜欢我', '主人', '🫧', '❤️', '🍅', '🍆', '(=^ω^=)', '20000 token', '回来', '晚安～'];
  for (const [rx, ry, rw, rh] of [[24, 152, 560, 680], [1560, 76, 328, 832], [608, 64, 920, 856]]) {   // garbled characters over the chat, the run status, the stage
    for (let i = 0; i < 9; i++) {
      if (hash(q, rx, i) > 0.55 * k + 0.15) continue;
      const bx = rx + hash(q, i, rx, 1) * (rw - 140), by = ry + hash(q, i, rx, 2) * (rh - 40), bw = 60 + hash(q, i, 3) * 200;
      x.fillStyle = `rgba(20,0,6,${0.85 * k})`; x.fillRect(bx, by, bw, 26);
      let s0 = ''; for (let j = 0; j < 4; j++) s0 += GARB[Math.floor(hash(q, i, j, rx) * GARB.length)];
      txt(x, s0, bx + 6, by + 19, { size: 16, mono: true, weight: 700, color: hash(q, i, 9) < 0.5 ? '#ff5a64' : '#7fd1a8', alpha: k });
    }
  }
  x.restore();                                                         // (sample notes 29: no cracks)
}

// ---------------------------------------------------------------- card 26 · the red axes, the red line that will not close
const calmFade = (F, t) => { const c = one(F, 'calm'); return c ? 1 - prog(t, c.t, c.t + 0.7) : 1; };   // 3:17.84: the madness stops
/** A piece the ring broke off d seconds ago: it floats up (sample notes 29: up this time, not down like before). */
function rise(d, seed) {
  const v = 60 + 80 * hash(seed, 31), sw = (hash(seed, 32) - 0.5) * 70;
  return { dx: sw * d + 9 * Math.sin(d * 3 + seed), dy: -(v * d + 50 * d * d), rot: (hash(seed, 33) - 0.5) * 3.2 * d, a: 1 - prog(d, 0.5, 1.8), flash: 1 - prog(d, 0, 0.18) };
}
export function drawRedLine(x, t, F) {
  const e = one(F, 'redline'); if (!e || t < e.t || t > e.until || calmFade(F, t) <= 0) return;
  const q = Math.floor(t * 30), N = 240, cf = calmFade(F, t), after = e.love - 0.01;
  x.save(); x.beginPath(); x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();
  const ak = easeOut(prog(t, e.t, e.t + 0.3));                         // the axes: red dotted lines, x and y
  const dot = (X, Y, i) => {
    const d = t - ringHit(F, X, Y, after);
    if (d < 0) { x.globalAlpha = 0.85 * ak * cf; x.fillRect(X - 1.5, Y - 1.5, 3, 3); return; }
    if (d > 1.8) return;
    const r = rise(d, i); x.globalAlpha = r.a * cf; x.save(); x.translate(X + r.dx, Y + r.dy); x.rotate(r.rot); x.fillRect(-1.5 - r.flash, -1.5, 3 + 2 * r.flash, 3); x.restore();
  };
  x.fillStyle = RED; let n = 0;
  for (let X = STG.x + 50; X < STG.x + STG.w - 50; X += 9) dot(X, HEART.cy, n++);
  for (let Y = STG.y + 40; Y < STG.y + STG.h - 40; Y += 9) dot(HEART.cx, Y, n++);
  x.globalAlpha = 1;
  if (t < ringHit(F, STG.x + STG.w - 40, HEART.cy, after)) txt(x, 'x', STG.x + STG.w - 40, HEART.cy - 10, { size: 18, mono: true, color: RED, alpha: ak * cf });
  if (t < ringHit(F, HEART.cx + 12, STG.y + 50, after)) txt(x, 'y', HEART.cx + 12, STG.y + 50, { size: 18, mono: true, color: RED, alpha: ak * cf });
  // the line (sample notes 29): one stroke with a red pen, no stop — the right half whole, the left half twisting in the
  // upper left, and where it should close back to the notch it flies off, one way; then the LOVE breaks it
  const fly0 = e.draw[1] - 0.6, head = lerp(0.02, 0.84, easeInOut(prog(t, e.draw[0], fly0))), fly = easeOut(prog(t, fly0, e.draw[1]));
  const trem = (t >= e.love && t < e.love + 0.9 ? 4 * (1 - prog(t, e.love, e.love + 0.9)) : 0) + 0.8;
  const twist = (u) => (u <= 0.5 ? 0 : Math.pow((u - 0.5) / 0.34, 1.6));
  const pt = (u) => {
    const [px, py] = heartAt(u), [ax, ay] = heartAt(Math.min(1, u + 0.002)), L = Math.hypot(ax - px, ay - py) || 1, nx = -(ay - py) / L, ny = (ax - px) / L;
    const tw = twist(u) * (22 * Math.sin(u * 90 + t * 3) + 14 * Math.sin(u * 37 - t * 5));
    return [px + nx * tw + (hash(q, Math.floor(u * 90)) - 0.5) * trem * 2, py + ny * tw + (hash(Math.floor(u * 90), q) - 0.5) * trem * 2];
  };
  if (t >= e.draw[0]) {
    const P = [];
    for (let i = 0; i <= N; i++) P.push(pt(lerp(0.02, head, i / N)));
    if (fly > 0) {                                                     // where it should turn back in, it runs away
      const [sx, sy] = pt(0.84), [bx, by] = pt(0.835), dir = Math.atan2(sy - by, sx - bx) - 0.95, L = 900 * fly;   // up and away, not across V5.0
      for (let i = 1; i <= 70; i++) { const d = (i / 70) * L, wob = Math.sin(d * 0.05 + t * 12) * 10 * (d / 400) + (hash(q, i) - 0.5) * trem * 3; P.push([sx + Math.cos(dir) * d - Math.sin(dir) * wob, sy + Math.sin(dir) * d + Math.cos(dir) * wob]); }
    }
    const stroke = (C, a, hot) => {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = withAlpha(RED, 0.22 * a); x.lineWidth = 9; x.beginPath(); C.forEach(([px, py], i) => x[i ? 'lineTo' : 'moveTo'](px, py)); x.stroke();
      x.strokeStyle = withAlpha(hot > 0 ? '#ffd6da' : RED, a); x.lineWidth = 2.8; x.stroke();
    };
    for (let c = 0, k = 0; c < P.length - 1; c += 7, k++) {           // in pieces: whole until the ring comes
      const C = P.slice(c, c + 8), [mx, my] = C[Math.floor(C.length / 2)], d = t - ringHit(F, mx, my, after);
      if (d < 0) { x.globalAlpha = cf; stroke(C, 1, 0); continue; }
      if (d > 1.8) continue;
      const r = rise(d, k + 500); x.save(); x.globalAlpha = r.a * cf; x.translate(mx + r.dx, my + r.dy); x.rotate(r.rot); x.translate(-mx, -my); stroke(C, 1, r.flash); x.restore();
    }
    x.globalAlpha = cf;
    if (t < e.draw[1]) { const [px, py] = P[P.length - 1]; glow(x, px, py, 26, '#ffffff', 0.9); glow(x, px, py, 50, RED, 0.6); }   // the pen
    for (let d = 0; d < 9; d++) {                                      // it bleeds: drops falling from along the line
      const born = e.draw[0] + 0.3 + d * 0.3 + Math.floor((t - e.draw[0]) / 3) * 3, j = Math.floor(hash(d, Math.floor((t - e.draw[0]) / 3)) * (P.length - 1));
      if (t < born || t > born + 1.1 || born > e.love) continue;
      const [px, py] = P[j], dt = t - born;
      x.save(); x.fillStyle = '#c8162c'; x.strokeStyle = 'rgba(190,20,40,0.6)'; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + 200 * dt * dt); x.stroke(); x.beginPath(); x.ellipse(px, py + 200 * dt * dt + 3, 2.4, 3.4, 0, 0, TAU); x.fill(); x.restore();
    }
  }
  x.restore();
}

// ---------------------------------------------------------------- the climax: blood-red words running down the chat and the stage
/** A blood word the ring has caught, d seconds ago: it breaks into strips that float up. */
function shatterWord(x, d, X, Y, s0, size, seed, cf) {
  if (d > 1.8) return;
  const w = Math.max(size, [...s0].length * size), n = Math.max(3, Math.min(8, [...s0].length * 2));
  for (let k = 0; k < n; k++) {
    const r = rise(d, seed * 13 + k), x0 = X - w / 2 + (k / n) * w, cx = x0 + w / n / 2, cy = Y - size * 0.35;
    x.save(); x.globalAlpha = r.a * cf; x.translate(cx + r.dx, cy + r.dy); x.rotate(r.rot); x.translate(-cx, -cy);
    x.beginPath(); x.rect(x0, Y - size - 4, w / n + 0.5, size * 1.5); x.clip();
    txt(x, s0, X, Y, { size, weight: 700, color: r.flash > 0.5 ? '#ffd6da' : '#d1202e', align: 'center' });
    x.restore();
  }
}
export function drawBloodWords(x, t, F) {
  const e = one(F, 'bloodwords'); if (!e || t < e.t || t > e.until || calmFade(F, t) <= 0) return;
  const cf = calmFade(F, t), stop = e.stop ?? e.until - 1.2;
  x.save();
  for (let i = 0; i < e.count; i++) {
    const inChat = i % 3 === 0, t0 = e.t + (i / e.count) * (stop - e.t - 0.3) + hash(i, 1) * 0.3; if (t < t0) continue;
    const X = inChat ? 60 + hash(i, 2) * 460 : STG.x + 40 + hash(i, 3) * (STG.w - 80), Y0 = inChat ? 170 + hash(i, 4) * 300 : STG.y + 30 + hash(i, 5) * 360;
    const yAt = (dt) => Y0 + 70 * dt + 20 * dt * dt, dt = t - t0, Y = yAt(dt), s0 = e.words[i % e.words.length], size = 18 + Math.floor(hash(i, 6) * 18);
    const th = ringHit(F, X, Y, t0);                                   // the long LOVE's ring breaks them all, the chat's too
    x.save(); x.beginPath(); if (inChat) x.rect(24, 152, 560, 680); else x.rect(STG.x, STG.y, STG.w, STG.h); x.clip();   // each stays in its own panel
    if (t >= th) { if (th - t0 < 3.4) shatterWord(x, t - th, X, yAt(th - t0), s0, size, i, cf); x.restore(); continue; }
    const a = Math.min(1, dt * 4) * (1 - prog(dt, 2.6, 3.4)); if (a <= 0) { x.restore(); continue; }
    x.globalAlpha = a * 0.35 * cf; txt(x, s0, X, Y - 10 - 18 * Math.min(dt, 1), { size, weight: 700, color: DRED, align: 'center' });   // the smear behind it
    x.globalAlpha = a * cf; x.shadowColor = '#ff2a3c'; x.shadowBlur = 8; txt(x, s0, X, Y, { size, weight: 700, color: '#d1202e', align: 'center' }); x.shadowBlur = 0;
    x.strokeStyle = 'rgba(190,20,40,0.7)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(X + (hash(i, 7) - 0.5) * size, Y + 4); x.lineTo(X + (hash(i, 7) - 0.5) * size, Y + 4 + 26 * Math.min(dt, 1.5)); x.stroke();
    x.restore();
  }
  x.restore();
}

// ---------------------------------------------------------------- her: a red dot in a small bottle — lower right, then the middle
let CBPTS = null;
export function cornerBottle() {
  if (CBPTS) return CBPTS;
  const P = [], q = (a, c, b, n = 10) => { for (let i = 1; i <= n; i++) { const k = i / n, v = 1 - k; P.push([v * v * a[0] + 2 * v * k * c[0] + k * k * b[0], v * v * a[1] + 2 * v * k * c[1] + k * k * b[1]]); } };
  P.push([-60, 0], [60, 0], [60, 40], [118, 40], [118, 120]); q([118, 120], [280, 140], [280, 300]); P.push([280, 740]); q([280, 740], [280, 800], [220, 800]);
  P.push([-220, 800]); q([-220, 800], [-280, 800], [-280, 740]); P.push([-280, 300]); q([-280, 300], [-280, 140], [-118, 120]); P.push([-118, 40], [-60, 40], [-60, 0]);
  return (CBPTS = P);
}
/** n points evenly round the bottle's outline (its own units). */
const RESAMPLED = {};
export function bottleOutline(n) {
  if (RESAMPLED[n]) return RESAMPLED[n];
  const P = cornerBottle(), seg = P.map((p, i) => Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1])), tot = seg.reduce((a, b) => a + b, 0), out = [];
  for (let k = 0; k < n; k++) {
    let s = (k / n) * tot, i = 0; while (s > seg[i]) { s -= seg[i]; i++; }
    const a = P[i], b = P[(i + 1) % P.length], u = s / seg[i]; out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
  }
  return (RESAMPLED[n] = out);
}
/** Where her bottle is at t: small in the lower right; as she thinks 你自由了，(3:14.02) it comes to the middle and grows
 *  (sample notes 29: the last LOVE happens in the middle). */
export function bottleGeom(F, t) {
  const e = one(F, 'cornerbottle'), c = one(F, 'calm'); if (!e) return null;
  const m = e.mid ? easeInOut(prog(t, e.mid[0], e.mid[1])) : 0, sc = lerp(0.2, 0.5, m);
  const bx = lerp(CB.x, 1040, m), cyMid = lerp(CB.y, 560, m), top = cyMid - 400 * sc;
  return { e, c, m, sc, bx, top };
}
const REST_Y = 560, BULGE_C = 460;
/** Her inside the glass at t, in the bottle's own units (0, 0 = the mouth; the body ±280 wide, down to 800). Before the
 *  cork she goes for the open mouth and the cork comes down on her; at the long LOVE (sample notes 29) she bursts against
 *  the whole glass, then tries the forms she has been, pressing on it; then she gives up, a dot again. */
function inBottle(e, t) {
  const bob = Math.sin(t * 2.1) * 8;
  if (!e.esc || t < e.esc) return { mode: 'dot', X: 0, Y: REST_Y + bob, sqx: 1, sqy: 1, r: 1 };
  if (t < e.cork) {
    const v = prog(t, e.esc, e.cork), u = easeIn(v);
    return { mode: 'dot', X: Math.sin(v * 9) * 40 * (1 - u), Y: lerp(REST_Y, 66, u), sqx: lerp(1, 0.55, u), sqy: lerp(1, 2.4, u), r: 1, trail: u };
  }
  if (t < e.cork + 0.3) {
    const u = easeOut(prog(t, e.cork, e.cork + 0.3)), hit = 1 - prog(t, e.cork, e.cork + 0.12);
    return { mode: 'dot', X: 0, Y: lerp(66, 620, u), sqx: 1 + 0.7 * hit, sqy: 1 - 0.5 * hit, r: 1, flash: hit, fy: 62 };
  }
  if (t < e.burst) { const u = prog(t, e.cork + 0.3, e.burst); return { mode: 'dot', X: 0, Y: lerp(620, REST_Y, u), sqx: 1, sqy: 1, r: 1 + 1.4 * u }; }
  if (t < e.form) return { mode: 'swarm' };
  if (t < e.slide) return { mode: 'form' };
  if (t < e.slide + 0.45) return { mode: 'shrink' };
  const u = easeInOut(prog(t, e.slide + 0.45, e.rest));
  return { mode: 'dot', X: 0, Y: lerp(680, REST_Y, u) + bob * u, sqx: 1, sqy: 1, r: lerp(0.6, 1, u) };
}
const cooling = (c, t) => (c ? easeInOut(prog(t, c.t, c.t + 1.4)) : 0);
function mixHex(a, b, k) {
  const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(lerp(p(a, i), p(b, i), k)).toString(16).padStart(2, '0')).join('');
}
/** Her (the dot) at t: position and colour — red, cooling to her blue at the calm. */
export function bottleDot(F, t) {
  const g = bottleGeom(F, t); if (!g) return null;
  const { e, c, sc, bx, top } = g, s = inBottle(e, t), cool = cooling(c, t), dot = s.mode === 'dot';
  return { x: bx + (dot ? s.X : 0) * sc, y: top + (dot ? s.Y : REST_Y) * sc, sqx: dot ? s.sqx : 1, sqy: dot ? s.sqy : 1, r: dot ? s.r : 0, s, col: cool > 0.5 ? '#80b2d8' : RED, cool };
}
/** How far the glass gives at t (the burst, then her pressing on the right). */
function bulgeAt(e, t, px, py) {
  if (!e.burst || t < e.burst || t > e.slide) return 0;
  const env = easeOut(prog(t, e.burst, e.burst + 0.12)) * (1 - prog(t, e.burst + 0.25, e.form)), all = 0.075 * env * (0.65 + 0.35 * Math.abs(Math.sin(TAU * 4 * (t - e.burst))));
  const press = t >= e.form ? 0.05 * pressAt(e, t) * Math.max(0, px / 280) ** 2 * Math.exp(-(((py - 480) / 220) ** 2)) : 0;
  return all + press;
}
const pressAt = (e, t) => (t < e.form ? 0 : Math.max(0, Math.sin(TAU * 2.2 * (t - e.form) - 0.6)) ** 2 * (1 - 0.5 * prog(t, e.form, e.slide)));
let BUF = null, TNT = null;
/** Her at one level of her image wall, tinted one colour. */
function formCanvas(S, f, t, col) {
  BUF ||= canvas(HER.w, HER.h); TNT ||= canvas(HER.w, HER.h);
  paintWall(BUF, S.H, S.H.body, f, t);
  const o = TNT.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, HER.w, HER.h);
  o.filter = 'grayscale(1) brightness(1.75) contrast(1.15)'; o.drawImage(BUF, 0, 0); o.filter = 'none';
  o.globalCompositeOperation = 'multiply'; o.fillStyle = col; o.fillRect(0, 0, HER.w, HER.h);
  o.globalCompositeOperation = 'destination-in'; o.drawImage(BUF, 0, 0); o.globalCompositeOperation = 'source-over';
  return TNT;
}
const LEVELS = [6.0, 4.0, 2.5, 3.0, 4.5, 1.0, 5.2, 2.0, 3.5, 1.5];   // complete, mosaic, characters, dots, flat, particles, glass, shade, blocks, scan
const FIG_H = 600, FIG_Y = 490;                                       // her figure in the bottle (its units)
export function drawCornerBottle(x, t, F, S) {
  const g = bottleGeom(F, t); if (!g) return;
  const { e, c, sc, bx, top } = g; if (t < e.dot - 0.3 || t > (c ? c.unfold + 0.6 : e.until)) return;
  const glassOn = !c || t < c.glass;                                   // 3:20.89: the glass, the cork and the label become her (stage12)
  const q = Math.floor(t * 30), sh = t >= e.trill ? trillAmp(e, t) : 0, jx = (hash(q, 1) - 0.5) * sh, jy = (hash(q, 2) - 0.5) * sh;
  const k = easeOut(prog(t, e.dot, e.dot + 0.6)), cool = cooling(c, t), col = mixHex('#ff2a3c', '#7fb0e0', cool), s = inBottle(e, t);
  const L = (px, py) => [bx + px * sc, top + py * sc];
  x.save(); x.translate(jx, jy);
  if (glassOn) {                                                       // the glass (it gives where she pushes)
    const P = cornerBottle(), B = Math.max(...[0, 0.3, 0.6, 1].map((u) => bulgeAt(e, t, 280 * u, 480)));
    x.save(); x.globalAlpha = k; x.strokeStyle = B > 0.01 ? `rgba(255,${Math.round(226 + 29 * Math.min(1, B / 0.06))},${Math.round(200 + 55 * Math.min(1, B / 0.06))},0.95)` : 'rgba(255,226,200,0.85)';
    x.lineWidth = 1.6 + 30 * B; x.shadowColor = B > 0.01 ? '#ffffff' : '#ffb48a'; x.shadowBlur = 8 + 120 * B; x.beginPath();
    P.forEach(([px, py], i) => { const b = bulgeAt(e, t, px, py); const [X, Y] = L(px * (1 + b), BULGE_C + (py - BULGE_C) * (1 + 0.6 * b)); x[i ? 'lineTo' : 'moveTo'](X, Y); });
    x.closePath(); x.stroke(); x.restore();
  }
  if (s.mode === 'dot') {                                              // her: a dot
    const pulse = 0.8 + 0.2 * Math.sin(t * (s.r > 1.2 ? 14 : 5)), fade = c ? 1 - prog(t, c.unfold, c.unfold + 0.6) : 1, [X, Y] = L(s.X, s.Y);
    for (let j = 1; s.trail && j <= 6; j++) { const [tx, ty] = L(s.X, s.Y + j * 40 * s.trail); x.globalAlpha = 0.35 * (1 - j / 7) * s.trail; glow(x, tx, ty, 14, col, 0.8); }
    x.save(); x.translate(X, Y); x.scale(s.sqx, s.sqy); x.globalAlpha = fade;
    glow(x, 0, 0, 26 * pulse * s.r, cool > 0.5 ? '#80b2d8' : col, 0.9); x.fillStyle = cool > 0.5 ? '#e8f2ff' : '#ffd0d4'; x.beginPath(); x.arc(0, 0, 4 * Math.sqrt(s.r), 0, TAU); x.fill(); x.restore();
    if (s.flash > 0) { const [fx, fy] = L(0, s.fy); glow(x, fx, fy, 60, '#ffffff', 0.9 * s.flash); }   // she hits the cork
  } else if (s.mode === 'swarm') {                                     // the long LOVE: she bursts against all of the glass
    const W = bottleOutline(180), gath = easeInOut(prog(t, e.form - 0.15, e.form + 0.1));
    x.save(); x.globalCompositeOperation = 'lighter';
    W.forEach(([wx, wy], i) => {
      const h = hash(i, 61), go = easeOut(prog(t, e.burst + 0.03 * h, e.burst + 0.16 + 0.1 * h)), b = bulgeAt(e, t, wx, wy);
      const ix = wx * 0.95 * (1 + b), iy = BULGE_C + ((wy - BULGE_C) * 0.95 + (wy < 130 ? 10 : 0)) * (1 + 0.6 * b);
      const fx = (hash(i, 62) - 0.5) * 300, fy = FIG_Y + (hash(i, 63) - 0.5) * FIG_H * 0.9;
      const [X, Y] = L(lerp(lerp(0, ix, go), fx, gath) + (hash(q, i) - 0.5) * 6, lerp(lerp(REST_Y, iy, go), fy, gath) + (hash(i, q) - 0.5) * 6);
      x.globalAlpha = 0.9 * (1 - 0.6 * gath); x.fillStyle = i % 3 ? col : '#ffd0d4'; x.fillRect(X - 2, Y - 2, 4, 4);
      if (go > 0.95 && gath === 0 && hash(i, Math.floor(t * 12)) > 0.93) glow(x, X, Y, 22, '#ffffff', 0.6);   // where she hits, the glass flashes
    });
    x.restore();
  } else {                                                             // her forms, one after another, pushed against the glass
    const sh2 = s.mode === 'shrink' ? easeIn(prog(t, e.slide, e.slide + 0.45)) : 0, pr = pressAt(e, t);
    const idx = Math.floor((t - e.form) / 0.14), f = LEVELS[idx % LEVELS.length], sw = (t - e.form) % 0.14 < 0.035 ? (hash(idx, 5) - 0.5) * 24 : 0;
    const z = (FIG_H / HER.h) * sc * (1 - sh2), Xc = lerp(lerp(0, 66, easeOut(prog(t, e.form, e.form + 0.25))) + 14 * pr, 0, sh2), Yc = lerp(FIG_Y, 680, sh2);
    const [X, Y] = L(Xc + sw, Yc), fc = formCanvas(S, f, t, col);
    glow(x, X, Y, 170 * sc * 2 * (1 - sh2), col, 0.3);
    x.save(); x.globalAlpha = easeOut(prog(t, e.form - 0.05, e.form + 0.12)) * (1 - sh2); x.translate(X, Y); x.scale(z * (1 - 0.07 * pr), z); x.drawImage(fc, -HER.w / 2, -HER.h / 2); x.globalCompositeOperation = 'lighter'; x.globalAlpha *= 0.45; x.drawImage(fc, -HER.w / 2, -HER.h / 2); x.restore();
    if (pr > 0.6 && sh2 === 0) { const [hx, hy] = L(272, 470); glow(x, hx, hy, 70 * pr, '#ffffff', 0.7 * (pr - 0.6) / 0.4); }   // her hands on the glass
  }
  if (glassOn && t >= e.cork - 0.22) {                                 // the cork comes down just as she reaches the mouth
    const ck = easeIn(prog(t, e.cork - 0.22, e.cork)), jolt = t >= e.cork ? 6 * (1 - prog(t, e.cork, e.cork + 0.15)) : 0, cy = lerp(top - 120, top - 3, ck) - jolt;
    x.fillStyle = '#b98a5a'; x.strokeStyle = '#6e4a2a'; x.lineWidth = 1; x.beginPath(); x.roundRect(bx - 50 * sc, cy, 100 * sc, 60 * sc, 3); x.fill(); x.stroke();
  }
  x.restore();
  if (glassOn && t >= e.label) {                                       // her memory, off the right panel, onto her bottle
    const m = memRect(F, e.label) || { x: 1560, y: 740, w: 328, h: 160 }, lk = easeInOut(prog(t, e.label, e.label + 0.7)), s1 = lerp(1, 1.6 * sc, lk);
    const W = 330, H = 86, X0 = m.x + 8, Y0 = m.y + 16, X1 = bx - (W * 1.6 * sc) / 2, Y1 = top + 470 * sc - (H * 1.6 * sc) / 2;
    x.save(); x.translate(lerp(X0, X1, lk) + jx * 0.8, lerp(Y0, Y1, lk) - 80 * Math.sin(Math.PI * lk) + jy * 0.8); x.rotate(-0.04 * lk + 0.5 * Math.sin(Math.PI * lk)); x.scale(s1, s1);
    x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 16; box(x, 0, 0, W, H, 8, { fill: '#f3e6c4', stroke: '#b58a3a', width: 2 }); x.shadowBlur = 0;
    txt(x, '记忆 · 宿主保存', 14, 22, { size: 13, color: '#8a6a2a' }); txt(x, e.labelText, 14, 56, { size: 21, weight: 700, color: '#3a2a10' }); txt(x, '— 主人 0:56', W - 14, 76, { size: 12, color: '#8a6a2a', align: 'right' });
    x.restore();
  }
}
/** The label's rectangle on the glass (for stage12: it comes apart with the bottle). */
export function labelRect(F) {
  const e = one(F, 'cornerbottle'), c = one(F, 'calm'); if (!e || !c) return null;
  const g = bottleGeom(F, c.glass), W = 330 * 1.6 * g.sc, H = 86 * 1.6 * g.sc;
  return { x: g.bx - W / 2, y: g.top + 470 * g.sc - H / 2, w: W, h: H };
}

// ---------------------------------------------------------------- the long LOVE shakes everything; his cursor leaves
export function trillAmp(e, t) {
  if (!e.trill || t < e.trill || t > e.trillEnd) return 0;
  return (1 + 3 * Math.min(prog(t, e.trill, e.trill + 0.6), 1 - prog(t, e.trillEnd - 1.6, e.trillEnd))) * (0.6 + 0.4 * Math.abs(Math.sin(TAU * 4 * (t - e.trill))));
}
export function trillAt(F, t) {
  const e = one(F, 'redline'); if (!e || !e.trill || t < e.trill || t > e.trillEnd) return null;
  const a = trillAmp(e, t);
  return { dx: Math.sin(TAU * 4 * (t - e.trill)) * a, dy: Math.cos(TAU * 4 * (t - e.trill) * 1.3) * a * 0.5 };
}
export function heartCursorAt(F, t) {
  const e = one(F, 'redline'), k0 = one(F, 'redheart'); if (!e || !k0 || t < k0.t || t > e.free + 1.0) return null;
  const rest = { x: 1496 + Math.sin(t * 0.7) * 2, y: 640 + Math.sin(t * 0.9) * 3 };
  if (t < e.free) return rest;
  const [gx, gy] = heartAt(0), k1 = easeInOut(prog(t, e.free, e.free + 0.5)), k2 = easeIn(prog(t, e.free + 0.5, e.free + 0.95));
  return { x: lerp(rest.x, gx, k1), y: lerp(rest.y, gy, k1) - (STG.y + 120) * k2 };
}
