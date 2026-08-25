#!/usr/bin/env python3
"""Generate v10 Harin themes with manually authored, non-zigzag melodic arcs."""

from __future__ import annotations

import argparse
import sys
import wave
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
from generate_harin_stage_themes_v4 import (  # noqa: E402
    SAMPLE_RATE,
    CHORDS,
    midi_to_note,
    note_to_midi,
)
from generate_harin_stage_themes_v6 import normalize_rms  # noqa: E402
from generate_harin_stage_themes_v7 import (  # noqa: E402
    ReorchestratedSong,
    guitar_chord,
)


def validate_melody(progression, melody_bars) -> None:
    if len(progression) != len(melody_bars):
        raise ValueError("Progression and melody must contain the same number of bars")
    for bar, (chord_name, events) in enumerate(zip(progression, melody_bars)):
        chord, _ = CHORDS[chord_name]
        chord_classes = {note_to_midi(pitch) % 12 for pitch in chord}
        for _, _, pitch in events:
            if note_to_midi(pitch) % 12 not in chord_classes:
                raise ValueError(
                    f"Bar {bar + 1}: {pitch} is not a chord tone of {chord_name}"
                )


def add_manual_melody(
    song: ReorchestratedSong,
    progression,
    melody_bars,
    instrument_for_bar,
    velocity: float,
    bus_for_bar=None,
) -> None:
    validate_melody(progression, melody_bars)
    for bar, events in enumerate(melody_bars):
        section = bar // 4
        for event_index, (offset, duration, pitch) in enumerate(events):
            song.note(
                bus_for_bar(bar) if bus_for_bar else "melody",
                song.bar_beat(bar) + offset,
                duration,
                pitch,
                velocity * (1.0 + section * 0.025),
                instrument_for_bar(bar),
                -0.06 + event_index * 0.06,
            )


def add_fixed_bass(song: ReorchestratedSong, progression, hits, velocity: float) -> None:
    for bar, chord_name in enumerate(progression):
        song.bass(bar, chord_name, hits, velocity)


