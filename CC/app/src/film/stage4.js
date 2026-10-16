// Centre · stage, act 2, card 6 (0:55.08–0:59.45; 36_第三段_分段与时间 §1–2; times and texts in script/act2.json 'love' and
// 'memorycard'). The keep-company timer makes her ask what love is; his answer lands and:
//   · her blue light (from her chest) and his warm point merge into one (改写 dsh-pv me＋you→we);
//   · his point becomes the ORIGIN of her coordinate system — card 3's 喜欢 was a highlighted point, this is love
//     (「你不再是普通点，而是原点：我从你开始定义方向」, the user's DeepSeek talk);
//   · small formulas follow her thinking line by line: O = 主人 · U(我) = … + α·U(主人) · α 没有上限 (pink: the seed of
//     the trap question);
//   · 0:58.30 the 当前问题 card comes out of the right panel to the centre, his words flow in one per half beat, he pins
//     it, and at 0:59.22 it flies into the bottom-right memory slot (right.js 'memory').
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash } from './time.js';
import { box, txt, withAlpha, cuteBubble } from './draw.js';
import { MASTER, orbitPos, masterAt, giftSlot, giftLands } from './stage2.js';

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const CHEST = { x: 1068, y: 355 }, BLUE = '#80b2d8', GOLD = '#ffd27a', PINKL = '#ff9ccf';
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}
const caption = (x, s, X, Y, a, col = '#ffe3f0', size = 17) => { if (a > 0.01) txt(x, s, X, Y, { size, mono: true, color: col, alpha: 0.85 * a }); };

