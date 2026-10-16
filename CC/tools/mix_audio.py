"""Sound of a stretch of the film (17_制作规范.md §9): the self-provided edited song (input/edited_song.wav, film time) with the
interface sounds of the script laid over it, quiet, under the music.

The sounds come from the act files (CC/script/act*.json), the same events the picture is drawn from:
  region "sound"  typing · ka (a weight slab lands) · stamp · click · notify · whoosh — written out in the cards
  region "chat"   the Master's typing (typeFrom -> t) and the send at t; her reply landing (typeUntil); her sticker;
                  each spam message of the token flood, one note higher each time
All are synthesised here with numpy (nothing downloaded). Times may be numbers, "B(n)" (bar) or "Bt(x)" (beat), resolved
with the grid in timeline.json exactly as the renderer does (app/src/film/time.js).

Install the optional numpy and soundfile packages in your chosen Python environment.
No audio is bundled or downloaded. Example:
  python CC/tools/mix_audio.py --from 0 --to 6.38 --out CC/样片/音频片段/G1.wav
The output contains your source music and retains its rights; keep it out of the code-only package.
  options: --sfx-db -3 (all interface sounds louder/quieter) · --stem (also write <out>_音效.wav, the sounds alone)
"""
import argparse
import json
import pathlib
import re
import math

root = pathlib.Path(__file__).resolve().parents[2]
script = root / 'CC' / 'script'


def T(v):
    if v is None or isinstance(v, (int, float)):
        return v
    m = re.fullmatch(r'B\(([\d.]+)\)', v)
    if m:
        return B0 + 4 * float(m[1]) * P
    m = re.fullmatch(r'Bt\(([\d.]+)\)', v)
    if m:
        return B0 + float(m[1]) * P
    return float(v)