def stage_01() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Bb", "F", "C",
        "Dm", "Bb", "F", "C",
        "Gm", "Bb", "F", "C",
        "Dm", "Bb", "Gm", "A",
    )
    melody = (
        ((0.0, 1.98, "D5"), (2.0, 0.98, "F5"), (3.0, 0.94, "A5")),
        ((0.0, 1.98, "A#5"), (2.0, 1.94, "F5")),
        ((0.0, 0.98, "A5"), (1.0, 1.98, "C6"), (3.0, 0.94, "A5")),
        ((0.0, 1.98, "G5"), (2.0, 1.94, "E5")),
        ((0.0, 0.98, "A4"), (1.0, 0.98, "D5"), (2.0, 1.94, "F5")),
        ((0.0, 0.98, "F5"), (1.0, 0.98, "A#5"), (2.0, 1.94, "D6")),
        ((0.0, 1.98, "C6"), (2.0, 0.98, "A5"), (3.0, 0.94, "F5")),
        ((0.0, 2.98, "E5"), (3.0, 0.94, "G5")),
        ((0.0, 0.98, "G5"), (1.0, 0.98, "G5"), (2.0, 1.94, "A#5")),
        ((0.0, 1.98, "D6"), (2.0, 1.94, "A#5")),
        ((0.0, 2.98, "A5"), (3.0, 0.94, "C6")),
        ((0.0, 0.98, "G5"), (1.0, 0.98, "E5"), (2.0, 1.94, "C5")),
        ((0.0, 0.98, "D5"), (1.0, 0.98, "F5"), (2.0, 1.94, "A5")),
        ((0.0, 2.98, "A#5"), (3.0, 0.94, "D6")),
        ((0.0, 0.98, "D6"), (1.0, 0.98, "A#5"), (2.0, 1.94, "G5")),
        ((0.0, 1.98, "E5"), (2.0, 0.98, "C#5"), (3.0, 0.94, "A4")),
    )
    song = ReorchestratedSong("01 · 첫 접속", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.24 + 0.01 * (bar // 4))
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.27)
    add_manual_melody(song, progression, melody, lambda bar: "clarinet", 0.34)
    audio = song.render_legato({"room": 0.7, "bass": 0.48, "harmony": 0.0, "melody": 0.7, "percussion": 0.0}, room_amount=0.11)
    return song, normalize_rms(audio, 0.125), "stage-01-manual-arc-loop-v10.wav", True


def stage_02() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "C", "Bb", "A",
        "Dm", "C", "Gm", "A",
        "F", "C", "Dm", "Bb",
        "Gm", "C", "Bb", "A",
    )
    notes = (
        ("D5", "F5"), ("G5", "G5"), ("A#5", "D6"), ("C#6", "A5"),
        ("A5", "F5"), ("E5", "G5"), ("A#5", "D6"), ("E6", "E6"),
        ("C6", "A5"), ("G5", "E5"), ("D5", "A5"), ("A#5", "A#5"),
        ("G5", "A#5"), ("C6", "G5"), ("F5", "D5"), ("E5", "C#5"),
    )
    melody = tuple(
        ((0.0, 2.02, first), (2.0, 1.94, second))
        for first, second in notes
    )
    song = ReorchestratedSong("02 · 상상력의 첫걸음", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.22 + 0.01 * (bar // 4))
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.27)
    add_manual_melody(song, progression, melody, lambda bar: "clarinet", 0.32)
    audio = song.render_legato({"room": 0.68, "bass": 0.48, "harmony": 0.0, "melody": 0.68, "percussion": 0.0}, room_amount=0.1)
    return song, normalize_rms(audio, 0.12), "stage-02-manual-arc-loop-v10.wav", True


def stage_03() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = ("Dm", "Gm", "Bb", "A") * 4
    note_rows = (
        ("D4", "A4", "F4"), ("G4", "G4", "A#4"), ("D5", "A#4", "F4"), ("E4", "A4", "C#5"),
        ("A4", "D5", "D5"), ("A#4", "D5", "G5"), ("F5", "D5", "A#4"), ("A4", "E5", "E5"),
        ("F5", "A5", "D6"), ("D6", "A#5", "G5"), ("F5", "F5", "D5"), ("C#5", "A4", "E5"),
        ("D5", "F5", "A5"), ("A#5", "G5", "D5"), ("F5", "D5", "D5"), ("E5", "C#5", "A4"),
    )
    melody = tuple(
        ((0.0, 1.52, a), (1.5, 1.52, b), (3.0, 0.94, c))
        for a, b, c in note_rows
    )
    song = ReorchestratedSong("03 · 달빛 유원지의 벽", 128, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.2)
        song.hand_drum(song.bar_beat(bar), 0.2, -0.04, True)
        song.hand_drum(song.bar_beat(bar) + 1.5, 0.13, 0.04, False)
        song.hand_drum(song.bar_beat(bar) + 3.0, 0.12, 0.0, False)
    add_fixed_bass(song, progression, ((0.0, 1.48), (1.5, 1.48), (3.0, 0.94)), 0.31)
    add_manual_melody(song, progression, melody, lambda bar: "cello", 0.3)
    audio = song.render_legato({"room": 0.64, "bass": 0.54, "harmony": 0.0, "melody": 0.66, "percussion": 0.3}, room_amount=0.09)
    return song, normalize_rms(audio, 0.125), "stage-03-manual-arc-332-loop-v10.wav", True


def stage_04() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "A", "Dm", "Bb", "F", "C", "Gm", "A",
        "Dm", "A", "Bb", "F", "Gm", "Dm", "Bb", "A",
        "Dm", "Bb", "Gm", "A",
    )
    note_rows = (
        ("D5", "F5", "A5"), ("A5", "E5", "C#5"), ("F5", "F5", "A5"), ("A#5", "D6", "F6"),
        ("C6", "A5", "F5"), ("E5", "G5", "C6"), ("D6", "A#5", "G5"), ("E5", "E5", "A5"),
        ("A5", "F5", "D5"), ("C#5", "E5", "A5"), ("A#5", "A#5", "D6"), ("C6", "A5", "A5"),
        ("G5", "A#5", "D6"), ("A5", "F5", "D5"), ("F5", "A#5", "D6"), ("E6", "C#6", "A5"),
        ("D5", "A5", "D6"), ("F6", "D6", "A#5"), ("G5", "D5", "G5"), ("E5", "C#5", "A4"),
    )
    melody = tuple(
        ((0.0, 1.02, a), (1.0, 1.02, b), (2.0, 0.94, c))
        for a, b, c in note_rows
    )
    song = ReorchestratedSong("04 · 무너지는 회전목마", 120, 20, 3, True)
    for bar, chord in enumerate(progression):
        song.sustained_chord(bar, chord, 0.12, "accordion")
        guitar_chord(song, bar, chord, 0.16)
        song.bass(bar, chord, ((0.0, 2.86),), 0.24)
    add_manual_melody(song, progression, melody, lambda bar: "clarinet", 0.28)
    audio = song.render_legato({"room": 0.42, "bass": 0.44, "harmony": 0.0, "melody": 0.62, "percussion": 0.0}, room_amount=0.11)
    return song, normalize_rms(audio, 0.115), "stage-04-manual-arc-waltz-loop-v10.wav", True


