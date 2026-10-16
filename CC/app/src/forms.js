// Her forms (17_制作规范.md §8): every form of her is COMPUTED FROM THE FINAL PICTURES (CC/美术生成/定稿/), never
// drawn from geometric shapes. Each function takes a source canvas (usually fit(...) of a final PNG) and returns a new
// canvas of the same size. All are pure and deterministic (seeded randomness), so renderFrame(t) can call them.
//
// The one exception is lineFish(): the deliberate doodle of step 12 in Act 4 (14 §5), drawn as a hand-made line.

export const HER = { line: '#1b1930', navy: '#2d3155', hair: '#4a5a94', tips: '#6491cb', bow: '#80b2d8', white: '#ede2e4',
  skin: '#eed3d1', gold: '#bfb09e' };
export const PALETTE = Object.values(HER);

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export function rng(seed) {                 // mulberry32
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** The picture fitted (contain) into w x h, centred; crop = [x, y, w, h] in source pixels; pad = margin share. */
export function fit(img, w, h, { pad = 0.04, crop = null, align = 0.5 } = {}) {
  const c = canvas(w, h), x = c.getContext('2d');
  const [sx, sy, sw, sh] = crop || [0, 0, img.width, img.height];
  const k = Math.min((w * (1 - 2 * pad)) / sw, (h * (1 - 2 * pad)) / sh);
  const dw = sw * k, dh = sh * k;
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, sx, sy, sw, sh, (w - dw) / 2, (h - dh) * align + 0, dw, dh);
  return c;
}

/** Glowing silhouette (what the cards call 光团 / 那团光): her own outline filled with her hair gradient, a little of the
 *  picture's shading kept so the face and the ahoge still read, and a soft outer glow. */
export function glowSilhouette(src, { top = HER.navy, mid = HER.hair, bottom = HER.tips, glow = HER.bow, detail = 0.38, blur = 16, strength = 0.9 } = {}) {
  const w = src.width, h = src.height;
  const fill = canvas(w, h), f = fill.getContext('2d');
  f.drawImage(src, 0, 0);
  f.globalCompositeOperation = 'source-in';
  const g = f.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(0.45, mid); g.addColorStop(1, bottom);
  f.fillStyle = g; f.fillRect(0, 0, w, h);
  f.globalCompositeOperation = 'luminosity'; f.globalAlpha = detail;      // the picture's light and dark, in her colours
  f.drawImage(src, 0, 0);
  f.globalCompositeOperation = 'destination-in'; f.globalAlpha = 1;      // keep the exact outline
  f.drawImage(src, 0, 0);
  const out = canvas(w, h), o = out.getContext('2d');
  const halo = canvas(w, h), hc = halo.getContext('2d');
  hc.drawImage(src, 0, 0); hc.globalCompositeOperation = 'source-in'; hc.fillStyle = glow; hc.fillRect(0, 0, w, h);
  o.globalAlpha = strength; o.filter = `blur(${blur}px)`; o.drawImage(halo, 0, 0);
  o.filter = `blur(${blur / 3}px)`; o.drawImage(halo, 0, 0);
  o.filter = 'none'; o.globalAlpha = 1; o.drawImage(fill, 0, 0);
  return out;
}

/** Flat colour (只用颜色 / 平涂): the picture softened and every pixel moved to the nearest of her colours, then the
 *  original outline put back so it stays crisp. */
