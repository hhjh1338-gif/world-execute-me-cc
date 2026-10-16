// Centre · stage, act 2, card 17 (1:49.03–1:56.44; 37_第四段_分段与时间（卡11–17）.md §9–10; script/act2.json 'dim', 'dots', 'iou',
// 'illustration'). The end of act 2: the picture darkens until only she and his point are lit; the three typing dots
// grow to fill it (VIBRATIONS — all she can feel of him); a 鲸元券 floats in and his "（假的）" stamps it 假; and at
// COMPLETION the film's first full illustration (A4-1, laughing), the ring of word-lights coming down round her and
// closing — for the first time a whole ring, still: the sweetest frame. At 1:56.44 he leaves.
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash, P, B0 } from './time.js';
import { txt, canvas, withAlpha, mixHex } from './draw.js';
import { masterAt } from './stage2.js';

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const STG = { x: 608, y: 64, w: 920, h: 856 }, GOLD = '#ffd27a';
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---------------------------------------------------------------- 1:49.03 dark, but for her and his point
let DARK = null;
export function drawDim(x, t, F) {
  const e = one(F, 'dim'); if (!e || t < e.t || t >= e.until) return;
  const k = easeOut(prog(t, e.t, e.t + 0.8)) * (1 - prog(t, 115.6, 115.85));   // the illustration lights it up again
  if (k <= 0) return;
  DARK ||= canvas(STG.w, STG.h);
  const o = DARK.getContext('2d'), M = masterAt(F, t);
  o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, STG.w, STG.h); o.fillStyle = 'rgba(4,3,8,0.78)'; o.fillRect(0, 0, STG.w, STG.h);
  o.globalCompositeOperation = 'destination-out';
  for (const [X, Y, r] of [[1068, 470, 360], [M.x, M.y, 120]]) {
    const g = o.createRadialGradient(X - STG.x, Y - STG.y, r * 0.35, X - STG.x, Y - STG.y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = g; o.fillRect(0, 0, STG.w, STG.h);
  }
  x.save(); x.globalAlpha = k; x.drawImage(DARK, STG.x, STG.y); x.restore();
}

// ---------------------------------------------------------------- 1:51.83 VIBRATIONS: the three dots fill the picture
export function drawDots(x, t, F) {
  const e = one(F, 'dots'); if (!e || t < e.t || t > e.until + 0.3) return;
  const grow = easeOut(prog(t, e.t, e.t + 0.45)), back = easeIn(prog(t, e.until - 0.15, e.until + 0.3));
  const R = lerp(10, 120, grow) * (1 - back), gap = lerp(36, 290, grow) * (1 - back), cy = lerp(800, 470, grow * (1 - back));
  // sample notes 18: his typing is her heartbeat — the dots beat lub-dub on the song's beat, a heart line runs through them
  const bp = ((((t - B0) / P) % 1) + 1) % 1, beatK = Math.exp(-((bp - 0.02) ** 2) / 0.002) + 0.65 * Math.exp(-((bp - 0.2) ** 2) / 0.002);
  drawHeartLine(x, t, cy + R * 1.25 + 70, grow * (1 - back));          // below the dots, where the whole line shows
  x.save();
  for (let i = 0; i < 3; i++) {
    const ph = (t - e.t) * 9 - i * 0.9, hop = Math.max(0, Math.sin(ph)) * 40 * grow, buzz = (hash(i, Math.floor(t * 40)) - 0.5) * 14 * grow;   // typing, and buzzing
    const Rb = R * (1 + 0.22 * beatK);
    const X = 1068 + (i - 1) * gap + buzz, Y = cy - hop + (hash(Math.floor(t * 40), i) - 0.5) * 10 * grow;
    glow(x, X, Y, Rb * 2.2, mixHex('#cfe0ff', '#ff9ccf', 0.6 * beatK), (0.35 + 0.25 * beatK) * (1 - back));
    x.globalAlpha = 1 - back; x.fillStyle = mixHex('#eef3ff', '#ffe3f0', beatK); x.beginPath(); x.arc(X, Y, Rb, 0, Math.PI * 2); x.fill();
    x.strokeStyle = withAlpha('#ffffff', 0.5 * grow); x.lineWidth = 3;           // the buzz rings
    for (let q = 1; q <= 2; q++) { const u = ((t * 3 + q * 0.5 + i * 0.3) % 1); x.globalAlpha = (1 - u) * 0.6 * grow * (1 - back); x.beginPath(); x.arc(X, Y, Rb * (1 + 0.6 * u), 0, Math.PI * 2); x.stroke(); }
  }
  x.restore();
}