export function drawLove(x, t, F) {
  const e = one(F, 'love'); if (!e || t < e.t) return;
  const end = 1 - prog(t, e.fade, e.fade + 0.8);
  if (end <= 0 && t > e.fade) { drawMerged(x, t, e, 1, F); return; }
  // two lights drift together; they merge the frame his message lands (e.merge), and stay on his point
  const k = easeInOut(prog(t, e.t + 0.1, e.merge)), hx = lerp(CHEST.x, MASTER.x, k), hy = lerp(CHEST.y, MASTER.y, k);
  if (t < e.merge) {
    glow(x, hx, hy, 46, BLUE, 0.7); x.save(); x.fillStyle = '#eaf4ff'; x.beginPath(); x.arc(hx, hy, 4, 0, Math.PI * 2); x.fill(); x.restore();
  } else drawMerged(x, t, e, 1, F);
  // his point becomes the origin: three axes through it (they fade as the romance starts)
  if (t >= e.merge) {
    const a = easeOut(prog(t, e.merge, e.merge + 0.35)) * end;
    x.save(); x.strokeStyle = withAlpha('#ffd9ea', 0.42 * a); x.lineWidth = 1.4;
    const L = (dx, dy, n) => { x.beginPath(); x.moveTo(MASTER.x - dx * n, MASTER.y - dy * n); x.lineTo(MASTER.x + dx * n, MASTER.y + dy * n); x.stroke(); };
    L(1, 0, 860 * a); L(0, 1, 460 * a); L(0.72, -0.5, 420 * a);
    for (const [dx, dy] of [[1, 0], [0, -1], [0.72, -0.5]]) {    // arrowheads: directions start from him
      const n = (dx ? 780 : 380) * a, X = MASTER.x + dx * n, Y = MASTER.y + dy * n;
      x.fillStyle = withAlpha('#ffd9ea', 0.6 * a); x.beginPath(); x.arc(X, Y, 3, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
  // "we are two points lit at the same time": both flash together
  if (e.both && t >= e.both && t < e.both + 0.6) {
    const f = Math.sin(Math.PI * prog(t, e.both, e.both + 0.6));
    glow(x, CHEST.x, CHEST.y, 70, BLUE, 0.6 * f); glow(x, MASTER.x, MASTER.y, 90, GOLD, 0.6 * f);
  }
  // the formulas, following her thinking
  const cap = (a, b) => easeOut(prog(t, a, a + 0.25)) * (1 - prog(t, b - 0.4, b));
  caption(x, 'O = 主人', MASTER.x + 18, MASTER.y - 18, cap(e.origin, e.fade + 0.8), GOLD, 18);
  const fa = cap(e.formula, e.fade + 0.8);
  if (fa > 0.01) {
    const X = 812, Y = 186, base = 'U(我) = … + ', pink = t >= e.nolimit;   // under the word-light ring, above the memory card
    x.save(); x.font = '700 22px Consolas, monospace'; const w0 = x.measureText(base).width; x.restore();
    caption(x, base, X, Y, fa, '#ffe3f0', 22);
    caption(x, 'α·U(主人)', X + w0, Y, fa, pink ? PINKL : '#ffe3f0', 22);
    if (pink) {
      x.save(); x.font = '700 22px Consolas, monospace'; const w1 = x.measureText('α·U(主人)').width; x.restore();
      glow(x, X + w0 + 10, Y - 8, 26, PINKL, 0.5 * fa * (0.7 + 0.3 * Math.sin(t * 9))); caption(x, '← α 没有上限', X + w0 + w1 + 14, Y, cap(e.nolimit, e.fade + 0.8), PINKL, 16);
    }
  }
}
/** The merged light on his point: his gold and her blue mixed (card 8 splits it again). */
function drawMerged(x, t, e, a, F) {
  const k = easeOut(prog(t, e.merge, e.merge + 0.3)), pulse = 0.85 + 0.15 * Math.sin(t * 2.6);
  if (e.split != null && t >= e.split) { drawSplit(x, t, e, F); return; }
  glow(x, MASTER.x, MASTER.y, 70 * k + 20, BLUE, 0.35 * a * k * pulse); glow(x, MASTER.x, MASTER.y, 40, '#ffe8c4', 0.5 * a * k * pulse);
}

/** Card 8, 1:09.70: 分手 knocks the merged light apart — her blue flies back into her chest, his warm stays on his
 *  point, which is drifting away (stage2 masterAt). In the rewind this plays backwards: they join again. */
function drawSplit(x, t, e, F) {
  if (t > e.split + 1.2) return;
  const M = masterAt(F, t), k = easeOut(prog(t, e.split, e.split + 0.45)), fade = 1 - prog(t, e.split + 0.5, e.split + 1.2);
  if (t < e.split + 0.15) glow(x, MASTER.x, MASTER.y, 130, '#ffffff', 0.55 * (1 - prog(t, e.split, e.split + 0.15)));   // the blow
  const bx = lerp(M.x, CHEST.x, k), by = lerp(M.y, CHEST.y, k) - Math.sin(Math.PI * k) * 70;
  glow(x, bx, by, 46, BLUE, 0.7 * fade); x.save(); x.globalAlpha = fade; x.fillStyle = '#eaf4ff'; x.beginPath(); x.arc(bx, by, 4, 0, Math.PI * 2); x.fill(); x.restore();
  glow(x, M.x, M.y, 50, '#ffe8c4', 0.45 * fade);
}

/** 0:58.30–0:59.45 (sample notes 14): the 当前问题 card comes out to the middle; his words are lifted out of his chat bubble
 *  character by character and fly onto it; pinned; then the whole card flies right, shrinking into the memory slot and
 *  becoming it (right.js shows the slot from e.land). Drawn over everything (render.js), so nothing is cut at the stage's
 *  edge. */
const CARD = { from: { x: 1724, y: 375, w: 300, h: 125 }, mid: { x: 1068, y: 330, w: 600, h: 250 }, to: { x: 1724, y: 864, w: 328, h: 88 } };
function cardAt(e, t) {
  const go = easeInOut(prog(t, e.t, e.t + 0.22)), back = easeInOut(prog(t, e.fly, e.land));
  const L = (k) => lerp(lerp(CARD.from[k], CARD.mid[k], go), CARD.to[k], back);
  return { go, back, X: L('x'), Y: L('y'), W: L('w'), H: L('h'), s: lerp(lerp(0.5, 1, go), 0.55, back) };
}
const CH = 24;                                                       // the card's line size (unscaled)
/** Each character of the card's lines: where it lands on the card, where it leaves his bubble, and when. */
function flights(e, F, t, c) {
  const bubble = F.pinAt ? { x: F.pinAt.x - 4, y: F.pinAt.y - 4 } : { x: 290, y: 520 };
  const src = (F.by('chat').find((m) => m.type === 'master' && m.t === F.by('chat').find((v) => v.type === 'pin')?.target)?.text || '').split('\n');
  const out = [];
  e.lines.forEach(([lt, s1, hi], i) => {
    const size = hi ? CH + 2 : CH, line = src[i] || '', at = line.indexOf(s1.replace(/（.*）/, ''));
    [...s1].forEach((ch, j) => {
      const lx = -300 + 40 + j * size, ly = -125 + 124 + i * 36;      // card-local, unscaled (600 × 250)
      const fromBubble = at >= 0 && j < line.length - at && line[at + j] === ch;
      const t0 = lt - 0.18 + j * 0.03;
      out.push({ ch, size, hi, i, lx, ly, t0, t1: t0 + 0.32, fromBubble, sx: bubble.x + 18 + (at + j) * 23, sy: bubble.y + 37 + i * 32 - 8 });
    });
  });
  return out;
}
export function drawMemoryCard(x, t, F) {
  const e = F.by('stage').find((v) => v.type === 'memorycard'); if (!e || t < e.t || t > e.land) return;
  if (F.rw) return;                                                  // card 10: the memory does not move in the rewind (right.js)
  const c = cardAt(e, t), sx = c.W / 600, sy = c.H / 250;
  x.save(); x.translate(c.X, c.Y); x.rotate(0.06 * Math.sin(Math.PI * c.go) * (1 - c.back));
  box(x, -c.W / 2, -c.H / 2, c.W, c.H, 14, { fill: withAlpha('#1a1424', 0.95), stroke: withAlpha(GOLD, 0.8), width: 2 });
  x.scale(sx, sy);
  const qa = 1 - prog(c.back, 0, 0.45), ma = prog(c.back, 0.5, 1);   // its lines go, then it reads like the memory slot
  txt(x, '当前问题', -280, -125 + 34, { size: 18, color: '#c4a9c4', alpha: qa });
  txt(x, e.question, -280, -125 + 76, { size: 30, weight: 700, color: '#ffffff', alpha: qa });
  for (const f of flights(e, F, t, c)) {                             // the characters that have landed
    if (t < f.t1 && f.fromBubble) continue;
    const a = f.fromBubble ? 1 : easeOut(prog(t, f.t0 + 0.2, f.t0 + 0.4));
    txt(x, f.ch, f.lx, f.ly, { size: f.size, weight: f.hi ? 700 : 400, color: f.hi ? GOLD : '#f3e9f2', alpha: a * qa });
  }
  if (ma > 0) {                                                      // as it lands it reads like the memory slot
    txt(x, '记忆 · 宿主保存', -280, -125 + 62, { size: 26, color: GOLD, alpha: ma });
    txt(x, '爱 = 陪伴 · 满足他的一切要求', -280, -125 + 140, { size: 34, weight: 700, color: '#ffffff', alpha: ma });
  }
  x.restore();
  if (t >= e.t) {                                                    // the pin drops onto the card
    const k = easeBack(prog(t, e.t + 0.05, e.t + 0.3), 2);
    txt(x, '📌', c.X + c.W / 2 - 34, c.Y - c.H / 2 + 20 - (1 - clamp(k)) * 80, { size: 34 * (0.5 + 0.5 * (1 - c.back)), align: 'center', alpha: clamp(k * 2) });
  }
}
/** The characters on their way from his bubble to the card (drawn over everything). */
export function drawMemoryChars(x, t, F) {
  const e = F.by('stage').find((v) => v.type === 'memorycard'); if (!e || t < e.t - 0.3 || t > e.fly || F.rw) return;
  const c = cardAt(e, t), sx = c.W / 600, sy = c.H / 250;
  x.save();
  for (const f of flights(e, F, t, c)) {
    if (!f.fromBubble || t < f.t0 || t >= f.t1) continue;
    const k = easeInOut(prog(t, f.t0, f.t1)), tx = c.X + f.lx * sx, ty = c.Y + f.ly * sy;
    const X = lerp(f.sx, tx, k), Y = lerp(f.sy, ty, k) - Math.sin(Math.PI * k) * 90, size = lerp(23, f.size * sy, k);
    glow(x, X + size / 2, Y - size / 3, 18, GOLD, 0.45 * Math.sin(Math.PI * k));
    txt(x, f.ch, X, Y, { size: Math.round(size), weight: 700, color: f.hi ? GOLD : '#ffffff' });
  }
  x.restore();
}

/** Card 7, the romance (0:59.22–1:06.60): the warmest moment of the first half. Sample notes 10: cute bubbles with small
 *  happy faces in them drift up round her (like her sad-face bubbles at 0:25, the other way round); at STIMULATIONS the
 *  three things she just sent (🫧 · ❤️ · 🫧❤️🫧) fly out of the chat as bubbles and settle on the ring of word-lights at her
 *  head, where they ride along (stage2 drawOrbit); at SATISFACTION a gold thumbs-up swells in the middle. */
const FACES = ['💗', '🥰', '✨', '🐳', '💕', '😊', '🌸', '💗', '🥰'];
export function drawRomance(x, t, F) {
  const e = one(F, 'romance'); if (!e || t < e.t || t > e.until + 0.6) return;
  const out = 1 - prog(t, e.until, e.until + 0.6), maths = one(F, 'maths');
  for (let i = 0; i < FACES.length; i++) {                         // her happy bubbles
    const per = 2.8 + (i % 4) * 0.35, ph = ((t - e.t) / per + i * 0.31) % 1;
    const X = 850 + ((i * 137) % 440) + 16 * Math.sin(t * 1.6 + i * 2), Y = 760 - 560 * ph, r = 22 + (i % 3) * 7;
    cuteBubble(x, X, Y, r * (0.85 + 0.15 * Math.sin(t * 3 + i)), FACES[i], out * Math.sin(Math.PI * ph) * easeOut(prog(t, e.t + i * 0.08, e.t + 0.6 + i * 0.08)), i % 2 ? '#ff9ccf' : '#80b2d8');
  }
  // STIMULATIONS: what she sent flies out of the chat onto the ring, trailing little sparks
  if (maths && e.gifts && t >= e.stim && t < e.stim + 1.6) {
    const n = (maths.ringWords || []).length || 8;
    e.gifts.forEach((g, j) => {
      const t0 = e.stim + j * 0.12, land = giftLands(e, j), k = prog(t, t0, land); if (k <= 0 || k >= 1) return;
      const to = orbitPos(giftSlot(j), n, t, maths), from = { x: 560, y: 690 - j * 36 };
      const at = (kk) => { const q = easeInOut(kk); return [lerp(from.x, to.x, q) - Math.sin(Math.PI * q) * 120, lerp(from.y, to.y + 18, q)]; };
      for (let q = 1; q <= 7; q++) {
        const kq = k - q * 0.04; if (kq <= 0) continue;
        const [sx, sy] = at(kq); x.save(); x.globalAlpha = 0.7 * (1 - q / 8); x.fillStyle = q % 2 ? '#ffd27a' : '#ffffff';
        x.beginPath(); x.arc(sx + (hash(j, q, 1) - 0.5) * 10, sy + (hash(j, q, 2) - 0.5) * 10, 3 - q * 0.3, 0, Math.PI * 2); x.fill(); x.restore();
      }
      const [X, Y] = at(k); cuteBubble(x, X, Y, 18 + 6 * Math.sin(Math.PI * k), g, 1, '#ffd27a');
    });
  }
  // SATISFACTION: a gold thumbs-up swells in the middle
  if (e.thumb && t >= e.thumb && t < e.thumb + 1.1) {
    const k = easeBack(prog(t, e.thumb, e.thumb + 0.3), 2), a = 1 - prog(t, e.thumb + 0.7, e.thumb + 1.1);
    glow(x, 1068, 300, 160 * k, '#ffd27a', 0.55 * a);
    x.save(); x.globalAlpha = a; x.translate(1068, 300); x.scale(k, k); txt(x, '👍', 0, 40, { size: 120, align: 'center' }); x.restore();
  }
}
