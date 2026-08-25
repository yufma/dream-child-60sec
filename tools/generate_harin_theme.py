#!/usr/bin/env python3
"""Generate an original Harin stage 1-6 moonlight-fair theme as 16-bit PCM WAV."""

from __future__ import annotations

import argparse
import math
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32_000
BPM = 120
SECONDS_PER_BEAT = 60.0 / BPM
BAR_BEATS = 4
TOTAL_BARS = 32
TOTAL_BEATS = TOTAL_BARS * BAR_BEATS
TOTAL_SECONDS = TOTAL_BEATS * SECONDS_PER_BEAT
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

NOTE_NAMES = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
}
SHARP_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def note_to_midi(note: str) -> int:
    pitch = note[:-1]
    octave = int(note[-1])
    return (octave + 1) * 12 + NOTE_NAMES[pitch]


def midi_to_note(midi: int) -> str:
    return f"{SHARP_NAMES[midi % 12]}{midi // 12 - 1}"


def transpose(note: str, semitones: int) -> str:
    return midi_to_note(note_to_midi(note) + semitones)


def note_frequency(note: str) -> float:
    return 440.0 * (2.0 ** ((note_to_midi(note) - 69) / 12.0))


def adsr(length: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    duration = length / SAMPLE_RATE
    attack = min(attack, duration * 0.25)
    decay = min(decay, duration * 0.25)
    release = min(release, duration * 0.35)
    env = np.full(length, sustain, dtype=np.float32)
    attack_n = max(1, int(attack * SAMPLE_RATE))
    decay_n = max(1, int(decay * SAMPLE_RATE))
    release_n = max(1, int(release * SAMPLE_RATE))
    env[:attack_n] = np.linspace(0.0, 1.0, attack_n, endpoint=False, dtype=np.float32)
    decay_end = min(length, attack_n + decay_n)
    env[attack_n:decay_end] = np.linspace(1.0, sustain, decay_end - attack_n, endpoint=False, dtype=np.float32)
    if release_n < length:
        env[-release_n:] *= np.linspace(1.0, 0.0, release_n, dtype=np.float32)
    return env


def soft_square(phase: np.ndarray) -> np.ndarray:
    result = np.zeros_like(phase, dtype=np.float32)
    for harmonic in (1, 3, 5, 7, 9):
        result += np.sin(phase * harmonic).astype(np.float32) / harmonic
    return result * (4.0 / math.pi) * 0.72


def synth_note(note: str, duration: float, instrument: str) -> np.ndarray:
    length = max(2, int(duration * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    frequency = note_frequency(note)
    phase = 2.0 * math.pi * frequency * t

    if instrument == "music_box":
        body = (
            np.sin(phase)
            + 0.42 * np.sin(phase * 2.01)
            + 0.19 * np.sin(phase * 3.0)
            + 0.08 * np.sin(phase * 4.03)
        )
        env = (1.0 - np.exp(-t / 0.004)) * np.exp(-4.1 * t / max(0.18, duration))
        return (body * env * 0.58).astype(np.float32)

    if instrument == "pluck":
        body = 0.65 * soft_square(phase) + 0.35 * np.sin(phase)
        env = (1.0 - np.exp(-t / 0.003)) * np.exp(-3.4 * t / max(0.12, duration))
        return (body * env * 0.48).astype(np.float32)

    if instrument == "lead":
        vibrato = 0.0022 * np.sin(2.0 * math.pi * 5.1 * t)
        modulated_phase = phase + 2.0 * math.pi * frequency * vibrato
        body = 0.72 * soft_square(modulated_phase) + 0.28 * np.sin(modulated_phase)
        return (body * adsr(length, 0.012, 0.07, 0.68, 0.08) * 0.38).astype(np.float32)

    if instrument == "shadow_lead":
        detuned = soft_square(phase * 0.997) + soft_square(phase * 1.003)
        body = 0.45 * detuned + 0.18 * np.sin(phase * 0.5)
        return (body * adsr(length, 0.02, 0.09, 0.62, 0.1) * 0.34).astype(np.float32)

    if instrument == "bass":
        body = 0.82 * np.sin(phase) + 0.18 * soft_square(phase)
        return (body * adsr(length, 0.01, 0.06, 0.78, 0.07) * 0.44).astype(np.float32)

    if instrument == "pad":
        body = (
            np.sin(phase * 0.998)
            + np.sin(phase * 1.002)
            + 0.28 * np.sin(phase * 2.0)
        ) / 2.28
        return (body * adsr(length, 0.16, 0.2, 0.72, 0.3) * 0.32).astype(np.float32)

    raise ValueError(f"Unknown instrument: {instrument}")


def add_note(
    track: np.ndarray,
    beat: float,
    duration_beats: float,
    note: str,
    velocity: float,
    instrument: str,
    pan: float = 0.0,
) -> None:
    start = int(beat * SECONDS_PER_BEAT * SAMPLE_RATE)
    duration = duration_beats * SECONDS_PER_BEAT
    sample = synth_note(note, duration, instrument) * velocity
    end = min(TOTAL_SAMPLES, start + sample.size)
    if end <= start:
        return
    sample = sample[: end - start]
    pan = max(-1.0, min(1.0, pan))
    angle = (pan + 1.0) * math.pi / 4.0
    track[start:end, 0] += sample * math.cos(angle)
    track[start:end, 1] += sample * math.sin(angle)


def add_kick(track: np.ndarray, beat: float, velocity: float, rng: np.random.Generator) -> None:
    del rng
    duration = 0.24
    length = int(duration * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    start_frequency = 118.0
    end_frequency = 43.0
    phase = 2.0 * math.pi * (start_frequency * t + (end_frequency - start_frequency) * t * t / (2.0 * duration))
    click = np.exp(-90.0 * t) * np.sin(2.0 * math.pi * 1700.0 * t)
    sample = (np.sin(phase) * np.exp(-17.0 * t) + 0.09 * click) * velocity * 0.78
    place_mono(track, beat, sample.astype(np.float32), -0.05)


def add_snare(track: np.ndarray, beat: float, velocity: float, rng: np.random.Generator) -> None:
    duration = 0.19
    length = int(duration * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = rng.normal(0.0, 1.0, length).astype(np.float32)
    high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1])) * 0.72
    body = np.sin(2.0 * math.pi * 186.0 * t)
    sample = (0.72 * high * np.exp(-24.0 * t) + 0.28 * body * np.exp(-18.0 * t)) * velocity * 0.28
    place_mono(track, beat, sample.astype(np.float32), 0.08)


def add_hat(track: np.ndarray, beat: float, velocity: float, rng: np.random.Generator, pan: float) -> None:
    duration = 0.065
    length = int(duration * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = rng.normal(0.0, 1.0, length).astype(np.float32)
    high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1]))
    sample = high * np.exp(-58.0 * t) * velocity * 0.11
    place_mono(track, beat, sample.astype(np.float32), pan)


