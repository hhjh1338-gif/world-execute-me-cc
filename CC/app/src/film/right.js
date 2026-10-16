// Right panel (17_制作规范.md §12, §0.5): the user's core requirements (the host's record, she can only read it), the
// 「当前问题」 box (draft 3.3, from 0:07.69), and the run status (the machine's state). From script events only.
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash } from './time.js';
import { box, txt, withAlpha, font, wrap, canvas } from './draw.js';
import { ORANGE, OK, GOLD } from './palette.js';
import { tempAt } from './temperature.js';
import { floatOf } from './stage9.js';

const CORE = '#d9c08a';    // #1, the Master's core need: pale gold until it is pinned (0:43.51, act 2)

const NEED = { x: 1560, y: 76, w: 328, h: 256 }, Q = { x: 1560, y: 344, w: 328, h: 62 }, ST = { x: 1560, y: 418, w: 328, h: 490 };
const ORDER = ['power', 'model', 'download', 'network', 'VRAM', 'temperature', 'vision', 'speed', '思考', '年代', 'keep-company', '主人', '评价', '欠款', 'persona', '{{char}}', 'branch', 'world'];

const RED = '#ff5a5a', MH0 = 88, ROW0 = 62;
const notesAt = (F, real) => { const r = F.by('right').find((e) => e.type === 'memreset' && real >= e.t); return F.by('right').filter((e) => e.type === 'memnote' && e.t <= real && !(r && e.t < r.t)); };   // card 27: V5.0 has only the Master's line
const noteH = (n) => (n >= 3 ? 18 : 22);                            // act 3: three or more notes, a tighter hand
const memH = (F, real) => { const n = notesAt(F, real).length; return MH0 + noteH(n) * n + (n ? 2 : 0); };   // her notes grow under it (cards 11, 19, 21)
const CTX = 62;
const ROWFLOAT = { '{{char}}': '角色卡', world: '世界书', branch: '分支' };   // (persona is the Master's own persona: not exported)   // card 21: the row of what was just ticked bobs too                                                     // act 3: the context keyword strip above the memory
const measure = canvas(4, 4).getContext('2d');                     // for the layout when no frame is being drawn

/** Where everything in the status box is at t (sample notes 10: tidier — inline bars, more room): the box's top and height,
 *  the row pitch and each row's baseline. Shared with the stage (card 4's slider is pulled out of the temperature row). */
export function statusLayout(F, t, x = measure) {
  const ev = F.by('right'), real = F.rw ? F.rw.t : t;
  const q = ev.filter((e) => e.type === 'question' && e.t <= t).pop(), away = q && q.away != null && t >= q.t && t < q.away;
  x.save(); x.font = font(15); const ans = q && !away && q.answer ? wrap(x, q.answer, Q.w - 36) : []; x.restore();
  const qh = Q.h + (ans.length ? ans.length * 20 + 6 : 0), mem = ev.filter((e) => e.type === 'memory' && e.t <= real).pop();
  const cw = ev.find((e) => e.type === 'ctxwords' && t >= e.t && t < e.until + 0.5), ch = cw ? (CTX + 8) * (1 - easeInOut(prog(t, cw.until + 0.1, cw.until + 0.5))) : 0;   // packed away at the update
  const MH = memH(F, real), sy = Math.max(ST.y, Q.y + qh + 12), sh = ST.y + ST.h - sy - (mem ? MH + 10 : 0) - ch;
  const rows = {};
  for (const e of ev) if (e.type === 'status' && e.t <= (e.real ? real : t)) { if (e.remove) delete rows[e.key]; else rows[e.key] = { e, born: rows[e.key]?.born ?? e.t }; }
  const keys = ORDER.filter((k) => rows[k]), gap = clamp((sh - ROW0 - 14) / Math.max(1, keys.length - 1), 12.5, 34);   // crowded (card 17 on, act 3 most): tighter, smaller type
  return { sy, sh, qh, ans, q, away, mem, MH, gap, cw, ctxY: sy + sh + 8, rows: keys.map((key, i) => ({ key, y: sy + ROW0 + i * gap, ...rows[key] })) };
}
export const statusRowAt = (F, t, key) => { const L = statusLayout(F, t), r = L.rows.find((v) => v.key === key); return r ? { x: ST.x, y: r.y, w: ST.w } : null; };

