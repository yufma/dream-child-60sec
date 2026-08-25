#!/usr/bin/env python3
"""Generate v11 Harin themes around one singable leitmotif and clear phrases."""

from __future__ import annotations

import argparse
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v4 import (  # noqa: E402
    CHORDS,
    SAMPLE_RATE,
    midi_to_note,
    note_to_midi,
)
from generate_harin_stage_themes_v6 import normalize_rms  # noqa: E402
from generate_harin_stage_themes_v7 import (  # noqa: E402
    ReorchestratedSong,
    guitar_chord,
)


Event = tuple[float, float, str]
PHRASE_SHAPE = (0.92, 0.98, 1.04, 0.95, 0.94, 1.0, 1.05, 0.86)
HIGH_MELODY_INSTRUMENT = "clarinet"
HIGH_MELODY_VELOCITY_SCALE = 1.0
DIATONIC_CLASSES = {
    note_to_midi(note) % 12
    for note in ("D4", "E4", "F4", "G4", "A4", "A#4", "C5", "C#5")
}


def validate_melody(
    progression: tuple[str, ...],
    melody: tuple[tuple[Event, ...], ...],
    allowed_onsets: set[float],
    weak_onsets: set[float],
) -> None:
    if len(progression) != len(melody):
        raise ValueError("Progression and melody must have the same number of bars")

    for bar, (chord_name, events) in enumerate(zip(progression, melody)):
        chord, _ = CHORDS[chord_name]
        chord_classes = {note_to_midi(pitch) % 12 for pitch in chord}
        previous_offset = -1.0
        for index, (offset, duration, pitch) in enumerate(events):
            if offset not in allowed_onsets:
                raise ValueError(f"Bar {bar + 1}: onset {offset} is off the rhythmic grid")
            if offset <= previous_offset:
                raise ValueError(f"Bar {bar + 1}: events are not strictly ordered")
            if note_to_midi(pitch) % 12 not in DIATONIC_CLASSES:
                raise ValueError(f"Bar {bar + 1}: {pitch} is outside the Harin tonal palette")
            previous_offset = offset

            if note_to_midi(pitch) % 12 in chord_classes:
                continue
            if offset not in weak_onsets or duration > 1.46:
                raise ValueError(
                    f"Bar {bar + 1}: unresolved non-chord tone {pitch} on beat {offset}"
                )
            if index + 1 < len(events):
                next_pitch = events[index + 1][2]
                resolution_chord_name = chord_name
            else:
                next_bar = (bar + 1) % len(melody)
                next_pitch = melody[next_bar][0][2]
                resolution_chord_name = progression[next_bar]
            next_midi = note_to_midi(next_pitch)
            resolution_chord, _ = CHORDS[resolution_chord_name]
            resolution_classes = {note_to_midi(note) % 12 for note in resolution_chord}
            if next_midi % 12 not in resolution_classes or abs(next_midi - note_to_midi(pitch)) > 2:
                raise ValueError(
                    f"Bar {bar + 1}: passing tone {pitch} does not resolve by step"
                )


def add_melody(
    song: ReorchestratedSong,
    progression: tuple[str, ...],
    melody: tuple[tuple[Event, ...], ...],
    instrument: str,
    velocity: float,
    allowed_onsets: set[float],
    weak_onsets: set[float] | None = None,
) -> None:
    validate_melody(progression, melody, allowed_onsets, weak_onsets or set())
    for bar, events in enumerate(melody):
        phrase_gain = PHRASE_SHAPE[bar % len(PHRASE_SHAPE)]
        for offset, duration, pitch in events:
            song.note(
                "melody",
                song.bar_beat(bar) + offset,
                duration,
                pitch,
                velocity * phrase_gain,
                instrument,
                0.0,
            )


def add_bass(song: ReorchestratedSong, progression: tuple[str, ...], hits, velocity: float) -> None:
    for bar, chord in enumerate(progression):
        song.bass(bar, chord, hits, velocity * PHRASE_SHAPE[bar % 8])


