// Bottom · lyric bar (17_制作规范.md §7, §12): English from the user's LRC and Chinese from DeepSeek's translation, both
// read at run time (data.js). Keyword lines are bigger and decode from noise; line 0 is set in mono like a system log;
// where nobody sings, "♪ 间奏". The rewind (timeline.json edits[0].lyrics): line 43 freezes on the click; from 1:15.76
// lines 29 and 28 come back reversed — each appears from its last character to its first, flickering, partly mosaicked,
// and rots as it goes. Always drawn at real film time, also inside the rewind.
import { prog, easeOut, hash } from './time.js';
import { txt, scramble, font, graphemes } from './draw.js';

export function drawLyrics(x, t, F, pal) {
  x.fillStyle = pal.bar; x.fillRect(0, 940, 1920, 120);
  const ed = F.timeline.edits?.[0], rp = ed?.lyrics?.replay?.lines.find((r) => t >= r.start && t < r.end);
  if (rp) { drawReplay(x, t, F, pal, rp); return; }
  const L = F.lines.find((l) => t >= l.start && t < l.end);
  const ev = F.by('lyrics');
  if (!L) {
    const gap = ev.find((e) => e.type === 'interlude' && t >= e.t && t < e.until);
    if (gap) txt(x, gap.text, 960, 1008, { size: 30, color: pal.sub, align: 'center', alpha: easeOut(prog(t, gap.t, gap.t + 0.3)) });
    return;
  }
  const frozen = ed && t >= ed.atFilm && t < ed.lyrics.holdUntil;   // the song stopped on the click
  const a = easeOut(prog(t, L.start, L.start + 0.12)) * (frozen ? 1 : 1 - prog(t, L.end - 0.08, L.end));
  const mono = ev.some((e) => e.type === 'style' && e.line === L.i && e.mono);
  if (L.keyword) {
    const w = scramble(L.en, (frozen ? ed.atFilm : t) - L.start, 0.2, L.i);
    x.save(); x.shadowColor = pal.accent; x.shadowBlur = frozen ? 0 : 14 * (1 - prog(t, L.start, L.start + 0.6));
    txt(x, w, 960, 996, { size: 48, weight: 700, mono: true, color: frozen ? pal.sub : pal.text, align: 'center', alpha: a, spacing: 4 });
    x.restore();
    if (L.zhTone === 'red') { x.save(); x.shadowColor = '#ff3b47'; x.shadowBlur = 12 * (1 - prog(t, L.start, L.start + 0.5)); txt(x, L.zh, 960, 1040, { size: 29, weight: 700, color: '#ff6b6b', align: 'center', alpha: a }); x.restore(); }
    else txt(x, L.zh, 960, 1040, { size: 27, color: pal.sub, align: 'center', alpha: a });
  } else {
    txt(x, L.en, 960, 990, { size: mono ? 29 : 32, mono, color: frozen ? pal.sub : pal.text, align: 'center', alpha: a });
    txt(x, L.zh, 960, 1038, { size: 28, color: pal.sub, align: 'center', alpha: a });
  }
  if (frozen) txt(x, '❚❚', 380, 1010, { size: 24, color: pal.sub, align: 'center', alpha: 0.8 });
}

function drawReplay(x, t, F, pal, r) {
  const L = F.lines.find((l) => l.i === r.i); if (!L) return;
  const k = prog(t, r.start, r.end), tick = Math.floor(t * 30), flick = 0.7 + 0.3 * hash(tick, r.i);
  if (t < r.start + 0.12) { x.save(); x.globalAlpha = 0.35 * (1 - prog(t, r.start, r.start + 0.12)); x.fillStyle = '#cfe0ff'; x.fillRect(0, 940, 1920, 120); x.restore(); }
  for (const [s, Y, size, col] of [[L.en, 990, 32, pal.text], [L.zh, 1038, 28, pal.sub]]) {
    const g = graphemes(s), n = g.length;
    x.font = font(size); let X = 960 - x.measureText(s).width / 2;
    g.forEach((ch, j) => {
      const w = x.measureText(ch).width, appear = ((n - 1 - j) / n) * 0.4, rot = 0.55 + hash(r.i, j, size) * 0.45;
      if (k >= appear && k < rot && ch.trim()) {
        if (hash(j, tick >> 1, size) < 0.12) { x.save(); x.globalAlpha = 0.6 * flick; x.fillStyle = col; for (let q = 0; q < 4; q++) x.fillRect(X + (q % 2) * w / 2, Y - size * 0.8 + (q >> 1) * size * 0.4, w / 2 - 1, size * 0.4 - 1); x.restore(); }
        else txt(x, ch, X, Y, { size, color: col, alpha: flick * (k < rot - 0.08 ? 1 : 0.45) });
      }
      X += w;
    });
  }
  txt(x, '◀◀', 380, 1010, { size: 24, color: pal.sub, align: 'center', alpha: 0.8 * flick });
}
