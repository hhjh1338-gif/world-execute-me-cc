// Centre · stage, act 2 (镜头卡 3–5, 20_镜头卡_第二幕.md). Card 3: 「酒馆」 is SillyTavern, the role-play app — nothing here is a
// bar (sample notes 7). She has no definition of 喜欢, so she does what a model does: she computes it, WITH HER OWN PARTICLES,
// one lyric object per step (the ideas come from the user's talks with DeepSeek, Claude and Codex about love in maths —
// 19_借用与采用表). Sample notes 10 (visuals first, show the principle):
//   DIMENSION      her flat picture wraps round a turning globe — 2D becomes 3D — with three axes through it; one point
//                  lights up and every point leans toward it (「你是我坐标系里突然被高亮的点」)
//   CIRCUMFERENCE  one latitude of the globe lights up: the particles nearest 喜欢 run onto it, eight become word-lights
//   (sine)         the ring rises to face us, is pulled along a new axis into a helix (a circle moving through time), and
//                  the camera swings round: from the side the helix IS the sine wave, running toward him
//   TANGENTS       the wave slows to a stop; one glowing tangent rides along it, tilting with the slope (f′ shown), and
//                  lies flat on every crest — a seat left for him
//   LIMITATIONS    everything approaches his point — d·e^(−kt), closer and closer, never quite there — and the point is
//                  主人; the particles flow back into her, one step clearer. The hair-thin gap stays.
// After that the ring of word-lights circles above her head (sample notes 10: out of the middle of the picture, and clear
// of the keywords at the bottom), with their words on it, and his point glows beside her (later cards warm them, crash them, put them out one by one). Times and
// words: script/act2.json ('maths') and act1.json ('stir').
import { prog, easeOut, easeIn, easeBack, easeInOut, lerp, clamp, hash, smooth } from './time.js';
import { txt, withAlpha, cuteBubble, mixHex } from './draw.js';
import { HER } from './her.js';
import { ringTaken } from './stage8.js';

const C = { x: 1068, y: 440 };                                    // the field's centre: where 喜欢 floats
export const MASTER = { x: 712, y: 478 };                         // his point: left of her, toward where his words come from
const LIKE = '#ff9ccf', WARM = '#ffc79e', GOLD = '#ffd27a', TAU = Math.PI * 2;
const GLOBE = { r: 265, tilt: 0.38, lat: 0.24 };                  // her particles on a globe; the latitude that lights up
const F0 = 900;                                                   // the camera's focal length
const GAP = 26;                                                   // the gap that never closes
const HELIX = { turns: 3, len: 620, r: 84 };                      // the circle pulled along time: from the side, the sine
const MID = { x: (C.x + 300 + MASTER.x + GAP + 10) / 2, y: (C.y + MASTER.y) / 2 };   // the side view runs from her to him
const ORBIT = { cx: 1068, cy: 116, rx: 380, ry: 30 };             // where the word-lights circle afterwards: above her head

const lifted = new WeakMap();                                     // her colours, dark navy lifted so it shows on the stage
function colOf(p) {
  let c = lifted.get(p);
  if (!c) {
    const tips = [100, 145, 203];
    c = p.l < 0.38 ? p.col.map((v, j) => Math.round(v + (tips[j] - v) * 0.55 * (1 - p.l / 0.38))) : p.col;
    lifted.set(p, c);
  }
  return c;
}
function glow(x, X, Y, r, col, a) {
  if (a <= 0) return;
  const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, withAlpha(col, a)); g.addColorStop(1, withAlpha(col, 0));
  x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
}
const caption = (x, s, X, Y, a, align = 'left', size = 16) => { if (a > 0.01) txt(x, s, X, Y, { size, mono: true, color: '#ffe3f0', align, alpha: 0.8 * a }); };

/** How much of her figure to hide at t (her particles are doing the maths). */
export function mathsHide(e, t) {
  if (!e || t < e.loosen) return 0;
  return prog(t, e.loosen, e.loosen + 0.35) * (1 - prog(t, e.home + 0.35, e.home + 0.7));
}

// ---------------------------------------------------------------- the geometry
const project = (cx, cy, X, Y, Z) => { const per = F0 / (F0 + Z); return [cx + X * per, cy + Y * per, per]; };
const rotX = ([X, Y, Z], a) => [X, Y * Math.cos(a) - Z * Math.sin(a), Y * Math.sin(a) + Z * Math.cos(a)];
const rotY = ([X, Y, Z], a) => [X * Math.cos(a) - Z * Math.sin(a), Y, X * Math.sin(a) + Z * Math.cos(a)];
/** A point of the globe (latitude, longitude, radius) after its turn sp, tilted so we look at it from a little above. */
const onGlobe = (lat, lon, r, sp) => rotX([r * Math.cos(lat) * Math.sin(lon + sp), -r * Math.sin(lat), -r * Math.cos(lat) * Math.cos(lon + sp)], GLOBE.tilt);

