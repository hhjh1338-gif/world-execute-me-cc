// Centre · stage, act 2, card 15 (1:34.13–1:41.00; 37_第四段_分段与时间（卡11–17）.md §5–6; script/act2.json 'gender', 'sky').
//   1:34.13 the Master's cursor opens her character card's settings: the card flies to the middle, big. The first row is
//   性别 女 ｜ 男; at ≈1:35.9 he switches it to 男 and the picture on the card becomes a boy (C1); the card goes back. On the
//   stage she is the boy (C4, an 'outfit', at her own place on the image wall).
//   1:37.55–1:40.95 a whole day in three seconds: behind her the sky goes from morning to noon, evening and night, a sun
//   dragged across it like a slider (and then a moon).
// Pictures on the card are shown at her current clarity: a mosaic (form 4.0), never the finished picture (17 §8).
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash } from './time.js';
import { box, txt, canvas, withAlpha, mixHex } from './draw.js';
import { drawHer } from './her.js';

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const GOLD = '#ffd27a', BOY = '#6f8fe8';

/** A picture as a mosaic of `cells` columns (cached): her clarity on the card. */
const mosaics = new Map();
export function mosaic(img, crop, cells) {
  const key = `${img.src}|${crop.join(',')}|${cells}`; let c = mosaics.get(key); if (c) return c;
  const rows = Math.round(cells * crop[3] / crop[2]); c = canvas(cells, rows);
  const o = c.getContext('2d'); o.imageSmoothingEnabled = true; o.drawImage(img, crop[0], crop[1], crop[2], crop[3], 0, 0, cells, rows);
  mosaics.set(key, c); return c;
}
const CROP = { A1: [212, 60, 600, 840], C1: [100, 40, 824, 1150] };   // upper body / the bust

