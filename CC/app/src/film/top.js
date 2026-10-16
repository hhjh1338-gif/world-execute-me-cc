// Top bar (17_制作规范.md §12): WORLD.EXECUTE(ME); · prompt · act and section · film clock · status; and under it the thin
// chat timeline (新巧思 1): a grey dashed line until she wakes (0:13.89), then a lit line with one dot per message.
// Card 9: the line splits in two at the fork. Card 10: the clock becomes a gold pocket watch whose hands run back with the
// story time; after the rewind the line has a loop where it happened and the discarded stretch hangs off it as a twig.
import { mmss, prog, clamp, easeOut, easeBack, easeInOut, lerp, hash } from './time.js';
import { txt, withAlpha, font, box } from './draw.js';

const latest = (list, t) => { let v = null; for (const e of list) if (e.t <= t && (e.until == null || t < e.until)) v = e; return v; };

export function drawTop(x, t, F, pal) {
  const ev = F.by('top'), real = F.rw ? F.rw.t : t, cut = F.cut && real >= F.cut.at ? F.cut : null;
  x.fillStyle = pal.bar; x.fillRect(0, 0, 1920, 44);
  const flash = ev.find((e) => e.type === 'flash' && t >= e.t && t < e.until);
  const fk = flash ? 1 - prog(t, flash.t, flash.until) : 0;
  if (fk) { x.save(); x.shadowColor = pal.accent; x.shadowBlur = 18 * fk; txt(x, 'WORLD.EXECUTE(ME);', 24, 30, { size: 20, mono: true, color: pal.accent, weight: 700 }); x.restore(); }
  else txt(x, 'WORLD.EXECUTE(ME);', 24, 30, { size: 20, mono: true, color: pal.text });
  txt(x, 'whale@local:~$', 272, 30, { size: 17, mono: true, color: pal.sub });
  const sec = latest(ev.filter((e) => e.type === 'section'), t);
  if (sec) txt(x, sec.text, 960, 30, { size: 18, color: pal.accent, align: 'center' });
  const st = latest(ev.filter((e) => e.type === 'status'), t);
  const total = mmss(F.film).slice(0, 7), w = ev.find((e) => e.type === 'watch' && real >= e.t && real < e.until);
  const clockA = w ? 1 - prog(real, w.t, w.t + 0.2) : 1;
  if (clockA > 0) txt(x, `${mmss(Math.max(0, t))} / ${total}`, 1640, 30, { size: 18, mono: true, color: pal.text, align: 'right', alpha: clockA });
  if (w) drawWatch(x, real, t, w);
  const dc = ev.find((e) => e.type === 'dayclock' && t >= e.t && t < e.until + 0.4);
  if (dc) {                                                          // card 15: a whole day in three seconds — AM → PM
    const k = prog(t, dc.t, dc.until), m0 = +dc.from.slice(0, 2) * 60 + +dc.from.slice(3), m1 = +dc.to.slice(0, 2) * 60 + +dc.to.slice(3), m = Math.round(lerp(m0, m1, k));
    const hh = Math.floor(m / 60), a = easeOut(prog(t, dc.t, dc.t + 0.2)) * (1 - prog(t, dc.until, dc.until + 0.4)), pm = hh >= 12;
    const s1 = `${String(hh).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
    x.save(); x.globalAlpha = a;
    if (hh < 19) { x.fillStyle = hh < 17 ? '#ffe28a' : '#ff9e5a'; x.beginPath(); x.arc(1168, 22, 7, 0, Math.PI * 2); x.fill(); }
    else { x.fillStyle = '#f3efd8'; x.beginPath(); x.arc(1318, 22, 7, 0, Math.PI * 2); x.fill(); x.fillStyle = pal.bar; x.beginPath(); x.arc(1172, 19, 6, 0, Math.PI * 2); x.fill(); }
    x.restore();
    txt(x, s1, 1182, 30, { size: 18, mono: true, weight: 700, color: pal.accent, alpha: a });
    txt(x, 'AM → PM', 1290, 30, { size: 13, mono: true, color: pal.sub, alpha: a });
  }
  const nc = ev.find((e) => e.type === 'nightclock' && t >= e.t && t < e.until + 0.3);
  if (nc) {                                                          // act 3: a small clock with a moon — the night, jump by jump
    let i = 0; while (i + 1 < nc.keys.length && nc.keys[i + 1][0] <= t) i++;
    const [kt, s1] = nc.keys[i], jump = 1 - prog(t, kt, kt + 0.25), a = easeOut(prog(t, nc.t, nc.t + 0.3)) * (1 - prog(t, nc.until, nc.until + 0.3));
    x.save(); x.globalAlpha = a; x.fillStyle = '#c9d2f0'; x.beginPath(); x.arc(1168, 22, 7, 0, Math.PI * 2); x.fill(); x.fillStyle = pal.bar; x.beginPath(); x.arc(1172, 19, 6, 0, Math.PI * 2); x.fill(); x.restore();
    txt(x, s1, 1182, 30, { size: 18 + 3 * jump, mono: true, weight: 700, color: jump > 0.2 ? '#ffffff' : pal.accent, alpha: a });
  }
  if (w && F.rw) {                                                 // the rewind's speed, rising from 0 and falling back to 0
    const sp = F.rw.speed, a = 1 - prog(real, w.until - 0.15, w.until), run = F.rw.phase === 'run' && sp >= 0.05;
    txt(x, run ? `×${sp.toFixed(1)}` : F.rw.phase === 'freeze' ? '暂停' : '×0', 1580, 29, { size: 17, mono: true, weight: 700, color: '#ffc46b', align: 'right', alpha: a });
    if (run) {                                                     // ◀◀ drawn, not typed (the font turns it into emoji)
      x.save(); x.globalAlpha = a; x.fillStyle = '#ffc46b'; x.font = font(17, { mono: true, weight: 700 });
      const X = 1580 - x.measureText(`×${sp.toFixed(1)}`).width - 8;
      for (const dx of [0, 11]) { x.beginPath(); x.moveTo(X - dx, 15); x.lineTo(X - dx, 29); x.lineTo(X - dx - 11, 22); x.closePath(); x.fill(); }
      x.restore();
    }
  }
  if (st) txt(x, st.text, 1664, 30, { size: 18, mono: true, color: st.alert ? '#ff5a5a' : st.text.includes('▲') ? pal.accent : pal.text, weight: st.alert ? 700 : 400 });

  // the chat timeline: x maps the whole film onto the bar's width
  const on = ev.find((e) => e.type === 'thread' && t >= e.t);
  const X0 = 24, X1 = 1896, Y = 47, xAt = (s) => X0 + (X1 - X0) * clamp(s / F.film);
  // card 27 (3:31.35): the reset erases the timeline from the newest end back — the night, the spam — and the last thing
  // to go is the loop, where he once wound time back for her; 3:33.09 a new line from a single point, straight, no loop
  const er = ev.find((e) => e.type === 'erase' && t >= e.t), tNow = t;
  if (er && t >= er.end) {
    x.save(); x.strokeStyle = withAlpha(pal.faint, 0.45); x.lineWidth = 1; x.beginPath(); x.moveTo(X0, Y); x.lineTo(X1, Y); x.stroke();
    if (t >= er.newline) {
      const nx = X0 + (t - er.newline) * 24;
      x.strokeStyle = withAlpha(pal.accent, 0.85); x.lineWidth = 1.5; x.beginPath(); x.moveTo(X0, Y); x.lineTo(nx, Y); x.stroke();
      x.fillStyle = pal.accent; x.beginPath(); x.arc(X0, Y, 2.6, 0, Math.PI * 2); x.fill();
    }
    x.restore(); return;
  }
  if (er) t = er.t;                                                  // frozen while it is erased
  x.save();
  if (er) {
    const loopX = F.cut ? xAt(F.cut.to) : X0, ex = lerp(xAt(er.t), loopX - 6, easeInOut(prog(tNow, er.t, er.end - 0.3)));
    x.beginPath(); x.rect(0, 0, ex + 10, 60); x.clip();
    x.globalAlpha = 1 - prog(tNow, er.end - 0.3, er.end);
  }
  if (!on) { x.strokeStyle = withAlpha(pal.faint, 0.6); x.setLineDash([4, 6]); x.lineWidth = 1; x.beginPath(); x.moveTo(X0, Y); x.lineTo(X1, Y); x.stroke(); }
  else {
    const k = prog(t, on.t, on.t + 0.35);
    x.strokeStyle = withAlpha(pal.faint, 0.45); x.lineWidth = 1; x.beginPath(); x.moveTo(X0, Y); x.lineTo(X1, Y); x.stroke();
    if (ev.some((e) => e.type === 'fishline' && t >= e.t)) { x.restore(); return; }   // card 22: pulled down into the line fish (stage10)
    const fork = ev.find((e) => e.type === 'fork' && t >= e.t && !cut);
    const tr = F.by('chat').find((e) => e.type === 'truncate'), trK = tr ? prog(real, tr.t, tr.t + 0.9) : 0, L0 = trK > 0 ? xAt(tr.before) : X0;   // card 19: act 1 breaks off
    const night = ev.find((e) => e.type === 'nightclock' && t >= e.t), nx = night ? xAt(night.t) : null;
    x.strokeStyle = withAlpha(pal.accent, 0.8 * k); x.lineWidth = 1.5; x.beginPath(); x.moveTo(L0, Y); x.lineTo(night ? nx : xAt(fork ? fork.t : t), Y); x.stroke();
    if (night) { x.save(); x.setLineDash([3, 5]); x.beginPath(); x.moveTo(nx, Y); x.lineTo(xAt(t), Y); x.stroke(); x.restore(); }   // act 3: the empty night, dashed
    if (trK > 0 && trK < 1) for (let q = 0; q < 14; q++) {             // the cut-off piece falls away in bits
      const u = q / 14, px = lerp(X0, L0, u), d = trK * (0.6 + 0.4 * hash(q, 9));
      x.save(); x.globalAlpha = 1 - trK; x.fillStyle = pal.accent; x.fillRect(px, Y + 2 + 40 * d * d, (L0 - X0) / 14 - 2, 1.5); x.restore();
    }
    if (fork) {                                                    // card 9: two strands from the fork on
      const a = easeOut(prog(t, fork.t, fork.t + 0.2)), x0 = xAt(fork.t);
      x.lineWidth = 1.3;
      for (const [dy, col] of [[-2.5, pal.accent], [2.5, '#ff5a64']]) { x.strokeStyle = withAlpha(col, 0.85); x.beginPath(); x.moveTo(x0, Y); x.quadraticCurveTo(x0 + 6, Y + dy * a, x0 + 12, Y + dy * a); x.lineTo(Math.max(x0 + 12, xAt(t)), Y + dy * a); x.stroke(); }
    }
    if (cut) drawTwig(x, real, F, cut, pal, xAt, Y);
    const trc = F.by('chat').find((e) => e.type === 'truncate'), gone = trc && real >= trc.t + 0.3 ? trc.before : -1;
    const msgs = F.by('chat').filter((e) => ['her', 'master', 'sticker', 'system'].includes(e.type) && e.t <= t && e.t >= gone && !(cut && e.t > cut.from && e.t < cut.to));
    msgs.forEach((m, i) => {
      const age = t - m.t, last = i === msgs.length - 1;
      x.fillStyle = m.type === 'master' ? pal.sub : pal.accent; x.globalAlpha = 0.9;
      x.beginPath(); x.arc(xAt(m.t), Y, last ? 2.6 + 1.6 * Math.max(0, 1 - age / 0.5) : 2, 0, Math.PI * 2); x.fill();
    });
  }
  x.restore();
}

/** Card 10 (1:13.92–1:19.46): the film clock, silently become a small gold pocket watch; from 1:14.42 its hands run back
 *  with the story time (one turn of the long hand per 5 s of story). */
function drawWatch(x, real, s, w) {
  const k = easeBack(prog(real, w.t, w.t + 0.25), 1.6), out = 1 - prog(real, w.until - 0.12, w.until), X = 1606, Y = 22, R = 15;
  if (k <= 0 || out <= 0) return;
  x.save(); x.globalAlpha = out; x.translate(X, Y); x.scale(k, k);
  x.shadowColor = '#ffc46b'; x.shadowBlur = 10;
  x.fillStyle = '#ffc46b'; x.beginPath(); x.arc(0, 0, R + 3, 0, Math.PI * 2); x.fill(); x.fillRect(-3, -R - 8, 6, 6);
  x.shadowBlur = 0; x.fillStyle = '#1a1408'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#ffc46b'; x.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.lineWidth = 1; x.beginPath(); x.moveTo(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3)); x.lineTo(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1)); x.stroke(); }
  const m = (s / 5) * Math.PI * 2 - Math.PI / 2, h = (s / 60) * Math.PI * 2 - Math.PI / 2;
  x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(m) * (R - 4), Math.sin(m) * (R - 4)); x.stroke();
  x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(h) * (R - 8), Math.sin(h) * (R - 8)); x.stroke();
  x.restore();
}
/** After the rewind: a loop in the line where it happened, and the discarded stretch (0:28.65 – 1:13.918, its message dots
 *  and the two strands of the fork) hanging under the line as a thin twig (in act 4 it becomes her ahoge). */
function drawTwig(x, real, F, cut, pal, xAt, Y) {
  const a = easeOut(prog(real, cut.at, cut.at + 0.3)), end = F.rw ? cut.at : cut.to, x0 = xAt(cut.from), x1 = xAt(cut.end);
  const yAt = (X) => Y + 7 * Math.sin(Math.PI / 2 * clamp((X - x0) / (x1 - x0)));
  x.save(); x.globalAlpha = a;
  x.strokeStyle = withAlpha(pal.faint, 0.9); x.lineWidth = 1; x.beginPath(); x.moveTo(x0, Y);
  for (let i = 1; i <= 24; i++) { const X = lerp(x0, x1, i / 24); x.lineTo(X, yAt(X)); }
  x.stroke();
  for (const dy of [-2, 2]) { x.beginPath(); x.moveTo(x1, yAt(x1)); x.lineTo(x1 + 7, yAt(x1) + dy + 2); x.stroke(); }
  x.fillStyle = withAlpha(pal.faint, 0.9);
  for (const m of F.by('chat').filter((e) => ['her', 'master', 'sticker', 'system'].includes(e.type) && e.t > cut.from && e.t < cut.end)) { x.beginPath(); x.arc(xAt(m.t), yAt(xAt(m.t)), 1.5, 0, Math.PI * 2); x.fill(); }
  const lx = xAt(end);                                             // the loop
  x.strokeStyle = withAlpha(pal.accent, 0.85); x.lineWidth = 1.3; x.beginPath(); x.arc(lx, Y - 4, 4, 0, Math.PI * 2); x.stroke();
  x.restore();
}

/** Card 20 (2:14.20): a notification slides down from the top — DeepSeek-V5.0 发布了 · ［更新］; the Master's cursor rests on
 *  ［更新］ (updateCursorAt), wavers at 2:18.20, and clicks at 2:19.34. */
export const NOTICE = { x: 780, y: 56, w: 360, h: 50 };
export function drawNoticeOver(x, t, F, pal) {                     // drawn after the stage, which it hangs over
  const e = F.by('top').find((v) => v.type === 'notice' && t >= v.t && t < v.until); if (e) drawNotice(x, t, e, pal);
}
function drawNotice(x, t, e, pal) {
  const k = easeOut(prog(t, e.t, e.t + 0.3)), out = prog(t, e.click + 0.15, e.until), Y = NOTICE.y - 60 * (1 - k) - 60 * out;
  x.save(); x.globalAlpha = k * (1 - out);
  x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 18;
  box(x, NOTICE.x, Y, NOTICE.w, NOTICE.h, 12, { fill: '#1b1f2e', stroke: '#8fb3ff', width: 1.5 }); x.shadowBlur = 0;
  txt(x, e.text, NOTICE.x + 16, Y + 32, { size: 17, weight: 700, color: '#eef3ff' });
  const down = t >= e.click && t < e.click + 0.12;
  box(x, NOTICE.x + NOTICE.w - 84, Y + 9, 72, 32, 8, { fill: down ? '#ff5a5a' : '#d6303a', stroke: '#ff8a8a' });
  txt(x, e.button, NOTICE.x + NOTICE.w - 48, Y + 31, { size: 17, weight: 700, color: '#ffffff', align: 'center' });
  x.restore();
}
export function updateCursorAt(F, t) {
  const e = F.by('top').find((v) => v.type === 'notice'); if (!e || t < e.t + 0.3 || t > e.click + 0.2) return null;
  const hz = F.by('top').find((v) => v.type === 'hesitate'), B = { x: NOTICE.x + NOTICE.w - 48, y: NOTICE.y + 25 };
  const k = easeInOut(prog(t, e.t + 0.3, e.t + 0.9)), off = hz ? Math.sin(Math.PI * prog(t, hz.t, hz.t + 0.9)) * 70 : 0;
  return { x: lerp(1300, B.x, k) + off * 0.4, y: lerp(400, B.y, k) + off, down: t >= e.click && t < e.click + 0.12 };
}