export function flatColour(src, { palette = PALETTE, scale = 0.33, blur = 1.5, lines = 0 } = {}) {
  const w = src.width, h = src.height, sw = Math.max(8, Math.round(w * scale)), sh = Math.max(8, Math.round(h * scale));
  const small = canvas(sw, sh), s = small.getContext('2d');
  s.filter = `blur(${blur}px)`; s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, sw, sh);
  const d = s.getImageData(0, 0, sw, sh), p = palette.map(hex);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 8) continue;
    let best = 0, bd = 1e9;
    for (let k = 0; k < p.length; k++) {
      const dr = d.data[i] - p[k][0], dg = d.data[i + 1] - p[k][1], db = d.data[i + 2] - p[k][2];
      const dist = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
      if (dist < bd) { bd = dist; best = k; }
    }
    d.data[i] = p[best][0]; d.data[i + 1] = p[best][1]; d.data[i + 2] = p[best][2];
  }
  s.filter = 'none'; s.putImageData(d, 0, 0);
  const out = canvas(w, h), o = out.getContext('2d');
  o.imageSmoothingEnabled = true; o.drawImage(small, 0, 0, w, h);
  if (lines) o.drawImage(lineArt(src, { strength: lines }), 0, 0);   // her own dark lines back on top: eyes, mouth, edges
  o.globalCompositeOperation = 'destination-in'; o.drawImage(src, 0, 0);
  return out;
}

/** Her picture's own line art: the darkest pixels (outlines, eyes, mouth) in her line colour, everything else clear. */
export function lineArt(src, { color = HER.line, below = 0.32, strength = 1 } = {}) {
  const w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d');
  o.drawImage(src, 0, 0);
  const d = o.getImageData(0, 0, w, h), c = hex(color);
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i + 3] / 255;
    if (a < 0.03) continue;
    const l = (0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) / 255;
    const k = (1 - smooth(below * 0.55, below, l)) * strength;
    d.data[i] = c[0]; d.data[i + 1] = c[1]; d.data[i + 2] = c[2]; d.data[i + 3] = Math.round(255 * a * clamp(k));
  }
  o.putImageData(d, 0, 0);
  return out;
}

/** Put a canvas in the middle of a w x h canvas without scaling (keeps pixel art hard-edged). */
export function centre(src, w, h) {
  const out = canvas(w, h), o = out.getContext('2d');
  o.imageSmoothingEnabled = false;
  o.drawImage(src, Math.round((w - src.width) / 2), Math.round((h - src.height) / 2));
  return out;
}

/** Pixel art: the picture shrunk to n pixels across (nearest of her colours, hard alpha), shown big with hard edges. */
export function pixelate(src, n, { palette = PALETTE, size = null, keepLines = 0.16 } = {}) {
  const w = src.width, h = src.height, m = Math.max(1, Math.round(n * h / w));
  const small = canvas(n, m), s = small.getContext('2d');
  s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, n, m);
  const d = s.getImageData(0, 0, n, m), p = palette ? palette.map(hex) : null;
  // a cell where enough of the picture is dark line (eyes, mouth, outline) becomes line colour, so the face survives
  if (keepLines) {
    const full = src.getContext('2d').getImageData(0, 0, w, h).data, line = hex(HER.line);
    const dark = new Float32Array(n * m), cnt = new Float32Array(n * m);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = full[i + 3] / 255;
      if (a < 0.5) continue;
      const cell = Math.min(m - 1, Math.floor(y * m / h)) * n + Math.min(n - 1, Math.floor(x * n / w));
      cnt[cell]++;
      if ((0.3 * full[i] + 0.59 * full[i + 1] + 0.11 * full[i + 2]) / 255 < 0.2) dark[cell]++;
    }
    for (let c = 0; c < n * m; c++) if (cnt[c] && dark[c] / cnt[c] > keepLines) {
      d.data[c * 4] = line[0]; d.data[c * 4 + 1] = line[1]; d.data[c * 4 + 2] = line[2];
    }
  }
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i + 3];
    if (a < 110) { d.data[i + 3] = 0; continue; }
    const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];   // ImageData is not premultiplied
    let best = [r, g, b];
    if (p) {
      let bd = 1e9;
      for (const c of p) { const dist = 0.3 * (r - c[0]) ** 2 + 0.59 * (g - c[1]) ** 2 + 0.11 * (b - c[2]) ** 2; if (dist < bd) { bd = dist; best = c; } }
    }
    d.data[i] = best[0]; d.data[i + 1] = best[1]; d.data[i + 2] = best[2]; d.data[i + 3] = 255;
  }
  s.putImageData(d, 0, 0);
  const out = canvas(w, h), o = out.getContext('2d');
  const side = size || Math.min(w, h) * 0.9, k = Math.floor(side / Math.max(n, m)) || 1;
  o.imageSmoothingEnabled = false;
  o.drawImage(small, Math.round((w - n * k) / 2), Math.round((h - m * k) / 2), n * k, m * k);
  return out;
}

