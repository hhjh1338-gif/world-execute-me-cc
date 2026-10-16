// Centre · stage, act 2, cards 8–9 (1:06.20–1:13.918; 36_第三段_分段与时间（卡6–10）.md §5–7; times and texts in
// script/act2.json 'shadow', 'program', 'breakup', 'redden', 'windows').
//   Card 8: the warm light she looks up into, and her shadow lengthening on the floor while she thinks. At EXECUTION the
//   middle darkens into a band, a three-line program slides down it, its pointer one line per half beat, and an arrow
//   shoots out of the last line: 分手 grows out of it, built of 0/1, noise and 分手 itself, trembling, bigger and bigger,
//   and smashes what is round her (the word-lights fall as blocks and go out one by one: stage2 drawOrbit; the merged
//   light is knocked apart: stage4; his point drifts away, the gap stretched: stage2 masterAt). From 1:10.08 the
//   picture turns dizzy and red seeps in from the edges.
//   Card 9: the chat window is copied twice onto the stage — one quietly says 我同意。我离开。, the other cannot stop
//   writing 怎么办？ and breaks its window; both shed blocks; at SIMULATION they become a wall of windows, each a
//   "what if", 怎么办？ still running in every one. All of it freezes at the click (1:13.918) and plays backwards in
//   the rewind (rewind.js), because it is drawn from the story time alone.
import { prog, easeOut, easeIn, easeInOut, lerp, clamp, rng, hash } from './time.js';
import { box, txt, font, canvas, withAlpha, fallGlyphs, graphemes, SC } from './draw.js';
const STAGE = { x: 608, y: 64, w: 920, h: 856 };                  // as stage1.js (not imported: stage1 imports this file)

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const COLD = '#c9d6e6', COLD2 = '#8fa3b8', RED = '#ff4a5a';
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---------------------------------------------------------------- card 8 · her shadow (drawn before her)
export function drawShadow(x, t, F) {
  const e = one(F, 'shadow'); if (!e || t < e.t || t >= e.until) return;
  const up = easeOut(prog(t, e.t, e.grow)) * (1 - prog(t, e.long - 0.2, e.long + 0.05));
  glow(x, 1110, 70, 380, '#ffd9b0', 0.16 * up);                      // the warm light she looks up into
  const L = lerp(60, 330, easeIn(prog(t, e.grow, e.long))) + 140 * easeOut(prog(t, e.long, e.until));
  const a = easeOut(prog(t, e.grow, e.grow + 0.4));
  x.save(); x.filter = 'blur(7px)'; x.globalAlpha = 0.85 * a;
  const fx = 1068, fy = 860, g = x.createLinearGradient(fx, fy, fx - L, fy - L * 0.16);
  g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath();
  x.moveTo(fx + 70, fy + 6); x.lineTo(fx - 80, fy + 10); x.lineTo(fx - L - 50, fy - L * 0.16 - 6); x.lineTo(fx - L + 60, fy - L * 0.16 - 30); x.closePath(); x.fill();
  x.restore();
}