ap = argparse.ArgumentParser()
ap.add_argument('--from', dest='start', type=float, required=True)
ap.add_argument('--to', dest='end', type=float, required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--sfx-db', type=float, default=0.0)
ap.add_argument('--stem', action='store_true')
a = ap.parse_args()
if not math.isfinite(a.start) or not math.isfinite(a.end) or a.start < 0 or a.end <= a.start:
    ap.error('--from and --to must be finite with 0 <= from < to')
if not math.isfinite(a.sfx_db):
    ap.error('--sfx-db must be finite')
out = pathlib.Path(a.out).expanduser().resolve()
allowed_outputs = [(root / 'CC' / '样片').resolve(), (root / 'CC' / '发布').resolve()]
if not any(out.is_relative_to(folder) and out != folder for folder in allowed_outputs):
    ap.error('--out must stay inside this package\'s CC/样片 or CC/发布 directory')
source_audio = root / 'input' / 'edited_song.wav'
if not source_audio.is_file():
    ap.error('missing input/edited_song.wav; first run audio_edit.py --src <your audio>, or use --noaudio in the video exporter')
try:
    import numpy as np
    import soundfile as sf
except ImportError:
    ap.error('optional audio dependencies are missing: install numpy and soundfile in this Python environment')
tl = json.loads((script / 'timeline.json').read_text(encoding='utf-8'))
B0, P = tl['grid']['t0'], 60 / tl['grid']['bpm']
song, sr = sf.read(str(source_audio), always_2d=True)
if len(song) == 0:
    ap.error('input/edited_song.wav has no audio samples')
if song.shape[1] == 1:
    song = np.repeat(song, 2, axis=1)
elif song.shape[1] != 2:
    ap.error('input/edited_song.wav must be mono or stereo')
rng = np.random.default_rng(20261013)


def n(s):
    return int(round(s * sr))


def tt(k):
    return np.arange(k) / sr


def db(x):
    return 10 ** (x / 20)


def onepole(x, alpha):
    """One-pole low-pass (alpha 0..1, smaller = darker); vectorised enough for short sounds."""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def highpass(x, alpha):
    return x - onepole(x, alpha)


# ---------------------------------------------------------------- the sounds (mono, peak about 1 before their level)
def key_tick(bright=1.0):
    """One key of a laptop keyboard: a 4 ms click of filtered noise with a tiny body."""
    k = n(0.022)
    noise = rng.standard_normal(k) * np.exp(-tt(k) * 420)
    body = np.sin(2 * np.pi * rng.uniform(1800, 2600) * tt(k)) * np.exp(-tt(k) * 260) * 0.35
    s = highpass(noise, 0.25 * bright) + body
    return s / np.max(np.abs(s))


def typing(t0, t1, rate=15.0, level=0.5):
    """Key ticks at a human, uneven rate between t0 and t1."""
    out, t = [], t0
    while t < t1:
        out.append((t, key_tick(rng.uniform(0.8, 1.2)), level * rng.uniform(0.6, 1.0)))
        t += rng.uniform(0.6, 1.4) / rate
    return out


def ka():
    """A weight slab lands on the stack: a hard 'ka' (bright tick) with a short low body."""
    k = n(0.16)
    tick = highpass(rng.standard_normal(k) * np.exp(-tt(k) * 300), 0.35)
    body = np.sin(2 * np.pi * 140 * tt(k) * (1 - 0.25 * tt(k) / 0.16)) * np.exp(-tt(k) * 32)
    s = 0.8 * tick + body
    return s / np.max(np.abs(s))


def stamp():
    """A rubber stamp pressed down: a dull thump and a papery slap."""
    k = n(0.22)
    thump = np.sin(2 * np.pi * 82 * tt(k)) * np.exp(-tt(k) * 26)
    slap = onepole(rng.standard_normal(k), 0.3) * np.exp(-tt(k) * 70)
    s = thump + 0.9 * slap
    return s / np.max(np.abs(s))


def crack():
    """Glass giving way (card 22, the branch read): a bright snap, then a few thin rings dying away."""
    k = n(0.5)
    snap = highpass(rng.standard_normal(k), 0.5) * np.exp(-tt(k) * 90)
    rings = sum(np.sin(2 * np.pi * f * tt(k)) * np.exp(-tt(k) * d) * g for f, d, g in ((2630, 9, 0.5), (3910, 12, 0.35), (5170, 16, 0.25), (1840, 7, 0.3)))
    s = snap + rings
    return s / np.max(np.abs(s))


def slash():
    """A blade through paper (card 22, each cut): a fast rising swish, then a thin metallic ting."""
    k = n(0.32)
    sw = highpass(rng.standard_normal(k), 0.6) * np.sin(np.pi * np.clip(tt(k) / 0.09, 0, 1)) * np.exp(-tt(k) * 30)
    ting = np.sin(2 * np.pi * 3150 * tt(k)) * np.exp(-tt(k) * 22) * 0.35
    s = sw + ting
    return s / np.max(np.abs(s))


def deny():
    """Refused (card 24): a low, soft double buzz — the polite no."""
    k = n(0.36)
    env = np.exp(-tt(k) * 9) * (np.sin(np.pi * np.clip(tt(k) / 0.02, 0, 1)))
    tone = np.sign(np.sin(2 * np.pi * 110 * tt(k))) * 0.4 + np.sin(2 * np.pi * 220 * tt(k)) * 0.6
    gate = (np.sin(2 * np.pi * 7 * tt(k)) > -0.2).astype(float)
    s = onepole(tone * env * gate, 0.25)
    return s / np.max(np.abs(s))


def zap():
    """Electricity (card 24, her stream of data): crackling bursts for most of a second."""
    k = n(0.8)
    s = np.zeros(k)
    for i in range(18):
        at = int(rng.random() * (k - n(0.05))); m = n(0.01 + 0.04 * rng.random())
        s[at:at + m] += highpass(rng.standard_normal(m), 0.5) * np.exp(-tt(m) * 120) * (0.4 + rng.random())
    s += np.sin(2 * np.pi * 60 * tt(k)) * 0.15 * np.exp(-tt(k) * 2)
    return s / np.max(np.abs(s))


def blip():
    """A test passing (card 23): a short soft high note."""
    return bell(1568, 0.16, 28)


def click():
    """A mouse button: down and up, 60 ms apart (same build as the click before the rewind, tools/audio_edit.py)."""
    k = n(0.09)
    s = np.zeros(k)
    for off, g in ((0, 1.0), (n(0.06), 0.55)):
        m = n(0.008)
        c = highpass(rng.standard_normal(m), 0.4) * np.exp(-tt(m) * 700) * g
        s[off:off + m] += c
    return s / np.max(np.abs(s))


def bell(f, dur=0.5, decay=9.0):
    k = n(dur)
    s = sum(g * np.sin(2 * np.pi * f * r * tt(k)) for r, g in ((1, 1.0), (2.76, 0.28), (5.4, 0.09)))
    att = np.minimum(1, tt(k) / 0.004)
    return s * np.exp(-tt(k) * decay) * att


def notify():
    """The first message arrives: two soft bell notes, a fifth apart."""
    s = np.zeros(n(0.7))
    a, b = bell(1046.5, 0.55), bell(1568.0, 0.6)
    s[:len(a)] += a
    s[n(0.09):n(0.09) + len(b)] += b * 0.9
    return s / np.max(np.abs(s))


def pop(f=700):
    """Her message lands: a small bubble pop (a quick upward chirp)."""
    k = n(0.07)
    ph = 2 * np.pi * np.cumsum(f * (1 + 1.6 * tt(k) / 0.07)) / sr
    s = np.sin(ph) * np.sin(np.pi * np.minimum(1, tt(k) / 0.07)) ** 2
    return s / np.max(np.abs(s))


def send():
    """The Master sends: a short soft 'tup', lower than her pop."""
    k = n(0.06)
    s = np.sin(2 * np.pi * 520 * tt(k) * (1 - 0.3 * tt(k) / 0.06)) * np.exp(-tt(k) * 60) * np.minimum(1, tt(k) / 0.002)
    return s / np.max(np.abs(s))


def ping(semi):
    """One spam message of the token flood; each a semitone higher."""
    return bell(880 * 2 ** (semi / 12), 0.22, 22)


def chime():
    """The tavern is built (0:43.51): a warm three-note bell, low to high."""
    s = np.zeros(n(1.2))
    for k, (f, d) in enumerate(((523.25, 0.0), (659.25, 0.07), (783.99, 0.14))):
        b = bell(f, 1.0, 4.5); s[n(d):n(d) + len(b)] += b * (1 - 0.15 * k)
    return s / np.max(np.abs(s))


def whoosh(dur=0.42):
    """The flood is withdrawn: filtered noise sweeping up and away."""
    k = n(dur)
    x = rng.standard_normal(k)
    out = np.empty(k)
    acc = 0.0
    for i in range(k):                                    # the filter opens as it goes
        alpha = 0.02 + 0.3 * (i / k) ** 1.5
        acc += alpha * (x[i] - acc)
        out[i] = acc
    s = out * np.sin(np.pi * tt(k) / dur) ** 1.5
    return s / np.max(np.abs(s))


# ---------------------------------------------------------------- the cue list from the script
events = []
for f in sorted(script.glob('act*.json')):
    events += json.loads(f.read_text(encoding='utf-8'))['events']

LEVEL = {  # peak level of each sound, in dB below full scale (the song peaks near 0 dB)
    'typing': -27, 'ka': -16, 'stamp': -17, 'click': -20, 'notify': -19, 'whoosh': -21,
    'send': -24, 'pop': -23, 'ping': -25, 'sticker': -22, 'lamp': -27, 'chime': -20, 'crack': -21, 'slash': -22, 'blip': -24, 'deny': -21, 'zap': -24,
}
cues = []   # (time, mono sound, linear gain)
for e in events:
    t = T(e['t'])
    if e['region'] == 'sound':
        kind = e['type']
        if kind == 'lamps':                                       # the ring of lamps lighting one by one, each a note higher
            for i in range(e['count']):
                cues.append((t + i * e['every'], bell(1046.5 * 2 ** ((2 * i) / 12), 0.35, 10), db(LEVEL['lamp'])))
        elif kind == 'typing':
            for c in typing(t, T(e['until']), level=e.get('level', 0.5)):
                cues.append((c[0], c[1], db(LEVEL['typing']) * c[2] * 2))
        else:
            cues.append((t, {'ka': ka, 'stamp': stamp, 'click': click, 'notify': notify, 'whoosh': whoosh, 'chime': chime, 'crack': crack, 'slash': slash, 'blip': blip, 'deny': deny, 'zap': zap}[kind](), db(LEVEL[kind])))
    elif e['region'] == 'chat':
        if e['type'] == 'master':
            if e.get('typeFrom') is not None:
                for c in typing(T(e['typeFrom']), t - 0.06, rate=17, level=0.45):
                    cues.append((c[0], c[1], db(LEVEL['typing']) * c[2] * 2))
            cues.append((t, send(), db(LEVEL['send'])))
        elif e['type'] == 'her' and not e.get('preset'):
            cues.append((T(e['typeUntil']) if e.get('typeUntil') is not None else t, pop(), db(LEVEL['pop'])))
        elif e['type'] == 'sticker':
            cues.append((t, pop(560), db(LEVEL['sticker'])))
        elif e['type'] == 'spam':
            for i in range(e['count']):
                cues.append((t + i * e['every'] * P, ping(i), db(LEVEL['ping'])))

# ---------------------------------------------------------------- mix
start, end = a.start, a.end
length = n(end - start)
if length < 1:
    ap.error('the selected range contains no samples at the input sample rate')
fx = np.zeros(length)
for t, s, g in cues:
    i = n(t - start)
    if i >= length or i + len(s) <= 0:
        continue
    lo, hi = max(0, -i), min(len(s), length - i)
    fx[i + lo:i + hi] += s[lo:hi] * g
fx *= db(a.sfx_db)
# the decoded song goes over full scale in places (+1.7 dB): one fixed headroom for the WHOLE film, so every stretch
# exported keeps the same loudness; then a soft knee above 0.95 for what the sounds add on top
head = 0.97 / max(1.0, np.max(np.abs(song)))
music = song[n(start):n(start) + length]
if len(music) < length:
    music = np.vstack([music, np.zeros((length - len(music), 2))])
mix = (music + fx[:, None]) * head
over = np.abs(mix) > 0.95
mix[over] = np.sign(mix[over]) * (0.95 + 0.05 * np.tanh((np.abs(mix[over]) - 0.95) / 0.05))
peak = np.max(np.abs(mix))

out.parent.mkdir(parents=True, exist_ok=True)
sf.write(str(out), mix, sr, subtype='PCM_24')
if a.stem:
    sf.write(str(out.with_name(out.stem + '_音效.wav')), np.repeat(fx[:, None], 2, axis=1), sr, subtype='PCM_24')
used = sum(1 for t, s, g in cues if start - 1 < t < end)
fx_peak = 20 * np.log10(max(np.max(np.abs(fx)), 1e-9))
print(f'wrote {out}  ({end - start:.2f} s, {used} sounds, sounds peak {fx_peak:.1f} dB, mix peak {20 * np.log10(peak):.1f} dB)')