/** The three moves after the ring (0:37.23 on): rise to face us · pull into a helix · the camera swings to the side. */
const stagesAt = (e, t) => ({ ka: easeInOut(prog(t, e.sine, e.sine + 0.45)), kb: easeInOut(prog(t, e.sine + 0.4, e.sine + 1.15)), kc: easeInOut(prog(t, e.sine + 1.1, e.sine + 1.95)) });
/** How far the globe (later the helix) has turned since DIMENSION: slowly; faster as the helix screws along (the side view
 *  then shows a travelling wave); to a stop just before TANGENTS, so the wave can be measured. */
function spinAt(e, t) {
  if (t <= e.wire) return 0;
  const v = (u) => (u < e.sine + 0.4 ? 0.5 : u < e.sine + 1.3 ? lerp(0.5, 2.6, smooth(prog(u, e.sine + 0.4, e.sine + 1.3)))
    : u < e.tangents - 0.5 ? 2.6 : 2.6 * (1 - smooth(prog(u, e.tangents - 0.5, e.tangents))));
  const T = Math.min(t, e.tangents + 0.05), n = 120, h = (T - e.wire) / n; let s = 0;
  for (let k = 0; k < n; k++) s += v(e.wire + (k + 0.5) * h) * h;
  return s;
}
/** A point of the ring / helix: ring angle a, turn j (0..turns−1) — the same particle is on the latitude, on the circle
 *  facing us, on the helix and on the sine; only the camera and the stretch change. */
function ringPoint(a, j, sp, st) {
  const { ka, kb, kc } = st, L = a + sp, u = ((((a % TAU) + TAU) % TAU) / TAU + j) / HELIX.turns;
  const R = lerp(lerp(GLOBE.r * Math.cos(GLOBE.lat) * 1.04, 230, ka), HELIX.r, kb), yc = lerp(-GLOBE.r * Math.sin(GLOBE.lat), 0, ka);
  let P = rotX([R * Math.sin(L), yc, -R * Math.cos(L)], lerp(GLOBE.tilt, Math.PI / 2, ka));   // the latitude → facing us
  P[2] += (u - 0.5) * HELIX.len * kb;                                                         // pulled along a new axis
  P = rotY(P, kc * Math.PI / 2);                                                               // seen from the side
  const f = lerp(F0, 6000, kc), per = f / (f + P[2]);                                         // side on: nearly flat, a clean sine
  const x = lerp(C.x, MID.x, kc) + P[0] * per, y = lerp(C.y, MID.y, kc) + P[1] * per;
  return { x, y, depth: clamp(0.5 - P[2] / (2 * Math.max(R, HELIX.len * 0.5 * kb * (1 - kc) + R))), per, u };
}
/** The side view at u (0 = by her, 1 = by him) once the helix is fully turned: the sine wave. */
const wavePoint = (u, sp) => { const w = Math.min(HELIX.turns * u, HELIX.turns - 1e-6), j = Math.floor(w); return ringPoint(TAU * (w - j), j, sp, { ka: 1, kb: 1, kc: 1 }); };

/** Where particle p is at time t. Pure function of t. */
function place(p, i, t, e, ring, sp, st) {
  const hx = HER.x + p.x, hy = HER.y + p.y, s = p.seed, s2 = hash(i, 9), s3 = hash(i, 11);
  // loose: her own flat shape, a little inflated; DIMENSION: wrapped round the globe (her height = latitude)
  const lat = (0.5 - p.y / HER.h) * Math.PI * 0.92, lon = (p.x / HER.w - 0.5) * Math.PI * 0.9 + (s3 < 0.5 ? 0 : Math.PI);
  const shrink = lerp(1, 0.62, st.ka);                                                    // the globe steps back for the helix
  const G = onGlobe(lat, lon, GLOBE.r * (0.94 + 0.06 * s2) * shrink, sp), [gx, gy, gper] = project(C.x, C.y, G[0], G[1], G[2]);
  const wrap = easeInOut(prog(t, e.wire + s * 0.3, e.wire + 0.8 + s * 0.3));
  let fx = lerp(C.x + (hx - C.x) * 1.08 + (s2 - 0.5) * 40, gx, wrap), fy = lerp(C.y + (hy - C.y - 40) * 1.04 + (s3 - 0.5) * 30, gy, wrap);
  let depth = lerp(0.6, clamp(0.5 - G[2] / (2 * GLOBE.r)), wrap);
  const lean = 0.07 * easeInOut(prog(t, e.lit, e.lit + 0.8));                              // every point leans to the lit one
  fx += (MASTER.x - fx) * lean; fy += (MASTER.y - fy) * lean;
  if (ring.band) {                                                                         // onto the latitude, and on from there
    const q = ringPoint(ring.a, ring.j, sp, st), rk = easeInOut(prog(t, e.ring + s * 0.4, e.ring + 0.5 + s * 0.4));
    fx = lerp(fx, q.x, rk); fy = lerp(fy, q.y + (s - 0.5) * 5 * st.kc, rk); depth = lerp(depth, q.depth, rk);
  }
  // 0:40.92: closer and closer — the distance falls as d·e^(−kt) but never below GAP
  const t0 = e.far + s * 0.5;
  if (t > t0) {
    const q = 1 - Math.exp(-2.6 * (t - t0)), dx = fx - MASTER.x, dy = fy - MASTER.y, d = Math.hypot(dx, dy) || 1;
    const r = Math.max(GAP + 3 + 7 * s, d * (1 - q));
    fx = MASTER.x + (dx / d) * r; fy = MASTER.y + (dy / d) * r; depth = lerp(depth, 1, q);
  }
  // the way out of her body, and home again one step clearer
  const out = easeInOut(prog(t, e.loosen + s * 0.5, e.wire + 0.4 + s * 0.4)), back = easeInOut(prog(t, e.home + s * 0.25, e.home + 0.45 + s * 0.25));
  let x = lerp(hx, fx, out), y = lerp(hy, fy, out);
  if (back > 0) { x = lerp(x, hx, back); y = lerp(y, hy, back); }
  return { x, y, depth: lerp(1, depth, out * (1 - back)), near: t > t0 ? 1 - Math.exp(-2.6 * (t - t0)) : 0, per: gper };
}

