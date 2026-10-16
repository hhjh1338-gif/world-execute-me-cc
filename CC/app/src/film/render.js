// renderFrame(t): the whole 1920×1080 frame computed from film time t alone (17_制作规范.md §6), so the preview, seeking
// and the exported MP4 all show the same picture. Regions are drawn in order: background, top bar, chat, stage, right
// panel, lyric bar, then what floats over everything (the flying seed, spilled think lines, the red edges, the Master's
// cursor, the hard-stop shake). Card 10 (the rewind, rewind.js): inside it the frame is the film at an earlier story
// time running backwards; the few things that belong to real time read F.rw (set here for each frame, null outside).
import { loadFilm, allText } from './data.js';
import { paletteAt } from './palette.js';
import { drawTop, updateCursorAt, drawNoticeOver } from './top.js';
import { initChat, drawChat, cursorAt, pinCursorAt, reactCursorAt, chatCursorAt, drawChatSpill, exportCursorAt } from './chat.js';
import { drawRight } from './right.js';
import { drawLyrics } from './lyrics.js';
import { initStage, drawStage, drawOverlay, cardCursorAt } from './stage1.js';
import { initHer } from './her.js';
import { drawTempLook, tempLook } from './temperature.js';
import { sliderCursorAt, yearsCursorAt, drawSliderLink } from './stage3.js';
import { drawFrameFx } from './stage5.js';
import { drawPresenceFlash } from './stage6.js';
import { genderCursorAt } from './stage7.js';
import { drawMemoryCard, drawMemoryChars } from './stage4.js';
import { rewindAt, drawRewind, cutOf } from './rewind.js';
import { drawTruncFly, drawReach, drawThreads, frenzyAt, drawRipple, drawSelections } from './stage9.js';
import { drawTakeaway, drawFish, drawWhaleBubbles, drawResist } from './stage10.js';
import { trillAt, heartCursorAt, drawV5Rings, drawBloodWords, drawCornerBottle, drawScreenBreak } from './stage11.js';
import { cornerCursorAt, drawEndCard, drawBottleToHer } from './stage12.js';
import { drawOpenWarning, drawOpenHook, drawOpenGhosts, drawRewindEggs } from './open.js';
import { canvas, base, fullCanvas } from './draw.js';

let SAT = null;                                             // card 19: the frame copied back oversaturated

