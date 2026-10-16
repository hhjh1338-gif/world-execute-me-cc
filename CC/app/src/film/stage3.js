// Centre · stage, act 2, cards 4–5 (20_镜头卡_第二幕.md; times and texts in script/act2.json).
//   Card 4 (0:44.45–0:51.36): the Master drags her temperature. The row is pulled out of the right panel into a big slider;
//   at 0.1 the picture drains to cold white and she goes stiff; it flickers 0.1 ↔ 0.7; he sends a photo she cannot see
//   (the stage breaks into dark blocks, a crossed-out eye, a guilty bubble); at 2.0 everything spins and oversaturates;
//   then the slider stands up and shrinks into the right panel as a thermometer.
//   Card 5 (0:51.36–0:55.08): history role-play. A year ruler is pulled back one era per beat; SillyTavern's chat background
//   changes with it (tea house, wine flag, lanterns, a tent, a campfire) and she wears that era's costume (F2–F6).
import { prog, easeOut, easeIn, easeInOut, easeBack, lerp, clamp, hash, P } from './time.js';
import { box, txt, withAlpha } from './draw.js';
import { tempAt, tempLook } from './temperature.js';
import { statusRowAt } from './right.js';

const one = (F, type) => F.by('stage').find((e) => e.type === type);
const SL = { x0: 760, x1: 1376, y: 764, max: 2 };                // the big slider (0.0 – 2.0)
const ROW = { x: 1700, y: 712 };                                  // where the temperature row sits if the layout has none
const rowOf = (F, t) => { const r = statusRowAt(F, t, 'temperature'); return r ? { x: r.x + 160, y: r.y - 6 } : ROW; };
const kx = (v) => lerp(SL.x0, SL.x1, clamp(v / SL.max));