/** The stir at 0:28 (act 1 'stir'): a few of her particles warm up and float off her, waiting. */
function drawStir(x, t, st, S) {
  if (!st || t < st.t || t > st.until + 0.2) return;
  const pts = S.H.body.pts, k = prog(t, st.t, st.t + 1.2), out = 1 - prog(t, st.until - 0.1, st.until + 0.2);
  x.save();
  for (let i = 0; i < pts.length; i += 17) {
    const p = pts[i], f = 6.283 * hash(i, 3), r = 8 + 26 * hash(i, 5) * k;
    const X = HER.x + p.x + r * Math.sin(t * 1.3 + f), Y = HER.y + p.y - 14 * k * hash(i, 6) + r * 0.6 * Math.cos(t * 1.1 + f);
    x.globalAlpha = out * k * (0.65 + 0.35 * Math.sin(t * 3 + f)); x.fillStyle = i % 3 ? WARM : '#ffffff';
    x.fillRect(X - 2, Y - 2, 4, 4);
  }
  x.restore();
}

/** A polyline through points from f(k/n), each segment as bright as it is near (depth). */
function depthLine(x, n, f, col, a, width = 1.2) {
  let prev = f(0);
  x.lineWidth = width;
  for (let k = 1; k <= n; k++) {
    const q = f(k / n);
    x.strokeStyle = withAlpha(col, a * (0.25 + 0.75 * (prev[2] + q[2]) / 2)); x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(q[0], q[1]); x.stroke();
    prev = q;
  }
}
/** DIMENSION's frame: the globe's latitudes and meridians and its three axes, turning with it; the latitude the ring runs
 *  onto lights up (CIRCUMFERENCE). Then, side on, a new pair of axes: along the wave toward him, and up. */