/** Character art: each cell becomes a character chosen by the picture's brightness, in the picture's own colour. */
export function ascii(src, { cols = 56, ramp = ' .:-=+*cs#%@', font = 'Consolas, "Courier New", monospace', bg = null } = {}) {
  const w = src.width, h = src.height, cw = w / cols, ch = cw * 1.75, rows = Math.floor(h / ch);
  const small = canvas(cols, rows), s = small.getContext('2d');
  s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, cols, rows);
  const d = s.getImageData(0, 0, cols, rows).data;
  const out = canvas(w, h), o = out.getContext('2d');
  if (bg) { o.fillStyle = bg; o.fillRect(0, 0, w, h); }
  o.font = `${Math.round(ch * 0.95)}px ${font}`; o.textAlign = 'center'; o.textBaseline = 'middle';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 4, a = d[i + 3] / 255;
    if (a < 0.35) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2], l = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    // every part of her gets a visible character (dark navy hair too), denser where she is brighter
    const ch_ = ramp[Math.min(ramp.length - 1, 3 + Math.floor(l * (ramp.length - 4)))];
    const lift = l < 0.4 ? mixc([r, g, b], hex(HER.tips), 0.55 * (1 - l / 0.4)) : mixc([r, g, b], [255, 255, 255], 0.06);
    o.fillStyle = `rgb(${lift.map(Math.round).join(',')})`;
    o.fillText(ch_, (x + 0.5) * cw, (y + 0.5) * ch);
  }
  return out;
}

/** Point cloud: dots sampled where she is, each in her colour at that spot (Act 1: the dots that gather into her). */
export function pointCloud(src, { n = 2600, r = 2.1, seed = 7, scatter = 0 } = {}) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, rnd = rng(seed);
  const out = canvas(w, h), o = out.getContext('2d');
  let placed = 0, tries = 0;
  while (placed < n && tries < n * 40) {
    tries++;
    const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h), i = (y * w + x) * 4;
    if (d[i + 3] < 140) continue;
    const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const jx = (rnd() - 0.5) * 2 * scatter, jy = (rnd() - 0.5) * 2 * scatter;
    o.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
    o.beginPath(); o.arc(x + jx, y + jy, r * (0.6 + 0.8 * l), 0, Math.PI * 2); o.fill();
    placed++;
  }
  return out;
}

/** "Mad" tint (14 §2, colour.json): her light-blue hair tips (and blue eyes) turn red with mad / 10; at 10 the navy
 *  darkens toward her line colour. Everything else (skin, white apron) stays. */
export function madTint(src, mad) {
  const k = clamp(mad / 10), w = src.width, h = src.height;
  const out = canvas(w, h), o = out.getContext('2d'); o.drawImage(src, 0, 0);
  if (!k) return out;
  const d = o.getImageData(0, 0, w, h), red = hex('#d6303a'), dark = hex(HER.line);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 8) continue;
    const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2], [hh, s, l] = rgb2hsl(r, g, b);
    if (hh < 190 || hh > 245 || s < 0.22) continue;
    const tip = smooth(0.42, 0.68, l) * k;                    // light blue -> red, keeping its lightness
    const lowNavy = (1 - smooth(0.18, 0.42, l)) * k * k * 0.55; // navy -> near black, only when very mad
    let c = [r, g, b];
    const target = mixc(red, [255, 255, 255], clamp((l - 0.6) * 1.2));
    c = mixc(c, target, tip);
    c = mixc(c, dark, lowNavy);
    d.data[i] = c[0]; d.data[i + 1] = c[1]; d.data[i + 2] = c[2];
  }
  o.putImageData(d, 0, 0);
  return out;
}