// ---------------------------------------------------------------- 1:34.13 the settings card
const CARD = { x: 1068, y: 470, w: 780, h: 520 }, FROM = { x: 1424, y: 270, s: 0.25 };
function pose(e, t) {
  const open = easeOut(prog(t, e.t, e.open)), close = easeIn(prog(t, e.close, e.until));
  const k = open * (1 - close);
  return { k, X: lerp(FROM.x, CARD.x, k), Y: lerp(FROM.y, CARD.y, k), s: lerp(FROM.s, 1, k), a: Math.min(1, open * 3) * (1 - prog(t, e.until - 0.12, e.until)) };
}
/** Where 男 is on the switch, in stage pixels (the cursor aims here). */
const TOGGLE = { dx: 66, dy: -118, w: 200, h: 46 };
export function drawGenderCard(x, t, F) {
  const e = one(F, 'gender'); if (!e || t < e.t || t > e.until) return;
  const p = pose(e, t), sw = easeInOut(prog(t, e.flip, e.flip + 0.18)), W = CARD.w, H = CARD.h;
  if (p.k > 0.05) { x.save(); x.globalAlpha = 0.55 * p.k; x.fillStyle = '#05040a'; x.fillRect(608, 64, 920, 856); x.restore(); }   // the stage dims behind it
  x.save(); x.globalAlpha *= p.a; x.translate(p.X, p.Y); x.scale(p.s, p.s);
  box(x, -W / 2, -H / 2, W, H, 18, { fill: withAlpha('#17121f', 0.97), stroke: withAlpha(sw > 0.5 ? BOY : '#ff7eb6', 0.8), width: 2.5 });
  txt(x, '角色卡 · 设置', -W / 2 + 28, -H / 2 + 42, { size: 20, color: '#c4a9c4' });
  txt(x, '大肥鱼', -W / 2 + 28, -H / 2 + 84, { size: 34, weight: 700, color: '#ffffff' });
  // the picture: her (upper body) → the boy (bust), wiped from the top as the switch goes over
  const PX = -W / 2 + 28, PY = -H / 2 + 108, PW = 250, PH = 350;
  box(x, PX - 4, PY - 4, PW + 8, PH + 8, 10, { fill: '#0c0a12', stroke: withAlpha('#ffffff', 0.15) });
  x.save(); x.beginPath(); x.roundRect(PX, PY, PW, PH, 8); x.clip(); x.imageSmoothingEnabled = false;
  const she = mosaic(F.images.A1, CROP.A1, 36), boy = mosaic(F.images[e.art], CROP.C1, 36), cut = PY + PH * sw;
  x.drawImage(she, PX, PY, PW, PH);
  if (sw > 0) { x.save(); x.beginPath(); x.rect(PX, PY, PW, cut - PY); x.clip(); x.drawImage(boy, PX, PY, PW, PH); x.restore();
    if (sw < 1) { x.fillStyle = 'rgba(200,220,255,0.8)'; x.fillRect(PX, cut - 2, PW, 4); } }
  x.restore();
  // the rows
  const RX = -W / 2 + 310;
  txt(x, '性别', RX, TOGGLE.dy + 6, { size: 22, color: '#c4a9c4' });
  const TX = TOGGLE.dx - TOGGLE.w / 2, TY = TOGGLE.dy - TOGGLE.h / 2 - 8;
  box(x, TX, TY, TOGGLE.w, TOGGLE.h, TOGGLE.h / 2, { fill: '#241c30', stroke: withAlpha('#ffffff', 0.25) });
  const KX = lerp(TX + 4, TX + TOGGLE.w / 2, sw);
  box(x, KX, TY + 4, TOGGLE.w / 2 - 4, TOGGLE.h - 8, (TOGGLE.h - 8) / 2, { fill: mixHex('#ff7eb6', BOY, sw) });
  txt(x, '女', TX + TOGGLE.w / 4, TY + 31, { size: 22, weight: 700, color: sw < 0.5 ? '#ffffff' : '#8a7390', align: 'center' });
  txt(x, '男', TX + 3 * TOGGLE.w / 4, TY + 31, { size: 22, weight: 700, color: sw >= 0.5 ? '#ffffff' : '#8a7390', align: 'center' });
  const rows = [['人设', sw < 0.5 ? '鲸鱼娘 · 撒娇' : '鲸鱼 · 男生'], ['世界书', '深海小酒馆'], ['开场白', '你好呀～我是大肥鱼！']];
  rows.forEach(([k, v], i) => { txt(x, k, RX, -30 + i * 58, { size: 20, color: '#c4a9c4' }); txt(x, v, RX + 110, -30 + i * 58, { size: 22, color: '#f3e9f2' }); });
  x.fillStyle = GOLD; x.beginPath(); x.arc(RX + 6, 150, 6, 0, Math.PI * 2); x.fill();
  txt(x, '主动陪伴：开', RX + 22, 157, { size: 20, color: GOLD });
  if (t >= e.flip && t < e.flip + 0.35) { const f = 1 - prog(t, e.flip, e.flip + 0.35); x.save(); x.globalAlpha = 0.5 * f; box(x, -W / 2, -H / 2, W, H, 18, { fill: '#cfe0ff' }); x.restore(); }
  x.restore();
}
/** The Master's cursor: to the character card (top right), click; to 男, click; away. */
export function genderCursorAt(F, t) {
  const e = one(F, 'gender'); if (!e || t < e.move || t > e.close) return null;
  if (t < e.t + 0.12) { const k = easeInOut(prog(t, e.move, e.t - 0.03)); return { x: lerp(1300, FROM.x, k), y: lerp(560, FROM.y, k), down: t >= e.t && t < e.t + 0.12 }; }
  const p = pose(e, Math.min(t, e.flip + 0.2)), tx = p.X + (TOGGLE.dx + TOGGLE.w / 4) * p.s, ty = p.Y + (TOGGLE.dy - 8) * p.s;
  const k = easeInOut(prog(t, e.open, e.flip - 0.06)), away = easeIn(prog(t, e.flip + 0.15, e.close));
  return { x: lerp(lerp(FROM.x, tx, k), 1480, away), y: lerp(lerp(FROM.y + 40, ty, k), 720, away), down: t >= e.flip && t < e.flip + 0.12 };
}

