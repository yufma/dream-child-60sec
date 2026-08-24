import fs from 'node:fs';
import path from 'node:path';

const sampleRate = 44100;
const seconds = 32;
const twoPi = Math.PI * 2;

function midiToHz(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function addTone(buffer, start, duration, midi, volume, voice = 'bell', pan = 0) {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(buffer.length / 2, Math.ceil((start + duration) * sampleRate));
  const frequency = midiToHz(midi);
  const left = Math.sqrt((1 - pan) * .5);
  const right = Math.sqrt((1 + pan) * .5);
  for (let frame = first; frame < last; frame += 1) {
    const time = (frame - first) / sampleRate;
    const attack = Math.min(1, time / (voice === 'pad' ? .14 : .012));
    const release = Math.max(0, Math.min(1, (duration - time) / (voice === 'pad' ? .45 : .055)));
    const decay = voice === 'pad' ? Math.exp(-time / Math.max(.15, duration * .8)) : Math.exp(-time / Math.max(.08, duration * .48));
    const phase = twoPi * frequency * time;
    const waveform = voice === 'pad'
      ? Math.sin(phase) * .65 + Math.sin(phase * .5) * .21 + Math.sin(phase * 2.01) * .12
      : voice === 'pulse'
        ? Math.sin(phase) * .7 + Math.sin(phase * 2) * .2 + Math.sin(phase * 3) * .08
        : voice === 'kick'
          ? Math.sin(twoPi * frequency * (1 - Math.min(.7, time * 3)) * time) * Math.exp(-time * 14)
          : Math.sin(phase) * .68 + Math.sin(phase * 2.02) * .19 + Math.sin(phase * 4.04) * .1;
    const sample = waveform * attack * release * decay * volume;
    buffer[frame * 2] += sample * left;
    buffer[frame * 2 + 1] += sample * right;
  }
}

function addAir(buffer, seed, amount) {
  let state = seed >>> 0;
  let filtered = 0;
  for (let frame = 0; frame < buffer.length / 2; frame += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const white = (state / 0xffffffff) * 2 - 1;
    filtered = filtered * .993 + white * .007;
    const time = frame / sampleRate;
    const motion = .38 + Math.sin(twoPi * .045 * time) * .18 + Math.sin(twoPi * .11 * time) * .08;
    buffer[frame * 2] += filtered * amount * motion * .82;
    buffer[frame * 2 + 1] += filtered * amount * motion;
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
    output.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buffer[index] * .72)) * 32767), 44 + index * 2);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, output);
}

function compose(track) {
  const buffer = new Float32Array(sampleRate * seconds * 2);
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  const bars = Math.ceil(seconds / bar);
  const progression = track.minor ? [0, 5, 3, 7] : [0, 5, 7, 3];
  const scale = track.minor ? [0, 3, 7, 10, 12, 15, 19] : [0, 2, 4, 7, 9, 12, 16];
  addAir(buffer, track.seed, track.air);
  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const start = barIndex * bar;
    const root = track.root + progression[barIndex % progression.length];
    [root, root + 7, root + 12].forEach((note, index) => addTone(buffer, start, bar * .98, note, .052 - index * .009, 'pad', (index - 1) * .25));
    addTone(buffer, start, beat * .5, root - 12, .072, 'pulse', -.1);
    if (track.rhythm) {
      for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
        const point = start + beatIndex * beat;
        addTone(buffer, point, .2, root - 24, .075, 'kick', beatIndex % 2 ? .15 : -.15);
        if (beatIndex !== 1 || track.intense) addTone(buffer, point + beat * .5, .14, root - 5, .034, 'pulse', beatIndex % 2 ? .35 : -.35);
      }
    }
    const motif = track.intense ? [0, 2, 4, 6, 4, 2, 5, 3] : [0, 2, 4, 2, 5, 4, 2, 0];
    motif.forEach((step, noteIndex) => {
      const offset = start + noteIndex * beat * .5 + (barIndex % 2 ? beat * .08 : 0);
      const note = root + 12 + scale[step % scale.length] + (noteIndex > 5 ? 12 : 0);
      addTone(buffer, offset, beat * .42, note, track.melody, 'bell', noteIndex % 2 ? .32 : -.32);
    });
    if (track.crack && barIndex % 2 === 1) {
      addTone(buffer, start + beat * 2.78, beat * .26, root + 1, .045, 'pulse', -.24);
      addTone(buffer, start + beat * 3.18, beat * .22, root + 6, .04, 'bell', .24);
    }
  }
  return buffer;
}

const tracks = [
  { file: 'assets/audio/daughter-perfect-garden-v1.wav', bpm: 78, root: 57, minor: false, air: .014, melody: .075, seed: 1919 },
  { file: 'assets/audio/daughter-fractured-classroom-v1.wav', bpm: 92, root: 48, minor: true, air: .023, melody: .062, crack: true, seed: 2020 },
  { file: 'assets/audio/daughter-mirror-guardian-v1.wav', bpm: 108, root: 46, minor: true, air: .032, melody: .056, rhythm: true, crack: true, intense: true, seed: 2121 },
  { file: 'assets/audio/scientist-dream-lab-final-v1.wav', bpm: 118, root: 43, minor: true, air: .028, melody: .052, rhythm: true, crack: true, intense: true, seed: 2222 },
];

tracks.forEach((track) => {
  writeWav(track.file, compose(track));
  console.log(`Wrote ${track.file}`);
});
