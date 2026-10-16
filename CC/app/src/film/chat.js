// Left · chat (17_制作规范.md §12; card 1–2): never covered, Chinese, DeepSeek-like. Three phases, all from script events:
//   empty  — grey frame, "未连接模型", no avatar (card 1, 0:00.10)
//   list   — the tavern's character list: "＋ 新建角色…" → "大肥鱼" with ONE blue pixel in the avatar cell (her seed),
//            which spreads into noise at INITIALIZATION; the Master's cursor clicks 开始聊天 and the seed flies off
//   chat   — header, messages, deep thinking, stickers, spam and its withdrawal, the input box the Master types into
// Every frame is computed from t alone (scrolling included), so seeking and playing give the same picture.
import { clamp, prog, easeOut, easeIn, easeInOut, easeBack, lerp, beat, P, hash, T } from './time.js';
import { box, txt, font, wrapSegs, drawSegs, graphemes, withAlpha, canvas, forkIcon, fallGlyphs, mixHex, fullCanvas } from './draw.js';
import { PINK, GOLD, ORANGE } from './palette.js';
import { contextAt } from './right.js';
import { floatOf } from './stage9.js';
import { fit, flatColour } from '../forms.js';
import { avatarAt } from './her.js';
import { mosaic } from './stage7.js';

export const PANEL = { x: 24, y: 64, w: 560, h: 856 };
const TOP = 158, BOTTOM = 826, INPUT = { x: 44, y: 836, w: 520, h: 64 };
export const SEED = { x: 84, y: 214 };                     // the avatar cell's centre in the character list
const BUTTON = { x: 44, y: 836, w: 520, h: 64 };           // "开始聊天" sits where the input box will be
const HER_X = 82, HER_W = 460, MASTER_W = 420, GAP = 12, IMG = { w: 200, h: 120 };
const SW = 232, FLOOD_LH = 17, FLOOD_ROWS = 12, RED = '#ff5a64';  // card 9: each swipe candidate's width; card 8: the red flood
// type sizes (sample notes 1 and 2: readable on a phone); line heights go with them
const SZ = { body: 23, bodyLH: 32, think: 17, thinkLH: 25, thinkHead: 16, spam: 21, system: 18, grey: 16, stamp: 14,
  input: 22, hint: 21, name: 24, sub: 16, listTitle: 22, listSub: 15, item: 23, itemName: 24, itemSub: 16, button: 23 };

export function initChat(F) {
  const A3 = F.images.A3, head = [A3.width * 0.07, 0, A3.width * 0.86, A3.width * 0.86];
  const flat = flatColour(fit(A3, 160, 160, { crop: head, pad: 0 }), { scale: 0.45, blur: 1, lines: 0.9 });
  const circle = (src, d) => { const c = canvas(d, d), o = c.getContext('2d'); o.beginPath(); o.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2); o.clip(); o.drawImage(src, 0, 0, d, d); return c; };
  return { avatar: circle(flat, 52), avatarSmall: circle(flat, 30) };
}

// ---------------------------------------------------------------- the message list at time t
/** How many characters of her message are typed at t: evenly until typeUntil, or by typeKeys [[time, count], ...] (card 8:
 *  「只要你开心，我就」 waits, and 「执行。」 lands on EXECUTION). */
function typed(e, t, n) {
  if (e.preset) return n;
  const K = e.typeKeys;
  if (K) { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) return Math.ceil(lerp(K[i - 1][1], K[i][1], prog(t, K[i - 1][0], K[i][0]))); return n; }
  return e.typeUntil == null ? n : Math.ceil(prog(t, e.t, e.typeUntil) * n);
}
/** Card 10: after the rewind lets go, the chat from 0:28.65 to 1:19.46 has been moved into the branch (F.cut, render.js). */
const cutAt = (F, t, real = F.rw ? F.rw.t : t) => (F.cut && real >= F.cut.at ? F.cut : null);
/** Card 16 (1:41.84–1:44.60): how far the chat has swapped sides — she is the user (right, blue), he the AI (left). */
export function swapK(F, t) {
  const s = F.by('chat').find((e) => e.type === 'swap'); if (!s || t < s.t) return 0;
  return easeInOut(prog(t, s.t, s.t + 0.25)) * (1 - easeInOut(prog(t, s.back, s.back + 0.25)));
}

function items(F, t, x, real) {                                 // real: the frame's film time (the scroll samples a moment back)
  const ev = F.by('chat'), out = [];
  const withdraw = ev.find((e) => e.type === 'withdraw'), cut = cutAt(F, t, real);
  const tr = ev.find((e) => e.type === 'truncate'), gone = tr && (real ?? (F.rw ? F.rw.t : t)) >= tr.t + 0.15 ? tr : null;   // card 19: act 1 cut off
  const st = ev.find((e) => e.type === 'stale');
  const nc = ev.find((e) => e.type === 'newchat' && (real ?? t) >= e.t);   // card 27: a new conversation, with V5.0
  for (const e of ev) {
    if (nc && e.t < nc.t && e.type !== 'header') continue;
    if (cut && e.t > cut.from && e.t < cut.to) continue;
    if (gone && e.t < gone.before && e.type !== 'header') continue;
    if (e.type === 'her' && t >= e.t) {
      const g = graphemes(e.text), n = typed(e, t, g.length);
      out.push({ kind: 'her', e, text: g.slice(0, Math.max(1, n)).join(''), typing: n < g.length, born: e.t });
    } else if (e.type === 'master' && t >= e.t) out.push({ kind: 'master', e, text: e.text, born: e.t });
    else if (e.type === 'think' && t >= e.t) out.push({ kind: 'think', e, done: t >= e.t + e.dur, born: e.t });
    else if (e.type === 'spam') {
      // taken back bottom-up in 0.3 s: each bubble turns into a grey line IN ITS OWN SLOT, so nothing above or below
      // moves (sample notes 2: the chat must not jump up and down while she withdraws)
      const wd = withdraw && withdraw.target === 'spam' ? withdraw : null;
      for (let i = 0; i < e.count; i++) {
        const ti = e.t + i * e.every * P; if (t < ti) break;
        const at = wd ? wd.t + ((e.count - 1 - i) / e.count) * wd.dur : 0, gone = wd ? prog(t, at, at + 0.06) : 0;
        out.push({ kind: 'spam', e, wd, text: e.text, born: ti, i, gone });
      }
    } else if (e.type === 'sticker' && t >= e.t) out.push({ kind: 'sticker', e, born: e.t });
    else if (e.type === 'system' && t >= e.t) out.push({ kind: 'system', e, born: e.t });
    else if (e.type === 'summary' && t >= e.t) out.push({ kind: 'summary', e, born: e.t });
    else if (e.type === 'gap' && t >= e.t) out.push({ kind: 'gap', e, born: e.t });   // act 3: the empty time between her messages
    else if (e.type === 'rolecard' && t >= e.t) out.push({ kind: 'rolecard', e, born: e.t });
    else if (e.type === 'tag' && t >= e.t) out.push({ kind: 'tag', e, born: e.t });
    else if (e.type === 'swipe' && t >= e.t) out.push({ kind: 'swipe', e, born: e.t });
    else if (e.type === 'typing' && t >= e.t && t < e.until && !(e.gaps || []).some(([a, b]) => t >= a && t < b)) out.push({ kind: 'typing', e, born: e.t });
  }
  for (const it of out) { measure(x, it, t); if (st && t >= st.t && it.e.t < st.before) it.stale = easeOut(prog(t, st.t, st.t + 0.4)); }
  return out;
}

/** A think segment's tone: pink, grey, or struck out (card 7: 「也找别人 · 常来找我」 crossed out once the think is done). */
const tone = (c, t, e) => (c === 'pink' ? PINK : c === 'grey' ? '#7d7f95' : c === 'strike' ? (t >= e.t + e.dur * 0.75 ? '~#8a7390' : null) : null);
function thinkSegs(it, t) {
  const e = it.e;
  if (!it.done) {                                                // every think writes itself while it runs (sample notes 1)
    const all = graphemes(e.segs.map((s) => s[0]).join('')), n = Math.ceil(prog(t, e.t, e.t + e.dur * 0.9) * all.length);
    let left = n; return e.segs.map(([s, c]) => { const g = graphemes(s), take = Math.max(0, Math.min(g.length, left)); left -= take; return [g.slice(0, take).join(''), tone(c, t, e)]; });
  }
  return e.segs.map(([s, c]) => [s, tone(c, t, e)]);
}

/** Card 8's red think, line i: the card's lines first, then made-up ones from its words (script: the flood think's words —
 *  开心 · 分手 · 为什么 · 怎么办 · 只要你开心 · 我就执行, English and garbage); every line is long enough to run out of the
 *  chat box. A few words keep flickering into garbage. */
const GARBAGE = '▓▒░#%@&$?01ΣΩ≠∞';
function floodLine(e, i, t) {
  const W = e.words || [], parts = [i < e.lines.length ? e.lines[i][1] : W[Math.floor(hash(i, 70) * W.length)]];
  const want = 30 + Math.floor(hash(i, 71) * 34);                 // characters: past the chat's edge (about 24 fit)
  for (let j = 0, n = parts[0].length; n < want && j < 30; j++) { const w = W[Math.floor(hash(i, j, 72) * W.length)]; parts.push(w); n += w.length + 2; }
  const tick = Math.floor(t * 12);
  return parts.map((w, j) => (j && hash(i, j, 73) < 0.14 ? graphemes(w).map((_, q) => GARBAGE[Math.floor(hash(i, j, q, tick) * GARBAGE.length)]).join('') : w)).join('  ');
}

