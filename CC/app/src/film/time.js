// Time helpers for the film renderer. Everything is FILM time in seconds (17_制作规范.md §2); the beat grid is the one in
// script/timeline.json (beat 0 at 0.303 s, 130 BPM), continuous over the whole film because the rewind is 12 whole beats.
export let B0 = 0.303, P = 60 / 130;
export function setGrid(grid) { B0 = grid.t0; P = 60 / grid.bpm; }

export const beat = (n) => B0 + n * P;          // Bt(n): beat n
export const bar = (n) => B0 + 4 * n * P;       // B(n): first beat of bar n (bar 12 = 22.457 s, as in the cards)
export const beatOf = (t) => Math.floor((t - B0) / P);

/** A time written in the script: a number, "B(n)" (bar) or "Bt(x)" (beat). */
export function T(v) {
  if (typeof v === 'number') return v;
  if (v == null) return v;
  let m = /^B\(([\d.]+)\)$/.exec(v); if (m) return bar(+m[1]);
  m = /^Bt\(([\d.]+)\)$/.exec(v); if (m) return beat(+m[1]);
  return +v;
}

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));                       // 0 before a, 1 after b
export const smooth = (k) => k * k * (3 - 2 * k);
export const easeOut = (k) => 1 - (1 - k) ** 3;
export const easeIn = (k) => k ** 3;
export const easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
export const easeBack = (k, s = 1.4) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;
export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;

/** Deterministic random numbers (mulberry32), so a frame looks the same however it is reached. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** A random number fixed by a few integers (frame-independent noise). */
export function hash(...k) {
  let h = 2166136261;
  for (const v of k) { h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); }
  return rng(h >>> 0)();
}