function drawFrames(x, t, e, sp, st) {
  const k = easeOut(prog(t, e.wire + 0.2, e.wire + 0.9)) * (1 - prog(t, e.sine, e.sine + 0.5));
  if (k > 0) {
    x.save();
    const pt = (lat, lon) => { const G = onGlobe(lat, lon, GLOBE.r * lerp(1, 0.62, st.ka), sp), q = project(C.x, C.y, G[0], G[1], G[2]); return [q[0], q[1], clamp(0.5 - G[2] / (2 * GLOBE.r))]; };
    for (const lat of [-1.0, -0.5, 0, 0.5, 1.0]) depthLine(x, 48, (u) => pt(lat, u * TAU), '#ffd9ea', 0.22 * k);
    for (let m = 0; m < 8; m++) depthLine(x, 32, (u) => pt((u - 0.5) * Math.PI, m * Math.PI / 4), '#ffd9ea', 0.16 * k);
    const lit = easeOut(prog(t, e.ring, e.ring + 0.5)) * k;                                 // "at this latitude"
    if (lit > 0) { x.save(); x.shadowColor = LIKE; x.shadowBlur = 12; depthLine(x, 64, (u) => pt(GLOBE.lat, u * TAU), LIKE, 0.7 * lit, 2); x.restore(); }
    for (const v of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {                                      // the three axes, turning
      const end = (sg) => { const P = rotX(rotY(v.map((c) => c * sg * 380), sp), GLOBE.tilt), q = project(C.x, C.y, P[0], P[1], P[2]); return q; };
      const [ax, ay] = end(1), [bx, by] = end(-1);
      x.strokeStyle = withAlpha('#ffd9ea', 0.32 * k); x.lineWidth = 1.2; x.beginPath(); x.moveTo(bx, by); x.lineTo(ax, ay); x.stroke();
      x.fillStyle = withAlpha('#ffd9ea', 0.5 * k); x.beginPath(); x.arc(ax, ay, 3, 0, TAU); x.fill();
    }
    x.restore();
  }
  // the new coordinates, side on: time runs toward him, the height is the sine (the change of coordinate system)
  const s2 = easeOut(prog(t, e.sine + 1.6, e.sine + 2.1)) * (1 - prog(t, e.far + 0.6, e.far + 1.4));
  if (s2 > 0) {
    const x0 = MID.x + HELIX.len / 2 + 30, x1 = MID.x - HELIX.len / 2 - 6;
    x.save(); x.strokeStyle = withAlpha('#ffd9ea', 0.4 * s2); x.fillStyle = withAlpha('#ffd9ea', 0.6 * s2); x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(x0, MID.y); x.lineTo(lerp(x0, x1, s2), MID.y); x.stroke();
    x.beginPath(); x.moveTo(x0, MID.y + HELIX.r + 30); x.lineTo(x0, MID.y - HELIX.r - 40); x.stroke();
    x.beginPath(); x.moveTo(x0, MID.y - HELIX.r - 48); x.lineTo(x0 - 5, MID.y - HELIX.r - 38); x.lineTo(x0 + 5, MID.y - HELIX.r - 38); x.closePath(); x.fill();
    x.restore();
    caption(x, 'θ（时间）→ 主人', x1 + 10, MID.y + HELIX.r + 34, s2, 'left', 14);
    caption(x, 'y', x0 + 10, MID.y - HELIX.r - 36, s2, 'left', 14);
  }
}

/** The ring / helix / sine as one glowing line (pink by her, gold toward him), each stretch as bright as it is near: it
 *  makes the circle → spring → wave read as one shape. */
function drawHelixLine(x, t, e, sp, st) {
  const a = easeOut(prog(t, e.sine - 0.2, e.sine + 0.3)) * (1 - prog(t, e.far, e.far + 0.6)); if (a <= 0) return;
  const N = 240; let prev = null;
  x.save(); x.lineCap = 'round';
  for (let k = 0; k <= N; k++) {
    const u = k / N, w = Math.min(HELIX.turns * u, HELIX.turns - 1e-6), j = Math.floor(w), q = ringPoint(TAU * (w - j), j, sp, st);
    if (prev) {
      const d = (prev.depth + q.depth) / 2, col = mixHex(LIKE, GOLD, u);
      x.strokeStyle = withAlpha(col, 0.18 * a * (0.3 + 0.7 * d)); x.lineWidth = 7; x.beginPath(); x.moveTo(prev.x, prev.y); x.lineTo(q.x, q.y); x.stroke();
      x.strokeStyle = withAlpha(col, 0.85 * a * (0.25 + 0.75 * d)); x.lineWidth = 1.2 + 1.6 * d; x.beginPath(); x.moveTo(prev.x, prev.y); x.lineTo(q.x, q.y); x.stroke();
    }
    prev = q;
  }
  x.restore();
}

/** TANGENTS (0:40.05–0:40.92): the wave has stopped; one tangent rides along it from her side to his, tilting with the
 *  slope, and lies flat (f′ = 0) on every crest, which keeps a small light: a seat left for him. */
function drawTangent(x, t, e, sp) {
  if (t < e.tangents - 0.1 || t > e.far + 1.2) return;
  const run = prog(t, e.tangents, e.far - 0.05), ur = lerp(0.03, 0.97, easeInOut(run)), out = 1 - prog(t, e.far + 0.2, e.far + 1.2), into = easeOut(prog(t, e.tangents - 0.1, e.tangents + 0.15));
  const P = (u) => wavePoint(u, sp);
  // the seats: the crests (top of the wave on screen) it has passed
  let first = true;
  for (let m = -40; m < 40; m++) {
    const uc = (Math.PI + TAU * m - sp) / (TAU * HELIX.turns); if (uc < 0.03 || uc > 0.97 || ur < uc) continue;
    const q = P(uc), born = e.tangents + (e.far - 0.05 - e.tangents) * clamp(uc), f = 1 - prog(t, born, born + 0.35);
    glow(x, q.x, q.y - 4, 26 + 30 * f, GOLD, (0.4 + 0.5 * f) * out);
    x.save(); x.globalAlpha = out; x.fillStyle = '#fff6e0'; x.beginPath(); x.arc(q.x, q.y - 4, 3.5, 0, TAU); x.fill(); x.restore();
    if (first) caption(x, 'f′(x₀) = 0', q.x, q.y - 28, out, 'center', 15);
    first = false;
  }
  if (run >= 1 && t > e.far + 0.2) return;
  const a = P(ur - 0.004), b = P(ur + 0.004), c = P(ur), ang = Math.atan2(b.y - a.y, b.x - a.x), slope = (b.y - a.y) / (b.x - a.x);
  const flat = 1 - clamp(Math.abs(slope) / 0.35), L = 190, A = into * (1 - prog(t, e.far - 0.05, e.far + 0.2));
  x.save(); x.globalAlpha = A; x.translate(c.x, c.y); x.rotate(ang);
  const g = x.createLinearGradient(-L / 2, 0, L / 2, 0);
  const col = flat > 0.5 ? GOLD : '#ffffff';
  g.addColorStop(0, withAlpha(col, 0)); g.addColorStop(0.5, withAlpha(col, 1)); g.addColorStop(1, withAlpha(col, 0));
  x.shadowColor = col; x.shadowBlur = 14 + 10 * flat; x.strokeStyle = g; x.lineWidth = 3 + 1.5 * flat; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-L / 2, 0); x.lineTo(L / 2, 0); x.stroke();
  x.restore();
  glow(x, c.x, c.y, 22 + 18 * flat, flat > 0.5 ? GOLD : '#ffffff', 0.8 * A);
  caption(x, `f′ = ${(-slope).toFixed(2)}`, c.x, c.y - 30 - 10 * Math.abs(Math.sin(ang)), A, 'center', 15);
}