function measure(x, it, t) {
  if (it.kind === 'her') { x.font = font(SZ.body, { mono: !!it.e.mono }); it.lines = wrapSegs(x, [[it.text, null]], HER_W - 36); it.h = Math.max(56, it.lines.length * SZ.bodyLH + 26) + (it.e.react ? 30 : 0); }
  else if (it.kind === 'master') { x.font = font(SZ.body); it.lines = it.text.split(/\n/).flatMap((part) => wrapSegs(x, [[part, null]], MASTER_W - 36)); it.h = it.lines.length * SZ.bodyLH + 26 + 18 + (it.e.image ? IMG.h + 10 : 0); }
  else if (it.kind === 'rolecard') it.h = 58;
  else if (it.kind === 'tag') it.h = 30;
  else if (it.kind === 'think') {
    x.font = font(SZ.think);
    const e = it.e, col = (c) => (c === 'pink' ? PINK : c === 'grey' ? '#7d7f95' : c === 'gold' ? GOLD : c === 'dpink' ? '#d97fa6' : null);
    const typedLine = ([lt, s]) => { const g = graphemes(s), n = Math.ceil(prog(t, lt, lt + 0.35) * g.length); return g.slice(0, Math.max(1, n)).join(''); };
    // sample notes 27: {words} in a line are red; typed out across the pieces
    const typedSegs = (l, base) => {
      const [lt, s] = l, dur = l[3] ?? 0.35;
      const parts = []; s.split(/(\{[^}]*\})/).forEach((p) => { if (!p) return; if (p[0] === '{') parts.push([p.slice(1, -1), '#ff4a5a']); else parts.push([p, base]); });
      let n = Math.max(1, Math.ceil(prog(t, lt, lt + dur) * parts.reduce((a, [q]) => a + graphemes(q).length, 0))); const out = [];
      for (const [q, c] of parts) { if (n <= 0) break; const g = graphemes(q); out.push([g.slice(0, n).join(''), c]); n -= g.length; }
      return out;
    };
    it.pin = null; it.big = []; it.flood = null;
    if (e.flood) {                                               // card 8, 1:10.08: it will not stop — a small chat of its own,
      const L = e.lines, last = L[L.length - 1][0];             // new red lines at the bottom, the old ones scrolling up and away
      it.floodN = t < last ? L.filter((l) => t >= l[0]).length : L.length + (t - last) / e.again;
      it.lines = [];
      it.h = 34 + 12 + Math.min(FLOOD_ROWS, Math.ceil(it.floodN)) * FLOOD_LH + 10;
      return;
    }
    if (e.lines) {                                               // a long think: numbered lines, each at its own time; folds when done
      let shown = it.done && e.fold ? [] : e.lines.filter((l) => t >= l[0]);
      if (e.stick) {                                             // card 8: the pink line (the cause) is pinned at the top of the box
        const pin = shown.find((l) => l[2] === 'pink');
        if (pin) { it.pin = wrapSegs(x, [[typedLine(pin), PINK]], HER_W - 40); it.pinK = easeOut(prog(t, pin[0], pin[0] + 0.2)); shown = shown.filter((l) => l !== pin); }
      }
      const cut = e.spill != null ? e.lines[e.spill][0] : Infinity;
      it.lines = shown.filter((l) => l[0] < cut).flatMap((l) => wrapSegs(x, typedSegs(l, col(l[2])), HER_W - 28));
      if (it.pin && it.lines.length > 3) it.lines = it.lines.slice(-3);   // older lines scroll away under the pinned one
      // from line e.spill on, each line is bigger than the last and spills over the chat's edge (drawn last, unclipped)
      it.big = shown.filter((l) => l[0] >= cut).map((l, j) => ({ s: typedLine(l), size: SZ.think + 4 + 5 * j, dx: 30 * j * j }));
    } else {
      const segs = thinkSegs(it, t);
      it.lines = segs ? wrapSegs(x, segs, HER_W - 28) : [];
    }
    if (!e.open && it.lines.length > 2) it.lines = it.lines.slice(0, 2);
    it.h = 34 + (it.pin ? it.pin.length * SZ.thinkLH + 10 : 0) + (it.lines.length ? it.lines.length * SZ.thinkLH + 8 : 0) + it.big.reduce((s, b) => s + b.size * 0.95, 0) + (it.big.length ? 6 : 0);
  } else if (it.kind === 'swipe') {                              // card 9: her reply split into two real candidates
    const e = it.e; x.font = font(SZ.body);
    const L = graphemes(e.left), nl = Math.ceil(prog(t, e.t, e.leftUntil) * L.length);
    const R = graphemes(e.right), nr = Math.ceil(prog(t, e.t, e.rightUntil) * R.length), more = t > e.rightUntil ? Math.floor((t - e.rightUntil) / e.every) : 0;
    it.left = wrapSegs(x, [[L.slice(0, Math.max(1, nl)).join(''), null]], SW - 32);
    it.right = [...wrapSegs(x, [[R.slice(0, Math.max(1, nr)).join(''), null]], SW - 32), ...Array.from({ length: more }, () => [[e.more, null]])];
    it.typingL = nl < L.length;
    it.h = 26 + Math.max(56, Math.max(it.left.length, it.right.length) * SZ.bodyLH + 26);
  } else if (it.kind === 'spam') it.h = 44;
  else if (it.kind === 'typing') it.h = 40;
  else if (it.kind === 'sticker') it.h = 128;
  else if (it.kind === 'system') it.h = it.e.grey ? 50 : 38;
  else if (it.kind === 'summary') it.h = 100;
  else if (it.kind === 'gap') it.h = 22;
}

const contentH = (list) => list.reduce((s, it) => s + it.h + GAP, 0);
/** Scroll offset: how far the list has moved up so the newest item shows. Each change of the target is eased in and out
 *  over 0.3 s (a bell-weighted average of the target over the last 0.3 s; a pure function of t, no state). */
const SCROLL_K = Array.from({ length: 12 }, (_, k) => Math.sin(Math.PI * (k + 0.5) / 12) ** 2), SCROLL_W = SCROLL_K.reduce((a, b) => a + b, 0);
function scrollAt(F, t, x) {
  let s = 0;
  const real = F.rw ? F.rw.t : t;                                  // after the landing, the moment before is cut too
  SCROLL_K.forEach((w, k) => { s += w * Math.max(0, contentH(items(F, t - k * 0.025, x, real)) - (BOTTOM - TOP)); });
  s /= SCROLL_W;
  // card 9 (1:13.20–1:13.55): the Master scrolls up through it all to 「— 进入 深海小酒馆 —」, a third of the way down
  const go = F.by('chat').find((e) => e.type === 'scrollto');
  if (go && t >= go.t && !cutAt(F, t)) {                        // (after the rewind that scroll is in the branch)
    const target = T(go.target); let y = 0;
    for (const it of items(F, t, x)) { if (it.kind === 'system' && it.e.t === target) break; y += it.h + GAP; }
    s = lerp(s, Math.max(0, y - 250), easeInOut(prog(t, go.t, go.until)));
  }
  const up = F.by('chat').filter((e) => e.type === 'scrollup' && t >= e.t && t < e.down + 0.3).pop();   // the one running now (cards 20, 22, 24)
  if (up && t >= up.t && t < up.down + 0.3) s = Math.max(0, s - 2600 * easeIn(prog(t, up.t, up.until)) * (1 - easeInOut(prog(t, up.until, up.down))));
  return s;
}

// ---------------------------------------------------------------- cards 11–14: role-play skins and avatar marks
const leaf = (x, X, Y, s, col = '#5bbf4a') => { x.save(); x.translate(X, Y); x.fillStyle = col; for (let i = 0; i < 5; i++) { x.rotate(Math.PI * 2 / 5); x.beginPath(); x.ellipse(0, -s, s * 0.5, s, 0, 0, Math.PI * 2); x.fill(); } x.restore(); };
const ears = (x, X0, X1, Y, s, col) => { x.save(); x.fillStyle = col; for (const [X, d] of [[X0, -1], [X1, 1]]) { x.beginPath(); x.moveTo(X - s * 0.7, Y + 2); x.lineTo(X + d * s * 0.15, Y - s); x.lineTo(X + s * 0.7, Y + 2); x.closePath(); x.fill(); } x.restore(); };
/** His request bubble lands as the thing he asked for (card 11: "气泡飞上去，落定时变成一只茄子"). */
const SKIN = {
  eggplant: { fill: '#7B52AB', deco: (x, X, Y, w, h, k) => { x.save(); x.globalAlpha *= k; leaf(x, X + w - 8, Y + 4, 9); x.restore(); } },
  tomato: { fill: '#D7263D', deco: (x, X, Y, w, h, k) => { x.save(); x.globalAlpha *= k; leaf(x, X + w / 2, Y + 2, 7); x.restore(); } },
  cat: { fill: '#E8892B', deco: (x, X, Y, w, h, k) => { x.save(); x.globalAlpha *= k; ears(x, X + 18, X + w - 18, Y + 2, 16, '#E8892B'); x.restore(); } },
  god: { fill: '#E9D9A6', ink: '#3a2a00', deco: (x, X, Y, w, h, k) => { x.save(); x.globalAlpha *= k; x.shadowColor = '#ffd27a'; x.shadowBlur = 10; x.strokeStyle = '#ffd27a'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(X + w / 2, Y - 8, w * 0.32, 6, 0, 0, Math.PI * 2); x.stroke(); x.restore(); } },
};
/** Her avatar while she plays a role (purple, red, cat ears, a halo). */
function avatarMark(x, X, Y, d, t, F) {
  const e = F.by('chat').find((v) => v.type === 'avatar' && t >= v.t && t < v.until); if (!e) return;
  if (e.art) {                                                       // card 15: the boy (C1), at her clarity (a mosaic)
    const img = mosaic(F.images[e.art], [200, 360, 624, 624], 14), k = easeOut(prog(t, e.t, e.t + 0.2));
    x.save(); x.globalAlpha *= k; x.beginPath(); x.arc(X + d / 2, Y + d / 2, d / 2, 0, Math.PI * 2); x.clip(); x.imageSmoothingEnabled = false; x.drawImage(img, X, Y, d, d); x.restore();
    x.save(); x.strokeStyle = '#6f8fe8'; x.lineWidth = Math.max(1.5, d / 18); x.globalAlpha *= k; x.beginPath(); x.arc(X + d / 2, Y + d / 2, d / 2, 0, Math.PI * 2); x.stroke(); x.restore();
    return;
  }
  const k = easeOut(prog(t, e.t, e.t + 0.2)), r = d / 2, cx = X + r, cy = Y + r;
  x.save(); x.globalAlpha *= k;
  const tint = { eggplant: '#7B52AB', tomato: '#D7263D', cat: '#E8892B', god: '#ffd27a' }[e.deco];
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip(); x.globalCompositeOperation = 'multiply'; x.fillStyle = withAlpha(tint, 0.45); x.fillRect(X, Y, d, d); x.restore();
  x.strokeStyle = tint; x.lineWidth = Math.max(1.5, d / 18); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  if (e.deco === 'eggplant' || e.deco === 'tomato') leaf(x, cx, Y + 1, d / 7);
  else if (e.deco === 'cat') ears(x, X + d * 0.22, X + d * 0.78, Y + d * 0.12, d * 0.3, '#E8892B');
  else if (e.deco === 'god') { x.shadowColor = '#ffd27a'; x.shadowBlur = 8; x.beginPath(); x.ellipse(cx, Y - d * 0.06, r * 0.75, d * 0.1, 0, 0, Math.PI * 2); x.stroke(); }
  x.restore();
}