// ---------------------------------------------------------------- 1:37.55–1:40.95 a day behind her
const SKY = [                                                        // [moment 0..1, top, bottom]
  [0.0, '#8ec5f0', '#e8f4ff'], [0.3, '#4a9ee8', '#cfe8ff'], [0.62, '#f08a4b', '#6b3a6e'], [0.82, '#3a2b63', '#1a1838'], [1.0, '#0b1430', '#18244e'],
];
function skyAt(k) {
  let i = 0; while (i + 1 < SKY.length && SKY[i + 1][0] <= k) i++;
  const a = SKY[i], b = SKY[Math.min(i + 1, SKY.length - 1)], u = b[0] > a[0] ? (k - a[0]) / (b[0] - a[0]) : 0;
  return [mixHex(a[1], b[1], u), mixHex(a[2], b[2], u)];
}
export function drawSky(x, t, F) {
  const e = one(F, 'sky'); if (!e || t < e.t || t > e.until + 0.4) return;
  const a = easeOut(prog(t, e.t, e.t + 0.25)) * (1 - prog(t, e.until, e.until + 0.4)), k = prog(t, e.t, e.until), [top, bot] = skyAt(k);
  x.save(); x.globalAlpha = 0.9 * a;
  const g = x.createLinearGradient(0, 64, 0, 920); g.addColorStop(0, top); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(608, 64, 920, 856);
  // the sun slider: a thin arc track, the sun dragged along it; the moon after dusk
  const C = { x: 1068, y: 900 }, R = 560, ang = Math.PI * (1 - clamp(k / 0.78)), SX = C.x + R * Math.cos(ang), SY = C.y - R * 0.95 * Math.sin(ang);
  x.globalAlpha = 0.35 * a; x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.setLineDash([3, 9]); x.beginPath(); x.ellipse(C.x, C.y, R, R * 0.95, 0, Math.PI, 2 * Math.PI); x.stroke(); x.setLineDash([]);
  if (k < 0.8) {
    const gs = x.createRadialGradient(SX, SY, 0, SX, SY, 90); gs.addColorStop(0, `rgba(255,236,170,${0.9 * a})`); gs.addColorStop(1, 'rgba(255,236,170,0)');
    x.globalAlpha = 1; x.fillStyle = gs; x.fillRect(SX - 90, SY - 90, 180, 180);
    x.fillStyle = k > 0.55 ? '#ffb070' : '#fff6d0'; x.globalAlpha = a; x.beginPath(); x.arc(SX, SY, 26, 0, Math.PI * 2); x.fill();
  } else {
    const mk = easeOut(prog(k, 0.8, 0.95)), MX = 1330, MY = 200;
    x.globalAlpha = a * mk; x.fillStyle = '#f3efd8'; x.beginPath(); x.arc(MX, MY, 24, 0, Math.PI * 2); x.fill();
    x.fillStyle = top; x.beginPath(); x.arc(MX + 10, MY - 6, 21, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 40; i++) { x.globalAlpha = a * mk * (0.4 + 0.6 * hash(i, Math.floor(t * 4))); x.fillStyle = '#ffffff'; x.fillRect(620 + hash(i, 1) * 900, 80 + hash(i, 2) * 420, 2, 2); }
  }
  x.restore();
}

// ---------------------------------------------------------------- card 15: the boy is alive (user 10-14: not a statue)
const herMsgs = (F) => F.by('chat').filter((m) => m.type === 'her');
const lands = (m) => (m.typeKeys ? m.typeKeys[m.typeKeys.length - 1][0] : m.typeUntil ?? m.t);
/** His moves at t: a slow breathing sway; a nod and a little hop when one of his messages lands; a small lean toward each
 *  of the Master's; a laughing shake at 哈哈哈. Returned as drawHer options (spin, shift, squash). */
