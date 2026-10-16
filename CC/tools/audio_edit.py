"""Prepare a self-provided song using the edit timings in CC/script/timeline.json.

No music is bundled or downloaded. Install numpy and soundfile in your chosen
Python environment; scipy is optional and only needed when --rate resamples.

  python CC/tools/audio_edit.py --src input/song.flac --shift-ms 1.02 --rate 48000

Outputs stay in this package: input/edited_song.wav and input/preview_rewind.wav.
The source audio and these derivatives retain their own rights; do not include
them when sharing the code-only package.
"""
import argparse
import json
import pathlib
import math

root = pathlib.Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--src', required=True, help='path to your own source audio file; no music is supplied')
ap.add_argument('--shift-ms', type=float, default=0.0, help='advance the source by this many milliseconds; negative values add leading silence')
ap.add_argument('--rate', type=int, default=0, help='resample to this rate (0 = keep source rate; scipy needed only for resampling)')
args = ap.parse_args()
if not math.isfinite(args.shift_ms) or args.rate < 0:
    ap.error('--shift-ms must be finite and --rate must be zero or a positive integer')
src = pathlib.Path(args.src).expanduser().resolve()
if not src.is_file():
    ap.error(f'source audio does not exist: {src}')
try:
    import numpy as np
    import soundfile as sf
except ImportError:
    ap.error('optional audio dependencies are missing: install numpy and soundfile in this Python environment')
tl = json.loads((root / 'CC' / 'script' / 'timeline.json').read_text(encoding='utf-8'))
edit = tl['edits'][0]
song, sr = sf.read(str(src), always_2d=True)
if song.shape[1] == 1:
    song = np.repeat(song, 2, axis=1)
elif song.shape[1] != 2:
    ap.error('use mono or stereo source audio')