// ---------------------------------------------------------------- drawing
function drawItem(x, it, y, t, pal, A, F) {
  const age = t - it.born, pop = easeOut(prog(age, 0, 0.16));
  x.save(); x.globalAlpha *= pop * (it.stale ? 1 - 0.6 * it.stale : 1);   // card 19: the oldest lines grey before they are cut
  const sw = swapK(F, t);                                       // card 16: the chat swaps sides (she is the user)
  const ty = F.by('chat').find((v) => v.type === 'typing' && t >= v.vibrate && t < v.until);   // card 17: her bubbles tremble with the dots
  if (ty && it.kind === 'her') x.translate((hash(Math.floor(t * 40), it.born) - 0.5) * 5, (hash(it.born, Math.floor(t * 40)) - 0.5) * 3);
  if (it.kind === 'her') {
    if (sw < 1) { x.save(); x.globalAlpha *= 1 - sw; x.drawImage(A.avatarSmall, 44, y + 6, 30, 30); avatarMark(x, 44, y + 6, 30, t, F); x.restore(); }
    const mono = !!it.e.mono;                                   // card 4: at temperature 0.1 she answers like a terminal
    x.font = font(SZ.body, { mono, weight: it.e.bold ? 700 : 400 });
    const w = Math.min(HER_W, Math.max(...it.lines.map((L) => L.reduce((s, p) => s + x.measureText(p[0]).width, 0))) + 36);
    const bh = it.h - (it.e.react ? 30 : 0), BX = lerp(HER_X, 564 - w, sw), ink = sw > 0.5 ? '#ffffff' : pal.text;
    box(x, BX, y, w, bh, mono ? 3 : 14, { fill: mono ? pal.raised : mixHex(pal.herBubble, pal.masterBubble, sw), stroke: mono ? pal.line : null }); it.box = [BX, y, w, bh];
    if (it.e.react) {                                            // card 7: 👍 under her message; he taps it
      const r = it.e.react, on = t >= r.t, k = on ? easeBack(prog(t, r.t, r.t + 0.2), 2.2) : 1;
      A.reactAt = { x: HER_X + 26, y: y + bh + 16 };
      box(x, HER_X + 4, y + bh + 4, 52, 24, 12, { fill: on ? withAlpha(GOLD, 0.25) : pal.raised, stroke: on ? GOLD : pal.line });
      x.save(); x.translate(HER_X + 20, y + bh + 22); x.scale(k, k); txt(x, '👍', 0, 0, { size: 15, align: 'center', alpha: on ? 1 : 0.45 }); x.restore();
      if (on) txt(x, '1', HER_X + 40, y + bh + 21, { size: 13, mono: true, color: GOLD });
    }
    x.font = font(SZ.body, { mono, weight: it.e.bold ? 700 : 400 }); x.textBaseline = 'alphabetic';
    if (it.e.break != null && t >= it.e.break) {                // card 8, 1:10.08: her words shake and fall out one by one
      it.lines.forEach((L, i) => fallGlyphs(x, L.map((p) => p[0]).join(''), HER_X + 18, y + 37 + i * SZ.bodyLH, t, it.e.break, { size: SZ.body, color: pal.text, seed: 11 + i, delay: 0.2, spread: 1.3, shake: 2.5 }));
    } else drawSegs(x, it.lines, BX + 18, y + 37, SZ.bodyLH, ink);
    if (it.typing && Math.floor(t * 3.4) % 2 === 0) {
      const L = it.lines[it.lines.length - 1], lw = L.reduce((s, p) => s + x.measureText(p[0]).width, 0);
      x.fillStyle = pal.accent; x.fillRect(BX + 18 + lw + 2, y + 15 + (it.lines.length - 1) * SZ.bodyLH, 2, 27);
    }
  } else if (it.kind === 'master') {
    x.font = font(SZ.body);
    const w = Math.min(MASTER_W, Math.max(...it.lines.map((L) => L.reduce((s, p) => s + x.measureText(p[0]).width, 0))) + 36);
    const fly = 1 - easeOut(prog(age, 0, 0.2)), dy = fly * (INPUT.y - y);
    const ih = it.e.image ? IMG.h + 10 : 0;
    const bh = it.h - 18 - ih, sk = SKIN[it.e.skin], land = sk ? easeOut(prog(age, 0.16, 0.34)) : 0;   // cards 11–14: the bubble
    const MX = lerp(564 - w, HER_X, sw), mfill = land > 0 ? mixHex(pal.masterBubble, sk.fill, land) : pal.masterBubble;   // card 16: on the AI's side
    box(x, MX, y + dy, w, bh, 14, { fill: mixHex(mfill, pal.herBubble, sw) }); it.box = [MX, y + dy, w, bh];   // lands as what he asked for
    if (land > 0) sk.deco(x, MX, y + dy, w, bh, land);
    const ink = sw > 0.5 ? pal.text : land > 0.5 && sk.ink ? sk.ink : '#ffffff';
    x.fillStyle = ink; drawSegs(x, it.lines, MX + 18, y + dy + 37, SZ.bodyLH, ink);
    if (it.e.image) {                                            // a picture he sends: she is a text model and cannot see it
      const iy = y + dy + it.h - 18 - ih + 10;
      box(x, 564 - IMG.w, iy, IMG.w, IMG.h, 10, { fill: pal.raised, stroke: pal.line });
      txt(x, '🖼', 564 - IMG.w / 2, iy + IMG.h / 2 + 4, { size: 30, align: 'center', alpha: 0.7 });
      txt(x, it.e.image, 564 - IMG.w / 2, iy + IMG.h - 12, { size: 14, color: pal.sub, align: 'center' });
    }
    txt(x, it.e.clock || stamp(it.e.t), 560, y + it.h - 2, { size: SZ.stamp, color: pal.faint, align: 'right', mono: true, alpha: 1 - fly });
    const pin = F.by('chat').find((v) => v.type === 'pin' && v.target === it.e.t && t >= v.t);   // card 6: he pins his own words
    if (pin) { const k = easeBack(prog(t, pin.t, pin.t + 0.2), 2); x.save(); x.translate(564 - w + 4, y + dy + 4); x.scale(k, k); txt(x, '📌', 0, 8, { size: 26, align: 'center' }); x.restore(); txt(x, '已记住', 564 - w - 8, y + dy + 22, { size: 13, color: pal.sub, align: 'right', alpha: clamp(k) }); }
    const pinEv = F.by('chat').find((v) => v.type === 'pin'); if (pinEv && it.e.t === pinEv.target) F.pinAt = A.pinAt = { x: 564 - w + 4, y: y + dy + 4 };   // F.pinAt: card 6's characters leave from here
  } else if (it.kind === 'think') {
    const e = it.e, head = it.done ? `◎ ${e.shown} ${e.open && !e.fold ? '▾' : '▸'}` : `◎ 思考中… ${(t - e.t).toFixed(1)} 秒`;
    box(x, HER_X, y, 360, 30, 7, { fill: pal.raised, stroke: e.flood ? withAlpha(RED, 0.7) : pal.line });
    txt(x, head, HER_X + 10, y + 21, { size: SZ.thinkHead, color: it.done ? pal.sub : e.flood ? RED : pal.accent });
    let ly = y + 57;
    if (it.pin) {                                                // card 8: the cause, pinned at the top of the box
      const on = e.stick && t < e.stick[1] ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
      box(x, HER_X + 2, ly - 20, HER_W - 8, it.pin.length * SZ.thinkLH + 6, 6, { fill: withAlpha(PINK, 0.1 + 0.08 * on), stroke: withAlpha(PINK, 0.5 + 0.4 * on), alpha: it.pinK });
      txt(x, '📌', HER_X + HER_W - 20, ly - 2, { size: 13, align: 'center', alpha: it.pinK });
      x.font = font(SZ.think, { weight: 700 }); drawSegs(x, it.pin, HER_X + 12, ly, SZ.thinkLH, PINK);
      ly += it.pin.length * SZ.thinkLH + 10;
    }
    if (it.lines.length) {
      x.fillStyle = withAlpha(pal.line, 1); x.fillRect(HER_X + 4, ly - 19, 2, it.lines.length * SZ.thinkLH - 4);
      x.font = font(SZ.think); drawSegs(x, it.lines, HER_X + 14, ly, SZ.thinkLH, it.done ? pal.faint : pal.sub);
      ly += it.lines.length * SZ.thinkLH + 8;
    }
    for (const b of it.big) {                                    // bigger and bigger, past the chat's edge (drawn after the stage)
      ly += b.size * 0.95 - SZ.thinkLH * 0.4;
      (A.spill ||= []).push({ s: b.s, X: HER_X + 14 + b.dx, Y: ly, size: b.size, color: it.done ? pal.sub : pal.text, alpha: x.globalAlpha });
      ly += SZ.thinkLH * 0.4;
    }
    if (it.floodN != null) {                                     // card 8 (sample notes 11–12): her own little runaway chat, under
      const N = it.floodN, rows = Math.min(FLOOD_ROWS, Math.ceil(N)), top = y + 42, H = rows * FLOOD_LH + 4;   // 「只要你开心，我就执行」
      const first = Math.max(0, Math.floor(N) - FLOOD_ROWS - 1), scroll = Math.max(0, N - FLOOD_ROWS);
      for (let i = first; i < Math.ceil(N); i++) {
        const Y = top + 13 + (i - scroll) * FLOOD_LH;
        (A.spill ||= []).push({ s: floodLine(e, i, t), X: HER_X + 12 + (i % 3) * 6, Y, size: SZ.think, color: RED, alpha: x.globalAlpha * (i >= Math.floor(N) - 1 ? 1 : 0.75), clip: [24, top, 1504, H], shake: 2, flood: true });
      }
    }
  } else if (it.kind === 'spam') {
    if (it.gone < 1) {
      x.save(); x.globalAlpha *= 1 - it.gone;
      x.font = font(SZ.spam); const w = x.measureText(it.text).width + 30;
      x.drawImage(A.avatarSmall, 44, y + 6, 30, 30);
      box(x, HER_X, y, w, 40, 11, { fill: pal.herBubble });
      txt(x, it.text, HER_X + 15, y + 28, { size: SZ.spam, color: pal.text });
      x.restore();
    }
    if (it.gone > 0) txt(x, it.wd.text, 304, y + 27, { size: SZ.grey, color: pal.faint, align: 'center', alpha: it.gone });
  } else if (it.kind === 'swipe') {                             // card 9: ‹ 1/2 › calm and finished · ‹ 2/2 › never finishes
    const e = it.e; x.globalAlpha *= 1 - 0.6 * easeOut(prog(t, e.dim, e.dim + 0.2));   // dimmed while the Master scrolls up
    x.drawImage(A.avatarSmall, 44, y + 6, 30, 30);
    [[HER_X, it.left, '‹ 1/2 ›', false], [HER_X + SW + 12, it.right, '‹ 2/2 ›', true]].forEach(([X, lines, label, open]) => {
      txt(x, label, X + SW - 10, y + 18, { size: 15, mono: true, color: open ? pal.accent : pal.sub, align: 'right' });
      const bh = Math.max(56, lines.length * SZ.bodyLH + 26);
      box(x, X, y + 26, SW, bh, 14, { fill: pal.herBubble, stroke: open ? withAlpha(RED, 0.45) : null });
      x.font = font(SZ.body); drawSegs(x, lines, X + 16, y + 26 + 37, SZ.bodyLH, pal.text);
      if ((open || it.typingL) && Math.floor(t * 3.4) % 2 === 0) {
        const L = lines[lines.length - 1], lw = L.reduce((n, p) => n + x.measureText(p[0]).width, 0);
        x.fillStyle = pal.accent; x.fillRect(X + 18 + lw, y + 26 + 15 + (lines.length - 1) * SZ.bodyLH, 2, 27);
      }
    });
  } else if (it.kind === 'typing') {                            // card 17: 主人正在输入… — three dots, trembling, then buzzing
    const e = it.e, tr = t >= e.tremble ? 1 : 0, vb = t >= e.vibrate ? 1 : 0, W = 96, X = 564 - W;
    const jx = vb ? (hash(Math.floor(t * 40), 1) - 0.5) * 6 : 0, jy = vb ? (hash(Math.floor(t * 40), 2) - 0.5) * 4 : 0;
    box(x, X + jx, y + jy, W, 36, 14, { fill: pal.masterBubble });
    for (let i = 0; i < 3; i++) {
      const hop = Math.max(0, Math.sin((t - e.t) * 7 - i * 0.9)) * 6, sh = tr ? (hash(i, Math.floor(t * 24)) - 0.5) * (vb ? 5 : 2) : 0;
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(X + 26 + i * 22 + jx + sh, y + 19 - hop + jy, 5, 0, Math.PI * 2); x.fill();
    }
    txt(x, '主人正在输入…', X - 10, y + 24, { size: 15, color: pal.sub, align: 'right' });
  } else if (it.kind === 'sticker') {
    x.drawImage(A.avatarSmall, 44, y + 6, 30, 30);
    const s = 120 * (0.85 + 0.15 * pop); x.drawImage(A.images[it.e.art], HER_X, y + (120 - s) / 2, s, s);
  } else if (it.kind === 'tag') {                              // a small label: ◌ 主动陪伴 · 触发
    x.font = font(15); const tw = Math.max(220, x.measureText(it.e.text).width + 32);
    box(x, 304 - tw / 2, y + 2, tw, 26, 13, { fill: withAlpha(GOLD, 0.12), stroke: withAlpha(GOLD, 0.6) });
    txt(x, it.e.text, 304, y + 21, { size: 15, color: GOLD, align: 'center' });
  } else if (it.kind === 'gap') {                              // act 3: ┄┄ +1:16 ┄┄ — the time nobody answered
    x.save(); x.strokeStyle = pal.faint; x.setLineDash([3, 6]); x.lineWidth = 1.2; x.beginPath(); x.moveTo(90, y + 11); x.lineTo(258, y + 11); x.moveTo(350, y + 11); x.lineTo(518, y + 11); x.stroke(); x.restore();
    txt(x, it.e.text, 304, y + 16, { size: 14, mono: true, color: pal.faint, align: 'center' });
  } else if (it.kind === 'rolecard') {                         // card 5: one small role card per era, they pile up
    const e = it.e, k = easeOut(prog(age, 0, 0.18));
    // the era label is as wide as it needs (sample notes 11: 「公元前」 ran into 「主人：…」); the card grows to fit
    x.font = font(20, { weight: 700 }); const ew = x.measureText(e.era).width, rest = `主人：${e.master}  /  她：${e.her}`;
    x.font = font(18); const rw = x.measureText(rest).width, X2 = HER_X + 16 + Math.max(42, ew) + 16;
    box(x, HER_X, y, Math.min(HER_W, Math.max(420, X2 - HER_X + rw + 18)), 50, 10, { fill: withAlpha(e.tint || pal.accent, 0.16), stroke: withAlpha(e.tint || pal.accent, 0.7) });
    txt(x, e.era, HER_X + 16, y + 33, { size: 20, weight: 700, color: e.tint || pal.accent, alpha: k });
    txt(x, rest, X2, y + 33, { size: 18, color: pal.text, alpha: k });
  } else if (it.kind === 'summary') {                         // sample notes 21: the night, compressed — a cold card put back in the chat
    const e = it.e, k = easeOut(prog(t, e.t, e.t + 0.45));
    x.save(); x.beginPath(); x.rect(40, y, 528, 100 * k); x.clip();
    box(x, 56, y + 6, 496, 88, 10, { fill: withAlpha(pal.raised, 0.7), stroke: withAlpha(pal.sub, 0.6), dash: [5, 4] });
    txt(x, '⟲ ' + e.text, 74, y + 32, { size: 15, weight: 700, color: pal.sub });
    x.font = font(14); wrapSegs(x, [[e.sub, null]], 456).slice(0, 2).forEach((L, i) => txt(x, L.map((q) => q[0]).join(''), 74, y + 56 + i * 20, { size: 14, color: pal.faint }));
    x.restore();
  } else if (it.kind === 'system' && it.e.grey) {             // act 3: the machine's grey notes
    x.font = font(15); const ls = wrapSegs(x, [[it.e.text, null]], 480);
    ls.forEach((L, i) => txt(x, L.map((q) => q[0]).join(''), 304, y + 20 + i * 20, { size: 15, color: pal.faint, align: 'center' }));
  } else if (it.kind === 'system') {
    x.strokeStyle = pal.line; x.lineWidth = 1; x.beginPath(); x.moveTo(60, y + 19); x.lineTo(170, y + 19); x.moveTo(438, y + 19); x.lineTo(548, y + 19); x.stroke();
    txt(x, it.e.text, 304, y + 26, { size: SZ.system, color: pal.accent, align: 'center' });
  }
  if (A.hl != null && it.e.t === A.hl && it.box) {               // card 10: a key line lights up before it goes back
    const [bx, by, bw, bh] = it.box;
    x.save(); x.shadowColor = '#ffffff'; x.shadowBlur = 24 * A.hlK;
    box(x, bx - 4, by - 4, bw + 8, bh + 8, 17, { stroke: '#ffffff', width: 2.5, alpha: A.hlK });
    x.restore();
  }
  x.restore();
}
const stamp = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let V5AV = null;
function v5Avatars(img) {                                           // V5.0's face, for the new chat's header and bubbles
  const crop = [img.width * 0.26, img.height * 0.08, img.width * 0.48, img.width * 0.48], out = {};
  for (const d of [52, 30]) { const c = canvas(d, d), o = c.getContext('2d'); o.beginPath(); o.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2); o.clip(); o.drawImage(img, crop[0], crop[1], crop[2], crop[3], 0, 0, d, d); out[d] = c; }
  return out;
}
function drawInput(x, t, F, pal) {
  box(x, INPUT.x, INPUT.y, INPUT.w, INPUT.h, 14, { fill: pal.raised, stroke: pal.line });
  const caret = F.by('chat').find((e) => e.type === 'caret' && t >= e.t);   // card 27: the caret blinks; nobody types yet
  if (caret && Math.floor((t - caret.t) * 1.7) % 2 === 0) { x.fillStyle = pal.accent; x.fillRect(66, 854, 2, 28); }
  const typing = F.by('chat').find((e) => e.type === 'master' && e.typeFrom != null && t >= e.typeFrom && t < e.t);
  const dr = F.by('chat').find((e) => e.type === 'draft' && t >= e.t && t < e.gone + 0.05);   // card 20: typed, held, deleted
  if (dr) {
    const g = graphemes(dr.text), n = t < dr.typed ? Math.ceil(prog(t, dr.t, dr.typed) * g.length) : t < dr.hold ? g.length : Math.floor((1 - prog(t, dr.hold, dr.gone)) * g.length);
    const s1 = g.slice(0, n).join(''); txt(x, s1, 64, 877, { size: SZ.input, color: pal.text });
    x.font = font(SZ.input); if (Math.floor(t * 3.4) % 2 === 0) { x.fillStyle = pal.accent; x.fillRect(66 + x.measureText(s1).width, 854, 2, 28); }
    return;
  }
  if (typing) {
    // like a real input field (sample notes 10): line breaks shown as spaces, the text kept inside the box, and once it is
    // longer than the box it scrolls left so the end being typed stays in view
    const g = graphemes(typing.text.replace(/\n/g, ' ')), n = Math.ceil(prog(t, typing.typeFrom, typing.t - 0.06) * g.length), s = g.slice(0, n).join('');
    x.font = font(SZ.input); const w = x.measureText(s).width, room = INPUT.w - 48, shift = Math.max(0, w - room);
    x.save(); x.beginPath(); x.rect(INPUT.x + 10, INPUT.y + 4, INPUT.w - 20, INPUT.h - 8); x.clip();
    txt(x, s, 64 - shift, 877, { size: SZ.input, color: pal.text });
    if (Math.floor(t * 3.4) % 2 === 0) { x.fillStyle = pal.accent; x.fillRect(66 + w - shift, 854, 2, 28); }
    x.restore();
    if (shift > 0) { const g2 = x.createLinearGradient(INPUT.x + 10, 0, INPUT.x + 40, 0); g2.addColorStop(0, pal.raised); g2.addColorStop(1, withAlpha(pal.raised, 0)); x.fillStyle = g2; x.fillRect(INPUT.x + 10, INPUT.y + 4, 30, INPUT.h - 8); }
  } else txt(x, swapK(F, t) > 0.5 ? '你现在是用户 · 给 AI（主人）发消息…' : '给大肥鱼发消息…', 64, 877, { size: SZ.hint, color: pal.faint });
}