// ---------------------------------------------------------------- card 8 · the program
const PROG = { y0: 232, h: 176, x: 700 };
export function drawProgram(x, t, F, pal) {
  const e = one(F, 'program'); if (!e || t < e.t) return;
  const gone = prog(t, e.until + 0.4, e.until + 0.9); if (gone >= 1) return;
  const band = easeOut(prog(t, e.t, e.t + 0.08));
  x.save(); x.globalAlpha = band * (1 - gone);
  x.fillStyle = 'rgba(3,5,9,0.74)'; x.fillRect(STAGE.x, PROG.y0, STAGE.w, PROG.h);
  x.fillStyle = withAlpha(COLD2, 0.5); x.fillRect(STAGE.x, PROG.y0, STAGE.w, 1); x.fillRect(STAGE.x, PROG.y0 + PROG.h, STAGE.w, 1);
  x.restore();
  const slide = easeOut(prog(t, e.t + 0.02, e.t + 0.16)), cur = e.ptr.filter((p) => t >= p).length - 1;
  const lineY = (i) => PROG.y0 + 52 + i * 46 - (1 - slide) * 46;
  x.save(); x.globalAlpha = slide;
  e.lines.forEach((s, i) => {
    const Y = lineY(i), on = i === cur, size = 25;
    if (t >= e.until) { fallGlyphs(x, s, PROG.x, Y, t, e.until, { size, mono: true, color: on ? COLD : COLD2, seed: 40 + i, delay: 0, spread: 0.35, shake: 1.5 }); return; }
    const parts = i === 2 ? s.split('分手') : [s];                     // the last line's 分手 stands out
    let X = PROG.x;
    parts.forEach((p, j) => {
      txt(x, p, X, Y, { size, mono: true, color: on ? '#eef3f8' : COLD2 }); x.font = font(size, { mono: true }); X += x.measureText(p).width;
      if (j < parts.length - 1) { txt(x, '分手', X, Y, { size, mono: true, weight: 700, color: '#ffffff' }); X += x.measureText('分手').width; }
    });
  });
  // the pointer: one line per half beat
  if (cur >= 0 && t < e.until) {
    const from = cur > 0 ? lineY(cur - 1) : lineY(0), k = easeOut(prog(t, e.ptr[cur], e.ptr[cur] + 0.08)), Y = lerp(from, lineY(cur), k);
    txt(x, '▶', PROG.x - 30, Y, { size: 22, mono: true, color: '#ffffff' });
  }
  x.restore();
  // the arrow out of the last line, down to where 分手 grows
  const a0 = e.ptr[2];
  if (t >= a0 && t < e.until + 0.3) {
    x.font = font(25, { mono: true }); const X0 = PROG.x + x.measureText(e.lines[2]).width + 16, Y0 = lineY(2) - 8;
    const k = easeOut(prog(t, a0, a0 + 0.1)), X1 = lerp(X0, 1068, k), Y1 = lerp(Y0, 590, k), fade = 1 - prog(t, e.until, e.until + 0.3);
    x.save(); x.globalAlpha = fade; x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(X0, Y0); x.quadraticCurveTo(X0 + 60, Y0 + 90, X1, Y1); x.stroke();
    if (k > 0.2) { const ang = Math.atan2(Y1 - Y0 - 60, X1 - X0 - 40); x.translate(X1, Y1); x.rotate(ang); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(8, 0); x.lineTo(-8, -7); x.lineTo(-8, 7); x.closePath(); x.fill(); }
    x.restore();
  }
}

