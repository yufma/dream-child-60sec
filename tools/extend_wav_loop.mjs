import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
const output = process.argv[3];
const repeats = Math.max(2, Number(process.argv[4]) || 3);
const crossfadeSeconds = Math.max(.05, Number(process.argv[5]) || 1.4);

if (!input || !output) {
  throw new Error('Usage: node tools/extend_wav_loop.mjs <input.wav> <output.wav> [repeats] [crossfadeSeconds]');
}

const wav = fs.readFileSync(input);
if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
  throw new Error('Only RIFF/WAVE input is supported.');
}
if (wav.readUInt16LE(20) !== 1 || wav.readUInt16LE(34) !== 16) {
  throw new Error('Only 16-bit PCM WAV input is supported.');
}

const channels = wav.readUInt16LE(22);
const sampleRate = wav.readUInt32LE(24);
const blockAlign = wav.readUInt16LE(32);
const dataLength = wav.readUInt32LE(40);
const dataOffset = 44;
const sourceFrames = dataLength / blockAlign;
const fadeFrames = Math.min(Math.floor(sampleRate * crossfadeSeconds), Math.floor(sourceFrames / 3));
const source = new Int16Array(wav.buffer, wav.byteOffset + dataOffset, dataLength / 2);
const outputFrames = sourceFrames * repeats - fadeFrames * (repeats - 1);
const mixed = new Int16Array(outputFrames * channels);

function sampleAt(frame, channel) {
  return source[frame * channels + channel];
}

// 첫 연주는 그대로 두고, 이후 반복 시작부를 앞 구간의 끝과 부드럽게 겹친다.
for (let frame = 0; frame < sourceFrames; frame += 1) {
  for (let channel = 0; channel < channels; channel += 1) mixed[frame * channels + channel] = sampleAt(frame, channel);
}
let cursor = sourceFrames - fadeFrames;
for (let loop = 1; loop < repeats; loop += 1) {
  for (let frame = 0; frame < fadeFrames; frame += 1) {
    const blend = frame / Math.max(1, fadeFrames - 1);
    for (let channel = 0; channel < channels; channel += 1) {
      const tail = mixed[(cursor + frame) * channels + channel];
      const head = sampleAt(frame, channel);
      mixed[(cursor + frame) * channels + channel] = Math.round(tail * (1 - blend) + head * blend);
    }
  }
  for (let frame = fadeFrames; frame < sourceFrames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) mixed[(cursor + frame) * channels + channel] = sampleAt(frame, channel);
  }
  cursor += sourceFrames - fadeFrames;
}

const header = Buffer.from(wav.subarray(0, 44));
header.writeUInt32LE(36 + mixed.byteLength, 4);
header.writeUInt32LE(mixed.byteLength, 40);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, Buffer.from(mixed.buffer)]));
console.log(`Wrote ${output}: ${(outputFrames / sampleRate).toFixed(1)}s (${repeats} passes, ${crossfadeSeconds}s crossfade).`);