def place_mono(track: np.ndarray, beat: float, sample: np.ndarray, pan: float) -> None:
    start = int(beat * SECONDS_PER_BEAT * SAMPLE_RATE)
    end = min(TOTAL_SAMPLES, start + sample.size)
    if end <= start:
        return
    sample = sample[: end - start]
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    track[start:end, 0] += sample * math.cos(angle)
    track[start:end, 1] += sample * math.sin(angle)


CHORDS = {
    "Dm": (("D4", "F4", "A4"), "D2"),
    "Bb": (("A#3", "D4", "F4"), "A#1"),
    "F": (("F4", "A4", "C5"), "F2"),
    "C": (("C4", "E4", "G4"), "C2"),
    "Gm": (("G3", "A#3", "D4"), "G2"),
    "A": (("A3", "C#4", "E4"), "A2"),
    "Eb": (("D#4", "G4", "A#4"), "D#2"),
}

CHORD_SEQUENCE = (
    "Dm", "Bb", "F", "C",
    "Dm", "Bb", "F", "C",
    "Dm", "Bb", "F", "C",
    "Dm", "Gm", "Bb", "A",
    "Dm", "Bb", "Gm", "A",
    "Dm", "Eb", "Bb", "A",
    "F", "C", "Dm", "Bb",
    "Gm", "C", "F", "Dm",
)

MAIN_MOTIF = (
    (0.0, 0.5, "D5"), (0.5, 0.5, "F5"), (1.0, 1.0, "A5"),
    (2.0, 0.5, "G5"), (2.5, 0.5, "E5"), (3.0, 1.0, "F5"),
    (4.0, 0.5, "C5"), (4.5, 0.5, "D5"), (5.0, 1.0, "F5"),
    (6.0, 0.5, "E5"), (6.5, 0.5, "D5"), (7.0, 1.0, "A4"),
)

MOTIF_VARIATION = (
    (0.0, 0.5, "D5"), (0.5, 0.5, "F5"), (1.0, 0.5, "A5"), (1.5, 0.5, "C6"),
    (2.0, 0.5, "A#5"), (2.5, 0.5, "A5"), (3.0, 1.0, "G5"),
    (4.0, 0.5, "F5"), (4.5, 0.5, "G5"), (5.0, 1.0, "A5"),
    (6.0, 0.5, "E5"), (6.5, 0.5, "F5"), (7.0, 1.0, "D5"),
)

