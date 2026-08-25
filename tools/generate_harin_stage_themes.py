#!/usr/bin/env python3
"""Generate six original, standalone Harin stage themes as stereo 16-bit WAV files."""

from __future__ import annotations

import argparse
import math
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_theme import SAMPLE_RATE, synth_note, transpose


CHORDS = {
    "Dm": (("D4", "F4", "A4"), "D2"),
    "Dm9": (("D4", "F4", "A4", "E5"), "D2"),
    "Bb": (("A#3", "D4", "F4"), "A#1"),
    "BbM7": (("A#3", "D4", "F4", "A4"), "A#1"),
    "F": (("F4", "A4", "C5"), "F2"),
    "Fadd9": (("F4", "A4", "C5", "G5"), "F2"),
    "C": (("C4", "E4", "G4"), "C2"),
    "Cadd9": (("C4", "E4", "G4", "D5"), "C2"),
    "Csus2": (("C4", "D4", "G4"), "C2"),
    "Gm": (("G3", "A#3", "D4"), "G2"),
    "Gm7": (("G3", "A#3", "D4", "F4"), "G2"),
    "A": (("A3", "C#4", "E4"), "A2"),
    "Asus4": (("A3", "D4", "E4"), "A2"),
    "Eb": (("D#4", "G4", "A#4"), "D#2"),
}


