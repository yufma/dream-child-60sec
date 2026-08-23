import fs from 'node:fs';
import path from 'node:path';

const sampleRate = 44100;
const bpm = 128;
const beat = 60 / bpm;
const bars = 48;
const seconds = bars * beat * 4;
const twoPi = Math.PI * 2;

function midiToHz(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function addVoice(buffer, start, duration, midi, volume, voice = 'lead', pan = 0, seed = 1) {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(buffer.length / 2, Math.ceil((start + duration) * sampleRate));
  const frequency = midiToHz(midi);
  const left = Math.sqrt((1 - pan) * .5);
  const right = Math.sqrt((1 + pan) * .5);
  let noiseState = seed >>> 0;
  for (let frame = first; frame < last; frame += 1) {
    const time = (frame - first) / sampleRate;
    const attack = Math.min(1, time / (voice === 'pad' ? .10 : .008));
    const releaseWindow = voice === 'pad' ? .32 : voice === 'kick' ? .04 : .075;
    const release = Math.max(0, Math.min(1, (duration - time) / releaseWindow));
    const phase = twoPi * frequency * time;
    noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
    const noise = (noiseState / 0xffffffff) * 2 - 1;
    let waveform;
    if (voice === 'pad') {
      waveform = Math.sin(phase) * .52 + Math.sin(phase * .5) * .22 + Math.sin(phase * 1.997) * .14;
    } else if (voice === 'bass') {
      waveform = Math.sin(phase) * .62 + Math.sin(phase * 2) * .23 + Math.sin(phase * .5) * .12;
    } else if (voice === 'kick') {
      waveform = Math.sin(twoPi * frequency * (1 - Math.min(.8, time * 3.8)) * time) * Math.exp(-time * 16);
    } else if (voice === 'snare') {
      waveform = (noise * .78 + Math.sin(phase * 1.8) * .12) * Math.exp(-time * 18);
    } else if (voice === 'stab') {
      waveform = Math.sin(phase) * .44 + Math.sin(phase * 2) * .28 + Math.sin(phase * 3) * .16;
    } else {
      waveform = Math.sin(phase) * .58 + Math.sin(phase * 2.01) * .18 + Math.sin(phase * 4.02) * .09;
    }
    const decay = voice === 'pad' ? Math.exp(-time / Math.max(.2, duration * .78)) : Math.exp(-time / Math.max(.08, duration * .55));
    const sample = waveform * attack * release * decay * volume;
    buffer[frame * 2] += sample * left;
    buffer[frame * 2 + 1] += sample * right;
  }
}

function addAtmosphere(buffer) {
  let state = 5222;
  let filtered = 0;
  for (let frame = 0; frame < buffer.length / 2; frame += 1) {
    state = (state * 1103515245 + 12345) >>> 0;
    const white = (state / 0xffffffff) * 2 - 1;
    filtered = filtered * .995 + white * .005;
    const time = frame / sampleRate;
    const surge = .42 + Math.sin(twoPi * .055 * time) * .16 + Math.sin(twoPi * .12 * time) * .05;
    buffer[frame * 2] += filtered * .012 * surge;
    buffer[frame * 2 + 1] += filtered * .015 * surge;
  }
}

function writeWav(file, buffer) {
  const output = Buffer.alloc(44 + buffer.length * 2);
  output.write('RIFF', 0); output.writeUInt32LE(output.length - 8, 4); output.write('WAVEfmt ', 8);
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(2, 22);
  output.writeUInt32LE(sampleRate, 24); output.writeUInt32LE(sampleRate * 4, 28);
  output.writeUInt16LE(4, 32); output.writeUInt16LE(16, 34); output.write('data', 36);
  output.writeUInt32LE(buffer.length * 2, 40);
  for (let index = 0; index < buffer.length; index += 1) {
    const limited = Math.tanh(buffer[index] * .92);
    output.writeInt16LE(Math.round(limited * 32767), 44 + index * 2);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, output);
}

function compose() {
  const buffer = new Float32Array(Math.floor(sampleRate * seconds) * 2);
  const progression = [0, 5, 3, 7];
  const scale = [0, 3, 7, 10, 12, 15, 19];
  const daughterMotif = [12, 15, 19, 22, 19, 15, 12, 10];
  addAtmosphere(buffer);
  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const start = barIndex * beat * 4;
    const phrase = Math.floor(barIndex / 16);
    const root = 43 + progression[barIndex % progression.length];
    const intensity = phrase === 0 ? .72 : phrase === 1 ? 1 : 1.08;
    [root, root + 7, root + 12].forEach((note, index) => addVoice(buffer, start, beat * 3.85, note, (.058 - index * .009) * intensity, 'pad', (index - 1) * .25, barIndex * 31 + index));
    for (let eighth = 0; eighth < 8; eighth += 1) {
      const point = start + eighth * beat * .5;
      addVoice(buffer, point, beat * .30, root - 12 + (eighth % 2 ? 7 : 0), .041 * intensity, 'bass', eighth % 2 ? .12 : -.12, barIndex * 71 + eighth);
      if (phrase > 0 || eighth % 2 === 0) addVoice(buffer, point, .18, root + (eighth % 3 ? 7 : 12), .022 * intensity, 'stab', eighth % 2 ? .36 : -.36, barIndex * 97 + eighth);
    }
    for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
      const point = start + beatIndex * beat;
      addVoice(buffer, point, .21, root - 24, .096 * intensity, 'kick', beatIndex % 2 ? .18 : -.18, barIndex * 101 + beatIndex);
      if (beatIndex === 1 || beatIndex === 3) addVoice(buffer, point, .16, root + 2, .043 * intensity, 'snare', 0, barIndex * 113 + beatIndex);
      if (phrase > 0 && beatIndex !== 3) addVoice(buffer, point + beat * .72, .09, root - 5, .024 * intensity, 'snare', beatIndex % 2 ? .25 : -.25, barIndex * 127 + beatIndex);
    }
    const motif = phrase === 2 ? daughterMotif : [0, 2, 4, 6, 4, 2, 5, 3].map((step) => scale[step]);
    motif.forEach((interval, noteIndex) => {
      const offset = start + noteIndex * beat * .5 + (barIndex % 2 ? beat * .06 : 0);
      const note = root + interval + (noteIndex > 5 ? 12 : 0);
      const volume = (phrase === 2 ? .059 : .052) * intensity;
      addVoice(buffer, offset, beat * .40, note, volume, 'lead', noteIndex % 2 ? .34 : -.34, barIndex * 173 + noteIndex);
    });
    if (phrase >= 1 && barIndex % 2 === 1) {
      addVoice(buffer, start + beat * 2.5, beat * .32, root + 1, .043 * intensity, 'stab', -.2, barIndex * 191);
      addVoice(buffer, start + beat * 3.08, beat * .26, root + 6, .038 * intensity, 'lead', .2, barIndex * 197);
    }
  }
  return buffer;
}

const output = 'assets/audio/scientist-true-imagination-final-v1.wav';
writeWav(output, compose());
console.log(`Wrote ${output} (${seconds.toFixed(1)} seconds)`);