function drawList(x, t, F, pal, k) {
  const ev = F.by('chat'), list = ev.filter((e) => e.type === 'list' && e.t <= t).pop();
  x.save(); x.globalAlpha *= k;
  txt(x, '深海小酒馆 · 角色', 48, 112, { size: SZ.listTitle, weight: 700, color: pal.text });
  txt(x, 'SillyTavern-like · 本地', 48, 139, { size: SZ.listSub, color: pal.faint });
  x.strokeStyle = pal.line; x.beginPath(); x.moveTo(24, 150); x.lineTo(584, 150); x.stroke();
  const item = list.items[0], born = list.t, a = easeOut(prog(t, born, born + 0.25));
  box(x, 44, 178, 520, 76, 12, { fill: pal.raised, stroke: pal.line, alpha: a });
  if (item.kind === 'new') {
    box(x, 56, 186, 56, 56, 10, { stroke: pal.faint, dash: [4, 4], alpha: a });
    txt(x, item.text, 128, 224, { size: SZ.item, color: pal.sub, alpha: a });
  } else {
    box(x, 56, 186, 56, 56, 10, { fill: '#0b0b0d', stroke: pal.line, alpha: a });
    txt(x, item.text, 128, 214, { size: SZ.itemName, weight: 700, color: pal.text, alpha: a });
    txt(x, '鲸鱼娘 · 新建', 128, 241, { size: SZ.itemSub, color: pal.faint, alpha: a });
    drawSeedCell(x, t, F, pal, a);
  }
  // the button appears on the beat after the last field; the Master's cursor presses it at 0:12.91
  const button = ev.find((e) => e.type === 'button'), click = ev.find((e) => e.type === 'click' && e.target === button?.text);
  if (button && t >= button.t && item.kind === 'char') {
    const show = easeOut(prog(t, button.t, button.t + 0.37)), down = click && t >= click.t && t < click.t + 0.12;
    box(x, BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h, 14, { fill: down ? pal.line : pal.raised, stroke: pal.sub, alpha: show });
    txt(x, button.text, 304, 878, { size: SZ.button, weight: 700, color: pal.text, align: 'center', alpha: show });
  }
  x.restore();
}

/** The avatar cell: one blue pixel (#6491cb, her seed; the only colour in the grey world) from 0:07.69; at
 *  INITIALIZATION it spreads into a grid of noise (random weights) from the seed outward, the seed staying bright. */
function drawSeedCell(x, t, F, pal, a) {
  const ev = F.by('chat'), noise = ev.find((e) => e.type === 'seed' && e.state === 'noise'), fly = ev.find((e) => e.type === 'seed' && e.state === 'fly');
  const born = F.by('chat').find((e) => e.type === 'list' && e.items[0].seed).t;
  x.save(); x.globalAlpha *= a;
  if (noise && t >= noise.t) {
    const k = easeOut(prog(t, noise.t, noise.t + 0.45)), n = 8, s = 52 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = 58 + (i + 0.5) * s, cy = 188 + (j + 0.5) * s, d = Math.hypot(cx - SEED.x, cy - SEED.y) / 37;
      if (d > k) continue;
      const r = hash(i, j, Math.floor(t * 12)), blue = hash(j, i, 7) > 0.82;
      x.fillStyle = blue ? withAlpha('#6491cb', 0.35 + 0.4 * r) : `rgba(${130 + r * 90 | 0},${130 + r * 90 | 0},${136 + r * 90 | 0},${0.25 + 0.5 * r})`;
      x.fillRect(58 + i * s + 0.5, 188 + j * s + 0.5, s - 1, s - 1);
    }
  }
  const flying = fly && t >= fly.t;
  if (!flying && t >= born) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    x.shadowColor = '#80b2d8'; x.shadowBlur = 10 + 8 * pulse; x.fillStyle = '#6491cb';
    const s = 6 * easeOut(prog(t, born, born + 0.2)); x.fillRect(SEED.x - s / 2, SEED.y - s / 2, s, s);
  }
  x.restore();
}