// ---------------------------------------------------------------- card 8 · 分手, built of characters
const POOL = '01分手01#%@&?分手10$▓分手';
let WORD = null;
function wordPoints(word) {
  if (WORD && WORD.word === word) return WORD.pts;
  const W = 600, H = 300, c = canvas(W, H), o = c.getContext('2d');
  o.font = `700 260px "Noto Sans SC", sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff'; o.fillText(word, W / 2, H / 2 + 8);
  const d = o.getImageData(0, 0, W, H).data, r = rng(81), pts = [];
  for (let y = 0; y < H; y += 8) for (let X = 0; X < W; X += 8) if (d[(y * W + X) * 4 + 3] > 120) pts.push({ x: X - W / 2, y: y - H / 2, ch: POOL[Math.floor(r() * POOL.length)], s: r(), u: r() });
  WORD = { word, pts }; return pts;
}
const WORD_AT = { x: 1068, y: 590 };
export function drawBreakup(x, t, F) {
  const e = one(F, 'breakup'); if (!e || t < e.t || t >= e.until) return;
  const pts = wordPoints(e.word), grow = lerp(0.85, 1.6, prog(t, e.t + 0.1, e.until) ** 0.8), red = prog(t, e.out, e.until), tick = Math.floor(t * 30);
  const size = Math.round(11 * grow + 3), back = easeOut(prog(t, e.t, e.t + 0.2));
  glow(x, WORD_AT.x, WORD_AT.y, 340 * grow, '#03060a', 0.6 * back);          // a dark ground so it reads over her
  x.save(); x.font = font(size, { mono: true, weight: 700 }); x.textAlign = 'center'; x.textBaseline = 'middle';
  pts.forEach((p, i) => {
    const k = easeOut(prog(t, e.t + p.s * 0.12, e.t + 0.1 + p.s * 0.12));   // out of the arrow's tip into place
    if (k <= 0) return;
    const shake = 2 + 3 * grow, X = lerp(WORD_AT.x, WORD_AT.x + p.x * grow, k) + (hash(i, tick) - 0.5) * shake, Y = lerp(WORD_AT.y, WORD_AT.y + p.y * grow, k) + (hash(tick, i) - 0.5) * shake;
    const ch = hash(i, Math.floor(t * 12)) < 0.18 ? POOL[Math.floor(hash(i, tick, 3) * POOL.length)] : p.ch;
    x.globalAlpha = 0.95; x.fillStyle = p.u < red * 0.55 ? RED : p.u < 0.6 ? '#eef3f8' : COLD;
    x.fillText(ch, X, Y);
  });
  // what it knocks off: character blocks falling from round it
  for (let j = 0; j < 70; j++) {
    const born = e.t + 0.05 + hash(j, 2) * (e.until - e.t - 0.3), dt = t - born; if (dt < 0 || dt > 1.1) continue;
    const ang = hash(j, 3) * Math.PI * 2, X = WORD_AT.x + Math.cos(ang) * 300 * grow * (0.6 + 0.4 * hash(j, 4)) + (hash(j, 5) - 0.5) * 80 * dt;
    const Y = WORD_AT.y + Math.sin(ang) * 140 * grow + 700 * dt * dt;
    x.globalAlpha = 0.8 * (1 - dt / 1.1); x.fillStyle = hash(j, 6) < red ? RED : COLD2;
    x.fillRect(X - 6, Y - 7, 12, 14); x.fillStyle = '#0b0f14'; x.fillText(POOL[j % POOL.length], X, Y + 1);
  }
  x.restore();
}

// ---------------------------------------------------------------- card 9 · two windows, then a wall of them
const WIN = { w: 380, h: 500, y: 452, lx: 852, rx: 1284 }, CHAT = { x: 304, y: 492 };
function miniWindow(x, cx, cy, w, h, t, { label, temp, pal, crack = 0, alpha = 1 }) {
  x.save(); x.globalAlpha *= alpha;
  box(x, cx - w / 2, cy - h / 2, w, h, 10, { fill: withAlpha(pal.panel, 0.96), stroke: pal.line, width: 1.5 });
  const hh = Math.max(18, h * 0.08);
  x.fillStyle = withAlpha(pal.raised, 1); x.fillRect(cx - w / 2 + 1, cy - h / 2 + 1, w - 2, hh);
  const fs = Math.max(10, Math.round(hh * 0.55));
  txt(x, (w > 200 ? '大肥鱼  ' : '') + label, cx - w / 2 + 10, cy - h / 2 + hh * 0.7, { size: fs, color: pal.text });   // small ones: just 「如果 #n」
  txt(x, temp, cx + w / 2 - 10, cy - h / 2 + hh * 0.7, { size: fs, mono: true, color: hash(Math.floor(t * 11), cx) < 0.5 ? RED : COLD, align: 'right' });
  if (crack > 0) {                                                   // the bottom edge gives way
    x.strokeStyle = withAlpha('#e8eef5', 0.7 * crack); x.lineWidth = 1.5; x.beginPath();
    const Y = cy + h / 2;
    for (const [a, b] of [[-0.3, 0.1], [0.05, 0.22], [0.3, 0.08]]) { x.moveTo(cx + a * w, Y); x.lineTo(cx + (a + 0.06) * w, Y - b * h * crack); x.lineTo(cx + (a - 0.02) * w, Y - (b + 0.08) * h * crack); }
    x.stroke();
  }
  x.restore();
}
function shed(x, cx, cy, w, h, t, t0, seed, pal, n = 40) {         // blocks peeling off a window and falling
  for (let j = 0; j < n; j++) {
    const born = t0 + 0.15 + hash(seed, j) * 1.5, dt = t - born; if (dt < 0 || dt > 1) continue;
    const X = cx + (hash(seed, j, 2) - 0.5) * w + (hash(seed, j, 3) - 0.5) * 60 * dt, Y = cy + (hash(seed, j, 4) - 0.5) * h + 620 * dt * dt;
    x.save(); x.globalAlpha = 0.85 * (1 - dt); x.fillStyle = hash(seed, j, 5) < 0.3 ? withAlpha(RED, 0.8) : pal.raised;
    x.fillRect(X - 7, Y - 5, 14 + 10 * hash(seed, j, 6), 10); x.restore();
  }
}
export function drawWindows(x, t, F, pal) {
  const e = one(F, 'windows'); if (!e || t < e.t || t >= e.until) return;
  const out = easeOut(prog(t, e.t, e.t + 0.22)), wall = prog(t, e.wall, e.wall + 0.3), tick = Math.floor(t * 11);
  const temp = (i) => (hash(tick, i) < 0.5 ? 'temp 2.00' : 'temp 0.10');
  if (wall < 1) {
    const a = 1 - wall, s = lerp(0.45, 1, out);
    for (const [side, X] of [['l', WIN.lx], ['r', WIN.rx]]) {
      const cx = lerp(CHAT.x, X, out), cy = lerp(CHAT.y, WIN.y, out), w = WIN.w * s, h = WIN.h * s;
      const n = side === 'r' ? 1 + Math.floor(Math.max(0, t - e.t) / 0.06) : 0;
      const over = side === 'r' ? clamp((n * 40 + 60 - (WIN.h - 70)) / 120) : 0;
      miniWindow(x, cx, cy, w, h, t, { label: side === 'l' ? '‹ 1/2 ›' : '‹ 2/2 ›', temp: temp(side === 'l' ? 1 : 2), pal, crack: over, alpha: a });
      x.save(); x.globalAlpha *= a; x.beginPath(); x.rect(cx - w / 2, cy - h / 2 + 30 * s, w, h + (side === 'r' ? 400 : 0)); x.clip();
      if (side === 'l') {                                             // quiet: it stays readable until SIMULATION
        box(x, cx - w / 2 + 24 * s, cy - 40 * s, w - 48 * s, 84 * s, 14, { fill: pal.herBubble });
        if (t < e.readable) txt(x, e.left, cx, cy + 14 * s, { size: Math.round(30 * s), weight: 700, color: pal.text, align: 'center' });
        else { x.font = font(Math.round(30 * s), { weight: 700 }); const w0 = x.measureText(e.left).width; fallGlyphs(x, e.left, cx - w0 / 2, cy + 14 * s, t, e.readable, { size: Math.round(30 * s), weight: 700, color: pal.text, seed: 7, delay: 0, spread: 0.25 }); }
      } else {                                                        // 怎么办？ one line after another, past the window's edge
        const bh = (n * 40 + 30) * s;
        box(x, cx - w / 2 + 24 * s, cy - h / 2 + 50 * s, w - 48 * s, bh, 14, { fill: pal.herBubble, stroke: withAlpha(RED, 0.4) });
        for (let i = 0; i < n; i++) txt(x, e.right, cx - w / 2 + 44 * s, cy - h / 2 + 50 * s + (i * 40 + 42) * s, { size: Math.round(26 * s), color: i === n - 1 ? '#ffffff' : pal.text, alpha: 0.6 + 0.4 * (i === n - 1) });
      }
      x.restore();
      shed(x, cx, cy, w, h, t, e.t, side === 'l' ? 3 : 4, pal);
    }
  }
  // SIMULATION: a wall of windows, every one a "what if"; 怎么办？ still running in each
  if (t >= e.wall) {
    const C = 6, R = 4, cw = 136, ch = 100, gap = 10, W0 = C * cw + (C - 1) * gap, H0 = R * ch + (R - 1) * gap;
    for (let i = 0; i < C * R; i++) {
      const c = i % C, r = Math.floor(i / C), d = hash(i, 31) * 0.15, k = easeOut(prog(t, e.wall + d, e.wall + 0.28 + d)); if (k <= 0) continue;
      const tx = 1068 - W0 / 2 + c * (cw + gap) + cw / 2, ty = 470 - H0 / 2 + r * (ch + gap) + ch / 2, ox = c < C / 2 ? WIN.lx : WIN.rx;
      const cx = lerp(ox, tx, k), cy = lerp(WIN.y, ty, k), w = lerp(WIN.w * 0.5, cw, k), h = lerp(WIN.h * 0.5, ch, k);
      miniWindow(x, cx, cy, w, h, t, { label: `如果 #${i + 1}`, temp: temp(i + 3).replace('temp ', ''), pal });
      // sample notes 11: full of 怎么办？ (it keeps writing), now and then a line turns to garbage
      const m = 2 + Math.floor(hash(i, Math.floor(t * 9)) * 3);
      x.save(); x.beginPath(); x.rect(cx - w / 2, cy - h / 2 + 18, w, h - 18); x.clip();
      for (let j = 0; j < m; j++) {
        const junk = hash(i, j, Math.floor(t * 7)) < 0.18, s1 = junk ? graphemes(e.right).map((g, q) => POOL[Math.floor(hash(i, j, q, Math.floor(t * 12)) * POOL.length)]).join('') : e.right;
        txt(x, s1, cx - w / 2 + 10, cy - h / 2 + 34 + j * 19, { size: 15, mono: junk, color: junk ? RED : j === m - 1 ? '#ffffff' : pal.sub });
      }
      x.restore();
    }
    // …and the characters start to fall out of the windows — a light rain, not a flood (sample notes 11)
    x.save(); x.textAlign = 'center';
    const chars = graphemes(e.right);
    for (let q = 0; q < 30; q++) {
      const born = e.wall + 0.15 + hash(q, 51) * 0.62, dt = t - born; if (dt < 0 || dt > 1.1) continue;
      const i = Math.floor(hash(q, 52) * C * R), c = i % C, r = Math.floor(i / C);
      const X0 = 1068 - W0 / 2 + c * (cw + gap) + 12 + hash(q, 53) * (cw - 24), Y0 = 470 - H0 / 2 + r * (ch + gap) + 30 + hash(q, 54) * (ch - 40);
      const junk = hash(q, 55) < 0.25, g = junk ? POOL[Math.floor(hash(q, 56, Math.floor(t * 10)) * POOL.length)] : chars[Math.floor(hash(q, 57) * chars.length)];
      x.save(); x.globalAlpha = 1 - clamp(dt / 1.1); x.translate(X0 + (hash(q, 58) - 0.5) * 70 * dt, Y0 + 520 * dt * dt + 20 * dt); x.rotate((hash(q, 59) - 0.5) * 4 * dt);
      txt(x, g, 0, 0, { size: Math.round(17 + 9 * hash(q, 60)), weight: 700, mono: junk, color: junk ? RED : '#ffffff', align: 'center' });
      x.restore();
    }
    x.restore();
  }
}

