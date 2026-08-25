#!/usr/bin/env python3
"""Generate v7 Harin themes with a new acoustic palette and explicit stage-1 timing."""

from __future__ import annotations

import argparse
import math
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v4 import (  # noqa: E402
    SAMPLE_RATE,
    CHORDS,
    additive_modes,
    edge_envelope,
    frequency,
    instrument_sample,
    midi_to_note,
    note_to_midi,
)
from generate_harin_stage_themes_v5 import LegatoSong  # noqa: E402
from generate_harin_stage_themes_v6 import (  # noqa: E402
    add_root_motion,
    add_varied_melody,
    choose_degree_tone,
    normalize_rms,
)


def new_instrument_sample(note: str, duration: float, instrument: str) -> np.ndarray:
    if instrument not in {"nylon_guitar", "clarinet", "cello", "accordion", "bassoon"}:
        return instrument_sample(note, duration, instrument)

    length = max(2, int(duration * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    freq = frequency(note)
    phase = 2.0 * math.pi * freq * t

    if instrument == "nylon_guitar":
        body = additive_modes(
            phase,
            t,
            duration,
            (1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
            (1.0, 0.38, 0.18, 0.09, 0.04, 0.018),
            (0.9, 1.4, 2.0, 2.7, 3.4, 4.2),
        )
        finger = 1.0 - np.exp(-t / 0.005)
        return (
            body
            * finger
            * edge_envelope(length, 0.004, min(0.22, duration * 0.34))
            * 0.35
        ).astype(np.float32)

    if instrument == "clarinet":
        vibrato = 0.0012 * np.clip((t - 0.22) / 0.4, 0.0, 1.0)
        modulated = phase + vibrato * np.sin(2.0 * math.pi * 4.7 * t)
        body = (
            np.sin(modulated)
            + 0.26 * np.sin(modulated * 3.0)
            + 0.075 * np.sin(modulated * 5.0)
            + 0.022 * np.sin(modulated * 7.0)
        )
        return (
            body
            * edge_envelope(length, min(0.09, duration * 0.22), min(0.24, duration * 0.32))
            * 0.3
        ).astype(np.float32)

    if instrument == "cello":
        body = (
            0.54 * np.sin(phase * 0.999)
            + 0.54 * np.sin(phase * 1.001)
            + 0.2 * np.sin(phase * 2.0)
            + 0.11 * np.sin(phase * 3.0)
            + 0.045 * np.sin(phase * 4.0)
        ) / 1.445
        return (
            body
            * edge_envelope(length, min(0.14, duration * 0.24), min(0.3, duration * 0.36))
            * 0.34
        ).astype(np.float32)

    if instrument == "accordion":
        reed_a = np.sin(phase * 0.9992)
        reed_b = np.sin(phase * 1.0008)
        body = (
            0.42 * reed_a
            + 0.42 * reed_b
            + 0.12 * np.sin(phase * 2.0)
            + 0.05 * np.sin(phase * 3.0)
        )
        return (
            body
            * edge_envelope(length, min(0.11, duration * 0.2), min(0.26, duration * 0.34))
            * 0.27
        ).astype(np.float32)

    body = (
        np.sin(phase)
        + 0.34 * np.sin(phase * 2.0)
        + 0.2 * np.sin(phase * 3.0)
        + 0.08 * np.sin(phase * 4.0)
    )
    return (
        body
        * edge_envelope(length, min(0.1, duration * 0.22), min(0.24, duration * 0.34))
        * 0.28
    ).astype(np.float32)


class ReorchestratedSong(LegatoSong):
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
        sample = new_instrument_sample(
            pitch,
            max(0.025, duration_beats * self.seconds_per_beat),
            instrument,
        ) * velocity
        angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
        left = sample * math.cos(angle)
        right = sample * math.sin(angle)
        end = start + sample.size
        if start >= self.total_samples:
            return
        direct_end = min(self.total_samples, end)
        direct_length = direct_end - start
        self.buses[bus][start:direct_end, 0] += left[:direct_length]
        self.buses[bus][start:direct_end, 1] += right[:direct_length]
        overflow = end - self.total_samples
        if self.loop_mode and overflow > 0:
            wrap_length = min(overflow, self.total_samples)
            self.buses[bus][:wrap_length, 0] += left[direct_length:direct_length + wrap_length]
            self.buses[bus][:wrap_length, 1] += right[direct_length:direct_length + wrap_length]


def guitar_chord(song: ReorchestratedSong, bar: int, chord_name: str, velocity: float) -> None:
    chord, _ = CHORDS[chord_name]
    for index, pitch in enumerate(chord):
        song.note(
            "room",
            song.bar_beat(bar),
            song.beats_per_bar * 0.94,
            pitch,
            velocity,
            "nylon_guitar",
            -0.18 + index * 0.18,
        )


def resolve_stage1_tone(chord_name: str, degree: int, previous: int, bias: int = 0) -> int:
    current = choose_degree_tone(chord_name, degree, previous, bias)
    if current == previous:
        chord, _ = CHORDS[chord_name]
        alternatives = [
            midi
            for midi in range(64, 89)
            if midi != previous
            and midi % 12 in {note_to_midi(pitch) % 12 for pitch in chord}
        ]
        if alternatives:
            current = min(alternatives, key=lambda midi: abs(midi - (previous + 4)))
    return current


def add_stage1_clocked_melody(song: ReorchestratedSong, progression) -> None:
    previous = 69
    long_patterns = (
        ((0.0, 1.94, 0), (2.0, 1.94, 1)),
        ((0.0, 1.94, 2), (2.0, 1.94, 1)),
        ((0.0, 1.94, 0), (2.0, 1.94, 2)),
        ((0.0, 1.94, 1), (2.0, 1.94, 0)),
    )
    on_beat_patterns = (
        ((0.0, 1.02, 0), (1.0, 1.02, 1), (2.0, 1.02, 2), (3.0, 0.94, 1)),
        ((0.0, 1.02, 2), (1.0, 1.02, 1), (2.0, 1.02, 0), (3.0, 0.94, 1)),
        ((0.0, 1.02, 1), (1.0, 1.02, 2), (2.0, 1.02, 0), (3.0, 0.94, 2)),
        ((0.0, 1.02, 0), (1.0, 1.02, 2), (2.0, 1.02, 1), (3.0, 0.94, 0)),
    )
    off_beat_patterns = (
        ((0.5, 0.94, 2), (1.5, 0.94, 1), (2.5, 0.94, 0), (3.5, 0.44, 1)),
        ((0.5, 0.94, 1), (1.5, 0.94, 0), (2.5, 0.94, 2), (3.5, 0.44, 1)),
        ((0.5, 0.94, 0), (1.5, 0.94, 2), (2.5, 0.94, 1), (3.5, 0.44, 2)),
        ((0.5, 0.94, 1), (1.5, 0.94, 2), (2.5, 0.94, 0), (3.5, 0.44, 1)),
    )
    for bar, chord_name in enumerate(progression):
        if bar < 4:
            pattern = long_patterns[bar]
            bias = 0
        elif bar < 8:
            pattern = on_beat_patterns[bar - 4]
            bias = 0
        elif bar < 12:
            pattern = off_beat_patterns[bar - 8]
            bias = 3
        else:
            pattern = long_patterns[bar - 12]
            bias = -2
        for event_index, (offset, duration, degree) in enumerate(pattern):
            current = resolve_stage1_tone(chord_name, degree, previous, bias)
            song.note(
                "melody",
                song.bar_beat(bar) + offset,
                duration,
                midi_to_note(current),
                0.4,
                "clarinet",
                -0.06 + event_index * 0.04,
            )
            previous = current


def stage_01() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A")
    song = ReorchestratedSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.27)
    add_root_motion(song, progression, 0.29)
    add_stage1_clocked_melody(song, progression)
    audio = song.render_legato({"room": 0.74, "bass": 0.52, "harmony": 0.0, "melody": 0.78, "percussion": 0.0}, room_amount=0.13)
    return song, normalize_rms(audio, 0.135), "stage-01-clarinet-guitar-clocked-loop-v7.wav", True


def stage_02() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "C", "Bb", "A", "Dm", "C", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "C", "Bb", "A")
    song = ReorchestratedSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.24)
    add_root_motion(song, progression, 0.3)
    add_varied_melody(song, progression[:8], "clarinet", 0.36, 69)
    add_varied_melody(song, progression[8:], "nylon_guitar", 0.34, 72, bus="harmony", cycle_offset=2, start_bar=8)
    audio = song.render_legato({"room": 0.72, "bass": 0.54, "harmony": 0.72, "melody": 0.76, "percussion": 0.0}, room_amount=0.12)
    return song, normalize_rms(audio, 0.13), "stage-02-clarinet-guitar-varied-loop-v7.wav", True