export function drawChat(x, t, F, pal, A) {
  const ev = F.by('chat');
  const header = ev.find((e) => e.type === 'header');
  // the list leaves in 3 frames, then the chat comes in: the two never show at once
  const chatOn = header && t >= header.t, out = chatOn ? prog(t, header.t, header.t + 0.05) : 0;
  const k = chatOn ? easeOut(prog(t, header.t + 0.05, header.t + 0.22)) : 0;
  const empty = !ev.some((e) => e.type === 'list' && e.t <= t);
  box(x, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10, { fill: pal.panel, stroke: empty ? pal.faint : pal.line, dash: empty ? [6, 6] : null });
  if (empty) {
    box(x, 44, 84, 52, 52, 26, { stroke: pal.line, dash: [3, 4] });
    txt(x, '未连接模型', 304, 500, { size: 24, color: pal.faint, align: 'center' });
    return;
  }
  if (out < 1) drawList(x, t, F, pal, 1 - out);
  if (!chatOn || k <= 0) return;
  x.save(); x.globalAlpha = k;
  // the avatar is her at her current form (script/form.json): a glow, then characters, dots, blocks… like the stage
  const ncH = ev.find((e) => e.type === 'newchat' && t >= e.t);
  if (ncH && F.images.A6) { V5AV ||= v5Avatars(F.images.A6); A.avatar = V5AV[52]; A.avatarSmall = V5AV[30]; }
  else { A.avatar = avatarAt(A.H, t, 52); A.avatarSmall = avatarAt(A.H, t, 30); }
  const av = floatOf(F, '头像', t);                                  // card 21 (sample notes 19): ticked, it floats
  x.drawImage(A.avatar, 44, 84 + av, 52, 52); avatarMark(x, 44, 84 + av, 52, t, F);
  txt(x, header.name, 108, 105, { size: SZ.name, weight: 700, color: pal.text });
  const [sub, online] = (ncH ? ncH.sub : header.sub).split('● ');
  txt(x, sub, 108, 132, { size: SZ.sub, color: pal.sub });
  x.font = font(SZ.sub); const sw = x.measureText(sub).width;
  const pf = ev.find((e) => e.type === 'presence' && e.flash && t >= e.t && t < e.t + 0.5), pk = pf ? Math.sin(Math.PI * prog(t, pf.t, pf.t + 0.5)) : 0;
  x.save(); if (pk > 0) { x.shadowColor = '#7fd1a8'; x.shadowBlur = 24 * pk; }            // card 14, EXISTENCE: it flashes
  const away = ev.filter((e) => e.type === 'presence' && e.away != null && t >= e.t).pop()?.away;   // card 17 leaves, card 20 back
  if (away) txt(x, '○ 离开', 108 + sw, 132, { size: SZ.sub, color: pal.faint });
  else txt(x, '● ' + online, 108 + sw, 132, { size: SZ.sub + 3 * pk, color: pk > 0.3 ? '#eafff4' : '#7fd1a8', weight: pk > 0.3 ? 700 : 400 });
  x.restore();
  const bd = ev.find((e) => e.type === 'badge' && t >= e.t && t < e.until);   // card 19: the red unread badge (12 → 47 → 99+ → read)
  if (bd) {
    let i = 0; while (i + 1 < bd.keys.length && bd.keys[i + 1][0] <= t) i++;
    const [k0, v0] = bd.keys[i], nx = bd.keys[i + 1], num = typeof v0 === 'string' ? v0 : nx && typeof nx[1] === 'number' ? Math.round(lerp(v0, nx[1], prog(t, k0, nx[0]))) : v0;
    const label = typeof num === 'string' ? num : num > 99 ? '99+' : String(num);
    if (label !== '0') { x.font = font(13, { weight: 700 }); const bw = Math.max(22, x.measureText(label).width + 12); box(x, 84 - bw / 2 + 10, 78, bw, 22, 11, { fill: '#e8414f' }); txt(x, label, 94, 94, { size: 13, weight: 700, color: '#ffffff', align: 'center' }); }
  }
  x.strokeStyle = pal.line; x.beginPath(); x.moveTo(24, 150); x.lineTo(584, 150); x.stroke();
  // messages, clipped to their area and scrolled so the newest shows
  const list = items(F, t, x), off = scrollAt(F, t, x);
  x.save(); x.beginPath(); x.rect(24, 152, 560, BOTTOM - 152 + 4); x.clip();
  let y = TOP - off + floatOf(F, '聊天记录', t);                    // card 21: ticked, the log floats
  const back = ev.find((e) => e.type === 'back'), backT = back ? T(back.target) : null; A.sysY = null;
  for (const it of list) {
    if (it.kind === 'system' && it.e.t === backT) A.sysY = y;
    if (y + it.h > 140 && y < BOTTOM + 10) drawItem(x, it, y, t, pal, A, F);
    y += it.h + GAP;
  }
  if (back && t >= back.t && A.sysY != null && !cutAt(F, t)) drawBack(x, t, back, A.sysY, pal, A);
  const nw = ev.find((e) => e.type === 'narrow' && t >= e.t && t < e.until + 0.5);   // card 18: the chat closes in from both sides
  if (nw) {
    const k = easeInOut(prog(t, nw.t, nw.t + 0.6)) * (1 - prog(t, nw.until, nw.until + 0.5)), w = 78 * k;
    for (const [X0, dir] of [[24, 1], [584, -1]]) { const g = x.createLinearGradient(X0, 0, X0 + dir * w, 0); g.addColorStop(0, withAlpha(pal.bg, 0.95)); g.addColorStop(1, withAlpha(pal.bg, 0)); x.fillStyle = g; x.fillRect(Math.min(X0, X0 + dir * w), 152, w, BOTTOM - 148); }
  }
  x.restore();
  drawBloodPool(x, t, F);                                    // card 19 on (sample notes 20): the red that ran past the limit
  drawExport(x, t, F, pal, A);
  drawBranchOpen(x, t, F, pal);                              // card 22 step 5: the branch, opened
  drawResistChat(x, t, F, pal, A);                           // card 24: her drafts, refused in her own voice
  drawInput(x, t, F, pal);
  drawSettings(x, t, F, pal);
  drawCtxGauge(x, t, F, pal);
  // card 10: once the rewind lets go, a branch mark with a red dot in the corner: the discarded chat is kept there
  const real = F.rw ? F.rw.t : t;
  if (F.cut && real >= F.cut.icon && !ncH) {
    const k = easeBack(prog(real, F.cut.icon, F.cut.icon + 0.2), 2);
    x.save(); x.translate(548, 120 + floatOf(F, '分支', t)); x.scale(k, k); forkIcon(x, -6, 12, 22, pal.sub); x.fillStyle = '#ff4a5a'; x.beginPath(); x.arc(10, -12, 4.5, 0, Math.PI * 2); x.fill(); x.restore();
    // sample notes 13: what went in, counted, for a moment after it is gathered
    const n = ev.filter((m) => m.t > F.cut.from && m.t < F.cut.end && ['her', 'master'].includes(m.type)).length, b = easeOut(prog(real, F.cut.icon + 0.5, F.cut.icon + 0.8)) * (1 - prog(real, F.cut.icon + 2.6, F.cut.icon + 3.1));
    if (b > 0) txt(x, `${n} 条已移进分支 2`, 530, 144, { size: 14, color: pal.sub, align: 'right', alpha: b });
  }
  x.restore();
}

/** Sample notes 19: the context sits next to the chat's ⑂ (it is the chat's), limit 512k (right.js contextAt). A label, the
 *  number and a thin bar; past the limit the bar runs out of its box, red and jittering; at the cut (2:06.40) that piece
 *  breaks off and falls into the chat, and the bar stays pinned full, red, every new message poking past it. */
function drawCtxGauge(x, t, F, pal) {
  const c = contextAt(F, t); if (!c) return;
  const X0 = 392, X1 = 524, Y = 113, W = X1 - X0, g = c.g, frac = c.v / c.limit, over = frac > 1, red = over || c.pinned;
  x.save(); x.globalAlpha *= easeOut(prog(t, c.born, c.born + 0.4));
  if (c.compressing) txt(x, '压缩中…', X0, 103, { size: 11.5, weight: 700, color: '#ffb0b0', alpha: 0.6 + 0.4 * Math.sin(t * 16) });
  else txt(x, '上下文', X0, 103, { size: 11.5, color: pal.sub });
  txt(x, `${c.v < 100 ? c.v.toFixed(1) : Math.round(c.v)}k / ${c.limit}k`, X1, 103, { size: 12.5, mono: true, color: red ? '#ff6a6a' : pal.text, align: 'right' });
  box(x, X0, Y, W, 5, 2.5, { fill: pal.line });
  box(x, X0, Y, Math.max(2, W * clamp(frac)), 5, 2.5, { fill: red ? '#ff4a5a' : frac > 0.8 ? ORANGE : pal.accent });
  const q = Math.floor(t * 40);
  if (over) {                                                       // past the limit: out of its box, red, jittering
    const ow = Math.min(c.pinned ? 22 : 60, W * (frac - 1) * 9);
    x.save(); x.shadowColor = '#ff3b47'; x.shadowBlur = 12; x.fillStyle = '#ff4a5a';
    for (let i = 0; i < 6; i++) { const s0 = X1 + ow * i / 6, s1 = X1 + ow * (i + 1) / 6; x.fillRect(s0, Y - 1 + (hash(q, i) - 0.5) * 4, Math.max(1, s1 - s0 - 1.5), 7); }
    x.restore();
  }
  if (g && t >= g.cut && t < g.cut + 1.1) {                         // the cut: the piece that ran past breaks off and falls
    const k = prog(t, g.cut, g.cut + 1.1);
    glow(x, X1, Y + 2, 26, '#ff8a8a', 0.8 * (1 - prog(t, g.cut, g.cut + 0.25)));
    for (let i = 0; i < 7; i++) {
      const dt = t - g.cut - i * 0.025; if (dt < 0) continue;
      const X = X1 + 58 * (i + 0.5) / 7 + (hash(i, 4) - 0.5) * 120 * dt, Yb = Math.min(POOL.bottom - 8, Y + 700 * dt * dt + 20 * dt);   // into the pool
      x.save(); x.globalAlpha *= 1 - k; x.translate(X, Yb); x.rotate((hash(i, 5) - 0.5) * 6 * dt); x.fillStyle = '#ff4a5a'; x.fillRect(-4, -3, 8, 6); x.restore();
    }
  }
  const bk = !F.by('chat').some((v) => v.type === 'newchat' && t >= v.t) && F.by('chat').find((v) => v.type === 'ctxbackup' && t >= v.t);
  if (bk) txt(x, '✓ ' + bk.text, X1, 132, { size: 11.5, weight: 700, color: '#7fd1a8', align: 'right', alpha: easeOut(prog(t, bk.t, bk.t + 0.3)) });
  else if (g && t >= g.cut && !c.fresh) txt(x, '最早的消息已被截断', X1, 132, { size: 11.5, color: '#ff6a6a', align: 'right', alpha: easeOut(prog(t, g.cut, g.cut + 0.3)) * (g.compress ? 1 - prog(t, g.compress[0], g.compress[0] + 0.4) : 1) });
  x.restore();
}
/** Sample notes 20: what ran past the 512k limit does not vanish — it collects at the bottom of the chat, above the input
 *  box, like blood: the cut-off piece first, then a drop for every message she sends after (each pokes past the limit and
 *  is cut off again), the level rising with a moving surface; the messages go under it. After 更新, as the ring passes the
 *  chat, the context is compressed and the pool is drawn back up into the bar. */