export function drawRight(x, t, F, pal) {
  const ev = F.by('right'), real = F.rw ? F.rw.t : t;            // card 10: in the rewind t is the story time running back
  // ---- requirements box
  const states = ev.filter((e) => e.type === 'needbox' && e.t <= t), st = states[states.length - 1];
  const on = st && st.state === 'on', onK = on ? easeOut(prog(t, st.t, st.t + 0.3)) : 0;
  box(x, NEED.x, NEED.y, NEED.w, NEED.h, 12, { fill: pal.panel, stroke: on ? withAlpha(pal.accent, 0.25 + 0.3 * onK) : pal.line, dash: on ? null : [5, 5] });
  txt(x, '用户核心需求', NEED.x + 20, NEED.y + 30, { size: 18, color: pal.sub });
  if (st && st.state === 'waiting') txt(x, st.text, NEED.x + NEED.w / 2, NEED.y + 150, { size: 18, color: pal.faint, align: 'center', alpha: easeOut(prog(t, st.t, st.t + 0.4)) });
  if (on) {
    // ranked by what matters most right now (sample notes 4): each 'rank' event is the order from then on; a line that
    // changes place slides there, a new one comes in from the right, one that is gone fades out where it was
    const ranks = ev.filter((e) => e.type === 'rank' && e.t <= t), cur = ranks[ranks.length - 1], prev = ranks[ranks.length - 2];
    const slotY = (i) => NEED.y + 44 + i * 52, MOVE = cur && cur.move ? cur.move : 0.32;   // card 8's swaps are quicker
    for (let i = 0; i < 4; i++) { box(x, NEED.x + 16, slotY(i), 296, 44, 8, { stroke: pal.line, dash: [4, 4], alpha: onK }); txt(x, `#${i + 1}`, NEED.x + 30, slotY(i) + 28, { size: 16, mono: true, color: pal.line, alpha: onK }); }
    const k = cur && !cur.snap ? easeInOut(prog(t, cur.t, cur.t + MOVE)) : 1;   // snap: straight to the new order (after the rewind)
    const draw = (r, y, a, dx = 0, slot) => {
      if (r.tone === 'glass') { drawGlassNeed(x, t, r, NEED.x + 16 + dx, y, a, slot); return; }   // card 8: 分手, fighting 喜欢我 for #1
      if (r.tone === 'pending' || r.tone === 'solid') {             // card 20: 更换模型, the host's task — dashed until he clicks
        const solid = r.tone === 'solid', k2 = solid ? easeBack(prog(t, cur.t, cur.t + 0.25), 2.4) : 1;
        x.save(); x.globalAlpha *= a; const X = NEED.x + 16 + dx;
        if (solid && k2 < 1.2) { x.translate(X + 148, y + 22); x.scale(k2, k2); x.translate(-(X + 148), -(y + 22)); }
        box(x, X, y, 296, 44, 8, { fill: solid ? withAlpha('#d6303a', 0.85) : withAlpha('#d6303a', 0.08), stroke: '#ff5a5a', width: 2, dash: solid ? null : [6, 4] });
        txt(x, `#${slot + 1}`, X + 14, y + 28, { size: 16, mono: true, color: solid ? '#ffffff' : '#ff5a5a' });
        txt(x, r.text, X + 48, y + 30, { size: 22, weight: 700, color: solid ? '#ffffff' : '#ff8a8a' });
        txt(x, solid ? '宿主' : '待确认', X + 284, y + 28, { size: 14, color: solid ? '#ffe0e0' : '#ff8a8a', align: 'right' });
        x.restore(); return;
      }
      if (r.tone === 'greypin') { x.save(); x.globalAlpha *= a * 0.55; box(x, NEED.x + 16 + dx, y, 296, 44, 8, { fill: pal.raised, stroke: pal.faint }); txt(x, `#${slot + 1}`, NEED.x + 30 + dx, y + 28, { size: 16, mono: true, color: pal.faint }); txt(x, r.text, NEED.x + 64 + dx, y + 30, { size: 22, color: pal.faint }); txt(x, '📌', NEED.x + 300 + dx, y + 30, { size: 18, align: 'right' }); x.restore(); return; }
      const tone = r.color ? r.color : r.tone === 'orange' ? ORANGE : r.tone === 'pin' ? GOLD : r.tone === 'core' ? CORE : r.done ? pal.sub : pal.accent;   // r.color: cards 11–14 (茄子紫…)
      x.save(); x.globalAlpha *= a;
      box(x, NEED.x + 16 + dx, y, 296, 44, 8, { fill: pal.raised, stroke: tone });
      txt(x, `#${slot + 1}`, NEED.x + 30 + dx, y + 28, { size: 16, mono: true, color: tone });
      txt(x, r.text + (r.done ? '  ✓' : ''), NEED.x + 64 + dx, y + 30, { size: 22, color: r.color ? r.color : r.tone === 'orange' ? ORANGE : r.tone === 'pin' ? GOLD : r.tone === 'core' ? CORE : r.done ? pal.sub : pal.text, weight: r.tone === 'orange' || r.tone === 'pin' || r.color ? 700 : 400 });
      if (r.tone === 'pin') txt(x, '📌', NEED.x + 300 + dx, y + 30, { size: 18, align: 'right' });
      else if (!r.done && r.tone !== 'core') txt(x, '进行中', NEED.x + 300 + dx, y + 28, { size: 14, color: tone, align: 'right' });
      x.restore();
    };
    if (cur) {
      const before = prev ? prev.list.map((r) => r.id) : [];
      if (prev) prev.list.forEach((r, i) => { if (!cur.list.some((c) => c.id === r.id) && k < 1) draw(r, slotY(i), 1 - k, -24 * k, i); });
      // draw order: lines going down, lines staying, lines going up (they overtake, lifted a little), new lines last
      const moves = cur.list.map((r, i) => ({ r, i, j: before.indexOf(r.id) }));
      const rank = (m) => (m.j < 0 ? 3 : m.j < m.i ? 0 : m.j === m.i ? 1 : 2);
      for (const m of moves.sort((p, q) => rank(p) - rank(q))) {
        if (m.j < 0) {                                       // a new line comes in once the others have made room
          const e = easeOut(prog(t, cur.t + MOVE * 0.45, cur.t + MOVE * 0.45 + 0.22));
          if (e > 0) draw(m.r, slotY(m.i), e, 22 * (1 - e), m.i);
        } else draw(m.r, lerp(slotY(m.j), slotY(m.i), k), 1, m.j > m.i ? -12 * Math.sin(Math.PI * k) : 0, k < 0.5 ? m.j : m.i);
      }
    }
    const mr = ev.find((e) => e.type === 'misread' && t >= e.t && t < e.until);
    if (mr) drawMisread(x, t, mr, slotY(mr.slot), pal);
    const fo = ev.find((e) => e.type === 'focus' && t >= e.t && t < e.until + 0.3);
    if (fo) drawFocus(x, t, fo, slotY(fo.slot), pal);
    const ng = ev.find((e) => e.type === 'needgrey' && t >= e.t && t < e.until);   // card 18: the whole box goes grey
    if (ng) {
      const blink = ng.blink != null ? Math.sin(Math.PI * prog(t, ng.blink, ng.blink + 0.5)) : 0;
      x.save(); x.globalAlpha = (0.62 - 0.5 * blink) * easeOut(prog(t, ng.t, ng.t + 0.5)); x.fillStyle = pal.panel; x.fillRect(NEED.x + 10, NEED.y + 40, NEED.w - 20, NEED.h - 46); x.restore();
      x.save(); x.globalCompositeOperation = 'saturation'; x.fillStyle = '#808080'; x.globalAlpha = 0.85 * (1 - blink); x.fillRect(NEED.x + 10, NEED.y + 40, NEED.w - 20, NEED.h - 46); x.restore();
    }
    const fb = ev.find((e) => e.type === 'forbidden' && t >= e.t && t < e.t + 1.2);   // card 19: she cannot write 回来 in
    if (fb) drawForbidden(x, t, fb, slotY(fb.slot), pal);
  }
  // ---- 当前问题 (it grows when it holds an answer; the run status below gives way)
  const L = statusLayout(F, t, x), q = L.q, qh = L.qh;
  if (q && L.away) box(x, Q.x, Q.y, Q.w, Q.h, 10, { stroke: pal.line, dash: [4, 4] });     // card 6: out on the stage for a moment
  else if (q) {
    const a = easeOut(prog(t, q.t, q.t + 0.35)), first = ev.find((e) => e.type === 'question');
    box(x, Q.x, Q.y, Q.w, qh, 10, { fill: pal.panel, stroke: q.answer ? withAlpha(pal.accent, 0.5) : pal.line, alpha: easeOut(prog(t, first.t, first.t + 0.35)) });
    txt(x, '当前问题', Q.x + 18, Q.y + 24, { size: 16, color: pal.sub });
    if (q.busy) txt(x, q.busy, Q.x + Q.w - 16, Q.y + 24, { size: 14, color: pal.accent, align: 'right', alpha: 0.6 + 0.4 * Math.sin(t * 6) });
    txt(x, q.text, Q.x + 18, Q.y + 52, { size: 20, color: q.text === '—' ? pal.faint : pal.text, alpha: a });
    const cold = q.tone === 'cold';                                  // card 8 (sample notes 14): her conclusion, cold
    L.ans.forEach((l, k) => txt(x, l, Q.x + 18 + (cold ? (hash(Math.floor(t * 20), k) - 0.5) * 2 : 0), Q.y + 78 + k * 20, { size: 15, weight: cold ? 700 : 400, color: cold ? '#c9d6e6' : pal.sub, alpha: cold ? easeOut(prog(t, q.t, q.t + 0.15)) : a }));
    if (q.cursor && Math.floor(t * 2.2) % 2 === 0) { x.save(); x.globalAlpha = a; x.fillStyle = pal.accent; x.fillRect(Q.x + 40, Q.y + 34, 2, 20); x.restore(); }
  }
  // ---- the memory (card 6 on): the Master's own words, kept by the host and put into every request; it sits at the bottom
  // card 10: the host keeps it outside the chat history, so in the rewind it does not move — it glows (real time)
  const mem = L.mem, MH = L.MH;
  if (mem) {
    const mf = floatOf(F, '长期记忆', t); x.save(); x.translate(0, mf);   // sample notes 19: ticked for export, it loses its weight
    const k = easeOut(prog(real, mem.t, mem.t + 0.1)), Y = ST.y + ST.h - MH;
    if (mf < -0.5) { x.save(); x.shadowColor = 'rgba(0,0,0,0.7)'; x.shadowBlur = 18; x.shadowOffsetY = -mf * 1.6; box(x, ST.x, Y, ST.w, MH, 12, { fill: pal.panel }); x.restore(); }   // the card from the stage lands as it (stage4)
    const fl = ev.find((e) => e.type === 'memflash' && t >= e.t && t < e.t + 0.7), lit = Math.max(F.rw ? 0.8 + 0.2 * Math.sin(real * 3) : 0, fl ? Math.sin(Math.PI * prog(t, fl.t, fl.t + 0.7)) : 0);
    if (lit > 0) { x.save(); x.shadowColor = GOLD; x.shadowBlur = 26 * lit; box(x, ST.x, Y, ST.w, MH, 12, { fill: withAlpha(GOLD, 0.06 + 0.1 * lit), stroke: GOLD, width: 2 }); x.restore(); }
    box(x, ST.x, Y, ST.w, MH, 12, { fill: withAlpha(GOLD, 0.08), stroke: withAlpha(GOLD, 0.7 * k), width: 1.5 });
    txt(x, '记忆 · 宿主保存', ST.x + 18, Y + 22, { size: 14, color: withAlpha(GOLD, 0.9), alpha: k });
    const burning = ev.find((e) => e.type === 'burn' && t >= e.t && t < e.until + 0.4);
    const ml = ev.find((v) => v.type === 'memlabel' && real >= v.t && real < (v.until ?? Infinity)), mk = ml ? 1 - prog(real, ml.t, ml.t + 0.2) : 1;   // card 26: it has gone to be the bottle's label
    if (!burning) txt(x, mem.text, ST.x + 18, Y + 48, { size: 19, weight: 700, color: pal.text, alpha: k * mk });
    if (ml) box(x, ST.x + 12, Y + 28, ST.w - 24, 30, 6, { stroke: withAlpha(pal.sub, 0.5), dash: [4, 4], alpha: easeOut(prog(real, ml.t, ml.t + 0.4)) });   // an empty print where it was
    txt(x, mem.sub, ST.x + 18, Y + 72, { size: 14, color: pal.sub, alpha: k });
    const notes = notesAt(F, real), nh = noteH(notes.length);
    notes.forEach((note, i) => {                                     // hers, marked as hers; the Master's words are not changed
      const mc = ev.find((v) => v.type === 'memclear' && real >= v.t), out = mc ? prog(real, mc.t + i * mc.every, mc.t + i * mc.every + 0.5) : 0;   // card 27: her notes go out, one by one
      const nk = easeOut(prog(real, note.t, note.t + 0.3)) * (1 - out), NY = Y + 92 + i * nh - (nh < 22 ? 2 : 0);
      x.save(); if (note.lean) { x.translate(ST.x + 40, NY); x.rotate(note.lean * 0.035 * nk); x.translate(-(ST.x + 40), -NY); }   // card 21: they lean against each other
      x.beginPath(); x.arc(ST.x + 26, NY, 8, 0, Math.PI * 2); x.fillStyle = withAlpha(pal.sub, 0.25 * nk); x.fill();
      txt(x, note.who, ST.x + 26, NY + 4, { size: 11, weight: 700, color: pal.sub, align: 'center', alpha: nk });
      txt(x, note.text, ST.x + 40, NY + 5, { size: nh < 22 ? 13.5 : 15, color: pal.faint, alpha: nk });
      const us = ev.find((v) => v.type === 'memunsaved' && real >= v.t);   // card 22: only the Master's line goes with the export
      if (us) { x.font = font(nh < 22 ? 13.5 : 15); txt(x, '（未保存）', ST.x + 46 + x.measureText(note.text).width, NY + 5, { size: 12, color: '#c9a3a3', alpha: nk * easeOut(prog(real, us.t + i * 0.05, us.t + i * 0.05 + 0.25)) }); }
      x.restore();
    });
    const bu = ev.find((e) => e.type === 'burn' && t >= e.t && t < e.until + 0.4);
    if (bu) drawBurn(x, t, bu, Y, MH, mem, pal);
    x.restore();
  }
  if (L.cw) drawCtxWords(x, t, L.cw, L.ctxY, pal);
  // ---- run status: key · a small inline bar (or the thermometer) · value, one tidy row each
  const { sy, sh, gap } = L;
  box(x, ST.x, sy, ST.w, sh, 12, { fill: pal.bar, stroke: pal.line });
  txt(x, '运行状态', ST.x + 20, sy + 30, { size: 18, color: pal.sub });
  const jump = ev.find((e) => e.type === 'tempjump' && t >= e.t && t < e.until);   // card 8: it jumps by itself
  const slider = F.by('stage').find((v) => v.type === 'slider'), BX = ST.x + 124, BW = 70;
  for (const row of L.rows) {
    const gb = ev.find((v) => v.type === 'grab' && v.key === row.key && t >= v.t && t < v.until + 0.3), gj = gb ? (t < gb.until ? 2.5 : 2.5 * (1 - prog(t, gb.until, gb.until + 0.3))) : 0;   // card 24: she has hold of it
    const { key, e } = row, rf = ROWFLOAT[key] ? floatOf(F, ROWFLOAT[key], t, { lift: 0 }) : 0, y = row.y + 0.35 * rf + (gj ? (hash(Math.floor(t * 40), 7) - 0.5) * gj * 2 : 0), a = easeOut(prog(t, row.born, row.born + 0.25)), fresh = 1 - prog(t, e.t, e.t + 0.5);
    const tk = ROWFLOAT[key] && F.by('chat').find((v) => v.type === 'export')?.items.find(([, n]) => n === ROWFLOAT[key])?.[0];   // ticked: the row bobs a little and flashes gold
    if (tk != null && t >= tk && t < tk + 1.4) { x.save(); x.globalAlpha = 0.22 * (1 - prog(t, tk, tk + 1.4)); x.fillStyle = GOLD; x.fillRect(ST.x + 10, y - gap + 6, 308, gap); x.restore(); }
    let value = e.value, bar = e.bar, thermo = null;
    if (e.ramp) {
      let k = prog(t, e.t, e.until), v = lerp(e.ramp[0], e.ramp[1], k);
      if (e.steps) { let i = 0; while (i + 1 < e.steps.length && e.steps[i + 1][0] <= t) i++; const [a0, v0] = e.steps[i], nx = e.steps[i + 1]; v = nx ? lerp(v0, nx[1], prog(t, a0, nx[0])) : v0; k = (v - e.ramp[0]) / (e.ramp[1] - e.ramp[0]); }   // card 21: the download
      value = e.fmt.replace('{}', e.digits ? v.toFixed(e.digits) : Math.round(v)); bar = lerp(e.bar[0], e.bar[1], k);
    }
    const au = autoStatus(F, t, real, key, e);
    if (au) { value = au.value; bar = au.bar; }
    // card 4: the temperature row is what the slider drags (outlined while it is out, a line runs to it: stage3
    // drawSliderLink), and a thermometer from then on
    const out = key === 'temperature' && slider && t >= slider.t && t < slider.until;
    if (key === 'temperature' && slider && t >= slider.t) {
      const dr = ev.filter((v) => v.type === 'tempdrift' && t >= v.t).pop();   // the latest (act 3 creeping up; card 27 falling to 0; V5.0's 0.70)   // act 3: nobody touches it; it creeps up by itself
      let tv = jump ? jump.values[hash(Math.floor((t - jump.t) / jump.every), 7) < 0.5 ? 0 : 1] : tempAt(F, t);
      if (dr) { let i = 0; while (i + 1 < dr.keys.length && dr.keys[i + 1][0] <= t) i++; const [a0, v0] = dr.keys[i], nx = dr.keys[i + 1]; tv = nx ? lerp(v0, nx[1], easeInOut(prog(t, a0, nx[0]))) : v0; }
      value = tv.toFixed(2) + (dr && dr.mark != null && t >= dr.mark ? ' ↯' : '');
      if (ev.some((v) => v.type === 'tempblank' && t >= v.t && t < v.until)) { value = '—'; tv = null; }   // 3:31.35: reset — no temperature
      if (t >= slider.until && tv != null) thermo = tv;
    }
    if (gb) { x.save(); x.globalAlpha = 0.3; x.fillStyle = '#ff3b47'; x.fillRect(ST.x + 10, y - gap + 6, 308, gap); x.restore(); }
    const scar = ev.find((v) => v.type === 'grab' && v.key === key && t >= v.until);   // the mark where she pulled it
    if (scar) {                                                       // (it stops short of a long value: sample notes 35)
      x.font = font(gap < 15 ? 12 : gap < 19 ? 13 : 15, { mono: true }); const room = Math.min(14, Math.floor((ST.x + 308 - x.measureText(value).width - 10 - BX) / 5));
      if (room > 1) { x.save(); x.strokeStyle = 'rgba(255,90,100,0.6)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i <= room; i++) x[i ? 'lineTo' : 'moveTo'](BX + i * 5, y - 3 + (i % 2 ? -3 : 3)); x.stroke(); x.restore(); }
    }
    if (fresh > 0 && t >= e.t) { x.save(); x.globalAlpha = 0.16 * fresh; x.fillStyle = pal.accent; x.fillRect(ST.x + 10, y - gap + 8, 308, gap - 2); x.restore(); }
    if (out) box(x, ST.x + 8, y - 19, 312, 26, 6, { stroke: pal.accent, width: 1.5, alpha: easeOut(prog(t, slider.t, slider.t + 0.2)) * (1 - prog(t, slider.until - 0.3, slider.until)) });
    const fs = gap < 15 ? 12 : gap < 19 ? 13 : 15;
    txt(x, key, ST.x + 20, y, { size: fs, mono: true, color: pal.sub, alpha: a });
    const good = /✓|● on/.test(value), red = e.tone === 'red';
    txt(x, value, ST.x + 308, y, { size: fs, mono: true, color: red ? RED : good ? (pal.grey ? pal.text : OK) : pal.text, align: 'right', alpha: a });
    if (thermo != null) drawThermo(x, BX + 6, y - 5, thermo, pal);
    else if (bar != null && (x.font = font(fs, { mono: true }), ST.x + 308 - x.measureText(value).width > BX + BW + 8)) {   // a long value takes the bar's place (measured: sample notes 35, 「v5.0 就绪 · 自动切换」 ran into it)
      box(x, BX, y - 7, BW, 4, 2, { fill: pal.line, alpha: a });
      if (bar > 0) box(x, BX, y - 7, Math.max(3, BW * clamp(bar)), 4, 2, { fill: red ? RED : pal.accent, alpha: a });
    }
  }
}

// ---------------------------------------------------------------- the run status follows the chat (sample notes 13)
// speed while she types or thinks · 思考 counting every think · context growing with every message (and swelling while she
// thinks; dropping after the rewind, when the branch takes the discarded chat) · keep-company counting since his last
// message. A row's written events still win while they run (ramps, red values, the moment a value is set).
const chatNow = (F, t, real) => {
  const cut = F.cut && real >= F.cut.at ? F.cut : null;
  return F.by('chat').filter((m) => m.t <= t && !(cut && m.t > cut.from && m.t < cut.to));
};
const textOf = (m) => m.text || (m.lines ? m.lines.map((l) => l[1]).join('') : m.segs ? m.segs.map((g) => g[0]).join('') : '');
const typedEnd = (m) => (m.typeKeys ? m.typeKeys[m.typeKeys.length - 1][0] : m.typeUntil ?? m.t);
function autoStatus(F, t, real, key, e) {
  if (e.hold) return null;                                           // act 3: written values hold (31.2k, 32k · 截断)
  if (key === 'keep-company' && /^触发/.test(e.value || '')) return null;   // act 3: the timer fires, all night
  if (e.ramp && t < e.until) return null;                            // a written ramp is running
  if (t < e.t + 0.6) return null;                                    // a value was just set: show it
  const msgs = chatNow(F, t, real);
  if (key === 'context') {
    const v0 = e.ramp ? e.ramp[1] : parseFloat(e.value), from = e.ramp ? e.until : e.t;
    if (!Number.isFinite(v0)) return null;
    let tok = 0;
    for (const m of msgs) {
      if (m.t <= from) continue;
      if (m.type === 'her') tok += 8 + 1.4 * textOf(m).length * clamp(prog(t, m.t, typedEnd(m)) || (t >= typedEnd(m) ? 1 : 0));
      else if (m.type === 'master' || m.type === 'system') tok += 8 + 1.4 * textOf(m).length;
      else if (m.type === 'swipe') tok += 1.4 * (m.left.length + m.right.length) * clamp(prog(t, m.t, m.rightUntil));
      else if (m.type === 'think' && t < m.t + m.dur) tok += 1.2 * textOf(m).length * clamp(prog(t, m.t, m.t + m.dur * 0.9));   // freed when it is done
    }
    const v = v0 + tok / 1000;
    return { value: `${v.toFixed(1)}k / ${CTX_LIMIT}k`, bar: v / CTX_LIMIT, v };
  }
  if (key === 'speed') {
    if (e.tone === 'red') return null;                               // card 8's runaway number holds
    const typing = msgs.some((m) => (m.type === 'her' && t < typedEnd(m)) || (m.type === 'swipe' && t < m.t + 3));
    const thinking = msgs.some((m) => m.type === 'think' && t < m.t + m.dur);
    if (!typing && !thinking) return { value: '0 tok/s', bar: 0 };
    const v = Math.round(typing ? 46 + 22 * hash(Math.floor(t * 6), 3) : 32 + 16 * hash(Math.floor(t * 6), 5));
    return { value: `${v} tok/s`, bar: v / 200 };
  }
  if (key === '思考') {
    const th = msgs.filter((m) => m.type === 'think').pop(); if (!th) return null;
    if (t < th.t + th.dur) return { value: `${(t - th.t).toFixed(1)} s`, bar: clamp((t - th.t) / Math.max(1, th.dur)) };
    if (th.t + th.dur > e.t) return { value: `${th.dur.toFixed(1)} s ✓`, bar: null };
    return null;
  }
  if (key === 'keep-company') {
    let last = msgs.filter((m) => m.type === 'master').pop()?.t ?? e.t;
    if (F.cut && real >= F.cut.at) last = Math.max(last, F.cut.to);   // the rewind starts the count again
    return { value: `待命 · ${Math.max(0, t - Math.max(last, e.t)).toFixed(1)} s`, bar: null };
  }
  return null;
}

/** The context (sample notes 19: shown next to the chat's ⑂ — chat.js drawCtxGauge — with a 512k limit): k tokens at t,
 *  from the 'context' status events (counted from the chat as before) plus act 3's gauge: every time the timer wakes her
 *  she thinks deeply and it jumps; 2:06.25 it shoots past the limit, 2:06.40 the start is cut off and it stays pinned at
 *  the limit, every spam message trying to push past it again. */
export const CTX_LIMIT = 512;
export function contextAt(F, t) {
  const real = F.rw ? F.rw.t : t, list = F.by('right').filter((e) => e.type === 'status' && e.key === 'context');
  const e = list.filter((v) => v.t <= t).pop(); if (!e) return null;
  let v;
  if (e.ramp && t < e.until) v = lerp(e.ramp[0], e.ramp[1], prog(t, e.t, e.until));
  else { const au = autoStatus(F, t, real, 'context', e); v = au ? au.v : e.ramp ? e.ramp[1] : parseFloat(e.value) || 0; }
  const nc = F.by('chat').find((c) => c.type === 'newchat' && t >= c.t);   // card 27: the new conversation starts from nothing
  if (nc) return { v: 0.02 + 0.18 * prog(t, nc.t, nc.t + 1.5), limit: CTX_LIMIT, born: list[0].t, g: null, spike: 0, fresh: true };
  const g = F.by('chat').find((c) => c.type === 'ctxgauge' && t >= c.t), out = { v, limit: CTX_LIMIT, born: list[0].t, g, spike: 0 };
  if (!g) return out;
  for (let i = 1; i < g.keys.length; i++) out.v += (g.keys[i][1] - g.keys[i - 1][1]) * easeOut(prog(t, g.keys[i][0] - 0.05, g.keys[i][0] + 0.3));
  if (t >= g.cut) {                                                   // cut: pinned at the limit; each new message pokes past it
    out.pinned = true;
    for (const m of F.by('chat')) if (m.type === 'her' && m.t >= g.cut && m.t <= t && t < m.t + 0.2) out.spike = Math.max(out.spike, 9 * (1 - prog(t, m.t, m.t + 0.2)));
    out.v = CTX_LIMIT + out.spike;
  }
  if (g.compress && t >= g.compress[0]) {                            // sample notes 20: after 更新, compressed as the ring passes
    out.compressing = t < g.compress[1]; out.pinned = false; out.spike = 0;
    out.v = lerp(CTX_LIMIT, g.after, easeInOut(prog(t, g.compress[0], g.compress[1])));
  }
  return out;
}
/** The memory card's box at t (selection frames, stage9 drawSelections). */
export function memRect(F, t) {
  const L = statusLayout(F, t); if (!L.mem) return null;
  return { x: ST.x, y: ST.y + ST.h - L.MH + floatOf(F, '长期记忆', t), w: ST.w, h: L.MH };
}
/** A run-status row's box at t, with its little hop. */
export function rowRect(F, t, key) {
  const r = statusRowAt(F, t, key); if (!r) return null;
  const rf = ROWFLOAT[key] ? 0.35 * floatOf(F, ROWFLOAT[key], t, { lift: 0 }) : 0;
  return { x: ST.x + 10, y: r.y - 13 + rf, w: ST.w - 20, h: 17, row: true };
}

/** Act 3 (CC suggestion B): the context keyword strip — the day's words in a row; every message of the night pushes a new
 *  one in from the right and the oldest falls out; 2:04.52 compressing…, the start folds into one summary chip; 2:10.43
 *  nothing but 回来. Only the memory under it is never pushed out. */
function ctxList(e, t) {
  let L = e.words.map((w) => ({ w, tone: 'day', t: e.t }));
  for (const [pt, w, tone, drop] of e.pushes) {
    if (pt > t) break;
    if (drop) L = L.filter((c) => c.w !== drop);
    if (w && tone !== 'gone') L.push({ w, tone, t: pt }); else if (tone === 'gone') L = L.filter((c) => c.w !== w);
    while (L.length > 9) L.shift();
  }
  if (e.summary && t >= e.summary[0]) { const keep = L.filter((c) => c.t >= e.summary[0]); L = [{ w: e.summary[1], tone: 'sum', t: e.summary[0] }, ...keep]; }
  return L;
}
function drawCtxWords(x, t, e, Y, pal) {
  const a = easeOut(prog(t, e.t, e.t + 0.4)) * (1 - prog(t, e.until, e.until + 0.15)); if (a <= 0) return;
  x.save(); x.globalAlpha *= a;
  box(x, ST.x, Y, ST.w, CTX, 10, { fill: pal.bar, stroke: pal.line });
  const comp = e.compress != null && t >= e.compress && t < (e.summary ? e.summary[0] + 0.3 : e.compress + 1);
  txt(x, comp ? '上下文压缩中…' : '上下文关键词', ST.x + 14, Y + 20, { size: 13, color: comp ? '#ff8a8a' : pal.sub, alpha: comp ? 0.6 + 0.4 * Math.sin(t * 14) : 1 });
  x.save(); x.beginPath(); x.rect(ST.x + 8, Y + 26, ST.w - 16, CTX - 30); x.clip();
  let X = ST.x + 12; x.font = font(13);
  for (const c of ctxList(e, t)) {
    const w = x.measureText(c.w).width + 14, k = easeOut(prog(t, c.t, c.t + 0.18));
    const col = c.tone === 'red' ? '#ff5a5a' : c.tone === 'night' ? '#ff9ccf' : c.tone === 'sum' ? pal.faint : pal.sub;
    box(x, X + (1 - k) * 30, Y + 30, w, 22, 11, { fill: withAlpha(col, 0.14), stroke: withAlpha(col, 0.7), alpha: k });
    txt(x, c.w, X + 7 + (1 - k) * 30, Y + 46, { size: 13, color: col, alpha: k });
    X += w + 5;
  }
  x.restore(); x.restore();
}
/** Card 19 (2:04.30): she tries to write 回来 into #2 — the box shakes, 403 Forbidden · 只读, the word breaks on it. */
function drawForbidden(x, t, e, y, pal) {
  const fly = easeIn(prog(t, e.t, e.t + 0.25)), hit = t >= e.t + 0.25, u = t - e.t - 0.25;
  const X = NEED.x + 64 + (1 - fly) * -240, Yw = y + 30 + (1 - fly) * 300;
  if (!hit) txt(x, e.word, X, Yw, { size: 22, weight: 700, color: '#9fc3ff' });
  else {
    x.save(); x.translate(Math.sin(u * 80) * 5 * Math.max(0, 1 - u * 4), 0);
    box(x, NEED.x + 16, y, 296, 44, 8, { stroke: '#ff5a5a', width: 2.5, alpha: Math.max(0, 1 - u * 2) });
    x.restore();
    [...e.word].forEach((ch, i) => { const d = u * (1 + i * 0.3); txt(x, ch, NEED.x + 64 + i * 22 + d * 80 * (i ? 1 : -1), y + 30 + 420 * d * d, { size: 22, weight: 700, color: '#9fc3ff', alpha: Math.max(0, 1 - u * 1.4) }); });
    const pk = easeBack(prog(t, e.t + 0.25, e.t + 0.4), 2) * (1 - prog(t, e.t + 0.9, e.t + 1.2));
    x.save(); x.globalAlpha = Math.min(1, pk * 1.5); x.translate(NEED.x + NEED.w / 2, y - 6); x.scale(pk, pk);
    box(x, -128, -20, 256, 40, 8, { fill: '#2a0a0e', stroke: '#ff5a5a', width: 2 });
    txt(x, '403 Forbidden · 只读', 0, 7, { size: 17, mono: true, weight: 700, color: '#ff8a8a', align: 'center' });
    x.restore();
  }
}
/** Card 20 (2:15.40–2:19.34): the memory burns red; at ILLEGAL ARGUMENTS its two halves are pulled apart. */
function drawBurn(x, t, e, Y, MH, mem, pal) {
  const k = easeOut(prog(t, e.t, e.t + 0.6)) * (1 - prog(t, e.until, e.until + 0.4)), sp = easeOut(prog(t, e.split, e.split + 0.5)) * (1 - prog(t, e.until, e.until + 0.4));
  x.save(); x.shadowColor = '#ff3b30'; x.shadowBlur = 24 * k; box(x, ST.x, Y, ST.w, MH, 12, { fill: withAlpha('#d6303a', 0.18 * k), stroke: '#ff5a5a', width: 2.5, alpha: k }); x.restore();
  const [a, b] = mem.text.split(' · '), j = (hash(Math.floor(t * 30), 3) - 0.5) * 3 * k;
  txt(x, a, ST.x + 18 - 6 * sp + j, Y + 48, { size: 19, weight: 700, color: lerpCol(k) });
  x.font = font(19, { weight: 700 }); const aw = x.measureText(a + ' · ').width;
  txt(x, b, ST.x + 18 + aw + 22 * sp - j, Y + 48, { size: 19, weight: 700, color: lerpCol(k) });
  if (sp > 0) { x.save(); x.strokeStyle = withAlpha('#ffb0a0', 0.8 * sp); x.lineWidth = 1.5; x.beginPath(); const cx = ST.x + 18 + aw - 8 + 8 * sp; x.moveTo(cx, Y + 30); x.lineTo(cx - 6, Y + 40); x.lineTo(cx + 4, Y + 48); x.lineTo(cx - 3, Y + 58); x.stroke(); x.restore(); }
}
const lerpCol = (k) => `rgb(${Math.round(lerp(240, 255, k))},${Math.round(lerp(236, 110, k))},${Math.round(lerp(242, 100, k))})`;

/** Card 8 (sample notes 15): 分手 as a requirement — cold, cracked glass, trembling — swapping places with 喜欢我. */
function drawGlassNeed(x, t, r, X, y, a, slot) {
  const COLD = '#b9cbe0', tick = Math.floor(t * 24);
  x.save(); x.globalAlpha *= a; x.translate((hash(tick, 3) - 0.5) * 3, (hash(tick, 4) - 0.5) * 2);
  const g = x.createLinearGradient(X, y, X + 296, y + 44); g.addColorStop(0, 'rgba(150,180,215,0.28)'); g.addColorStop(0.5, 'rgba(40,58,80,0.85)'); g.addColorStop(1, 'rgba(150,180,215,0.22)');
  box(x, X, y, 296, 44, 8, { fill: g, stroke: COLD, width: 1.5 });
  x.strokeStyle = 'rgba(230,240,250,0.55)'; x.lineWidth = 1; x.beginPath();
  for (const [a0, b0, c0, d0] of [[96, 0, 108, 16], [108, 16, 102, 29], [102, 29, 116, 44], [108, 16, 128, 20], [228, 0, 220, 21], [220, 21, 234, 32]]) { x.moveTo(X + a0, y + b0); x.lineTo(X + c0, y + d0); }
  x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X + 6, y + 4, 284, 3);              // a cold shine along the top edge
  txt(x, `#${slot + 1}`, X + 14, y + 28, { size: 16, mono: true, color: COLD });
  txt(x, r.text, X + 48, y + 31, { size: 23, weight: 700, color: '#eef4fa' });
  txt(x, '她', X + 280, y + 28, { size: 13, weight: 700, color: COLD, align: 'right' });
  x.restore();
}

