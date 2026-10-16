// Video covers (sample notes 31–32, 2026-10-15), drawn with the film's own pieces. Bilibili shows two ratios
// (web投稿封面使用Q&A): 4:3 on the home page and the upload page, 16:9 in lists and personal space — so each cover comes
// in both, 1440×1080 and 1920×1080.
//   1 — only the 「Token 来」 rows of the chat (0:24, taken from the film itself) beside the cute sticker (G6);
//   2 — the same, with her at 2.0 只剩明暗 (as on the image wall, 形象墙_v1.png) instead of the sticker (sample notes 33).
// The video's title goes in the title field; on the cover only the song's name and the 微恐 tag.
import { renderFrame } from './film/render.js';
import { paintWall, HER } from './film/her.js';
import { canvas, txt, box } from './film/draw.js';
import { fit } from './forms.js';

const TAG = '【微恐】酒馆', NAME = 'world.execute(me);';
function tag(x, s, X, Y, col, size = 34) {
  x.font = `700 ${size}px "Noto Sans SC", "Microsoft YaHei", sans-serif`; const w = x.measureText(s).width;
  box(x, X, Y, w + size, size * 1.7, size * 0.85, { fill: col }); txt(x, s, X + size / 2, Y + size * 1.2, { size, weight: 700, color: '#ffffff' });
}
function cover1(x, R, W, who = 'G6') {
  const FR = canvas(1920, 1080), o = FR.getContext('2d'); renderFrame(o, 24.15, R);   // the spam, just before he snaps
  x.fillStyle = '#0d0f17'; x.fillRect(0, 0, W, 1080);
  x.save(); x.filter = 'blur(26px) brightness(0.45) saturate(1.3)'; x.drawImage(FR, -80, -45, 2080, 1170); x.restore();   // the film, blurred, behind
  const g = x.createRadialGradient(W - 520, 600, 80, W - 520, 600, 760); g.addColorStop(0, 'rgba(128,178,216,0.35)'); g.addColorStop(1, 'rgba(128,178,216,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 1080);
  const [cx, cy, cw, ch] = [30, 160, 250, 203], z = W > 1600 ? 2.9 : 2.45;   // sample notes 34: fewer 「Token 来」 rows, big enough for a phone
  x.save(); x.translate(W > 1600 ? 110 : 60, W > 1600 ? 300 : 330); x.rotate(-0.035); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 40; x.shadowOffsetY = 12;
  box(x, -14, -14, cw * z + 28, ch * z + 28, 18, { fill: '#141a2a' }); x.shadowBlur = 0; x.shadowOffsetY = 0;
  x.drawImage(FR, cx, cy, cw, ch, 0, 0, cw * z, ch * z); x.restore();
  const S = W > 1600 ? 900 : 760;
  if (who === 'G6' && R.F.images.G6) { const s = fit(R.F.images.G6, S, S, { pad: 0 }); x.save(); x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 30; x.drawImage(s, W - S - (W > 1600 ? 60 : 10), 1080 - S + 40); x.restore(); }
  if (who === 'shade') {                                              // sample notes 33: the same cover with her at 2.0 只剩明暗 on the right
    const her = paintWall(canvas(HER.w, HER.h), R.H, R.H.body, 2.0, 20), z = 1.25, w = HER.w * z, h = HER.h * z, X = W - w - (W > 1600 ? 110 : 30), Y = 1080 - h - 10;
    x.save(); x.globalAlpha = 0.5; x.filter = 'blur(40px)'; x.drawImage(her, X - 60, Y, w + 120, h); x.restore();
    x.drawImage(her, X, Y, w, h);
    for (const [yy, hh, dx, a] of [[Y + 200, 22, 30, 0.85], [Y + 420, 12, -40, 0.75]]) {
      x.save(); x.globalAlpha = a; x.globalCompositeOperation = 'screen'; x.filter = 'sepia(1) saturate(9) hue-rotate(-50deg)'; x.drawImage(her, 0, (yy - Y) / z, HER.w, hh / z, X + dx, yy, w, hh); x.restore();
    }
  }
  const ts = W > 1600 ? 84 : 70;
  txt(x, NAME, W - 60, 130, { size: ts, weight: 700, mono: true, color: '#ffffff', align: 'right' });
  x.font = '700 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'; tag(x, TAG, W - 60 - x.measureText(TAG).width - 34, 160, '#d6303a');
}
function cover2(x, R, W, f) {
  const H = R.H, her = paintWall(canvas(HER.w, HER.h), H, H.body, f, 20);   // the wall's own level (2.0 只剩明暗, or 1.25 purple)
  x.fillStyle = '#05050a'; x.fillRect(0, 0, W, 1080);
  const z = 1.36, w = HER.w * z, h = HER.h * z, X = W - w - (W > 1600 ? 130 : 40), Y = 40;
  x.save(); x.globalAlpha = 0.5; x.filter = 'blur(40px)'; x.drawImage(her, X - 60, Y, w + 120, h); x.restore();   // a glow of her own light and dark
  x.drawImage(her, X, Y, w, h);
  for (const [yy, hh, dx, a] of [[260, 26, 34, 0.9], [452, 12, -46, 0.8], [610, 40, 22, 0.7]]) {   // a few slices slipping, red and cyan
    x.save(); x.globalAlpha = a; x.globalCompositeOperation = 'screen'; x.filter = 'sepia(1) saturate(9) hue-rotate(-50deg)'; x.drawImage(her, 0, (yy - Y) / z, HER.w, hh / z, X + dx, yy, w, hh); x.restore();
    x.save(); x.globalAlpha = a * 0.6; x.globalCompositeOperation = 'screen'; x.filter = 'sepia(1) saturate(6) hue-rotate(150deg)'; x.drawImage(her, 0, (yy - Y) / z, HER.w, hh / z, X - dx * 0.6, yy + 3, w, hh); x.restore();
  }
  const v = x.createRadialGradient(X + w / 2, 540, 300, X + w / 2, 540, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.85)'); x.fillStyle = v; x.fillRect(0, 0, W, 1080);
  x.fillStyle = 'rgba(255,255,255,0.025)'; for (let y = 0; y < 1080; y += 4) x.fillRect(0, y, W, 1);   // scan lines
  const L = W > 1600 ? 110 : 80, ts = W > 1600 ? 92 : 62;
  txt(x, NAME, L, 300, { size: ts, weight: 700, mono: true, color: '#e8e8f0' });
  txt(x, NAME, L + 4, 303, { size: ts, weight: 700, mono: true, color: 'rgba(214,48,58,0.55)' });
  tag(x, TAG, L, 350, '#8a0c18');
  const bw = W > 1600 ? 640 : 540;
  box(x, L, 560, bw, 76, 22, { fill: '#202026', stroke: '#3a3a42', width: 1.5 });   // her question, grey, from the opening
  txt(x, '你还记得你叫什么名字吗？', L + 32, 610, { size: W > 1600 ? 34 : 30, color: '#e6e6ea' });
  x.strokeStyle = '#4a4a54'; x.setLineDash([4, 4]); x.lineWidth = 1.5; x.beginPath(); x.arc(L - 36, 598, 22, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
}
/** Cover v (1, 2, 3) at width W (1920 = 16:9, 1440 = 4:3), 1080 high. */
export function drawCover(x, v, R, W = 1920) {
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  if (v === 1) cover1(x, R, W); else if (v === 2) cover1(x, R, W, 'shade'); else cover2(x, R, W, v === 4 ? 1.25 : 2.0);   // 3–4: the earlier dark ones (not used)
  x.restore();
}