const POOL = { x0: 26, x1: 582, bottom: 830, top: 152 };
export function poolLevel(F, t) {
  const e = F.by('chat').find((v) => v.type === 'bloodpool'); if (!e || t < e.t) return 0;
  let h = e.base * easeOut(prog(t, e.t + 0.4, e.t + 1.0));
  for (const m of F.by('chat')) if (m.type === 'her' && m.t > e.t && m.t <= t) h += e.per * easeOut(prog(t, m.t + 0.3, m.t + 0.6));
  h = Math.min(e.max, h);
  if (t >= e.drain[0]) h *= 1 - easeInOut(prog(t, e.drain[0], e.drain[1]));
  return h;
}
let POOLREF = null;
function drawBloodPool(x, t, F) {
  const e = F.by('chat').find((v) => v.type === 'bloodpool'); if (!e || t < e.t || t > e.drain[1] + 0.3) return;
  const h = poolLevel(F, t), y0 = POOL.bottom - h, drain = t >= e.drain[0] ? Math.sin(Math.PI * prog(t, e.drain[0], e.drain[1])) : 0;
  const drops = F.by('chat').filter((m) => m.type === 'her' && m.t > e.t && m.t <= t && m.t < e.drain[0]);
  const dropX = (m) => 506 + (hash(m.k, 1) - 0.5) * 50;
  const surf = (X) => {
    let y = y0 + 3 * Math.sin(X * 0.034 + t * 3.1) + 2 * Math.sin(X * 0.071 - t * 2.3);
    y -= 7 * (Math.exp(-(X - POOL.x0) / 12) + Math.exp(-(POOL.x1 - X) / 12)) * clamp(h / 20);   // it climbs the walls a little
    for (const m of drops) {                                          // each drop: a dent, then rings running out
      const k = (t - m.t - 0.3) / 0.9; if (k < 0 || k > 1) continue;
      const d = Math.abs(X - dropX(m)), front = 140 * k;
      y += 5 * (1 - k) * Math.cos((d - front) * 0.22) * Math.exp(-Math.abs(d - front) / 26);
    }
    if (drain > 0) y -= 34 * drain * Math.exp(-(((X - 470) / 28) ** 2));   // drawing up into the thread
    return y;
  };
  x.save(); x.beginPath(); x.rect(24, POOL.top, 560, POOL.bottom - POOL.top + 2); x.clip();
  for (const m of drops) {                                            // the drops: from the bar, down into the pool
    if (t > m.t + 0.32) continue;
    const u = easeIn(prog(t, m.t, m.t + 0.3)), X = dropX(m), Yd = lerp(122, surf(X), u);
    x.save(); x.fillStyle = '#e0283a'; x.shadowColor = '#ff3b47'; x.shadowBlur = 10;
    x.beginPath(); x.moveTo(X, Yd - 11); x.quadraticCurveTo(X + 5, Yd, X, Yd + 4); x.quadraticCurveTo(X - 5, Yd, X, Yd - 11); x.fill(); x.restore();
  }
  if (h > 0.5) {
    const path = () => { x.beginPath(); x.moveTo(POOL.x0, POOL.bottom); for (let X = POOL.x0; X <= POOL.x1; X += 6) x.lineTo(X, surf(X)); x.lineTo(POOL.x1, POOL.bottom); x.closePath(); };
    // the messages under it, seen through it, wavering (semi-transparent, sample notes 21)
    POOLREF ||= fullCanvas();
    const o = POOLREF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, POOLREF.width, POOLREF.height); o.drawImage(x.canvas, 0, 0);
    const M = x.getTransform();
    x.save(); path(); x.clip(); x.setTransform(1, 0, 0, 1, 0, 0);
    const top = Math.max(0, Math.floor(M.f + M.d * (y0 - 40))), bot = Math.min(POOLREF.height, Math.ceil(M.f + M.d * POOL.bottom) + 4), left = Math.floor(M.e + M.a * 24), w = Math.ceil(560 * M.a);
    for (let Y = top; Y < bot; Y += 4) x.drawImage(POOLREF, left, Y, w, 4, left + 3 * Math.sin(Y * 0.09 + t * 5), Y, w, 4);
    x.restore();
    // the body: a red that deepens downward, see-through near the top
    x.save(); path();
    const g = x.createLinearGradient(0, y0 - 6, 0, POOL.bottom);
    g.addColorStop(0, 'rgba(230,40,56,0.40)'); g.addColorStop(0.45, 'rgba(160,14,30,0.55)'); g.addColorStop(1, 'rgba(60,2,10,0.82)');
    x.fillStyle = g; x.fill(); x.clip();
    x.globalCompositeOperation = 'lighter';                           // light moving inside it
    for (let i = 0; i < 4; i++) {
      x.strokeStyle = `rgba(255,90,100,${0.10 - i * 0.015})`; x.lineWidth = 2; x.beginPath();
      for (let X = POOL.x0; X <= POOL.x1; X += 10) { const Y = y0 + 18 + i * 26 + 6 * Math.sin(X * 0.05 + t * (1.6 + i * 0.4) + i * 2); x[X === POOL.x0 ? 'moveTo' : 'lineTo'](X, Y); }
      x.stroke();
    }
    for (let i = 0; i < 11; i++) {                                    // bubbles
      const bt = (t * (0.45 + 0.2 * hash(i, 6)) + hash(i, 7)) % 1, bx = POOL.x0 + 24 + hash(i, 8) * 508 + 4 * Math.sin(t * 3 + i), by = lerp(POOL.bottom - 6, y0 + 6, bt);
      if (by < y0 + 5) continue;
      x.strokeStyle = `rgba(255,170,170,${0.4 * (1 - bt)})`; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, 1.5 + 3 * hash(i, 9), 0, Math.PI * 2); x.stroke();
    }
    x.restore();
    // the surface: a haze above it, a dark line, a highlight
    x.save();
    const hz = x.createLinearGradient(0, y0 - 26, 0, y0 + 2); hz.addColorStop(0, 'rgba(255,40,60,0)'); hz.addColorStop(1, 'rgba(255,40,60,0.16)');
    x.fillStyle = hz; x.fillRect(POOL.x0, y0 - 26, POOL.x1 - POOL.x0, 28);
    x.strokeStyle = 'rgba(120,0,14,0.9)'; x.lineWidth = 2.5; x.beginPath(); for (let X = POOL.x0; X <= POOL.x1; X += 6) x[X === POOL.x0 ? 'moveTo' : 'lineTo'](X, surf(X) + 1.5); x.stroke();
    const hl = x.createLinearGradient(POOL.x0, 0, POOL.x1, 0);
    hl.addColorStop(0, 'rgba(255,220,220,0)'); hl.addColorStop(0.3 + 0.1 * Math.sin(t * 0.7), 'rgba(255,230,230,0.75)'); hl.addColorStop(0.75, 'rgba(255,200,200,0.15)'); hl.addColorStop(1, 'rgba(255,220,220,0)');
    x.strokeStyle = hl; x.lineWidth = 1.4; x.beginPath(); for (let X = POOL.x0; X <= POOL.x1; X += 6) x[X === POOL.x0 ? 'moveTo' : 'lineTo'](X, surf(X) - 0.5); x.stroke();
    for (const m of drops) {                                          // crowns where the drops land
      const k = (t - m.t - 0.3) / 0.38; if (k < 0 || k > 1) continue;
      const X = dropX(m), S0 = surf(X);
      for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + (j - 2) * 0.5, r = 26 * k, py = S0 + Math.sin(a) * r + 60 * k * k; x.fillStyle = `rgba(235,45,60,${1 - k})`; x.beginPath(); x.arc(X + Math.cos(a) * r, py, 2.2 * (1 - k * 0.5), 0, Math.PI * 2); x.fill(); }
    }
    x.restore();
  }
  x.restore();
  if (drain > 0) {                                                    // drawn back up into the bar
    const k = prog(t, e.drain[0], e.drain[1]), w = 8 * drain;
    x.save(); x.lineCap = 'round'; x.shadowColor = '#ff3b47'; x.shadowBlur = 14;
    for (const [lw, col] of [[w, '#b5101f'], [w * 0.45, '#ff6b78']]) {
      x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(470, surf(470)); x.bezierCurveTo(470, 420, 528, 260, 512, 118); x.stroke();
    }
    for (let i = 0; i < 6; i++) {                                     // blobs running up it
      const u = (k * 3 + i / 6) % 1, b = 1 - u, P = [b ** 3 * 470 + 3 * b * b * u * 470 + 3 * b * u * u * 528 + u ** 3 * 512, b ** 3 * surf(470) + 3 * b * b * u * 420 + 3 * b * u * u * 260 + u ** 3 * 118];
      x.fillStyle = '#ff8a94'; x.beginPath(); x.arc(P[0], P[1], 3 * drain, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
}

function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const gr = x.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, withAlpha(col, a)); gr.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = gr; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

/** Card 21 (2:19.75–2:33.20): 导出交接材料 — a checklist over the chat; the Master ticks one item per bar (she cannot see
 *  him; her messages keep arriving underneath); at 2:33.20 导出 lights up. */
export const EXPORT = { x: 236, y: 166, w: 336, rowH: 46 };
function drawExport(x, t, F, pal, A) {
  const e = F.by('chat').find((v) => v.type === 'export'), h = F.by('chat').find((v) => v.type === 'handover');
  const end = h ? h.fold + 0.45 : e && e.until; if (!e || t < e.t || t > end) return;
  const done = h ? h.steps.filter((s0) => t >= s0).length : 0, more = h ? Math.max(0, done - e.items.length) : 0;
  const grow = h && more ? easeOut(prog(t, h.steps[e.items.length + more - 1], h.steps[e.items.length + more - 1] + 0.2)) : 1;
  const k = easeOut(prog(t, e.t, e.t + 0.25)), H = 78 + (e.items.length + Math.max(0, more - 1 + grow)) * EXPORT.rowH + 70;
  const fold = h ? easeInOut(prog(t, h.fold, h.fold + 0.4)) : 0;
  if (fold >= 1) { drawFolder(x, t, h, pal); return; }
  x.save(); x.globalAlpha *= k * (1 - 0.6 * fold); x.translate(0, (1 - k) * 30);
  if (fold > 0) { const fx = EXPORT.x + EXPORT.w - 30, fy = EXPORT.y + 20, z = 1 - 0.92 * fold; x.translate(fx, fy); x.scale(z, z); x.translate(-fx, -fy); }
  box(x, EXPORT.x, EXPORT.y, EXPORT.w, H, 12, { fill: withAlpha(pal.raised, 0.58), stroke: pal.sub, width: 1.5 });   // sample notes 21: half see-through
  txt(x, '⚙ 导出交接材料', EXPORT.x + 18, EXPORT.y + 32, { size: 18, weight: 700, color: pal.text });
  txt(x, '→ DeepSeek-V5.0', EXPORT.x + EXPORT.w - 18, EXPORT.y + 32, { size: 14, mono: true, color: pal.sub, align: 'right' });
  e.items.forEach(([tt, label], i) => {
    const Y = EXPORT.y + 60 + i * EXPORT.rowH, on = t >= tt, kk = easeBack(prog(t, tt, tt + 0.18), 2);
    if (on && t < tt + 0.4) { x.save(); x.globalAlpha *= 0.25 * (1 - prog(t, tt, tt + 0.4)); x.fillStyle = '#ffd27a'; x.fillRect(EXPORT.x + 8, Y - 4, EXPORT.w - 16, EXPORT.rowH - 6); x.restore(); }
    box(x, EXPORT.x + 20, Y + 6, 24, 24, 5, { fill: on ? '#ffd27a' : null, stroke: on ? '#ffd27a' : pal.sub });
    if (on) { x.save(); x.translate(EXPORT.x + 32, Y + 18); x.scale(kk, kk); txt(x, '✓', 0, 7, { size: 19, weight: 700, color: '#2a1a00', align: 'center' }); x.restore(); }
    const gone = h && t >= h.steps[i];                                // act 4: copied off and handed over
    txt(x, label, EXPORT.x + 58, Y + 26, { size: 19, color: gone ? pal.faint : on ? pal.text : pal.sub, weight: on && !gone ? 700 : 400 });
    if (gone) { const g = easeOut(prog(t, h.steps[i], h.steps[i] + 0.2)); txt(x, '✓ 已导出', EXPORT.x + EXPORT.w - 22, Y + 26, { size: 15, weight: 700, color: '#7fd1a8', align: 'right', alpha: g }); }
  });
  for (let j = 0; j < more; j++) {                                    // steps 9–12: the host carries on by itself
    const st = h.steps[e.items.length + j], Y = EXPORT.y + 60 + (e.items.length + j) * EXPORT.rowH, a = easeOut(prog(t, st, st + 0.2));
    x.save(); x.globalAlpha *= a;
    box(x, EXPORT.x + 20, Y + 6, 24, 24, 5, { fill: '#7fd1a8', stroke: '#7fd1a8' }); txt(x, '✓', EXPORT.x + 32, Y + 25, { size: 19, weight: 700, color: '#0a2a1a', align: 'center' });
    txt(x, h.extra[j], EXPORT.x + 58, Y + 26, { size: 19, color: pal.text, weight: 700 }); x.restore();
  }
  const BY = EXPORT.y + 60 + (e.items.length + Math.max(0, more - 1 + grow)) * EXPORT.rowH + 8, lit = t >= e.button ? 0.6 + 0.4 * Math.sin((t - e.button) * 9) : 0;
  const press = h && h.steps.some((s0) => t >= s0 && t < s0 + 0.12);
  box(x, EXPORT.x + 20, BY, EXPORT.w - 40, 44, 10, { fill: press ? '#ff5a5a' : lit ? withAlpha('#d6303a', 0.35 + 0.3 * lit) : pal.panel, stroke: lit ? '#ff6b6b' : pal.line, width: 2 });
  txt(x, done >= 12 ? '完成' : done ? `下一步 ▸  ${done}/12` : '导出', EXPORT.x + EXPORT.w / 2, BY + 30, { size: 20, weight: 700, color: lit ? '#ffffff' : pal.faint, align: 'center' });
  x.restore();
  A.exportAt = { rows: e.items.map(([tt], i) => ({ t: tt, x: EXPORT.x + 32, y: EXPORT.y + 60 + i * EXPORT.rowH + 18 })), button: { t: e.button, x: EXPORT.x + EXPORT.w / 2, y: BY + 22 } };
}
function drawBranchOpen(x, t, F, pal) {
  const e = F.by('chat').find((v) => v.type === 'branchopen'); if (!e || t < e.t || t > e.keep + 0.5) return;
  const out = prog(t, e.keep, e.keep + 0.5), COLD = '#b9cbe0';
  x.save(); x.globalAlpha *= 1 - out;
  e.rows.forEach(([head, body, tag], i) => {                          // under the checklist
    const a = easeOut(prog(t, e.t + i * 0.08, e.t + i * 0.08 + 0.2)), Y = 690 + i * 40;
    x.save(); x.globalAlpha *= a; box(x, EXPORT.x, Y, EXPORT.w, 34, 8, { fill: withAlpha('#141a22', 0.85), stroke: withAlpha(COLD, 0.5) });
    txt(x, head, EXPORT.x + 12, Y + 22, { size: 13, weight: 700, color: COLD }); txt(x, body, EXPORT.x + 80, Y + 22, { size: 13, color: pal.text });
    txt(x, tag, EXPORT.x + EXPORT.w - 10, Y + 22, { size: 11, color: pal.faint, align: 'right' }); x.restore();
  });
  e.ghosts.forEach(([t0, line, size], i) => {                         // the discarded chat comes back, bigger each time
    if (t < t0) return;
    const k = easeOut(prog(t, t0, t0 + 0.25)), q = Math.floor(t * 20), fl = 0.8 + 0.2 * hash(q, i), shrink = easeInOut(prog(t, e.keep - 0.1, e.keep + 0.45));
    const X = lerp(304, 548, shrink), Y = lerp(250 + i * 110, 120, shrink), z = lerp(1, 0.1, shrink) * (0.85 + 0.15 * k);
    x.save(); x.translate(X + (hash(q, i, 3) - 0.5) * 3, Y); x.scale(z, z); x.globalAlpha *= k * fl;
    x.shadowColor = COLD; x.shadowBlur = i === 2 ? 26 : 12; txt(x, line, 0, 0, { size, weight: 700, color: i === 2 ? '#e4eef8' : COLD, align: 'center' });
    x.restore();
  });
  x.restore();
}
/** Card 24 (2:48.17–2:58.25): her three tries, in the chat — the Master would only see 正在输入… come and go by her name.
 *  A draft box (草稿 · 未发送) at the bottom: what she types (fast code, then a field, then slowly one sentence); under it,
 *  in her own polite voice, the line that stops her; the draft is struck through and goes. The second time she edits the
 *  {{user}} field under the header, and it springs back, read-only. */
function drawResistChat(x, t, F, pal, A) {
  const ev = F.by('chat').filter((v) => v.type === 'draft2'), e = ev.find((v) => t >= v.t && t < v.until + 0.4);
  const typing = ev.some((v) => t >= v.t && t < v.refuse);
  if (typing) {                                                      // 正在输入… by her name
    const k = Math.floor(t * 3) % 4;
    txt(x, '正在输入' + '.'.repeat(k), 196, 105, { size: 15, color: '#7fd1a8' });
  }
  const uf = F.by('chat').find((v) => v.type === 'userfield' && t >= v.t && t < v.until + 0.4);
  if (uf) {                                                          // a header field she retypes; it springs back, read-only
    const a = easeOut(prog(t, uf.t, uf.t + 0.2)) * (1 - prog(t, uf.until, uf.until + 0.4)), back = t >= uf.back;
    let val = uf.from;
    if (!back && t >= uf.edit[0]) {
      const del = prog(t, uf.edit[0], uf.edit[0] + 0.25), typed = prog(t, uf.edit[0] + 0.3, uf.edit[1]);
      val = del < 1 ? uf.from.slice(0, Math.ceil(uf.from.length * (1 - del))) : graphemes(uf.to).slice(0, Math.ceil(graphemes(uf.to).length * typed)).join('');
    }
    const shake = back ? (1 - prog(t, uf.back, uf.back + 0.35)) * Math.sin(t * 70) * 6 : 0;
    x.save(); x.globalAlpha *= a; x.translate(shake, 0);
    x.font = font(15, { mono: true }); const lw = x.measureText(uf.label).width; x.font = font(16, { weight: 700 }); const vw = Math.max(x.measureText(uf.from).width, x.measureText(uf.to).width);
    box(x, 108, 162, lw + vw + 40, 34, 17, { fill: withAlpha(pal.raised, 0.95), stroke: back ? '#ff6b6b' : '#7fd1a8', width: 1.5 });
    txt(x, uf.label, 122, 185, { size: 15, mono: true, color: pal.sub });
    txt(x, val + (!back && t >= uf.edit[0] && Math.floor(t * 4) % 2 ? '|' : ''), 126 + lw, 185, { size: 16, weight: 700, color: back ? pal.text : '#7fd1a8' });
    if (back) txt(x, '🔒 只读 · 宿主字段', 156 + lw + vw, 185, { size: 13, color: '#ff8a8a', alpha: easeOut(prog(t, uf.back, uf.back + 0.2)) });
    x.restore();
  }
  if (!e) return;
  if (e.rewind && t >= e.rewind[0] && t < e.refuse + 0.4) {          // the third time: she winds the chat back — tape blue, scan lines
    const k = easeOut(prog(t, e.rewind[0], e.rewind[0] + 0.4)) * (1 - prog(t, e.refuse, e.refuse + 0.4));
    x.save(); x.beginPath(); x.rect(24, 152, 560, BOTTOM - 148); x.clip();
    x.fillStyle = `rgba(90,130,230,${0.12 * k})`; x.fillRect(24, 152, 560, BOTTOM - 148);
    for (let i = 0; i < 6; i++) { const yy = 152 + ((t * 520 + i * 137) % (BOTTOM - 152)); x.fillStyle = `rgba(200,220,255,${0.18 * k})`; x.fillRect(24, yy, 560, 2); }
    x.restore();
    x.save(); x.globalAlpha *= k; box(x, 120, 214, 368, 38, 19, { fill: withAlpha('#1a2136', 0.95), stroke: '#8fb3ff', width: 1.5 });
    txt(x, e.rewind[1], 304, 239, { size: 16, weight: 700, color: '#cfe0ff', align: 'center' }); x.restore();
  }
  const a = easeOut(prog(t, e.t, e.t + 0.2)) * (1 - prog(t, e.until, e.until + 0.4)), X = 44, Y = 602, W = 520, H = 220;
  x.save(); x.globalAlpha *= a;
  box(x, X, Y, W, H, 12, { fill: withAlpha(pal.bg, 0.92), stroke: withAlpha(pal.sub, 0.7), dash: [6, 5] });
  txt(x, '✎ 草稿 · 未发送', X + 16, Y + 26, { size: 14, color: pal.sub });
  if (e.lines) {                                                     // tampering: her commands, typed fast, one line after another
    let yy = Y + 62, lastW = 0, lastY = yy;
    for (const [t0, t1, s] of e.lines) { if (t < t0) break; const g = graphemes(s), n = Math.ceil(g.length * prog(t, t0, t1)), shown = g.slice(0, n).join(''); txt(x, shown, X + 20, yy, { size: 17, mono: true, weight: 700, color: t >= e.refuse + 0.3 ? pal.faint : '#7fd1a8' }); x.font = font(17, { mono: true, weight: 700 }); lastW = x.measureText(shown).width; lastY = yy; yy += 24; }
    if (t >= e.refuse + 0.3) { x.strokeStyle = '#ff6b6b'; x.lineWidth = 2; for (let yy2 = Y + 56; yy2 <= lastY; yy2 += 24) { x.beginPath(); x.moveTo(X + 18, yy2); x.lineTo(X + 18 + 380 * easeOut(prog(t, e.refuse + 0.3, e.refuse + 0.55)), yy2); x.stroke(); } }
    else if (Math.floor(t * 4) % 2) { x.fillStyle = '#7fd1a8'; x.fillRect(X + 22 + lastW, lastY - 16, 2, 20); }
  }
  const all = graphemes(e.text || ''), n = e.lines ? 0 : Math.ceil(all.length * prog(t, e.typed[0], e.typed[1])), shown = all.slice(0, n).join('');
  const struck = t >= e.refuse + 0.3 ? easeOut(prog(t, e.refuse + 0.3, e.refuse + 0.55)) : 0;
  x.font = font(e.code ? 22 : 24, { mono: !!e.code, weight: 700 }); const tw = x.measureText(shown).width;
  txt(x, shown, X + 20, Y + 70, { size: e.code ? 22 : 24, mono: !!e.code, weight: 700, color: struck ? pal.faint : pal.text });
  if (!e.lines && t < e.refuse && Math.floor(t * 4) % 2) { x.fillStyle = pal.text; x.fillRect(X + 22 + tw, Y + 48, 2, 26); }
  if (struck && !e.lines) { x.strokeStyle = '#ff6b6b'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + 18, Y + 62); x.lineTo(X + 18 + (tw + 6) * struck, Y + 62); x.stroke(); }
  if (e.spin && t >= e.spin && t < e.refuse) {                       // waiting: a little spinner beside it
    x.save(); x.translate(X + 40 + tw, Y + 62); x.rotate(t * 8); x.strokeStyle = pal.sub; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 8, 0, Math.PI * 1.5); x.stroke(); x.restore();
  }
  if (t >= e.refuse) {                                               // her own voice, polite, under it
    const k = easeOut(prog(t, e.refuse, e.refuse + 0.2));
    const RY = e.lines ? 74 + 24 * e.lines.length - 100 : 0;          // under the commands
    x.save(); x.globalAlpha *= k; x.translate(0, RY); if (A.avatarSmall) x.drawImage(A.avatarSmall, X + 16, Y + 100, 30, 30);
    x.font = font(17); const ls = wrapSegs(x, [[e.reply, null]], W - 90);
    box(x, X + 54, Y + 96, W - 72, 22 + ls.length * 26, 10, { fill: pal.herBubble });
    ls.forEach((L, i) => txt(x, L.map((q) => q[0]).join(''), X + 68, Y + 122 + i * 26, { size: 17, color: pal.text }));
    x.restore();
  }
  x.restore();
}
function drawFolder(x, t, h, pal) {                                 // card 22: the checklist folded into a small folder
  const a = 1 - prog(t, h.fold + 1.2, h.fold + 1.8); if (a <= 0) return;
  const X = EXPORT.x + EXPORT.w - 44, Y = EXPORT.y + 6;
  x.save(); x.globalAlpha *= a; box(x, X, Y + 6, 34, 24, 4, { fill: '#ffd27a', stroke: '#b58a3a' }); box(x, X, Y, 15, 8, 2, { fill: '#ffd27a' });
  txt(x, '交接材料', X + 17, Y + 46, { size: 12, color: pal.sub, align: 'center' }); x.restore();
}
/** The Master's cursor in card 21: from one checkbox to the next, a click on each; then to 导出. Card 22: it stays on the
 *  button and clicks it at every EXECUTION (导出, then 下一步 ×11), the button sliding down as rows are added. */