def stage_01() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "F", "Bb", "A", "Dm", "F", "Bb", "A",
        "Gm", "Bb", "F", "A", "Dm", "F", "Bb", "A",
    )
    # One four-bar sentence is stated, repeated, contrasted once, and stated again.
    melody = (
        ((0.0, 0.96, "D5"), (1.0, 0.96, "F5"), (2.0, 1.86, "A5")),
        ((0.0, 0.96, "A5"), (1.0, 0.96, "G5"), (2.0, 0.96, "F5"), (3.0, 0.82, "E5")),
        ((0.0, 0.96, "F5"), (1.0, 0.96, "F5"), (2.0, 1.86, "D5")),
        ((0.0, 0.96, "E5"), (1.0, 0.96, "C#5"), (2.0, 1.26, "A4")),
        ((0.0, 0.96, "D5"), (1.0, 0.96, "F5"), (2.0, 1.86, "A5")),
        ((0.0, 0.96, "A5"), (1.0, 0.96, "G5"), (2.0, 0.96, "F5"), (3.0, 0.82, "E5")),
        ((0.0, 0.96, "F5"), (1.0, 0.96, "F5"), (2.0, 1.86, "D5")),
        ((0.0, 0.96, "E5"), (1.0, 0.96, "C#5"), (2.0, 1.26, "A4")),
        ((0.0, 0.96, "G5"), (1.0, 0.96, "A#5"), (2.0, 1.86, "D6")),
        ((0.0, 1.86, "D6"), (2.0, 1.86, "F6")),
        ((0.0, 0.96, "C6"), (1.0, 0.96, "A5"), (2.0, 1.86, "F5")),
        ((0.0, 0.96, "E5"), (1.0, 0.96, "E5"), (2.0, 0.96, "C#5"), (3.0, 0.72, "A4")),
        ((0.0, 0.96, "D5"), (1.0, 0.96, "F5"), (2.0, 1.86, "A5")),
        ((0.0, 0.96, "A5"), (1.0, 0.96, "G5"), (2.0, 0.96, "F5"), (3.0, 0.82, "E5")),
        ((0.0, 0.96, "F5"), (1.0, 0.96, "F5"), (2.0, 1.86, "D5")),
        ((0.0, 0.96, "E5"), (1.0, 0.96, "C#5"), (2.0, 0.96, "A4"), (3.0, 0.7, "A4")),
    )
    song = ReorchestratedSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.21 + (0.015 if 8 <= bar < 12 else 0.0))
    add_bass(song, progression, ((0.0, 1.88), (2.0, 1.82)), 0.25)
    add_melody(song, progression, melody, HIGH_MELODY_INSTRUMENT, 0.33 * HIGH_MELODY_VELOCITY_SCALE, {0.0, 1.0, 2.0, 3.0}, {1.0, 3.0})
    audio = song.render_legato(
        {"room": 0.68, "bass": 0.44, "harmony": 0.0, "melody": 0.72, "percussion": 0.0},
        room_amount=0.1,
    )
    return song, normalize_rms(audio, 0.12), "stage-01-harin-theme-loop-v11.wav", True


def stage_02() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "F", "Bb", "A", "Dm", "F", "Bb", "A",
        "Bb", "F", "Gm", "A", "Dm", "F", "Bb", "A",
    )
    # The same four-bar sentence appears, then its lower memory, one answer, and the return.
    melody = (
        ((0.0, 1.9, "D5"), (2.0, 1.82, "F5")),
        ((0.0, 1.9, "A5"), (2.0, 1.82, "F5")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "D5")),
        ((0.0, 1.9, "E5"), (2.0, 1.24, "C#5")),
        ((0.0, 1.9, "D4"), (2.0, 1.82, "F4")),
        ((0.0, 1.9, "A4"), (2.0, 1.82, "F4")),
        ((0.0, 1.9, "F4"), (2.0, 1.82, "D4")),
        ((0.0, 1.9, "E4"), (2.0, 1.24, "C#4")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "A#5")),
        ((0.0, 1.9, "C6"), (2.0, 1.82, "A5")),
        ((0.0, 1.9, "A#5"), (2.0, 1.82, "G5")),
        ((0.0, 1.9, "E5"), (2.0, 1.24, "C#5")),
        ((0.0, 1.9, "D5"), (2.0, 1.82, "F5")),
        ((0.0, 1.9, "A5"), (2.0, 1.82, "F5")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "D5")),
        ((0.0, 1.9, "E5"), (2.0, 1.24, "C#5")),
    )
    song = ReorchestratedSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.19)
    add_bass(song, progression, ((0.0, 1.88), (2.0, 1.82)), 0.24)
    add_melody(song, progression, melody, HIGH_MELODY_INSTRUMENT, 0.31 * HIGH_MELODY_VELOCITY_SCALE, {0.0, 2.0})
    audio = song.render_legato(
        {"room": 0.66, "bass": 0.44, "harmony": 0.0, "melody": 0.68, "percussion": 0.0},
        room_amount=0.1,
    )
    return song, normalize_rms(audio, 0.115), "stage-02-remembered-theme-loop-v11.wav", True