class Song:
    def __init__(self, title: str, bpm: float, bars: int, beats_per_bar: int, seed: int):
        self.title = title
        self.bpm = bpm
        self.bars = bars
        self.beats_per_bar = beats_per_bar
        self.seconds_per_beat = 60.0 / bpm
        self.total_beats = bars * beats_per_bar
        self.total_samples = int(self.total_beats * self.seconds_per_beat * SAMPLE_RATE)
        self.rng = np.random.default_rng(seed)
        self.buses = {
            name: np.zeros((self.total_samples, 2), dtype=np.float32)
            for name in ("pad", "bass", "arp", "lead", "drums", "fx")
        }

    def beat_for_bar(self, bar: int) -> float:
        return bar * self.beats_per_bar

    def add_note(
        self,
        bus: str,
        beat: float,
        duration_beats: float,
        note: str,
        velocity: float,
        instrument: str,
        pan: float = 0.0,
    ) -> None:
        start = int(beat * self.seconds_per_beat * SAMPLE_RATE)
        duration = max(0.02, duration_beats * self.seconds_per_beat)
        sample = synth_note(note, duration, instrument) * velocity
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        pan = max(-1.0, min(1.0, pan))
        angle = (pan + 1.0) * math.pi / 4.0
        self.buses[bus][start:end, 0] += sample * math.cos(angle)
        self.buses[bus][start:end, 1] += sample * math.sin(angle)

    def add_chord(self, bar: int, chord_name: str, velocity: float, duration_beats: float | None = None) -> None:
        chord, _ = CHORDS[chord_name]
        duration = duration_beats if duration_beats is not None else self.beats_per_bar * 0.98
        pans = np.linspace(-0.62, 0.62, len(chord))
        for note, pan in zip(chord, pans):
            self.add_note("pad", self.beat_for_bar(bar), duration, note, velocity, "pad", float(pan))

    def add_bass_hits(self, bar: int, chord_name: str, hits, velocity: float) -> None:
        _, root = CHORDS[chord_name]
        base = self.beat_for_bar(bar)
        for index, (offset, duration) in enumerate(hits):
            self.add_note("bass", base + offset, duration, root, velocity * (0.95 if index else 1.0), "bass", -0.08 + 0.16 * (index % 2))

    def place_sample(self, bus: str, beat: float, sample: np.ndarray, pan: float = 0.0) -> None:
        start = int(beat * self.seconds_per_beat * SAMPLE_RATE)
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        self.buses[bus][start:end, 0] += sample * math.cos(angle)
        self.buses[bus][start:end, 1] += sample * math.sin(angle)

    def kick(self, beat: float, velocity: float = 1.0) -> None:
        duration = 0.24
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        start_frequency, end_frequency = 118.0, 43.0
        phase = 2.0 * math.pi * (
            start_frequency * t + (end_frequency - start_frequency) * t * t / (2.0 * duration)
        )
        click = np.exp(-90.0 * t) * np.sin(2.0 * math.pi * 1600.0 * t)
        sample = (np.sin(phase) * np.exp(-17.0 * t) + 0.08 * click) * velocity * 0.74
        self.place_sample("drums", beat, sample.astype(np.float32), -0.04)

    def snare(self, beat: float, velocity: float = 1.0, pan: float = 0.08) -> None:
        duration = 0.19
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        noise = self.rng.normal(0.0, 1.0, length).astype(np.float32)
        high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1])) * 0.72
        body = np.sin(2.0 * math.pi * 184.0 * t)
        sample = (0.72 * high * np.exp(-24.0 * t) + 0.28 * body * np.exp(-18.0 * t)) * velocity * 0.27
        self.place_sample("drums", beat, sample.astype(np.float32), pan)

    def hat(self, beat: float, velocity: float = 1.0, pan: float = 0.0, open_hat: bool = False) -> None:
        duration = 0.13 if open_hat else 0.062
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        noise = self.rng.normal(0.0, 1.0, length).astype(np.float32)
        high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1]))
        decay = 30.0 if open_hat else 60.0
        sample = high * np.exp(-decay * t) * velocity * 0.105
        self.place_sample("drums", beat, sample.astype(np.float32), pan)

    def tom(self, beat: float, velocity: float = 1.0, pan: float = 0.0) -> None:
        duration = 0.25
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        phase = 2.0 * math.pi * (154.0 * t - 35.0 * t * t)
        sample = np.sin(phase) * np.exp(-14.0 * t) * velocity * 0.38
        self.place_sample("drums", beat, sample.astype(np.float32), pan)

    def rewind_fx(self, beat: float, velocity: float = 1.0, pan: float = 0.0) -> None:
        duration = 0.48
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        noise = self.rng.normal(0.0, 1.0, length).astype(np.float32)
        high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1])) * 0.78
        sweep_phase = 2.0 * math.pi * (330.0 * t + 980.0 * t * t / (2.0 * duration))
        curve = np.clip(
            np.sin(np.linspace(0.0, math.pi, length, dtype=np.float32)),
            0.0,
            None,
        )
        envelope = curve ** 1.4
        sample = (0.12 * high + 0.22 * np.sin(sweep_phase)) * envelope * velocity
        self.place_sample("fx", beat, sample.astype(np.float32), pan)

    def whoosh(self, beat: float, velocity: float = 1.0, pan: float = 0.0) -> None:
        duration = 0.42
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        noise = self.rng.normal(0.0, 1.0, length).astype(np.float32)
        high = noise - np.concatenate((np.zeros(1, dtype=np.float32), noise[:-1])) * 0.58
        curve = np.clip(
            np.sin(np.linspace(0.0, math.pi, length, dtype=np.float32)),
            0.0,
            None,
        )
        envelope = curve ** 1.8
        sample = high * envelope * velocity * 0.09
        self.place_sample("fx", beat, sample.astype(np.float32), pan)

    def finalize(
        self,
        gains: dict[str, float],
        ambience_gain: float = 0.015,
        delays=((0.17, 0.09), (0.31, 0.06)),
        fade_out_seconds: float = 0.4,
    ) -> np.ndarray:
        mix = np.zeros_like(self.buses["pad"])
        for bus_name, bus in self.buses.items():
            mix += bus * gains.get(bus_name, 1.0)

        if ambience_gain > 0:
            noise = self.rng.normal(0.0, 1.0, self.total_samples).astype(np.float32)
            window = 360
            cumulative = np.cumsum(
                np.concatenate((np.zeros(1, dtype=np.float64), noise.astype(np.float64)))
            )
            smooth = (cumulative[window:] - cumulative[:-window]) / window
            left_pad = window // 2
            right_pad = self.total_samples - smooth.size - left_pad
            smooth = np.pad(smooth.astype(np.float32), (left_pad, right_pad), mode="edge")
            smooth /= max(1e-6, float(np.max(np.abs(smooth))))
            mix[:, 0] += smooth * ambience_gain
            mix[:, 1] += np.roll(smooth, int(0.067 * SAMPLE_RATE)) * ambience_gain

        dry = mix.copy()
        for delay_seconds, gain in delays:
            delay = int(delay_seconds * SAMPLE_RATE)
            mix[delay:, 0] += dry[:-delay, 1] * gain
            mix[delay:, 1] += dry[:-delay, 0] * gain

        mix -= np.mean(mix, axis=0, keepdims=True)
        mix = np.tanh(mix * 1.24)
        fade_in = int(0.06 * SAMPLE_RATE)
        fade_out = int(fade_out_seconds * SAMPLE_RATE)
        mix[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)[:, None]
        mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]
        peak = float(np.max(np.abs(mix)))
        if peak > 0:
            mix *= 0.92 / peak
        return mix.astype(np.float32)