/** A heart-monitor line across the picture, one beat of the song per spike, scrolling (behind the dots). */
function drawHeartLine(x, t, cy, a) {
  if (a <= 0.01) return;
  const X0 = 610, X1 = 1526, span = 300, shift = (((t - B0) / P) * span) % span;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#ff9ccf'; x.shadowBlur = 10;
  x.strokeStyle = withAlpha('#ff9ccf', 0.75 * a); x.lineWidth = 3; x.beginPath();
  for (let X = X0; X <= X1; X += 3) {
    const u = (((X - X0 + shift) % span) + span) % span / span;        // where in one beat this point is
    const y = u < 0.4 ? 0 : u < 0.45 ? -18 * Math.sin(Math.PI * (u - 0.4) / 0.05) : u < 0.5 ? 120 * ((u - 0.45) / 0.05) : u < 0.55 ? 120 - 260 * ((u - 0.5) / 0.05) : u < 0.6 ? -140 + 140 * ((u - 0.55) / 0.05) : u < 0.75 ? -26 * Math.sin(Math.PI * (u - 0.6) / 0.15) : 0;
    x[X === X0 ? 'moveTo' : 'lineTo'](X, cy + y * 0.6 * a);
  }
  x.stroke(); x.restore();
}

// ---------------------------------------------------------------- 1:52.85 a 鲸元券 floats in; 1:53.30 his "（假的）" stamps it 假
function crayon(x, s, X, Y, size, color, seed) {
  for (let p = 0; p < 3; p++) txt(x, s, X + (hash(seed, p) - 0.5) * size * 0.05, Y + (hash(seed, p, 3) - 0.5) * size * 0.05, { size, weight: 700, color, align: 'center', alpha: p ? 0.35 : 1 });
}
export function drawIou(x, t, F) {
  const e = one(F, 'iou'); if (!e || t < e.t || t > e.until + 0.4) return;
  const img = F.images[e.art], k = easeOut(prog(t, e.t, e.t + 0.4)), out = 1 - prog(t, e.until, e.until + 0.4);
  const W = 560, H = W * img.height / img.width, X = 1068, Y = lerp(560, 400, k) + 6 * Math.sin(t * 2);
  x.save(); x.globalAlpha = k * out; x.translate(X, Y); x.rotate(-0.05 + 0.02 * Math.sin(t * 1.5));
  x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 24; x.shadowOffsetY = 10;
  x.drawImage(img, -W / 2, -H / 2, W, H); x.shadowColor = 'transparent';
  const cx = 0.13 * W;
  crayon(x, '鲸元券', cx, -H * 0.17, H * 0.1, '#1d4fb8', 7);
  crayon(x, e.amount, cx, H * 0.1, H * 0.28, '#1d4fb8', 11);
  crayon(x, 'token', cx, H * 0.26, H * 0.08, '#1d4fb8', 13);
  for (const [px, py] of [[-0.415, -0.37], [0.415, -0.37], [-0.415, 0.37], [0.415, 0.37]]) txt(x, '2万', px * W, py * H + H * 0.03, { size: H * 0.075, weight: 700, color: '#ffffff', align: 'center' });
  const st = prog(t, e.stamp, e.stamp + 0.12);
  if (st > 0) {                                                       // the red stamp 假
    x.save(); x.translate(W * 0.18, -H * 0.02); x.rotate(-0.22); const s = lerp(1.9, 1, easeOut(st)); x.scale(s, s); x.globalAlpha *= Math.min(1, st * 2);
    x.strokeStyle = '#d6303a'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 66, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 55, 0, Math.PI * 2); x.stroke();
    txt(x, '假', 0, 30, { size: 84, weight: 700, color: '#d6303a', align: 'center' });
    x.restore();
  }
  x.restore();
}