def stage_03() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "F", "Bb", "A", "Dm", "F", "Bb", "A",
        "Dm", "Gm", "Bb", "A", "Dm", "F", "Bb", "A",
    )
    melody = (
        ((0.0, 1.4, "D4"), (1.5, 1.4, "F4"), (3.0, 0.82, "A4")),
        ((0.0, 1.4, "A4"), (1.5, 1.4, "G4"), (3.0, 0.82, "F4")),
        ((0.0, 1.4, "F4"), (1.5, 1.4, "F4"), (3.0, 0.82, "D4")),
        ((0.0, 1.4, "E4"), (1.5, 1.4, "C#4"), (3.0, 0.72, "A3")),
        ((0.0, 1.4, "D4"), (1.5, 1.4, "F4"), (3.0, 0.82, "A4")),
        ((0.0, 1.4, "C5"), (1.5, 1.4, "A4"), (3.0, 0.82, "F4")),
        ((0.0, 1.4, "F4"), (1.5, 1.4, "A#4"), (3.0, 0.82, "D5")),
        ((0.0, 1.4, "E5"), (1.5, 1.4, "C#5"), (3.0, 0.72, "A4")),
        ((0.0, 1.4, "D4"), (1.5, 1.4, "A4"), (3.0, 0.82, "D5")),
        ((0.0, 1.4, "G4"), (1.5, 1.4, "A#4"), (3.0, 0.82, "D5")),
        ((0.0, 1.4, "F5"), (1.5, 1.4, "D5"), (3.0, 0.82, "A#4")),
        ((0.0, 1.4, "E5"), (1.5, 1.4, "C#5"), (3.0, 0.72, "A4")),
        ((0.0, 1.4, "D4"), (1.5, 1.4, "F4"), (3.0, 0.82, "A4")),
        ((0.0, 1.4, "A4"), (1.5, 1.4, "G4"), (3.0, 0.82, "F4")),
        ((0.0, 1.4, "F4"), (1.5, 1.4, "F4"), (3.0, 0.82, "D4")),
        ((0.0, 1.4, "E4"), (1.5, 1.4, "C#4"), (3.0, 0.72, "A3")),
    )
    song = ReorchestratedSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.17)
        song.hand_drum(song.bar_beat(bar), 0.15, -0.03, True)
        song.hand_drum(song.bar_beat(bar) + 3.0, 0.08, 0.03, False)
    add_bass(song, progression, ((0.0, 3.72),), 0.27)
    add_melody(song, progression, melody, "cello", 0.29, {0.0, 1.5, 3.0}, {1.5})
    audio = song.render_legato(
        {"room": 0.6, "bass": 0.52, "harmony": 0.0, "melody": 0.68, "percussion": 0.24},
        room_amount=0.08,
    )
    return song, normalize_rms(audio, 0.12), "stage-03-fractured-theme-332-loop-v11.wav", True