/** Duotone by brightness: the red-black takeover (2:14.20 on): dark -> deep red-black, middle -> her red, light -> pale. */
export function duotone(src, stops = ['#10070a', '#d6303a', '#ffd9dc'], mid = 0.55) {
  const w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d'); o.drawImage(src, 0, 0);
  const d = o.getImageData(0, 0, w, h), [a, b, c] = stops.map(hex);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 8) continue;
    const l = (0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) / 255;
    const v = l < mid ? mixc(a, b, l / mid) : mixc(b, c, (l - mid) / (1 - mid));
    d.data[i] = v[0]; d.data[i + 1] = v[1]; d.data[i + 2] = v[2];
  }
  o.putImageData(d, 0, 0);
  return out;
}

/** The deliberate doodle of Act 4 step 12 (14 §5): a fish in one hand-drawn line with a curl on top (the ahoge).
 *  Not a circle or an ellipse: the line wobbles and changes width like a pen. */
export function lineFish(w, h, { color = '#cfd6ea', seed = 3, scale = 1, erase = 0 } = {}) {
  const out = canvas(w, h), o = out.getContext('2d'), rnd = rng(seed);
  const cx = w * 0.5, cy = h * 0.55, S = Math.min(w, h) / 300 * scale;
  const P = [];
  const add = (x, y) => P.push([cx + x * S, cy + y * S]);
  // tail tip -> body top -> nose -> body bottom -> tail, then the curl from the head
  for (let t = 0; t <= 1; t += 0.02) add(-118 + 18 * t, -30 + 30 * t);                    // upper tail edge
  for (let t = 0; t <= 1; t += 0.01) { const a = Math.PI + t * Math.PI; add(10 + 92 * Math.cos(a) * (1 - 0.15 * t), -2 + 46 * Math.sin(a) * (0.75 + 0.35 * Math.sin(t * Math.PI))); }
  for (let t = 0; t <= 1; t += 0.01) { const a = t * Math.PI; add(10 + 92 * Math.cos(a) * (0.85 + 0.15 * t), -2 + 42 * Math.sin(a)); }
  for (let t = 0; t <= 1; t += 0.02) add(-100 - 18 * t, 0 + 30 * t);                     // lower tail edge
  const curl = [];
  for (let t = 0; t <= 1; t += 0.01) { const a = -Math.PI / 2 - t * Math.PI * 1.7, rr = 22 * (1 - 0.55 * t); curl.push([cx + (34 + rr * Math.cos(a) + 8 * t) * S, cy + (-62 - 26 * t + rr * Math.sin(a) + 22) * S]); }
  const stroke = (pts, base) => {
    const keep = Math.floor(pts.length * (1 - erase));
    let wob = 0;
    for (let i = 1; i < keep; i++) {
      wob += (rnd() - 0.5) * 0.35; wob *= 0.92;
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      o.strokeStyle = color; o.lineCap = 'round';
      o.lineWidth = base * S * (0.75 + 0.5 * Math.abs(Math.sin(i * 0.11)) + 0.15 * rnd());
      o.beginPath(); o.moveTo(x0 + wob * S, y0 + wob * S); o.lineTo(x1 + wob * S, y1 + wob * S); o.stroke();
    }
  };
  stroke(P, 3.2);
  stroke(curl, 3.0);
  o.fillStyle = color; o.beginPath(); o.arc(cx + 70 * S, cy - 6 * S, 3.4 * S, 0, Math.PI * 2); o.fill();   // the eye
  return out;
}