def stage_05() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "Dm", "Dm", "Eb", "A", "Dm", "Bb", "Gm", "A",
        "Dm", "Eb", "Bb", "A", "Dm", "Gm", "Eb", "A",
        "Dm", "Eb", "Gm", "A", "Dm", "Bb", "A", "Dm",
    )
    notes = (
        ("D3", "A3"), ("F3", "F3"), ("G3", "A#3"), ("C#4", "A3"),
        ("A3", "F3"), ("A#3", "D4"), ("D4", "G3"), ("E3", "A3"),
        ("D4", "A3"), ("A#3", "G3"), ("F3", "A#3"), ("C#4", "E4"),
        ("A3", "D4"), ("A#3", "D4"), ("G4", "A#3"), ("A3", "E3"),
        ("F3", "A3"), ("A#3", "G4"), ("G3", "D4"), ("E4", "C#4"),
        ("D4", "F4"), ("F4", "D4"), ("C#4", "A3"), ("F3", "D3"),
    )
    melody = tuple(
        ((0.0, 2.02, first), (2.0, 1.94, second))
        for first, second in notes
    )
    song = ReorchestratedSong("05 · 하린이 가장 두려워한 것", 96, 24, 4, False)
    for bar, chord_name in enumerate(progression):
        chord, _ = CHORDS[chord_name]
        phase = bar // 4
        for voice_index, pitch in enumerate(chord):
            song.note("room", song.bar_beat(bar), 3.94, midi_to_note(note_to_midi(pitch) - 12), 0.16 + min(phase, 3) * 0.008, "cello", -0.15 + voice_index * 0.15)
            song.note("room", song.bar_beat(bar), 3.9, pitch, 0.11, "cello", -0.1 + voice_index * 0.1)
        song.hand_drum(song.bar_beat(bar), 0.32, -0.04, True)
        song.hand_drum(song.bar_beat(bar) + 2.0, 0.22, 0.04, True)
    add_fixed_bass(song, progression, ((0.0, 1.94), (2.0, 1.9)), 0.38)
    add_manual_melody(song, progression, melody, lambda bar: "bassoon", 0.3)
    audio = song.render_legato({"room": 0.74, "bass": 0.68, "harmony": 0.0, "melody": 0.72, "percussion": 0.48}, timed_fade=True, room_amount=0.11)
    return song, normalize_rms(audio, 0.13), "stage-05-manual-arc-heavy-60s-v10.wav", False


def stage_06() -> tuple[ReorchestratedSong, np.ndarray, str, bool]:
    progression = (
        "F", "C", "Dm", "Bb", "Gm", "C", "F", "C",
        "F", "Dm", "Bb", "Gm", "F", "Bb", "Gm", "C",
    )
    notes = (
        ("F5", "A5"), ("G5", "G5"), ("A5", "D6"), ("F6", "D6"),
        ("A#5", "G5"), ("E5", "C5"), ("A4", "C5"), ("E5", "G5"),
        ("C6", "A5"), ("F5", "A5"), ("A#5", "D6"), ("D6", "A#5"),
        ("A5", "F5"), ("D5", "F5"), ("G5", "D5"), ("E5", "C5"),
    )
    melody = tuple(
        ((0.0, 2.02, first), (2.0, 1.94, second))
        for first, second in notes
    )
    song = ReorchestratedSong("06 · 하린의 웃음이 남긴 빛", 120, 16, 4, True)
    for bar, chord in enumerate(progression):
        guitar_chord(song, bar, chord, 0.17)
    add_fixed_bass(song, progression, ((0.0, 1.92), (2.0, 1.88)), 0.17)
    add_manual_melody(song, progression, melody, lambda bar: "clarinet", 0.25)
    audio = song.render_legato({"room": 0.58, "bass": 0.32, "harmony": 0.0, "melody": 0.56, "percussion": 0.0}, room_amount=0.13)
    return song, normalize_rms(audio, 0.1), "stage-06-manual-arc-loop-v10.wav", True


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
        default=Path("assets/audio/harin-stage-themes-v10"),
    )
    args = parser.parse_args()
    for builder in (stage_01, stage_02, stage_03, stage_04, stage_05, stage_06):
        song, audio, filename, is_loop = builder()
        output = args.output_dir / filename
        write_wav(output, audio)
        print(
            f"{filename}\t{audio.shape[0] / SAMPLE_RATE:.3f}s\t"
            f"{'LOOP' if is_loop else 'TIMED'}\t"
            f"rms={float(np.sqrt(np.mean(audio * audio))):.4f}\t"
            f"boundary={float(np.max(np.abs(audio[0] - audio[-1]))):.6f}"
        )


if __name__ == "__main__":
    main()
