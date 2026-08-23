import fs from 'node:fs';
import path from 'node:path';

const sampleRate = 44100;
const seconds = 34;
const twoPi = Math.PI * 2;

function midiToHz(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function addNote(buffer, start, duration, midi, volume, color = 'bell', pan = 0) {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(buffer.length / 2, Math.ceil((start + duration) * sampleRate));
  const frequency = midiToHz(midi);
  const leftGain = Math.sqrt((1 - pan) * .5);
  const rightGain = Math.sqrt((1 + pan) * .5);
  for (let frame = first; frame < last; frame += 1) {
    const time = (frame - first) / sampleRate;
    const attack = Math.min(1, time / (color === 'pad' ? .12 : .014));
    const release = Math.max(0, Math.min(1, (duration - time) / (color === 'pad' ? .42 : .06)));
    const fade = color === 'pad' ? Math.exp(-time / Math.max(.1, duration * .86)) : Math.exp(-time / Math.max(.08, duration * .46));
    const envelope = attack * release * fade * volume;
    const phase = twoPi * frequency * time;
    const sample = color === 'kick'
      ? Math.sin(twoPi * (frequency * (1 - Math.min(.72, time * 2.8))) * time) * Math.exp(-time * 13)
      : color === 'pad'
        ? (Math.sin(phase) * .68 + Math.sin(phase * .5) * .22 + Math.sin(phase * 1.997) * .1)
        : color === 'pulse'
          ? (Math.sin(phase) * .66 + Math.sin(phase * 2) * .22 + Math.sin(phase * 3) * .08)
          : (Math.sin(phase) * .68 + Math.sin(phase * 2.01) * .2 + Math.sin(phase * 3.98) * .12);
    buffer[frame * 2] += sample * envelope * leftGain;
    buffer[frame * 2 + 1] += sample * envelope * rightGain;
  }
}

function addWind(buffer, seed, intensity) {
  let state = seed >>> 0;
  let filtered = 0;
  for (let frame = 0; frame < buffer.length / 2; frame += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const white = (state / 0xffffffff) * 2 - 1;
    filtered = filtered * .992 + white * .008;
    const time = frame / sampleRate;
    const swell = .42 + Math.sin(twoPi * (.028 * time + .11)) * .24 + Math.sin(twoPi * .071 * time) * .11;
    const sample = filtered * intensity * swell;
    buffer[frame * 2] += sample * .82;
    buffer[frame * 2 + 1] += sample;
  }
}

function writeWav(file, buffer) {
  const output = Buffer.alloc(44 + buffer.length * 2);
  output.write('RIFF', 0);
  output.writeUInt32LE(output.length - 8, 4);
  output.write('WAVEfmt ', 8);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(2, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * 4, 28);
  output.writeUInt16LE(4, 32);
  output.writeUInt16LE(16, 34);
  output.write('data', 36);
  output.writeUInt32LE(buffer.length * 2, 40);
  for (let index = 0; index < buffer.length; index += 1) {
    const clipped = Math.max(-1, Math.min(1, buffer[index] * .72));
    output.writeInt16LE(Math.round(clipped * 32767), 44 + index * 2);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, output);
}

function compose(track) {
  const frames = sampleRate * seconds;
  const buffer = new Float32Array(frames * 2);
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  const bars = Math.ceil(seconds / bar);
  const progression = track.minor ? [0, 5, 3, 7] : [0, 5, 7, 3];
  const scale = track.minor ? [0, 3, 7, 10, 12, 15] : [0, 2, 4, 7, 9, 12];
  addWind(buffer, track.seed, track.wind);

  for (let index = 0; index < bars; index += 1) {
    const start = index * bar;
    const root = track.root + progression[index % progression.length];
    [root, root + 7, root + 12].forEach((note, noteIndex) => addNote(buffer, start, bar * .98, note, .055 - noteIndex * .008, 'pad', (noteIndex - 1) * .22));
    addNote(buffer, start, beat * .46, root - 12, .1, 'pulse', -.08);
    addNote(buffer, start + beat * 2, beat * .36, root - 12, .075, 'pulse', .08);

    for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
      const point = start + beatIndex * beat;
      if (track.rhythm) addNote(buffer, point, .18, root - 24, .082, 'kick', beatIndex % 2 ? .14 : -.14);
      if (track.dash && beatIndex !== 2) addNote(buffer, point + beat * .5, .12, root + (beatIndex % 2 ? 7 : 12), .035, 'pulse', beatIndex % 2 ? .38 : -.38);
    }

    const motif = [0, 2, 4, 2, 5, 4, 2, 0];
    motif.forEach((step, noteIndex) => {
      const offset = start + noteIndex * beat * .5 + (index % 2 ? beat * .08 : 0);
      const note = root + 12 + scale[step % scale.length] + (noteIndex > 5 ? 12 : 0);
      addNote(buffer, offset, beat * .42, note, track.melody, 'bell', noteIndex % 2 ? .34 : -.34);
    });
    if (track.boss && index % 2 === 1) {
      addNote(buffer, start + beat * 3, beat * .62, root + 1, .05, 'pulse', -.22);
      addNote(buffer, start + beat * 3.45, beat * .3, root + 13, .042, 'bell', .22);
    }
  }
  return buffer;
}

const tracks = [
  { file: 'assets/audio/haneul-wind-path-v1.wav', bpm: 88, root: 50, minor: false, wind: .03, rhythm: false, dash: true, melody: .085, seed: 1307 },
  { file: 'assets/audio/haneul-headwind-cliff-v1.wav', bpm: 102, root: 42, minor: true, wind: .042, rhythm: true, dash: true, melody: .068, seed: 1515 },
  { file: 'assets/audio/haneul-black-kite-boss-v1.wav', bpm: 116, root: 43, minor: true, wind: .058, rhythm: true, dash: true, melody: .055, boss: true, seed: 1717 },
  { file: 'assets/audio/haneul-clear-sky-v1.wav', bpm: 92, root: 50, minor: false, wind: .022, rhythm: false, dash: false, melody: .092, seed: 1818 },
];

tracks.forEach((track) => {
  writeWav(track.file, compose(track));
  console.log(`Wrote ${track.file}`);
});