def add_phrase(
    song: Song,
    start_beat: float,
    events,
    instrument: str,
    velocity: float,
    shift: int = 0,
    reverse_pan: bool = False,
) -> None:
    event_count = max(1, len(events) - 1)
    for index, (offset, duration, note) in enumerate(events):
        pan_position = -0.58 + 1.16 * index / event_count
        if reverse_pan:
            pan_position *= -1.0
        song.add_note(
            "lead",
            start_beat + offset,
            duration,
            transpose(note, shift),
            velocity,
            instrument,
            pan_position,
        )


def fill_eighth_hats(song: Song, bar: int, velocity: float, open_last: bool = False) -> None:
    base = song.beat_for_bar(bar)
    for step in range(song.beats_per_bar * 2):
        song.hat(
            base + step * 0.5,
            velocity * (1.0 if step % 2 == 0 else 0.72),
            -0.32 if step % 2 == 0 else 0.32,
            open_hat=open_last and step == song.beats_per_bar * 2 - 1,
        )


def stage_01() -> tuple[Song, np.ndarray, str]:
    song = Song("01 · 첫 접속", bpm=112, bars=16, beats_per_bar=4, seed=6101)
    progression = ("Dm9", "BbM7", "Fadd9", "Csus2") * 2 + ("Gm7", "BbM7", "Fadd9", "Cadd9", "Dm9", "BbM7", "Asus4", "Dm9")
    motif = (
        (0.0, 0.5, "D5"), (0.5, 0.5, "F5"), (1.0, 1.0, "A5"),
        (2.0, 0.5, "G5"), (2.5, 0.5, "E5"), (3.0, 1.0, "F5"),
        (4.0, 0.5, "C5"), (4.5, 0.5, "D5"), (5.0, 1.0, "F5"),
        (6.0, 0.5, "E5"), (6.5, 0.5, "D5"), (7.0, 1.0, "A4"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.52 if bar < 8 else 0.66)
        song.add_bass_hits(bar, chord, ((0.0, 1.85), (2.0, 1.75)), 0.38 if bar < 8 else 0.52)
        notes, _ = CHORDS[chord]
        pattern = (0, 1, 2, 1)
        for step, note_index in enumerate(pattern):
            song.add_note("arp", song.beat_for_bar(bar) + step, 0.8, transpose(notes[note_index], 12), 0.5, "music_box", -0.48 + step * 0.32)
        if bar >= 8:
            song.kick(song.beat_for_bar(bar), 0.45)
            song.snare(song.beat_for_bar(bar) + 2.0, 0.32)
            for step in range(4):
                song.hat(song.beat_for_bar(bar) + step, 0.24, -0.25 + step * 0.16)
    for bar in (0, 4, 8, 12):
        add_phrase(song, song.beat_for_bar(bar), motif, "music_box" if bar < 8 else "lead", 0.72 if bar < 8 else 0.68)
    audio = song.finalize(
        {"pad": 0.78, "bass": 0.7, "arp": 0.82, "lead": 0.9, "drums": 0.56, "fx": 0.7},
        ambience_gain=0.017,
        delays=((0.2, 0.11), (0.38, 0.07)),
    )
    return song, audio, "stage-01-first-link-v2.wav"


def stage_02() -> tuple[Song, np.ndarray, str]:
    song = Song("02 · 상상력의 첫걸음", bpm=126, bars=16, beats_per_bar=4, seed=6202)
    progression = (
        "Dm9", "Cadd9", "BbM7", "Asus4",
        "Dm9", "Cadd9", "Gm7", "A",
        "Fadd9", "Cadd9", "Dm9", "BbM7",
        "Gm7", "Cadd9", "Asus4", "Dm9",
    )
    forward = (
        (0.0, 0.35, "D5"), (0.75, 0.22, "A5"), (1.0, 0.45, "F5"),
        (1.75, 0.22, "C6"), (2.0, 0.72, "D6"), (3.0, 0.38, "A5"), (3.5, 0.45, "G5"),
    )
    reply = (
        (0.0, 0.4, "G5"), (0.5, 0.32, "A5"), (1.25, 0.42, "D6"),
        (2.0, 0.25, "C6"), (2.5, 0.42, "F5"), (3.25, 0.22, "A5"), (3.5, 0.48, "D5"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.66)
        song.add_bass_hits(bar, chord, ((0.0, 0.52), (0.75, 0.42), (2.0, 0.52), (2.75, 0.42)), 0.64)
        notes, _ = CHORDS[chord]
        pulse_offsets = (0.0, 1.25, 2.5, 3.25)
        for step, offset in enumerate(pulse_offsets):
            note = transpose(notes[(step + bar) % min(3, len(notes))], 12)
            song.add_note("arp", song.beat_for_bar(bar) + offset, 0.28, note, 0.48, "pluck", -0.5 if step % 2 == 0 else 0.5)
        song.kick(song.beat_for_bar(bar), 0.62)
        song.kick(song.beat_for_bar(bar) + 2.5, 0.46)
        song.snare(song.beat_for_bar(bar) + 1.5, 0.5, -0.08)
        song.snare(song.beat_for_bar(bar) + 3.5, 0.38, 0.16)
        fill_eighth_hats(song, bar, 0.3, open_last=bar % 4 == 3)
    for pair_index, bar in enumerate(range(0, 16, 2)):
        shift = 12 if pair_index == 6 else 0
        add_phrase(song, song.beat_for_bar(bar), forward, "lead", 0.72, shift=shift)
        add_phrase(song, song.beat_for_bar(bar + 1), reply, "music_box", 0.68, shift=shift, reverse_pan=True)
        song.rewind_fx(song.beat_for_bar(bar + 2) - 0.42, 0.38, pan=0.5 if pair_index % 2 else -0.5)
    audio = song.finalize(
        {"pad": 0.68, "bass": 0.78, "arp": 0.82, "lead": 0.9, "drums": 0.76, "fx": 0.7},
        ambience_gain=0.012,
        delays=((0.12, 0.08), (0.245, 0.055)),
    )
    return song, audio, "stage-02-imagination-step-v2.wav"


def stage_03() -> tuple[Song, np.ndarray, str]:
    song = Song("03 · 달빛 유원지의 벽", bpm=132, bars=16, beats_per_bar=4, seed=6303)
    progression = ("Dm", "Gm", "Bb", "A") * 4
    leap = (
        (0.0, 0.42, "D5"), (0.75, 0.22, "A5"), (1.5, 0.42, "G5"),
        (2.25, 0.22, "C6"), (3.0, 0.42, "A#5"), (3.5, 0.42, "A5"),
        (4.0, 0.42, "F5"), (4.75, 0.22, "C6"), (5.5, 0.42, "D6"),
        (6.25, 0.22, "A5"), (7.0, 0.88, "G5"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.58 if bar < 8 else 0.68)
        song.add_bass_hits(bar, chord, ((0.0, 0.64), (1.5, 0.64), (3.0, 0.42)), 0.78)
        notes, _ = CHORDS[chord]
        for step, offset in enumerate((0.5, 2.0, 3.5)):
            song.add_note("arp", song.beat_for_bar(bar) + offset, 0.3, transpose(notes[(step + 1) % len(notes)], 12), 0.42, "pluck", -0.45 + step * 0.45)
        for offset in (0.0, 1.5, 3.0):
            song.kick(song.beat_for_bar(bar) + offset, 0.72 if offset == 0 else 0.58)
        song.snare(song.beat_for_bar(bar) + 2.0, 0.66)
        fill_eighth_hats(song, bar, 0.34, open_last=bar % 4 == 3)
        if bar % 4 == 3:
            song.tom(song.beat_for_bar(bar) + 3.5, 0.5, 0.38)
    for phrase_index, bar in enumerate((0, 2, 4, 6, 8, 10, 12, 14)):
        add_phrase(song, song.beat_for_bar(bar), leap, "lead", 0.72 + 0.025 * (phrase_index % 4), shift=12 if phrase_index == 7 else 0)
        if bar in (4, 8, 12):
            song.whoosh(song.beat_for_bar(bar) - 0.25, 0.72, pan=-0.5 if bar == 8 else 0.5)
    audio = song.finalize(
        {"pad": 0.62, "bass": 0.9, "arp": 0.72, "lead": 0.92, "drums": 0.88, "fx": 0.8},
        ambience_gain=0.014,
        delays=((0.095, 0.065), (0.21, 0.045)),
    )
    return song, audio, "stage-03-moonlight-wall-v2.wav"


def stage_04() -> tuple[Song, np.ndarray, str]:
    song = Song("04 · 무너지는 회전목마", bpm=116, bars=20, beats_per_bar=3, seed=6404)
    progression = (
        "Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A",
        "Dm", "A", "Bb", "F", "Gm", "Dm", "Asus4", "A",
        "Bb", "C", "A", "Dm",
    )
    circle = (
        (0.0, 0.45, "D5"), (0.5, 0.45, "F5"), (1.0, 0.45, "A5"),
        (1.5, 0.45, "F5"), (2.0, 0.45, "E5"), (2.5, 0.45, "D5"),
        (3.0, 0.45, "F5"), (3.5, 0.45, "A5"), (4.0, 0.45, "C6"),
        (4.5, 0.45, "A5"), (5.0, 0.45, "G5"), (5.5, 0.45, "E5"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.64)
        song.add_bass_hits(bar, chord, ((0.0, 0.82),), 0.64)
        notes, _ = CHORDS[chord]
        for step in range(6):
            if 8 <= bar <= 11 and step in (2, 5):
                continue
            note = transpose(notes[(step + bar) % len(notes)], 12)
            song.add_note("arp", song.beat_for_bar(bar) + step * 0.5, 0.4, note, 0.52, "music_box", -0.62 + (step % 3) * 0.62)
        song.kick(song.beat_for_bar(bar), 0.58)
        song.hat(song.beat_for_bar(bar) + 1.0, 0.3, -0.3)
        song.hat(song.beat_for_bar(bar) + 2.0, 0.3, 0.3, open_hat=bar % 4 == 3)
        if bar % 4 == 3:
            song.snare(song.beat_for_bar(bar) + 2.0, 0.34)
    for bar in (0, 4, 8, 12, 16):
        add_phrase(song, song.beat_for_bar(bar), circle, "music_box", 0.78 if bar != 8 else 0.62, shift=12 if bar == 16 else 0)
    for bar in (8, 10):
        song.whoosh(song.beat_for_bar(bar) + 1.75, 0.5, pan=-0.55 if bar == 8 else 0.55)
    audio = song.finalize(
        {"pad": 0.7, "bass": 0.75, "arp": 0.88, "lead": 0.92, "drums": 0.64, "fx": 0.68},
        ambience_gain=0.013,
        delays=((0.19, 0.12), (0.41, 0.07)),
    )
    return song, audio, "stage-04-carousel-collapse-v2.wav"


def stage_05() -> tuple[Song, np.ndarray, str]:
    song = Song("05 · 하린이 가장 두려워한 것", bpm=128, bars=20, beats_per_bar=4, seed=6505)
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Gm", "Dm", "Eb", "A",
        "F", "C", "Bb", "A",
    )
    fractured = (
        (0.0, 0.45, "D5"), (0.5, 0.45, "C#5"), (1.0, 0.45, "D5"),
        (1.75, 0.22, "A4"), (2.5, 0.7, "A#4"), (3.5, 0.4, "A4"),
        (4.0, 0.45, "F5"), (4.5, 0.45, "D#5"), (5.25, 0.72, "D5"),
        (6.5, 0.22, "C#5"), (7.0, 0.9, "D5"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.68 if bar < 16 else 0.58)
        song.add_bass_hits(bar, chord, ((0.0, 0.62), (1.5, 0.42), (2.5, 0.62), (3.5, 0.35)), 0.86)
        notes, _ = CHORDS[chord]
        for step, offset in enumerate((0.0, 0.75, 2.0, 2.75)):
            song.add_note("arp", song.beat_for_bar(bar) + offset, 0.32, notes[(step + bar) % len(notes)], 0.5, "pluck", -0.42 if step % 2 == 0 else 0.42)
        song.kick(song.beat_for_bar(bar), 0.88)
        song.kick(song.beat_for_bar(bar) + 1.5, 0.56)
        song.kick(song.beat_for_bar(bar) + 2.5, 0.7)
        song.snare(song.beat_for_bar(bar) + 1.0, 0.7)
        song.snare(song.beat_for_bar(bar) + 3.0, 0.78)
        fill_eighth_hats(song, bar, 0.38, open_last=bar % 4 == 3)
        if bar % 4 == 3:
            song.tom(song.beat_for_bar(bar) + 3.5, 0.68, 0.45)
    for phrase_index, bar in enumerate((0, 4, 8, 12, 16)):
        instrument = "music_box" if bar == 16 else "shadow_lead"
        velocity = 0.66 if bar == 16 else 0.82
        add_phrase(song, song.beat_for_bar(bar), fractured, instrument, velocity, shift=12 if bar == 16 else 0)
    for bar in (4, 8, 12, 16):
        song.rewind_fx(song.beat_for_bar(bar) - 0.35, 0.46, pan=-0.5 if bar % 8 else 0.5)
    audio = song.finalize(
        {"pad": 0.7, "bass": 0.94, "arp": 0.72, "lead": 0.96, "drums": 0.96, "fx": 0.82},
        ambience_gain=0.019,
        delays=((0.11, 0.06), (0.25, 0.045)),
        fade_out_seconds=0.3,
    )
    return song, audio, "stage-05-harin-fear-boss-v2.wav"


def stage_06() -> tuple[Song, np.ndarray, str]:
    song = Song("06 · 하린의 웃음이 남긴 빛", bpm=118, bars=16, beats_per_bar=4, seed=6606)
    progression = (
        "BbM7", "Fadd9", "Cadd9", "Dm9", "Gm7", "BbM7", "Cadd9", "Fadd9",
        "BbM7", "Dm9", "Gm7", "Cadd9", "Fadd9", "BbM7", "Cadd9", "Fadd9",
    )
    light = (
        (0.0, 0.38, "A5"), (0.75, 0.24, "C6"), (1.25, 0.4, "D6"),
        (2.0, 0.68, "C6"), (3.0, 0.42, "G5"), (3.5, 0.38, "A5"),
        (4.0, 0.42, "F5"), (4.75, 0.24, "A5"), (5.5, 0.44, "C6"),
        (6.25, 0.24, "E6"), (7.0, 0.78, "D6"),
    )
    for bar, chord in enumerate(progression):
        song.add_chord(bar, chord, 0.72)
        song.add_bass_hits(bar, chord, ((0.0, 1.8), (2.0, 1.7)), 0.54)
        notes, _ = CHORDS[chord]
        pattern = (0, 1, 2, 1, 2, 1, 0, 1)
        for step, note_index in enumerate(pattern):
            instrument = "music_box" if step % 2 == 0 else "pluck"
            song.add_note("arp", song.beat_for_bar(bar) + step * 0.5, 0.42, transpose(notes[note_index % len(notes)], 12), 0.54, instrument, -0.66 + (step % 4) * 0.44)
        if bar >= 4:
            song.kick(song.beat_for_bar(bar), 0.5)
            song.kick(song.beat_for_bar(bar) + 2.0, 0.38)
            song.snare(song.beat_for_bar(bar) + 1.0, 0.34)
            song.snare(song.beat_for_bar(bar) + 3.0, 0.32)
            fill_eighth_hats(song, bar, 0.22, open_last=bar % 4 == 3)
        if bar % 2 == 0:
            high_note = transpose(notes[bar % len(notes)], 24)
            song.add_note("fx", song.beat_for_bar(bar) + 3.5, 0.4, high_note, 0.42, "music_box", -0.72 if bar % 4 == 0 else 0.72)
    for bar in (0, 4, 8, 12):
        add_phrase(
            song,
            song.beat_for_bar(bar),
            light,
            "music_box" if bar in (0, 12) else "lead",
            0.78 if bar == 0 else 0.72,
            shift=7 if bar == 12 else 0,
        )
    audio = song.finalize(
        {"pad": 0.78, "bass": 0.68, "arp": 0.82, "lead": 0.9, "drums": 0.58, "fx": 0.9},
        ambience_gain=0.016,
        delays=((0.22, 0.12), (0.43, 0.075)),
        fade_out_seconds=0.6,
    )
    return song, audio, "stage-06-lantern-river-v2.wav"


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
        default=Path("assets/audio/harin-stage-themes-v2"),
    )
    args = parser.parse_args()

    builders = (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06)
    for builder in builders:
        song, audio, filename = builder()
        output_path = args.output_dir / filename
        write_wav(output_path, audio)
        rms = float(np.sqrt(np.mean(audio * audio)))
        peak = float(np.max(np.abs(audio)))
        duration = audio.shape[0] / SAMPLE_RATE
        print(
            f"{filename}\t{song.title}\t{duration:.3f}s\t{song.bpm:.0f}BPM\t"
            f"peak={peak:.4f}\trms={rms:.4f}"
        )


if __name__ == "__main__":
    main()