// ---------------------------------------------------------------- card 4: the slider
function sliderPose(e, t) {
  const out = easeInOut(prog(t, e.t, e.t + 0.16));                // pulled out of the right panel
  const home = easeInOut(prog(t, e.until - 0.36, e.until));       // stands up, shrinks back into the panel
  return { out, home };
}
export function drawSlider(x, t, F, pal) {
  const e = one(F, 'slider'); if (!e || t < e.t || t > e.until) return;
  const v = tempAt(F, t), { out, home } = sliderPose(e, t), R = rowOf(F, t);
  const cx = (SL.x0 + SL.x1) / 2, w = SL.x1 - SL.x0;
  x.save();
  x.translate(lerp(lerp(R.x, cx, out), R.x, home), lerp(lerp(R.y, SL.y, out), R.y, home));
  x.rotate(-Math.PI / 2 * home); x.scale(lerp(lerp(0.25, 1, out), 0.2, home), lerp(lerp(0.25, 1, out), 0.2, home));
  const hot = clamp((v - 1) / 1), col = hot > 0 ? withAlpha('#ff6a3d', 0.5 + 0.5 * hot) : '#cfe2ff';
  box(x, -w / 2 - 30, -46, w + 60, 92, 14, { fill: withAlpha('#0d0f1a', 0.82), stroke: withAlpha(col, 0.8), width: 2 });
  x.fillStyle = withAlpha('#ffffff', 0.18); x.fillRect(-w / 2, -3, w, 6);
  x.fillStyle = col; x.fillRect(-w / 2, -3, (kx(v) - SL.x0), 6);
  for (let i = 0; i <= 4; i++) { const X = -w / 2 + (w * i) / 4; x.fillStyle = withAlpha('#ffffff', 0.5); x.fillRect(X - 1, 10, 2, 9); txt(x, (i * 0.5).toFixed(1), X, 36, { size: 14, mono: true, color: '#cfd3ea', align: 'center' }); }
  const X = kx(v) - SL.x0 - w / 2;
  x.shadowColor = col; x.shadowBlur = 14; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(X, 0, 13, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
  txt(x, `temperature  ${v.toFixed(2)}`, -w / 2, -18, { size: 18, mono: true, weight: 700, color: col });
  x.restore();
}
/** Sample notes 10: a thin line from the slider back to the temperature row in the run status, so it is clear where the
 *  slider came from (drawn over the stage's edge, after the right panel). */
export function drawSliderLink(x, t, F, pal) {
  const e = one(F, 'slider'); if (!e || t < e.t + 0.12 || t > e.until - 0.1) return;
  const { out, home } = sliderPose(e, t), a = out * (1 - home); if (a <= 0.02) return;
  const R = statusRowAt(F, t, 'temperature'); if (!R) return;
  const X0 = SL.x1 + 30, Y0 = SL.y, X1 = R.x + 8, Y1 = R.y - 6, v = tempAt(F, t), hot = clamp((v - 1) / 1);
  const col = hot > 0 ? '#ff8a5a' : '#cfe2ff';
  x.save(); x.globalAlpha = a; x.strokeStyle = withAlpha(col, 0.75); x.lineWidth = 2; x.setLineDash([7, 6]); x.lineDashOffset = -t * 40;
  x.beginPath(); x.moveTo(X0, Y0); x.bezierCurveTo(X0 + 110, Y0, X1 - 90, Y1, X1, Y1); x.stroke(); x.setLineDash([]);
  x.fillStyle = col; for (const [X, Y] of [[X0, Y0], [X1, Y1]]) { x.beginPath(); x.arc(X, Y, 4, 0, Math.PI * 2); x.fill(); }
  x.restore();
}

/** The Master's cursor: clicks the temperature row, drags the knob down, later up to 2.0 and back. */
export function sliderCursorAt(F, t) {
  const e = one(F, 'slider'); if (!e || t < e.t - 0.35 || t > e.until - 0.3) return null;
  const v = tempAt(F, Math.max(t, e.t)) ?? 0.7;
  const R = rowOf(F, t);
  if (t < e.t) { const k = easeInOut(prog(t, e.t - 0.35, e.t - 0.03)); return { x: lerp(1500, R.x, k), y: lerp(560, R.y, k), down: false }; }
  const grabs = e.grab || [];
  const held = grabs.some(([a, b]) => t >= a && t < b);
  if (!held) {
    const next = grabs.find(([a]) => a > t);
    if (next && t > next[0] - 0.4) { const k = easeInOut(prog(t, next[0] - 0.4, next[0])); return { x: lerp(kx(v) + 60, kx(v), k), y: lerp(SL.y + 90, SL.y, k), down: false }; }
    return t < e.t + 0.16 ? { x: R.x, y: R.y, down: true } : { x: kx(v) + 60, y: SL.y + 90, down: false };
  }
  return { x: kx(v), y: SL.y, down: true };
}

/** 0:48.30: she cannot see the photo — the stage breaks into dark blocks, a crossed-out eye; a guilty bubble at "好看！". */
export function drawBlind(x, t, F) {
  const e = one(F, 'blind'); if (!e || t < e.t || t > e.until + 0.3) return;
  const out = 1 - prog(t, e.until, e.until + 0.3), cell = 46;
  x.save();
  for (let gy = 64; gy < 920; gy += cell) for (let gx = 608; gx < 1528; gx += cell) {
    const born = e.t + hash(gx, gy, 3) * 0.14; if (t < born) continue;
    x.globalAlpha = out * (0.78 + 0.2 * hash(gx, gy, 5)); x.fillStyle = hash(gx, gy, 7) > 0.85 ? '#1d1a2a' : '#0b0a12';
    x.fillRect(gx + 1, gy + 1, cell - 2, cell - 2);
  }
  // the crossed-out eye
  const k = easeBack(prog(t, e.t + 0.1, e.t + 0.3), 1.6), cx = 1068, cy = 430;
  x.globalAlpha = out * clamp(k); x.strokeStyle = '#cfd3ea'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(cx - 70, cy); x.quadraticCurveTo(cx, cy - 56 * k, cx + 70, cy); x.quadraticCurveTo(cx, cy + 56 * k, cx - 70, cy); x.stroke();
  x.beginPath(); x.arc(cx, cy, 16, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = '#ff5a6a'; x.lineWidth = 7; x.beginPath(); x.moveTo(cx - 60, cy - 50); x.lineTo(cx + 60, cy + 50); x.moveTo(cx + 60, cy - 50); x.lineTo(cx - 60, cy + 50); x.stroke();
  // "……好看！": a small guilty bubble squeezes out between the blocks
  if (e.bubble && t >= e.bubble) {
    const b = easeOut(prog(t, e.bubble, e.bubble + 0.5)), X = cx + 110, Y = cy + 40 - 120 * b;
    x.globalAlpha = out * (1 - prog(t, e.bubble + 0.4, e.bubble + 0.9)); x.strokeStyle = '#80b2d8'; x.lineWidth = 2.5;
    x.beginPath(); x.arc(X, Y, 16, 0, Math.PI * 2); x.stroke(); txt(x, '😅', X, Y + 7, { size: 18, align: 'center' });
  }
  x.restore();
}

// ---------------------------------------------------------------- card 5: the year ruler and the eras
const ERA_TINT = { 现代: null, 清: '#9fd8d2', 宋: '#e8d79a', 唐: '#5b8fd6', 汉: '#b23a3a', 公元前: '#ff8a3d' };
function eraAt(e, t) {
  let cur = null; for (const r of e.eras) if (t >= r.t) cur = r;
  return cur;
}
/** Behind her: the era's tint and a few props of SillyTavern's chat background. */
export function drawEraBack(x, t, F) {
  const e = one(F, 'years'); if (!e || t < e.t || t > e.back + 0.3) return;
  const r = eraAt(e, t); if (!r) return;
  const out = 1 - prog(t, e.back, e.back + 0.3), k = easeOut(prog(t, r.t, r.t + 0.12)), tint = ERA_TINT[r.era];
  x.save(); x.globalAlpha = out;
  if (tint) { x.fillStyle = withAlpha(tint, 0.16 * k); x.fillRect(608, 64, 920, 856); }
  x.globalAlpha = out * k; x.strokeStyle = withAlpha(tint || '#ffd9ea', 0.75); x.fillStyle = withAlpha(tint || '#ffd9ea', 0.55); x.lineWidth = 3;
  if (r.era === '清') {                                            // a tea-house eave and a hanging lamp
    x.beginPath(); x.moveTo(640, 210); x.quadraticCurveTo(760, 170, 900, 190); x.lineTo(1236, 190); x.quadraticCurveTo(1376, 170, 1496, 210); x.stroke();
    x.beginPath(); x.moveTo(700, 190); x.lineTo(700, 240); x.stroke(); x.beginPath(); x.ellipse(700, 262, 16, 22, 0, 0, Math.PI * 2); x.fill();
  } else if (r.era === '宋') {                                      // a wine flag with 酒
    x.beginPath(); x.moveTo(1400, 150); x.lineTo(1400, 470); x.stroke();
    x.fillRect(1400, 160, 80, 120); txt(x, '酒', 1440, 236, { size: 46, weight: 700, color: '#3a2a00', align: 'center' });
  } else if (r.era === '唐') {                                      // a row of round lanterns
    for (let i = 0; i < 4; i++) { const X = 690 + i * 70 + (i > 1 ? 560 : 0); x.beginPath(); x.moveTo(X, 100); x.lineTo(X, 150); x.stroke(); x.beginPath(); x.arc(X, 176, 24, 0, Math.PI * 2); x.fill(); }
  } else if (r.era === '汉') {                                      // a campaign tent
    x.beginPath(); x.moveTo(660, 620); x.lineTo(780, 380); x.lineTo(900, 620); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(780, 380); x.lineTo(780, 330); x.stroke(); x.fillRect(780, 330, 46, 26);
  } else if (r.era === '公元前') {                                  // a cave mouth and a campfire
    x.beginPath(); x.arc(1068, 920, 520, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    for (let i = 0; i < 3; i++) { const f = Math.sin(t * 14 + i * 2) * 6; x.fillStyle = withAlpha(['#ff8a3d', '#ffd27a', '#ff5a3d'][i], 0.8); x.beginPath(); x.moveTo(700 + i * 14, 640); x.quadraticCurveTo(708 + i * 14 + f, 590 - i * 8, 716 + i * 14, 640); x.fill(); }
  }
  x.restore();
}
/** Over everything on the stage: the year ruler being pulled back, one era per beat, and snapping home at 0:55.08. */
export function drawYears(x, t, F, pal) {
  const e = one(F, 'years'); if (!e || t < e.t || t > e.back + 0.4) return;
  const a = easeOut(prog(t, e.t, e.t + 0.3)) * (1 - prog(t, e.back + 0.15, e.back + 0.4));
  // the year shown: 2026, then each era's year (eased), snapping back to 2026 at e.back
  let year = 2026, from = 2026, at = e.t;
  for (const r of e.eras) if (t >= r.t) { from = year; year = r.year; at = r.t; }
  let shown = t >= e.back ? lerp(year, 2026, easeBack(prog(t, e.back, e.back + 0.25), 1.2)) : lerp(from, year, easeOut(prog(t, at, at + 0.2)));
  const Y = 104, cx = 1068, pxPerYear = 0.16;                     // the ruler: ticks every 100 years scroll under a fixed marker
  x.save(); x.globalAlpha = a;
  box(x, 640, Y - 26, 856, 64, 10, { fill: withAlpha('#0d0f1a', 0.7), stroke: withAlpha(pal.accent, 0.6) });
  x.save(); x.beginPath(); x.rect(644, Y - 24, 848, 60); x.clip();
  for (let yr = Math.floor((shown - 3000) / 100) * 100; yr <= shown + 3000; yr += 100) {
    const X = cx + (yr - shown) * pxPerYear; if (X < 630 || X > 1510) continue;
    const big = yr % 500 === 0; x.fillStyle = withAlpha('#ffffff', big ? 0.7 : 0.3); x.fillRect(X - 1, Y + 14 - (big ? 14 : 7), 2, big ? 14 : 7);
    if (big) txt(x, yr <= 0 ? `前${1 - yr}` : String(yr), X, Y + 30, { size: 12, mono: true, color: '#cfd3ea', align: 'center' });
  }
  x.restore();
  x.fillStyle = pal.accent; x.beginPath(); x.moveTo(cx, Y + 16); x.lineTo(cx - 8, Y - 2); x.lineTo(cx + 8, Y - 2); x.closePath(); x.fill();
  const yr = Math.round(shown);
  txt(x, yr <= 0 ? `公元前 ${1 - yr}` : `${yr}`, cx, Y - 6, { size: 24, weight: 700, mono: true, color: '#ffffff', align: 'center' });
  x.restore();
}
/** The Master's hand on the ruler: grabs it at 0:52.00 and pulls it left once per era. */
export function yearsCursorAt(F, t) {
  const e = one(F, 'years'); if (!e || t < e.grab - 0.3 || t > e.back) return null;
  const r = e.eras.filter((v) => v.t <= t).pop(), dt = r ? t - r.t : 9;
  const pull = easeOut(prog(dt, 0, 0.16)) * (1 - easeInOut(prog(dt, 0.18, 0.3)));   // pull left, slide back to grab again
  const k = easeInOut(prog(t, e.grab - 0.3, e.grab));
  return { x: lerp(1300, 1180, k) - 90 * pull, y: lerp(260, 112, k), down: t >= e.grab && dt < 0.18 };
}

/** At 2.0 she spins and bubbles fly off her in every direction. */
export function drawHotBubbles(x, t, F) {
  const sl = one(F, 'slider'); if (!sl || !sl.spin || t < sl.spin[0] || t > sl.spin[1] + 0.8) return;
  x.save(); x.strokeStyle = '#ff9ccf'; x.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const born = sl.spin[0] + hash(i, 1) * (sl.spin[1] - sl.spin[0]), k = prog(t, born, born + 0.8); if (k <= 0 || k >= 1) continue;
    const a = hash(i, 2) * Math.PI * 2, r = 60 + 380 * easeOut(k), X = 1068 + r * Math.cos(a), Y = 470 + r * 0.8 * Math.sin(a);
    x.globalAlpha = 1 - k; x.beginPath(); x.arc(X, Y, 6 + 10 * hash(i, 3), 0, Math.PI * 2); x.stroke();
  }
  x.restore();
}

/** What her figure is doing at t in cards 4–5: a costume, a forced (coarser) form, a spin, standing still. */
export function herMods(F, t) {
  const mods = {};
  const { cold, hot } = tempLook(F, t);
  if (cold > 0.5) { mods.f = 3.5; mods.still = true; }            // 0.1: stiff square blocks, no breath
  const sl = one(F, 'slider');
  if (sl && sl.spin && t >= sl.spin[0] && t < sl.spin[1]) mods.spin = Math.PI * 4 * easeInOut(prog(t, sl.spin[0], sl.spin[1]));   // two turns: ends upright
  const ye = one(F, 'years');
  if (ye && t >= ye.t && t < ye.back) { const r = eraAt(ye, t); if (r && r.costume) mods.costume = r.costume; }
  return mods;
}