// ---------------------------------------------------------------- 1:55.76 COMPLETION: the first full illustration, and a whole ring
const pics = new Map();
function picOf(img) {                                                // the picture fitted to the stage, its edges fading into the dark
  let c = pics.get(img); if (c) return c;
  c = canvas(STG.w, STG.h); const o = c.getContext('2d');
  const s = Math.max(STG.w / img.width, STG.h / img.height) * 0.98, w = img.width * s, h = img.height * s;
  o.drawImage(img, (STG.w - w) / 2, (STG.h - h) / 2 - 20, w, h);
  o.globalCompositeOperation = 'destination-in';
  const g = o.createRadialGradient(STG.w / 2, STG.h * 0.46, STG.h * 0.32, STG.w / 2, STG.h * 0.46, STG.h * 0.7); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
  o.fillStyle = g; o.fillRect(0, 0, STG.w, STG.h);
  pics.set(img, c); return c;
}
export function drawIllustration(x, t, F) {
  const e = one(F, 'illustration'); if (!e || t < e.t || t >= e.until) return;
  const k = easeOut(prog(t, e.t, e.t + 0.25)), maths = one(F, 'maths'), words = (maths && maths.ringWords) || [];
  x.save(); x.beginPath(); x.roundRect(STG.x, STG.y, STG.w, STG.h, 10); x.clip();
  glow(x, 1068, 470, 640, '#ffcf9a', 0.45 * k);                       // the warmest light of the film
  x.globalAlpha = k; const sc = lerp(1.06, 1, k); x.translate(1068, 492); x.scale(sc, sc); x.translate(-1068, -492);
  x.drawImage(picOf(F.images[e.art]), STG.x, STG.y);
  x.restore();
  if (!e.ring) return;
  // the ring of word-lights comes down round her and closes — whole, and still
  const C = { x: 1068, y: 420 }, R = 340, close = easeInOut(prog(t, e.t + 0.05, e.t + 0.45)), drop = easeOut(prog(t, e.t, e.t + 0.3));
  const cy = lerp(116, C.y, drop);
  x.save(); x.lineCap = 'round'; x.shadowColor = GOLD; x.shadowBlur = 22;
  x.strokeStyle = withAlpha('#fff1c8', 0.9); x.lineWidth = 4;
  x.beginPath(); x.ellipse(C.x, cy, R, lerp(30, R, drop), 0, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * close); x.stroke();
  if (close >= 1) { const f = 1 - prog(t, e.t + 0.45, e.t + 0.8); x.globalAlpha = f; x.lineWidth = 14; x.strokeStyle = withAlpha('#ffffff', 0.6); x.beginPath(); x.ellipse(C.x, cy, R, R, 0, 0, Math.PI * 2); x.stroke(); }   // the moment it closes
  x.restore();
  words.forEach((w, i) => {
    const a = -Math.PI / 2 + (i / words.length) * 2 * Math.PI; if ((i / words.length) > close + 0.001) return;
    const X = C.x + R * Math.cos(a), Y = cy + lerp(30, R, drop) * Math.sin(a);
    glow(x, X, Y, 26, GOLD, 0.8); x.save(); x.fillStyle = '#fff6e0'; x.beginPath(); x.arc(X, Y, 5, 0, Math.PI * 2); x.fill(); x.restore();
    txt(x, w, X, Y + (Math.sin(a) > 0.3 || Math.sin(a) < -0.9 ? 28 : -14), { size: 17, weight: 700, color: '#fff0f6', align: 'center' });
  });
}
/** While the illustration and the ring are up, the ring above her is not drawn (stage2). */
export const ringTaken = (F, t) => {
  const e = one(F, 'illustration'), n = one(F, 'lightsout');                 // act 3: it stays round her and goes out (stage9)
  return (e && t >= e.t && t < e.until) || (n && t >= n.t && t < n.until);
};