BOSS_MOTIF = (
    (0.0, 0.5, "D5"), (0.5, 0.5, "C#5"), (1.0, 0.5, "D5"), (1.5, 0.5, "A4"),
    (2.0, 1.0, "A#4"), (3.0, 1.0, "A4"),
    (4.0, 0.5, "F5"), (4.5, 0.5, "D#5"), (5.0, 1.0, "D5"),
    (6.0, 0.5, "C#5"), (6.5, 0.5, "A4"), (7.0, 1.0, "D5"),
)

RECOVERY_MOTIF = (
    (0.0, 0.5, "F5"), (0.5, 0.5, "A5"), (1.0, 1.0, "C6"),
    (2.0, 0.5, "A#5"), (2.5, 0.5, "G5"), (3.0, 1.0, "A5"),
    (4.0, 0.5, "E5"), (4.5, 0.5, "F5"), (5.0, 1.0, "A5"),
    (6.0, 0.5, "G5"), (6.5, 0.5, "F5"), (7.0, 1.0, "C6"),
)


def add_motif(track: np.ndarray, start_bar: int, motif, instrument: str, velocity: float, octave_shift: int = 0) -> None:
    base_beat = start_bar * BAR_BEATS
    for index, (offset, duration, note) in enumerate(motif):
        add_note(
            track,
            base_beat + offset,
            duration * 0.92,
            transpose(note, octave_shift),
            velocity,
            instrument,
            pan=-0.3 + 0.6 * ((index % 4) / 3.0),
        )


