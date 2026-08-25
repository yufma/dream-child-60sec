#!/usr/bin/env python3
"""Generate natural-timbre v4 Harin themes with consonant voicing and clean loops."""

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


def edge_envelope(length: int, attack: float, release: float) -> np.ndarray:
    attack_n = max(1, min(length // 3, int(attack * SAMPLE_RATE)))
    release_n = max(1, min(length // 2, int(release * SAMPLE_RATE)))
    envelope = np.ones(length, dtype=np.float32)
    envelope[:attack_n] = np.sin(
        np.linspace(0.0, math.pi / 2.0, attack_n, endpoint=False, dtype=np.float32)
    )
    envelope[-release_n:] *= np.sin(
        np.linspace(math.pi / 2.0, 0.0, release_n, dtype=np.float32)
    )
    return envelope


def additive_modes(
    phase: np.ndarray,
    t: np.ndarray,
    duration: float,
    ratios,
    amplitudes,
    decay_rates,
) -> np.ndarray:
    result = np.zeros_like(t, dtype=np.float32)
    scale = max(0.16, duration)
    for ratio, amplitude, decay in zip(ratios, amplitudes, decay_rates):
        result += (
            amplitude
            * np.sin(phase * ratio).astype(np.float32)
            * np.exp(-decay * t / scale).astype(np.float32)
        )
    return result


def instrument_sample(note: str, duration: float, instrument: str) -> np.ndarray:
    length = max(2, int(duration * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    freq = frequency(note)
    phase = 2.0 * math.pi * freq * t

    if instrument == "felt_piano":
        body = additive_modes(
            phase, t, duration,
            (1.0, 2.002, 3.008, 4.018, 5.03),
            (1.0, 0.32, 0.14, 0.065, 0.025),
            (0.95, 1.55, 2.1, 2.8, 3.5),
        )
        strike = 1.0 - np.exp(-t / 0.0035)
        return (body * strike * edge_envelope(length, 0.004, min(0.16, duration * 0.3)) * 0.42).astype(np.float32)

    if instrument == "harp":
        harmonics = tuple(float(index) for index in range(1, 9))
        amplitudes = tuple(1.0 / (index ** 1.35) for index in range(1, 9))
        decays = tuple(1.05 + index * 0.42 for index in range(1, 9))
        body = additive_modes(phase, t, duration, harmonics, amplitudes, decays)
        return (body * edge_envelope(length, 0.003, min(0.14, duration * 0.32)) * 0.34).astype(np.float32)

    if instrument == "marimba":
        body = additive_modes(
            phase, t, duration,
            (1.0, 3.99, 9.03),
            (1.0, 0.19, 0.055),
            (2.8, 5.8, 9.2),
        )
        return (body * edge_envelope(length, 0.0025, min(0.1, duration * 0.28)) * 0.4).astype(np.float32)

    if instrument == "flute":
        vibrato_depth = 0.0016 * np.clip((t - 0.16) / 0.35, 0.0, 1.0)
        modulated_phase = phase + vibrato_depth * np.sin(2.0 * math.pi * 5.0 * t)
        body = (
            np.sin(modulated_phase)
            + 0.075 * np.sin(modulated_phase * 2.0)
            + 0.018 * np.sin(modulated_phase * 3.0)
        )
        return (body * edge_envelope(length, min(0.08, duration * 0.2), min(0.18, duration * 0.3)) * 0.36).astype(np.float32)

    if instrument == "strings":
        body = (
            0.58 * np.sin(phase * 0.999)
            + 0.58 * np.sin(phase * 1.001)
            + 0.14 * np.sin(phase * 2.0)
            + 0.06 * np.sin(phase * 3.0)
        ) / 1.36
        return (body * edge_envelope(length, min(0.16, duration * 0.22), min(0.28, duration * 0.32)) * 0.3).astype(np.float32)

    if instrument == "acoustic_bass":
        body = additive_modes(
            phase, t, duration,
            (1.0, 2.0, 3.0, 4.0),
            (1.0, 0.24, 0.1, 0.035),
            (0.72, 1.35, 2.1, 2.8),
        )
        return (body * edge_envelope(length, 0.008, min(0.14, duration * 0.28)) * 0.4).astype(np.float32)

    raise ValueError(f"Unknown instrument: {instrument}")


CHORDS = {
    "Dm": (("D4", "F4", "A4"), "D2"),
    "Bb": (("A#3", "D4", "F4"), "A#1"),
    "F": (("F4", "A4", "C5"), "F2"),
    "C": (("C4", "E4", "G4"), "C2"),
    "Gm": (("G3", "A#3", "D4"), "G2"),
    "A": (("A3", "C#4", "E4"), "A2"),
    "Eb": (("D#4", "G4", "A#4"), "D#2"),
}


class AcousticSong:
    def __init__(self, title: str, bpm: float, bars: int, beats_per_bar: int):
        self.title = title
        self.bpm = bpm
        self.bars = bars
        self.beats_per_bar = beats_per_bar
        self.seconds_per_beat = 60.0 / bpm
        self.total_samples = int(round(bars * beats_per_bar * self.seconds_per_beat * SAMPLE_RATE))
        self.buses = {
            name: np.zeros((self.total_samples, 2), dtype=np.float32)
            for name in ("room", "bass", "harmony", "melody", "percussion")
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
        sample = instrument_sample(
            pitch,
            max(0.025, duration_beats * self.seconds_per_beat),
            instrument,
        ) * velocity
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        self.buses[bus][start:end, 0] += sample * math.cos(angle)
        self.buses[bus][start:end, 1] += sample * math.sin(angle)

    def chord(self, bar: int, chord_name: str, velocity: float, instrument: str = "strings") -> None:
        pitches, _ = CHORDS[chord_name]
        pans = (-0.28, 0.0, 0.28)
        for pitch, pan in zip(pitches, pans):
            self.note(
                "room",
                self.bar_beat(bar),
                self.beats_per_bar * 0.9,
                pitch,
                velocity,
                instrument,
                pan,
            )

    def bass(self, bar: int, chord_name: str, hits, velocity: float) -> None:
        _, root = CHORDS[chord_name]
        for index, (offset, duration) in enumerate(hits):
            self.note(
                "bass",
                self.bar_beat(bar) + offset,
                duration,
                root,
                velocity * (1.0 if index == 0 else 0.9),
                "acoustic_bass",
                -0.04 if index % 2 == 0 else 0.04,
            )

    def place_drum(self, beat: float, sample: np.ndarray, pan: float = 0.0) -> None:
        start = int(round(beat * self.seconds_per_beat * SAMPLE_RATE))
        end = min(self.total_samples, start + sample.size)
        if end <= start:
            return
        sample = sample[: end - start]
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        self.buses["percussion"][start:end, 0] += sample * math.cos(angle)
        self.buses["percussion"][start:end, 1] += sample * math.sin(angle)

    def hand_drum(self, beat: float, velocity: float, pan: float = 0.0, low: bool = True) -> None:
        duration = 0.24 if low else 0.16
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        base = 92.0 if low else 148.0
        phase = 2.0 * math.pi * base * t
        sample = (
            np.sin(phase)
            + 0.22 * np.sin(phase * 1.59)
            + 0.08 * np.sin(phase * 2.14)
        ) * np.exp((-14.0 if low else -20.0) * t) * velocity * 0.34
        self.place_drum(beat, sample.astype(np.float32), pan)

    def woodblock(self, beat: float, velocity: float, pan: float = 0.0) -> None:
        duration = 0.075
        length = int(duration * SAMPLE_RATE)
        t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
        phase = 2.0 * math.pi * 690.0 * t
        sample = (
            np.sin(phase)
            + 0.35 * np.sin(phase * 2.76)
        ) * np.exp(-54.0 * t) * velocity * 0.13
        self.place_drum(beat, sample.astype(np.float32), pan)

    def render(self, gains: dict[str, float], loop: bool, timed_fade: bool = False) -> np.ndarray:
        mix = np.zeros_like(self.buses["room"])
        for bus_name, bus in self.buses.items():
            mix += bus * gains.get(bus_name, 1.0)
        mix -= np.mean(mix, axis=0, keepdims=True)
        mix = np.tanh(mix * 1.04)
        peak = float(np.max(np.abs(mix)))
        if peak > 0:
            mix *= 0.82 / peak

        edge = max(16, int(0.004 * SAMPLE_RATE))
        mix[:edge] *= np.linspace(0.0, 1.0, edge, dtype=np.float32)[:, None]
        if loop:
            mix[-edge:] *= np.linspace(1.0, 0.0, edge, dtype=np.float32)[:, None]
        elif timed_fade:
            times = np.arange(self.total_samples, dtype=np.float32) / SAMPLE_RATE
            volume = np.interp(
                times,
                (0.0, 40.0, 52.0, 58.5, 60.0),
                (1.0, 1.0, 0.68, 0.22, 0.0),
            ).astype(np.float32)
            mix *= volume[:, None]
        return mix.astype(np.float32)


def chord_tone(song: AcousticSong, chord_name: str, index: int, octave: int = 12) -> str:
    pitches, _ = CHORDS[chord_name]
    return transpose(pitches[index % 3], octave)


def stage_01() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("01 · 첫 접속", 120, 16, 4)
    progression = ("Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A")
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.43, "felt_piano")
        song.bass(bar, chord_name, ((0.0, 1.7), (2.0, 1.55)), 0.42)
        if bar % 2 == 0:
            for offset, note_index, duration in ((0.0, 0, 0.75), (1.25, 1, 0.5), (2.0, 2, 0.75), (3.0, 1, 0.55)):
                song.note("melody", song.bar_beat(bar) + offset, duration, chord_tone(song, chord_name, note_index), 0.62, "harp", -0.16 + note_index * 0.16)
        else:
            song.note("harmony", song.bar_beat(bar) + 2.5, 0.75, chord_tone(song, chord_name, 2), 0.34, "harp", 0.18)
    audio = song.render({"room": 0.84, "bass": 0.7, "harmony": 0.62, "melody": 0.9, "percussion": 0.0}, loop=True)
    return song, audio, "stage-01-first-link-natural-loop-v4.wav", True


def stage_02() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("02 · 상상력의 첫걸음", 120, 16, 4)
    progression = ("Dm", "C", "Bb", "A", "Dm", "C", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "C", "Bb", "A")
    call_pattern = ((0.0, 0, 0.42), (0.75, 2, 0.32), (1.5, 1, 0.55), (2.5, 2, 0.42), (3.25, 0, 0.55))
    answer_pattern = ((0.25, 2, 0.42), (1.0, 1, 0.38), (1.75, 0, 0.55), (2.75, 1, 0.4), (3.4, 2, 0.42))
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.34, "strings")
        song.bass(bar, chord_name, ((0.0, 0.7), (2.0, 0.65)), 0.48)
        pattern = call_pattern if bar % 2 == 0 else answer_pattern
        instrument = "felt_piano" if bar % 2 == 0 else "harp"
        pan_sign = -1.0 if bar % 2 == 0 else 1.0
        for event_index, (offset, note_index, duration) in enumerate(pattern):
            song.note("melody", song.bar_beat(bar) + offset, duration, chord_tone(song, chord_name, note_index), 0.54, instrument, pan_sign * (0.08 + event_index * 0.025))
        song.woodblock(song.bar_beat(bar), 0.22, -0.1)
        song.woodblock(song.bar_beat(bar) + 2.0, 0.18, 0.1)
    audio = song.render({"room": 0.72, "bass": 0.72, "harmony": 0.0, "melody": 0.92, "percussion": 0.42}, loop=True)
    return song, audio, "stage-02-imagination-step-natural-loop-v4.wav", True


def stage_03() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("03 · 달빛 유원지의 벽", 128, 16, 4)
    progression = ("Dm", "Gm", "Bb", "A") * 4
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.32, "strings")
        song.bass(bar, chord_name, ((0.0, 0.58), (1.5, 0.58), (3.0, 0.4)), 0.62)
        for offset, note_index, duration in ((0.0, 0, 0.5), (1.5, 2, 0.5), (3.0, 1, 0.55)):
            song.note("melody", song.bar_beat(bar) + offset, duration, chord_tone(song, chord_name, note_index), 0.57, "marimba", -0.14 + note_index * 0.14)
        song.hand_drum(song.bar_beat(bar), 0.46, -0.08, True)
        song.hand_drum(song.bar_beat(bar) + 1.5, 0.32, 0.08, False)
        song.hand_drum(song.bar_beat(bar) + 3.0, 0.28, 0.0, False)
    audio = song.render({"room": 0.7, "bass": 0.78, "harmony": 0.0, "melody": 0.9, "percussion": 0.68}, loop=True)
    return song, audio, "stage-03-moonlight-wall-natural-loop-v4.wav", True


def stage_04() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("04 · 무너지는 회전목마", 120, 20, 3)
    progression = ("Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A", "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A", "Dm", "Bb", "Gm", "A")
    for bar, chord_name in enumerate(progression):
        song.bass(bar, chord_name, ((0.0, 0.72),), 0.58)
        chord, _ = CHORDS[chord_name]
        for beat in (1.0, 2.0):
            for voice_index, pitch in enumerate(chord):
                song.note("harmony", song.bar_beat(bar) + beat, 0.48, pitch, 0.32, "felt_piano", -0.16 + voice_index * 0.16)
        for offset, note_index in ((0.25, 0), (1.0, 2), (1.75, 1), (2.5, 2)):
            song.note("melody", song.bar_beat(bar) + offset, 0.38, chord_tone(song, chord_name, note_index), 0.52, "harp", -0.15 + note_index * 0.15)
        song.hand_drum(song.bar_beat(bar), 0.28, 0.0, True)
    audio = song.render({"room": 0.0, "bass": 0.72, "harmony": 0.84, "melody": 0.9, "percussion": 0.46}, loop=True)
    return song, audio, "stage-04-carousel-natural-loop-v4.wav", True


def stage_05() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("05 · 하린이 가장 두려워한 것", 128, 32, 4)
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    for bar, chord_name in enumerate(progression):
        phase = bar // 8
        song.chord(bar, chord_name, 0.34 + phase * 0.018, "strings")
        song.bass(bar, chord_name, ((0.0, 0.68), (2.0, 0.62)), 0.58 + phase * 0.025)
        if bar % 2 == 0:
            for offset, note_index in ((0.0, 0), (1.0, 1), (2.25, 2), (3.2, 1)):
                instrument = "felt_piano" if bar < 24 else "harp"
                song.note("melody", song.bar_beat(bar) + offset, 0.45, chord_tone(song, chord_name, note_index), 0.5, instrument, -0.1 + note_index * 0.1)
        song.hand_drum(song.bar_beat(bar), 0.42 + phase * 0.02, -0.08, True)
        song.hand_drum(song.bar_beat(bar) + 2.0, 0.3 + phase * 0.02, 0.08, False)
        song.woodblock(song.bar_beat(bar) + 1.0, 0.18, -0.08)
        song.woodblock(song.bar_beat(bar) + 3.0, 0.18, 0.08)
    audio = song.render(
        {"room": 0.76, "bass": 0.82, "harmony": 0.0, "melody": 0.9, "percussion": 0.62},
        loop=False,
        timed_fade=True,
    )
    return song, audio, "stage-05-harin-fear-natural-60s-v4.wav", False


def stage_06() -> tuple[AcousticSong, np.ndarray, str, bool]:
    song = AcousticSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4)
    progression = ("F", "C", "Dm", "Bb", "Gm", "C", "F", "C", "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C")
    for bar, chord_name in enumerate(progression):
        song.chord(bar, chord_name, 0.3, "strings")
        song.bass(bar, chord_name, ((0.0, 3.4),), 0.34)
        if bar % 2 == 0:
            for offset, note_index, duration in ((0.0, 0, 0.9), (1.5, 1, 0.72), (3.0, 2, 0.75)):
                song.note("melody", song.bar_beat(bar) + offset, duration, chord_tone(song, chord_name, note_index), 0.46, "flute", -0.08 + note_index * 0.08)
        else:
            song.note("harmony", song.bar_beat(bar) + 2.0, 0.82, chord_tone(song, chord_name, 2), 0.3, "harp", 0.12)
    audio = song.render({"room": 0.68, "bass": 0.6, "harmony": 0.56, "melody": 0.82, "percussion": 0.0}, loop=True)
    return song, audio, "stage-06-lantern-river-natural-loop-v4.wav", True


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
        default=Path("assets/audio/harin-stage-themes-v4"),
    )
    args = parser.parse_args()
    for builder in (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06):
        song, audio, filename, is_loop = builder()
        output = args.output_dir / filename
        write_wav(output, audio)
        boundary = float(np.max(np.abs(audio[0] - audio[-1])))
        rms = float(np.sqrt(np.mean(audio * audio)))
        final_five_rms = float(np.sqrt(np.mean(audio[-5 * SAMPLE_RATE:] ** 2)))
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\tboundary={boundary:.6f}\t"
            f"rms={rms:.4f}\tlast5={final_five_rms:.4f}"
        )


if __name__ == "__main__":
    main()