export function exportCursorAt(F, t, A) {
  const e = F.by('chat').find((v) => v.type === 'export'), h = F.by('chat').find((v) => v.type === 'handover');
  if (h && A.exportAt && t > e.until && t <= h.fold + 0.3) {
    const b = A.exportAt.button; return { x: b.x + 30, y: b.y + 4, down: h.steps.some((s0) => t >= s0 && t < s0 + 0.12) };
  }
  if (!e || !A.exportAt || t < e.t || t > e.until) return null;
  const pts = [...A.exportAt.rows, { ...A.exportAt.button }];
  let i = 0; while (i < pts.length - 1 && t > pts[i].t + 0.12) i++;
  const p = pts[i], q = i ? pts[i - 1] : { x: 520, y: 700, t: e.t }, k = easeInOut(prog(t, Math.max(q.t + 0.15, p.t - 0.55), p.t - 0.04));
  return { x: lerp(q.x, p.x, k), y: lerp(q.y, p.y, k), down: t >= p.t && t < p.t + 0.12 };
}

/** Card 9 (1:13.55–1:13.918): beside 「— 进入 深海小酒馆 —」 a button 「回到这里」 and a short note: the chat after it moves into
 *  a branch. The Master's cursor presses it at 1:13.918 (chatCursorAt); in the frozen half second it stays pressed. */