/** Card 3: her particles doing the maths (drawn instead of her figure while mathsHide > 0). */
export function drawMaths(x, t, e, S, F) {
  drawStir(x, t, F.by('stage').find((v) => v.type === 'stir'), S);
  if (!e || t < e.loosen) return;
  const pts = S.H.body.pts, n = pts.length, words = e.words || [], ringWords = e.ringWords || [];
  const sp = spinAt(e, t), st = stagesAt(e, t);
  if (t < e.far + 1.4) { drawFrames(x, t, e, sp, st); drawHelixLine(x, t, e, sp, st); }
  if (t < e.home + 1.2) {
    x.save();
    const fade = 1 - prog(t, e.home + 0.45, e.home + 0.8), lights = [];   // her figure takes over again
    for (let i = 0; i < n; i++) {
      const p = pts[i], band = hash(i, 21) < 0.14, wl = band && i % 97 === 0 && lights.length < ringWords.length;
      const ring = { band, a: wl ? (lights.length / ringWords.length) * TAU : hash(i, 22) * TAU, j: wl ? lights.length % HELIX.turns : Math.floor(hash(i, 23) * HELIX.turns) };
      const q = place(p, i, t, e, ring, sp, st);
      if (wl) { lights.push({ ...q, k: lights.length }); continue; }
      const c = colOf(p), dim = !band && t >= e.ring && t < e.far ? lerp(0.55, 0.3, st.ka) * (1 - 0.7 * st.kc) : 1, a = (0.45 + 0.55 * q.depth) * dim;
      x.globalAlpha = fade * clamp(a) * (0.75 + 0.25 * Math.sin(t * (2 + 3 * p.seed) + i));
      x.fillStyle = q.near > 0.55 ? GOLD : band && t >= e.ringLit ? `rgb(${Math.min(255, c[0] + 70)},${Math.min(255, c[1] + 50)},${Math.min(255, c[2] + 60)})` : `rgb(${c[0]},${c[1]},${c[2]})`;
      const z = (1.6 + 1.5 * p.seed) * (0.6 + 0.8 * q.depth) * (band ? 1.15 : 1);
      x.fillRect(q.x - z / 2, q.y - z / 2, z, z);
      if (i % 61 === 0 && t >= e.wire && t < e.ring + 0.4 && words.length) { x.globalAlpha *= 0.8; txt(x, words[(i / 61) % words.length | 0], q.x, q.y - 6, { size: 12, color: '#ffe3f0', align: 'center' }); }
    }
    // the word-lights (CIRCUMFERENCE lights them one by one)
    if (fade > 0) for (const q of lights) {
      if (t < e.ring) continue;
      const lit = t >= e.ringLit + q.k * 0.1 ? easeOut(prog(t, e.ringLit + q.k * 0.1, e.ringLit + q.k * 0.1 + 0.25)) : 0, d = 0.55 + 0.45 * q.depth;
      x.globalAlpha = fade; glow(x, q.x, q.y, (18 + 18 * lit) * d, WARM, (0.25 + 0.5 * lit) * (1 - 0.6 * q.near) * d);
      x.fillStyle = lit ? '#fff3e0' : WARM; x.beginPath(); x.arc(q.x, q.y, (3.5 + 2 * lit) * d, 0, TAU); x.fill();
      if (t < e.sine + 0.6) txt(x, ringWords[q.k], q.x, q.y + 22, { size: 15, weight: 700, color: lit ? '#fff0f6' : '#ffd9ea', align: 'center', alpha: (0.6 + 0.4 * lit) * d * (1 - prog(t, e.sine, e.sine + 0.6)) });
    }
    x.restore();
  }
  // 喜欢: one particle lifts out of her chest and floats to the centre of the field
  if (t >= e.loosen && t < e.far + 0.5) {
    const k = easeInOut(prog(t, e.loosen + 0.1, e.wire)), a = 1 - prog(t, e.far, e.far + 0.5);
    const X = lerp(1068, C.x, k), Y = lerp(355, C.y, k);
    glow(x, X, Y, 34, LIKE, 0.8 * a); x.save(); x.globalAlpha = a; x.fillStyle = '#ffffff'; x.fillRect(X - 2.5, Y - 2.5, 5, 5); x.restore();
    txt(x, '喜欢', X, Y - 16, { size: 22, weight: 700, color: LIKE, align: 'center', alpha: a * easeOut(prog(t, e.loosen + 0.2, e.loosen + 0.6)) });
  }
  drawTangent(x, t, e, sp);
  // the small formulas, only on screen (never needed to read)
  const cap = (a, b) => easeOut(prog(t, a, a + 0.3)) * (1 - prog(t, b - 0.3, b));
  caption(x, 'P(看你｜世界) ≫ P(看你)', MASTER.x - 60, MASTER.y - 40, cap(e.lit + 0.3, e.ring));
  caption(x, 'C = 2πr', C.x + GLOBE.r + 20, C.y - 70, cap(e.ringLit, e.sine + 0.3));
  caption(x, '(r·cos θ,  r·sin θ,  k·θ)', C.x + 40, C.y - 210, cap(e.sine + 0.5, e.sine + 1.5));
  caption(x, 'y = r·sin θ', MID.x + 120, MID.y - HELIX.r - 60, cap(e.sine + 1.7, e.tangents + 0.1));
  caption(x, '‖我 − 主人‖ = d·e^(−kt) > 0', MASTER.x - 60, MASTER.y + 66, cap(e.far + 0.3, e.home + 0.2));
  drawMasterPoint(x, t, e, F);
  drawOrbit(x, t, e, ringWords, F);
}