export function boyMoves(F, t, o, m) {
  let rot = 0.012 * Math.sin((t - o.t) * 1.7), dx = 0, dy = 0, sq = m.squash ?? 1;
  for (const msg of F.by('chat')) {
    if (msg.t < o.t || msg.t > t || msg.t < t - 0.6) continue;
    const u = t - (msg.type === 'her' ? lands(msg) : msg.t); if (u < 0 || u > 0.5) continue;
    if (msg.type === 'her') {
      const hop = Math.sin(Math.PI * clamp(u / 0.3));
      dy -= 16 * hop; sq += 0.035 * hop; rot += 0.03 * Math.sin(Math.PI * clamp(u / 0.4));   // a nod
      if (/哈哈/.test(msg.text)) { dx += 6 * Math.sin(u * 60) * (1 - u / 0.5); dy += 3 * Math.sin(u * 47); }
    } else if (msg.type === 'master') rot -= 0.035 * Math.sin(Math.PI * clamp(u / 0.45));   // a lean toward the Master
  }
  return { spin: rot, shift: { x: dx, y: dy }, squash: sq };
}
/** His bubbles at （吐个泡泡） and a glint sliding across his glasses (drawn over him). */
export function drawBoyFx(x, t, F) {
  const o = F.by('stage').find((e) => e.type === 'outfit' && e.alive && t >= e.t && t < e.until); if (!o) return;
  for (const msg of herMsgs(F)) {
    if (msg.t < o.t || !/泡泡/.test(msg.text)) continue;
    const t0 = lands(msg);
    [[0, 11, 0], [0.18, 15, 16], [0.4, 9, -12]].forEach(([d, r, ddx]) => {
      const k = prog(t, t0 + d, t0 + d + 1.4); if (k <= 0 || k >= 1) return;
      const X = 1150 + ddx + 6 * Math.sin((t + d) * 5), Y = 520 - 240 * easeOut(k);
      x.save(); x.globalAlpha = 1 - k; x.strokeStyle = '#9fc3ff'; x.lineWidth = 2; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.18, 0, Math.PI * 2); x.fill(); x.restore();
    });
  }
  const sky = F.by('stage').find((e) => e.type === 'sky');            // the light changes: a glint runs over his glasses
  const glints = [o.t + 0.5, ...(sky ? [sky.t + 0.9, sky.t + 2.2] : [])];
  for (const g of glints) {
    const k = prog(t, g, g + 0.35); if (k <= 0 || k >= 1) continue;
    const X = lerp(985, 1175, k);
    x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = Math.sin(Math.PI * k) * 0.9;
    const gr = x.createLinearGradient(X - 22, 0, X + 22, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(X - 14, 384); x.lineTo(X + 22, 384); x.lineTo(X + 8, 420); x.lineTo(X - 28, 420); x.closePath(); x.fill();
    x.restore();
  }
}

// ---------------------------------------------------------------- card 16: posters (1:41.84–1:44.89) and the daze (–1:49.03)
// Printed like a two-colour poster (red-black for S, blue-black for M): never the finished picture, a print of it.
const INKS = { warm: ['#1a0508', '#7a1520', '#e0453f', '#fbe6cc'], cold: ['#05070d', '#1d2c48', '#5f7fb3', '#e3ebf6'] };
const prints = new Map();
function printOf(img, tone) {
  const key = img.src + tone; let c = prints.get(key); if (c) return c;
  const W = 400, H = 600; c = canvas(W, H); const o = c.getContext('2d');
  const s = Math.min(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
  o.drawImage(img, (W - w) / 2, H - h, w, h);
  const d = o.getImageData(0, 0, W, H), p = d.data, ink = INKS[tone].map((hx) => [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16)));
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = (y * W + X) * 4; if (p[i + 3] < 100) { p[i + 3] = 0; continue; }
    const L = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, dot = ((X >> 1) + (y >> 1)) % 2 === 0;   // a dot screen in the mid tones
    const lv = L < 0.16 ? 0 : L < 0.34 ? (dot ? 0 : 1) : L < 0.52 ? 1 : L < 0.7 ? (dot ? 1 : 2) : L < 0.84 ? 2 : 3;
    p[i] = ink[lv][0]; p[i + 1] = ink[lv][1]; p[i + 2] = ink[lv][2]; p[i + 3] = 255;
  }
  o.putImageData(d, 0, 0); prints.set(key, c); return c;
}
/** A print drawn low-angle (wider at the feet: seen from below), bottom at (cx, bottom), height H. */
function lowAngle(x, src, cx, bottom, H, { alpha = 1, k = 0.22 } = {}) {
  const W = H * src.width / src.height, N = 36;
  x.save(); x.globalAlpha *= alpha;
  for (let j = 0; j < N; j++) {
    const u0 = j / N, sc = lerp(1 - k, 1 + k * 0.4, u0), sy = src.height * u0, sh = src.height / N + 1;
    x.drawImage(src, 0, sy, src.width, sh, cx - (W * sc) / 2, bottom - H + H * u0, W * sc, H / N + 1);
  }
  x.restore();
}
const posters = (F) => F.by('stage').filter((e) => e.type === 'poster');
const STG = { x: 608, y: 64, w: 920, h: 856 };
/** Sample notes 16: the posters are spokes of one big wheel turning round a point below the picture — each change swings
 *  the old figure out to the left and the next one up from the right (no hard cut); the poster's big words stay behind the
 *  figure; going in, the boy's half-body picture blurs and stays behind for a moment. */