/** Card 8, 1:09.26 (sample notes 14): the program reads 需求[1] — the needs box focuses on #1 喜欢我 (the others dim) and a
 *  line runs to it from the program's first line on the stage while the pointer is there. */
function drawFocus(x, t, e, y, pal) {
  const k = easeOut(prog(t, e.t, e.t + 0.15)) * (1 - prog(t, e.until, e.until + 0.3)), COLD = '#c9d6e6';
  x.save(); x.globalAlpha = 0.6 * k; x.fillStyle = pal.panel; x.fillRect(NEED.x + 12, y + 50, 304, 160); x.restore();
  x.save(); x.globalAlpha = k; x.shadowColor = COLD; x.shadowBlur = 18; box(x, NEED.x + 12, y - 4, 304, 52, 10, { stroke: COLD, width: 2.5 }); x.restore();
  const la = k * (1 - prog(t, e.line, e.line + 0.15));
  if (la > 0) {
    const X0 = 1050, Y0 = 276, X1 = NEED.x + 12, Y1 = y + 22, run = easeOut(prog(t, e.t, e.t + 0.12));
    x.save(); x.globalAlpha = la; x.strokeStyle = COLD; x.lineWidth = 2; x.setLineDash([6, 6]); x.lineDashOffset = -t * 60;
    x.beginPath(); x.moveTo(X0, Y0); x.lineTo(lerp(X0, X1, run), lerp(Y0, Y1, run)); x.stroke(); x.setLineDash([]);
    x.fillStyle = COLD; x.beginPath(); x.arc(lerp(X0, X1, run), lerp(Y0, Y1, run), 4, 0, Math.PI * 2); x.fill();
    txt(x, '需求[1]', (X0 + X1) / 2, (Y0 + Y1) / 2 - 10, { size: 15, mono: true, color: COLD, align: 'center' });
    x.restore();
  }
}