/** Where his point is at t: card 8 (1:09.70), as 分手 grows, it drifts away from her and the gap that never closes is
 *  stretched — the first time they move apart (gap: the ring's radius). Back in place after the rewind. */
export function masterAt(F, t) {
  const b = F && F.by('stage').find((v) => v.type === 'breakup');
  const sg = statueGeom(F, t);                                      // card 14 (sample notes 13): his point sits on the god's forehead
  if (sg) { const k = haloK(F, t); return { x: lerp(MASTER.x, sg.fx, k), y: lerp(MASTER.y, sg.fy, k), gap: GAP }; }
  // act 3, card 18 (sample notes 33, lightsout.leave): 「you have left」 — at every line he goes a step farther, smaller and
  // dimmer, toward the edge, and what she gave him goes with him; at ISOLATION he is all but gone; back when he wakes (2:11.25)
  const lv = F && F.by('stage').find((v) => v.type === 'lightsout' && v.leave);
  if (lv && t >= lv.t) {
    const back = F.by('chat').find((v) => v.type === 'presence' && v.away === false && v.t > lv.t);
    if (!back || t < back.t + 1.0) {
      const steps = lv.times.reduce((sum, tt) => sum + easeOut(prog(t, tt, tt + 0.45)), 0) / lv.times.length;
      const far = Math.min(1, 0.85 * steps + 0.15 * easeIn(prog(t, lv.ringOff, lv.ringOff + 0.9))) * (back ? 1 - easeInOut(prog(t, back.t, back.t + 1.0)) : 1);
      return { x: MASTER.x - 70 * far, y: MASTER.y + 300 * far, gap: GAP, far };   // down toward the lower left corner, away
    }
  }
  if (!b || t < b.t || t >= b.until) return { ...MASTER, gap: GAP };
  const k = easeOut(prog(t, b.t, b.t + 0.6));
  return { x: MASTER.x - 70 * k, y: MASTER.y + 40 * k, gap: GAP + 44 * k, k };
}
/** Card 10: the moment the rewind lets go (1:19.46) the word-lights and his point come back all at once — a flash. */
const backFlash = (F, t) => (F && F.cut && t >= F.cut.to ? 1 - prog(t, F.cut.to, F.cut.to + 0.5) : 0);

/** His point: it lights up at DIMENSION (unnamed), everything approaches it, it is named 主人 at 0:42.76, and it stays —
 *  a warm light beside her with a hair-thin ring round it: the gap that never closes. */
