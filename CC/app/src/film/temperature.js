// Card 4 (0:44.45–0:51.36): the Master plays with her temperature. One value over time (script/act2.json 'slider'),
// read by the stage (the big slider, her stiff or spinning figure), the right panel (the temperature row, a thermometer
// from 0:51.36 on) and the frame (cold white at 0.1, oversaturated at 2.0).
import { prog, easeInOut, lerp, clamp, P } from './time.js';

const slider = (F) => F.by('stage').find((e) => e.type === 'slider');

/** The temperature at t, or null outside the slider's life (the right panel then shows its own value). Sample notes 10:
 *  smoother — a drag takes 0.42 s (0.9 s up to 2.0), and the flicker swings between its two values instead of jumping. */
export function tempAt(F, t) {
  const e = slider(F); if (!e || t < e.t) return null;
  const keys = e.keys, per = e.every * P, SWING = 0.17;           // [[time, value | "flicker"], ...]
  const held = (i, at) => {                                       // the value key i holds at time `at`
    const [kt, kv] = keys[i];
    if (kv !== 'flicker') return kv;
    const n = Math.floor((at - kt) / per), into = at - kt - n * per, cur = e.flicker[n % 2];
    const prev = n === 0 ? (i > 0 ? held(i - 1, kt - 1e-6) : e.flicker[1]) : e.flicker[(n + 1) % 2];
    return lerp(prev, cur, easeInOut(clamp(into / SWING)));
  };
  let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
  const [kt, kv] = keys[i];
  if (kv === 'flicker' || i === 0) return held(i, t);
  const from = held(i - 1, kt - 1e-6), dur = Math.abs(kv - from) > 1 ? 0.9 : 0.42;
  return lerp(from, kv, easeInOut(prog(t, kt, kt + dur)));
}

/** How cold (0..1, at 0.1) and how hot (0..1, at 2.0) the picture is at t. */
export function tempLook(F, t) {
  const v = tempAt(F, t); if (v == null) return { cold: 0, hot: 0, v: null };
  return { cold: clamp((0.7 - v) / 0.6), hot: clamp((v - 0.9) / 1.1), v };
}

/** The look on the whole frame: cold drains the colour toward a white-blue; hot pushes saturation and warmth. */
export function drawTempLook(x, F, t) {
  const { cold, hot } = tempLook(F, t); if (!cold && !hot) return;
  x.save();
  if (cold) {
    x.globalCompositeOperation = 'saturation'; x.globalAlpha = 0.9 * cold; x.fillStyle = '#808080'; x.fillRect(0, 0, 1920, 1080);
    x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.22 * cold; x.fillStyle = '#cfe2ff'; x.fillRect(0, 0, 1920, 1080);
  }
  if (hot) {
    x.globalCompositeOperation = 'saturation'; x.globalAlpha = 0.55 * hot; x.fillStyle = '#ff2a6a'; x.fillRect(0, 0, 1920, 1080);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.18 * hot; x.fillStyle = '#ff8a3d'; x.fillRect(0, 0, 1920, 1080);
  }
  x.restore();
}