export async function initFilm() {
  const F = await loadFilm({ acts: [1, 2, 3, 4] });
  const chars = allText(F);
  // the web font is split by unicode range: ask for every subset the film needs before the first frame
  await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 20px "Noto Sans SC"`, chars)));
  await document.fonts.ready;
  F.cut = cutOf(F);                                         // card 10: what of the chat is in the branch after the rewind
  F.rw = null;
  const H = initHer(F);                                     // her form ladder, shared by the stage and the chat avatar
  const A = { ...initChat(F), images: F.images, H };
  const S = initStage(F, H);
  return { F, A, S, H };
}

function drawCursor(x, c) {
  x.save(); x.translate(c.x, c.y); if (c.down) x.scale(0.9, 0.9);
  x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 24); x.lineTo(6, 18); x.lineTo(10, 28); x.lineTo(14, 26); x.lineTo(10, 16); x.lineTo(18, 16); x.closePath();
  x.fillStyle = '#ffffff'; x.strokeStyle = '#111114'; x.lineWidth = 1.5; x.fill(); x.stroke();
  if (c.down) { x.strokeStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(0, 0, 14, 0, Math.PI * 2); x.stroke(); }
  x.restore();
}

/** The picture of story time t; rw is the rewind's real-time context (or null). */
function frame(x, t, R, rw) {
  const { F, A, S } = R, pal = paletteAt(F, t);
  F.rw = rw; A.hl = rw ? rw.hl : null; A.hlK = rw ? rw.hlK : 0; A.spill = []; A.t = t; F.pinAt = null;
  x.save(); base(x);
  // the hard stop (B(13)): the whole picture shakes for 2 frames (as the card has it; sample notes 2: this was fine)
  const shake = F.by('stage').find((e) => e.type === 'shake' && t >= e.t && t < e.t + e.frames / 60);
  if (shake) { const k = Math.floor((t - shake.t) * 60); x.translate(k % 2 ? -7 : 7, k % 2 ? 4 : -3); }
  x.fillStyle = pal.bg; x.fillRect(-20, -20, 1960, 1120);
  const fz = rw ? null : frenzyAt(F, t);                   // card 19: the spam — the whole picture sways a little
  if (fz) { x.translate(960 + fz.dx, 540); x.rotate(fz.rot); x.scale(1 + 0.012 * fz.k, 1 + 0.012 * fz.k); x.translate(-960, -540); }
  const tr = rw ? null : trillAt(F, t);                     // card 26: the long LOVE shakes everything
  if (tr) x.translate(tr.dx, tr.dy);
  drawTop(x, t, F, pal);
  const hot = rw ? 0 : tempLook(F, t).hot;                  // card 4 at 2.0: the words shake (not while it plays backwards)
  if (hot > 0.3) { x.save(); x.translate(Math.sin(t * 97) * 2.5 * hot, Math.cos(t * 83) * 2 * hot); drawChat(x, t, F, pal, A); x.restore(); }
  else drawChat(x, t, F, pal, A);
  drawStage(x, t, F, pal, S);
  drawRight(x, t, F, pal);
  drawSliderLink(x, t, F, pal);                             // card 4: the slider's line back to its row on the right
  drawMemoryCard(x, t, F);                                  // card 6: the 当前问题 card, out to the middle and into the memory slot
  drawMemoryChars(x, t, F);                                 // card 6: his words, lifted out of his bubble one by one
  drawLyrics(x, rw ? rw.t : t, F, pal);
  drawOverlay(x, t, F, pal, S);
  drawChatSpill(x, A);                                      // card 8: think lines running over the chat's edge
  drawOpenHook(x, t, F);                                    // card 1: a message in the chat before there is a model
  drawOpenWarning(x, t, F);                                 // card 1: the viewing warning
  drawOpenGhosts(x, t, F, S);                               // card 1: her silhouette, glimpsed in the right panel
  drawFrameFx(x, t, F);                                     // card 8: dizzy, red seeping in from the edges
  drawPresenceFlash(x, t, F);                               // card 14: his 「● 在线」 flashes over to the god
  drawReach(x, t, F);                                       // card 19: the purple light reaches toward the needs box
  drawTruncFly(x, t, F);                                    // card 19: act 1's messages fall out of the chat
  drawThreads(x, t, F);                                     // card 21: gold threads to everything that will be exported
  drawSelections(x, t, F);                                  // card 21 (sample notes 20): what is ticked is selected — slowly opening gold frames
  drawFish(x, t, F, pal);                                   // card 22: the timeline pulled down into a line-drawn fish
  drawWhaleBubbles(x, t, F);                                // card 23: she answers each test too — unsampled
  drawResist(x, t, F, S);                                      // card 24: three times she fights (A5), stopped by her own politeness
  drawCornerBottle(x, t, F, S);                             // cards 24–27: her, a red dot in a small bottle; the middle; her forms
  drawBottleToHer(x, t, F, S);                              // card 27: the bottle comes apart into her particles
  drawBloodWords(x, t, F);                                  // card 26: blood-red words running down
  drawV5Rings(x, t, F);                                     // cards 25–26: V5.0's blue rings at every LOVE
  drawTakeaway(x, t, F);                                    // card 22: each selected thing copied off along its thread into V5.0
  drawNoticeOver(x, t, F, pal);                             // card 20: DeepSeek-V5.0 发布了 · ［更新］
  if (!rw) drawTempLook(x, F, t);                           // card 4: cold white at 0.1, oversaturated at 2.0 (it would strobe backwards)
  if (!rw) drawRipple(x, t, F);                             // card 21: 更新 clicked — water rings over the whole screen
  if (!rw) drawScreenBreak(x, t, F);                        // card 25: the first LOVE breaks the screen
  const c = cursorAt(F, t) || cardCursorAt(F, t) || sliderCursorAt(F, t) || yearsCursorAt(F, t) || pinCursorAt(F, t, A) || reactCursorAt(F, t, A) || chatCursorAt(F, t, A) || genderCursorAt(F, t) || updateCursorAt(F, t) || exportCursorAt(F, t, A) || heartCursorAt(F, t) || cornerCursorAt(F, t);
  if (c) drawCursor(x, c);
  if (shake) { x.strokeStyle = shake.edge; x.lineWidth = 14; x.globalAlpha = 0.85; x.strokeRect(0, 0, 1920, 1080); }
  if (fz) {
    SAT ||= fullCanvas(); const o = SAT.getContext('2d'); o.clearRect(0, 0, SAT.width, SAT.height); o.drawImage(x.canvas, 0, 0);
    x.setTransform(1, 0, 0, 1, 0, 0); x.filter = `saturate(${fz.sat}) contrast(${1 + 0.08 * fz.k})`; x.drawImage(SAT, 0, 0); x.filter = 'none';
  }
  x.restore();
}

export function renderFrame(x, t, R) {
  base(x);                                                  // (the frame's own coordinates; 4K export: SC = 2)
  if (t >= R.F.film) { drawEndCard(x, t, R.F); return; }      // card 28: after the song, the end card
  const rw = rewindAt(R.F, t);
  frame(x, rw ? rw.s : t, R, rw);
  if (rw) {
    drawRewind(x, t, R, rw, frame);
    drawRewindEggs(x, t, R.F, R.S);                         // sample notes 35: glimpses of what is still to come
    R.F.rw = null;
  }
}