def stage_03() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "Gm", "Bb", "A") * 4
    song = ReorchestratedSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.22)
        song.hand_drum(song.bar_beat(bar), 0.24, -0.04, True)
        if bar % 2 == 1:
            song.hand_drum(song.bar_beat(bar) + 2.5, 0.15, 0.04, False)
    add_root_motion(song, progression, 0.36)
    add_varied_melody(song, progression, "cello", 0.34, 69)
    audio = song.render_legato({"room": 0.68, "bass": 0.58, "harmony": 0.0, "melody": 0.74, "percussion": 0.36}, room_amount=0.11)
    return song, normalize_rms(audio, 0.135), "stage-03-cello-guitar-varied-loop-v7.wav", True


def stage_04() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A", "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A", "Dm", "Bb", "Gm", "A")
    song = ReorchestratedSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.14, "accordion")
        guitar_chord(song, bar, chord, 0.18)
        song.bass(bar, chord, ((0.0, 0.88),), 0.28)
    add_varied_melody(song, progression, "clarinet", 0.32, 69)
    audio = song.render_legato({"room": 0.45, "bass": 0.48, "harmony": 0.0, "melody": 0.7, "percussion": 0.0}, room_amount=0.13)
    return song, normalize_rms(audio, 0.125), "stage-04-accordion-guitar-waltz-loop-v7.wav", True


