#!/usr/bin/env python3
"""Generate clean v3 Harin themes: seamless puzzle loops and an exact 60s boss cue."""

from __future__ import annotations

import argparse
import math
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32_000
NOTE_INDEX = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
    "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
}
NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def note_to_midi(note: str) -> int:
    return (int(note[-1]) + 1) * 12 + NOTE_INDEX[note[:-1]]


def midi_to_note(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def transpose(note: str, semitones: int) -> str:
    return midi_to_note(note_to_midi(note) + semitones)


def frequency(note: str) -> float:
    return 440.0 * 2.0 ** ((note_to_midi(note) - 69) / 12.0)


def smooth_envelope(length: int, attack_seconds: float, release_seconds: float) -> np.ndarray:
    attack = max(1, min(length // 3, int(attack_seconds * SAMPLE_RATE)))
    release = max(1, min(length // 2, int(release_seconds * SAMPLE_RATE)))
    envelope = np.ones(length, dtype=np.float32)
    envelope[:attack] = np.linspace(0.0, 1.0, attack, endpoint=False, dtype=np.float32)
    envelope[-release:] *= np.linspace(1.0, 0.0, release, dtype=np.float32)
    return envelope


def triangle_wave(phase: np.ndarray, base_frequency: float) -> np.ndarray:
    result = np.zeros_like(phase, dtype=np.float32)
    for harmonic in (1, 3, 5, 7, 9, 11):
        if base_frequency * harmonic >= SAMPLE_RATE * 0.45:
            break
        sign = -1.0 if ((harmonic - 1) // 2) % 2 else 1.0
        result += sign * np.sin(phase * harmonic).astype(np.float32) / (harmonic * harmonic)
    return result * (8.0 / (math.pi * math.pi))


def synth(note: str, duration_seconds: float, instrument: str) -> np.ndarray:
    length = max(2, int(duration_seconds * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    freq = frequency(note)
    phase = 2.0 * math.pi * freq * t
    sine = np.sin(phase).astype(np.float32)
    triangle = triangle_wave(phase, freq)

    if instrument == "bell":
        body = sine + 0.16 * np.sin(phase * 2.0) + 0.05 * np.sin(phase * 3.0)
        envelope = (1.0 - np.exp(-t / 0.004)) * np.exp(-2.8 * t / max(0.16, duration_seconds))
        envelope *= smooth_envelope(length, 0.003, min(0.08, duration_seconds * 0.25))
        return (body * envelope * 0.48).astype(np.float32)

    if instrument == "pluck":
        body = 0.58 * sine + 0.42 * triangle
        envelope = (1.0 - np.exp(-t / 0.005)) * np.exp(-2.35 * t / max(0.15, duration_seconds))
        envelope *= smooth_envelope(length, 0.004, min(0.07, duration_seconds * 0.22))
        return (body * envelope * 0.43).astype(np.float32)

    if instrument == "lead":
        body = 0.66 * triangle + 0.34 * sine
        envelope = smooth_envelope(length, 0.015, min(0.1, duration_seconds * 0.3))
        return (body * envelope * 0.36).astype(np.float32)

    if instrument == "pad":
        body = sine + 0.12 * np.sin(phase * 2.0)
        envelope = smooth_envelope(length, min(0.14, duration_seconds * 0.18), min(0.24, duration_seconds * 0.28))
        return (body * envelope * 0.27).astype(np.float32)

    if instrument == "bass":
        body = 0.84 * sine + 0.16 * triangle
        envelope = smooth_envelope(length, 0.01, min(0.09, duration_seconds * 0.25))
        return (body * envelope * 0.4).astype(np.float32)

    raise ValueError(f"Unknown instrument: {instrument}")


CHORDS = {
    "Dm": (("D4", "F4", "A4"), "D2"),
    "Dm9": (("D4", "F4", "A4", "E5"), "D2"),
    "Bb": (("A#3", "D4", "F4"), "A#1"),
    "BbM7": (("A#3", "D4", "F4", "A4"), "A#1"),
    "F": (("F4", "A4", "C5"), "F2"),
    "Fadd9": (("F4", "A4", "C5", "G5"), "F2"),
    "C": (("C4", "E4", "G4"), "C2"),
    "Cadd9": (("C4", "E4", "G4", "D5"), "C2"),
    "Gm": (("G3", "A#3", "D4"), "G2"),
    "Gm7": (("G3", "A#3", "D4", "F4"), "G2"),
    "A": (("A3", "C#4", "E4"), "A2"),
    "Eb": (("D#4", "G4", "A#4"), "D#2"),
}


class CleanSong:
    def __init__(self, title: str, bpm: float, bars: int, beats_per_bar: int):
        self.title = title
        self.bpm = bpm
        self.bars = bars
        self.beats_per_bar = beats_per_bar
        self.seconds_per_beat = 60.0 / bpm
        self.total_beats = bars * beats_per_bar
        self.total_samples = int(round(self.total_beats * self.seconds_per_beat * SAMPLE_RATE))
        self.buses = {
            name: np.zeros((self.total_samples, 2), dtype=np.float32)
            for name in ("pad", "bass", "harmony", "melody", "percussion")
        }

    def bar_beat(self, bar: int) -> float:
        return bar * self.beats_per_bar

    def note(
        self,
        bus: str,
        beat: float,
        duration_beats: float,
        pitch: str,
        velocity: float,
        instrument: str,
        pan: float = 0.0,
    ) -> None:
        start = int(round(beat * self.seconds_per_beat * SAMPLE_RATE))
        sample = synth(pitch, max(0.02, duration_beats * self.seconds_per_beat), instrument) * velocity
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        pan = max(-1.0, min(1.0, pan))
        angle = (pan + 1.0) * math.pi / 4.0
        self.buses[bus][start:end, 0] += sample * math.cos(angle)
        self.buses[bus][start:end, 1] += sample * math.sin(angle)

    def chord(self, bar: int, chord_name: str, velocity: float) -> None:
        pitches, _ = CHORDS[chord_name]
        pans = np.linspace(-0.42, 0.42, len(pitches))
        for pitch, pan in zip(pitches, pans):
            self.note(
                "pad",
                self.bar_beat(bar),
                self.beats_per_bar * 0.92,
                pitch,
                velocity,
                "pad",
                float(pan),
            )

    def bass(self, bar: int, chord_name: str, hits, velocity: float) -> None:
        _, root = CHORDS[chord_name]
        for index, (offset, duration) in enumerate(hits):
            self.note(
                "bass",
                self.bar_beat(bar) + offset,
                duration,
                root,
                velocity * (1.0 if index == 0 else 0.92),
                "bass",
                -0.05 if index % 2 == 0 else 0.05,
            )

    def place_percussion(self, beat: float, sample: np.ndarray, pan: float = 0.0) -> None:
        start = int(round(beat * self.seconds_per_beat * SAMPLE_RATE))
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        self.buses["percussion"][start:end, 0] += sample * math.cos(angle)
        self.buses["percussion"][start:end, 1] += sample * math.sin(angle)

    def kick(self, beat: float, velocity: float) -> None:
        duration = 0.22
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        phase = 2.0 * math.pi * (104.0 * t - 31.0 * t * t / duration)
        sample = np.sin(phase) * np.exp(-18.0 * t) * velocity * 0.58
        self.place_percussion(beat, sample.astype(np.float32), -0.02)

    def tom(self, beat: float, velocity: float, pan: float = 0.0) -> None:
        duration = 0.2
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        phase = 2.0 * math.pi * (176.0 * t - 42.0 * t * t / duration)
        sample = np.sin(phase) * np.exp(-17.0 * t) * velocity * 0.33
        self.place_percussion(beat, sample.astype(np.float32), pan)

    def tick(self, beat: float, velocity: float, pan: float = 0.0, pitch: float = 1080.0) -> None:
        duration = 0.045
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        sample = np.sin(2.0 * math.pi * pitch * t) * np.exp(-72.0 * t) * velocity * 0.11
        self.place_percussion(beat, sample.astype(np.float32), pan)

    def render(self, gains: dict[str, float], loop: bool) -> np.ndarray:
        mix = np.zeros_like(self.buses["pad"])
        for bus_name, bus in self.buses.items():
            mix += bus * gains.get(bus_name, 1.0)
        mix -= np.mean(mix, axis=0, keepdims=True)
        mix = np.tanh(mix * 1.08)
        edge = max(16, int(0.004 * SAMPLE_RATE))
        mix[:edge] *= np.linspace(0.0, 1.0, edge, dtype=np.float32)[:, None]
        if loop:
            mix[-edge:] *= np.linspace(1.0, 0.0, edge, dtype=np.float32)[:, None]
        else:
            fade_out = int(0.38 * SAMPLE_RATE)
            mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]
        peak = float(np.max(np.abs(mix)))
        if peak > 0:
            mix *= 0.88 / peak
        return mix.astype(np.float32)


def phrase(song: CleanSong, start_beat: float, events, instrument: str, velocity: float, shift: int = 0) -> None:
    divisor = max(1, len(events) - 1)
    for index, (offset, duration, pitch) in enumerate(events):
        pan = -0.28 + 0.56 * index / divisor
        song.note("melody", start_beat + offset, duration, transpose(pitch, shift), velocity, instrument, pan)


def stage_01() -> tuple[CleanSong, np.ndarray, str, bool]:
    song = CleanSong("01 · 첫 접속", bpm=120, bars=16, beats_per_bar=4)
    progression = (
        "Dm9", "BbM7", "Fadd9", "Cadd9",
        "Dm9", "BbM7", "Fadd9", "Cadd9",
        "Gm7", "BbM7", "Fadd9", "Cadd9",
        "Dm9", "BbM7", "Gm7", "A",
    )
    melody = (
        (0.0, 0.5, "D5"), (0.5, 0.5, "F5"), (1.0, 0.9, "A5"),
        (2.0, 0.5, "G5"), (2.5, 0.5, "E5"), (3.0, 0.85, "F5"),
        (4.0, 0.5, "C5"), (4.5, 0.5, "D5"), (5.0, 0.85, "F5"),
        (6.0, 0.5, "E5"), (6.5, 0.5, "D5"), (7.0, 0.75, "A4"),
    )
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.46)
        song.bass(bar, chord_name, ((0.0, 1.65), (2.0, 1.55)), 0.46)
        chord, _ = CHORDS[chord_name]
        for step, note_index in enumerate((0, 1, 2, 1)):
            song.note("harmony", song.bar_beat(bar) + step, 0.65, transpose(chord[note_index], 12), 0.35, "bell", -0.26 + step * 0.17)
    for bar in (0, 4, 8, 12):
        phrase(song, song.bar_beat(bar), melody, "bell", 0.72)
    audio = song.render({"pad": 0.82, "bass": 0.72, "harmony": 0.7, "melody": 0.94, "percussion": 0.0}, loop=True)
    return song, audio, "stage-01-first-link-loop-v3.wav", True


def stage_02() -> tuple[CleanSong, np.ndarray, str, bool]:
    song = CleanSong("02 · 상상력의 첫걸음", bpm=120, bars=16, beats_per_bar=4)
    progression = (
        "Dm9", "Cadd9", "BbM7", "A",
        "Dm9", "Cadd9", "Gm7", "A",
        "Fadd9", "Cadd9", "Dm9", "BbM7",
        "Gm7", "Cadd9", "BbM7", "A",
    )
    call = (
        (0.0, 0.38, "D5"), (0.75, 0.25, "A5"), (1.25, 0.45, "F5"),
        (2.0, 0.4, "C6"), (2.75, 0.72, "D6"), (3.55, 0.35, "A5"),
    )
    answer = (
        (0.0, 0.38, "G5"), (0.65, 0.3, "A5"), (1.35, 0.48, "D6"),
        (2.1, 0.32, "C6"), (2.75, 0.4, "F5"), (3.45, 0.4, "D5"),
    )
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.5)
        song.bass(bar, chord_name, ((0.0, 0.58), (1.5, 0.5), (3.0, 0.5)), 0.58)
        chord, _ = CHORDS[chord_name]
        for step, offset in enumerate((0.5, 2.0)):
            song.note("harmony", song.bar_beat(bar) + offset, 0.38, transpose(chord[(bar + step) % min(3, len(chord))], 12), 0.38, "pluck", -0.22 if step == 0 else 0.22)
        song.tick(song.bar_beat(bar), 0.28, -0.2)
        song.tick(song.bar_beat(bar) + 2.0, 0.24, 0.2, pitch=920.0)
    for bar in range(0, 16, 2):
        phrase(song, song.bar_beat(bar), call, "lead", 0.67)
        phrase(song, song.bar_beat(bar + 1), answer, "bell", 0.62)
    audio = song.render({"pad": 0.74, "bass": 0.8, "harmony": 0.76, "melody": 0.92, "percussion": 0.38}, loop=True)
    return song, audio, "stage-02-imagination-step-loop-v3.wav", True


def stage_03() -> tuple[CleanSong, np.ndarray, str, bool]:
    song = CleanSong("03 · 달빛 유원지의 벽", bpm=128, bars=16, beats_per_bar=4)
    progression = ("Dm", "Gm", "Bb", "A") * 4
    leap = (
        (0.0, 0.42, "D5"), (0.75, 0.24, "A5"), (1.5, 0.42, "G5"),
        (2.25, 0.24, "C6"), (3.0, 0.42, "A#5"), (3.5, 0.42, "A5"),
        (4.0, 0.42, "F5"), (4.75, 0.24, "C6"), (5.5, 0.42, "D6"),
        (6.25, 0.24, "A5"), (7.0, 0.82, "G5"),
    )
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.47)
        song.bass(bar, chord_name, ((0.0, 0.6), (1.5, 0.6), (3.0, 0.4)), 0.7)
        chord, _ = CHORDS[chord_name]
        song.note("harmony", song.bar_beat(bar) + 2.0, 0.38, transpose(chord[1], 12), 0.3, "pluck", 0.18)
        for offset, velocity, pan in ((0.0, 0.58, -0.08), (1.5, 0.44, 0.08), (3.0, 0.38, 0.0)):
            song.kick(song.bar_beat(bar) + offset, velocity)
        song.tom(song.bar_beat(bar) + 2.0, 0.42, 0.2)
    for bar in (0, 2, 4, 6, 8, 10, 12, 14):
        phrase(song, song.bar_beat(bar), leap, "lead", 0.68)
    audio = song.render({"pad": 0.68, "bass": 0.9, "harmony": 0.62, "melody": 0.94, "percussion": 0.72}, loop=True)
    return song, audio, "stage-03-moonlight-wall-loop-v3.wav", True


def stage_04() -> tuple[CleanSong, np.ndarray, str, bool]:
    song = CleanSong("04 · 무너지는 회전목마", bpm=120, bars=20, beats_per_bar=3)
    progression = (
        "Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A",
        "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A",
        "Dm", "Bb", "Gm", "A",
    )
    circle = (
        (0.0, 0.42, "D5"), (0.5, 0.42, "F5"), (1.0, 0.42, "A5"),
        (1.5, 0.42, "F5"), (2.0, 0.42, "E5"), (2.5, 0.42, "D5"),
        (3.0, 0.42, "F5"), (3.5, 0.42, "A5"), (4.0, 0.42, "C6"),
        (4.5, 0.42, "A5"), (5.0, 0.42, "G5"), (5.5, 0.42, "E5"),
    )
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.5)
        song.bass(bar, chord_name, ((0.0, 0.78),), 0.58)
        chord, _ = CHORDS[chord_name]
        for step in range(6):
            note_index = step % min(3, len(chord))
            song.note("harmony", song.bar_beat(bar) + step * 0.5, 0.38, transpose(chord[note_index], 12), 0.4, "bell", -0.3 + (step % 3) * 0.3)
        song.kick(song.bar_beat(bar), 0.4)
        song.tick(song.bar_beat(bar) + 1.0, 0.2, -0.18, 880.0)
        song.tick(song.bar_beat(bar) + 2.0, 0.2, 0.18, 980.0)
    for bar in (0, 4, 8, 12, 16):
        phrase(song, song.bar_beat(bar), circle, "bell", 0.7)
    audio = song.render({"pad": 0.72, "bass": 0.75, "harmony": 0.78, "melody": 0.9, "percussion": 0.48}, loop=True)
    return song, audio, "stage-04-carousel-loop-v3.wav", True


def stage_05() -> tuple[CleanSong, np.ndarray, str, bool]:
    # 32 bars * 4 beats * 60 / 128 BPM = exactly 60 seconds.
    song = CleanSong("05 · 하린이 가장 두려워한 것", bpm=128, bars=32, beats_per_bar=4)
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    fear = (
        (0.0, 0.45, "D5"), (0.5, 0.45, "C#5"), (1.0, 0.45, "D5"),
        (1.75, 0.24, "A4"), (2.5, 0.65, "A#4"), (3.5, 0.38, "A4"),
        (4.0, 0.45, "F5"), (4.5, 0.45, "D#5"), (5.25, 0.7, "D5"),
        (6.5, 0.24, "C#5"), (7.0, 0.78, "D5"),
    )
    for bar, chord_name in enumerate(progression):
        phase_level = bar // 8
        song.chord(bar, chord_name, 0.48 + phase_level * 0.035)
        song.bass(bar, chord_name, ((0.0, 0.62), (1.5, 0.42), (2.5, 0.58), (3.5, 0.32)), 0.72 + phase_level * 0.04)
        chord, _ = CHORDS[chord_name]
        for step, offset in enumerate((0.0, 1.0, 2.0, 3.0)):
            song.note("harmony", song.bar_beat(bar) + offset, 0.3, chord[(step + bar) % len(chord)], 0.3 + phase_level * 0.03, "pluck", -0.2 if step % 2 == 0 else 0.2)
        song.kick(song.bar_beat(bar), 0.65 + phase_level * 0.05)
        song.kick(song.bar_beat(bar) + 2.5, 0.48 + phase_level * 0.05)
        song.tom(song.bar_beat(bar) + 1.0, 0.34 + phase_level * 0.04, -0.15)
        song.tom(song.bar_beat(bar) + 3.0, 0.38 + phase_level * 0.04, 0.15)
        for offset in (0.5, 1.5, 2.5, 3.5):
            song.tick(song.bar_beat(bar) + offset, 0.16 + phase_level * 0.025, -0.12 if int(offset) % 2 == 0 else 0.12, 760.0 + phase_level * 90.0)
    for phrase_index, bar in enumerate(range(0, 32, 4)):
        instrument = "bell" if bar >= 24 else "lead"
        shift = 12 if phrase_index == 7 else 0
        phrase(song, song.bar_beat(bar), fear, instrument, 0.66 + min(phrase_index, 5) * 0.025, shift)
    audio = song.render({"pad": 0.7, "bass": 0.9, "harmony": 0.65, "melody": 0.94, "percussion": 0.78}, loop=False)
    return song, audio, "stage-05-harin-fear-60s-v3.wav", False


def stage_06() -> tuple[CleanSong, np.ndarray, str, bool]:
    song = CleanSong("06 · 하린의 웃음이 남긴 빛", bpm=120, bars=16, beats_per_bar=4)
    progression = (
        "Fadd9", "Cadd9", "Dm9", "BbM7",
        "Gm7", "Cadd9", "Fadd9", "Cadd9",
        "Fadd9", "Dm9", "BbM7", "Gm7",
        "Fadd9", "BbM7", "Gm7", "Cadd9",
    )
    lantern = (
        (0.0, 0.38, "A5"), (0.75, 0.24, "C6"), (1.25, 0.4, "D6"),
        (2.0, 0.68, "C6"), (3.0, 0.42, "G5"), (3.5, 0.38, "A5"),
        (4.0, 0.42, "F5"), (4.75, 0.24, "A5"), (5.5, 0.44, "C6"),
        (6.25, 0.24, "E6"), (7.0, 0.72, "D6"),
    )
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.48)
        song.bass(bar, chord_name, ((0.0, 3.45),), 0.4)
    for bar in (0, 4, 8, 12):
        phrase(song, song.bar_beat(bar), lantern, "bell", 0.68)
    audio = song.render({"pad": 0.76, "bass": 0.66, "harmony": 0.0, "melody": 0.9, "percussion": 0.0}, loop=True)
    return song, audio, "stage-06-lantern-river-loop-v3.wav", True


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
        "--output-dir",
        type=Path,
        default=Path("assets/audio/harin-stage-themes-v3"),
    )
    args = parser.parse_args()
    builders = (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06)
    for builder in builders:
        song, audio, filename, is_loop = builder()
        output = args.output_dir / filename
        write_wav(output, audio)
        peak = float(np.max(np.abs(audio)))
        rms = float(np.sqrt(np.mean(audio * audio)))
        boundary_jump = float(np.max(np.abs(audio[0] - audio[-1])))
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'ONESHOT'}\tpeak={peak:.4f}\t"
            f"rms={rms:.4f}\tboundary={boundary_jump:.6f}"
        )


if __name__ == "__main__":
    main()