def build_theme() -> np.ndarray:
    rng = np.random.default_rng(6001)
    pad = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
    bass = np.zeros_like(pad)
    arpeggio = np.zeros_like(pad)
    melody = np.zeros_like(pad)
    drums = np.zeros_like(pad)

    for bar, chord_name in enumerate(CHORD_SEQUENCE):
        chord_notes, root = CHORDS[chord_name]
        bar_beat = bar * BAR_BEATS
        pad_velocity = 0.62 if bar < 4 else 0.78 if bar < 16 else 0.7 if bar < 24 else 0.86
        for voice_index, note in enumerate(chord_notes):
            add_note(pad, bar_beat, 3.96, note, pad_velocity, "pad", pan=(voice_index - 1) * 0.45)

        bass_velocity = 0.48 if bar < 4 else 0.72 if bar < 16 else 0.82 if bar < 24 else 0.7
        add_note(bass, bar_beat, 1.92, root, bass_velocity, "bass", pan=-0.05)
        add_note(bass, bar_beat + 2.0, 1.9, root, bass_velocity * 0.92, "bass", pan=0.05)

        if bar < 4:
            pattern = (0, 1, 2, 1)
            for step, chord_index in enumerate(pattern):
                add_note(arpeggio, bar_beat + step, 0.82, transpose(chord_notes[chord_index], 12), 0.46, "music_box", pan=-0.55 + step * 0.36)
        elif bar < 12:
            pattern = (0, 1, 2, 1, 0, 1, 2, 1)
            for step, chord_index in enumerate(pattern):
                add_note(arpeggio, bar_beat + step * 0.5, 0.43, transpose(chord_notes[chord_index], 12), 0.54, "pluck", pan=-0.55 + (step % 4) * 0.36)
        elif bar < 16:
            pattern = (0, 1, 2) * 4
            for step, chord_index in enumerate(pattern):
                add_note(arpeggio, bar_beat + step / 3.0, 0.27, transpose(chord_notes[chord_index], 12), 0.5, "music_box", pan=-0.6 + (step % 6) * 0.24)
        elif bar < 24:
            pattern = (0, 2, 1, 2, 0, 2, 1, 2)
            for step, chord_index in enumerate(pattern):
                add_note(arpeggio, bar_beat + step * 0.5, 0.42, chord_notes[chord_index], 0.43, "pluck", pan=-0.35 + (step % 2) * 0.7)
        else:
            pattern = (0, 1, 2, 1, 2, 1, 0, 1)
            for step, chord_index in enumerate(pattern):
                instrument = "music_box" if step % 2 == 0 else "pluck"
                add_note(arpeggio, bar_beat + step * 0.5, 0.44, transpose(chord_notes[chord_index], 12), 0.58, instrument, pan=-0.65 + (step % 4) * 0.42)

    add_motif(melody, 0, MAIN_MOTIF, "music_box", 0.82)
    add_motif(melody, 2, MOTIF_VARIATION, "music_box", 0.76)
    add_motif(melody, 4, MAIN_MOTIF, "lead", 0.8)
    add_motif(melody, 6, MOTIF_VARIATION, "lead", 0.8)
    add_motif(melody, 8, MOTIF_VARIATION, "lead", 0.86)
    add_motif(melody, 10, MAIN_MOTIF, "lead", 0.82)

    carousel_notes = ("D5", "F5", "A5", "C6", "A5", "F5", "G5", "A5", "A#5", "A5", "G5", "E5")
    for bar in range(12, 16):
        for step, note in enumerate(carousel_notes):
            add_note(melody, bar * BAR_BEATS + step / 3.0, 0.26, note, 0.66 + 0.04 * (bar - 12), "music_box", pan=-0.7 + (step % 6) * 0.28)

    add_motif(melody, 16, BOSS_MOTIF, "shadow_lead", 0.84)
    add_motif(melody, 18, BOSS_MOTIF, "shadow_lead", 0.78, octave_shift=-12)
    add_motif(melody, 20, BOSS_MOTIF, "shadow_lead", 0.88)
    add_motif(melody, 22, MAIN_MOTIF, "shadow_lead", 0.7, octave_shift=-12)

    add_motif(melody, 24, RECOVERY_MOTIF, "music_box", 0.94)
    add_motif(melody, 26, RECOVERY_MOTIF, "lead", 0.84)
    add_motif(melody, 28, MOTIF_VARIATION, "lead", 0.88)
    add_motif(melody, 30, MAIN_MOTIF, "music_box", 0.9)
    add_note(melody, 126.5, 1.2, "D6", 0.86, "music_box", pan=0.0)

    for bar in range(4, 31):
        base = bar * BAR_BEATS
        if bar < 16:
            kick_beats = (0.0, 2.0)
        elif bar < 24:
            kick_beats = (0.0, 1.5, 2.5)
        else:
            kick_beats = (0.0, 2.0)
        for offset in kick_beats:
            add_kick(drums, base + offset, 0.76 if bar < 16 else 0.88 if bar < 24 else 0.72, rng)
        for offset in (1.0, 3.0):
            add_snare(drums, base + offset, 0.66 if bar < 16 else 0.82 if bar < 24 else 0.62, rng)
        for step in range(8):
            add_hat(drums, base + step * 0.5, 0.42 if step % 2 == 0 else 0.3, rng, pan=-0.35 if step % 2 == 0 else 0.35)

    mix = pad * 0.72 + bass * 0.86 + arpeggio * 0.72 + melody * 0.94 + drums * 0.88

    # A quiet, filtered wind bed keeps the amusement park suspended inside a dream.
    noise = rng.normal(0.0, 1.0, TOTAL_SAMPLES).astype(np.float32)
    window = 360
    cumulative = np.cumsum(np.concatenate((np.zeros(1, dtype=np.float64), noise.astype(np.float64))))
    smooth = (cumulative[window:] - cumulative[:-window]) / window
    smooth = np.pad(smooth.astype(np.float32), (window // 2, TOTAL_SAMPLES - smooth.size - window // 2), mode="edge")
    smooth /= max(1e-6, float(np.max(np.abs(smooth))))
    mix[:, 0] += smooth * 0.018
    mix[:, 1] += np.roll(smooth, int(0.071 * SAMPLE_RATE)) * 0.018

    dry = mix.copy()
    for delay_seconds, gain in ((0.17, 0.105), (0.31, 0.075), (0.47, 0.045)):
        delay = int(delay_seconds * SAMPLE_RATE)
        mix[delay:, 0] += dry[:-delay, 1] * gain
        mix[delay:, 1] += dry[:-delay, 0] * gain

    mix -= np.mean(mix, axis=0, keepdims=True)
    mix = np.tanh(mix * 1.28)
    fade_in = int(0.08 * SAMPLE_RATE)
    fade_out = int(0.55 * SAMPLE_RATE)
    mix[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)[:, None]
    mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]
    peak = float(np.max(np.abs(mix)))
    if peak > 0:
        mix *= 0.93 / peak
    return mix.astype(np.float32)


def write_wav(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("assets/audio/harin-moonlight-fair-theme-v1.wav"),
    )
    args = parser.parse_args()
    audio = build_theme()
    write_wav(args.output, audio)
    rms = float(np.sqrt(np.mean(audio * audio)))
    peak = float(np.max(np.abs(audio)))
    print(f"wrote={args.output}")
    print(f"duration_seconds={audio.shape[0] / SAMPLE_RATE:.3f}")
    print(f"sample_rate={SAMPLE_RATE}")
    print(f"channels={audio.shape[1]}")
    print(f"peak={peak:.4f}")
    print(f"rms={rms:.4f}")


if __name__ == "__main__":
    main()
