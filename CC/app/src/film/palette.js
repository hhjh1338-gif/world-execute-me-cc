// The UI colours at a moment (17_制作规范.md §5, script/colour.json): a base set that switches HARD at story turning
// points, nudged a little by the emotion curve (sweet warms, mad pulls toward red-black). The UI sets per base come from
// the approved layout mockups (tools/mockups.mjs); bases not yet built fall back to her blue.
import { clamp } from './time.js';
import { mixHex } from './draw.js';

const UI = {
  '开机：灰度': { bg: '#0e0e10', bar: '#141416', panel: '#18181b', raised: '#202024', line: '#33333a', text: '#e6e6ea', sub: '#9a9aa3',
    faint: '#66666e', accent: '#9a9aa3', masterBubble: '#3a3a42', herBubble: '#26262c', stageTop: '#1a1a1e', stageBottom: '#0e0e10' },
  '她醒来：她的蓝': { bg: '#0c0d16', bar: '#10121d', panel: '#141726', raised: '#1b1f31', line: '#2c3150', text: '#eceefa', sub: '#a3a9cc',
    faint: '#6c7296', accent: '#80b2d8', masterBubble: '#3651b8', herBubble: '#20253c', stageTop: '#161b30', stageBottom: '#0c0e18' },
  '酒馆：暖粉': { bg: '#120c16', bar: '#170f1d', panel: '#1b1322', raised: '#24192e', line: '#3a2a45', text: '#f3e9f2', sub: '#c4a9c4',
    faint: '#8a7390', accent: '#ff7eb6', masterBubble: '#3651b8', herBubble: '#2a1d33', stageTop: '#2a1828', stageBottom: '#140c16' },
};
UI['回到酒馆：暖粉'] = UI['酒馆：暖粉'];
// card 8 (1:09.26): the hard cut to cold grey-blue as she says 执行; card 10: tape blue (the rewind draws the earlier
// story with its own colours and grades the frame toward this, rewind.js)
UI['“我执行”：冷'] = { bg: '#0d1117', bar: '#11161d', panel: '#141a22', raised: '#1b222c', line: '#2c3644', text: '#e4e9ef', sub: '#9aa7b6',
  faint: '#5f6b7a', accent: '#8fa3b8', masterBubble: '#34465f', herBubble: '#1d242e', stageTop: '#141b24', stageBottom: '#0b0f14' };
// act 3: the long night (dark, his warmth gone), the cold morning, and the red-black of the update
UI['长夜：暗'] = { bg: '#07090f', bar: '#0a0d15', panel: '#0d111b', raised: '#141a27', line: '#222b40', text: '#d9deeb', sub: '#8b93ad',
  faint: '#545c76', accent: '#4a5a94', masterBubble: '#2a3768', herBubble: '#151b2a', stageTop: '#0b0f1a', stageBottom: '#05070c' };
UI['早晨：冷灰蓝'] = { ...UI['“我执行”：冷'] };
UI['更新：红黑'] = { bg: '#10070a', bar: '#14090c', panel: '#190b0f', raised: '#241015', line: '#3d1a22', text: '#f0dfe2', sub: '#b88e96',
  faint: '#6e4a52', accent: '#d6303a', masterBubble: '#4a1d26', herBubble: '#22121a', stageTop: '#1a090d', stageBottom: '#0a0406' };
// card 27: calm — her blue again, quieter; V5.0's flat blue (the new model's own colour); the end card's black
UI['平静：她的蓝'] = { bg: '#0a0c14', bar: '#0e1019', panel: '#121524', raised: '#191d2e', line: '#283049', text: '#e6e9f6', sub: '#9ca3c6',
  faint: '#646a8c', accent: '#6491cb', masterBubble: '#2f4699', herBubble: '#1d2236', stageTop: '#121729', stageBottom: '#090b13' };
UI['V5.0：平的蓝'] = { bg: '#0c0d16', bar: '#10121e', panel: '#13162a', raised: '#1a1e38', line: '#2a3266', text: '#eef0ff', sub: '#a7b0e6',
  faint: '#6870a8', accent: '#4d6bfe', masterBubble: '#4d6bfe', herBubble: '#1e2346', stageTop: '#151a3a', stageBottom: '#0c0d18' };
UI['片尾：黑'] = { bg: '#000000', bar: '#000000', panel: '#000000', raised: '#0a0a0a', line: '#1a1a1a', text: '#e6e6ea', sub: '#9a9aa3',
  faint: '#55555c', accent: '#e6e6ea', masterBubble: '#222', herBubble: '#111', stageTop: '#000', stageBottom: '#000' };
UI['倒流：倒带蓝'] = { bg: '#0b0e18', bar: '#0f1320', panel: '#121829', raised: '#1a2136', line: '#2a3556', text: '#e6ecff', sub: '#9fb0d8',
  faint: '#5f6f99', accent: '#8fb3ff', masterBubble: '#3651b8', herBubble: '#1c2338', stageTop: '#141a2e', stageBottom: '#0a0d18' };
export const PINK = '#ff9ccf', ORANGE = '#ff8a3d', GOLD = '#ffc46b', OK = '#7fd1a8';

function feel(points, t) {
  if (t <= points[0].t) return [points[0].sweet, points[0].mad];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (t <= b.t) { const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0; return [a.sweet + (b.sweet - a.sweet) * k, a.mad + (b.mad - a.mad) * k]; }
  }
  const z = points[points.length - 1]; return [z.sweet, z.mad];
}

export function paletteAt(F, t) {
  const base = F.colour.base.filter((b) => b.t <= t + 1e-6).pop();
  const ui = { ...(UI[base.name] || UI['她醒来：她的蓝']) };
  const [sweet, mad] = feel(F.emotion.points, t), E = F.colour.emotion;
  const warm = clamp(sweet / 10), red = clamp((mad - E.madFrom) / (10 - E.madFrom));
  for (const k of ['bg', 'bar', 'panel', 'stageBottom']) ui[k] = mixHex(mixHex(ui[k], E.warmBg, warm * E.warmBgMax * 0.5), E.redBg, red * E.redBgMax);
  ui.accent = mixHex(mixHex(base.accent, E.warmAccent, warm * E.warmAccentMax * 0.3), E.redAccent, red * E.redAccentMax);
  return { ...ui, name: base.name, sweet, mad, grey: base.name === '开机：灰度' };
}