/** Sample notes 23: once her image wall is up (act 4) his point, the orbit and what she gave him are out of the way. */
export const wallHide = (F, t) => { const iw = F && F.by('stage').find((v) => v.type === 'imagewall'); return iw ? easeInOut(prog(t, iw.t, iw.t + 0.5)) : 0; };
export function drawMasterPoint(x, t, e, F) {
  if (!e || t < e.lit || wallHide(F, t) >= 1) return;
  const M = masterAt(F, t), k = easeOut(prog(t, e.lit, e.lit + 0.5)) * (1 - wallHide(F, t)), named = easeOut(prog(t, e.converge, e.converge + 0.4)) * (1 - wallHide(F, t));
  const flash = Math.max(t >= e.done ? 1 - prog(t, e.done, e.done + 0.6) : 0, backFlash(F, t)), breathe = 0.85 + 0.15 * Math.sin(t * 2.2);
  const aw = F.by('chat').filter((v) => v.type === 'presence' && v.away != null && t >= v.t).pop();   // act 3: he is away — his point dims
  const away = aw ? (aw.away ? prog(t, aw.t, aw.t + 0.8) : 1 - prog(t, aw.t, aw.t + 0.5)) : 0;
  const far = M.far || 0;                                             // card 18: going (masterAt)
  if (away > 0 || far > 0) { x.save(); x.globalAlpha = (1 - 0.7 * away) * (1 - 0.75 * far); }
  glow(x, M.x, M.y, 30 + 30 * named + 60 * flash, named ? GOLD : '#fff2e6', (0.45 * k + 0.25 * named + 0.4 * flash) * breathe);
  x.save(); x.fillStyle = '#fff6e0'; x.globalAlpha = k; x.beginPath(); x.arc(M.x, M.y, 4 + named, 0, Math.PI * 2); x.fill();
  if (t >= e.far) { x.strokeStyle = withAlpha(GOLD, 0.55 * prog(t, e.far + 0.6, e.far + 1.4)); x.lineWidth = 1.2; x.beginPath(); x.arc(M.x, M.y, M.gap, 0, Math.PI * 2); x.stroke(); }
  if (M.k) {                                                       // the gap stretched: a cold line from her chest to him, 'd ↑'
    x.globalAlpha = M.k; x.strokeStyle = withAlpha('#9fb3c8', 0.6); x.setLineDash([5, 7]); x.beginPath(); x.moveTo(1068, 355); x.lineTo(M.x + M.gap, M.y - 8); x.stroke(); x.setLineDash([]);
    txt(x, '‖我 − 主人‖ ↑', (1068 + M.x) / 2, (355 + M.y) / 2 - 14, { size: 16, mono: true, color: '#c9d6e6', align: 'center', alpha: M.k });
  }
  x.restore();
  if (named > 0) txt(x, '主人', M.x, M.y + 40, { size: 18, weight: 700, color: GOLD, align: 'center', alpha: named * (1 - prog(t, e.done + 2.5, e.done + 3.2)) });
  if (away > 0 || far > 0) x.restore();
}
/** Card 14 (user 10-14: the god's halo is the ring of words): how far the ring has risen into the halo behind the god (0..1). */
export function haloK(F, t) {
  const g = F && F.by('stage').find((v) => v.type === 'statue'); if (!g || t < g.t) return 0;
  return easeInOut(prog(t, g.t + 0.15, g.t + 0.75)) * (1 - easeInOut(prog(t, g.until, g.until + 0.5)));
}
/** Card 14: where the god is. Sample notes 13: it keeps growing (round its forehead, where his point sits). */
export function statueGeom(F, t) {
  const g = F && F.by('stage').find((v) => v.type === 'statue'); if (!g || t < g.t || t > g.until + 0.6) return null;
  const rise = easeOut(prog(t, g.t, g.t + 0.65)), out = 1 - prog(t, g.until, g.until + 0.6);
  const sc = 1.75 + 0.45 * prog(t, g.t, g.until + 0.6), fx = 1068, fy = 176 + 520 * (1 - rise) + 40 * (1 - out);
  return { g, rise, out, sc, fx, fy, X0: fx - (HER.w / 2) * sc, Y0: fy - 128 * sc };
}
const ringGeom = (F, t) => {                                         // the ring, or the halo round the god's head
  const k = haloK(F, t), sg = statueGeom(F, t), cy = sg ? sg.fy - 8 : ORBIT.cy, r = sg ? 112 * sg.sc : 190;
  return { cx: ORBIT.cx, cy: lerp(ORBIT.cy, cy, k), rx: lerp(ORBIT.rx, r, k), ry: lerp(ORBIT.ry, r, k), k };
};
/** Where word-light i of n is at t (they circle above her slowly from 0:43.51 on; i may be fractional); with F, the ring
 *  may be the god's halo. */
export function orbitPos(i, n, t, e, F) {
  const a = (i / n) * TAU + 0.25 * (t - e.home), G = F ? ringGeom(F, t) : { ...ORBIT, k: 0 };
  return { x: G.cx + G.rx * Math.cos(a), y: G.cy + G.ry * Math.sin(a), front: Math.sin(a) > 0 || G.k > 0.5, a };
}
/** How warm the word-lights are at t (card 7: brighter, and brighter again with every bubble at STIMULATIONS). */
function warmth(F, t) {
  const r = F.by('stage').find((v) => v.type === 'romance'); if (!r || t < r.t) return 0;
  const out = 1 - prog(t, r.until, r.until + 0.6);
  return out * (0.5 * easeOut(prog(t, r.t, r.t + 0.6)) + 0.5 * easeOut(prog(t, r.stim, r.stim + 0.8)));
}
/** Where the things she sent at STIMULATIONS sit on the ring (between word-lights), and when each lands (stage4 flies
 *  them there). */
export const giftSlot = (j) => j * 3 + 1.5;
export const giftLands = (r, j) => r.stim + j * 0.12 + 0.55;
/** After 0:43.51: a ring above her head — a thin line, the eight word-lights with their words on it (sample notes 10: words
 *  and small cute things on the ring, not bare dots); from STIMULATIONS the bubbles she sent ride on it too. Card 8 smashes
 *  it: lights and bubbles fall as blocks, the lights flash once and go out one by one. */