if args.rate and args.rate != sr:
    from math import gcd
    try:
        from scipy.signal import resample_poly
    except ImportError:
        ap.error('resampling with --rate needs the optional scipy package')
    g = gcd(args.rate, sr); song = resample_poly(song, args.rate // g, sr // g, axis=0); sr = args.rate
shift = int(round(args.shift_ms / 1000 * sr))
song = song[shift:] if shift >= 0 else np.vstack([np.zeros((-shift, 2)), song])
if len(song) < int(tl['song']['duration'] * sr):
    ap.error('source audio is shorter than the song duration specified in timeline.json after the shift')
song = song[: int(tl['song']['duration'] * sr)]
print(f'source {src.name}: {sr} Hz, shifted {args.shift_ms} ms')
period = tl['grid']['period']
rng = np.random.default_rng(20261010)


def secs(n):
    return int(round(n * sr))


def lowpass(x, alpha):
    """One-pole low-pass, per channel (alpha 0..1: smaller = darker)."""
    y = np.empty_like(x)
    acc = np.zeros(x.shape[1])
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y


def varispeed(x, rate):
    """Play x with a time-varying speed (rate per output sample); returns len(rate) samples."""
    pos = np.cumsum(rate)
    pos = np.clip(pos / max(pos[-1], 1e-9) * (len(x) - 1), 0, len(x) - 1)
    i = pos.astype(int)
    f = (pos - i)[:, None]
    j = np.minimum(i + 1, len(x) - 1)
    return x[i] * (1 - f) + x[j] * f


def mono(sig):
    return np.repeat(sig[:, None], 2, axis=1)


def env(n, decay):
    return np.exp(-np.arange(n) / sr * decay)


at = secs(edit['atSong'])
total = secs(edit['length'])
silence_seg, spin_seg, vocal_seg = edit['segments']
n_sil = secs((silence_seg['beats'][1] - silence_seg['beats'][0]) * period)
n0 = secs(vocal_seg['beats'][0] * period)                          # click + silence + tape start
n1 = total - n0
insert = np.zeros((total, 2))

# single sounds, at the beats listed in timeline.json edits[0].events (sample offsets inside the insert)
ev = {}
for e in edit['events']:
    ev.setdefault(e['what'], []).append(secs(e['beat'] * period))

# ---- 3.4 (user 2026-10-12/13): the Master clicks, the song stops ON the click, 0.5 s of total silence, then the tape
# runs backwards into the reversed singing (beats 4-12 are the v5 reversed lines the user approved by ear)

# ---- the click: the last sound before the silence ------------------------------------------------------------
n_cl = secs(0.008)                                                                              # mouse click: down, up
cl = rng.standard_normal(n_cl)
cl = (cl - np.convolve(cl, np.ones(8) / 8, 'same')) * env(n_cl, 900)
cl += 0.5 * np.sin(2 * np.pi * 2500 * np.arange(n_cl) / sr) * env(n_cl, 500)
click = np.zeros(n_sil)
for p in ev['click']:
    click[p: p + n_cl] += 0.45 * cl
    click[p + secs(0.07): p + secs(0.07) + n_cl] += 0.3 * cl
insert[:n_sil] += mono(click)                                   # everything else in the first 0.5 s is digital silence

# ---- the tape starts running backwards: the last seconds before the cut, reversed, from standstill to fast --------
m = n0 - n_sil
a0, b0 = (secs(x) for x in spin_seg['source'])
k1 = int(m * 0.72)
rate = np.concatenate([np.linspace(0, 1, k1) ** 2 * 4.0, np.linspace(4.0, 1.0, m - k1)])
spin = varispeed(song[a0:b0][::-1], rate)
spin = lowpass(spin, 0.35) * np.linspace(0.0, 1.0, m)[:, None] ** 0.5                        # muffled, rising out of the silence
sq_len = secs(0.15)
chorus_back = song[secs(59.22): at][::-1]
spin_part = np.zeros((m, 2)) + 0.45 * spin
# ---- the time-travel lines reversed, normal speed, clearly heard; slight interference ------------------------
a, b = (secs(x) for x in vocal_seg['source'])
vocal = varispeed(song[a:b][::-1], np.ones(n1))                                                # 1x
tt = np.arange(n1) / sr
vocal *= (0.94 + 0.06 * np.sin(2 * np.pi * 3.0 * tt))[:, None]                                 # a faint tape wobble
vocal = lowpass(np.tanh(vocal * 1.3) / np.tanh(1.3), 0.55)                                     # light distortion
start_len = secs(0.4)                                                                          # tape start at the end
vocal[-start_len:] = varispeed(vocal[-start_len:], np.linspace(0.3, 1.0, start_len))
texture = lowpass(mono(rng.standard_normal(n1)), 0.03) * np.linspace(1, 0.3, n1)[:, None]      # faint rewind texture
insert[n0:] += 0.75 * vocal + 0.15 * texture
insert[n_sil:n0] += spin_part
for k, p in enumerate(ev['squeal']):                                                            # two quiet squeaks
    chunk = chorus_back[k * secs(1.3): k * secs(1.3) + 6 * sq_len]
    s = lowpass(np.tanh(varispeed(chunk, np.ones(sq_len)) * 2) / np.tanh(2), 0.25)
    insert[p: p + sq_len] += 0.1 * s * np.hanning(sq_len)[:, None]

# ---- levels and joins ---------------------------------------------------------------------------------------
insert = np.tanh(insert * 1.1) / np.tanh(1.1) * 0.62


def rms_db(x):
    return 20 * np.log10(np.sqrt((x.mean(axis=1) ** 2).mean()) + 1e-12)


# the reversed singing as loud as the chorus just before the edit (user: after v4 "similar to the rest", after v5 "a bit
# louder"); a soft knee above 0.95 keeps its peaks under full scale
target = rms_db(song[at - secs(4): at])
gain = 10 ** ((target - rms_db(insert[n0:])) / 20)
insert[n_sil:] *= gain
insert[n_sil:n0] *= 0.6                                                     # the spin-up sits under the singing
rev = insert[n_sil:]
over = np.abs(rev) > 0.95
rev[over] = np.sign(rev[over]) * (0.95 + 0.05 * np.tanh((np.abs(rev[over]) - 0.95) / 0.05))
f = secs(0.02)
before, after = song[:at].copy(), song[at:].copy()
before[-secs(0.005):] *= np.linspace(1, 0, secs(0.005))[:, None]   # the song stops on the click
after[:f] *= np.linspace(0, 1, f)[:, None]
insert[-f:] *= np.linspace(1, 0, f)[:, None]
edited = np.concatenate([before, insert, after])

outdir = root / 'input'
outdir.mkdir(parents=True, exist_ok=True)
sf.write(str(outdir / 'edited_song.wav'), edited, sr, subtype='FLOAT')     # the MP3 itself goes over 1.0; keep it unclipped
sf.write(str(outdir / 'preview_rewind.wav'), edited[secs(64.0): secs(90.0)], sr, subtype='FLOAT')
print(f'edited song {len(edited) / sr:.3f} s (timeline says {tl["film"]["duration"]:.3f}); '
      f'insert {total / sr:.3f} s at {edit["atSong"]} s; preview film 1:04-1:30 written')