def stage_04() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "F", "Bb", "A", "F", "C", "Bb", "A",
        "Dm", "C", "Bb", "A", "F", "Bb", "Gm", "A",
        "Dm", "F", "Bb", "A",
    )
    melody = (
        ((0.0, 0.94, "D5"), (1.0, 0.94, "F5"), (2.0, 0.82, "A5")),
        ((0.0, 0.94, "A5"), (1.0, 0.94, "G5"), (2.0, 0.82, "F5")),
        ((0.0, 0.94, "F5"), (1.0, 0.94, "F5"), (2.0, 0.82, "D5")),
        ((0.0, 0.94, "E5"), (1.0, 0.94, "C#5"), (2.0, 0.7, "A4")),
        ((0.0, 0.94, "F5"), (1.0, 0.94, "A5"), (2.0, 0.82, "C6")),
        ((0.0, 0.94, "C6"), (1.0, 0.94, "G5"), (2.0, 0.82, "E5")),
        ((0.0, 0.94, "D5"), (1.0, 0.94, "F5"), (2.0, 0.82, "A#5")),
        ((0.0, 0.94, "E5"), (1.0, 0.94, "C#5"), (2.0, 0.7, "A4")),
        ((0.0, 0.94, "A5"), (1.0, 0.94, "A5"), (2.0, 0.82, "A5")),
        ((0.0, 0.94, "G5"), (1.0, 0.94, "G5"), (2.0, 0.82, "E5")),
        ((0.0, 0.94, "F5"), (1.0, 0.94, "F5"), (2.0, 0.82, "D5")),
        ((0.0, 0.94, "E5"), (1.0, 0.94, "C#5"), (2.0, 0.7, "A4")),
        ((0.0, 0.94, "F5"), (1.0, 0.94, "A5"), (2.0, 0.82, "C6")),
        ((0.0, 0.94, "D6"), (1.0, 0.94, "D6"), (2.0, 0.82, "F6")),
        ((0.0, 0.94, "G5"), (1.0, 0.94, "A#5"), (2.0, 0.82, "D6")),
        ((0.0, 0.94, "E6"), (1.0, 0.94, "C#6"), (2.0, 0.7, "A5")),
        ((0.0, 0.94, "D5"), (1.0, 0.94, "F5"), (2.0, 0.82, "A5")),
        ((0.0, 0.94, "A5"), (1.0, 0.94, "G5"), (2.0, 0.82, "F5")),
        ((0.0, 0.94, "F5"), (1.0, 0.94, "F5"), (2.0, 0.82, "D5")),
        ((0.0, 0.94, "E5"), (1.0, 0.94, "C#5"), (2.0, 0.7, "A4")),
    )
    song = ReorchestratedSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.095, "accordion")
        guitar_chord(song, bar, chord, 0.135)
        song.bass(bar, chord, ((0.0, 2.78),), 0.21)
    add_melody(song, progression, melody, HIGH_MELODY_INSTRUMENT, 0.27 * HIGH_MELODY_VELOCITY_SCALE, {0.0, 1.0, 2.0}, {1.0, 2.0})
    audio = song.render_legato(
        {"room": 0.46, "bass": 0.42, "harmony": 0.0, "melody": 0.64, "percussion": 0.0},
        room_amount=0.1,
    )
    return song, normalize_rms(audio, 0.11), "stage-04-carousel-theme-waltz-loop-v11.wav", True


def stage_05() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "F", "Bb", "A", "Dm", "Eb", "Bb", "A",
        "Dm", "F", "Bb", "A", "F", "C", "Bb", "A",
        "Dm", "Dm", "Bb", "A", "Dm", "Bb", "A", "Dm",
    )
    # The theme survives the fear intact; after 40s its activity is deliberately removed.
    melody = (
        ((0.0, 1.86, "D3"), (2.0, 1.82, "F3")),
        ((0.0, 1.86, "A3"), (2.0, 1.82, "F3")),
        ((0.0, 1.86, "F3"), (2.0, 1.82, "D3")),
        ((0.0, 1.86, "E3"), (2.0, 1.24, "C#3")),
        ((0.0, 1.86, "D3"), (2.0, 1.82, "F3")),
        ((0.0, 1.86, "G3"), (2.0, 1.82, "A#3")),
        ((0.0, 1.86, "F3"), (2.0, 1.82, "D3")),
        ((0.0, 1.86, "E3"), (2.0, 1.24, "C#3")),
        ((0.0, 1.86, "D4"), (2.0, 1.82, "F4")),
        ((0.0, 1.86, "A4"), (2.0, 1.82, "F4")),
        ((0.0, 1.86, "F4"), (2.0, 1.82, "D4")),
        ((0.0, 1.86, "E4"), (2.0, 1.24, "C#4")),
        ((0.0, 1.86, "A4"), (2.0, 1.82, "C5")),
        ((0.0, 1.86, "C5"), (2.0, 1.82, "G4")),
        ((0.0, 1.86, "F4"), (2.0, 1.82, "D4")),
        ((0.0, 1.86, "E4"), (2.0, 1.24, "C#4")),
        ((0.0, 1.86, "D4"), (2.0, 1.82, "D4")),
        ((0.0, 1.86, "A3"), (2.0, 1.82, "A3")),
        ((0.0, 1.86, "F3"), (2.0, 1.82, "F3")),
        ((0.0, 1.86, "E3"), (2.0, 1.24, "C#3")),
        ((0.0, 1.86, "D3"), (2.0, 1.82, "A3")),
        ((0.0, 1.86, "A#3"), (2.0, 1.82, "F3")),
        ((0.0, 1.86, "E3"), (2.0, 1.24, "C#3")),
        ((0.0, 3.62, "D3"),),
    )
    song = ReorchestratedSong("05 · 하린이 가장 두려워한 것", 96, 24, 4, False)
    for bar, chord_name in enumerate(progression):
        chord, _ = CHORDS[chord_name]
        active_chord = chord if bar < 16 else chord[:1]
        for voice_index, pitch in enumerate(active_chord):
            song.note(
                "room",
                song.bar_beat(bar),
                3.88,
                midi_to_note(note_to_midi(pitch) - 12),
                0.145,
                "cello",
                -0.14 + voice_index * 0.14,
            )
        if bar < 16:
            song.hand_drum(song.bar_beat(bar), 0.27, -0.03, True)
            song.hand_drum(song.bar_beat(bar) + 2.0, 0.18, 0.03, True)
        elif bar < 20:
            song.hand_drum(song.bar_beat(bar), 0.17, 0.0, True)
    add_bass(song, progression, ((0.0, 1.88), (2.0, 1.82)), 0.36)
    add_melody(song, progression, melody, "bassoon", 0.29, {0.0, 2.0})
    audio = song.render_legato(
        {"room": 0.72, "bass": 0.66, "harmony": 0.0, "melody": 0.72, "percussion": 0.44},
        timed_fade=True,
        room_amount=0.1,
    )
    return song, normalize_rms(audio, 0.125), "stage-05-darkened-harin-theme-60s-v11.wav", False