/** Card 14 (sample notes 13): while the ring is the god's halo it is drawn behind the god (stage1 calls this first). */
export function drawHaloBack(x, t, F) {
  if (haloK(F, t) <= 0) return;
  const e = F.by('stage').find((v) => v.type === 'maths'); if (e) drawOrbit(x, t, e, e.ringWords || [], F, true);
}
function drawOrbit(x, t, e, ringWords, F, behind = false) {
  if (!e || t < e.home + 0.3) return;
  if ((haloK(F, t) > 0) !== behind) return;
  if (ringTaken(F, t)) return;                                       // card 17: it has come down round her
  const yr = F.by('stage').find((v) => v.type === 'years'), under = yr ? 1 - 0.8 * prog(t, yr.t, yr.t + 0.3) * (1 - prog(t, yr.back, yr.back + 0.4)) : 1;   // card 5's ruler is up here
  const od = F.by('stage').find((v) => v.ringDim != null && t >= v.t - 0.3 && t < v.until + 0.4);   // cards 15–16: the ring steps back behind the boy and the posters
  const dimK = od ? 1 - (1 - od.ringDim) * easeOut(prog(t, od.t, od.t + 0.4)) * (1 - prog(t, od.until, od.until + 0.4)) : 1;
  const k = easeOut(prog(t, e.home + 0.3, e.home + 1)) * under * dimK, n = ringWords.length, hot = warmth(F, t), back = backFlash(F, t);
  const b = F.by('stage').find((v) => v.type === 'breakup'), smash = b && t >= b.t && t < b.until ? b : null, tick = Math.floor(t * 30);
  const lineA = k * (smash ? 1 - prog(t, smash.t, smash.t + 0.5) : 1), G = ringGeom(F, t);
  const god = F.by('stage').find((v) => v.type === 'statue'), lit = G.k * (0.5 + 0.5 * (god && god.fill != null ? easeOut(prog(t, god.fill + 0.2, god.fill + 0.5)) : 0));
  x.save();
  if (lineA > 0) {                                                 // the ring itself: back half faint, front half brighter
    if (lit > 0) { x.save(); x.shadowColor = GOLD; x.shadowBlur = 24 * lit; x.strokeStyle = withAlpha('#fff1c8', 0.5 * lit * lineA); x.lineWidth = 3; x.beginPath(); x.ellipse(G.cx, G.cy, G.rx, G.ry, 0, 0, TAU); x.stroke(); x.restore(); }
    for (const [a0, a1, al] of [[Math.PI, TAU, lerp(0.18, 0.42, G.k)], [0, Math.PI, 0.42]]) {
      x.strokeStyle = withAlpha(WARM, (al + 0.25 * hot) * lineA); x.lineWidth = 1.4; x.beginPath(); x.ellipse(G.cx, G.cy, G.rx, G.ry, 0, a0, a1); x.stroke();
    }
  }
  // the bubbles she sent (card 7), riding on the ring; knocked off at 1:09.70; never after the rewind (that chat is gone)
  const r = F.by('stage').find((v) => v.type === 'romance');
  if (r && r.gifts) r.gifts.forEach((g, j) => {
    const land = giftLands(r, j); if (t < land || (b && t >= b.until)) return;
    const o = orbitPos(giftSlot(j), n, t, e), pop = easeBack(prog(t, land, land + 0.25), 2.2);
    let X = o.x, Y = o.y, a = o.front ? 1 : 0.6;
    if (smash) { const hit = smash.t + 0.05 + giftSlot(j) * 0.04, dt = t - hit; if (dt > 0) { Y += 640 * dt * dt + 20 * dt; X += (hash(j, 3) - 0.5) * 90 * dt; a *= 1 - clamp(dt / 1.1); } }
    cuteBubble(x, X, Y + 18, 15 * pop, g, a * k, '#ffd27a');   // hanging just under the ring
  });
  for (let i = 0; i < n; i++) {
    let { x: X, y: Y, front } = orbitPos(i, n, t, e, F), w = (front ? 1 : 0.55) * k;
    if (smash) {
      // card 8: 分手 grows into them one after another; each is knocked into falling blocks, shakes, then (from 1:10.08)
      // flashes once and goes out
      const hit = smash.t + 0.05 + i * 0.04, off = smash.out + i * 0.11;
      if (t >= hit) {
        X += (hash(i, tick) - 0.5) * 8; Y += (hash(tick, i) - 0.5) * 6;
        for (let j = 0; j < 6; j++) {
          const dt = t - hit - j * 0.04; if (dt < 0 || dt > 1.2) continue;
          x.globalAlpha = 0.9 * (1 - dt / 1.2); x.fillStyle = j % 2 ? WARM : '#fff0dc';
          x.fillRect(X + (hash(i, j, 1) - 0.5) * 40 + (hash(i, j, 2) - 0.5) * 100 * dt - 4, Y + 640 * dt * dt + 20 * dt - 5, 8, 10);
        }
        if (t >= off) w *= t < off + 0.1 ? 2.2 : 0;
        else w *= 0.75;
      }
    }
    if (w <= 0) continue;
    glow(x, X, Y, 16 + 22 * hot + 30 * back + 20 * lit, lit > 0.6 ? GOLD : WARM, (0.35 + 0.45 * hot + 0.5 * back + 0.4 * lit) * w); x.globalAlpha = Math.min(1, w); x.fillStyle = '#fff0dc'; x.beginPath(); x.arc(X, Y, 3 + 2 * hot, 0, TAU); x.fill();
    txt(x, ringWords[i], X, Y - 12, { size: 14, weight: 700, color: hot > 0.2 ? '#fff0f6' : '#ffd9ea', align: 'center', alpha: Math.min(1, w) * (0.5 + 0.4 * hot + 0.4 * back) * (front ? 1 : 0.6) });
  }
  x.restore();
}