// ---------------------------------------------------------------- 1:10.08 on: dizzy, red seeping in (over the whole frame)
export function drawFrameFx(x, t, F) {
  const e = one(F, 'redden'); if (!e || t < e.t || t >= e.until) return;
  const k = easeOut(prog(t, e.t, e.t + 1.4)), tick = Math.floor(t * 20);
  for (let i = 0; i < 5; i++) {                                     // dizzy: slices of the stage slip sideways
    if (hash(tick, i) > 0.5) continue;
    const Y = STAGE.y + hash(tick, i, 2) * (STAGE.h - 40), h = 8 + hash(tick, i, 3) * 34, dx = (hash(tick, i, 4) - 0.5) * 50 * k;
    x.drawImage(x.canvas, STAGE.x * SC, Y * SC, STAGE.w * SC, h * SC, STAGE.x + dx, Y, STAGE.w, h);   // (source in device pixels: 4K export)
  }
  const g = x.createRadialGradient(960, 520, 360, 960, 520, 1150);
  g.addColorStop(0, 'rgba(214,48,58,0)'); g.addColorStop(1, `rgba(214,48,58,${0.4 * k * (0.85 + 0.15 * Math.sin(t * 7))})`);
  x.fillStyle = g; x.fillRect(0, 0, 1920, 1080);
}