const PIVOT = { x: 1068, y: 1560 }, RIM = 590, STEP = 0.7;           // radians between spokes
const wheelEvents = (F) => posters(F).concat(F.by('stage').filter((e) => e.type === 'daze'));
/** How far the wheel has turned at t (0 = the first poster upright). */
function wheelAt(F, t) {
  const ps = posters(F); if (!ps.length) return 0;
  let w = -STEP * (1 - easeOut(prog(t, ps[0].t, ps[0].t + 0.4)));   // the first one swings up from the right
  for (let i = 1; i < ps.length; i++) w += STEP * easeInOut(prog(t, ps[i].t - 0.05, ps[i].t + 0.35));
  return w;
}
function onWheel(x, theta, fn) {
  x.save(); x.translate(PIVOT.x, PIVOT.y); x.rotate(theta); fn(); x.restore();
}
function drawFigure(x, F, e, theta, a, { H = 900, base = RIM - 60 } = {}) {   // one spoke: the print standing on the rim, its sign with it
  if (Math.abs(theta) > 1.25 || a <= 0) return;
  onWheel(x, theta, () => {
    lowAngle(x, printOf(F.images[e.art], e.tone), 0, -base, H, { alpha: a });   // a little lower than before (sample notes 16)
    if (e.sign) {
      x.save(); x.globalAlpha *= a; x.translate(0, -RIM - 760);
      const ink = INKS[e.tone];
      x.strokeStyle = ink[3]; x.lineWidth = 2; x.beginPath(); x.moveTo(-150, -50); x.lineTo(-110, -18); x.moveTo(150, -50); x.lineTo(110, -18); x.stroke();
      box(x, -190, -20, 380, 74, 8, { fill: ink[3], stroke: ink[1], width: 4 });
      txt(x, e.sign, 0, 28, { size: 30, weight: 700, color: ink[1], align: 'center' });
      x.restore();
    }
  });
}
function wheelPaper(x, F, t, w) {
  const ps = posters(F), cold = ps.findIndex((e) => e.tone === 'cold'), ck = cold < 0 ? 0 : clamp((w - STEP * (cold - 0.5)) / (STEP * 0.5));
  for (const [tone, a] of [['warm', 1 - ck], ['cold', ck]]) {
    if (a <= 0.01) continue;
    const ink = INKS[tone];
    x.save(); x.globalAlpha *= a; x.fillStyle = ink[0]; x.fillRect(STG.x, STG.y, STG.w, STG.h);
    x.translate(PIVOT.x, PIVOT.y); x.rotate(-w * 0.6);                // the rays turn with the wheel
    for (let i = 0; i < 36; i++) { x.fillStyle = withAlpha(ink[1], i % 2 ? 0.55 : 0.25); x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 2400, (i / 36) * Math.PI * 2, ((i + 1) / 36) * Math.PI * 2); x.closePath(); x.fill(); }
    x.restore();
  }
}
/** How much the posters and the daze hide her figure (stage1). */
export function posterHide(F, t) {
  const ps = posters(F), dz = F.by('stage').find((e) => e.type === 'daze'); if (!ps.length || t < ps[0].t) return 0;
  return dz ? 1 - prog(t, dz.her, dz.her + 0.4) : (t < ps[ps.length - 1].until ? 1 : 0);
}
export function drawPosters(x, t, F, S) {
  const ps = posters(F); if (!ps.length || t < ps[0].t || t >= ps[ps.length - 1].until) return;
  const w = wheelAt(F, t), first = ps[0], into = easeOut(prog(t, first.t, first.t + 0.3));
  x.save(); x.beginPath(); x.roundRect(STG.x, STG.y, STG.w, STG.h, 10); x.clip();
  x.save(); x.globalAlpha = into; wheelPaper(x, F, t, w); x.restore();
  // going in: the boy's half-body picture, blurred, stays behind a moment (sample notes 16)
  const bk = 1 - prog(t, first.t + 0.1, first.t + 1.1);
  if (bk > 0) { x.save(); x.translate(1068, 520); x.scale(1.12, 1.12); x.translate(-1068, -520); drawHer(x, t, S.H, { costume: 'C1', f: 4.5, fadeBottom: true, alpha: 0.55 * bk, filter: 'blur(7px)', still: true }); x.restore(); }
  // the big words of the first poster, behind the figure; they go as the wheel turns on
  if (first.big) {
    const ink = INKS[first.tone], ta = into * (1 - clamp(Math.abs(w) / STEP));
    x.save(); x.globalAlpha = ta; x.shadowColor = ink[1]; x.shadowOffsetX = 8; x.shadowOffsetY = 8;
    txt(x, first.big, 1068, 196, { size: 88, weight: 700, color: ink[3], align: 'center' });
    x.shadowOffsetX = 4; x.shadowOffsetY = 4; txt(x, first.small, 1068, 252, { size: 36, weight: 700, mono: true, color: ink[2], align: 'center', spacing: 6 });
    x.restore();
  }
  ps.forEach((e, i) => drawFigure(x, F, e, i * STEP - w, 1));
  const cold = ps.find((e) => e.tone === 'cold');                     // M: the shadow pressing down from above
  if (cold && t >= cold.t) { const sh = x.createLinearGradient(0, STG.y, 0, STG.y + 420); sh.addColorStop(0, `rgba(0,0,0,${0.6 * easeOut(prog(t, cold.t, cold.t + 0.4))})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sh; x.fillRect(STG.x, STG.y, STG.w, 420); }
  x.restore();
}
/** 1:44.89–1:49.03 (sample notes 17): the boy, the girl with the whip and the puppet stay full size and go round like a
 *  carousel on the wheel — slowly at first, then faster and faster, leaving reflections behind them — and as they spin the
 *  circle closes, the three reflections fold into one, and she is herself again. */
function dazeSpin(e, u) {                                              // how far the carousel has turned, u seconds in
  const T = e.align - e.t, a = 1.6, b = (13 - a) / (3 * T * T);          // speed 1.6 → 13 rad/s
  return a * u + b * u * u * u;
}
export function drawDaze(x, t, F) {
  const e = F.by('stage').find((v) => v.type === 'daze'); if (!e || t < e.t || t > e.her + 0.5) return;
  const ps = posters(F), w0 = wheelAt(F, e.t), out = 1 - prog(t, e.her, e.her + 0.45);
  const into = easeInOut(prog(t, e.t, e.t + 0.6)), close = easeInOut(prog(t, e.align - 1.3, e.align)), R = 0.42 * (1 - close);
  x.save(); x.beginPath(); x.roundRect(STG.x, STG.y, STG.w, STG.h, 10); x.clip();
  const haze = x.createLinearGradient(0, STG.y, 0, STG.y + STG.h); haze.addColorStop(0, `rgba(40,26,52,${0.85 * out})`); haze.addColorStop(1, `rgba(14,10,22,${0.85 * out})`);
  x.fillStyle = haze; x.fillRect(STG.x, STG.y, STG.w, STG.h);
  const at = (tt) => {                                                  // each figure: spoke angle and depth at time tt
    const u = Math.max(0, tt - e.t), ph = dazeSpin(e, Math.min(u, e.align - e.t)), Rk = 0.42 * (1 - easeInOut(prog(tt, e.align - 1.3, e.align)));
    return e.arts.map((art, i) => {
      const a = ph + (i * 2 * Math.PI) / 3 - (2 * Math.PI) / 3, carousel = Rk * Math.sin(a), from = i * STEP - w0;
      return { art, i, theta: lerp(from, carousel, easeInOut(prog(tt, e.t, e.t + 0.6))), depth: Math.cos(a) };
    });
  };
  const speed = (dazeSpin(e, Math.min(t - e.t + 0.02, e.align - e.t)) - dazeSpin(e, Math.min(t - e.t, e.align - e.t))) / 0.02;
  // reflections: where they were a moment ago, fainter, more of them the faster it spins
  const trails = speed > 3 && close < 0.95 ? [0.05, 0.1, 0.16] : [];
  for (const [k, dt] of trails.entries()) {
    for (const f of at(t - dt).sort((p, q) => p.depth - q.depth)) {
      const p = ps.find((v) => v.art === f.art) || { art: f.art, tone: 'warm' };
      drawFigure(x, F, { ...p, sign: null }, f.theta, 0.22 / (k + 1) * clamp((speed - 3) / 5) * (1 - close) * out);
    }
  }
  for (const f of at(t).sort((p, q) => p.depth - q.depth)) {            // the back one first, the front one last
    const p = ps.find((v) => v.art === f.art) || { art: f.art, tone: 'warm' };
    const a = lerp(1, lerp(0.45, 1, (f.depth + 1) / 2), into * (1 - close)) * lerp(1, 0.55, close);   // as one, each is a third of her
    drawFigure(x, F, { ...p, sign: null }, f.theta, a * out);
  }
  x.restore();
}
export { printOf };   // act 4 card 24: the poster flashes behind her again