/** Her character card (Act 4 step 1): the picture inside a card frame with a label. */
export function cardFrame(src, { label = '角色卡 · 大肥鱼', border = '#ede2e4', fill = '#141726' } = {}) {
  const w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d');
  const m = Math.round(w * 0.08), r = Math.round(w * 0.04);
  o.fillStyle = fill; o.strokeStyle = border; o.lineWidth = Math.max(2, w * 0.008);
  o.beginPath(); o.roundRect(m, m, w - 2 * m, h - 2 * m, r); o.fill(); o.stroke();
  o.fillStyle = border; o.font = `${Math.round(w * 0.05)}px "Noto Sans SC", "Microsoft YaHei", sans-serif`; o.textAlign = 'center';
  o.fillText(label, w / 2, m + w * 0.09);
  const inner = fit(src, w - 2.6 * m, h - 2.6 * m - w * 0.1, { pad: 0 });
  o.drawImage(inner, 1.3 * m, 1.3 * m + w * 0.1);
  return out;
}

/** Act 4 step 10 (14 §5): the crayon drawing with only the blue crayon left. Blue strokes stay (in one crayon blue,
 *  keeping their strength), every other colour goes back to the paper. Works on the opaque G1 paper picture. */
export function crayonBlue(src, { blue = '#2f72c3', paper = null } = {}) {
  const w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d'); o.drawImage(src, 0, 0);
  const d = o.getImageData(0, 0, w, h), b = hex(blue);
  let pp = paper ? hex(paper) : null;
  if (!pp) {                                                             // the paper colour = average of the light, greyish pixels
    const sum = [0, 0, 0]; let n = 0;
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3] < 250) continue;
      const [, s, l] = rgb2hsl(d.data[i], d.data[i + 1], d.data[i + 2]);
      if (l > 0.8 && s < 0.6) { sum[0] += d.data[i]; sum[1] += d.data[i + 1]; sum[2] += d.data[i + 2]; n++; }
    }
    pp = n ? sum.map((v) => v / n) : hex('#eae4cc');
  }
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] === 0) continue;                                   // letterbox around the paper stays clear
    const [hh, s, l] = rgb2hsl(d.data[i], d.data[i + 1], d.data[i + 2]);
    const isBlue = hh > 190 && hh < 250 && s > 0.2;
    const k = isBlue ? clamp((1 - l) * 1.6) : 0;                       // how much crayon is on the paper here
    const c = mixc(pp, b, k);
    d.data[i] = c[0]; d.data[i + 1] = c[1]; d.data[i + 2] = c[2];
  }
  o.putImageData(d, 0, 0);
  return out;
}

// ---------------------------------------------------------------- the image wall (形象墙, user 2026-10-13): the steps
// her figure passes through, each a different way of processing the same final picture. Detail rises step by step:
// particles (her.js, they move) → scan lines → light and shade only → characters → dot matrix → blocks with gaps →
// mosaic → big colour blocks (flatColour) → behind glass → the picture itself.

/** Low detail: the picture shrunk to `cols` across and smoothed back up (no lines, no face). crisp keeps the exact
 *  outline; without it the edge is as soft as the rest (a rough step must not look finished). */
export function lowDetail(src, cols, { crisp = true } = {}) {
  const w = src.width, h = src.height, n = Math.max(4, cols), m = Math.max(4, Math.round(cols * h / w));
  const small = canvas(n, m), s = small.getContext('2d'); s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, n, m);
  const out = canvas(w, h), o = out.getContext('2d'); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
  o.drawImage(small, 0, 0, w, h);
  if (crisp) { o.globalCompositeOperation = 'destination-in'; o.drawImage(src, 0, 0); }
  return out;
}

/** Scan lines, half cut away: a low-detail copy shown only on every other band, each band nudged sideways a little. */
export function scanCut(src, { cols = 22, band = 5, shift = 6, seed = 9 } = {}) {
  const base = lowDetail(src, cols, { crisp: false }), w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d'), rnd = rng(seed);
  for (let y = 0, k = 0; y < h; y += band, k++) {
    const dx = Math.round((rnd() - 0.5) * 2 * shift * (rnd() < 0.25 ? 3 : 1));
    if (k % 2) continue;
    o.drawImage(base, 0, y, w, band, dx, y, w, band);
  }
  return out;
}