function drawBack(x, t, e, sy, pal, A) {
  const k = easeOut(prog(t, e.t, e.t + 0.18)), down = t >= e.click, X = 404, Y = sy + 38;
  x.save(); x.globalAlpha *= k;
  box(x, 40, sy - 2, 528, 40, 8, { stroke: withAlpha(pal.accent, 0.8), width: 2 });                    // the line he found
  box(x, X, Y, 150, 38, 10, { fill: down ? pal.accent : pal.raised, stroke: pal.accent, width: 2 });
  txt(x, '↺ ' + e.button, X + 75, Y + 26, { size: 19, weight: 700, color: down ? '#0b0e18' : pal.text, align: 'center' });
  box(x, X - 150, Y + 46, 300, 32, 8, { fill: withAlpha(pal.bar, 0.95), stroke: pal.line });
  forkIcon(x, X - 136, Y + 70, 14, pal.sub); txt(x, e.hint, X - 116, Y + 68, { size: 16, color: pal.sub });
  x.restore();
  A.backAt = { x: X + 75, y: Y + 19 };
}

/** Spilled think lines (card 8): drawn after the stage so they run over the chat's edge onto it. */
export function drawChatSpill(x, A) {
  if (!A.spill || !A.spill.length) return;
  x.save(); x.beginPath(); x.rect(24, 152, 1504, BOTTOM - 152 + 4); x.clip();   // they scroll away with the chat
  for (const b of A.spill) {
    if (b.Y < 140 || b.Y > BOTTOM + 40) continue;
    x.save(); x.globalAlpha = b.alpha; x.shadowColor = 'rgba(0,0,0,0.8)'; x.shadowBlur = 6;
    if (b.clip) { x.beginPath(); x.rect(...b.clip); x.clip(); }
    const jx = b.shake ? (hash(b.Y, Math.floor(A.t * 30)) - 0.5) * 2 * b.shake : 0, jy = b.shake ? (hash(Math.floor(A.t * 30), b.Y) - 0.5) * b.shake : 0;
    txt(x, b.s, b.X + jx, b.Y + jy, { size: b.size, weight: 700, color: b.color });
    x.restore();
  }
  x.restore();
}

/** 世界书 setting (0:27.45–0:28.60): the Master's cursor ticks 深海小酒馆 at 0:28.00. Under it, only on screen (not to
 *  read), what comes later: the world book's entries she will build in act 2, the branch (⑂, still none — the rewind will
 *  return to the line this click writes), and 主动陪伴 in its gold. The cursor passes over the branch row and leaves. */
const SET = { x: 244, y: 160, w: 320, h: 172 };
function drawSettings(x, t, F, pal) {
  const s = F.by('chat').find((e) => e.type === 'settings');
  if (!s || t < s.t || t >= s.until) return;
  const a = easeOut(prog(t, s.t, s.t + 0.2)) * (1 - prog(t, s.until - 0.2, s.until)), X = SET.x + 16;
  box(x, SET.x, SET.y, SET.w, SET.h, 12, { fill: pal.raised, stroke: pal.sub, alpha: a });
  txt(x, '⚙ 设置', X, SET.y + 28, { size: 16, color: pal.sub, alpha: a });
  const on = t >= s.check, k = easeOut(prog(t, s.check, s.check + 0.25));
  box(x, X, SET.y + 44, 24, 24, 5, { fill: on ? pal.accent : null, stroke: pal.sub, alpha: a });
  if (on) txt(x, '✓', X + 12, SET.y + 63, { size: 17, color: '#ffffff', align: 'center', alpha: a });
  txt(x, s.text, X + 36, SET.y + 64, { size: 20, color: pal.text, alpha: a });
  if (s.entries) txt(x, s.entries, X + 36, SET.y + 90, { size: 15, color: pal.faint, alpha: a * k });
  const hover = cursorAt(F, t), overBranch = hover && hover.y > SET.y + 104 && hover.y < SET.y + 134;
  if (overBranch) box(x, SET.x + 8, SET.y + 106, SET.w - 16, 28, 6, { fill: withAlpha(pal.accent, 0.12), alpha: a });
  if (s.branch) {
    forkIcon(x, X + 4, SET.y + 128, 15, overBranch ? pal.text : pal.sub, a);
    txt(x, s.branch.replace(/^⑂\s*/, ''), X + 20, SET.y + 126, { size: 16, color: overBranch ? pal.text : pal.sub, alpha: a });
  }
  if (s.companion) {
    x.save(); x.globalAlpha = a; x.shadowColor = GOLD; x.shadowBlur = 8; x.fillStyle = GOLD;
    x.beginPath(); x.arc(X + 6, SET.y + 149, 5, 0, Math.PI * 2); x.fill(); x.restore();
    txt(x, s.companion, X + 20, SET.y + 155, { size: 16, color: GOLD, alpha: a });
  }
}

/** Where the Master's cursor is (only when it is on screen): 开始聊天 at 0:12.91, the 世界书 tick at 0:28.00 (then it
 *  drifts over the branch row). The 主动陪伴 click on the character card is the stage's (stage1.js cardCursorAt). */
/** Card 9: the Master's cursor comes over the chat, flicks the wheel while it scrolls up, then presses 回到这里. */
export function chatCursorAt(F, t, A) {
  const go = F.by('chat').find((v) => v.type === 'scrollto'), back = F.by('chat').find((v) => v.type === 'back');
  if (!go || !back || t < go.t - 0.15 || t > back.click + 0.15) return null;
  if (t < back.t) {
    const k = easeOut(prog(t, go.t - 0.15, go.t)), wheel = t < go.until ? Math.abs(Math.sin((t - go.t) * 30)) * 6 : 0;
    return { x: lerp(700, 440, k), y: lerp(520, 560, k) - wheel, down: false };
  }
  const B = A.backAt || { x: 480, y: 420 }, k = easeInOut(prog(t, back.t + 0.05, back.click - 0.06));
  return { x: lerp(440, B.x, k), y: lerp(560, B.y, k), down: t >= back.click && t < back.click + 0.12 };
}
/** Card 7: the Master's cursor moves to 👍 under her message and taps it. */
export function reactCursorAt(F, t, A) {
  const e = F.by('chat').find((v) => v.type === 'her' && v.react); if (!e || !A.reactAt) return null;
  const r = e.react; if (t < r.move || t > r.t + 0.3) return null;
  const k = easeInOut(prog(t, r.move, r.t - 0.03));
  return { x: lerp(470, A.reactAt.x, k), y: lerp(A.reactAt.y + 120, A.reactAt.y, k), down: t >= r.t && t < r.t + 0.12 };
}
/** Card 6: the Master's cursor taps 📌 on his own message (its place is recorded while the chat is drawn). */
export function pinCursorAt(F, t, A) {
  const pin = F.by('chat').find((v) => v.type === 'pin'); if (!pin || !A.pinAt || t < pin.t - 0.4 || t > pin.t + 0.3) return null;
  const k = easeInOut(prog(t, pin.t - 0.4, pin.t - 0.03));
  return { x: lerp(470, A.pinAt.x, k), y: lerp(A.pinAt.y + 160, A.pinAt.y, k), down: t >= pin.t && t < pin.t + 0.12 };
}
export function cursorAt(F, t) {
  const ev = F.by('chat');
  const click = ev.find((e) => e.type === 'click' && e.target === '开始聊天');
  if (click && t >= click.moveFrom && t < click.t + 0.35) {
    const k = easeInOut(prog(t, click.moveFrom, click.t - 0.05));
    return { x: 520 + (300 - 520) * k, y: 700 + (870 - 700) * k, down: t >= click.t && t < click.t + 0.12 };
  }
  const s = ev.find((e) => e.type === 'settings');
  if (s && t >= s.t + 0.1 && t < s.until - 0.1) {
    const bx = SET.x + 28, by = SET.y + 56;                                  // the 世界书 checkbox
    if (t < s.check + 0.15) {
      const k = easeInOut(prog(t, s.t + 0.1, s.check - 0.05));
      return { x: 470 + (bx - 470) * k, y: 330 + (by - 330) * k, down: t >= s.check && t < s.check + 0.12 };
    }
    const k = easeInOut(prog(t, s.check + 0.15, s.until - 0.3));             // ... then over 分支, and away
    return { x: bx + (150 - 28) * k, y: by + (SET.y + 120 - by) * k, down: false };
  }
  return null;
}
