// Ember & Thyme — Hearth Kitchen: sounds, synthesized in the browser.
// One clear job: every sizzle, chop, ding and buzz, made with WebAudio and
// no audio files at all. Silent until the player first interacts.

let ctx = null;
let muted = false;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function unlockAudio() {
  const a = audio();
  if (a && a.state === 'suspended') a.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, gain = 0.08, freq = 1200) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  pick() { tone(520, 0.07, 'triangle', 0.08); },
  chop() { noise(0.09, 0.16, 900); tone(180, 0.08, 'square', 0.06); },
  sizzle() { noise(0.35, 0.05, 3200); },
  ready() { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.14, 'triangle', 0.1, 0.09); },
  serve() { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.08); tone(784, 0.18, 'triangle', 0.12, 0.16); },
  error() { tone(160, 0.22, 'sawtooth', 0.07); },
  lost() { tone(330, 0.15, 'triangle', 0.09); tone(220, 0.25, 'triangle', 0.09, 0.12); },
  tick() { tone(980, 0.05, 'square', 0.04); },
  end() {
    tone(523, 0.15, 'triangle', 0.12);
    tone(659, 0.15, 'triangle', 0.12, 0.12);
    tone(784, 0.15, 'triangle', 0.12, 0.24);
    tone(1046, 0.3, 'triangle', 0.12, 0.36);
  },
};