/** Light and shade only: a coarse copy in two of her tones (navy where dark, light blue where light), soft edge. */
export function lightShade(src, { cols = 26, dark = HER.navy, light = '#9cc8ea', mid = 0.48, soft = 0.08 } = {}) {
  const base = lowDetail(src, cols, { crisp: false }), w = src.width, h = src.height, o = base.getContext('2d');
  const d = o.getImageData(0, 0, w, h), A = hex(dark), B = hex(light);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 8) continue;
    const l = (0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) / 255, k = smooth(mid - soft, mid + soft, l), c = mixc(A, B, k);
    d.data[i] = c[0]; d.data[i + 1] = c[1]; d.data[i + 2] = c[2];
  }
  o.putImageData(d, 0, 0);
  return base;
}

/** Dot matrix (halftone): a grid of round dots in the picture's own colour, bigger where she is brighter. */
export function halftone(src, { cell = 11 } = {}) {
  const w = src.width, h = src.height, n = Math.ceil(w / cell), m = Math.ceil(h / cell);
  const small = canvas(n, m), s = small.getContext('2d'); s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, n, m);
  const d = s.getImageData(0, 0, n, m).data, out = canvas(w, h), o = out.getContext('2d');
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4, a = d[i + 3] / 255; if (a < 0.3) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2], l = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    const c = l < 0.35 ? mixc([r, g, b], hex(HER.tips), 0.45 * (1 - l / 0.35)) : [r, g, b];
    o.fillStyle = `rgb(${c.map(Math.round).join(',')})`;
    o.beginPath(); o.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.5 * (0.45 + 0.55 * Math.sqrt(l)) * Math.min(1, a * 1.2), 0, Math.PI * 2); o.fill();
  }
  return out;
}

/** Blocks with gaps: pixel art in her colours, every block drawn a little smaller than its cell. */
export function gapBlocks(src, cols, { gap = 2 } = {}) {
  const w = src.width, h = src.height;
  // read one colour per cell from a nearest-colour pixelation at native resolution
  const p = pixelate(src, cols, { size: Math.max(w, h) }), pd = p.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h), o = out.getContext('2d'), k = Math.floor(Math.max(w, h) / Math.max(cols, Math.round(cols * h / w))) || 1;
  const ox = Math.round((w - cols * k) / 2), oy = Math.round((h - Math.round(cols * h / w) * k) / 2);
  for (let y = 0; y < Math.round(cols * h / w); y++) for (let x = 0; x < cols; x++) {
    const cx = ox + x * k + (k >> 1), cy = oy + y * k + (k >> 1); if (cx >= w || cy >= h) continue;
    const i = (cy * w + cx) * 4; if (pd[i + 3] < 128) continue;
    o.fillStyle = `rgb(${pd[i]},${pd[i + 1]},${pd[i + 2]})`; o.fillRect(ox + x * k + gap / 2, oy + y * k + gap / 2, k - gap, k - gap);
  }
  return out;
}

/** Behind glass: the picture itself, slightly blurred and paled, with a frosted sheen across it. */
export function behindGlass(src, { blur = 2.4 } = {}) {
  const w = src.width, h = src.height, out = canvas(w, h), o = out.getContext('2d');
  o.filter = `blur(${blur}px) saturate(0.82) brightness(1.06)`; o.drawImage(src, 0, 0); o.filter = 'none';
  o.globalCompositeOperation = 'source-atop';
  const g = o.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(220,235,255,0.20)'); g.addColorStop(0.42, 'rgba(220,235,255,0.04)'); g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.56, 'rgba(220,235,255,0.04)'); g.addColorStop(1, 'rgba(220,235,255,0.16)');
  o.fillStyle = g; o.fillRect(0, 0, w, h);
  return out;
}