/** Card 8 (1:09.26): her understanding laid over #1 — 分手, cold grey-blue, cracked, trembling, with a small 她: the host did
 *  not change the requirement; she read his question as one. 喜欢我 shows faint gold through it; #2–#4 fade. */
function drawMisread(x, t, e, y, pal) {
  const k = easeOut(prog(t, e.t, e.t + 0.25)), COLD = '#9fb3c8', tick = Math.floor(t * 24), X = NEED.x + 16;
  x.save(); x.globalAlpha = 0.65 * k; x.fillStyle = pal.panel; x.fillRect(NEED.x + 12, y + 50, 304, 160); x.restore();
  x.save(); x.globalAlpha = k; x.translate((hash(tick, 1) - 0.5) * 3 + 6, (hash(tick, 2) - 0.5) * 2 - 6 - (1 - k) * 18);
  box(x, X, y, 296, 44, 8, { fill: withAlpha('#1c2633', 0.8), stroke: COLD, width: 1.5 });
  x.strokeStyle = withAlpha('#d8e4f0', 0.55); x.lineWidth = 1; x.beginPath();
  for (const [a, b, c, d] of [[104, 0, 116, 15], [116, 15, 110, 28], [110, 28, 124, 44], [116, 15, 136, 19], [236, 0, 228, 21], [228, 21, 242, 33]]) { x.moveTo(X + a, y + b); x.lineTo(X + c, y + d); }
  x.stroke();
  txt(x, e.text, X + 150, y + 31, { size: 23, weight: 700, color: '#dbe6f2' });
  x.beginPath(); x.arc(X + 2, y + 2, 11, 0, Math.PI * 2); x.fillStyle = '#2a3646'; x.fill(); x.strokeStyle = COLD; x.stroke();
  txt(x, e.tag, X + 2, y + 7, { size: 13, weight: 700, color: '#dbe6f2', align: 'center' });
  x.restore();
}

/** A small thermometer (0.0 – 2.0): the temperature row from 0:51.36 on; the mercury creeps up by itself in the night. */
function drawThermo(x, X, Y, v, pal) {
  const L = 62, k = clamp(v / 2), col = v > 1.2 ? ORANGE : v < 0.4 ? '#cfe2ff' : '#ff7eb6';
  x.save(); x.strokeStyle = pal.sub; x.lineWidth = 1.5;
  x.beginPath(); x.roundRect(X, Y - 5, L, 10, 5); x.stroke();
  x.fillStyle = col; x.beginPath(); x.arc(X, Y, 8, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.roundRect(X, Y - 3, Math.max(6, L * k), 6, 3); x.fill();
  x.restore();
}