def stage_05() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "Eb", "A",
        "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm",
    )
    song = ReorchestratedSong("05 · 하린이 가장 두려워한 것", 128, 32, 4, False)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.2)
        song.hand_drum(song.bar_beat(bar), 0.25, -0.04, True)
        if bar % 2 == 0:
            song.hand_drum(song.bar_beat(bar) + 2.0, 0.14, 0.04, False)
    add_root_motion(song, progression, 0.36)
    add_varied_melody(song, progression[:16], "bassoon", 0.32, 65)
    add_varied_melody(song, progression[16:], "cello", 0.3, 69, bus="harmony", cycle_offset=2, start_bar=16)
    audio = song.render_legato({"room": 0.65, "bass": 0.62, "harmony": 0.66, "melody": 0.7, "percussion": 0.36}, timed_fade=True, room_amount=0.1)
    return song, normalize_rms(audio, 0.13), "stage-05-bassoon-cello-60s-v7.wav", False


def stage_06() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("F", "C", "Dm", "Bb", "Gm", "C", "F", "C", "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C")
    song = ReorchestratedSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.2)
    add_root_motion(song, progression, 0.2)
    add_varied_melody(song, progression, "clarinet", 0.3, 69)
    audio = song.render_legato({"room": 0.62, "bass": 0.38, "harmony": 0.0, "melody": 0.62, "percussion": 0.0}, room_amount=0.15)
    return song, normalize_rms(audio, 0.11), "stage-06-clarinet-guitar-lantern-loop-v7.wav", True


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
        default=Path("assets/audio/harin-stage-themes-v7"),
    )
    args = parser.parse_args()
    for builder in (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06):
        song, audio, filename, is_loop = builder()
        output = args.output_dir / filename
        write_wav(output, audio)
        rms = float(np.sqrt(np.mean(audio * audio)))
        boundary = float(np.max(np.abs(audio[0] - audio[-1])))
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\trms={rms:.4f}\tboundary={boundary:.6f}"
        )


if __name__ == "__main__":
    main()