def stage_06() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "F", "F", "Bb", "C", "Dm", "Bb", "Gm", "C",
        "F", "C", "Bb", "C", "F", "F", "Bb", "C",
    )
    # The Harin sentence returns in F major: statement, answer, one peak, statement.
    melody = (
        ((0.0, 1.9, "F5"), (2.0, 1.82, "A5")),
        ((0.0, 1.9, "C6"), (2.0, 1.82, "A5")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "D5")),
        ((0.0, 1.9, "G5"), (2.0, 1.28, "E5")),
        ((0.0, 1.9, "A5"), (2.0, 1.82, "F5")),
        ((0.0, 1.9, "A#5"), (2.0, 1.82, "D6")),
        ((0.0, 1.9, "D6"), (2.0, 1.82, "G5")),
        ((0.0, 1.9, "G5"), (2.0, 1.24, "E5")),
        ((0.0, 1.9, "C6"), (2.0, 1.82, "F6")),
        ((0.0, 1.9, "E6"), (2.0, 1.82, "C6")),
        ((0.0, 1.9, "D6"), (2.0, 1.82, "A#5")),
        ((0.0, 1.9, "G5"), (2.0, 1.28, "E5")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "A5")),
        ((0.0, 1.9, "C6"), (2.0, 1.82, "A5")),
        ((0.0, 1.9, "F5"), (2.0, 1.82, "D5")),
        ((0.0, 1.9, "G5"), (2.0, 1.24, "E5")),
    )
    song = ReorchestratedSong("06 · 하린의 웃음이 남긴 빛", 112, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.16)
        if bar >= 8:
            song.sustained_chord(bar, chord, 0.045, "accordion")
    add_bass(song, progression, ((0.0, 1.88), (2.0, 1.82)), 0.16)
    add_melody(song, progression, melody, HIGH_MELODY_INSTRUMENT, 0.25 * HIGH_MELODY_VELOCITY_SCALE, {0.0, 2.0})
    audio = song.render_legato(
        {"room": 0.54, "bass": 0.3, "harmony": 0.0, "melody": 0.58, "percussion": 0.0},
        room_amount=0.12,
    )
    return song, normalize_rms(audio, 0.095), "stage-06-resolved-harin-theme-loop-v11.wav", True


BUILDERS = (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06)


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
        default=Path("assets/audio/harin-stage-themes-v11"),
    )
    args = parser.parse_args()
    for builder in BUILDERS:
        song, audio, filename, is_loop = builder()
        write_wav(args.output_dir / filename, audio)
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\t"
            f"rms={float(np.sqrt(np.mean(audio * audio))):.4f}\t"
            f"boundary={float(np.max(np.abs(audio[0] - audio[-1]))):.6f}"
        )


if __name__ == "__main__":
    main()
